# Discord Message Remover
This script searches and deletes all of your messages in the discord server you are currently in.

## Notes
- This scripts deletes all messages in all channels in the server you have selected at the moment you start the script.
- This script cannot delete direct messages, only messages that were posted in public channels.
- Its not possible to specify a specific channel to delete messages for.
- By default its doing 1 delete request per second. You can tweak the timeBetweenDeletions variable
  to make it go faster though this might make discords rate limiter kick in sooner.
- If the rate limiter kicks in you have to wait a few minutes or hours and re-run the script.
- I only tested this script in chrome version 79.

## Instructions
1. Login to the web version of discord.
2. Select the server of which you want to remove all your messages.
3. Open up the javascript console of the browser tab in which you have discord open.
4. Copy the script, paste it in the javascript console and press enter.
5. You can see if the script is succesfully deleting messages by looking at the javascript console.
6. Make sure while messages are being deleted you do not close the page, go offline or logout.
7. Done!
