// --- SERVER-SIDE CODE (NODE.JS) ---

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// --- HTML Template ---
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>1v1 Math Duels</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css">
    <style>
        :root {
            --primary-color: #0288d1; --secondary-color: #4fc3f7; --background-color: #e3f2fd; --surface-color: #ffffff;
            --text-color: #34495e; --light-text-color: #95a5a6; --correct-color: #27ae60; --incorrect-color: #c0392b;
            --border-radius: 20px; --shadow: 0 10px 35px rgba(0, 0, 0, 0.07); --font-family: 'Poppins', sans-serif;
            --space-m: clamp(1rem, 2.5vw, 1.5rem);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-family); background-color: var(--background-color); color: var(--text-color); line-height: 1.6; display: grid; place-items: center; min-height: 100vh; padding: var(--space-m); }
        .app-container { width: 100%; max-width: 800px; position: relative; }
        .screen { display: none; flex-direction: column; align-items: center; justify-content: center; width:100%; }
        .screen.active { display: flex; }
        .card { background: var(--surface-color); border-radius: var(--border-radius); box-shadow: var(--shadow); padding: var(--space-m); width: 100%; max-width: 550px; text-align: center; }
        .btn { border: none; border-radius: 12px; padding: 0.8rem 1.6rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.25s ease; color: white; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); box-shadow: 0 4px 15px rgba(2, 136, 209, 0.3); }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 7px 20px rgba(2, 136, 209, 0.4); }
        h1 { font-size: clamp(1.8rem, 5vw, 2.5rem); color: var(--primary-color); }
        #login-form { display: flex; flex-direction: column; gap: var(--space-m); margin-top: var(--space-m); }
        #username-input { padding: var(--space-m); border-radius: 12px; border: 1px solid #ddd; font-size: 1rem; text-align: center; }
        .players-list { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; width: 100%; }
        .player-card { display: flex; align-items: center; gap: 15px; background: #f7f7f7; padding: 10px 15px; border-radius: 10px; }
        .player-card i { color: var(--secondary-color); }
        #lobby-status { font-weight: 600; }
        .loader-dots { display: flex; justify-content: center; gap: 10px; margin-top: 15px; }
        .loader-dots div { width: 12px; height: 12px; background-color: var(--secondary-color); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .loader-dots div:nth-child(1) { animation-delay: -0.32s; } .loader-dots div:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
        #quiz-screen { width: 100%; max-width: 700px; gap: var(--space-m); }
        .opponent-container { display: flex; justify-content: space-around; width: 100%; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .opponent { background: #fff; padding: 5px 10px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); text-align: center; flex: 1; min-width: 80px; }
        .opponent-name { font-size: 0.8rem; font-weight: 600; }
        .opponent-score { font-size: 1rem; color: var(--primary-color); font-weight: 700; }
        .countdown-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; place-items: center; z-index: 100; color: white; font-size: 10rem; font-weight: 700; }
        .countdown-overlay.active { display: grid; }
        #question-card { min-height: 150px; display: grid; place-items: center; }
        #question-text { font-size: clamp(2rem, 7vw, 3.5rem); }
        .answer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-m); width: 100%; }
        .answer-option { background: var(--surface-color); border: 2px solid #e1f5fe; padding: var(--space-m); font-size: clamp(1.2rem, 4vw, 1.5rem); border-radius: var(--border-radius); cursor: pointer; transition: all 0.25s ease; }
        .answer-option.correct { background-color: var(--correct-color); border-color: var(--correct-color); color: white; }
        .answer-option.incorrect { background-color: var(--incorrect-color); border-color: var(--incorrect-color); color: white; }
        .answer-option.disabled { pointer-events: none; opacity: 0.7; }
        .quiz-footer { display: flex; justify-content: space-between; width: 100%; max-width: 700px; margin-top: 20px; font-weight: 600; }
        #final-leaderboard { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }
        .leaderboard-row { display: flex; justify-content: space-between; padding: 15px; border-radius: 10px; background: #f7f7f7; font-weight: 600; }
        .leaderboard-row:nth-child(1) { background-color: #ffd700; color: #333; }
        .leaderboard-row:nth-child(2) { background-color: #c0c0c0; }
        #play-again-btn { margin-top: 20px; }
        @media (max-width: 480px) { .answer-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="app-container">
        <section id="login-screen" class="screen active"><div class="card"><h1>Math Duels</h1><p>Enter your username to find a match!</p><form id="login-form"><input type="text" id="username-input" placeholder="Your Username" required maxlength="15"><button type="submit" class="btn">Find Match</button></form></div></section>
        <section id="lobby-screen" class="screen"><div class="card"><h2>Waiting for an Opponent...</h2><div id="lobby-players-list"></div><p id="lobby-status">Finding a match (0/2)</p><div class="loader-dots"><div></div><div></div><div></div></div></div></section>
        <section id="quiz-screen" class="screen"><div id="game-countdown-overlay" class="countdown-overlay"><span id="countdown-timer">5</span></div><header class="opponent-container" id="opponent-progress"></header><div id="question-card" class="card question-card"><p id="question-text"></p></div><div id="answer-options" class="answer-grid"></div><div class="quiz-footer"><p>Question <span id="question-progress">1/10</span></p><p>Your Score: <span id="current-quiz-score">0</span></p></div></section>
        <section id="results-screen" class="screen"><div class="card"><h1>Match Over!</h1><div id="final-leaderboard"></div><button id="play-again-btn" class="btn">Play Again</button></div></section>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const LOBBY_SIZE = 2; // *** CLIENT-SIDE LOBBY SIZE ***
        let myUsername = '', currentLobbyId = null, quizQuestions = [], currentQuestionIndex = 0, myScore = 0;
        const screens = { login: document.getElementById('login-screen'), lobby: document.getElementById('lobby-screen'), quiz: document.getElementById('quiz-screen'), results: document.getElementById('results-screen') };
        const DOMElements = {
            loginForm: document.getElementById('login-form'), usernameInput: document.getElementById('username-input'),
            lobbyPlayersList: document.getElementById('lobby-players-list'), lobbyStatus: document.getElementById('lobby-status'),
            opponentProgress: document.getElementById('opponent-progress'), questionText: document.getElementById('question-text'),
            answerOptions: document.getElementById('answer-options'), questionProgress: document.getElementById('question-progress'),
            myScore: document.getElementById('current-quiz-score'), countdownOverlay: document.getElementById('game-countdown-overlay'),
            countdownTimer: document.getElementById('countdown-timer'), finalLeaderboard: document.getElementById('final-leaderboard'),
            playAgainBtn: document.getElementById('play-again-btn')
        };
        function navigateTo(s) { Object.values(screens).forEach(c=>c.classList.remove('active')); screens[s].classList.add('active'); }
        DOMElements.loginForm.addEventListener('submit', (e) => { e.preventDefault(); myUsername = DOMElements.usernameInput.value.trim(); if(myUsername){ socket.emit('findMatch', myUsername); navigateTo('lobby'); } });
        DOMElements.answerOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.answer-option');
            if (btn && !btn.classList.contains('disabled')) {
                const isCorrect = Number(btn.dataset.answer) === quizQuestions[currentQuestionIndex].answer;
                Array.from(DOMElements.answerOptions.children).forEach(c => { c.classList.add('disabled'); if(Number(c.dataset.answer) === quizQuestions[currentQuestionIndex].answer) c.classList.add('correct'); });
                if (isCorrect) { myScore += 10; DOMElements.myScore.textContent = myScore; } else { btn.classList.add('incorrect'); }
                socket.emit('submitAnswer', { lobbyId: currentLobbyId, questionIndex: currentQuestionIndex, isCorrect });
                setTimeout(() => { currentQuestionIndex++; if (currentQuestionIndex < quizQuestions.length) { renderQuestion(); } else { DOMElements.questionText.textContent = "Waiting for your opponent..."; DOMElements.answerOptions.innerHTML = ''; socket.emit('quizFinished', currentLobbyId); } }, 1200);
            }
        });
        DOMElements.playAgainBtn.addEventListener('click', () => { resetClientState(); socket.emit('findMatch', myUsername); navigateTo('lobby'); });
        socket.on('joinedLobby', (l,p) => { currentLobbyId = l; updateLobbyUI(p); });
        socket.on('playerUpdate', (p) => { if(screens.lobby.classList.contains('active')) { updateLobbyUI(p); } else if (screens.quiz.classList.contains('active')) { updateOpponentProgress(p); } });
        socket.on('gameCountdown', c => { DOMElements.countdownOverlay.classList.add('active'); DOMElements.countdownTimer.textContent = c; });
        socket.on('gameStart', q => { DOMElements.countdownOverlay.classList.remove('active'); quizQuestions = q; navigateTo('quiz'); renderQuestion(); });
        socket.on('tournamentOver', r => { renderLeaderboard(r); navigateTo('results'); });
        function updateLobbyUI(p) { DOMElements.lobbyPlayersList.innerHTML = p.map(player => \`<div class="player-card"><i class="fas fa-user-circle"></i><span>\${player.username}</span></div>\`).join(''); DOMElements.lobbyStatus.textContent = \`Finding a match (\${p.length}/\${LOBBY_SIZE})\`; }
        function updateOpponentProgress(p) { DOMElements.opponentProgress.innerHTML = p.filter(player => player.username !== myUsername).map(player => \`<div class="opponent"><div class="opponent-name">\${player.username}</div><div class="opponent-score">\${player.score}</div></div>\`).join(''); }
        function generateDistractors(a,n,m) { const o=new Set([a]); while(o.size<4){const d=Math.floor(Math.random()*(m-n+1))+n;if(d!==a)o.add(d);} return Array.from(o).sort(()=>Math.random()-0.5); }
        function renderQuestion() { const q=quizQuestions[currentQuestionIndex]; DOMElements.questionProgress.textContent=\`\${currentQuestionIndex+1}/\${quizQuestions.length}\`; DOMElements.questionText.textContent=q.text; const opts=generateDistractors(q.answer,q.answer-10,q.answer+10); DOMElements.answerOptions.innerHTML=opts.map(o=>\`<div class="answer-option" data-answer="\${o}">\${o}</div>\`).join(''); }
        function renderLeaderboard(r) { DOMElements.finalLeaderboard.innerHTML = r.map((p,i) => \`<div class="leaderboard-row"><span>#\${i+1} \${p.username}</span><span>\${p.score} pts</span></div>\`).join(''); }
        function resetClientState() { currentLobbyId=null; quizQuestions=[]; currentQuestionIndex=0; myScore=0; DOMElements.myScore.textContent='0'; DOMElements.opponentProgress.innerHTML=''; }
    </script>
</body>
</html>
`;

// Main route to serve the HTML content
app.get('/', (req, res) => {
    res.send(htmlTemplate);
});

// --- Game State Management ---
let lobbies = {}; 
const LOBBY_CAPACITY = 2; // *** SERVER-SIDE LOBBY SIZE ***

function createLobbyId() { return Math.random().toString(36).substring(2, 8); }

function generateQuestions(count = 10) {
    const questions = [];
    const operations = ['+', '-', '×', '÷'];
    for (let i = 0; i < count; i++) {
        const op = operations[Math.floor(Math.random() * 4)];
        let a, b, answer;
        switch (op) {
            case '+': a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; answer = a+b; questions.push({ text: `${a} + ${b} = ?`, answer }); break;
            case '-': a = Math.floor(Math.random()*30)+10; b = Math.floor(Math.random()*a)+1; answer = a-b; questions.push({ text: `${a} - ${b} = ?`, answer }); break;
            case '×': a = Math.floor(Math.random()*10)+2; b = Math.floor(Math.random()*10)+2; answer = a*b; questions.push({ text: `${a} × ${b} = ?`, answer }); break;
            case '÷': answer = Math.floor(Math.random()*10)+2; b = Math.floor(Math.random()*10)+2; a = b*answer; questions.push({ text: `${a} ÷ ${b} = ?`, answer }); break;
        }
    }
    return questions;
}

// --- Socket.IO Event Handling ---
io.on('connection', (socket) => {
    socket.on('findMatch', (username) => {
        socket.username = username;
        let joined = false;
        for (const lobbyId in lobbies) {
            const lobby = lobbies[lobbyId];
            if (lobby.players.length < LOBBY_CAPACITY && !lobby.inGame) {
                socket.join(lobbyId);
                lobby.players.push({ id: socket.id, username: username, score: 0 });
                socket.emit('joinedLobby', lobbyId, lobby.players);
                io.to(lobbyId).emit('playerUpdate', lobby.players);
                joined = true;
                if (lobby.players.length === LOBBY_CAPACITY) startGame(lobbyId);
                break;
            }
        }
        if (!joined) {
            const lobbyId = createLobbyId();
            socket.join(lobbyId);
            lobbies[lobbyId] = { id: lobbyId, players: [{ id: socket.id, username: username, score: 0 }], questions: generateQuestions(), inGame: false };
            socket.emit('joinedLobby', lobbyId, lobbies[lobbyId].players);
        }
    });
    
    socket.on('submitAnswer', ({ lobbyId, isCorrect }) => {
        const lobby = lobbies[lobbyId];
        if (!lobby) return;
        const player = lobby.players.find(p => p.id === socket.id);
        if (player && isCorrect) player.score += 10;
        io.to(lobbyId).emit('playerUpdate', lobby.players);
    });

    socket.on('quizFinished', (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (!lobby) return;
        const player = lobby.players.find(p => p.id === socket.id);
        if (player) player.finished = true;
        if (lobby.players.every(p => p.finished)) endGame(lobbyId);
    });

    socket.on('disconnect', () => {
        for (const lobbyId in lobbies) {
            const lobby = lobbies[lobbyId];
            const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                lobby.players.splice(playerIndex, 1);
                if (lobby.players.length === 0) { delete lobbies[lobbyId]; } 
                else {
                    io.to(lobbyId).emit('playerUpdate', lobby.players);
                    if (lobby.inGame && lobby.players.every(p => p.finished)) endGame(lobbyId);
                }
                break;
            }
        }
    });
});

function startGame(lobbyId) {
    const lobby = lobbies[lobbyId];
    lobby.inGame = true;
    let countdown = 5;
    const interval = setInterval(() => {
        io.to(lobbyId).emit('gameCountdown', countdown);
        countdown--;
        if (countdown < 0) { clearInterval(interval); io.to(lobbyId).emit('gameStart', lobby.questions); }
    }, 1000);
}

function endGame(lobbyId) {
    const lobby = lobbies[lobbyId];
    if (!lobby) return;
    const finalRanking = lobby.players.sort((a, b) => b.score - a.score);
    io.to(lobbyId).emit('tournamentOver', finalRanking);
    setTimeout(() => { delete lobbies[lobbyId]; }, 15000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live at http://localhost:${PORT}`);
});
