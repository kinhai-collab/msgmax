// Gmail Content Script - Injects analysis UI into Gmail compose windows

console.log('MsgMax - Gmail integration loaded');

// Wait for Gmail to fully load
function waitForGmail() {
  return new Promise((resolve) => {
    const checkGmail = setInterval(() => {
      if (document.querySelector('[role="main"]')) {
        clearInterval(checkGmail);
        resolve();
      }
    }, 500);
  });
}

// Detect compose windows
function findComposeWindows() {
  const composeSelectors = [
    '[role="dialog"]',
    '.nH.aHU',
    'div[aria-label*="compose" i]'
  ];
  
  const composeWindows = [];
  composeSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const textArea = el.querySelector('[role="textbox"]') || el.querySelector('div[contenteditable="true"]');
      if (textArea && !el.dataset.msgmaxAttached) {
        composeWindows.push({ container: el, textArea });
      }
    });
  });
  
  return composeWindows;
}

// Extract text from Gmail's rich text editor
function getComposeText(textArea) {
  if (textArea.getAttribute('contenteditable') === 'true') {
    return textArea.innerText || textArea.textContent || '';
  }
  return textArea.value || '';
}

// Inject analysis button into compose window
function injectAnalysisButton(composeWindow) {
  const { container, textArea } = composeWindow;
  
  container.dataset.msgmaxAttached = 'true';
  
  const sendButton = container.querySelector('[role="button"][data-tooltip*="Send" i]') || 
                     container.querySelector('div[aria-label*="Send" i]');
  
  if (!sendButton) {
    console.log('Send button not found');
    return;
  }
  
  const analysisButton = document.createElement('button');
  analysisButton.className = 'msgmax-analysis-button';
  analysisButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
    <span>Check Message</span>
  `;
  analysisButton.title = 'MsgMax - Check your message';
  
  analysisButton.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    margin-right: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  analysisButton.addEventListener('mouseenter', () => {
    analysisButton.style.transform = 'scale(1.05)';
    analysisButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });
  
  analysisButton.addEventListener('mouseleave', () => {
    analysisButton.style.transform = 'scale(1)';
    analysisButton.style.boxShadow = 'none';
  });
  
  analysisButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const messageText = getComposeText(textArea);
    
    if (!messageText.trim()) {
      showQuickNotification('Please write a message first!', 'warning');
      return;
    }
    
    analysisButton.disabled = true;
    analysisButton.innerHTML = `
      <div class="msgmax-spinner"></div>
      <span>Analyzing...</span>
    `;
    
    try {
      const recipientType = detectRecipientType(container);
      
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeMessage',
        text: messageText,
        recipient: recipientType
      });
      
      if (response.success) {
        showAnalysisPanel(container, response.data, messageText);
      } else {
        showQuickNotification('Analysis failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      showQuickNotification('Error analyzing message', 'error');
    } finally {
      analysisButton.disabled = false;
      analysisButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>Check Message</span>
      `;
    }
  });
  
  sendButton.parentNode.insertBefore(analysisButton, sendButton);
}

// Detect recipient type
function detectRecipientType(container) {
  const toField = container.querySelector('[aria-label*="To" i]');
  const recipientText = toField ? toField.textContent.toLowerCase() : '';
  
  if (recipientText.includes('hr') || recipientText.includes('manager')) return 'boss';
  if (recipientText.includes('team') || recipientText.includes('group')) return 'colleague';
  
  const subjectField = container.querySelector('[name="subjectbox"]');
  const subject = subjectField ? subjectField.value.toLowerCase() : '';
  
  if (subject.includes('invoice') || subject.includes('quote')) return 'client';
  if (subject.includes('application') || subject.includes('resume')) return 'boss';
  
  return 'colleague';
}

// Show analysis results panel
function showAnalysisPanel(container, analysis, originalText) {
  const existingPanel = container.querySelector('.msgmax-analysis-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  const panel = document.createElement('div');
  panel.className = 'msgmax-analysis-panel';
  
  const scoreColor = analysis.overallScore <= 3 ? '#10b981' : 
                     analysis.overallScore <= 6 ? '#f59e0b' : '#ef4444';
  
  const verdictEmoji = analysis.verdict === 'SAFE' ? '✅' : 
                       analysis.verdict === 'CAUTION' ? '⚠️' : '🚨';
  
  panel.innerHTML = `
    <div class="msgmax-panel-header">
      <h3>MsgMax ${verdictEmoji}</h3>
      <button class="msgmax-close-btn">×</button>
    </div>
    
    <div class="msgmax-panel-content">
      <div class="msgmax-score-section">
        <div class="msgmax-score" style="color: ${scoreColor}">
          ${analysis.overallScore}/10
        </div>
        <div class="msgmax-verdict" style="background: ${scoreColor}">
          ${analysis.verdict}
        </div>
      </div>
      
      <p class="msgmax-primary-issue">${analysis.primaryIssue}</p>
      
      ${analysis.redFlags && analysis.redFlags.length > 0 ? `
        <div class="msgmax-section">
          <h4>🚩 Red Flags:</h4>
          <ul>
            ${analysis.redFlags.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${analysis.specificWarnings && analysis.specificWarnings.length > 0 ? `
        <div class="msgmax-section">
          <h4>⚠️ Specific Issues:</h4>
          <ul>
            ${analysis.specificWarnings.map(warning => `<li>${warning}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${analysis.goodThings && analysis.goodThings.length > 0 ? `
        <div class="msgmax-section">
          <h4>✅ What's Working:</h4>
          <ul>
            ${analysis.goodThings.map(good => `<li>${good}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${analysis.suggestedRewrite && analysis.suggestedRewrite !== originalText ? `
        <div class="msgmax-section msgmax-rewrite">
          <h4>💡 Suggested Rewrite:</h4>
          <p>${analysis.suggestedRewrite}</p>
          <button class="msgmax-copy-btn">Copy Rewrite</button>
        </div>
      ` : ''}
      
      <p class="msgmax-reasoning">${analysis.reasoning}</p>
    </div>
  `;
  
  if (!document.getElementById('msgmax-styles')) {
    const style = document.createElement('style');
    style.id = 'msgmax-styles';
    style.textContent = `
      .msgmax-analysis-panel {
        position: absolute;
        right: 20px;
        top: 60px;
        width: 380px;
        max-height: 600px;
        overflow-y: auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .msgmax-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
      }
      
      .msgmax-panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .msgmax-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .msgmax-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .msgmax-panel-content {
        padding: 16px;
      }
      
      .msgmax-score-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .msgmax-score {
        font-size: 32px;
        font-weight: bold;
      }
      
      .msgmax-verdict {
        padding: 6px 12px;
        border-radius: 20px;
        color: white;
        font-size: 12px;
        font-weight: 600;
      }
      
      .msgmax-primary-issue {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 16px;
        font-weight: 500;
      }
      
      .msgmax-section {
        margin-bottom: 16px;
      }
      
      .msgmax-section h4 {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #374151;
      }
      
      .msgmax-section ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .msgmax-section li {
        font-size: 13px;
        color: #4b5563;
        margin-bottom: 4px;
        line-height: 1.5;
      }
      
      .msgmax-rewrite {
        background: #f3f4f6;
        padding: 12px;
        border-radius: 8px;
      }
      
      .msgmax-rewrite p {
        font-size: 13px;
        color: #374151;
        line-height: 1.6;
        margin-bottom: 8px;
        font-style: italic;
      }
      
      .msgmax-copy-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .msgmax-copy-btn:hover {
        background: #5568d3;
      }
      
      .msgmax-reasoning {
        font-size: 12px;
        color: #6b7280;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
        line-height: 1.5;
      }
      
      .msgmax-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid white;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  container.style.position = 'relative';
  container.appendChild(panel);
  
  panel.querySelector('.msgmax-close-btn').addEventListener('click', () => {
    panel.remove();
  });
  
  const copyBtn = panel.querySelector('.msgmax-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(analysis.suggestedRewrite);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Rewrite';
      }, 2000);
    });
  }
}

// Show quick notification
function showQuickNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 100000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Monitor for new compose windows
function monitorComposeWindows() {
  setInterval(() => {
    const composeWindows = findComposeWindows();
    composeWindows.forEach(window => {
      if (!window.container.dataset.msgmaxAttached) {
        injectAnalysisButton(window);
      }
    });
  }, 1000);
}

// Initialize
waitForGmail().then(() => {
  console.log('Gmail loaded, injecting MsgMax');
  monitorComposeWindows();
});
