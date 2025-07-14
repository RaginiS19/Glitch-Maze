// Glitch Maze - Working Version
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game constants
const tileSize = 50;
const rows = 10;
const cols = 10;

// Game state
let level = 0;
let score = 1000;
let lives = 3;
let glitchWalls = [];
let gameRunning = false;
let paused = false;
let difficulty = "Medium";
let redBallSpeed = 500;
let powerUps = [];
let timer = 30;
let timerInterval;

// Entities
let player = { x: 0, y: 0 };
let redBall = { x: 9, y: 0 };
const goal = { x: 9, y: 9 };

// Generate mazes
const mazes = [];
for (let i = 0; i < 5; i++) {
    mazes.push(generateValidMaze());
}

function generateMaze() {
    const maze = [];
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
            if ((x === 0 && y === 0) || (x === cols-1 && y === rows-1)) {
                row.push(0);
            } else {
                row.push(Math.random() < 0.3 ? 1 : 0);
            }
        }
        maze.push(row);
    }
    return maze;
}

function generateValidMaze() {
    let maze;
    let valid = false;
    
    while (!valid) {
        maze = generateMaze();
        if (pathExists(maze, {x:0,y:0}, {x:9,y:9})) {
            valid = true;
        }
    }
    return maze;
}

function pathExists(maze, start, end) {
    const visited = Array(rows).fill().map(() => Array(cols).fill(false));
    const queue = [[start.x, start.y]];
    visited[start.y][start.x] = true;
    
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        if (x === end.x && y === end.y) return true;
        
        const directions = [[0,1],[1,0],[0,-1],[-1,0]];
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && 
                !visited[ny][nx] && maze[ny][nx] === 0) {
                visited[ny][nx] = true;
                queue.push([nx, ny]);
            }
        }
    }
    return false;
}

// Drawing functions
function drawMaze(maze) {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const isWall = maze[y][x] === 1 && !glitchWalls.includes(`${x},${y}`);
            ctx.fillStyle = isWall ? "#444" : "#222";
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            ctx.strokeStyle = "#333";
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }
}

function drawEntities() {
    // Draw goal
    ctx.fillStyle = "#f00";
    ctx.beginPath();
    ctx.arc((goal.x * tileSize) + tileSize/2, (goal.y * tileSize) + tileSize/2, tileSize/2 - 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player
    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.arc((player.x * tileSize) + tileSize/2, (player.y * tileSize) + tileSize/2, tileSize/2 - 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw red ball
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc((redBall.x * tileSize) + tileSize/2, (redBall.y * tileSize) + tileSize/2, tileSize/2 - 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw power-ups
    ctx.fillStyle = "gold";
    powerUps.forEach(p => {
        ctx.beginPath();
        ctx.arc((p.x * tileSize) + tileSize/2, (p.y * tileSize) + tileSize/2, tileSize/3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateHUD() {
    document.getElementById("score").textContent = `Score: ${score}`;
    document.getElementById("levelIndicator").textContent = `Level ${level + 1}`;
    document.getElementById("pauseBtn").textContent = paused ? "▶ Resume" : "⏸ Pause";
    document.getElementById("difficulty").textContent = `Difficulty: ${difficulty}`;
    document.getElementById("lives").textContent = `❤️ Lives: ${lives}`;
    document.getElementById("timerBar").style.width = `${(timer / 30) * 100}%`;
    
    const timerBar = document.getElementById("timerBar");
    if (timer < 10) {
        timerBar.style.backgroundColor = "#f00";
    } else if (timer < 20) {
        timerBar.style.backgroundColor = "#ff0";
    } else {
        timerBar.style.backgroundColor = "#66fcf1";
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze(mazes[level]);
    drawEntities();
    updateHUD();
}

// Game logic
function canMoveTo(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
    if (glitchWalls.includes(`${x},${y}`)) return true;
    return mazes[level][y][x] === 0;
}

function movePlayer(dx, dy) {
    if (paused || !gameRunning) return;
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (canMoveTo(newX, newY)) {
        player.x = newX;
        player.y = newY;
        score--;
        
        checkGoal();
        checkPowerUps();
        checkRedBallCollision();
        render();
    }
}

function checkPowerUps() {
    const idx = powerUps.findIndex(p => p.x === player.x && p.y === player.y);
    if (idx > -1) {
        score += 100;
        powerUps.splice(idx, 1);
        const originalSpeed = redBallSpeed;
        redBallSpeed = Math.max(100, redBallSpeed - 200);
        setTimeout(() => {
            redBallSpeed = originalSpeed;
        }, 5000);
    }
}

function checkRedBallCollision() {
    if (player.x === redBall.x && player.y === redBall.y) {
        lives--;
        if (lives <= 0) {
            endGame("💀 Out of lives!");
        } else {
            player = { x: 0, y: 0 };
            redBall = { x: 9, y: 0 };
            timer = 30;
            render();
        }
    }
}

function checkGoal() {
    if (player.x === goal.x && player.y === goal.y) {
        level++;
        if (level >= mazes.length) {
            endGame("🎉 You completed all levels!");
            return;
        }
        
        player = { x: 0, y: 0 };
        redBall = { x: 9, y: 0 };
        timer = 30;
        powerUps = [];
        score += 500;
        redBallSpeed = Math.max(200, redBallSpeed - 50);
        render();
    }
}

// Game systems
function glitchCycle() {
    if (!gameRunning || paused) return;
    
    glitchWalls = [];
    const maze = mazes[level];
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y][x] === 1 && Math.random() < 0.1) {
                glitchWalls.push(`${x},${y}`);
            }
        }
    }
    setTimeout(glitchCycle, 3000);
}

function redBallCycle() {
    if (!gameRunning || paused) return;
    
    const directions = [];
    if (redBall.x < player.x && canMoveTo(redBall.x + 1, redBall.y)) {
        directions.push([1, 0]);
    } else if (redBall.x > player.x && canMoveTo(redBall.x - 1, redBall.y)) {
        directions.push([-1, 0]);
    }
    
    if (redBall.y < player.y && canMoveTo(redBall.x, redBall.y + 1)) {
        directions.push([0, 1]);
    } else if (redBall.y > player.y && canMoveTo(redBall.x, redBall.y - 1)) {
        directions.push([0, -1]);
    }
    
    if (directions.length === 0) {
        [[0,1],[1,0],[0,-1],[-1,0]].forEach(([dx, dy]) => {
            if (canMoveTo(redBall.x + dx, redBall.y + dy)) {
                directions.push([dx, dy]);
            }
        });
    }
    
    if (directions.length > 0) {
        const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
        redBall.x += dx;
        redBall.y += dy;
    }
    
    checkRedBallCollision();
    render();
    setTimeout(redBallCycle, redBallSpeed);
}

function spawnPowerUp() {
    if (!gameRunning || paused) return;
    
    const emptyTiles = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (mazes[level][y][x] === 0 && 
                !(x === player.x && y === player.y) && 
                !(x === redBall.x && y === redBall.y)) {
                emptyTiles.push({ x, y });
            }
        }
    }
    
    if (emptyTiles.length > 0) {
        const spot = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        powerUps.push(spot);
        
        setTimeout(() => {
            powerUps = powerUps.filter(p => !(p.x === spot.x && p.y === spot.y));
            render();
        }, 5000);
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timer = 30;
    
    timerInterval = setInterval(() => {
        if (!paused && gameRunning) {
            timer--;
            
            if (timer <= 0) {
                clearInterval(timerInterval);
                lives--;
                
                if (lives <= 0) {
                    endGame("⏳ Time's up!");
                } else {
                    player = { x: 0, y: 0 };
                    redBall = { x: 9, y: 0 };
                    timer = 30;
                    startTimer();
                    render();
                }
            }
            updateHUD();
        }
    }, 1000);
}

// Game flow
function startGame() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    document.getElementById("endScreen").style.display = "none";
    
    level = 0;
    score = 1000;
    lives = 3;
    timer = 30;
    player = { x: 0, y: 0 };
    redBall = { x: 9, y: 0 };
    powerUps = [];
    glitchWalls = [];
    
    switch (difficulty) {
        case "Easy": redBallSpeed = 800; break;
        case "Hard": redBallSpeed = 300; break;
        default: redBallSpeed = 500;
    }
    
    gameRunning = true;
    paused = false;
    
    glitchCycle();
    redBallCycle();
    spawnPowerUp();
    setInterval(spawnPowerUp, 8000);
    startTimer();
    render();
}

function endGame(message) {
    gameRunning = false;
    clearInterval(timerInterval);
    
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("endScreen").style.display = "flex";
    document.getElementById("finalStats").textContent = `${message} Final Score: ${score}`;
}

function togglePause() {
    paused = !paused;
    if (!paused && gameRunning) {
        glitchCycle();
        redBallCycle();
    }
    render();
}

// Event listeners
document.getElementById("startBtn").addEventListener("click", () => {
    const selected = prompt("Select Difficulty: Easy, Medium, or Hard", "Medium");
    if (selected && ["Easy", "Medium", "Hard"].includes(selected)) {
        difficulty = selected;
    }
    startGame();
});

document.getElementById("pauseBtn").addEventListener("click", togglePause);

document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;
    
    switch (e.key) {
        case "ArrowUp": movePlayer(0, -1); break;
        case "ArrowDown": movePlayer(0, 1); break;
        case "ArrowLeft": movePlayer(-1, 0); break;
        case "ArrowRight": movePlayer(1, 0); break;
        case "p": case "P": togglePause(); break;
    }
});