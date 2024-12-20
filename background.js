// Configuration for HuggingFace API
const HUGGINGFACE_API_ENDPOINT = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HUGGINGFACE_API_KEY = 'YOUR_API_KEY'; 

// Function to calculate cosine similarity between two embeddings
function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);

    if (request.action === 'fetchSentenceSimilarity') {
        // Log the details of the request
        console.log('New Issue Title:', request.newIssueTitle);
        console.log('Existing Issues:', request.existingIssues.map(issue => issue.title));

        // Fetch embeddings for all sentences
        fetchSentenceEmbeddings(request.newIssueTitle, request.existingIssues)
            .then(similarities => {
                console.log('Background script sending similarities:', similarities);
                sendResponse({
                    similarities: similarities
                });
            })
            .catch(error => {
                console.error('Error in background script:', error);
                sendResponse({ 
                    error: error.toString(),
                    stack: error.stack 
                });
            });
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});

// Function to fetch embeddings from HuggingFace
async function fetchSentenceEmbeddings(newIssueTitle, existingIssues) {
    console.log('Fetching sentence embeddings for:', newIssueTitle);
    console.log('Number of existing issues:', existingIssues.length);

    // Add a check to prevent API call with empty input
    if (!newIssueTitle || existingIssues.length === 0) {
        console.log('No title or existing issues to process');
        return [];
    }

    try {
        console.log('Sending request to HuggingFace API');
        const response = await fetch(HUGGINGFACE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    source_sentence: newIssueTitle,
                    sentences: existingIssues.map(issue => issue.title)
                }
            })
        });

        console.log('HuggingFace API response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('HuggingFace API error body:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const similarities = await response.json();
        console.log('Received raw similarities:', similarities);

        // More detailed logging and processing
        const processedSimilarities = similarities.map((similarity, index) => {
            console.log(`Similarity for issue #${existingIssues[index].number}: ${similarity}`);
            return {
                issue: existingIssues[index],
                similarity: similarity
            };
        })
        .filter(item => item.similarity > 0.1)          // Filter for similarity rate
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);                                   // Take top 5

        console.log('Processed similarities:', processedSimilarities);
        return processedSimilarities;

    } catch (error) {
        console.error('Detailed error in fetchSentenceEmbeddings:', error);
        throw error;
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("GitHub Similar Issue Extension Installed");
});
