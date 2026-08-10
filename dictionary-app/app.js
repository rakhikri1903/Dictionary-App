/**
 * DICTIONARY WEB APPLICATION (app.js)
 * 
 * A beginner-friendly, clean, and fully-featured JavaScript file.
 * This script uses Vanilla JS to fetch word meanings, handle DOM elements,
 * toggle light/dark modes, and manage search history and favorites using localStorage.
 */

// ==========================================
// 1. DOM ELEMENT SELECTORS
// ==========================================
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const suggestedTags = document.getElementById('suggested-tags');

// Results Column Elements
const welcomeCard = document.getElementById('welcome-card');
const loaderCard = document.getElementById('loader');
const errorCard = document.getElementById('error-card');
const errorTitle = document.getElementById('error-title');
const errorBody = document.getElementById('error-body');
const resultCard = document.getElementById('result-card');

// Word Result Elements
const resultWord = document.getElementById('result-word');
const resultPhonetic = document.getElementById('result-phonetic');
const playAudioBtn = document.getElementById('play-audio-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const favBtnText = document.getElementById('fav-btn-text');
const starOutlineIcon = favoriteBtn.querySelector('.star-outline');
const starFilledIcon = favoriteBtn.querySelector('.star-filled');
const meaningsContainer = document.getElementById('meanings-container');

// Sidebar Elements
const wodLoading = document.getElementById('wod-loading');
const wodDisplay = document.getElementById('wod-display');
const wodWord = document.getElementById('wod-word');
const wodMeaning = document.getElementById('wod-meaning');
const wodSearchBtn = document.getElementById('wod-search-btn');
const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');

// ==========================================
// 2. GLOBAL STATE VARIABLES
// ==========================================
let currentAudioUrl = null; // Store audio URL for the currently searched word
let currentSearchedWord = ""; // Store the current word string
const WOD_WORDS = ["eloquent", "serendipity", "resilient", "benevolent", "meticulous"];

// ==========================================
// 3. THEME TOGGLE (LIGHT / DARK MODE)
// ==========================================

/**
 * Toggles dark mode state, saves to localStorage, and updates UI icon.
 */
function toggleTheme() {
    // Toggle class on the body element
    const isDarkMode = document.body.classList.toggle('dark-mode');
    
    // Save selection in localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

/**
 * Checks localStorage on startup to apply the user's preferred theme.
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default to system preference if user hasn't set it explicitly
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// ==========================================
// 4. API & SEARCH FUNCTIONS
// ==========================================

/**
 * Entry point for searching a word. Sets up the input value and calls fetching.
 * @param {string} word - The word to search for.
 */
async function searchWord(word) {
    if (!word || word.trim() === "") return;
    
    const cleanWord = word.trim().toLowerCase();
    
    // Update input field text
    searchInput.value = cleanWord;
    clearBtn.classList.remove('hidden');
    
    // Prepare UI states
    welcomeCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    loaderCard.classList.remove('hidden');
    
    // Smooth scroll to search result on small devices
    if (window.innerWidth < 992) {
        loaderCard.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Fetch word details
    await fetchWordData(cleanWord);
}

/**
 * Fetches data from the Dictionary API in an async manner.
 * Handles API, network, and validation errors.
 * @param {string} word - Cleaned word string.
 */
async function fetchWordData(word) {
    const cleanWord = word.trim().toLowerCase();

    // Dictionary API
    const apiURL = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;

    let data;

    // ==========================================
    // STEP 1: FETCH DATA FROM API
    // ==========================================
    try {
        console.log("Searching:", cleanWord);
        console.log("API URL:", apiURL);

        const response = await fetch(apiURL);

        console.log("API Status:", response.status);

        if (response.status === 404) {
            showError(
                "Word not found",
                `Sorry, we couldn't find "${cleanWord}". Please check the spelling and try again.`
            );
            return;
        }

        if (!response.ok) {
            showError(
                "Dictionary API Error",
                `The dictionary API returned status ${response.status}. Please try again.`
            );
            return;
        }

        data = await response.json();

    } catch (error) {

        console.error("FETCH ERROR:", error);

        showError(
            "Network connection error",
            "Unable to connect to the dictionary API. Please check your internet connection and try again."
        );

        return;
    }

    // ==========================================
    // STEP 2: CHECK API DATA
    // ==========================================
    if (!Array.isArray(data) || data.length === 0) {
        showError(
            "No result",
            "The dictionary did not return any information for this word."
        );
        return;
    }

    // ==========================================
    // STEP 3: DISPLAY RESULT
    // IMPORTANT: This is OUTSIDE the fetch catch
    // ==========================================
    try {

        displayWordData(data);

    } catch (error) {

        console.error("DISPLAY ERROR:", error);

        showError(
            "Display error",
            "The word was found, but there was a problem displaying its information."
        );

        return;
    }

    // ==========================================
    // STEP 4: SAVE SEARCH HISTORY
    // This should NOT be treated as a network error
    // ==========================================
    try {

        saveToHistory(cleanWord);

    } catch (error) {

        console.error("HISTORY ERROR:", error);

        // Don't hide the dictionary result
        console.warn("Word was found successfully, but search history could not be saved.");
    }
}

/**
 * Populates basic word details, handles audio, and sets up favorite button.
 * @param {Array} data - Parsed dictionary API JSON list.
 */
function displayWordData(data) {
    // Hide loader card
    loaderCard.classList.add('hidden');
    
    const wordEntry = data[0];
    currentSearchedWord = wordEntry.word;
    
    // Display word string
    resultWord.textContent = currentSearchedWord;
    
    // Extract phonetic string safely (fallback through array)
    const phoneticText = wordEntry.phonetic || wordEntry.phonetics?.find(p => p.text)?.text || "";
    resultPhonetic.textContent = phoneticText;
    
    // Extract audio pronunciation URL safely
    currentAudioUrl = null;
    if (wordEntry.phonetics && Array.isArray(wordEntry.phonetics)) {
        // Look for first object with a non-empty audio string
        const audioObj = wordEntry.phonetics.find(p => p.audio && p.audio.trim() !== "");
        if (audioObj) {
            currentAudioUrl = audioObj.audio;
        }
    }
    
    // If audio is found, display play button, otherwise hide it
    if (currentAudioUrl) {
        playAudioBtn.classList.remove('hidden');
    } else {
        playAudioBtn.classList.add('hidden');
    }
    
    // Update Favorited state on the button
    updateFavoriteButtonUI(currentSearchedWord);
    
    // Renders definitions and meanings
    displayMeanings(wordEntry.meanings);
    
    // Reveal result card
    resultCard.classList.remove('hidden');
}

/**
 * Loops and creates DOM elements dynamically for every part of speech.
 * @param {Array} meanings - Meanings array from the API response.
 */
function displayMeanings(meanings) {
    // Clear previous results
    meaningsContainer.innerHTML = "";
    
    if (!meanings || meanings.length === 0) {
        meaningsContainer.innerHTML = "<p class='empty-list-msg'>No definitions found for this word.</p>";
        return;
    }
    
    // Loop through meanings (noun, verb, adjective, etc.)
    meanings.forEach(meaning => {
        const partOfSpeechBlock = document.createElement('div');
        partOfSpeechBlock.classList.add('part-of-speech-block');
        
        // 1. Part of Speech Header
        const posHeader = document.createElement('div');
        posHeader.classList.add('pos-header');
        
        const posTitle = document.createElement('h4');
        posTitle.classList.add('pos-title');
        posTitle.textContent = meaning.partOfSpeech;
        
        const posLine = document.createElement('div');
        posLine.classList.add('pos-line');
        
        posHeader.appendChild(posTitle);
        posHeader.appendChild(posLine);
        partOfSpeechBlock.appendChild(posHeader);
        
        // 2. Definitions list
        const defsList = document.createElement('ul');
        defsList.classList.add('definitions-list');
        
        meaning.definitions.forEach(def => {
            const defItem = document.createElement('li');
            defItem.classList.add('definition-item');
            
            const defText = document.createElement('p');
            defText.classList.add('definition-text');
            defText.textContent = def.definition;
            defItem.appendChild(defText);
            
            // Add example sentence if available
            if (def.example) {
                const exampleText = document.createElement('span');
                exampleText.classList.add('example-text');
                exampleText.textContent = `"${def.example}"`;
                defItem.appendChild(exampleText);
            }
            
            defsList.appendChild(defItem);
        });
        
        partOfSpeechBlock.appendChild(defsList);
        
        // Gather synonyms & antonyms for this specific part of speech
        // Note: API v2 might define them on meaning object, or on individual definitions.
        let allSynonyms = [...(meaning.synonyms || [])];
        let allAntonyms = [...(meaning.antonyms || [])];
        
        meaning.definitions.forEach(def => {
            if (def.synonyms) allSynonyms.push(...def.synonyms);
            if (def.antonyms) allAntonyms.push(...def.antonyms);
        });
        
        // Remove duplicates and trim strings
        allSynonyms = [...new Set(allSynonyms.map(s => s.trim()))].filter(s => s !== "");
        allAntonyms = [...new Set(allAntonyms.map(a => a.trim()))].filter(a => a !== "");
        
        // 3. Render Synonyms & Antonyms
        if (allSynonyms.length > 0 || allAntonyms.length > 0) {
            const relationsBlock = document.createElement('div');
            relationsBlock.classList.add('vocab-relations');
            
            if (allSynonyms.length > 0) {
                const synGroup = displaySynonyms(allSynonyms);
                relationsBlock.appendChild(synGroup);
            }
            
            if (allAntonyms.length > 0) {
                const antGroup = displayAntonyms(allAntonyms);
                relationsBlock.appendChild(antGroup);
            }
            
            partOfSpeechBlock.appendChild(relationsBlock);
        }
        
        meaningsContainer.appendChild(partOfSpeechBlock);
    });
}

/**
 * Formats lists of synonyms into clickable visual tags.
 * @param {Array} synonyms - Array of synonym word strings.
 * @returns {HTMLDivElement} Container node for synonyms.
 */
function displaySynonyms(synonyms) {
    const group = document.createElement('div');
    group.classList.add('relation-group');
    
    const label = document.createElement('span');
    label.classList.add('relation-label');
    label.textContent = "Synonyms:";
    group.appendChild(label);
    
    // Display maximum of 10 synonyms to keep layout clean
    synonyms.slice(0, 10).forEach(syn => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.classList.add('relation-tag');
        btn.textContent = syn;
        
        // Search synonym word on click
        btn.addEventListener('click', () => searchWord(syn));
        group.appendChild(btn);
    });
    
    return group;
}

/**
 * Formats lists of antonyms into clickable visual tags.
 * @param {Array} antonyms - Array of antonym word strings.
 * @returns {HTMLDivElement} Container node for antonyms.
 */
function displayAntonyms(antonyms) {
    const group = document.createElement('div');
    group.classList.add('relation-group');
    
    const label = document.createElement('span');
    label.classList.add('relation-label');
    label.textContent = "Antonyms:";
    group.appendChild(label);
    
    // Display maximum of 10 antonyms to keep layout clean
    antonyms.slice(0, 10).forEach(ant => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.classList.add('relation-tag', 'antonym-tag');
        btn.textContent = ant;
        
        // Search antonym word on click
        btn.addEventListener('click', () => searchWord(ant));
        group.appendChild(btn);
    });
    
    return group;
}

/**
 * Triggers audio pronunciation using HTML5 Audio element.
 * @param {string} audioUrl - URL address of MP3 file.
 */
function playAudio(audioUrl) {
    if (!audioUrl) return;
    
    try {
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (e) {
        alert("Sorry, audio playback is not supported on your browser or device.");
        console.error("Audio playback error:", e);
    }
}

/**
 * Hides results/loader and shows a formatted custom error card.
 * @param {string} title - Error heading text.
 * @param {string} body - Error explanation paragraph.
 */
function showError(title, body) {
    loaderCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    
    errorTitle.textContent = title;
    errorBody.textContent = body;
    errorCard.classList.remove('hidden');
}

// ==========================================
// 5. LOCAL STORAGE: SEARCH HISTORY
// ==========================================

/**
 * Saves a successfully searched word into the search history.
 * Maintains a maximum list of 5 entries, avoiding duplicates.
 * @param {string} word - The word string.
 */
function saveToHistory(word) {
    const cleanWord = word.trim().toLowerCase();
    
    // Retrieve current history array from localStorage
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    // Remove the word if it already exists to avoid duplicates
    history = history.filter(item => item !== cleanWord);
    
    // Add the word to the beginning of the list
    history.unshift(cleanWord);
    
    // Cut history list length to 5 entries
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    // Store back into localStorage
    localStorage.setItem('searchHistory', JSON.stringify(history));
    
    // Reload sidebar list
    loadHistory();
}

/**
 * Loads and displays recent searches inside the history sidebar card.
 */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    // Clear list
    historyList.innerHTML = "";
    
    if (history.length === 0) {
        historyList.innerHTML = '<li class="empty-list-msg">No recent searches yet.</li>';
        return;
    }
    
    history.forEach(word => {
        const li = document.createElement('li');
        
        // Clicking the word button searches for it
        const wordBtn = document.createElement('button');
        wordBtn.classList.add('list-word-btn');
        wordBtn.textContent = word;
        wordBtn.addEventListener('click', () => searchWord(word));
        
        // Remove button to clear item from list
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('list-action-btn');
        removeBtn.setAttribute('aria-label', `Remove ${word} from search history`);
        removeBtn.title = "Delete";
        removeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
            </svg>
        `;
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering list item search click
            deleteFromHistory(word);
        });
        
        li.appendChild(wordBtn);
        li.appendChild(removeBtn);
        historyList.appendChild(li);
    });
}

/**
 * Deletes a single item from the search history list.
 * @param {string} word - The word to delete.
 */
function deleteFromHistory(word) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history = history.filter(item => item !== word);
    localStorage.setItem('searchHistory', JSON.stringify(history));
    loadHistory();
}

// ==========================================
// 6. LOCAL STORAGE: FAVORITES
// ==========================================

/**
 * Checks if a word is in favorites and toggles its state accordingly.
 * Used on the Result Card favorite button click.
 */
function toggleFavoriteWord() {
    if (!currentSearchedWord) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.includes(currentSearchedWord)) {
        removeFavorite(currentSearchedWord);
    } else {
        addFavorite(currentSearchedWord);
    }
}

/**
 * Adds a word to the favorites list.
 * @param {string} word - Word to add.
 */
function addFavorite(word) {
    const cleanWord = word.trim().toLowerCase();
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (!favorites.includes(cleanWord)) {
        favorites.push(cleanWord);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    
    // Update elements
    updateFavoriteButtonUI(cleanWord);
    loadFavorites();
}

/**
 * Removes a word from the favorites list.
 * @param {string} word - Word to remove.
 */
function removeFavorite(word) {
    const cleanWord = word.trim().toLowerCase();
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    favorites = favorites.filter(item => item !== cleanWord);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update elements
    if (currentSearchedWord.toLowerCase() === cleanWord) {
        updateFavoriteButtonUI(currentSearchedWord);
    }
    loadFavorites();
}

/**
 * Checks the local database and toggles visual star icons / text on the main card.
 * @param {string} word - The active word.
 */
function updateFavoriteButtonUI(word) {
    const cleanWord = word.trim().toLowerCase();
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorited = favorites.includes(cleanWord);
    
    if (isFavorited) {
        favoriteBtn.classList.add('favorited');
        starOutlineIcon.classList.add('hidden');
        starFilledIcon.classList.remove('hidden');
        favBtnText.textContent = "Saved";
    } else {
        favoriteBtn.classList.remove('favorited');
        starOutlineIcon.classList.remove('hidden');
        starFilledIcon.classList.add('hidden');
        favBtnText.textContent = "Favorite";
    }
}

/**
 * Loads and displays saved favorite words inside the sidebar list.
 */
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    favoritesList.innerHTML = "";
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<li class="empty-list-msg">No favorite words saved yet.</li>';
        return;
    }
    
    favorites.forEach(word => {
        const li = document.createElement('li');
        
        // Word search action button
        const wordBtn = document.createElement('button');
        wordBtn.classList.add('list-word-btn');
        wordBtn.textContent = word;
        wordBtn.addEventListener('click', () => searchWord(word));
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('list-action-btn');
        removeBtn.setAttribute('aria-label', `Remove ${word} from favorites`);
        removeBtn.title = "Remove";
        removeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
            </svg>
        `;
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering list item search click
            removeFavorite(word);
        });
        
        li.appendChild(wordBtn);
        li.appendChild(removeBtn);
        favoritesList.appendChild(li);
    });
}

// ==========================================
// 7. WORD OF THE DAY (WOD) SYSTEM
// ==========================================

/**
 * Selects a random word from the predefined array, fetches a basic definition
 * preview from the API, and displays it in the Word of the Day container.
 */
async function initWordOfDay() {
    wodLoading.classList.remove('hidden');
    wodDisplay.classList.add('hidden');
    
    // 1. Pick random word
    const randomIndex = Math.floor(Math.random() * WOD_WORDS.length);
    const selectedWod = WOD_WORDS[randomIndex];
    
    try {
        const apiURL = `https://api.dictionaryapi.dev/api/v2/entries/en/${selectedWod}`;
        const response = await fetch(apiURL);
        
        if (!response.ok) {
            throw new Error(`WOD fetch failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // 2. Extract first definition safely
        const firstMeaning = data[0]?.meanings?.[0];
        const firstDef = firstMeaning?.definitions?.[0]?.definition || "Meaning preview unavailable.";
        const partOfSpeech = firstMeaning?.partOfSpeech ? ` (${firstMeaning.partOfSpeech})` : "";
        
        // 3. Render details
        wodWord.textContent = selectedWod;
        wodMeaning.textContent = `${partOfSpeech} ${firstDef}`;
        
        // 4. Attach click listener to search WOD in main view
        // We recreate the listener or clear existing ones by copying the node
        const newBtn = wodSearchBtn.cloneNode(true);
        wodSearchBtn.parentNode.replaceChild(newBtn, wodSearchBtn);
        newBtn.addEventListener('click', () => searchWord(selectedWod));
        
        // Hide loader & show result
        wodLoading.classList.add('hidden');
        wodDisplay.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error setting up Word of the Day:", error);
        
        // Fallback local dictionary details in case of network unavailability during load
        const fallbackMeanings = {
            "eloquent": "(adjective) Fluent or persuasive in speaking or writing.",
            "serendipity": "(noun) The occurrence of events by chance in a happy or beneficial way.",
            "resilient": "(adjective) Able to recover quickly from difficulties; tough.",
            "benevolent": "(adjective) Well meaning and kindly; charitable.",
            "meticulous": "(adjective) Showing great attention to detail; very careful and precise."
        };
        
        wodWord.textContent = selectedWod;
        wodMeaning.textContent = fallbackMeanings[selectedWod] || "Able to recover quickly from difficulties.";
        
        // Setup fallback action search button
        const newBtn = wodSearchBtn.cloneNode(true);
        wodSearchBtn.parentNode.replaceChild(newBtn, wodSearchBtn);
        newBtn.addEventListener('click', () => searchWord(selectedWod));
        
        wodLoading.classList.add('hidden');
        wodDisplay.classList.remove('hidden');
    }
}

// ==========================================
// 8. INITIALIZATION & GLOBAL EVENT LISTENERS
// ==========================================

// Handle search form submission (Form controls allow Enter key to trigger automatically)
searchForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Stop page reload
    const word = searchInput.value;
    searchWord(word);
});

// Show/Hide search clear button based on text inputs
searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() !== "") {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
});

// Clear input field on clear button click
clearBtn.addEventListener('click', () => {
    searchInput.value = "";
    clearBtn.classList.add('hidden');
    searchInput.focus();
});

// Pronunciation Play Button Click
playAudioBtn.addEventListener('click', () => {
    if (currentAudioUrl) {
        playAudio(currentAudioUrl);
    }
});

// Favorite Toggle Button Click on the main card
favoriteBtn.addEventListener('click', () => {
    toggleFavoriteWord();
});

// Theme Switcher Toggle Click
themeToggleBtn.addEventListener('click', toggleTheme);

// Handle Suggested Vocabulary button clicks
suggestedTags.addEventListener('click', (e) => {
    if (e.target.classList.contains('vocab-tag')) {
        const clickedWord = e.target.textContent;
        searchWord(clickedWord);
    }
});

// Execute startup initialization on document load completion
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadHistory();
    loadFavorites();
    initWordOfDay();
});
