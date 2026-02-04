// game-engine.js - Standalone Client-Side Logic

// Game constants (matching original server.js)
const GRID_SIZE = 20;
const GAME_DURATION = 120; // 2 minutes
const MAX_PLAYERS = 8;

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'];
const BOT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Omega', 'Neo', 'Cyber', 'Pixel', 'Ghost', 'Spark'];

const POWERUPS = [
  { type: 'speed', emoji: '⚡', duration: 5000, color: '#00D4FF' },
  { type: 'ghost', emoji: '👻', duration: 5000, color: '#A855F7' },
  { type: 'killer', emoji: '💀', duration: 3000, color: '#FF0000' },
  { type: 'magnet', emoji: '🧲', duration: 5000, color: '#FFD93D' },
  { type: 'shield', emoji: '🛡️', duration: 3000, color: '#4ECDC4' },
  { type: 'rare', emoji: '💎', duration: 0, color: '#FF6B6B', instant: true }
];

// UUID generator polyfill
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class Bot {
  constructor(id, name, color, engine) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.engine = engine;
    this.isBot = true;
    this.x = 0;
    this.y = 0;
    this.score = 0;
    this.level = 1; // Simplified: Bots scale with player or stay static
    this.combo = 0;
    this.activePowerUps = [];
    this.direction = null;
    this.lastMove = Date.now();
    this.lastDecision = Date.now();
    this.dotsEaten = 0;
    this.kills = 0;
    
    // Personality (Randomized)
    this.difficulty = {
      reactionTime: 300 + Math.random() * 400, // 300-700ms
      accuracy: 0.7 + Math.random() * 0.3,     // 0.7-1.0
      aggressiveness: Math.random()            // 0-1
    };

    const pos = this.engine.getRandomPosition();
    this.x = pos.x;
    this.y = pos.y;
  }

  getDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  isValidPosition(x, y, checkPlayers = true) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    if (checkPlayers) {
      // Check human player
      if (this.engine.player && this.engine.player.x === x && this.engine.player.y === y) return false;
      // Check other bots
      for (const bot of this.engine.bots) {
        if (bot.id !== this.id && bot.x === x && bot.y === y) return false;
      }
    }
    return true;
  }

  getValidNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      { x: x, y: y - 1, dir: 'up' },
      { x: x, y: y + 1, dir: 'down' },
      { x: x - 1, y: y, dir: 'left' },
      { x: x + 1, y: y, dir: 'right' }
    ];
    for (const n of directions) {
      if (this.isValidPosition(n.x, n.y)) neighbors.push(n);
    }
    return neighbors;
  }

  findNearestDot() {
    let nearest = null;
    let minDistance = Infinity;
    for (const dot of this.engine.dots) {
      const dist = this.getDistance(this.x, this.y, dot.x, dot.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = dot;
      }
    }
    return nearest;
  }

  findNearestPowerUp() {
    let nearest = null;
    let minDistance = Infinity;
    for (const p of this.engine.powerUps) {
      const dist = this.getDistance(this.x, this.y, p.x, p.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = p;
      }
    }
    return nearest;
  }

  getDirectionToTarget(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    
    // Simple greedy approach first
    const preferred = [];
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) preferred.push('right'); else preferred.push('left');
        if (dy > 0) preferred.push('down'); else preferred.push('up');
    } else {
        if (dy > 0) preferred.push('down'); else preferred.push('up');
        if (dx > 0) preferred.push('right'); else preferred.push('left');
    }

    // Add remaining directions
    ['up', 'down', 'left', 'right'].forEach(d => {
        if (!preferred.includes(d)) preferred.push(d);
    });

    for (let dir of preferred) {
        let nx = this.x, ny = this.y;
        if (dir === 'up') ny--;
        if (dir === 'down') ny++;
        if (dir === 'left') nx--;
        if (dir === 'right') nx++;
        
        if (this.isValidPosition(nx, ny)) return dir;
    }
    return null;
  }

  makeDecision() {
    const now = Date.now();
    if (now - this.lastDecision < this.difficulty.reactionTime) return this.direction;
    this.lastDecision = now;

    // 1. Killer Logic
    if (this.activePowerUps.some(p => p.type === 'killer')) {
       // Chase player
       const p = this.engine.player;
       if (p && this.getDistance(this.x, this.y, p.x, p.y) < 10) {
           return this.getDirectionToTarget(p.x, p.y);
       }
    }

    // 2. Standard Logic
    const dot = this.findNearestDot();
    const power = this.findNearestPowerUp();
    let target = null;

    if (power && this.getDistance(this.x, this.y, power.x, power.y) < 6) {
        target = power; // Prioritize powerups if close
    } else if (dot) {
        target = dot;
    }

    if (target) {
         // Accuracy check
         if (Math.random() > this.difficulty.accuracy) {
             const neighbors = this.getValidNeighbors(this.x, this.y);
             if (neighbors.length) return neighbors[Math.floor(Math.random() * neighbors.length)].dir;
         }
         return this.getDirectionToTarget(target.x, target.y);
    }

    // Random wander
    const neighbors = this.getValidNeighbors(this.x, this.y);
    if (neighbors.length) return neighbors[Math.floor(Math.random() * neighbors.length)].dir;
    return null;
  }

  update() {
    const now = Date.now();
    let moveDelay = 150; 
    if (this.activePowerUps.some(p => p.type === 'speed')) moveDelay = 80;

    if (now - this.lastMove < moveDelay) return;

    const dir = this.makeDecision();
    if (!dir) return;

    let nx = this.x, ny = this.y;
    switch(dir) {
      case 'up': ny--; break;
      case 'down': ny++; break;
      case 'left': nx--; break;
      case 'right': nx++; break;
    }

    // Ghost wrapping
    if (this.activePowerUps.some(p => p.type === 'ghost')) {
        if (nx < 0) nx = GRID_SIZE - 1;
        if (nx >= GRID_SIZE) nx = 0;
        if (ny < 0) ny = GRID_SIZE - 1;
        if (ny >= GRID_SIZE) ny = 0;
    }

    if (this.isValidPosition(nx, ny)) {
      this.x = nx;
      this.y = ny;
      this.direction = dir;
      this.lastMove = now;
    }
  }
  
  toObj() {
      return { ...this, engine: undefined };
  }
}

class GameEngine {
  constructor() {
    this.dots = [];
    this.powerUps = [];
    this.bots = [];
    this.player = null;
    this.gameState = 'menu'; // menu, playing, ended, paused
    this.startTime = 0;
    this.gameLoopId = null;
    this.powerUpInterval = null;
    this.leaderboard = [];
    this.killFeed = [];
    
    // Event listeners
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) this.events[event].forEach(cb => cb(data));
  }

  init(playerName) {
    this.player = {
      id: 'local_player',
      name: playerName,
      color: PLAYER_COLORS[0],
      x: 0, 
      y: 0,
      score: 0,
      level: 1, // To be loaded from save
      xp: 0,
      combo: 0,
      activePowerUps: [],
      direction: null,
      lastMove: 0,
      kills: 0,
      dotsEaten: 0
    };
    
    // Position player
    const pos = this.getRandomPosition();
    this.player.x = pos.x;
    this.player.y = pos.y;
    
    // Generate bots
    this.bots = [];
    for(let i=0; i<4; i++) {
        this.addBot(i+1);
    }
    
    this.generateDots();
    this.gameState = 'playing';
    this.startTime = Date.now();
    
    // Start Loops
    if (this.gameLoopId) clearInterval(this.gameLoopId);
    this.gameLoopId = setInterval(() => this.update(), 1000/30);
    
    if (this.powerUpInterval) clearInterval(this.powerUpInterval);
    this.powerUpInterval = setInterval(() => this.spawnPowerUp(), 5000);
    
    this.emit('start', this.getState());
  }

  getRandomPosition() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  }

  generateDots() {
    this.dots = [];
    for (let i = 0; i < 50; i++) {
      this.dots.push({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE), value: 1, type: 'normal' });
    }
    for (let i = 0; i < 10; i++) {
      this.dots.push({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE), value: 5, type: 'big' });
    }
  }

  addBot(index) {
      const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      this.bots.push(new Bot(`bot_${index}`, name, color, this));
  }

  spawnPowerUp() {
      if (this.powerUps.length >= 3 || Math.random() > 0.4) return;
      const type = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
      const pos = this.getRandomPosition();
      this.powerUps.push({ ...type, x: pos.x, y: pos.y, id: uuidv4(), spawnTime: Date.now() });
  }

  movePlayer(dir) {
      if (this.gameState !== 'playing') return;
      const now = Date.now();
      let delay = 150;
      if (this.player.activePowerUps.some(p => p.type === 'speed')) delay = 80;
      
      if (now - this.player.lastMove < delay) return;
      
      let nx = this.player.x;
      let ny = this.player.y;
      
      switch(dir) {
          case 'up': ny--; break;
          case 'down': ny++; break;
          case 'left': nx--; break;
          case 'right': nx++; break;
      }
      
      // Ghost Logic
      if (this.player.activePowerUps.some(p => p.type === 'ghost')) {
        if (nx < 0) nx = GRID_SIZE - 1;
        if (nx >= GRID_SIZE) nx = 0;
        if (ny < 0) ny = GRID_SIZE - 1;
        if (ny >= GRID_SIZE) ny = 0;
      } else {
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return;
      }
      
      this.player.x = nx;
      this.player.y = ny;
      this.player.direction = dir;
      this.player.lastMove = now;
  }
  
  update() {
      if (this.gameState !== 'playing') return;
      
      // Time check
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (elapsed >= GAME_DURATION) {
          this.endGame();
          return;
      }

      const now = Date.now();

      // Update Bots
      this.bots.forEach(b => b.update());

      // Update Powerups (expiration)
      [this.player, ...this.bots].forEach(entity => {
          entity.activePowerUps = entity.activePowerUps.filter(p => now - p.startTime < p.duration);
      });
      this.powerUps = this.powerUps.filter(p => now - p.spawnTime < 15000);

      // Collisions
      this.checkCollisions();
      
      // Respawn dots
      if (this.dots.length < 20) {
          for(let i=0; i<5; i++) {
             this.dots.push({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE), value: 1, type: 'normal' });
          }
      }
      
      // Leaderboard
      const all = [this.player, ...this.bots];
      this.leaderboard = all.sort((a,b) => b.score - a.score).map((e,i) => ({
          rank: i+1, name: e.name, score: e.score, color: e.color, isBot: e.isBot
      }));

      // Emit State
      this.emit('state', this.getState());
  }

  checkCollisions() {
      const entities = [this.player, ...this.bots];
      
      entities.forEach(entity => {
          // Dots
          for (let i = this.dots.length - 1; i >= 0; i--) {
              const d = this.dots[i];
              if (entity.x === d.x && entity.y === d.y) {
                  let pts = d.value;
                  if (entity.combo >= 10) pts *= 2; // Simple combo logic
                  if (entity.activePowerUps.some(p => p.type === 'magnet')) pts *= 1.5;
                  
                  entity.score += Math.floor(pts);
                  entity.combo++;
                  entity.dotsEaten++;
                  this.dots.splice(i, 1);
                  
                  if (!entity.isBot) this.emit('dotEaten', pts);
              }
          }
          
          // Powerups
          for (let i = this.powerUps.length - 1; i >= 0; i--) {
              const p = this.powerUps[i];
              if (entity.x === p.x && entity.y === p.y) {
                  if (p.instant) {
                      entity.score += 50;
                  } else {
                      entity.activePowerUps.push({ ...p, startTime: Date.now() });
                  }
                  this.powerUps.splice(i, 1);
                  if (!entity.isBot) this.emit('powerUp', p);
              }
          }
      });
      
      // Player vs Bot collisions (Killer Mode)
      // If player has killer
      if (this.player.activePowerUps.some(p => p.type === 'killer')) {
          this.bots.forEach(bot => {
              if (bot.x === this.player.x && bot.y === this.player.y) {
                  this.handleKill(this.player, bot);
              }
          });
      }
      
      // If bots have killer
      this.bots.forEach(bot => {
          if (bot.activePowerUps.some(p => p.type === 'killer')) {
              // Bot vs Player
              if (bot.x === this.player.x && bot.y === this.player.y) {
                  this.handleKill(bot, this.player);
              }
              // Bot vs Bot
              this.bots.forEach(victim => {
                  if (bot !== victim && bot.x === victim.x && bot.y === victim.y) {
                      this.handleKill(bot, victim);
                  }
              });
          }
      });
  }

  handleKill(killer, victim) {
      if (victim.activePowerUps.some(p => p.type === 'shield')) return;
      
      // Respawn victim
      const pos = this.getRandomPosition();
      victim.x = pos.x;
      victim.y = pos.y;
      victim.score = Math.max(0, victim.score - 20);
      victim.combo = 0;
      
      killer.score += 30;
      killer.kills++;
      
      this.killFeed.unshift({ killer: killer.name, victim: victim.name, time: Date.now() });
      if (this.killFeed.length > 5) this.killFeed.pop();
      
      this.emit('kill', { killer, victim });
  }

  getState() {
      return {
          players: [this.player, ...this.bots.map(b => b.toObj())],
          dots: this.dots,
          powerUps: this.powerUps,
          leaderboard: this.leaderboard,
          timeRemaining: Math.max(0, GAME_DURATION - (Date.now() - this.startTime)/1000),
          gameState: this.gameState,
          killFeed: this.killFeed
      };
  }

  endGame() {
      this.gameState = 'ended';
      clearInterval(this.gameLoopId);
      clearInterval(this.powerUpInterval);
      this.emit('end', {
          winner: this.leaderboard[0],
          stats: {
              score: this.player.score,
              kills: this.player.kills,
              dots: this.player.dotsEaten
          }
      });
  }
}

// Export for window
window.GameEngine = GameEngine;