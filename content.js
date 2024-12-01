console.log("Content script running");

// Function to clean the title and extract relevant keywords (ignoring filler words)
function cleanTitle(title) {
    const fillerWords = ["a", "an", "the", "of", "and", "or"];
    return title.split(" ").filter(word => !fillerWords.includes(word.toLowerCase()));
  }
  
  // Function to get repository details (owner and repo name) from the GitHub page URL
  function getRepoDetails() {
    const pathSegments = window.location.pathname.split('/');
    const owner = pathSegments[1]; // The owner of the repo (e.g., 'octocat')
    const repo = pathSegments[2];  // The repository name (e.g., 'Hello-World')
    return { owner, repo };
}
  
// Function to fetch issues based on the repo owner, repo name, and the issue title
function fetchIssues(owner, repo, newIssueTitle) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(issues => {
            if (issues && issues.length > 0) {
                console.log('Issues fetched:', issues);

                // Find similar issues by comparing titles
                const similarIssues = findSimilarIssues(newIssueTitle, issues);
                displaySimilarIssues(similarIssues);
            } else {
                console.log('No open issues found.');
            }
        })
        .catch(error => console.error('Error fetching issues:', error));
}
  
// Function to find similar issues based on keywords in the title
function findSimilarIssues(newTitle, existingIssues) {
    const newTitleKeywords = cleanTitle(newTitle);
  
    return existingIssues.filter(issue => {
      const existingTitleKeywords = cleanTitle(issue.title);
      // Check if any keyword in the new issue title matches any keyword in existing issue titles
      return existingTitleKeywords.some(keyword => newTitleKeywords.includes(keyword));
    });
}
  
// Function to display similar issues to the user
function displaySimilarIssues(issues) {
    // Create the suggestion box if it doesn't exist
    let suggestionsContainer = document.querySelector('.similar-issues-suggestions');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.classList.add('similar-issues-suggestions');
        document.body.appendChild(suggestionsContainer);
    } else {
        suggestionsContainer.innerHTML = ''; // Clear previous suggestions
    }

    if (issues.length === 0) {
        suggestionsContainer.innerHTML = 'No similar issues found.';
    } else {
        issues.forEach(issue => {
            const issueElement = document.createElement('div');
            issueElement.classList.add('suggestion');
            const issueLink = document.createElement('a');
            issueLink.href = issue.html_url;
            issueLink.target = "_blank";
            issueLink.textContent = issue.title;
            issueElement.appendChild(issueLink);
            suggestionsContainer.appendChild(issueElement);
        });
    }
}

  
// Ensure the issue title input is selected
const issueTitleField = document.querySelector('input[name="issue[title]"]');
if (issueTitleField) {
    // Add event listener for the input event
    issueTitleField.addEventListener('input', (event) => {
        const newTitle = event.target.value.trim();  // Clean up extra spaces

        if (newTitle) {
            const { owner, repo } = getRepoDetails(); // Assuming you have this function to get the repo details
            fetchIssues(owner, repo, newTitle);
        }
    });
} else {
    console.error('Issue title input field not found.');
}


  