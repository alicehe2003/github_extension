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
  
// Function to fetch issues from the GitHub repository
function fetchIssues(owner, repo) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open`;
    
    fetch(apiUrl)
      .then(response => response.json())
      .then(issues => {
        console.log('Issues fetched:', issues);
        
        // Get the current new issue title from the input field
        const newIssueTitle = document.querySelector('input[name="issue[title]"]').value;
        const similarIssues = findSimilarIssues(newIssueTitle, issues);
        displaySimilarIssues(similarIssues); 
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
function displaySimilarIssues(similarIssues) {
    // Create a suggestion box on the page
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.style.position = "absolute";
    suggestionsContainer.style.top = "100px";
    suggestionsContainer.style.left = "20px";
    suggestionsContainer.style.padding = "10px";
    suggestionsContainer.style.backgroundColor = "white";
    suggestionsContainer.style.border = "1px solid #ccc";
    suggestionsContainer.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
    suggestionsContainer.style.zIndex = "9999";
    suggestionsContainer.innerHTML = "<strong>Similar Issues:</strong>";
    
    if (similarIssues.length === 0) {
      suggestionsContainer.innerHTML += "<p>No similar issues found.</p>";
    }
  
    // Loop through similar issues and display them
    similarIssues.forEach(issue => {
      const issueLink = document.createElement('a');
      issueLink.href = issue.html_url;
      issueLink.target = "_blank";
      issueLink.textContent = issue.title;
      suggestionsContainer.appendChild(document.createElement('br'));
      suggestionsContainer.appendChild(issueLink);
    });
  
    document.body.appendChild(suggestionsContainer);
}
  
// Listen for changes in the issue title and suggest similar issues based on title
const issueTitleField = document.querySelector('input[name="issue[title]"]');
  if (issueTitleField) {
    issueTitleField.addEventListener('input', (event) => {
      const repoDetails = getRepoDetails(); // Get repo details every time user types
      fetchIssues(repoDetails.owner, repoDetails.repo); // Fetch issues and suggest similar ones
    });
}
  