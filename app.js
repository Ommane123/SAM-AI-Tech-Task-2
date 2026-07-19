// ==========================================================================
// JavaScript Application Logic - Immoral Translate
// ==========================================================================

// Supported Languages Dictionary
const languages = {
    "auto": "Detect Language",
    "af": "Afrikaans",
    "sq": "Albanian",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "tl": "Filipino",
    "fi": "Finnish",
    "fr": "French",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "iw": "Hebrew",
    "hi": "Hindi",
    "hu": "Hungarian",
    "is": "Icelandic",
    "id": "Indonesia",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "kn": "Kannada",
    "ko": "Korean",
    "la": "Latin",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "mk": "Macedonian",
    "ms": "Malay",
    "mt": "Maltese",
    "no": "Norwegian",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "sr": "Serbian",
    "sk": "Slovak",
    "sl": "Slovenian",
    "es": "Spanish",
    "sw": "Swahili",
    "sv": "Swedish",
    "ta": "Tamil",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "yi": "Yiddish"
};

// State Variables
let currentDetectedLang = '';
let autoTranslateTimeout = null;
let historySaveTimeout = null;
let speechRecognition = null;
let isRecording = false;

// DOM Elements
const sourceLangSelect = document.getElementById('source-lang-select');
const targetLangSelect = document.getElementById('target-lang-select');
const swapLanguagesBtn = document.getElementById('swap-languages-btn');
const sourceTextarea = document.getElementById('source-text');
const targetTextarea = document.getElementById('target-text');
const charCounter = document.getElementById('char-counter');
const clearTextBtn = document.getElementById('clear-text-btn');
const speechToTextBtn = document.getElementById('speech-to-text-btn');
const sourceSpeakBtn = document.getElementById('source-speak-btn');
const targetSpeakBtn = document.getElementById('target-speak-btn');
const copyTranslatedBtn = document.getElementById('copy-translated-btn');
const starTranslationBtn = document.getElementById('star-translation-btn');
const translateBtn = document.getElementById('translate-btn');
const translationLoader = document.getElementById('translation-loader');

// History & Favorites Tabs Elements
const tabHistory = document.getElementById('tab-history');
const tabFavorites = document.getElementById('tab-favorites');
const historyPanel = document.getElementById('history-panel');
const favoritesPanel = document.getElementById('favorites-panel');
const historyList = document.getElementById('history-list');
const starredList = document.getElementById('starred-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const clearFavoritesBtn = document.getElementById('clear-favorites-btn');
const toastContainer = document.getElementById('toast-container');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    populateLanguageSelects();
    setupEventListeners();
    setupSpeechRecognition();
    renderHistory();
    renderFavorites();
});

// Populate Language Dropdowns
function populateLanguageSelects() {
    // Populate Source Selector (with Auto Detect)
    sourceLangSelect.innerHTML = '';
    Object.entries(languages).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        if (code === 'auto') {
            option.selected = true;
        }
        sourceLangSelect.appendChild(option);
    });

    // Populate Target Selector (without Auto Detect)
    targetLangSelect.innerHTML = '';
    Object.entries(languages).forEach(([code, name]) => {
        if (code !== 'auto') {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            // Default target language to Spanish (es)
            if (code === 'es') {
                option.selected = true;
            }
            targetLangSelect.appendChild(option);
        }
    });
}

// Toast Notifications System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Add visual SVG icon to toast
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Fade out and remove after 3s
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 2500);
}

// Setup Event Listeners
function setupEventListeners() {
    // Auto-translation as user types (debounced)
    sourceTextarea.addEventListener('input', () => {
        const text = sourceTextarea.value.trim();

        // Character counter update
        charCounter.textContent = `${sourceTextarea.value.length} / 5000`;

        // Show/hide clear button
        if (sourceTextarea.value.length > 0) {
            clearTextBtn.classList.remove('hide');
        } else {
            clearTextBtn.classList.add('hide');
            targetTextarea.value = '';
            updateStarButtonState(false);
        }

        // Debounce API requests
        clearTimeout(autoTranslateTimeout);
        if (text) {
            autoTranslateTimeout = setTimeout(() => {
                performTranslation(false); // auto translate, don't force history save yet
            }, 60000); // 60s auto-translate for quiet editing, or translate on key triggers
        }
    });

    // Translate on clicking manual button
    translateBtn.addEventListener('click', () => {
        performTranslation(true); // force history save
    });

    // Translate on key combination Ctrl+Enter
    sourceTextarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            performTranslation(true);
        }
    });

    // Clear source text
    clearTextBtn.addEventListener('click', () => {
        sourceTextarea.value = '';
        targetTextarea.value = '';
        charCounter.textContent = '0 / 5000';
        clearTextBtn.classList.add('hide');
        updateStarButtonState(false);
        currentDetectedLang = '';

        // Reset the Detect Language option text
        const autoOpt = sourceLangSelect.querySelector('option[value="auto"]');
        if (autoOpt) autoOpt.textContent = 'Detect Language';

        showToast('Text cleared', 'success');
    });

    // Swap Languages
    swapLanguagesBtn.addEventListener('click', () => {
        let sourceLang = sourceLangSelect.value;
        const targetLang = targetLangSelect.value;

        // If source is auto, swap with the detected language if we have it, else use English
        if (sourceLang === 'auto') {
            sourceLang = currentDetectedLang || 'en';
        }

        // Can't swap if target doesn't support auto.
        sourceLangSelect.value = targetLang;
        targetLangSelect.value = sourceLang;

        // Swap Text Content
        const sourceText = sourceTextarea.value;
        const targetText = targetTextarea.value;
        sourceTextarea.value = targetText;
        targetTextarea.value = sourceText;

        // Re-calculate char count
        charCounter.textContent = `${sourceTextarea.value.length} / 5000`;
        if (sourceTextarea.value.length > 0) {
            clearTextBtn.classList.remove('hide');
        } else {
            clearTextBtn.classList.add('hide');
        }

        // Clear detected language state
        currentDetectedLang = '';
        const autoOpt = sourceLangSelect.querySelector('option[value="auto"]');
        if (autoOpt) autoOpt.textContent = 'Detect Language';

        // Animate the swap icon rotation
        const svg = swapLanguagesBtn.querySelector('svg');
        svg.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            svg.style.transform = 'none';
        }, 300);

        if (sourceTextarea.value.trim()) {
            performTranslation(true);
        }
    });

    // Change drop-down triggers instant translation
    sourceLangSelect.addEventListener('change', () => {
        if (sourceLangSelect.value !== 'auto') {
            currentDetectedLang = '';
            const autoOpt = sourceLangSelect.querySelector('option[value="auto"]');
            if (autoOpt) autoOpt.textContent = 'Detect Language';
        }
        if (sourceTextarea.value.trim()) {
            performTranslation(false);
        }
    });

    targetLangSelect.addEventListener('change', () => {
        if (sourceTextarea.value.trim()) {
            performTranslation(false);
        }
    });

    // Text-to-Speech for Source Text
    sourceSpeakBtn.addEventListener('click', () => {
        const text = sourceTextarea.value.trim();
        if (!text) return;
        let lang = sourceLangSelect.value;
        if (lang === 'auto') lang = currentDetectedLang || 'en';
        speakText(text, lang);
    });

    // Text-to-Speech for Target Text
    targetSpeakBtn.addEventListener('click', () => {
        const text = targetTextarea.value.trim();
        if (!text) return;
        const lang = targetLangSelect.value;
        speakText(text, lang);
    });

    // Copy Translated Text to Clipboard
    copyTranslatedBtn.addEventListener('click', async () => {
        const text = targetTextarea.value.trim();
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);

            // Toggle Success Icon inside button
            const copySvg = copyTranslatedBtn.querySelector('.copy-svg');
            const checkSvg = copyTranslatedBtn.querySelector('.check-svg');
            copySvg.classList.add('hide');
            checkSvg.classList.remove('hide');

            showToast('Translation copied to clipboard');

            setTimeout(() => {
                copySvg.classList.remove('hide');
                checkSvg.classList.add('hide');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy text', 'error');
        }
    });

    // Star/Save Translation
    starTranslationBtn.addEventListener('click', () => {
        const sourceText = sourceTextarea.value.trim();
        const translatedText = targetTextarea.value.trim();
        if (!sourceText || !translatedText) return;

        const sourceLang = sourceLangSelect.value;
        const targetLang = targetLangSelect.value;

        toggleFavorite(sourceText, translatedText, sourceLang, targetLang);
    });

    // Tabs Navigation
    tabHistory.addEventListener('click', () => {
        tabHistory.classList.add('active');
        tabFavorites.classList.remove('active');
        historyPanel.classList.add('active');
        favoritesPanel.classList.remove('active');
    });

    tabFavorites.addEventListener('click', () => {
        tabFavorites.classList.add('active');
        tabHistory.classList.remove('active');
        favoritesPanel.classList.add('active');
        historyPanel.classList.remove('active');
    });

    // Clear buttons for panels
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all translation history?')) {
            localStorage.setItem('translation_history', JSON.stringify([]));
            renderHistory();
            showToast('History cleared');
        }
    });

    clearFavoritesBtn.addEventListener('click', () => {
        if (confirm('Clear all saved favorites?')) {
            localStorage.setItem('translation_favorites', JSON.stringify([]));
            renderFavorites();
            updateStarButtonState(false);
            showToast('Favorites cleared');
        }
    });
}

// Perform Translation Logic
async function performTranslation(forceSaveToHistory = true) {
    const text = sourceTextarea.value.trim();
    if (!text) {
        targetTextarea.value = '';
        updateStarButtonState(false);
        return;
    }

    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    translationLoader.classList.remove('hide');

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Request Failed');

        const data = await response.json();

        let translatedText = '';
        if (data && data[0]) {
            translatedText = data[0].map(item => item[0]).join('');
        }

        targetTextarea.value = translatedText;

        // Auto-detect update
        if (sourceLang === 'auto' && data[2]) {
            currentDetectedLang = data[2];
            const detectedName = languages[currentDetectedLang] || currentDetectedLang.toUpperCase();
            const autoOpt = sourceLangSelect.querySelector('option[value="auto"]');
            if (autoOpt) {
                autoOpt.textContent = `Auto Detect (${detectedName})`;
            }
        }

        // Check if this text is already starred to style the star button
        const favorites = JSON.parse(localStorage.getItem('translation_favorites') || '[]');
        const isStarred = favorites.some(item =>
            item.sourceText.toLowerCase() === text.toLowerCase() &&
            item.targetLang === targetLang
        );
        updateStarButtonState(isStarred);

        // Save to History (debounced to avoid spam, or forced on buttons/Enter)
        if (forceSaveToHistory) {
            saveToHistory(text, translatedText, sourceLang, targetLang);
        } else {
            clearTimeout(historySaveTimeout);
            historySaveTimeout = setTimeout(() => {
                saveToHistory(text, translatedText, sourceLang, targetLang);
            }, 3000);
        }

    } catch (error) {
        console.error('Translation error:', error);
        showToast('Error connecting to translation service', 'error');
    } finally {
        translationLoader.classList.add('hide');
    }
}

// Web Speech APIs Integration

// Speech Recognition (Speech-to-Text)
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        speechToTextBtn.title = "Speech recognition not supported in this browser";
        speechToTextBtn.style.opacity = "0.5";
        speechToTextBtn.style.cursor = "not-allowed";
        return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;

    speechRecognition.onstart = () => {
        isRecording = true;
        speechToTextBtn.classList.add('recording');
        showToast('Listening... Speak now.', 'success');
    };

    speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            showToast('No speech detected. Try again.', 'error');
        } else {
            showToast('Voice input error: ' + event.error, 'error');
        }
        isRecording = false;
        speechToTextBtn.classList.remove('recording');
    };

    speechRecognition.onend = () => {
        isRecording = false;
        speechToTextBtn.classList.remove('recording');
    };

    speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            // Append or insert text
            const currentVal = sourceTextarea.value;
            const spacer = currentVal.length > 0 && !currentVal.endsWith(' ') ? ' ' : '';
            sourceTextarea.value = currentVal + spacer + transcript;

            // Trigger input events to update char counter and sizing
            sourceTextarea.dispatchEvent(new Event('input'));

            // Translate automatically
            performTranslation(true);
        }
    };

    speechToTextBtn.addEventListener('click', () => {
        if (isRecording) {
            speechRecognition.stop();
        } else {
            let lang = sourceLangSelect.value;
            // set recognition language
            if (lang === 'auto') {
                speechRecognition.lang = 'en-US'; // fallback
            } else {
                // Map basic languages if they don't conform to standard BCP47
                speechRecognition.lang = lang;
            }
            speechRecognition.start();
        }
    });
}

// Speech Synthesis (Text-to-Speech)
function speakText(text, langCode) {
    if (!window.speechSynthesis) {
        showToast('Text-to-speech not supported in this browser', 'error');
        return;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    // Find and set voice matching language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(voice => voice.lang.startsWith(langCode));
    if (matchingVoice) {
        utterance.voice = matchingVoice;
    }

    utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        showToast('Error playing audio narration', 'error');
    };

    window.speechSynthesis.speak(utterance);
}

// LocalStorage Persistence: History and Favorites

function saveToHistory(sourceText, translatedText, sourceLang, targetLang) {
    if (!sourceText.trim() || !translatedText.trim()) return;

    let history = JSON.parse(localStorage.getItem('translation_history') || '[]');

    // Prevent duplicate consecutive entries
    if (history.length > 0) {
        const latest = history[0];
        if (latest.sourceText.toLowerCase() === sourceText.toLowerCase() && latest.targetLang === targetLang) {
            return;
        }
    }

    // Add to top of list
    const historyItem = {
        id: Date.now().toString(),
        sourceText,
        translatedText,
        sourceLang,
        targetLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    history.unshift(historyItem);

    // Cap at 15 items
    if (history.length > 15) {
        history.pop();
    }

    localStorage.setItem('translation_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('translation_history') || '[]');
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<li class="empty-state">No recent translations</li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';

        // Find language abbreviations names
        const sourceName = languages[item.sourceLang] || item.sourceLang.toUpperCase();
        const targetName = languages[item.targetLang] || item.targetLang.toUpperCase();

        li.innerHTML = `
            <div class="item-content">
                <div class="item-meta">
                    <span>${sourceName}</span>
                    <span class="meta-arrow">&rarr;</span>
                    <span>${targetName}</span>
                </div>
                <div class="item-source">${escapeHtml(item.sourceText)}</div>
                <div class="item-translated">${escapeHtml(item.translatedText)}</div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn star-btn" title="Star translation">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
                <button class="item-action-btn delete-btn" title="Delete entry">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
        `;

        // Click to reload translation into workspace
        li.querySelector('.item-content').addEventListener('click', () => {
            loadItemIntoWorkspace(item);
        });

        // Toggle Star
        const starBtn = li.querySelector('.star-btn');
        const favorites = JSON.parse(localStorage.getItem('translation_favorites') || '[]');
        const isStarred = favorites.some(fav => fav.sourceText.toLowerCase() === item.sourceText.toLowerCase() && fav.targetLang === item.targetLang);
        if (isStarred) {
            starBtn.classList.add('starred');
            starBtn.querySelector('svg').setAttribute('fill', 'var(--accent-gold)');
            starBtn.querySelector('svg').setAttribute('stroke', 'var(--accent-gold)');
        }

        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item.sourceText, item.translatedText, item.sourceLang, item.targetLang);
            renderHistory(); // re-render to update star state
        });

        // Delete from history
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryItem(item.id);
        });

        historyList.appendChild(li);
    });
}

function deleteHistoryItem(id) {
    let history = JSON.parse(localStorage.getItem('translation_history') || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem('translation_history', JSON.stringify(history));
    renderHistory();
    showToast('Entry deleted');
}

// Favorites/Starred Logic

function toggleFavorite(sourceText, translatedText, sourceLang, targetLang) {
    let favorites = JSON.parse(localStorage.getItem('translation_favorites') || '[]');

    const index = favorites.findIndex(item =>
        item.sourceText.toLowerCase() === sourceText.toLowerCase() &&
        item.targetLang === targetLang
    );

    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
        localStorage.setItem('translation_favorites', JSON.stringify(favorites));
        renderFavorites();

        // If current text in workspace matches, update star state
        if (sourceTextarea.value.trim().toLowerCase() === sourceText.toLowerCase()) {
            updateStarButtonState(false);
        }
        showToast('Removed from favorites');
    } else {
        // Add to favorites
        const favItem = {
            id: Date.now().toString(),
            sourceText,
            translatedText,
            sourceLang,
            targetLang,
            timestamp: new Date().toLocaleDateString()
        };
        favorites.unshift(favItem);
        localStorage.setItem('translation_favorites', JSON.stringify(favorites));
        renderFavorites();

        if (sourceTextarea.value.trim().toLowerCase() === sourceText.toLowerCase()) {
            updateStarButtonState(true);
        }
        showToast('Saved to favorites');
    }
}

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('translation_favorites') || '[]');
    starredList.innerHTML = '';

    if (favorites.length === 0) {
        starredList.innerHTML = '<li class="empty-state">No starred translations yet</li>';
        return;
    }

    favorites.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const sourceName = languages[item.sourceLang] || item.sourceLang.toUpperCase();
        const targetName = languages[item.targetLang] || item.targetLang.toUpperCase();

        li.innerHTML = `
            <div class="item-content">
                <div class="item-meta">
                    <span>${sourceName}</span>
                    <span class="meta-arrow">&rarr;</span>
                    <span>${targetName}</span>
                </div>
                <div class="item-source">${escapeHtml(item.sourceText)}</div>
                <div class="item-translated">${escapeHtml(item.translatedText)}</div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn delete-btn" title="Remove star">
                    <svg class="star-svg starred" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-gold)" stroke="var(--accent-gold)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
            </div>
        `;

        li.querySelector('.item-content').addEventListener('click', () => {
            loadItemIntoWorkspace(item);
        });

        // Unstar click
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item.sourceText, item.translatedText, item.sourceLang, item.targetLang);
        });

        starredList.appendChild(li);
    });
}

function updateStarButtonState(isStarred) {
    const starSvg = starTranslationBtn.querySelector('.star-svg');
    if (isStarred) {
        starSvg.classList.add('starred');
        starSvg.setAttribute('fill', 'var(--accent-gold)');
        starSvg.setAttribute('stroke', 'var(--accent-gold)');
    } else {
        starSvg.classList.remove('starred');
        starSvg.removeAttribute('fill');
        starSvg.setAttribute('stroke', 'currentColor');
    }
}

// Utilities

function loadItemIntoWorkspace(item) {
    sourceLangSelect.value = item.sourceLang;
    targetLangSelect.value = item.targetLang;
    sourceTextarea.value = item.sourceText;
    targetTextarea.value = item.translatedText;
    charCounter.textContent = `${item.sourceText.length} / 5000`;
    clearTextBtn.classList.remove('hide');

    // reset detected text
    currentDetectedLang = '';
    const autoOpt = sourceLangSelect.querySelector('option[value="auto"]');
    if (autoOpt) autoOpt.textContent = 'Detect Language';

    // update current star status
    const favorites = JSON.parse(localStorage.getItem('translation_favorites') || '[]');
    const isStarred = favorites.some(fav => fav.sourceText.toLowerCase() === item.sourceText.toLowerCase() && fav.targetLang === item.targetLang);
    updateStarButtonState(isStarred);

    // smooth scroll to top of window to let them see translator card
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Loaded translation');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
