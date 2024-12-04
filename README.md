# GitHub Extension

A GitHub extension to track if a similar issue exists, or if a pull request is similar to an existing issue. 

# Notes 

## Overview 

The `manifest.json` grants access to the active tab and runs `background.js` in the background. `content.js` scans the issue titles and suggests similar issues. Matches occur when making a new PR or new issue. 

## About `background.js` 

`background.js` handles the API call to HuggingFace (the ML language model for semantic matching of sentences or phrases). The API call is placed in this file (as opposed to in `content.js`) so that the user's access token is not exposed. Note that the best practice would be to use implement a backend, where API calls are made. 

## Current implementation 

The current implementation does not contain a backend. The API call to HuggingFace is made in `background.js`, and the (public) API call to GitHub is made in `content.js`. This is not the ideal structure, but ensures that the extension can be run all on client-side. That is, clients can manage their own API keys and interract with the API service based on personal needs. 

Upon opening a new issues or PR page, the extension retrieves all issues in the current repo and caches them locally. All title inputs and similarity searched will be based on these cached issues. Note that this means if a new issue is submitted while the user is on a new issues page, it will not be considered in the similarity search. The cache for these issues is cleared upon exiting the new issues or PR page. 

An improved implementation would be to retrieve the issues upon entering a repo, and clear the cache upon exiting the repo. This implementation would allow for a faster response, as seen by the client. However, due to limitations in public API usage, the current implementation does not use this method. 

## Other notes 

Previous implementations of this extension can be found in the `unused_search_algorithm` folder. 

# Future considerations 

Considerations for implementing search algorithms: 
- Elasticsearch: https://www.elastic.co/elasticsearch (RESTful search engine built on top of Lucene, provides user-friendly UI, can be integrated with various languages)
- Apache Lucene: https://lucene.apache.org/ (Java-centric)
- Tensorflow: https://js.tensorflow.org/api/latest/ (ML library for JavaScript, supports Universal Sentence Encoder) 
- HuggingFace: https://medium.com/neural-engineer/sentence-similarity-and-semantic-search-d6995c5e368a (Used in current implementation)

- Consider the issue description (instead of just title). 
- Extend to work for private repos. Currently only works for public repos. This would involve using a private API key for Github to authenticate access for retrieving information on issues.  

# TODO 

- Current implementation using HuggingFace API has a limit of 1000 calls per day. To reduce API usage, implement some type of pre-filtering before making API call to compare phrases. 

# Known Bugs 

- Upon entering a new issues page, the title is not in focus, and the API calls are not made so the extension is non-responsive. If this happens, refresh the new issues page and begin typing a title. 
