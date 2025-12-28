# MsgMax 🛡️

AI-powered message safety checker that catches regrettable emails before you hit send.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 What It Does

MsgMax is a Chrome extension that integrates directly into Gmail to analyze your messages in real-time. It catches:

- 🚩 **Passive-aggressive language** ("Per my last email...")
- 😰 **Desperation signals** (Excessive apologies, over-eagerness)
- 😤 **Anger/frustration** (ALL CAPS, sarcasm)
- 🎭 **Tone mismatches** (Too casual for boss, too formal for friends)
- 🤝 **Overpromising** ("I'll definitely...", "I guarantee...")
- 🎯 **Vagueness** (Unclear asks, no action items)

## ✨ Features

- ✅ **Real-time Gmail integration** - Button appears right next to Send
- ✅ **AI-powered analysis** - Uses Claude AI for smart detection
- ✅ **Risk scoring** - Get a 1-10 score for every message
- ✅ **Suggested rewrites** - Not just warnings, actual fixes
- ✅ **Context-aware** - Understands recipient type (boss vs. friend)
- ✅ **Privacy-focused** - Analysis only happens when you click

## 📦 Installation

### Option 1: Install from Source (Developer Mode)

Since this extension is not yet published on the Chrome Web Store:

1. **Clone this repository**
```bash
   git clone https://github.com/kinhai-collab/msgmax.git
   cd msgmax
```

2. **Create icon files** (or skip for testing)
   - Create an `icons/` folder
   - Add three placeholder images: `icon16.png`, `icon48.png`, `icon128.png`
   - See [Icon Guide](#creating-icons) below

3. **Load extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the `msgmax` folder
   - Extension should now appear in your extensions list

4. **Open Gmail and compose an email**
   - Look for the purple **"Check Message"** button next to Send
   - Click it to analyze your message!

### Option 2: Install from Chrome Web Store

Coming soon! 🚀

## 🎯 How to Use

1. **Compose an email** in Gmail (or reply to a message)
2. **Write your message** as you normally would
3. **Click "Check Message"** button (purple, next to Send)
4. **Review the analysis**:
   - Overall risk score (1-10)
   - Specific red flags detected
   - Tone analysis
   - Suggested improvements
5. **Make your decision**: Send as-is, edit, or use the suggested rewrite

## 🛠️ Tech Stack

- **Chrome Extension** (Manifest V3)
- **JavaScript** (Vanilla JS, no frameworks)
- **Claude AI API** (Anthropic)
- **Gmail DOM Integration**

## 📁 Project Structure
```
msgmax/
├── manifest.json          # Extension configuration
├── background.js          # Handles API calls
├── content-gmail.js       # Gmail integration
├── content-slack.js       # Slack integration (coming soon)
├── content-styles.css     # Shared styles
├── popup.html            # Settings popup
├── popup.js              # Settings logic
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🎨 Creating Icons

You need three icon sizes. Easy options:

**Option 1: Use Favicon Generator**
1. Go to https://realfavicongenerator.net/
2. Upload any image
3. Download and rename to `icon16.png`, `icon48.png`, `icon128.png`
4. Place in `icons/` folder

**Option 2: Use Canva**
1. Create 128x128 purple gradient square with shield emoji
2. Export and resize to create all three sizes

**Option 3: Temporary placeholders**
- Chrome will use default icons if you skip this step
- Extension will still work perfectly

## 🔮 Future Features

- [ ] Slack integration
- [ ] Auto-analyze on send (intercept send button)
- [ ] Keyboard shortcuts (Cmd/Ctrl + Shift + S)
- [ ] Stats tracking (messages analyzed, avg scores)
- [ ] Fine-tuned model (currently uses Claude API)
- [ ] Support for Outlook, LinkedIn messages
- [ ] Team/organization settings
- [ ] Export analysis history

## 🤖 About the AI

**Current Version (v1.0):**
- Uses Claude Sonnet 4 via API
- Smart prompting approach (no training required)
- Works immediately with high accuracy

**Future Version (v2.0 - Planned):**
- Fine-tuned model on email safety data
- RAG system with vector database
- Faster, cheaper, more accurate

See [Future Training Plans](docs/TRAINING.md) *(coming soon)*

## 🐛 Known Issues

- Gmail's HTML structure changes frequently - selectors may need updates
- Button might not appear immediately if Gmail loads slowly
- Analysis requires internet connection (API-based)

## 📝 Development

### Testing locally:
```bash
# Make changes to code
# Go to chrome://extensions/
# Click refresh icon on MsgMax
# Reload Gmail and test
```

### Debugging:
- **Content script**: Open Gmail → Right-click → Inspect → Console
- **Background script**: chrome://extensions/ → Click "Inspect service worker"
- **Popup**: Click extension icon → Right-click popup → Inspect

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

**Kin**
- Founder & CEO, MIRA AI Assistant
- Building AI products for families and productivity
- [GitHub](https://github.com/kinhai-collab) | [LinkedIn](#)

## 🙏 Acknowledgments

- Built with [Claude AI](https://www.anthropic.com/claude)
- Inspired by the need to save people from email regrets
- Thanks to the open-source community

---

**⚠️ Disclaimer:** This extension analyzes messages using AI, which may not catch everything. Always review your messages before sending. Use good judgment!

**🔐 Privacy:** Messages are only analyzed when you click "Check Message". No data is stored permanently.

---

Made with ❤️ and AI
