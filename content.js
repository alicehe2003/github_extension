console.log("Track similar issues on GitHub - extension running.");

// Function to check if we're on a new issue or new PR page
function isNewIssuePage() {
    const currentPath = window.location.pathname;
    const newIssueRegex = /^\/[^/]+\/[^/]+\/(issues\/new|pull\/new|compare)$/;
    return newIssueRegex.test(currentPath);
}

// Function to get repository details (owner and repo name) from the GitHub page URL
function getRepoDetails() {
    const pathSegments = window.location.pathname.split('/');
    const owner = pathSegments[1]; // The owner of the repo 
    const repo = pathSegments[2];  // The repository name 
    return { owner, repo };
}

// Function to fetch all issues based on the repo owner and repo name
async function fetchIssues(owner, repo) {
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
            console.log(`Page ${page} response status:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}`, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const issues = await response.json();
            
            console.log(`Page ${page} issues count:`, issues.length);

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
        
        return allIssues;
    } catch (error) {
        console.error('Detailed error in fetchIssues:', error);
        return [];
    }
}

// Global variable to store issues and prevent repeated fetching
let cachedIssues = null;

// Function to display similar issues to the user
function displaySimilarIssues(issues) {
    console.log('Displaying similar issues:', issues);

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

    if (!issueTitleField) {
        console.log('No issue title field found');
        return;
    }

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

        // List similar issues, top 5
        issues.forEach(item => {
            const issueElement = document.createElement('div');
            
            const issueLink = document.createElement('a');
            issueLink.href = item.issue.html_url;
            issueLink.target = "_blank";
            issueLink.textContent = `(${(item.similarity * 100).toFixed(2)}%) #${item.issue.number}: ${item.issue.title}`;
            
            issueElement.appendChild(issueLink);
            suggestionsDiv.appendChild(issueElement);
        });
    }

    // Insert the container right after the title input field
    issueTitleField.parentNode.insertBefore(suggestionsContainer, issueTitleField.nextSibling);
}

// Debounce utility function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to initialize the listener
function initializeIssueListener() {
    // Only process if on new issue or new PR page 
    if (!isNewIssuePage()) {
        console.log('Not on a new issue or PR page');
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

        issueTitleField.addEventListener('input', debounce(async (event) => {
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
                    // Fetch issues only once
                    if (!cachedIssues) {
                        const { owner, repo } = getRepoDetails();
                        console.log('Fetching issues for:', owner, repo);
                        cachedIssues = await fetchIssues(owner, repo);
                    }

                    console.log('Sending message to background script');
                    // Request semantic similarity from background script
                    chrome.runtime.sendMessage({
                        action: 'fetchSentenceSimilarity',
                        newIssueTitle: newTitle,
                        existingIssues: cachedIssues
                    }, (response) => {
                        console.log('Received response from background script:', response);
                        
                        if (response.similarities) {
                            displaySimilarIssues(response.similarities);
                        } else if (response.error) {
                            console.error('Error from background script:', response.error);
                            console.error('Error stack:', response.stack);
                        }
                    });

                } catch (error) {
                    console.error('Detailed error processing issues:', error);
                }
            }
        }, 500));  // 500ms debounce to prevent too many API calls
    } else {
        console.log('No issue title field found');
    }
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
