# GitHub Extension

A GitHub extension to track if a similar issue exists, or if a pull request is similar to an existing issue. 

# Notes 

The `manifest.json` grants access to the active tab and runs `background.js` in the background. `content.js` scans the issue titles and suggests similar issues. Matches occur when making a new PR or new issue. 

`background.js` logs a message when the extension is installed. Can be used (later) to handle any API calls. 

Used `https://www.datamuse.com/api/` to search for synonyms. Issues with titles that are similar to given title are also displayed. 

Considerations for implementing search algorithms: 
- Elasticsearch: https://www.elastic.co/elasticsearch (RESTful search engine built on top of Lucene, provides user-friendly UI, can be integrated with various languages)
- Apache Lucene: https://lucene.apache.org/ (Java-centric)
- Tensorflow: https://js.tensorflow.org/api/latest/ (ML library for JavaScript, supports Universal Sentence Encoder) 
- HuggingFace: https://medium.com/neural-engineer/sentence-similarity-and-semantic-search-d6995c5e368a 

# Future considerations 

- Use more complex language model to determine if two titles are similar. 
- Consider the issue description (instead of just title). 
- Extend to work for private repos. Currently only works for public repos. 
- Currently only displays first 5. Consider sorting list by relevance to display most relevant. 

# TODO 

- Edit GitHub API call such it issue descriptions are also considered. 
- Come up with some algorithm to determine "relevance" of results. Rank them and show top 5(ish)? 
- Extend to use AI to show "best" results. 
