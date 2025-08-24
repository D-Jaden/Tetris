document.addEventListener('DOMContentLoaded', () => {
    console.log('Professional Tetris loaded');

    // Game elements
    const grid = document.querySelector('.grid');
    const miniGrid = document.querySelector('.mini-grid');
    const scoreDisplay = document.querySelector('#score');
    const startBtn = document.querySelector('#start-button');
    const gameOverDiv = document.querySelector('#game-over');
    
    // Game constants
    const GRID_WIDTH = 10;
    const GRID_HEIGHT = 20;
    const TOTAL_SQUARES = GRID_WIDTH * GRID_HEIGHT;
    
    // Game state
    let squares = [];
    let nextRandom = 0;
    let score = 0;
    let timerId = null;
    let currentPosition = 4;
    let currentRotation = 0;
    let random = 0;
    let current = [];
    let currentColor = '';
    let gameStarted = false;
    let gameEnded = false;

    // Enhanced Tetromino definitions with better collision detection
    const lTetromino = [
        [1, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1, 2],
        [GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH * 2 + 2],
        [1, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1, GRID_WIDTH * 2],
        [GRID_WIDTH, GRID_WIDTH * 2, GRID_WIDTH * 2 + 1, GRID_WIDTH * 2 + 2]
    ];

    const zTetromino = [
        [0, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1],
        [GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH * 2, GRID_WIDTH * 2 + 1],
        [0, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1],
        [GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH * 2, GRID_WIDTH * 2 + 1]
    ];

    const tTetromino = [
        [1, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2],
        [1, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH * 2 + 1],
        [GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH * 2 + 1],
        [1, GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1]
    ];

    const oTetromino = [
        [0, 1, GRID_WIDTH, GRID_WIDTH + 1],
        [0, 1, GRID_WIDTH, GRID_WIDTH + 1],
        [0, 1, GRID_WIDTH, GRID_WIDTH + 1],
        [0, 1, GRID_WIDTH, GRID_WIDTH + 1]
    ];

    const iTetromino = [
        [1, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1, GRID_WIDTH * 3 + 1],
        [GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH + 3],
        [1, GRID_WIDTH + 1, GRID_WIDTH * 2 + 1, GRID_WIDTH * 3 + 1],
        [GRID_WIDTH, GRID_WIDTH + 1, GRID_WIDTH + 2, GRID_WIDTH + 3]
    ];

    const theTetrominoes = [lTetromino, zTetromino, tTetromino, oTetromino, iTetromino];
    const colors = ['l', 'z', 't', 'o', 'i'];

    // Initialize game
    function initGame() {
        // Generate main grid
        grid.innerHTML = '';
        for (let i = 0; i < TOTAL_SQUARES; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
        }

        // Generate preview grid
        miniGrid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const div = document.createElement('div');
            miniGrid.appendChild(div);
        }

        squares = Array.from(grid.querySelectorAll('div'));
        
        // Reset game state
        score = 0;
        scoreDisplay.textContent = score;
        currentPosition = 4;
        currentRotation = 0;
        gameEnded = false;
        gameOverDiv.style.display = 'none';
        
        // Initialize first pieces
        random = Math.floor(Math.random() * theTetrominoes.length);
        nextRandom = Math.floor(Math.random() * theTetrominoes.length);
        current = theTetrominoes[random][currentRotation];
        currentColor = colors[random];
        
        displayShape();
    }

    // Enhanced boundary checking
    function isValidPosition(position, rotation, tetromino) {
        const shape = theTetrominoes[tetromino][rotation];
        
        return shape.every(index => {
            const newPos = position + index;
            const row = Math.floor(position / GRID_WIDTH);
            const newRow = Math.floor(newPos / GRID_WIDTH);
            const col = position % GRID_WIDTH;
            const newCol = newPos % GRID_WIDTH;
            
            // Check vertical bounds
            if (newPos < 0 || newPos >= TOTAL_SQUARES) {
                return false;
            }
            
            // Check horizontal wrapping (improved)
            if (Math.abs(newCol - col) > 3) {
                return false;
            }
            
            // Check if square is already taken
            if (squares[newPos].classList.contains('taken')) {
                return false;
            }
            
            return true;
        });
    }

    // Draw tetromino
    function draw() {
        current.forEach(index => {
            const cellIndex = currentPosition + index;
            if (cellIndex >= 0 && cellIndex < squares.length) {
                squares[cellIndex].classList.add('tetromino', currentColor);
            }
        });
    }

    // Undraw tetromino
    function undraw() {
        current.forEach(index => {
            const cellIndex = currentPosition + index;
            if (cellIndex >= 0 && cellIndex < squares.length) {
                squares[cellIndex].classList.remove('tetromino', currentColor);
            }
        });
    }

    // Move down with improved collision
    function moveDown() {
        undraw();
        
        if (isValidPosition(currentPosition + GRID_WIDTH, currentRotation, random)) {
            currentPosition += GRID_WIDTH;
            draw();
        } else {
            draw();
            freeze();
        }
    }

    // Freeze piece and spawn new one
    function freeze() {
        current.forEach(index => {
            const cellIndex = currentPosition + index;
            if (cellIndex >= 0 && cellIndex < squares.length) {
                squares[cellIndex].classList.add('taken', currentColor);
                squares[cellIndex].classList.remove('tetromino');
            }
        });
        
        // Spawn new piece
        random = nextRandom;
        nextRandom = Math.floor(Math.random() * theTetrominoes.length);
        currentRotation = 0;
        current = theTetrominoes[random][currentRotation];
        currentColor = colors[random];
        currentPosition = 4;
        
        // Check game over
        if (!isValidPosition(currentPosition, currentRotation, random)) {
            gameOver();
            return;
        }
        
        draw();
        displayShape();
        addScore();
    }

    // Move left with boundary checking
    function moveLeft() {
        undraw();
        
        if (isValidPosition(currentPosition - 1, currentRotation, random)) {
            currentPosition -= 1;
        }
        
        draw();
    }

    // Move right with boundary checking
    function moveRight() {
        undraw();
        
        if (isValidPosition(currentPosition + 1, currentRotation, random)) {
            currentPosition += 1;
        }
        
        draw();
    }

    // Rotate with improved collision detection
    function rotate() {
        undraw();
        const nextRotation = (currentRotation + 1) % 4;
        
        if (isValidPosition(currentPosition, nextRotation, random)) {
            currentRotation = nextRotation;
            current = theTetrominoes[random][currentRotation];
        }
        
        draw();
    }

    // Enhanced preview display
    function displayShape() {
        const displaySquares = document.querySelectorAll('.mini-grid div');
        
        // Clear preview
        displaySquares.forEach(square => {
            square.classList.remove('tetromino', ...colors);
        });
        
        // Show next piece centered in 4x4 grid
        const nextShape = theTetrominoes[nextRandom][0];
        const nextColor = colors[nextRandom];
        
        nextShape.forEach(index => {
            if (index < 16) {
                displaySquares[index].classList.add('tetromino', nextColor);
            }
        });
    }

    // Enhanced scoring system
    function addScore() {
        let linesCleared = 0;
        
        for (let i = 0; i < TOTAL_SQUARES; i += GRID_WIDTH) {
            const row = [];
            for (let j = 0; j < GRID_WIDTH; j++) {
                row.push(i + j);
            }
            
            if (row.every(index => squares[index].classList.contains('taken'))) {
                linesCleared++;
                
                // Clear the row
                row.forEach(index => {
                    squares[index].className = '';
                });
                
                // Move everything above down
                const squaresRemoved = squares.splice(i, GRID_WIDTH);
                squares = squaresRemoved.concat(squares);
                squares.forEach(cell => grid.appendChild(cell));
            }
        }
        
        // Score based on lines cleared
        const lineScores = [0, 40, 100, 300, 1200];
        if (linesCleared > 0) {
            score += lineScores[linesCleared] || 1200;
            scoreDisplay.textContent = score;
        }
    }

    // Game over
    function gameOver() {
        gameEnded = true;
        clearInterval(timerId);
        timerId = null;
        gameStarted = false;
        startBtn.textContent = 'Start Game';
        gameOverDiv.style.display = 'block';
        
        setTimeout(() => {
            gameOverDiv.style.display = 'none';
        }, 3000);
    }

    // Start/pause game
    startBtn.addEventListener('click', () => {
        if (gameEnded) {
            initGame();
        }
        
        if (timerId) {
            // Pause game
            clearInterval(timerId);
            timerId = null;
            gameStarted = false;
            startBtn.textContent = 'Resume';
        } else {
            // Start/resume game
            if (!gameStarted) {
                if (gameEnded) {
                    initGame();
                }
                draw();
                gameStarted = true;
            }
            timerId = setInterval(moveDown, 800);
            startBtn.textContent = 'Pause';
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameStarted || gameEnded) return;
        
        switch(e.keyCode) {
            case 37: // Left arrow
                e.preventDefault();
                moveLeft();
                break;
            case 38: // Up arrow
                e.preventDefault();
                rotate();
                break;
            case 39: // Right arrow
                e.preventDefault();
                moveRight();
                break;
            case 40: // Down arrow
                e.preventDefault();
                moveDown();
                break;
            case 32: // Spacebar - pause
                e.preventDefault();
                startBtn.click();
                break;
        }
    });

    // Initialize the game
    initGame();
});