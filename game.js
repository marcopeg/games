class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.score = 0;
        this.apples = [];
        this.stars = [];
    }

    preload() {
        // Audio will be created dynamically using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Resume audio context (required on mobile after user gesture)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Draw garden background
        this.drawGarden(width, height);

        // Create basket at bottom center
        this.basket = this.createBasket(width / 2, height - 100);

        // Score display
        this.scoreText = this.add.text(20, 20, '⭐ 0', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Spawn apples periodically (slower for 3-year-olds)
        this.time.addEvent({
            delay: 3500,
            callback: this.spawnApple,
            callbackScope: this,
            loop: true
        });

        // Enable input
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);

        this.draggedApple = null;

        // Create background music
        this.createBackgroundMusic();
    }

    drawGarden(width, height) {
        // Sky gradient (already in CSS background)

        // Ground
        const ground = this.add.graphics();
        ground.fillStyle(0x8B7355, 1);
        ground.fillRect(0, height - 150, width, 150);

        // Grass
        const grass = this.add.graphics();
        grass.fillStyle(0x4CAF50, 1);
        grass.fillRect(0, height - 160, width, 20);

        // Draw 3 apple trees
        const treePositions = [width * 0.2, width * 0.5, width * 0.8];
        treePositions.forEach(x => this.drawTree(x, height - 160));
    }

    drawTree(x, y) {
        const graphics = this.add.graphics();

        // Tree trunk
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(x - 20, y - 150, 40, 150);

        // Tree foliage (simple circle)
        graphics.fillStyle(0x228B22, 1);
        graphics.fillCircle(x, y - 180, 80);

        // Apples on tree
        const applePositions = [
            { dx: -40, dy: -180 },
            { dx: 20, dy: -200 },
            { dx: 40, dy: -160 },
            { dx: -20, dy: -220 }
        ];

        applePositions.forEach(pos => {
            graphics.fillStyle(0xFF0000, 1);
            graphics.fillCircle(x + pos.dx, y + pos.dy, 12);
            // Leaf
            graphics.fillStyle(0x00FF00, 1);
            graphics.fillEllipse(x + pos.dx + 8, y + pos.dy - 8, 8, 6);
        });
    }

    createBasket(x, y) {
        const basket = this.add.graphics();

        // Make basket much bigger for 3-year-old
        const width = 200;
        const height = 80;
        const topWidth = 160;

        // Shadow for depth
        basket.fillStyle(0x000000, 0.2);
        basket.fillEllipse(x, y + height + 10, width + 20, 20);

        // Basket body (trapezoid) - main structure
        basket.fillStyle(0xCD853F, 1); // Peru color (tan/brown)
        basket.beginPath();
        basket.moveTo(x - topWidth / 2, y);
        basket.lineTo(x + topWidth / 2, y);
        basket.lineTo(x + width / 2, y + height);
        basket.lineTo(x - width / 2, y + height);
        basket.closePath();
        basket.fillPath();

        // Darker shade for 3D effect
        basket.fillStyle(0x8B6914, 0.3);
        basket.beginPath();
        basket.moveTo(x + topWidth / 2, y);
        basket.lineTo(x + width / 2, y + height);
        basket.lineTo(x, y + height);
        basket.lineTo(x, y);
        basket.closePath();
        basket.fillPath();

        // Woven pattern - vertical strips
        basket.lineStyle(4, 0x8B4513, 1);
        for (let i = -topWidth / 2; i <= topWidth / 2; i += 20) {
            const bottomOffset = (i / topWidth) * (width - topWidth);
            basket.beginPath();
            basket.moveTo(x + i, y);
            basket.lineTo(x + i + bottomOffset, y + height);
            basket.strokePath();
        }

        // Horizontal strips for weave pattern
        basket.lineStyle(3, 0xDEB887, 1); // Burlywood
        for (let j = 0; j <= height; j += 15) {
            const currentWidth = topWidth + ((width - topWidth) * (j / height));
            basket.beginPath();
            basket.moveTo(x - currentWidth / 2, y + j);
            basket.lineTo(x + currentWidth / 2, y + j);
            basket.strokePath();
        }

        // Rim at the top (thicker edge)
        basket.lineStyle(8, 0x8B4513, 1);
        basket.beginPath();
        basket.moveTo(x - topWidth / 2, y);
        basket.lineTo(x + topWidth / 2, y);
        basket.strokePath();

        // Left handle
        basket.lineStyle(6, 0x8B4513, 1);
        basket.beginPath();
        basket.arc(x - topWidth / 2 - 20, y + 20, 25, -Math.PI / 2, Math.PI / 2, false);
        basket.strokePath();

        // Right handle
        basket.beginPath();
        basket.arc(x + topWidth / 2 + 20, y + 20, 25, Math.PI / 2, -Math.PI / 2, false);
        basket.strokePath();

        // Store bounds for collision (generous area)
        basket.setData('bounds', {
            x: x - width / 2,
            y: y - 20, // Start catching slightly above basket
            width: width,
            height: height + 40
        });

        return basket;
    }

    spawnApple() {
        const x = Phaser.Math.Between(100, this.scale.width - 100);
        const apple = this.add.graphics();

        // Random size for variety (between 25 and 40 pixels)
        const size = Phaser.Math.Between(25, 40);
        const stemLength = size * 1.0;
        const stemEnd = size * 1.3;

        // Apple body
        apple.fillStyle(0xFF0000, 1);
        apple.fillCircle(0, 0, size);

        // Highlight
        apple.fillStyle(0xFF6666, 0.6);
        apple.fillCircle(-size * 0.27, -size * 0.27, size * 0.4);

        // Stem
        apple.lineStyle(3, 0x8B4513, 1);
        apple.lineTo(0, -stemLength);
        apple.lineTo(size * 0.15, -stemEnd);
        apple.strokePath();

        // Leaf
        apple.fillStyle(0x00FF00, 1);
        apple.fillEllipse(size * 0.3, -stemLength - 5, size * 0.5, size * 0.33);

        apple.x = x;
        apple.y = -50;
        apple.setData('velocity', 1);
        apple.setData('isDragging', false);
        apple.setData('radius', size); // Store size for collision detection

        this.apples.push(apple);
    }

    onPointerDown(pointer) {
        // Check if pointer is over an apple (generous hit area for little fingers)
        for (let apple of this.apples) {
            const radius = apple.getData('radius') || 30;
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, apple.x, apple.y);
            if (distance < radius + 25) {
                this.draggedApple = apple;
                apple.setData('isDragging', true);
                break;
            }
        }
    }

    onPointerMove(pointer) {
        if (this.draggedApple) {
            this.draggedApple.x = pointer.x;
            this.draggedApple.y = pointer.y;
        }
    }

    onPointerUp(pointer) {
        if (this.draggedApple) {
            // Check if apple is in basket
            const basketBounds = this.basket.getData('bounds');
            if (this.checkCollision(this.draggedApple, basketBounds)) {
                // Mark as collected so update loop doesn't process it
                this.draggedApple.setData('collected', true);
                this.collectApple(this.draggedApple);

                // Remove from array
                const index = this.apples.indexOf(this.draggedApple);
                if (index > -1) {
                    this.apples.splice(index, 1);
                }
            } else {
                // Continue falling
                this.draggedApple.setData('isDragging', false);
            }
            this.draggedApple = null;
        }
    }

    checkCollision(apple, basketBounds) {
        // Check if apple center is within basket horizontal bounds
        // and if apple is at or below the top of the basket
        const isInHorizontalBounds = apple.x > basketBounds.x &&
                                     apple.x < basketBounds.x + basketBounds.width;
        const isAtBasketLevel = apple.y >= basketBounds.y &&
                               apple.y <= basketBounds.y + basketBounds.height + 20;

        return isInHorizontalBounds && isAtBasketLevel;
    }

    collectApple(apple) {
        // Create star effect
        this.createStarEffect(apple.x, apple.y);

        // Play success sound
        this.playCollectSound();

        // Destroy apple (array removal handled by caller)
        apple.destroy();

        // Increase score
        this.score++;
        this.scoreText.setText('⭐ ' + this.score);
    }

    createStarEffect(x, y) {
        const star = this.add.graphics();
        star.fillStyle(0xFFFF00, 1);
        star.lineStyle(4, 0xFFA500, 1);

        // Draw 5-pointed star
        const points = [];
        const outerRadius = 40;
        const innerRadius = 20;
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            points.push(radius * Math.cos(angle));
            points.push(radius * Math.sin(angle));
        }

        star.beginPath();
        star.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            star.lineTo(points[i], points[i + 1]);
        }
        star.closePath();
        star.fillPath();
        star.strokePath();

        star.x = x;
        star.y = y;
        star.setAlpha(1);

        // Animate star
        this.tweens.add({
            targets: star,
            y: y - 100,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => star.destroy()
        });
    }

    smashApple(apple) {
        // Create smash effect
        const splat = this.add.graphics();
        splat.fillStyle(0xFF0000, 0.7);

        // Draw splatter
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = Phaser.Math.Between(20, 40);
            const x = apple.x + Math.cos(angle) * distance;
            const y = apple.y + Math.sin(angle) * distance;
            splat.fillCircle(x, y, Phaser.Math.Between(8, 15));
        }

        // Play smash sound
        this.playSmashSound();

        // Fade out splat
        this.tweens.add({
            targets: splat,
            alpha: 0,
            duration: 2000,
            onComplete: () => splat.destroy()
        });
    }

    playCollectSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playSmashSound() {
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-5 * i / bufferSize);
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        gainNode.gain.value = 0.3;

        source.start(this.audioContext.currentTime);
    }

    createBackgroundMusic() {
        // Create a simple repeating melody for background
        this.createMelody();
    }

    createMelody() {
        // Simple cheerful melody notes (C major pentatonic scale - perfect for kids!)
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
        const rhythm = [0.3, 0.3, 0.3, 0.3, 0.6, 0.3, 0.3, 0.6]; // Varied rhythm
        let noteIndex = 0;

        const playNote = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = notes[noteIndex % notes.length];
            oscillator.type = 'triangle'; // Softer, more pleasant sound

            const duration = rhythm[noteIndex % rhythm.length];
            gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime); // Quiet background music
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

            noteIndex++;
        };

        // Play a note every 400ms
        this.time.addEvent({
            delay: 400,
            callback: playNote,
            loop: true
        });

        // Start the first note
        playNote();
    }

    update() {
        // Update apples - iterate backwards to safely remove items
        for (let i = this.apples.length - 1; i >= 0; i--) {
            const apple = this.apples[i];

            // Skip if already collected
            if (apple.getData('collected')) {
                continue;
            }

            if (!apple.getData('isDragging')) {
                apple.y += apple.getData('velocity');

                // Check if apple is in basket area (even when falling naturally)
                const basketBounds = this.basket.getData('bounds');
                if (this.checkCollision(apple, basketBounds)) {
                    apple.setData('collected', true);
                    this.collectApple(apple);
                    this.apples.splice(i, 1);
                    continue;
                }

                // Check if apple hit the ground
                if (apple.y > this.scale.height - 150) {
                    this.smashApple(apple);
                    this.apples.splice(i, 1);
                    apple.destroy();
                }
            }
        }
    }
}

// Phaser configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 1,
        touch: {
            capture: true
        }
    },
    audio: {
        disableWebAudio: false
    }
};

let game;

// Detect if fullscreen API is available (iOS Safari doesn't support it)
function canFullscreen() {
    return !!(document.documentElement.requestFullscreen ||
              document.documentElement.webkitRequestFullscreen ||
              document.documentElement.msRequestFullscreen);
}

function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement || document.msFullscreenElement);
}

function requestFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {});
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('exit-button').classList.add('visible');

    if (!game) {
        game = new Phaser.Game(config);
    }

    // Try fullscreen on devices that support it
    if (canFullscreen()) {
        requestFullscreen();
    }
}

function exitGame() {
    document.getElementById('exit-button').classList.remove('visible');
    document.getElementById('start-screen').classList.remove('hidden');

    if (isFullscreen()) {
        exitFullscreen();
    }

    if (game) {
        game.destroy(true);
        game = null;
    }
}

// Start button - use touchend + click for best mobile compatibility
document.getElementById('start-button').addEventListener('click', startGame);

// Exit button (the visible X for mobile users)
document.getElementById('exit-button').addEventListener('click', (e) => {
    e.stopPropagation();
    exitGame();
});

// Listen for fullscreen changes (desktop browsers)
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'].forEach(event => {
    document.addEventListener(event, () => {
        // Only exit game if fullscreen was exited AND we didn't trigger it ourselves
        if (!isFullscreen() && game && document.getElementById('start-screen').classList.contains('hidden')) {
            exitGame();
        }
    });
});

// ESC key (desktop)
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
        if (isFullscreen()) {
            exitFullscreen();
        } else if (game) {
            exitGame();
        }
    }
});

// Prevent default touch behaviors that interfere with the game
document.addEventListener('touchmove', (e) => {
    if (game) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent pull-to-refresh and bounce scrolling
document.addEventListener('touchstart', (e) => {
    if (game && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
    }
}, { passive: false });

// Prevent double-tap zoom on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });
