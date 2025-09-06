// --- Game Logic ---
const wordCategories = {
    "Animals": ["ELEPHANT", "GIRAFFE", "TIGER", "PENGUIN", "ZEBRA","PANTHER"],
    "Fruits": ["APPLE", "BANANA", "ORANGE", "GRAPE", "MANGO","GUAVA"],
    "Countries": ["JAPAN", "BRAZIL", "CANADA", "EGYPT", "INDIA","KENYA","CHAD"],
    "Sport":["TENNIS","FOOTBALL","RUGBY","CRICKET","SQUASH"],
    "Cities":["MACAU","NAIROBI","LONDON","MADRID","PRETORIA"],
};

let wordToGuess = '';
let guessedLetters = [];
let wrongGuesses = 0;
const maxWrongGuesses = 6;
let timer = 90;
let timerInterval;
let gameRunning = false;
let selectedCategory = '';

const elements = {
    wordDisplay: document.getElementById('word-display'),
    keyboard: document.getElementById('keyboard'),
    hangmanSVG: document.getElementById('hangman-svg'),
    messageBox: document.getElementById('message-box'),
    timerDisplay: document.getElementById('timer'),
    categorySelect: document.getElementById('category-select'),
    gameStats: document.getElementById('game-stats'),
    gameOverModal: document.getElementById('game-over-modal'),
    modalMessage: document.getElementById('modal-message'),
    modalRestartBtn: document.getElementById('modal-restart-btn'),
    leaderboardBtn: document.getElementById('leaderboard-btn'),
    leaderboardModal: document.getElementById('leaderboard-modal'),
    leaderboardList: document.getElementById('leaderboard-list'),
    leaderboardCloseBtn: document.getElementById('leaderboard-close-btn'),
    overlay: document.getElementById('overlay')
};

const svgParts = [
    '<line x1="10" y1="140" x2="100" y2="140" stroke="currentColor" />', // Base
    '<line x1="20" y1="140" x2="20" y2="20" stroke="currentColor" />', // Pole
    '<line x1="20" y1="20" x2="80" y2="20" stroke="currentColor" />', // Top beam
    '<line x1="80" y1="20" x2="80" y2="40" stroke="currentColor" />', // Rope
    '<circle cx="80" cy="55" r="15" stroke="currentColor" fill="transparent" />', // Head
    '<line x1="80" y1="70" x2="80" y2="100" stroke="currentColor" />', // Body
    '<line x1="80" y1="80" x2="60" y2="90" stroke="currentColor" />', // Left arm
    '<line x1="80" y1="80" x2="100" y2="90" stroke="currentColor" />', // Right arm
    '<line x1="80" y1="100" x2="65" y2="120" stroke="currentColor" />', // Left leg
    '<line x1="80" y1="100" x2="95" y2="120" stroke="currentColor" />' // Right leg
];

function selectRandomWord(category) {
    const words = wordCategories[category];
    if (!words) return '';
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

function updateWordDisplay() {
    const display = wordToGuess.split('').map(letter => {
        return guessedLetters.includes(letter) ? letter : '_';
    }).join(' ');
    elements.wordDisplay.innerText = display;
}

function updateHangmanImage() {
    elements.hangmanSVG.innerHTML = svgParts.slice(0, wrongGuesses).join('');
}

function updateKeyboard() {
    document.querySelectorAll('.key-btn').forEach(button => {
        const letter = button.innerText;
        button.disabled = guessedLetters.includes(letter);
        if (guessedLetters.includes(letter) && !wordToGuess.includes(letter)) {
            button.classList.add('bg-red-500', 'text-white');
            button.classList.remove('bg-[#a78bfa]','hover:bg-[#6366a4]');
        } else if (guessedLetters.includes(letter)) {
            button.classList.add('bg-green-500', 'text-white');
            button.classList.remove('bg-[#a78bfa]','hover:bg-[#6366a4]');
        } else {
            button.classList.remove('bg-red-500', 'bg-green-500', 'text-white');
            button.classList.add('bg-[#a78bfa]', 'hover:bg-[#6366a4]');
        }
    });
}

function showMessage(msg) {
    elements.modalMessage.innerText = msg;
    elements.gameOverModal.classList.remove('hidden');
    elements.overlay.classList.remove('hidden');
}

function closeMessageModal() {
    elements.gameOverModal.classList.add('hidden');
    elements.overlay.classList.add('hidden');
}

function checkWin() {
    const isWon = wordToGuess.split('').every(letter => guessedLetters.includes(letter));
    if (isWon) {
        gameRunning = false;
        clearInterval(timerInterval);
        const score = (maxWrongGuesses - wrongGuesses) * 100 + timer * 10;
        saveScore(score);
        showMessage(`You won! The word was "${wordToGuess}". Your score is ${score}.`);
        return true;
    }
    return false;
}

function checkLoss() {
    if (wrongGuesses >= maxWrongGuesses) {
        gameRunning = false;
        clearInterval(timerInterval);
        showMessage(`Game over! The word was "${wordToGuess}".`);
        return true;
    }
    return false;
}

// --- Local Storage Leaderboard ---
const LEADERBOARD_KEY = 'hangman_leaderboard';

function saveScore(score) {
    let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    const newScoreEntry = {
        score: score,
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
    };
    leaderboard.push(newScoreEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function fetchLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    renderLeaderboard(leaderboard);
}

function handleGuess(letter) {
    if (!gameRunning || guessedLetters.includes(letter)) return;

    guessedLetters.push(letter);

    if (wordToGuess.includes(letter)) {
        updateWordDisplay();
        if (checkWin()) {
            return;
        }
    } else {
        wrongGuesses++;
        updateHangmanImage();
        if (checkLoss()) {
            return;
        }
    }
    updateKeyboard();
}

function createKeyboard() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    elements.keyboard.innerHTML = letters.split('').map(letter =>
        `<button class="key-btn w-10 h-10 md:w-12 md:h-12 text-lg font-bold bg-[#a78bfa] rounded-lg shadow-md transition-all duration-200 hover:bg-gray-200" data-letter="${letter}">${letter}</button>`
    ).join('');

    document.querySelectorAll('.key-btn').forEach(button => {
        button.addEventListener('click', () => handleGuess(button.dataset.letter));
    });
}

function updateTimer() {
    if (timer > 0) {
        timer--;
        elements.timerDisplay.innerText = `Time: ${timer}s`;
    } else {
        clearInterval(timerInterval);
        gameRunning = false;
        showMessage(`Time's up! The word was "${wordToGuess}".`);
    }
}

function startGame() {
    closeMessageModal();
    selectedCategory = elements.categorySelect.value;
    if (!selectedCategory) {
        showMessage("Please select a category to start.");
        return;
    }

    wordToGuess = selectRandomWord(selectedCategory);
    if (!wordToGuess) {
        showMessage("No words found for this category.");
        return;
    }

    guessedLetters = [];
    wrongGuesses = 0;
    timer = 90;
    gameRunning = true;

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);

    updateWordDisplay();
    updateHangmanImage();
    createKeyboard();
    elements.timerDisplay.innerText = `Time: ${timer}s`;
    elements.gameStats.classList.remove('hidden');
}

function renderLeaderboard(scores) {
    elements.leaderboardList.innerHTML = scores.map((score, index) => {
        return `
            <li class="p-3 my-2 rounded-lg bg-gray-100">
                <span class="text-sm font-semibold">${index + 1}.</span>
                <span class="text-sm">Score: ${score.score} pts</span>
            </li>
        `;
    }).join('');
}

elements.categorySelect.addEventListener('change', startGame);
elements.modalRestartBtn.addEventListener('click', startGame);
elements.leaderboardBtn.addEventListener('click', () => {
    elements.leaderboardModal.classList.remove('hidden');
    elements.overlay.classList.remove('hidden');
    fetchLeaderboard();
});
elements.leaderboardCloseBtn.addEventListener('click', () => {
    elements.leaderboardModal.classList.add('hidden');
    elements.overlay.classList.add('hidden');
});
