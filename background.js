// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'activate-devtools') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) return;
    
    // Check if we can inject into this page
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      return;
    }
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['devtools.js']
      });
    } catch (error) {
      console.error('Failed to inject dev tools:', error);
    }
  }
});