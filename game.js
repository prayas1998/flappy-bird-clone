// Game elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameIntro = document.getElementById('gameIntro');
const gameOver = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const currentScoreElement = document.getElementById('currentScore');
const finalScoreElement = document.getElementById('finalScore');

// Game settings
const gravity = 0.5;
const flapStrength = -8;
const pipeWidth = 80;
const pipeGap = 150;
const pipeSpacing = 200;
const gameSpeed = 2;

// Game state
let gameRunning = false;
let countdownActive = false;
let countdownValue = 3;
let score = 0;
let frames = 0;
let bird;
let pipes = [];
let backgrounds = [];
let clouds = [];

// Assets
const birdImg = new Image();
birdImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHBhdGggZmlsbD0iI2Y4YzMwMCIgZD0iTTEwLDEwIEw1LDIwIEwxMCwzMCBMMzAsMzAgTDM1LDIwIEwzMCwxMCBaIj48L3BhdGg+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEwLDE0IEwxMCwyNiBMMzAsMjYgTDMwLDE0IHoiPjwvcGF0aD48Y2lyY2xlIGZpbGw9IiMwMDAiIGN4PSIyOCIgY3k9IjE2IiByPSIzIj48L2NpcmNsZT48cGF0aCBkPSJNMTUsMjAgQzE1LDIyIDE4LDI0IDIwLDIwIiBzdHJva2U9Im9yYW5nZSIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIj48L3BhdGg+PC9zdmc+';

// Set canvas dimensions
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Bird class
class Bird {
    constructor() {
        this.x = canvas.width / 4;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.width = 40;
        this.height = 40;
        this.rotation = 0;
    }

    update() {
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Rotation based on velocity
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velocity * 0.05));
        
        // Prevent bird from going off screen
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
            endGame();
        }
        
        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }
    }

    flap() {
        this.velocity = flapStrength;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(birdImg, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
}

// Pipe class
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.scored = false;
        
        // Randomize the gap position
        const minHeight = 50;
        const maxHeight = canvas.height - pipeGap - minHeight;
        this.topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        this.bottomY = this.topHeight + pipeGap;
    }

    update() {
        this.x -= gameSpeed;
        
        // Check if bird passed the pipe
        if (!this.scored && bird.x > this.x + pipeWidth) {
            score++;
            currentScoreElement.textContent = score;
            this.scored = true;
        }

        // Collision detection
        if (
            // Bird is at pipe position (X-axis)
            bird.x + bird.width > this.x && 
            bird.x < this.x + pipeWidth &&
            // Bird collides with top or bottom pipe (Y-axis)
            (bird.y < this.topHeight || bird.y + bird.height > this.bottomY)
        ) {
            endGame();
        }
    }

    draw() {
        // Top pipe (green rectangle with darker border)
        ctx.fillStyle = '#4EC0CA';
        ctx.fillRect(this.x, 0, pipeWidth, this.topHeight);
        
        // Top pipe cap
        ctx.fillStyle = '#3AA1AB';
        ctx.fillRect(this.x - 5, this.topHeight - 20, pipeWidth + 10, 20);
        
        // Bottom pipe
        ctx.fillStyle = '#4EC0CA';
        ctx.fillRect(this.x, this.bottomY, pipeWidth, canvas.height - this.bottomY);
        
        // Bottom pipe cap
        ctx.fillStyle = '#3AA1AB';
        ctx.fillRect(this.x - 5, this.bottomY, pipeWidth + 10, 20);
    }
}

// Background elements for parallax effect
class Background {
    constructor(y, height, speed, color) {
        this.x = 0;
        this.y = y;
        this.width = canvas.width * 2;
        this.height = height;
        this.speed = speed;
        this.color = color;
    }

    update() {
        this.x -= this.speed;
        if (this.x <= -canvas.width) {
            this.x = 0;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + this.width, this.y, this.width, this.height);
    }
}

// Cloud class for moving clouds in background
class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * canvas.width;
        this.y = Math.random() * (canvas.height / 2 - 50);
        this.width = 70 + Math.random() * 70;
        this.height = 40 + Math.random() * 30;
        this.speed = 0.5 + Math.random() * 0.5;
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = canvas.width + Math.random() * 200;
            this.y = Math.random() * (canvas.height / 2 - 50);
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.height / 2, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 3, this.y + this.height / 2, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 3 * 2, this.y + this.height / 2, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width, this.y + this.height / 2, this.height / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize game
function init() {
    resizeCanvas();
    
    bird = new Bird();
    pipes = [];
    score = 0;
    frames = 0;
    currentScoreElement.textContent = score;
    
    // Initialize background elements
    backgrounds = [
        new Background(canvas.height - 100, 100, 1, '#8FD850'),  // Green grass
        new Background(canvas.height - 20, 20, 1.5, '#5D3A18')   // Brown dirt
    ];
    
    // Generate initial clouds
    clouds = [];
    for (let i = 0; i < 6; i++) {
        clouds.push(new Cloud());
    }
    
    // Start countdown
    startCountdown();
}

// Countdown function
function startCountdown() {
    countdownActive = true;
    countdownValue = 3;
    
    // Position bird in the middle and freeze it
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    
    // Start drawing the game
    gameRunning = false;
    drawGame();
    
    // Start countdown timer
    const countdownTimer = setInterval(() => {
        countdownValue--;
        
        if (countdownValue <= 0) {
            clearInterval(countdownTimer);
            countdownActive = false;
            gameRunning = true;
            gameLoop();
        } else {
            // Redraw with updated countdown value
            drawGame();
        }
    }, 1000);
}

// Draw function (separate from game loop for countdown)
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#1E90FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw clouds (only drawing during countdown, not updating position)
    clouds.forEach(cloud => {
        if (!countdownActive) cloud.update();
        cloud.draw();
    });
    
    // Update and draw backgrounds (only drawing during countdown, not updating position)
    backgrounds.forEach(bg => {
        if (!countdownActive) bg.update();
        bg.draw();
    });
    
    // Draw existing pipes without updating during countdown
    pipes.forEach(pipe => {
        pipe.draw();
    });
    
    // Draw bird without updating during countdown
    bird.draw();
    
    // Draw countdown text
    if (countdownActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 100px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(countdownValue, canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Get Ready!', canvas.width / 2, canvas.height / 2 + 70);
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#1E90FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw clouds
    clouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
    });
    
    // Update and draw backgrounds
    backgrounds.forEach(bg => {
        bg.update();
        bg.draw();
    });
    
    // Add new pipes
    if (frames % (pipeSpacing) === 0) {
        pipes.push(new Pipe());
    }
    
    // Update and draw pipes
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
    pipes.forEach(pipe => {
        pipe.update();
        pipe.draw();
    });
    
    // Update and draw bird
    bird.update();
    bird.draw();
    
    frames++;
    requestAnimationFrame(gameLoop);
}

// Event handlers
function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOver.style.display = 'block';
}

startButton.addEventListener('click', function() {
    gameIntro.style.display = 'none';
    init();
});

restartButton.addEventListener('click', function() {
    gameOver.style.display = 'none';
    init();
});

window.addEventListener('resize', resizeCanvas);

// Controls
window.addEventListener('keydown', function(e) {
    if ((e.code === 'Space' || e.key === ' ') && gameRunning) {
        bird.flap();
    }
});

canvas.addEventListener('click', function() {
    if (gameRunning) {
        bird.flap();
    }
});

// Touch support for mobile
canvas.addEventListener('touchstart', function(e) {
    if (gameRunning) {
        e.preventDefault();
        bird.flap();
    }
}, { passive: false });

// Initialize game when assets are loaded
window.addEventListener('load', function() {
    resizeCanvas();
}); 