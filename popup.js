document.getElementById('activateBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.id) {
    showStatus('Error: No active tab found', false);
    return;
  }

  // Check if we can inject into this page
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    showStatus('Cannot inject into browser pages', false);
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['devtools.js']
    });
    
    showStatus('Dev Tools activated!', true);
    
    // Close popup after 1 second
    setTimeout(() => {
      window.close();
    }, 1000);
  } catch (error) {
    console.error('Injection error:', error);
    showStatus('Error: ' + error.message, false);
  }
});

function showStatus(message, success) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status' + (success ? ' active' : '');
  status.style.display = 'block';
  status.style.background = success ? '#1a3d1a' : '#3d1a1a';
  status.style.color = success ? '#4caf50' : '#f44336';
}