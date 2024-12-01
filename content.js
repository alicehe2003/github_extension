console.log("Content script running");

// Function to get repository details (owner and repo name) from the GitHub page URL
function getRepoDetails() {
    const pathSegments = window.location.pathname.split('/');
    const owner = pathSegments[1]; // The owner of the repo (e.g., 'octocat')
    const repo = pathSegments[2];  // The repository name (e.g., 'Hello-World')
    return { owner, repo };
}

// Function to fetch issues based on the repo owner and repo name
function fetchIssues(owner, repo, newIssueTitle) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open`;

    fetch(apiUrl)
    .then(response => response.json())
    .then(issues => {
        console.log('Issues fetched:', issues);
        
        const similarIssues = findSimilarIssues(newIssueTitle, issues);
        console.log('Similar issues:', similarIssues);
        
        displaySimilarIssues(similarIssues);
    })
    .catch(error => console.error('Error fetching issues:', error));
}

// Function to find similar issues based on keywords in the title
function findSimilarIssues(newTitle, existingIssues) {
    const fillerWords = ["a", "an", "the", "of", "and", "or", "for", "to", "in"];
    
    const cleanTitle = (title) => title
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !fillerWords.includes(word))
        .join(" ");

    const newTitleCleaned = cleanTitle(newTitle);

    return existingIssues.filter(issue => {
        const existingTitleCleaned = cleanTitle(issue.title);
        // More robust similarity check
        return newTitleCleaned.split(' ').some(word => 
            existingTitleCleaned.includes(word) && word.length > 2
        );
    });
}

// Function to display similar issues to the user
function displaySimilarIssues(issues) {
    console.log('Displaying similar issues - Total issues:', issues.length);
    
    // Create or find suggestions container with very explicit positioning
    let suggestionsContainer = document.querySelector('.similar-issues-suggestions');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.classList.add('similar-issues-suggestions');
        suggestionsContainer.style.cssText = `
            position: absolute;
            top: 100px;  /* Adjust as needed */
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 600px;
            background-color: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 15px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
    }

    // Ensure container is in the document
    if (!suggestionsContainer.parentElement) {
        document.body.appendChild(suggestionsContainer);
    }

    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';

    // Debug logging
    console.log('Suggestions container created/found:', suggestionsContainer);

    if (issues.length === 0) {
        suggestionsContainer.innerHTML = '<p style="color: #586069;">No similar issues found.</p>';
        return;
    }

    // Create header
    const headerElement = document.createElement('h3');
    headerElement.textContent = 'Similar Existing Issues:';
    headerElement.style.cssText = `
        color: #24292e;
        margin-bottom: 10px;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 5px;
    `;
    suggestionsContainer.appendChild(headerElement);

    // Create list of similar issues
    issues.slice(0, 5).forEach((issue, index) => {
        const issueElement = document.createElement('div');
        issueElement.style.cssText = `
            margin-bottom: 10px;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid #e1e4e8;
        `;
        
        const issueLink = document.createElement('a');
        issueLink.href = issue.html_url;
        issueLink.target = "_blank";
        issueLink.textContent = `#${issue.number}: ${issue.title}`;
        issueLink.style.cssText = `
            color: #0366d6;
            text-decoration: none;
            font-weight: 600;
        `;
        
        issueElement.appendChild(issueLink);
        suggestionsContainer.appendChild(issueElement);

        // Debug logging for each issue
        console.log(`Similar Issue ${index + 1}:`, {
            number: issue.number,
            title: issue.title,
            url: issue.html_url
        });
    });

    // Final debug log
    console.log('Suggestions container final HTML:', suggestionsContainer.innerHTML);
}

// Function to initialize the listener
function initializeIssueListener() {
    const issueTitleField = document.querySelector('input[name="issue[title]"], #issue_title');
    
    if (issueTitleField) {
        issueTitleField.addEventListener('input', debounce((event) => {
            const newTitle = event.target.value.trim();

            if (newTitle.length > 3) {  // Only search if title is substantial
                try {
                    const { owner, repo } = getRepoDetails();
                    fetchIssues(owner, repo, newTitle);
                } catch (error) {
                    console.error('Error getting repo details:', error);
                }
            }
        }, 500));  // 500ms debounce to prevent too many API calls
    } else {
        console.error('Issue title input field not found. Retrying in 1 second.');
        setTimeout(initializeIssueListener, 1000);
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
