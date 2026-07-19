# Immoral Translate 🌐✨

A premium, state-of-the-art **Language Translation Tool** built using HTML, Vanilla CSS, and modern JavaScript. It features automatic language detection, real-time client-side translation, speech recognition, voice narration, and offline history preservation.

---

## 🌟 Key Features

1. **AI-Powered Instant Translation**: Translates text dynamically as you type (debounced) or instantly by clicking "Translate Now" (or pressing `Ctrl + Enter`).
2. **Auto-Detect Language**: Automatically determines the language of the source text and displays it in the dropdown.
3. **Voice Input (Speech-to-Text)**: Speak directly into your microphone to transcribe and translate. Features a pulsing visual indicator when active.
4. **Voice Output (Text-to-Speech)**: Listen to audio pronunciations of both the source and translated text in high-quality native speakers.
5. **Persistent History**: Keeps track of your recent 15 translations. You can click any history card to load it back into the translator.
6. **Starred Favorites**: Star important translations to save them to a persistent bookmarks panel.
7. **One-Click Copy**: Copy the output translation with immediate toast confirmations and dynamic checkmark success transitions.
8. **Premium Glassmorphic Design**: Stunning dark visual palette featuring floating ambient glow animations, modern typography (`Outfit` & `Inter`), and responsive layout grids.

---

## 🚀 Quick Start

Since this is a client-side web application, you can launch it in two simple ways:

### Method 1: Double-Click (Simple)
Simply locate and double-click `index.html` on your computer. It will open in your default web browser instantly.

### Method 2: Local HTTP Server (Recommended for Voice APIs)
Some browsers require a secure origin or local server context to grant microphone permissions for the **Speech Recognition** API.

1. Open your terminal in the project directory.
2. Run a simple local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---

## 🛠️ Technology Stack

- **Structure**: Semantic HTML5 markup
- **Styling**: Vanilla CSS (custom variables, HSL color space, glassmorphism, keyframe animations)
- **Logic & Services**: Client-side JavaScript
  - *Translation API*: Google Translate unofficial client endpoint
  - *Speech Recognition*: Web Speech API (`webkitSpeechRecognition`)
  - *Speech Synthesis*: Web Speech API (`speechSynthesis`)
  - *Storage*: `window.localStorage`

---

## 📝 License
This project is open-source. Feel free to customize and expand it!