// Background Service Worker - Handles API calls and message passing

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeMessage') {
    analyzeMessage(request.text, request.recipient)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['enabled', 'autoAnalyze', 'apiKey'], (settings) => {
      sendResponse(settings);
    });
    return true;
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Main analysis function
async function analyzeMessage(messageText, recipientType = 'colleague') {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are an expert communication analyzer. Analyze this message for potential issues BEFORE it's sent to a ${recipientType}.

Key things to detect:
1. **Passive-aggressive language**: "Per my last email", "As I mentioned", "Just to reiterate", "Circling back"
2. **Desperation signals**: Excessive "just", too many apologies, over-eagerness
3. **Tone mismatches**: Too casual for professional, too formal for friends
4. **Overpromising**: "I'll definitely", "I guarantee", unrealistic commitments
5. **Anger/frustration**: ALL CAPS, excessive exclamation marks, sarcasm
6. **Manipulative patterns**: Guilt-tripping, gaslighting phrases
7. **Vagueness**: Unclear asks, no specific action items

Message to analyze:
"${messageText}"

Recipient type: ${recipientType}

Respond ONLY with valid JSON (no markdown):
{
  "overallScore": <number 1-10>,
  "verdict": "<SAFE/CAUTION/RISKY>",
  "primaryIssue": "<main problem in 5-7 words>",
  "redFlags": ["<flag 1>", "<flag 2>"],
  "toneAnalysis": "<2 sentences>",
  "specificWarnings": ["<warning 1>", "<warning 2>"],
  "goodThings": ["<what's working>"],
  "suggestedRewrite": "<improved version>",
  "reasoning": "<2-3 sentences>"
}

Be honest but helpful.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse analysis');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Initialize default settin
