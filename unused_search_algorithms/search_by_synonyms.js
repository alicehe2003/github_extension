/*
console.log("Track similar issues on GitHub - extension running.");

const fillerWords = ["a", "an", "the", "of", "and", "or", "for", "to", "in"];

// Function to fetch synonyms using Datamuse API
async function fetchSynonyms(word) {
    // console.log("Finding similar words to " + word); 

    const apiUrl = `https://api.datamuse.com/words?rel_syn=${word}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Error fetching synonyms: ${response.status}`);
        const data = await response.json();
        
        // console.log(data); 

        // Extract words from the list of word objects
        const synonyms = data.map(entry => entry.word);

        // Log each retrieved word
        // synonyms.forEach(synonym => {
        //     console.log(`Retrieved synonym: ${synonym}`);
        // });

        return synonyms; 
    } catch (error) {
        console.error(error);
        // Return an empty array on error
        return []; 
    }
}

// Function to check if we're on a new issue or new PR page
function isNewIssuePage() {
    const currentPath = window.location.pathname;
    const newIssueRegex = /^\/[^/]+\/[^/]+\/(issues\/new|pull\/new|compare)$/;
    return newIssueRegex.test(currentPath);
}

// Function to get repository details (owner and repo name) from the GitHub page URL
// URL assumed to be github.com/{owner}/{repo name}
function getRepoDetails() {
    const pathSegments = window.location.pathname.split('/');
    const owner = pathSegments[1]; // The owner of the repo 
    const repo = pathSegments[2];  // The repository name 
    return { owner, repo };
}

// Function to fetch all issues based on the repo owner and repo name
async function fetchIssues(owner, repo, newIssueTitle) {
    const baseApiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    let allIssues = [];
    let page = 1;
    const perPage = 100; // Maximum allowed by GitHub API per page

    try {
        console.log(`Fetching issues for repository: ${owner}/${repo}`);

        while (true) {
            const apiUrl = `${baseApiUrl}?state=open&page=${page}&per_page=${perPage}`;
            
            console.log(`Fetching page ${page}...`);
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const issues = await response.json();
            
            // If no more issues, break the loop
            if (issues.length === 0) {
                break;
            }

            // Append this page's issues to the total list
            allIssues = allIssues.concat(issues);
            
            // If we got fewer issues than the per_page value, we've reached the last page
            if (issues.length < perPage) {
                break;
            }
            
            // Move to next page
            page++;
        }

        console.log(`Total open issues found: ${allIssues.length}`);
        
        // Log details of every single issue
        console.log("All Open Issues:");
        allIssues.forEach((issue, index) => {
            console.log(`Issue #${index + 1}:`, {
                number: issue.number,
                title: issue.title,
                state: issue.state,
                created_at: issue.created_at,
                url: issue.html_url
            });
        });
        
        const similarIssues = await findSimilarIssues(newIssueTitle, allIssues);
        
        console.log(`Number of similar issues found: ${similarIssues.length}`);
        displaySimilarIssues(similarIssues);
    } catch (error) {
        console.error('Error fetching issues:', error);
    }
}

// Function to find similar issues based on keywords in the title
async function findSimilarIssues(newTitle, existingIssues) {
    console.log("Finding similar issues..."); 

    const cleanTitle = (title) => title
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !fillerWords.includes(word));

    const titleWords = cleanTitle(newTitle);
    
    // Create a map to store original words and their synonyms
    const keywordMap = new Map();

    // Process each word to get its synonyms
    for (const word of titleWords) {
        try {
            // Fetch synonyms for each word
            const synonyms = await fetchSynonyms(word);
            
            // Store the original word along with its synonyms
            keywordMap.set(word, [word, ...synonyms]);
        } catch (error) {
            console.error(`Error fetching synonyms for ${word}:`, error);
            // If synonym fetching fails, just use the original word
            keywordMap.set(word, [word]);
        }
    }

    // Flatten the keywords, ensuring each original word and its synonyms are included
    const allKeywords = new Set(
        Array.from(keywordMap.values()).flat()
    );

    // Filter issues based on the expanded keyword set
    return existingIssues.filter(issue => {
        const issueWords = new Set(cleanTitle(issue.title));
        return [...allKeywords].some(word => issueWords.has(word));
    });
}

// Function to display similar issues to the user
function displaySimilarIssues(issues) {

    // Remove any existing suggestions container
    const existingContainer = document.querySelector('.similar-issues-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Updated selector to work on both issues and PRs
    const issueTitleField = document.querySelector(
        'input[name="issue[title]"],' +   // New issue page
        '#issue_title,' +                 // Issue edit page
        'input[name="pull_request[title]"],' + // New PR page
        'input[placeholder="Title"]'      // New issue/PR page (alternative)
    );

    if (!issueTitleField) return;

    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.classList.add('similar-issues-container');

    // Create suggestions div
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.classList.add('similar-issues-suggestions');

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'x';
    closeButton.classList.add('similar-issues-close-btn');
    
    // Add click event to close button
    closeButton.addEventListener('click', () => {
        suggestionsContainer.remove();
    });

    // Append close button to container
    suggestionsContainer.appendChild(closeButton);

    // Append suggestions div to container
    suggestionsContainer.appendChild(suggestionsDiv);

    if (issues.length === 0) {
        suggestionsDiv.innerHTML = '<p>No similar issues found.</p>';
    } else {
        // Create header
        const headerElement = document.createElement('h3');
        headerElement.textContent = 'Similar Existing Issues:';
        suggestionsDiv.appendChild(headerElement);

        // Create list of similar issues, take first 5
        issues.slice(0, 5).forEach((issue, index) => {
            const issueElement = document.createElement('div');
            
            const issueLink = document.createElement('a');
            issueLink.href = issue.html_url;
            issueLink.target = "_blank";
            issueLink.textContent = `#${issue.number}: ${issue.title}`;
            
            issueElement.appendChild(issueLink);
            suggestionsDiv.appendChild(issueElement);
        });
    }

    // Insert the container right after the title input field
    issueTitleField.parentNode.insertBefore(suggestionsContainer, issueTitleField.nextSibling);
}

// Function to initialize the listener
function initializeIssueListener() {
    // Only process if on new issue or new PR page 
    if (!isNewIssuePage()) {
        return; 
    }

    // Multiple selectors for different GitHub page contexts
    const issueTitleField = document.querySelector(
        'input[name="issue[title]"],' +         // New issue page
        '#issue_title,' +                       // Issue edit page
        'input[name="pull_request[title]"],' +  // New PR page
        'input[placeholder="Title"]'            // New issue/PR page
    );

    if (issueTitleField) {

        // Prevent default select behaviour 
        issueTitleField.addEventListener('focus', (event) => {
            event.target.setSelectionRange(0, 0); 
        }); 

        issueTitleField.addEventListener('input', debounce((event) => {
            const newTitle = event.target.value.trim();

            // Remove any existing suggestions when input is cleared
            if (newTitle.length === 0) {
                const existingContainer = document.querySelector('.similar-issues-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
                return;
            }

            if (newTitle.length > 3) { 
                try {
                    const { owner, repo } = getRepoDetails();
                    fetchIssues(owner, repo, newTitle);
                } catch (error) {
                    console.error('Error getting repo details:', error);
                }
            }
        }, 500));  // 500ms debounce to prevent too many API calls
    } 
}

// Debounce utility function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Use MutationObserver to ensure script runs on dynamic GitHub pages
function initializeExtension() {
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length) {
                initializeIssueListener();
                break;
            }
        }
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });

    // Initial attempt
    initializeIssueListener();
}

// Start the extension
initializeExtension();
*/ 
