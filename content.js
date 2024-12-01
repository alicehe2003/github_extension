console.log("Content script running");

// Function to get repository details (owner and repo name) from the GitHub page URL
function getRepoDetails() {
    const pathSegments = window.location.pathname.split('/');
    const owner = pathSegments[1]; // The owner of the repo 
    const repo = pathSegments[2];  // The repository name 
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
    
    // Remove any existing suggestions container
    const existingContainer = document.querySelector('.similar-issues-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Find the issue title input field
    const issueTitleField = document.querySelector(
        'input[name="issue[title]"],' +   // New issue page
        '#issue_title,' +                 // Issue edit page
        'input[placeholder="Title"]'      // New issue page (alternative)
    );

    if (!issueTitleField) return;

    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.classList.add('similar-issues-container');

    // Create suggestions div
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.classList.add('similar-issues-suggestions');

    // Append suggestions div to container
    suggestionsContainer.appendChild(suggestionsDiv);

    // Debug logging
    console.log('Suggestions container created:', suggestionsContainer);

    if (issues.length === 0) {
        suggestionsDiv.innerHTML = '<p>No similar issues found.</p>';
    } else {
        // Create header
        const headerElement = document.createElement('h3');
        headerElement.textContent = 'Similar Existing Issues:';
        suggestionsDiv.appendChild(headerElement);

        // Create list of similar issues
        issues.slice(0, 5).forEach((issue, index) => {
            const issueElement = document.createElement('div');
            
            const issueLink = document.createElement('a');
            issueLink.href = issue.html_url;
            issueLink.target = "_blank";
            issueLink.textContent = `#${issue.number}: ${issue.title}`;
            
            issueElement.appendChild(issueLink);
            suggestionsDiv.appendChild(issueElement);

            // Debug logging for each issue
            console.log(`Similar Issue ${index + 1}:`, {
                number: issue.number,
                title: issue.title,
                url: issue.html_url
            });
        });
    }

    // Insert the container right after the title input field
    issueTitleField.parentNode.insertBefore(suggestionsContainer, issueTitleField.nextSibling);

    // Final debug log
    console.log('Suggestions container final HTML:', suggestionsDiv.innerHTML);
}

// Function to initialize the listener
function initializeIssueListener() {
    // Multiple selectors for different GitHub page contexts
    const issueTitleField = document.querySelector(
        'input[name="issue[title]"],' +   // New issue page
        '#issue_title,' +                 // Issue edit page
        'input[placeholder="Title"]'      // New issue page (alternative)
    );

    console.log('Issue title field:', issueTitleField);

    if (issueTitleField) {
        // Set focus 
        issueTitleField.select();
        console.log('Issue title field focused');

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
    } else {
        console.error('Issue title input field not found. Retrying in 1 second.');
        // Log page structure to help diagnose
        console.log('Document body innerHTML:', document.body.innerHTML);
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
