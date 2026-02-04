const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 30;
const GAME_DURATION = 120; // 2 minutes
const MAX_PLAYERS = 8;

// Game rooms
const rooms = new Map();

// Player colors
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'];

// Bot names
const BOT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Omega', 'Neo', 'Cyber', 'Pixel', 'Ghost', 'Spark'];

// Bot difficulty settings
const BOT_DIFFICULTY = {
  reactionTime: 500, // Decision making interval in ms
  accuracy: 0.85, // Accuracy of pathfinding (0-1)
  aggressiveness: 0.6 // Likelihood to chase powerups vs dots (0-1)
};

// Power-up types
const POWERUPS = [
  { type: 'speed', emoji: '⚡', duration: 5000, color: '#00D4FF' },
  { type: 'ghost', emoji: '👻', duration: 5000, color: '#A855F7' },
  { type: 'killer', emoji: '💀', duration: 3000, color: '#FF0000' },
  { type: 'magnet', emoji: '🧲', duration: 5000, color: '#FFD93D' },
  { type: 'shield', emoji: '🛡️', duration: 3000, color: '#4ECDC4' },
  { type: 'rare', emoji: '💎', duration: 0, color: '#FF6B6B', instant: true }
];

// Bot class for AI players
class Bot {
  constructor(id, name, color, room) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.room = room;
    this.isBot = true;
    this.x = 0;
    this.y = 0;
    this.score = 0;
    this.level = 1;
    this.xp = 0;
    this.combo = 0;
    this.activePowerUps = [];
    this.direction = null;
    this.lastMove = Date.now();
    this.lastDecision = Date.now();
    this.skin = 'default';
    this.targetX = null;
    this.targetY = null;
    this.dotsEaten = 0;
    this.kills = 0;
    
    // Set initial position
    const pos = this.room.getRandomPosition();
    this.x = pos.x;
    this.y = pos.y;
  }

  // Calculate Manhattan distance between two points
  getDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  // Check if a position is valid (not a wall and not occupied by another player)
  isValidPosition(x, y, checkPlayers = true) {
    // Check bounds
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return false;
    }

    // Check other players (with some buffer for fairness)
    if (checkPlayers) {
      for (const player of this.room.players.values()) {
        if (player.id !== this.id && player.x === x && player.y === y) {
          return false;
        }
      }
      // Check other bots
      for (const bot of this.room.bots) {
        if (bot.id !== this.id && bot.x === x && bot.y === y) {
          return false;
        }
      }
    }

    return true;
  }

  // Get all valid neighboring positions
  getValidNeighbors(x, y, checkPlayers = true) {
    const neighbors = [];
    const directions = [
      { x: x, y: y - 1, dir: 'up' },
      { x: x, y: y + 1, dir: 'down' },
      { x: x - 1, y: y, dir: 'left' },
      { x: x + 1, y: y, dir: 'right' }
    ];

    for (const neighbor of directions) {
      if (this.isValidPosition(neighbor.x, neighbor.y, checkPlayers)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  // Find nearest dot using BFS pathfinding
  findNearestDot() {
    let nearest = null;
    let minDistance = Infinity;

    for (const dot of this.room.dots) {
      const dist = this.getDistance(this.x, this.y, dot.x, dot.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = dot;
      }
    }

    return nearest;
  }

  // Find nearest power-up
  findNearestPowerUp() {
    let nearest = null;
    let minDistance = Infinity;

    for (const powerUp of this.room.powerUps) {
      const dist = this.getDistance(this.x, this.y, powerUp.x, powerUp.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = powerUp;
      }
    }

    return nearest;
  }

  // Simple BFS pathfinding to find next move toward target
  findPathToTarget(targetX, targetY) {
    if (this.x === targetX && this.y === targetY) return null;

    const queue = [{ x: this.x, y: this.y, path: [] }];
    const visited = new Set([`${this.x},${this.y}`]);
    const maxSearch = 100; // Limit search to prevent lag

    while (queue.length > 0 && visited.size < maxSearch) {
      const current = queue.shift();

      if (current.x === targetX && current.y === targetY) {
        return current.path.length > 0 ? current.path[0] : null;
      }

      const neighbors = this.getValidNeighbors(current.x, current.y, false);
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({
            x: neighbor.x,
            y: neighbor.y,
            path: [...current.path, neighbor]
          });
        }
      }
    }

    return null; // No path found
  }

  // Get best direction based on target
  getDirectionToTarget(targetX, targetY) {
    const nextMove = this.findPathToTarget(targetX, targetY);
    if (nextMove) {
      return nextMove.dir;
    }

    // Fallback: move in general direction
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    
    const directions = [];
    if (dy < 0) directions.push('up');
    if (dy > 0) directions.push('down');
    if (dx < 0) directions.push('left');
    if (dx > 0) directions.push('right');

    // Try preferred directions first
    for (const dir of directions) {
      let newX = this.x;
      let newY = this.y;
      switch(dir) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
      }
      if (this.isValidPosition(newX, newY)) {
        return dir;
      }
    }

    // Last resort: any valid direction
    const validNeighbors = this.getValidNeighbors(this.x, this.y);
    if (validNeighbors.length > 0) {
      // Prefer continuing in same direction
      const sameDir = validNeighbors.find(n => n.dir === this.direction);
      if (sameDir) return sameDir.dir;
      
      // Pick random valid direction
      return validNeighbors[Math.floor(Math.random() * validNeighbors.length)].dir;
    }

    return null;
  }

  // Make a decision about where to move
  makeDecision() {
    const now = Date.now();
    if (now - this.lastDecision < BOT_DIFFICULTY.reactionTime) {
      return this.direction;
    }
    this.lastDecision = now;

    // Check if we have killer power-up - look for players to chase
    const hasKiller = this.activePowerUps.some(p => p.type === 'killer');
    
    if (hasKiller) {
      // Find nearest player to chase
      let nearestPlayer = null;
      let minDist = Infinity;
      
      for (const player of this.room.players.values()) {
        const dist = this.getDistance(this.x, this.y, player.x, player.y);
        if (dist < minDist && dist < 8) { // Only chase if reasonably close
          minDist = dist;
          nearestPlayer = player;
        }
      }
      
      if (nearestPlayer) {
        return this.getDirectionToTarget(nearestPlayer.x, nearestPlayer.y);
      }
    }

    // Decide between dot or powerup based on aggressiveness
    const nearestDot = this.findNearestDot();
    const nearestPowerUp = this.findNearestPowerUp();

    let target = null;
    
    if (nearestPowerUp && nearestDot) {
      const distToPowerUp = this.getDistance(this.x, this.y, nearestPowerUp.x, nearestPowerUp.y);
      const distToDot = this.getDistance(this.x, this.y, nearestDot.x, nearestDot.y);
      
      // Powerups are worth going for if they're close enough
      if (distToPowerUp <= 5 || Math.random() < BOT_DIFFICULTY.aggressiveness) {
        target = nearestPowerUp;
      } else {
        target = nearestDot;
      }
    } else if (nearestPowerUp) {
      target = nearestPowerUp;
    } else if (nearestDot) {
      target = nearestDot;
    }

    if (target) {
      // Add some "human-like" inaccuracy
      if (Math.random() > BOT_DIFFICULTY.accuracy) {
        const validNeighbors = this.getValidNeighbors(this.x, this.y);
        if (validNeighbors.length > 0) {
          return validNeighbors[Math.floor(Math.random() * validNeighbors.length)].dir;
        }
      }
      return this.getDirectionToTarget(target.x, target.y);
    }

    // No targets - wander randomly but avoid walls
    const validNeighbors = this.getValidNeighbors(this.x, this.y);
    if (validNeighbors.length > 0) {
      // Prefer not reversing direction
      const nonReverse = validNeighbors.filter(n => {
        if (this.direction === 'up') return n.dir !== 'down';
        if (this.direction === 'down') return n.dir !== 'up';
        if (this.direction === 'left') return n.dir !== 'right';
        if (this.direction === 'right') return n.dir !== 'left';
        return true;
      });
      
      if (nonReverse.length > 0) {
        return nonReverse[Math.floor(Math.random() * nonReverse.length)].dir;
      }
      return validNeighbors[Math.floor(Math.random() * validNeighbors.length)].dir;
    }

    return null;
  }

  // Update bot position
  update() {
    const now = Date.now();
    let moveDelay = 150; // Base speed

    // Speed power-up
    if (this.activePowerUps.some(p => p.type === 'speed')) {
      moveDelay = 80;
    }

    if (now - this.lastMove < moveDelay) return;

    const direction = this.makeDecision();
    if (!direction) return;

    let newX = this.x;
    let newY = this.y;

    switch(direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    // Check ghost mode for wrapping
    if (this.activePowerUps.some(p => p.type === 'ghost')) {
      if (newX < 0) newX = GRID_SIZE - 1;
      if (newX >= GRID_SIZE) newX = 0;
      if (newY < 0) newY = GRID_SIZE - 1;
      if (newY >= GRID_SIZE) newY = 0;
    }

    // Validate move
    if (this.isValidPosition(newX, newY)) {
      this.x = newX;
      this.y = newY;
      this.direction = direction;
      this.lastMove = now;
    }
  }

  // Convert bot to player-like object for game state
  toPlayerObject() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      color: this.color,
      score: this.score,
      combo: this.combo,
      level: this.level,
      activePowerUps: this.activePowerUps,
      direction: this.direction,
      isBot: true
    };
  }
}

class GameRoom {
  constructor(roomId) {
    this.id = roomId;
    this.players = new Map();
    this.bots = []; // Array of Bot instances
    this.gameState = 'waiting'; // waiting, playing, ended
    this.dots = [];
    this.powerUps = [];
    this.startTime = null;
    this.gameLoop = null;
    this.leaderboard = [];
    this.comboThresholds = [5, 10, 20, 30, 50];
    this.killFeed = [];
    this.kills = 0;
    this.powerUpsCollected = 0;
    this.io = io;
    this.gameHistory = null;
    this.botSpawner = null;
    
    // Streak tracking
    this.playerStreaks = new Map(); // playerId -> { wins: 0, bestStreak: 0 }
  }

  // Spawn bots to fill up to 4 players
  spawnBots() {
    const totalPlayers = this.players.size + this.bots.length;
    const botsNeeded = Math.max(0, 4 - totalPlayers);
    
    for (let i = 0; i < botsNeeded; i++) {
      this.addBot();
    }
  }

  // Add a single bot
  addBot() {
    if (this.players.size + this.bots.length >= MAX_PLAYERS) return;
    
    const botId = `bot_${uuidv4()}`;
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const colorIndex = (this.players.size + this.bots.length) % PLAYER_COLORS.length;
    
    const bot = new Bot(botId, botName, PLAYER_COLORS[colorIndex], this);
    this.bots.push(bot);
    
    console.log(`🤖 Bot ${botName} joined room ${this.id}`);
    
    // Notify players
    this.io.to(this.id).emit('playerJoined', { 
      name: botName, 
      playerCount: this.players.size + this.bots.length,
      isBot: true
    });
  }

  // Remove a bot
  removeBot(botId) {
    const index = this.bots.findIndex(b => b.id === botId);
    if (index !== -1) {
      const bot = this.bots[index];
      this.bots.splice(index, 1);
      
      this.io.to(this.id).emit('playerLeft', { 
        name: bot.name,
        isBot: true
      });
    }
  }

  // Remove all bots
  clearBots() {
    this.bots = [];
  }

  addPlayer(socket, playerName) {
    if (this.players.size >= MAX_PLAYERS) return false;
    
    const colorIndex = this.players.size % PLAYER_COLORS.length;
    const startPos = this.getRandomPosition();
    
    this.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      color: PLAYER_COLORS[colorIndex],
      x: startPos.x,
      y: startPos.y,
      score: 0,
      level: 1,
      xp: 0,
      combo: 0,
      activePowerUps: [],
      direction: null,
      lastMove: Date.now(),
      skin: 'default'
    });
    
    return true;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    
    // If game is still waiting, spawn bots to maintain minimum player count
    if (this.gameState === 'waiting') {
      this.spawnBots();
    }
    
    if (this.players.size === 0 && this.gameState === 'playing') {
      this.endGame();
    }
  }

  getRandomPosition() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  }

  generateDots() {
    this.dots = [];
    // Regular dots
    for (let i = 0; i < 50; i++) {
      this.dots.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        value: 1,
        type: 'normal',
        id: `dot_${i}`
      });
    }
    // Big dots (5 points)
    for (let i = 0; i < 10; i++) {
      this.dots.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        value: 5,
        type: 'big',
        id: `big_${i}`
      });
    }
  }

  spawnPowerUp() {
    if (this.powerUps.length >= 3) return;
    if (Math.random() > 0.3) return;
    
    const powerUpType = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    const pos = this.getRandomPosition();
    
    this.powerUps.push({
      ...powerUpType,
      x: pos.x,
      y: pos.y,
      id: uuidv4(),
      spawnTime: Date.now()
    });
  }

  startGame() {
    if (this.gameState === 'playing') return;
    
    this.gameState = 'playing';
    this.startTime = Date.now();
    this.generateDots();
    
    // Spawn bots to fill up to 4 players
    this.spawnBots();
    
    // Reset player positions and scores
    this.players.forEach(player => {
      const pos = this.getRandomPosition();
      player.x = pos.x;
      player.y = pos.y;
      player.score = 0;
      player.combo = 0;
      player.activePowerUps = [];
    });
    
    // Reset bot positions and scores
    this.bots.forEach(bot => {
      const pos = this.getRandomPosition();
      bot.x = pos.x;
      bot.y = pos.y;
      bot.score = 0;
      bot.combo = 0;
      bot.activePowerUps = [];
      bot.kills = 0;
      bot.dotsEaten = 0;
    });
    
    // Game loop
    this.gameLoop = setInterval(() => {
      this.update();
    }, 1000 / 30); // 30 FPS
    
    // Power-up spawning
    this.powerUpSpawner = setInterval(() => {
      this.spawnPowerUp();
    }, 5000);
    
    // End game timer
    setTimeout(() => {
      this.endGame();
    }, GAME_DURATION * 1000);
  }

  update() {
    if (this.gameState !== 'playing') return;
    
    const now = Date.now();
    
    // Update bots
    this.bots.forEach(bot => {
      bot.update();
    });
    
    // Update power-ups expiration for players
    this.players.forEach(player => {
      player.activePowerUps = player.activePowerUps.filter(p => {
        return now - p.startTime < p.duration;
      });
    });
    
    // Update power-ups expiration for bots
    this.bots.forEach(bot => {
      bot.activePowerUps = bot.activePowerUps.filter(p => {
        return now - p.startTime < p.duration;
      });
    });
    
    // Remove expired map power-ups
    this.powerUps = this.powerUps.filter(p => {
      return now - p.spawnTime < 15000; // 15s on map
    });
    
    // Check collisions
    this.checkCollisions();
    
    // Update leaderboard
    this.updateLeaderboard();
    
    // Broadcast game state
    this.broadcast();
  }

  checkCollisions() {
    // Helper function to handle dot collection
    const collectDot = (entity, dot) => {
      let points = dot.value;
      const combo = this.getComboMultiplier(entity.combo);
      points *= combo;
      
      // Check for magnet power-up
      if (entity.activePowerUps.some(p => p.type === 'magnet')) {
        points *= 1.5;
      }
      
      entity.score += Math.floor(points);
      entity.combo++;
      entity.xp = (entity.xp || 0) + points;
      
      // Level up check
      if (entity.xp >= entity.level * 100) {
        entity.level++;
        io.to(this.id).emit('levelUp', { playerId: entity.id, level: entity.level });
      }
      
      // Track dots eaten
      entity.dotsEaten = (entity.dotsEaten || 0) + 1;
    };

    // Helper function to handle power-up collection
    const collectPowerUp = (entity, p) => {
      if (p.instant) {
        entity.score += 50;
      } else {
        entity.activePowerUps.push({
          ...p,
          startTime: Date.now()
        });
      }
      this.powerUpsCollected++;
      io.to(this.id).emit('powerUpCollected', { playerId: entity.id, powerUp: p });
    };

    // Helper function to handle kill
    const handleKill = (killer, victim) => {
      if (!victim.activePowerUps.some(p => p.type === 'shield')) {
        victim.score = Math.max(0, victim.score - 20);
        victim.combo = 0;
        const newPos = this.getRandomPosition();
        victim.x = newPos.x;
        victim.y = newPos.y;
        killer.score += 30; // Kill bonus
        killer.kills = (killer.kills || 0) + 1;
        this.kills++;
        
        // Add to kill feed
        this.killFeed.unshift({
          killer: killer.name,
          victim: victim.name,
          killerColor: killer.color,
          victimColor: victim.color,
          time: Date.now()
        });
        
        // Keep only last 5 kills
        if (this.killFeed.length > 5) this.killFeed.pop();
        
        io.to(this.id).emit('playerKilled', { 
          killer: killer.id, 
          victim: victim.id,
          killFeed: this.killFeed
        });
      }
    };

    // Check player collisions
    this.players.forEach(player => {
      // Check dot collisions
      this.dots = this.dots.filter(dot => {
        if (dot.x === player.x && dot.y === player.y) {
          collectDot(player, dot);
          return false; // Remove dot
        }
        return true;
      });
      
      // Check power-up collisions
      this.powerUps = this.powerUps.filter(p => {
        if (p.x === player.x && p.y === player.y) {
          collectPowerUp(player, p);
          return false;
        }
        return true;
      });
      
      // Check player collisions (killer mode) - vs other players
      if (player.activePowerUps.some(p => p.type === 'killer')) {
        this.players.forEach(other => {
          if (other.id !== player.id && other.x === player.x && other.y === player.y) {
            handleKill(player, other);
          }
        });
        
        // Check collisions with bots
        this.bots.forEach(bot => {
          if (bot.x === player.x && bot.y === player.y) {
            handleKill(player, bot);
          }
        });
      }
    });

    // Check bot collisions
    this.bots.forEach(bot => {
      // Check dot collisions
      this.dots = this.dots.filter(dot => {
        if (dot.x === bot.x && dot.y === bot.y) {
          collectDot(bot, dot);
          return false; // Remove dot
        }
        return true;
      });
      
      // Check power-up collisions
      this.powerUps = this.powerUps.filter(p => {
        if (p.x === bot.x && p.y === bot.y) {
          collectPowerUp(bot, p);
          return false;
        }
        return true;
      });
      
      // Check bot collisions (killer mode) - vs players
      if (bot.activePowerUps.some(p => p.type === 'killer')) {
        this.players.forEach(player => {
          if (player.x === bot.x && player.y === bot.y) {
            handleKill(bot, player);
          }
        });
        
        // Check collisions with other bots
        this.bots.forEach(otherBot => {
          if (otherBot.id !== bot.id && otherBot.x === bot.x && otherBot.y === bot.y) {
            handleKill(bot, otherBot);
          }
        });
      }
    });
    
    // Respawn dots if low
    if (this.dots.length < 20) {
      for (let i = 0; i < 10; i++) {
        this.dots.push({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
          value: 1,
          type: 'normal',
          id: `respawn_${Date.now()}_${i}`
        });
      }
    }
  }

  getComboMultiplier(combo) {
    if (combo >= 50) return 5;
    if (combo >= 30) return 4;
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    return 1;
  }

  updateLeaderboard() {
    // Combine players and bots
    const allEntities = [
      ...Array.from(this.players.values()),
      ...this.bots
    ];
    
    this.leaderboard = allEntities
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        score: p.score,
        combo: p.combo,
        color: p.color,
        level: p.level,
        isBot: p.isBot || false
      }));
  }

  movePlayer(socketId, direction) {
    const player = this.players.get(socketId);
    if (!player || this.gameState !== 'playing') return;
    
    const now = Date.now();
    let moveDelay = 150; // Base speed
    
    // Speed power-up
    if (player.activePowerUps.some(p => p.type === 'speed')) {
      moveDelay = 80;
    }
    
    if (now - player.lastMove < moveDelay) return;
    player.lastMove = now;
    
    let newX = player.x;
    let newY = player.y;
    
    switch(direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }
    
    // Wall collision (with ghost mode)
    if (player.activePowerUps.some(p => p.type === 'ghost')) {
      // Wrap around
      if (newX < 0) newX = GRID_SIZE - 1;
      if (newX >= GRID_SIZE) newX = 0;
      if (newY < 0) newY = GRID_SIZE - 1;
      if (newY >= GRID_SIZE) newY = 0;
    } else {
      // Block at walls
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        return;
      }
    }
    
    player.x = newX;
    player.y = newY;
    player.direction = direction;
  }

  endGame() {
    if (this.gameState === 'ended') return;
    
    this.gameState = 'ended';
    clearInterval(this.gameLoop);
    clearInterval(this.powerUpSpawner);
    
    // Final leaderboard
    this.updateLeaderboard();
    
    // Calculate stats (include both players and bots)
    const allEntities = [...Array.from(this.players.values()), ...this.bots];
    const stats = {
      totalDotsEaten: allEntities.reduce((sum, p) => sum + (p.dotsEaten || 0), 0),
      totalKills: this.kills || 0,
      powerUpsCollected: this.powerUpsCollected || 0,
      fastestPlayer: this.leaderboard[0],
      mostKills: allEntities.sort((a, b) => (b.kills || 0) - (a.kills || 0))[0]
    };
    
    this.io.to(this.id).emit('gameEnded', {
      leaderboard: this.leaderboard,
      winner: this.leaderboard[0],
      stats: stats,
      killFeed: this.killFeed || []
    });
    
    // Store room history
    this.gameHistory = {
      date: new Date(),
      winner: this.leaderboard[0],
      players: this.leaderboard.length,
      duration: GAME_DURATION - Math.max(0, GAME_DURATION - Math.floor((Date.now() - this.startTime) / 1000))
    };
    
    // Clear bots after game ends
    this.clearBots();
  }

  broadcast() {
    // Combine real players and bots for the game state
    const allPlayers = [
      ...Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        color: p.color,
        score: p.score,
        combo: p.combo,
        level: p.level,
        activePowerUps: p.activePowerUps,
        direction: p.direction,
        isBot: false
      })),
      ...this.bots.map(b => b.toPlayerObject())
    ];
    
    const gameState = {
      players: allPlayers,
      dots: this.dots,
      powerUps: this.powerUps,
      leaderboard: this.leaderboard,
      timeRemaining: Math.max(0, GAME_DURATION - Math.floor((Date.now() - this.startTime) / 1000)),
      gameState: this.gameState
    };
    
    this.io.to(this.id).emit('gameState', gameState);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('joinRoom', ({ roomId, playerName }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom(roomId));
    }
    
    const room = rooms.get(roomId);
    
    if (room.addPlayer(socket, playerName)) {
      socket.join(roomId);
      socket.roomId = roomId;
      
      socket.emit('joinedRoom', { roomId, playerId: socket.id });
      
      // Notify others
      socket.to(roomId).emit('playerJoined', { 
        name: playerName, 
        playerCount: room.players.size 
      });
      
      // If game already started, send current state
      if (room.gameState === 'playing') {
        room.broadcast();
      }
    } else {
      socket.emit('roomFull');
    }
  });
  
  socket.on('move', (direction) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      room.movePlayer(socket.id, direction);
    }
  });
  
  socket.on('startGame', () => {
    const room = rooms.get(socket.roomId);
    if (room && room.players.size >= 1) {
      room.startGame();
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const room = rooms.get(socket.roomId);
    if (room) {
      room.removePlayer(socket.id);
      room.broadcast();
      
      // Clean up empty rooms
      if (room.players.size === 0) {
        rooms.delete(socket.roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Pacman Battle server running on port ${PORT}`);
});
