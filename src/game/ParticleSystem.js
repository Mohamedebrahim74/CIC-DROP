import { PARTICLE_CONFIG, COLORS } from '../utils/constants.js';

// ── Score Popup ───────────────────────────────────────────────────────────────
class ScorePopup {
  constructor(x, y, text, color = '#FFD700') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.age = 0;
    this.duration = PARTICLE_CONFIG.SCORE_POPUP_DURATION;
    this.vy = -80; // float upward
  }

  update(dt) {
    this.age += dt;
    this.y += this.vy * dt;
    this.vy *= 0.96;
  }

  get alive() { return this.age < this.duration; }
  get alpha() { return Math.max(0, 1 - this.age / this.duration); }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = `bold 22px "Orbitron", "Arial Black", Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ── Sparkle Particle ──────────────────────────────────────────────────────────
class SparkleParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.age = 0;
    this.duration = 0.5 + Math.random() * 0.4;
    this.size = 3 + Math.random() * 4;
    this.color = Math.random() < 0.5 ? '#FFD700' : '#ffffff';
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.vy += 60 * dt; // gravity
  }

  get alive() { return this.age < this.duration; }
  get alpha() { return Math.max(0, 1 - this.age / this.duration); }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (1 - this.age / this.duration), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Explosion Particle ────────────────────────────────────────────────────────
class ExplosionParticle {
  constructor(x, y, index, total) {
    this.x = x;
    this.y = y;
    const angle = (index / total) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 100 + Math.random() * 200;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 60;
    this.age = 0;
    this.duration = 0.6 + Math.random() * 0.5;
    this.size = 4 + Math.random() * 6;
    const colors = ['#C8102E', '#FF4500', '#FF8C00', '#FFD700', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 200 * dt; // gravity
    this.vx *= 0.98;
  }

  get alive() { return this.age < this.duration; }
  get alpha() { return Math.max(0, 1 - this.age / this.duration); }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    const r = this.size * (1 - (this.age / this.duration) * 0.5);
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Level Up Flash ────────────────────────────────────────────────────────────
class LevelFlash {
  constructor() {
    this.age = 0;
    this.duration = 0.6;
  }
  update(dt) { this.age += dt; }
  get alive() { return this.age < this.duration; }
  get alpha() { return Math.max(0, (1 - this.age / this.duration) * 0.35); }
  draw(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// ── Main Particle System ──────────────────────────────────────────────────────
export class ParticleSystem {
  constructor() {
    this.popups = [];
    this.sparkles = [];
    this.explosions = [];
    this.levelFlashes = [];
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
  }

  /** Spawn score popup at position */
  spawnScorePopup(x, y, points) {
    this.popups.push(new ScorePopup(x, y - 20, `+${points}`));
  }

  /** Spawn sparkles when collecting a cap */
  spawnSparkles(x, y) {
    for (let i = 0; i < PARTICLE_CONFIG.SPARKLE_COUNT; i++) {
      this.sparkles.push(new SparkleParticle(x, y));
    }
  }

  /** Spawn explosion when hitting a bomb */
  spawnExplosion(x, y) {
    const total = PARTICLE_CONFIG.EXPLOSION_COUNT;
    for (let i = 0; i < total; i++) {
      this.explosions.push(new ExplosionParticle(x, y, i, total));
    }
    this.triggerShake();
  }

  /** Screen shake on bomb hit */
  triggerShake() {
    this.shakeTimer = PARTICLE_CONFIG.SCREEN_SHAKE_DURATION;
    this.shakeIntensity = PARTICLE_CONFIG.SCREEN_SHAKE_INTENSITY;
  }

  /** Spawn level-up flash */
  spawnLevelFlash() {
    this.levelFlashes.push(new LevelFlash());
  }

  /** @returns {{ x: number, y: number }} current shake offset */
  getShakeOffset() {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };
    const t = this.shakeTimer / PARTICLE_CONFIG.SCREEN_SHAKE_DURATION;
    const i = this.shakeIntensity * t;
    return {
      x: (Math.random() - 0.5) * 2 * i,
      y: (Math.random() - 0.5) * 2 * i,
    };
  }

  update(dt) {
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);

    this.popups = this.popups.filter(p => { p.update(dt); return p.alive; });
    this.sparkles = this.sparkles.filter(s => { s.update(dt); return s.alive; });
    this.explosions = this.explosions.filter(e => { e.update(dt); return e.alive; });
    this.levelFlashes = this.levelFlashes.filter(f => { f.update(dt); return f.alive; });
  }

  draw(ctx, canvasWidth, canvasHeight) {
    for (const f of this.levelFlashes) f.draw(ctx, canvasWidth, canvasHeight);
    for (const s of this.sparkles) s.draw(ctx);
    for (const e of this.explosions) e.draw(ctx);
    for (const p of this.popups) p.draw(ctx);
  }

  reset() {
    this.popups = [];
    this.sparkles = [];
    this.explosions = [];
    this.levelFlashes = [];
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
  }
}
