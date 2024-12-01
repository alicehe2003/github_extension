console.log("Content script running");
  
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
        console.log('Issues fetched:', issues);
        
        // Get the current new issue title from the input field
        const newIssueTitle = document.querySelector('input[name="issue[title]"]').value;
        console.log('New issue title:', newIssueTitle); // Log the title to check if it is correct

        const similarIssues = findSimilarIssues(newIssueTitle, issues);
        console.log('Similar issues:', similarIssues);  // Log the filtered similar issues
        
        displaySimilarIssues(similarIssues);
    })
    .catch(error => console.error('Error fetching issues:', error));
}
  
// Function to find similar issues based on keywords in the title
function findSimilarIssues(newTitle, existingIssues) {
    // Helper function to clean up titles (remove filler words)
    const fillerWords = ["a", "an", "the", "of", "and", "or", "for", "to", "in"];
    const cleanTitle = (title) => title
      .split(" ")
      .filter(word => !fillerWords.includes(word.toLowerCase()))
      .join(" ").toLowerCase();  // Convert to lowercase for comparison
  
    const newTitleCleaned = cleanTitle(newTitle);
    console.log('Cleaned new issue title:', newTitleCleaned); // Log cleaned title
  
    return existingIssues.filter(issue => {
      const existingTitleCleaned = cleanTitle(issue.title);
      console.log('Cleaned existing issue title:', existingTitleCleaned); // Log cleaned existing titles
      
      // Check if there's any overlap between keywords
      return existingTitleCleaned.includes(newTitleCleaned);
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


  