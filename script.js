// Game configuration
const boardSizeSelect = document.getElementById('board-size');
let boardSize = parseInt(boardSizeSelect.value, 10);
let totalCells = boardSize * boardSize;
const snakes = {
    16: 6,
    48: 30,
    62: 19,
    64: 60,
    93: 68,
    95: 24,
    97: 76,
    98: 78
};
const ladders = {
    1: 38,
    4: 14,
    9: 31,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    80: 100
};
const playerColors = ['player1', 'player2', 'player3', 'player4'];
const playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
let players = [];
let currentPlayer = 0;
let gameActive = false;
let rolling = false;
let customSnakes = {};
let customLadders = {};
let playerAIs = [];
const builtInAvatars = ['😀','🐍','🦎','🐢'];
let playerAvatars = [];

const board = document.getElementById('board');
const rollDiceBtn = document.getElementById('roll-dice');
const diceResult = document.getElementById('dice-result');
const playerInfo = document.getElementById('player-info');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restart');
const setupDiv = document.getElementById('setup');
const numPlayersSelect = document.getElementById('num-players');
const startGameBtn = document.getElementById('start-game');
const gameContainer = document.getElementById('game-container');

const snakeHeadInput = document.getElementById('snake-head');
const snakeTailInput = document.getElementById('snake-tail');
const addSnakeBtn = document.getElementById('add-snake');
const snakeList = document.getElementById('snake-list');
const ladderBottomInput = document.getElementById('ladder-bottom');
const ladderTopInput = document.getElementById('ladder-top');
const addLadderBtn = document.getElementById('add-ladder');
const ladderList = document.getElementById('ladder-list');

const audioDice = document.getElementById('audio-dice');
const audioSnake = document.getElementById('audio-snake');
const audioLadder = document.getElementById('audio-ladder');
const audioWin = document.getElementById('audio-win');

const playerNamesSection = document.getElementById('player-names-section');
const saveBoardBtn = document.getElementById('save-board');
const loadBoardBtn = document.getElementById('load-board');
const loadBoardFile = document.getElementById('load-board-file');
const statsPanel = document.getElementById('stats-panel');
const copyLinkBtn = document.getElementById('copy-link');
const copyLinkMsg = document.getElementById('copy-link-msg');
const newGameBtn = document.getElementById('new-game');

function renderPlayerNameInputs() {
    const numPlayers = parseInt(numPlayersSelect.value, 10);
    playerNamesSection.innerHTML = '';
    playerAIs = playerAIs.slice(0, numPlayers);
    playerAvatars = playerAvatars.slice(0, numPlayers);
    for (let i = 0; i < numPlayers; i++) {
        const label = document.createElement('label');
        label.className = 'player-name-label';
        label.textContent = `Player ${i + 1} Name:`;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'player-name-input';
        input.id = `player-name-input-${i}`;
        input.placeholder = `Player ${i + 1}`;
        label.appendChild(input);
        // AI checkbox
        const aiLabel = document.createElement('label');
        aiLabel.style.marginLeft = '8px';
        aiLabel.style.fontSize = '14px';
        aiLabel.innerHTML = `<input type='checkbox' id='player-ai-${i}' ${playerAIs[i] ? 'checked' : ''}/> AI`;
        label.appendChild(aiLabel);
        // Show fixed avatar (emoji) for this player
        const avatarSpan = document.createElement('span');
        avatarSpan.className = 'avatar-picker';
        avatarSpan.style.marginLeft = '10px';
        avatarSpan.style.fontSize = '22px';
        avatarSpan.textContent = builtInAvatars[i];
        label.appendChild(avatarSpan);
        playerNamesSection.appendChild(label);
        if (typeof playerAIs[i] === 'undefined') playerAIs[i] = false;
        playerAvatars[i] = { type: 'emoji', value: builtInAvatars[i] };
    }
    // Listen for AI checkbox changes
    for (let i = 0; i < numPlayers; i++) {
        const aiCheckbox = document.getElementById(`player-ai-${i}`);
        aiCheckbox.checked = playerAIs[i];
        aiCheckbox.onchange = () => {
            playerAIs[i] = aiCheckbox.checked;
        };
    }
}
numPlayersSelect.addEventListener('change', renderPlayerNameInputs);
renderPlayerNameInputs();

function getCellCenter(cellNum) {
    let row = Math.floor((cellNum - 1) / boardSize);
    let col = (cellNum - 1) % boardSize;
    let displayRow = boardSize - 1 - row;
    let displayCol = (row % 2 === 0) ? col : (boardSize - 1 - col);
    let cellW = board.offsetWidth / boardSize;
    let cellH = board.offsetHeight / boardSize;
    let x = displayCol * cellW + cellW / 2;
    let y = displayRow * cellH + cellH / 2;
    return { x, y };
}

function renderSnakeList() {
    snakeList.innerHTML = '';
    Object.keys(customSnakes).forEach(head => {
        const tail = customSnakes[head];
        const li = document.createElement('li');
        li.textContent = `Head: ${head} → Tail: ${tail}`;
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.onclick = () => { delete customSnakes[head]; renderSnakeList(); };
        li.appendChild(btn);
        snakeList.appendChild(li);
    });
}
function renderLadderList() {
    ladderList.innerHTML = '';
    Object.keys(customLadders).forEach(bottom => {
        const top = customLadders[bottom];
        const li = document.createElement('li');
        li.textContent = `Bottom: ${bottom} → Top: ${top}`;
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.onclick = () => { delete customLadders[bottom]; renderLadderList(); };
        li.appendChild(btn);
        ladderList.appendChild(li);
    });
}
addSnakeBtn.onclick = () => {
    const head = parseInt(snakeHeadInput.value, 10);
    const tail = parseInt(snakeTailInput.value, 10);
    if (isNaN(head) || isNaN(tail) || head <= tail || head < 2 || head > totalCells - 1 || tail < 1 || tail > totalCells - 2) return;
    customSnakes[head] = tail;
    renderSnakeList();
};
addLadderBtn.onclick = () => {
    const bottom = parseInt(ladderBottomInput.value, 10);
    const top = parseInt(ladderTopInput.value, 10);
    if (isNaN(bottom) || isNaN(top) || bottom >= top || bottom < 1 || bottom > totalCells - 1 || top < 2 || top > totalCells) return;
    customLadders[bottom] = top;
    renderLadderList();
};
// Use custom snakes/ladders if any, else defaults
function getSnakes() {
    return Object.keys(customSnakes).length ? customSnakes : snakes;
}
function getLadders() {
    return Object.keys(customLadders).length ? customLadders : ladders;
}

function drawOverlay() {
    const svg = document.getElementById('board-overlay');
    svg.innerHTML = '';
    const laddersToDraw = getLadders();
    const snakesToDraw = getSnakes();
    // Draw ladders (straight lines)
    Object.keys(laddersToDraw).forEach(start => {
        const end = laddersToDraw[start];
        const from = getCellCenter(Number(start));
        const to = getCellCenter(Number(end));
        svg.innerHTML += `<path d="M${from.x},${from.y} L${to.x},${to.y}" stroke="#27ae60" stroke-width="5" marker-end="url(#arrowhead)" opacity="0.7" fill="none" class="animated-path" />`;
    });
    // Draw snakes (curved lines)
    Object.keys(snakesToDraw).forEach(head => {
        const tail = snakesToDraw[head];
        const from = getCellCenter(Number(head));
        const to = getCellCenter(Number(tail));
        // Control point for curve: midpoint, offset perpendicular
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.y - from.y;
        const dy = from.x - to.x;
        const len = Math.sqrt(dx*dx + dy*dy);
        const norm = len === 0 ? 0 : 0.18 * (1000 / len); // scale offset
        const cx = mx + dx * norm;
        const cy = my + dy * norm;
        svg.innerHTML += `<path d="M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}" stroke="#e74c3c" stroke-width="5" marker-end="url(#arrowhead)" opacity="0.7" fill="none" class="animated-path" />`;
    });
    // Add arrowhead marker
    svg.innerHTML = `<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth"><polygon points="0 0, 10 3.5, 0 7" fill="#333"/></marker></defs>` + svg.innerHTML;
}

// Generate board
function createBoard() {
    board.innerHTML = '';
    let isLeftToRight = true;
    const snakesToUse = getSnakes();
    const laddersToUse = getLadders();
    board.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
    for (let row = boardSize; row >= 1; row--) {
        let rowCells = [];
        for (let col = 1; col <= boardSize; col++) {
            let cellNum = (row - 1) * boardSize + col;
            if (!isLeftToRight) {
                cellNum = (row - 1) * boardSize + (boardSize - col + 1);
            }
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.cell = cellNum;
            cell.textContent = cellNum;
            if (snakesToUse[cellNum]) cell.classList.add('snake');
            if (laddersToUse[cellNum]) cell.classList.add('ladder');
            rowCells.push(cell);
        }
        isLeftToRight = !isLeftToRight;
        rowCells.forEach(cell => board.appendChild(cell));
    }
    drawOverlay();
}

function updateBoard() {
    document.querySelectorAll('.token').forEach(token => token.remove());
    players.forEach((player, idx) => {
        let cell = document.querySelector(`.cell[data-cell='${player.position}']`);
        if (cell) {
            const token = document.createElement('div');
            token.classList.add('token', player.color);
            token.title = player.name;
            // Render avatar
            if (player.avatar) {
                if (player.avatar.type === 'emoji') {
                    const emojiSpan = document.createElement('span');
                    emojiSpan.className = 'emoji';
                    emojiSpan.textContent = player.avatar.value;
                    token.appendChild(emojiSpan);
                } else if (player.avatar.type === 'img') {
                    const img = document.createElement('img');
                    img.src = player.avatar.value;
                    img.className = 'avatar-img-preview';
                    token.appendChild(img);
                }
            }
            cell.appendChild(token);
        }
    });
}

function getStats() {
    try {
        return JSON.parse(localStorage.getItem('snakeLadderStats') || '{}');
    } catch {
        return {};
    }
}
function saveStats(stats) {
    localStorage.setItem('snakeLadderStats', JSON.stringify(stats));
}
function renderStatsPanel() {
    const numPlayers = parseInt(numPlayersSelect.value, 10);
    let names = [];
    for (let i = 0; i < numPlayers; i++) {
        const input = document.getElementById(`player-name-input-${i}`);
        let name = input && input.value.trim() ? input.value.trim() : `Player ${i + 1}`;
        names.push(name);
    }
    const stats = getStats();
    let html = '<b>Statistics (this browser):</b><br>';
    names.forEach(name => {
        const s = stats[name] || { games: 0, wins: 0 };
        html += `${name}: Games Played: ${s.games}, Wins: ${s.wins}<br>`;
    });
    statsPanel.innerHTML = html;
}
numPlayersSelect.addEventListener('change', renderStatsPanel);
playerNamesSection.addEventListener('input', renderStatsPanel);
renderStatsPanel();

function createPlayers(num) {
    players = [];
    for (let i = 0; i < num; i++) {
        const input = document.getElementById(`player-name-input-${i}`);
        let name = input && input.value.trim() ? input.value.trim() : `Player ${i + 1}`;
        let avatar = playerAvatars[i] || { type: 'emoji', value: builtInAvatars[i % builtInAvatars.length] };
        players.push({ name, position: 1, color: playerColors[i], isAI: !!playerAIs[i], avatar });
    }
    // Update stats for new game
    const stats = getStats();
    players.forEach(p => {
        if (!stats[p.name]) stats[p.name] = { games: 0, wins: 0 };
        stats[p.name].games++;
    });
    saveStats(stats);
    renderStatsPanel();
}

function showEndGameButtons() {
    restartBtn.style.display = 'inline-block';
    newGameBtn.style.display = 'inline-block';
}
function hideEndGameButtons() {
    restartBtn.style.display = 'none';
    newGameBtn.style.display = 'none';
}

function startGame() {
    const numPlayers = parseInt(numPlayersSelect.value, 10);
    createPlayers(numPlayers);
    currentPlayer = 0;
    gameActive = true;
    setupDiv.style.display = 'none';
    gameContainer.style.display = 'flex';
    createBoard();
    updateBoard();
    updatePlayerInfo();
    diceResult.textContent = 'Roll to start!';
    message.textContent = '';
    hideEndGameButtons();
    maybeAutoRollAI();
}

function restartGame() {
    setupDiv.style.display = 'block';
    gameContainer.style.display = 'none';
    diceResult.textContent = 'Roll to start!';
    message.textContent = '';
    hideEndGameButtons();
    customSnakes = {};
    customLadders = {};
    renderSnakeList();
    renderLadderList();
}

function newGame() {
    setupDiv.style.display = 'block';
    gameContainer.style.display = 'none';
    diceResult.textContent = 'Roll to start!';
    message.textContent = '';
    hideEndGameButtons();
    customSnakes = {};
    customLadders = {};
    renderSnakeList();
    renderLadderList();
}

function updatePlayerInfo() {
    playerInfo.innerHTML = players.map((p, idx) => {
        let color;
        switch (idx) {
            case 0: color = '#3498db'; break;
            case 1: color = '#e67e22'; break;
            case 2: color = '#27ae60'; break;
            case 3: color = '#9b59b6'; break;
            default: color = '#333';
        }
        return `<span style="color:${color};font-weight:${currentPlayer===idx?'bold':'normal'}">${p.name}: ${p.position}</span>`;
    }).join(' | ');
}

function playSound(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
}

async function animateTokenMove(player, from, to, onStep) {
    let step = from < to ? 1 : -1;
    for (let pos = from + step; pos !== to + step; pos += step) {
        player.position = pos;
        updateBoard();
        updatePlayerInfo();
        if (onStep) onStep(pos);
        await new Promise(res => setTimeout(res, 120));
    }
}

function rollDice() {
    if (!gameActive || rolling) return;
    rolling = true;
    playSound(audioDice);
    let animationDuration = 700;
    let interval = 50;
    let elapsed = 0;
    let animInterval = setInterval(() => {
        const tempRoll = Math.floor(Math.random() * 6) + 1;
        diceResult.textContent = `${players[currentPlayer].name} rolled a ${tempRoll}`;
        elapsed += interval;
        if (elapsed >= animationDuration) {
            clearInterval(animInterval);
            const finalRoll = Math.floor(Math.random() * 6) + 1;
            diceResult.textContent = `${players[currentPlayer].name} rolled a ${finalRoll}`;
            rolling = false;
            movePlayer(finalRoll);
        }
    }, interval);
}

async function movePlayer(roll) {
    let player = players[currentPlayer];
    let startPos = player.position;
    let targetPos = player.position + roll;
    if (targetPos > totalCells) {
        message.textContent = `${player.name} needs exact roll to finish!`;
        switchTurn();
        return;
    }
    rolling = true;
    await animateTokenMove(player, startPos, targetPos);
    let snakesToUse = getSnakes();
    let laddersToUse = getLadders();
    let moved = false;
    if (snakesToUse[player.position]) {
        message.textContent = `${player.name} got bitten by a snake! Down to ${snakesToUse[player.position]}`;
        await new Promise(res => setTimeout(res, 300));
        playSound(audioSnake);
        await animateTokenMove(player, player.position, snakesToUse[player.position]);
        moved = true;
    } else if (laddersToUse[player.position]) {
        message.textContent = `${player.name} climbed a ladder! Up to ${laddersToUse[player.position]}`;
        await new Promise(res => setTimeout(res, 300));
        playSound(audioLadder);
        await animateTokenMove(player, player.position, laddersToUse[player.position]);
        moved = true;
    } else {
        message.textContent = '';
    }
    updateBoard();
    updatePlayerInfo();
    if (player.position === totalCells) {
        diceResult.textContent = `${player.name} wins! 🎉`;
        message.textContent = '';
        gameActive = false;
        showEndGameButtons();
        playSound(audioWin);
        // Update stats for winner
        const stats = getStats();
        if (!stats[player.name]) stats[player.name] = { games: 0, wins: 0 };
        stats[player.name].wins++;
        saveStats(stats);
        renderStatsPanel();
        rolling = false;
        return;
    }
    rolling = false;
    switchTurn();
}

function maybeAutoRollAI() {
    if (gameActive && players[currentPlayer] && players[currentPlayer].isAI && !rolling) {
        setTimeout(() => {
            if (gameActive && players[currentPlayer] && players[currentPlayer].isAI && !rolling) {
                rollDice();
            }
        }, 900);
    }
}

function switchTurn() {
    currentPlayer = (currentPlayer + 1) % players.length;
    updatePlayerInfo();
    maybeAutoRollAI();
}

rollDiceBtn.addEventListener('click', rollDice);
restartBtn.addEventListener('click', restartGame);
newGameBtn.addEventListener('click', newGame);
startGameBtn.addEventListener('click', startGame);

saveBoardBtn.onclick = () => {
    const data = {
        snakes: customSnakes,
        ladders: customLadders
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snake_ladder_board.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
};

loadBoardBtn.onclick = () => {
    loadBoardFile.value = '';
    loadBoardFile.click();
};

loadBoardFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (typeof data.snakes === 'object' && typeof data.ladders === 'object') {
                customSnakes = data.snakes;
                customLadders = data.ladders;
                renderSnakeList();
                renderLadderList();
                createBoard();
            } else {
                alert('Invalid board file.');
            }
        } catch {
            alert('Invalid board file.');
        }
    };
    reader.readAsText(file);
};

copyLinkBtn.onclick = () => {
    const data = {
        snakes: customSnakes,
        ladders: customLadders
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const url = `${location.origin}${location.pathname}#board=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
        copyLinkMsg.style.display = 'inline';
        setTimeout(() => { copyLinkMsg.style.display = 'none'; }, 1200);
    });
};

function tryLoadBoardFromHash() {
    const hash = location.hash;
    if (hash.startsWith('#board=')) {
        try {
            const encoded = hash.slice(7);
            const json = decodeURIComponent(escape(atob(encoded)));
            const data = JSON.parse(json);
            if (typeof data.snakes === 'object' && typeof data.ladders === 'object') {
                customSnakes = data.snakes;
                customLadders = data.ladders;
                renderSnakeList();
                renderLadderList();
                createBoard();
            }
        } catch {}
    }
}
tryLoadBoardFromHash();

// On load, show setup only
setupDiv.style.display = 'block';
gameContainer.style.display = 'none';

// Initialize
createBoard();
updateBoard();
updatePlayerInfo();
renderSnakeList();
renderLadderList();

boardSizeSelect.addEventListener('change', () => {
    boardSize = parseInt(boardSizeSelect.value, 10);
    totalCells = boardSize * boardSize;
    renderSnakeList();
    renderLadderList();
    createBoard();
}); 