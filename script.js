const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const modeSelect = document.getElementById('gameMode');
const diffSelect = document.getElementById('difficulty');
const themeSelect = document.getElementById('theme');
const restartBtn = document.getElementById('restart');
const resetBtn = document.getElementById('reset-scores');

let scores = JSON.parse(localStorage.getItem('tris_scores')) || { x: 0, o: 0, draws: 0 };
let currentPlayer = "X";
let gameState = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;

const themes = {
    classic: ["X", "O"],
    emoji: ["🍕", "🍔"],
    space: ["🚀", "👾"]
};

const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function updateScoreUI() {
    document.getElementById('score-x').innerText = scores.x;
    document.getElementById('score-o').innerText = scores.o;
    document.getElementById('score-draws').innerText = scores.draws;
    document.getElementById('label-o').innerText = modeSelect.value === 'pvc' ? "Computer" : "Giocatore O";
}

function checkWin(board, p) {
    return winPatterns.some(pattern => pattern.every(i => board[i] === p));
}

function makeMove(idx) {
    if (gameState[idx] !== "" || !gameActive) return;

    gameState[idx] = currentPlayer;
    const cell = document.querySelector(`[data-index="${idx}"]`);
    cell.innerText = currentPlayer === "X" ? themes[themeSelect.value][0] : themes[themeSelect.value][1];
    cell.classList.add('taken');

    if (checkWin(gameState, currentPlayer)) {
        endGame(currentPlayer);
    } else if (gameState.every(c => c !== "")) {
        endGame("draw");
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        const sym = currentPlayer === "X" ? themes[themeSelect.value][0] : themes[themeSelect.value][1];
        document.getElementById('player-symbol').innerText = sym;
        document.getElementById('board').style.pointerEvents = "auto";
    }
}

function minimax(newBoard, player) {
    const availSpots = newBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    if (checkWin(newBoard, "X")) return { score: -10 };
    if (checkWin(newBoard, "O")) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        let move = { index: availSpots[i] };
        newBoard[availSpots[i]] = player;
        move.score = minimax(newBoard, player === "O" ? "X" : "O").score;
        newBoard[availSpots[i]] = "";
        moves.push(move);
    }

    let bestMove;
    if (player === "O") {
        let bestScore = -10000;
        moves.forEach((m, i) => { if (m.score > bestScore) { bestScore = m.score; bestMove = i; }});
    } else {
        let bestScore = 10000;
        moves.forEach((m, i) => { if (m.score < bestScore) { bestScore = m.score; bestMove = i; }});
    }
    return moves[bestMove];
}

function aiTurn() {
    let idx;
    if (diffSelect.value === "easy") {
        const avail = gameState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
        idx = avail[Math.floor(Math.random() * avail.length)];
    } else {
        idx = minimax(gameState, "O").index;
    }
    makeMove(idx);
}

function endGame(winner) {
    gameActive = false;
    if (winner === "draw") {
        scores.draws++;
        statusText.innerHTML = "Draw! 🤝";
    } else {
        scores[winner.toLowerCase()]++;
        const s = themes[themeSelect.value][winner === "X" ? 0 : 1];
        statusText.innerHTML = `${s} Wins! 🎉`;
        
        // Evidenzia celle vincenti
        winPatterns.forEach(pattern => {
            if (pattern.every(i => gameState[i] === winner)) {
                pattern.forEach(idx => cells[idx].classList.add('winner-cell'));
            }
        });
    }
    localStorage.setItem('tris_scores', JSON.stringify(scores));
    updateScoreUI();
}


function restartGame() {
    gameState = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";
    
    const s = themes[themeSelect.value][0];
    statusText.innerHTML = `Tocca a: <span id="player-symbol">${s}</span>`;
    
    cells.forEach(c => { 
        c.innerText = ""; 
        c.classList.remove('taken'); 
        c.classList.remove('winner-cell'); // <-- AGGIUNGI QUESTA RIGA
    });
    
    document.getElementById('board').style.pointerEvents = "auto";
    updateScoreUI();
}

// Event Listeners
cells.forEach(c => c.addEventListener('click', (e) => {
    makeMove(e.target.dataset.index);
    if (gameActive && modeSelect.value === "pvc" && currentPlayer === "O") {
        document.getElementById('board').style.pointerEvents = "none";
        setTimeout(aiTurn, 600);
    }
}));

restartBtn.addEventListener('click', restartGame);
resetBtn.addEventListener('click', () => {
    scores = { x: 0, o: 0, draws: 0 };
    localStorage.clear();
    updateScoreUI();
    restartGame();
});

modeSelect.addEventListener('change', () => {
    document.getElementById('difficulty-group').style.display = modeSelect.value === 'pvp' ? 'none' : 'flex';
    restartGame();
});

themeSelect.addEventListener('change', restartGame);
diffSelect.addEventListener('change', restartGame);

// Avvio
updateScoreUI();