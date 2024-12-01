document.getElementById("open-github").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://github.com" });
});
  