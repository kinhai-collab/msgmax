// Popup JavaScript - Handles settings UI

document.addEventListener('DOMContentLoaded', () => {
  // Load current settings
  loadSettings();
  
  // Add event listeners for checkboxes
  document.getElementById('enabled').addEventListener('change', saveSettings);
  document.getElementById('autoAnalyze').addEventListener('change', saveSettings);
  document.getElementById('showScoreBadge').addEventListener('change', saveSettings);
  
  // Load stats
  loadStats();
});

function loadSettings() {
  chrome.storage.sync.get(['enabled', 'autoAnalyze', 'showScoreBadge'], (settings) => {
    document.getElementById('enabled').checked = settings.enabled !== false;
    document.getElementById('autoAnalyze').checked = settings.autoAnalyze === true;
    document.getElementById('showScoreBadge').checked = settings.showScoreBadge !== false;
    
    updateStatus(settings.enabled !== false);
  });
}

function saveSettings() {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    autoAnalyze: document.getElementById('autoAnalyze').checked,
    showScoreBadge: document.getElementById('showScoreBadge').checked
  };
  
  chrome.storage.sync.set(settings, () => {
    console.log('Settings saved:', settings);
    updateStatus(settings.enabled);
  });
}

function updateStatus(enabled) {
  const statusDiv = document.getElementById('status');
  if (enabled) {
    statusDiv.textContent = '✅ Extension Active';
    statusDiv.style.background = 'rgba(16, 185, 129, 0.2)';
  } else {
    statusDiv.textContent = '⏸️ Extension Paused';
    statusDiv.style.background = 'rgba(107, 114, 128, 0.2)';
  }
}

function loadStats() {
  chrome.storage.local.get(['totalAnalyzed', 'riskyCaught', 'scoreHistory'], (data) => {
    const totalAnalyzed = data.totalAnalyzed || 0;
    const riskyCaught = data.riskyCaught || 0;
    const scoreHistory = data.scoreHistory || [];
    
    document.getElementById('totalAnalyzed').textContent = totalAnalyzed;
    document.getElementById('riskyCaught').textContent = riskyCaught;
    
    if (scoreHistory.length > 0) {
      const avgScore = (scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length).toFixed(1);
      document.getElementById('avgScore').textContent = avgScore + '/10';
    } else {
      document.getElementById('avgScore').textContent = '-';
    }
  });
}
