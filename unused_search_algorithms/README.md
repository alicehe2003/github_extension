# UNUSED Search Algorithms 

This folder contains previous implementations of search algorithms that are NOT in use. 

# search_by_synonyms.js 

This is the initial implementation. It searches for similar issues by looking at the exact title words (not including filler words like "a", "the", etc.), as well as its synonyms. It then displays 5 of the issues with titles containing any of these words or its synonyms, and displays them in no particular order. 

Used `https://www.datamuse.com/api/` to search for synonyms. 

This implementation only considers individual words and does not consider sentence semantics, hence the accuracy is low. 

# HuggingFace_API 

Contains the implementation for title searching by making an API call to HuggingFace. Users must input their own API key. There is a limit of 1000 calls per day. 

HuggingFace: https://medium.com/neural-engineer/sentence-similarity-and-semantic-search-d6995c5e368a 

This implementation has a higher accuracy as it uses a pre-trained semantic search model. The API calls are costly, and are limited. It is unknown how much latency is caused by these API calls. 

`background.js` handles the API call to HuggingFace (the ML language model for semantic matching of sentences or phrases). The API call is placed in this file (as opposed to in `content.js`) so that the user's access token is not exposed. Note that the best practice would be to use implement a backend, where API calls are made. 
