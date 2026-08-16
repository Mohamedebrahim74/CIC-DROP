import { Player }           from './Player.js';
import { DifficultyManager } from './DifficultyManager.js';
import { SpawnManager }      from './SpawnManager.js';
import { CollisionSystem }   from './CollisionSystem.js';
import { ParticleSystem }    from './ParticleSystem.js';
import { OBJECT_TYPES, SCORE_CONFIG } from '../utils/constants.js';

function buildStars(w, h, count = 90) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.45,
    r: Math.random() * 1.5 + 0.3,
    alpha: 0.3 + Math.random() * 0.7,
    speed: 0.8 + Math.random() * 2.2,
    offset: Math.random() * Math.PI * 2,
  }));
}

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.width   = canvas.width;
    this.height  = canvas.height;
    this.callbacks = {
      onScoreChange: () => {},
      onLevelChange: () => {},
      onGameOver:    () => {},
      ...callbacks,
    };

    this.player     = new Player(this.width, this.height);
    this.difficulty = new DifficultyManager();
    this.spawn      = new SpawnManager(this.width, this.height);
    this.particles  = new ParticleSystem();

    this.score    = 0;
    this.gameTime = 0;
    this.running  = false;
    this.paused   = false;
    this.rafId    = null;
    this.lastTime = null;

    this.stars = buildStars(this.width, this.height);

    // Background Image
    this.bgImage = new Image();
    this.bgImageLoaded = false;
    this.bgImage.onload = () => {
      this.bgImageLoaded = true;
    };
    this.bgImage.src = '/cic-bg.jpg';
  }

  start() {
    this.running = true;
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this._loop.bind(this));
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastTime = null;
  }

  setInput(left, right) {
    this.player.setInput(left, right);
  }

  resize(w, h) {
    const oldW = this.width;
    this.width  = w;
    this.height = h;
    this.canvas.width  = w;
    this.canvas.height = h;
    this.player.resize(w, h);
    this.spawn.resize(w, h);
    this.stars = buildStars(w, h);
  }

  _loop(ts) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this._loop.bind(this));
    if (this.paused) return;

    const raw = this.lastTime == null ? 0 : (ts - this.lastTime) / 1000;
    this.lastTime = ts;
    const dt = Math.min(raw, 0.05);

    try {
      this._update(dt);
      this._render();
    } catch (err) {
      console.error('[GameEngine Frame Error]:', err);
    }
  }

  _update(dt) {
    this.gameTime += dt;

    // 1. Difficulty & Level
    const levelChanged = this.difficulty.update(this.score);
    if (levelChanged) {
      this.callbacks.onLevelChange(this.difficulty.level);
      this.particles.spawnLevelFlash();
    }

    // 2. Player
    this.player.update(dt);

    // 3. Falling Objects
    this.spawn.update(dt, this.difficulty);
    const activeObjects = this.spawn.updateObjects(dt);

    // 4. Collisions
    const hits = CollisionSystem.check(this.player, activeObjects);

    for (const hit of hits) {
      const obj = hit.object;
      const cx  = obj.x + obj.size / 2;
      const cy  = obj.y + obj.size / 2;

      if (hit.type === OBJECT_TYPES.CAP) {
        this.score += SCORE_CONFIG.CAP_POINTS;
        this.callbacks.onScoreChange(this.score);
        this.particles.spawnScorePopup(cx, cy, SCORE_CONFIG.CAP_POINTS);
        this.particles.spawnSparkles(cx, cy);
      } else {
        this.particles.spawnExplosion(cx, cy);
        this.running = false;
        setTimeout(() => {
          this.callbacks.onGameOver(this.score, this.difficulty.level);
        }, 400);
        return;
      }
    }

    // 5. Particles
    this.particles.update(dt);
  }

  _render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const t = this.gameTime;

    ctx.save();

    // Screen Shake
    const shake = this.particles.getShakeOffset();
    if (shake.x !== 0 || shake.y !== 0) {
      ctx.translate(shake.x, shake.y);
    }

    // ── 1. Background (Campus Dusk) ─────────────────────────
    if (this.bgImageLoaded && this.bgImage.naturalWidth > 0) {
      const imgW = this.bgImage.naturalWidth;
      const imgH = this.bgImage.naturalHeight;
      const scale = Math.max(w / imgW, h / imgH);
      const nw = imgW * scale;
      const nh = imgH * scale;
      const ox = (w - nw) / 2;
      const oy = (h - nh) / 2;

      ctx.drawImage(this.bgImage, ox, oy, nw, nh);

      // Contrast overlay for arcade game clarity
      const darkGrad = ctx.createLinearGradient(0, 0, 0, h);
      darkGrad.addColorStop(0,   'rgba(4, 7, 20, 0.35)');
      darkGrad.addColorStop(0.5, 'rgba(6, 10, 26, 0.25)');
      darkGrad.addColorStop(0.8, 'rgba(8, 12, 32, 0.40)');
      darkGrad.addColorStop(1,   'rgba(4, 6, 18, 0.70)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, w, h);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0,    '#050818');
      sky.addColorStop(0.5,  '#0d1435');
      sky.addColorStop(0.85, '#161c44');
      sky.addColorStop(1,    '#080c1e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
    }

    // ── 2. Twinkling Sky Stars ──────────────────────────────
    for (const s of this.stars) {
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.offset));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── 3. Falling Objects ──────────────────────────────────
    for (const obj of this.spawn.objects) {
      obj.draw(ctx);
    }

    // ── 4. Player Character ─────────────────────────────────
    this.player.draw(ctx);

    // ── 5. Particle Popups & FX ─────────────────────────────
    this.particles.draw(ctx, w, h);

    ctx.restore();
  }
}
