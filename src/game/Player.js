import { GAME_CONFIG } from '../utils/constants.js';

// Safe rounded-rect helper
function rRect(ctx, x, y, w, h, r = 0) {
  const rad = Math.min(Math.abs(r), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y,     x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h,     x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y,         x + rad, y, rad);
  ctx.closePath();
}

export class Player {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth  = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.width  = GAME_CONFIG.PLAYER_WIDTH;
    this.height = GAME_CONFIG.PLAYER_HEIGHT;
    this.x  = canvasWidth / 2 - this.width / 2;
    this.y  = canvasHeight - GAME_CONFIG.GROUND_Y_OFFSET - this.height;
    this.vx = 0;

    this.isMovingLeft  = false;
    this.isMovingRight = false;

    this.walkCycle  = 0;
    this.bobTimer   = 0;
    this.idleTimer  = 0;
    this.facingLeft = false;
  }

  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }

  setInput(left, right) {
    this.isMovingLeft  = left;
    this.isMovingRight = right;
    if (left && !right)  this.facingLeft = true;
    if (right && !left)  this.facingLeft = false;
  }

  update(dt) {
    const accel  = GAME_CONFIG.PLAYER_ACCEL;
    const decel  = GAME_CONFIG.PLAYER_DECEL;
    const maxSpd = GAME_CONFIG.PLAYER_SPEED;

    if (this.isMovingLeft && !this.isMovingRight)        this.vx -= accel * dt;
    else if (this.isMovingRight && !this.isMovingLeft)   this.vx += accel * dt;
    else {
      const dec = decel * dt;
      if      (this.vx > 0) this.vx = Math.max(0, this.vx - dec);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + dec);
    }
    this.vx = Math.max(-maxSpd, Math.min(maxSpd, this.vx));
    this.x += this.vx * dt;

    if (this.x < 0)                             { this.x = 0;                             this.vx = 0; }
    if (this.x > this.canvasWidth - this.width) { this.x = this.canvasWidth - this.width; this.vx = 0; }

    this.bobTimer  += dt;
    this.idleTimer += dt;
    if (Math.abs(this.vx) > 30) {
      this.walkCycle = (this.walkCycle + dt * 6) % 1;
    }
  }

  resize(canvasWidth, canvasHeight) {
    const rx = canvasWidth / this.canvasWidth;
    this.x = Math.max(0, Math.min(this.x * rx, canvasWidth - this.width));
    this.canvasWidth  = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.y = canvasHeight - GAME_CONFIG.GROUND_Y_OFFSET - this.height;
  }

  draw(ctx) {
    const isWalking = Math.abs(this.vx) > 30;
    const bob = isWalking
      ? Math.sin(this.bobTimer * 14) * 2.5
      : Math.sin(this.idleTimer * 2.0) * 1.2;

    const px = Math.round(this.x);
    const py = Math.round(this.y + bob);
    const w  = this.width;
    const h  = this.height;

    ctx.save();
    ctx.translate(px + w / 2, py);

    if (this.facingLeft) ctx.scale(-1, 1);

    // ── 1. Soft Shadow on the ground ──
    ctx.save();
    ctx.globalAlpha = 0.35;
    const shadow = ctx.createRadialGradient(0, h + 3, 2, 0, h + 3, w * 0.55);
    shadow.addColorStop(0,   'rgba(0, 0, 0, 0.8)');
    shadow.addColorStop(1,   'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, h + 3, w * 0.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── 2. Legs & Shoes ──
    const legSwing = isWalking ? Math.sin(this.walkCycle * Math.PI * 2) * 8 : 0;
    const legW = w * 0.24;
    const legH = h * 0.25;
    const legY = h * 0.72;

    // Left leg
    ctx.save();
    ctx.translate(-w * 0.16, legY);
    ctx.rotate(legSwing * 0.04);
    ctx.fillStyle = '#1e243a';
    rRect(ctx, -legW / 2, 0, legW, legH, 4);
    ctx.fill();
    // Shoe
    ctx.fillStyle = '#f0f0f0';
    rRect(ctx, -legW / 2 - 2, legH - 5, legW + 5, 8, 3);
    ctx.fill();
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(w * 0.16, legY);
    ctx.rotate(-legSwing * 0.04);
    ctx.fillStyle = '#1e243a';
    rRect(ctx, -legW / 2, 0, legW, legH, 4);
    ctx.fill();
    // Shoe
    ctx.fillStyle = '#f0f0f0';
    rRect(ctx, -legW / 2 - 2, legH - 5, legW + 5, 8, 3);
    ctx.fill();
    ctx.restore();

    // ── 3. CIC Red Hoodie Body (Centered & Perfectly Symmetric) ──
    const bodyW = w * 0.78;
    const bodyH = h * 0.44;
    const bodyY = h * 0.33;

    ctx.save();
    ctx.shadowColor = 'rgba(200, 16, 46, 0.4)';
    ctx.shadowBlur  = 12;

    const bodyGrad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
    bodyGrad.addColorStop(0,   '#E82344');
    bodyGrad.addColorStop(0.5, '#C8102E');
    bodyGrad.addColorStop(1,   '#8B0A1F');
    ctx.fillStyle = bodyGrad;

    rRect(ctx, -bodyW / 2, bodyY, bodyW, bodyH, 10);
    ctx.fill();
    ctx.restore();

    // Hoodie pocket / highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    rRect(ctx, -bodyW * 0.42, bodyY + 3, bodyW * 0.84, bodyH * 0.20, 6);
    ctx.fill();

    // Zipper line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, bodyY + 4);
    ctx.lineTo(0, bodyY + bodyH - 4);
    ctx.stroke();
    ctx.restore();

    // CIC Branding on Chest
    ctx.fillStyle    = '#ffffff';
    ctx.font         = `900 ${Math.round(w * 0.24)}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CIC', 0, bodyY + bodyH * 0.52);

    // ── 4. Arms & Hands ──
    const armSwing = isWalking
      ? Math.sin(this.walkCycle * Math.PI * 2) * 0.25
      : Math.sin(this.idleTimer * 2) * 0.05;
    const armW = w * 0.18;
    const armH = h * 0.28;
    const armY = h * 0.36;

    // Left arm
    ctx.save();
    ctx.translate(-bodyW / 2 - 2, armY);
    ctx.rotate(armSwing);
    ctx.fillStyle = '#C8102E';
    rRect(ctx, -armW / 2, 0, armW, armH, 5);
    ctx.fill();
    ctx.fillStyle = '#F5C094';
    ctx.beginPath();
    ctx.arc(0, armH + 3, armW * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(bodyW / 2 + 2, armY);
    ctx.rotate(-armSwing);
    ctx.fillStyle = '#C8102E';
    rRect(ctx, -armW / 2, 0, armW, armH, 5);
    ctx.fill();
    ctx.fillStyle = '#F5C094';
    ctx.beginPath();
    ctx.arc(0, armH + 3, armW * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── 5. Hoodie Collar / Neck ──
    ctx.fillStyle = '#A00C22';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.34, w * 0.26, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── 6. Head & Face ──
    const headR  = w * 0.36;
    const headCY = h * 0.22;

    // Hair Back Layer
    ctx.fillStyle = '#1e140c';
    ctx.beginPath();
    ctx.ellipse(0, headCY - headR * 0.12, headR * 1.05, headR * 0.85, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Face Skin
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur  = 6;
    const face = ctx.createRadialGradient(-headR * 0.1, headCY - headR * 0.2, 2, 0, headCY, headR);
    face.addColorStop(0,   '#F8CDA8');
    face.addColorStop(0.7, '#F0B88C');
    face.addColorStop(1,   '#DFA070');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.ellipse(0, headCY, headR * 0.9, headR, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hair Strands (Front)
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.ellipse(-headR * 0.42, headCY - headR * 0.65, headR * 0.32, headR * 0.26, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, headCY - headR * 0.82, headR * 0.28, headR * 0.24, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.42, headCY - headR * 0.65, headR * 0.32, headR * 0.26, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeY = headCY + headR * 0.04;
    const eyeSpacing = headR * 0.38;

    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse( eyeSpacing, eyeY, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#1c1b2c';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY + 0.5, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse( eyeSpacing, eyeY + 0.5, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeSpacing - 1.5, eyeY - 2, 1.8, 0, Math.PI * 2);
    ctx.arc( eyeSpacing - 1.5, eyeY - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#2a1a10';
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - headR * 0.22, eyeY - headR * 0.32);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY - headR * 0.44, -eyeSpacing + headR * 0.22, eyeY - headR * 0.30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(eyeSpacing - headR * 0.22, eyeY - headR * 0.30);
    ctx.quadraticCurveTo(eyeSpacing, eyeY - headR * 0.44, eyeSpacing + headR * 0.22, eyeY - headR * 0.32);
    ctx.stroke();

    // Smile
    ctx.strokeStyle = '#8B3A1A';
    ctx.lineWidth   = 2.0;
    ctx.beginPath();
    ctx.arc(0, eyeY + headR * 0.32, headR * 0.24, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Cute Cheeks Blush
    ctx.fillStyle = 'rgba(255, 120, 100, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-headR * 0.58, eyeY + headR * 0.22, headR * 0.22, headR * 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse( headR * 0.58, eyeY + headR * 0.22, headR * 0.22, headR * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
