import { OBJECT_TYPES, GAME_CONFIG } from '../utils/constants.js';

let _id = 0;

// ── Custom draw: Graduation Cap ───────────────────────────────
function drawCap(ctx, size, g) {
  const hs = size * 0.44;

  ctx.save();

  // 1. Golden Aura Glow
  const aura = ctx.createRadialGradient(0, 0, hs * 0.2, 0, 0, hs * 1.7);
  aura.addColorStop(0,   `rgba(255, 215, 0, ${0.35 + g * 0.25})`);
  aura.addColorStop(0.6, `rgba(255, 190, 0, ${0.12 + g * 0.12})`);
  aura.addColorStop(1,   'rgba(255, 200, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, hs * 1.7, 0, Math.PI * 2);
  ctx.fill();

  // 2. Mortarboard Cap Diamond
  ctx.save();
  ctx.rotate(0.12);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur  = 10;

  // Solid dark-indigo to black gradient for the diamond
  const capGrad = ctx.createLinearGradient(-hs, -hs * 0.4, hs, hs * 0.4);
  capGrad.addColorStop(0,   '#282256');
  capGrad.addColorStop(0.5, '#161434');
  capGrad.addColorStop(1,   '#0c0a20');
  ctx.fillStyle = capGrad;

  ctx.beginPath();
  ctx.moveTo(-hs, 0);
  ctx.lineTo(0, -hs * 0.52);
  ctx.lineTo(hs, 0);
  ctx.lineTo(0, hs * 0.52);
  ctx.closePath();
  ctx.fill();

  // Vibrant Gold Border Trim
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255, 215, 0, ${0.9 + g * 0.1})`;
  ctx.lineWidth   = 2.8;
  ctx.stroke();
  ctx.restore();

  // 3. Skullcap Base under the board
  const skullGrad = ctx.createLinearGradient(0, 0, 0, hs * 0.35);
  skullGrad.addColorStop(0, '#282256');
  skullGrad.addColorStop(1, '#0c0a20');
  ctx.fillStyle = skullGrad;
  ctx.beginPath();
  ctx.ellipse(0, hs * 0.12, hs * 0.55, hs * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 215, 0, ${0.75 + g * 0.25})`;
  ctx.lineWidth   = 1.8;
  ctx.stroke();

  // 4. Center Gold Button & Tassel
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(hs * 0.45, -hs * 0.20, 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Tassel String
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth   = 2.2;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(hs * 0.45, -hs * 0.18);
  ctx.lineTo(hs * 0.45,  hs * 0.48);
  ctx.stroke();

  // Tassel End Threads
  for (let i = 0; i < 5; i++) {
    const a = (i / 4) * Math.PI * 0.6 - Math.PI * 0.05;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(hs * 0.45, hs * 0.48);
    ctx.lineTo(hs * 0.45 + Math.cos(a) * 9, hs * 0.48 + 8 + Math.sin(a) * 5);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Custom draw: Bomb ─────────────────────────────────────────
function drawBomb(ctx, size, g) {
  const r = size * 0.37;

  ctx.save();

  // 1. Danger Red Halo
  const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.0);
  aura.addColorStop(0,   `rgba(200, 16, 46, ${0.35 + g * 0.30})`);
  aura.addColorStop(0.6, `rgba(200, 16, 46, ${0.10 + g * 0.10})`);
  aura.addColorStop(1,   'rgba(200, 16, 46, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Bomb Ball
  ctx.save();
  ctx.shadowColor = `rgba(200, 16, 46, ${0.8 + g * 0.2})`;
  ctx.shadowBlur  = 16 + g * 10;

  const ball = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
  ball.addColorStop(0,   '#444444');
  ball.addColorStop(0.4, '#1c1c1c');
  ball.addColorStop(1,   '#080808');
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Metallic Surface Shine
  const shine = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 0, -r * 0.2, -r * 0.2, r * 0.5);
  shine.addColorStop(0,   'rgba(255, 255, 255, 0.28)');
  shine.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
  shine.addColorStop(1,   'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. Glowing Red Warning Stripe
  ctx.strokeStyle = `rgba(200, 16, 46, ${0.75 + g * 0.25})`;
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, -2.4, -0.7);
  ctx.stroke();

  // 5. Skull Symbol
  ctx.fillStyle    = `rgba(255, 255, 255, ${0.85 + g * 0.15})`;
  ctx.font         = `bold ${Math.round(r * 1.15)}px sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☠', 0, 1);

  // 6. Fuse & Spark
  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r);
  ctx.bezierCurveTo(-r * 0.08, -r * 1.25, r * 0.32, -r * 1.28, r * 0.28, -r * 1.55);
  ctx.stroke();

  // Animated Fuse Spark
  const sparkX = r * 0.28;
  const sparkY = -r * 1.55;
  const blink  = (Math.sin(g * 22) + 1) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(255, 180, 0, 1)';
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = `rgba(255, 140, 0, ${0.8 + blink * 0.2})`;
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ── FallingObject class ───────────────────────────────────────
export class FallingObject {
  constructor(x, type, fallSpeed, canvasWidth, canvasHeight) {
    this.id   = ++_id;
    this.type = type;
    this.size = GAME_CONFIG.OBJECT_SIZE;
    this.x    = x - this.size / 2;
    this.y    = -this.size - 10;
    this.vx   = (Math.random() - 0.5) * 36;
    this.vy   = fallSpeed + (Math.random() - 0.5) * 30;
    this.canvasWidth  = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.rotation  = Math.random() * Math.PI * 2;
    this.rotSpeed  = (Math.random() - 0.5) * 2.2;
    this.glowTimer = Math.random() * Math.PI * 2;
    this.collected = false;
    this.offScreen = false;
    this.opacity   = 0;
  }

  update(dt) {
    if (this.collected) return;
    this.opacity    = Math.min(1, this.opacity + dt * 6);
    this.y         += this.vy * dt;
    this.x         += this.vx * dt;
    this.rotation  += this.rotSpeed * dt;
    this.glowTimer += dt * 3.0;

    if (this.x < 0)                            { this.x = 0;                            this.vx =  Math.abs(this.vx); }
    if (this.x + this.size > this.canvasWidth) { this.x = this.canvasWidth - this.size; this.vx = -Math.abs(this.vx); }
    if (this.y > this.canvasHeight + this.size + 20) this.offScreen = true;
  }

  draw(ctx) {
    if (this.collected || this.offScreen) return;
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const g  = (Math.sin(this.glowTimer) + 1) / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;

    if (this.type === OBJECT_TYPES.CAP) {
      drawCap(ctx, this.size, g);
    } else {
      drawBomb(ctx, this.size, g);
    }

    ctx.restore();
  }

  getRect() {
    const pad = this.size * 0.18;
    return {
      left:   this.x + pad,
      right:  this.x + this.size - pad,
      top:    this.y + pad,
      bottom: this.y + this.size - pad,
    };
  }
}
