# GitHub Extension

A GitHub extension to track if a similar issue exists, or if a pull request is similar to an existing issue. 

# Notes 

The `manifest.json` grants access to the active tab and runs `background.js` in the background. `content.js` scans the issue titles and suggests similar issues. Matches occur when making a new PR or new issue. 

`background.js` logs a message when the extension is installed. Can be used (later) to handle any API calls. 


