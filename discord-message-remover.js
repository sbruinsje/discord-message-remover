(async function() {
    const timeBetweenDeletions = 1000; // In ms

    // Get the server/guild ID
    const guildId = getGuildId(); // guild you are current in (guild=server).
    if(!guildId) {
        logEnding('Failed to get the guild/server ID. Make sure you first select a server in discord.');
        return;
    }

    // Get the authentication token.
    const authToken = getAuthToken();
    if(!authToken) {
        logEnding('Failed to get the authToken. Logging out and in again usually resolves this.');
        return;
    }

    // Fetch the current logged in user's authorId
    const authorId = await fetchAuthorId(authToken);
    if(!authorId) {
        logEnding('Failed to fetch authorId: ', error);
        return;
    }

    log(`Server/Guild ID: ${guildId}`);
    log(`Author ID: ${authorId}`);
    log(`Time between each delete request: ${timeBetweenDeletions}ms`);

    // We fetch a batch of messages and delete them, this repeats until there
    // are none left, or until there are 10 deletion attempts in a row that failed.
    let nrOfConsecutiveFailedDeletions = 0;
    while(true) {
        const fetch_result = await fetchUserMessageBatch(guildId, authorId, authToken);
        if(!fetch_result) {
            logEnding('Failed to fetch a batch of the user\'s messages: ', error);
            return;
        }

        const { messages, totalResults } = fetch_result;

        // Note: sometimes the discord api returns totalResult=1 eventhough it doesn't return any messages
        if(!totalResults || !messages.length) {
            logEnding('No more messages to delete');
            return;
        }

        log('Batch of messages to be deleted: ', messages);

        for(message of messages) {
            try {
                await deleteMessage(message, authToken);
                nrOfConsecutiveFailedDeletions = 0;
            } catch(error) {
                nrOfConsecutiveFailedDeletions += 1;
                if(error.status === 429) {
                    logEnding('The ratelimiter kicked in. Wait a few minutes then try running the script again.')
                    return;
                } else if(nrOfConsecutiveFailedDeletions > 5) {
                    logEnding('Too many failed delete requests. Are you still online? Are you still logged in?');
                    return;
                }
            }
            // Wait a bit to prevent the rate limiter from kicking in.
            await new Promise(resolve => { setTimeout(resolve, timeBetweenDeletions); });
        }
    }

    function getGuildId() {
        const hrefParts = window.location.href.split('/');
        return isNaN(hrefParts[4]) ? null : hrefParts[4];
    }

    function getAuthToken() {
        const token = document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token;
        return token ? token.replace(/"/g, "") : null;

    }

    function extractMyMessages(messages, authorId) {
        const myMessages = messages
            .map(messages => messages.filter(message => message.author.id === authorId))
            .flat();
        return uniqBy(myMessages, item => item.id);
    }

    function deleteMessage(message, authToken) {
        const headers = { "Authorization": authToken };
        const deleteUrl = `https://discordapp.com/api/channels/${message.channel_id}/messages/${message.id}`;
        return fetch(deleteUrl, {headers, method: 'DELETE'})
            .then(failIfNotOk)
            .then(() => log('Deleted message: ', message))
            .catch(error => {
                log('Failed to delete message: ', message);
                return Promise.reject(error);
            });
    }

    function fetchUserMessageBatch(guildId, authorId, authToken) {
        const headers = { "Authorization": authToken };
        const fetch_url = `https://discordapp.com/api/v6/guilds/${guildId}/messages/search?author_id=${authorId}&offset=0`;
        return fetch(fetch_url, { headers })
            .then(failIfNotOk)
            .then(resp => resp.json())
            .then(data => ({ messages: extractMyMessages(data.messages, authorId), totalResults: data.total_results }))
            .catch(() => null);
    }

    function fetchAuthorId(authToken) {
        const headers = { "Authorization": authToken };
        return fetch('https://discordapp.com/api/v6/users/@me', { headers })
            .then(failIfNotOk)
            .then(resp => resp.json())
            .then(me => me.id)
            .catch(() => null);
    }

    function uniqBy(a, key) {
        let seen = new Set();
        return a.filter(item => {
            let k = key(item);
            return seen.has(k) ? false : seen.add(k);
        });
    }

    function failIfNotOk(resp) {
        const result = resp.ok ? Promise.resolve(resp) : Promise.reject(resp);
        return result;
    }

    function log(msg, ...rest) {
        console.log(`[DiscordMessageRemover]: ${msg}`, ...rest);
    }

    function logEnding(msg) {
       log(msg);
       log('The end!');
    }
})();
