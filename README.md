# GitHub Extension

A GitHub extension to track if a similar issue exists, or if a pull request is similar to an existing issue. 

# Notes 

The `manifest.json` grants access to the active tab and runs `background.js` in the background. `content.js` scans the issue titles and suggests similar issues. Matches occur when making a new PR or new issue. 

`background.js` logs a message when the extension is installed. Can be used (later) to handle any API calls. 

# Future considerations 

- Use more complex language model to determine if two titles are similar. 
- Consider the issue description (instead of just title). 
- Allow for selection of the issue directly through the extension. 
- Extend to work for private repos. Currently only works for public repos. 
