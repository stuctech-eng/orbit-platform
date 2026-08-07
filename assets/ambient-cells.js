// ORBIT Platform — ambient hero cells
// A deliberately small extraction of the real game's "Soft Pearl" cell
// material and drift physics (see games/orbit — this is NOT a copy of the
// game engine, just its visual signature, reused because it's the most
// authentic thing ORBIT has to show). Purely decorative: no scanner, no
// gameplay, no interaction.

function initAmbientCells(canvasId, count) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const cells = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 8 + Math.random() * 6; // slower than in-game — this is pure ambience
    cells.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 30 + Math.random() * 20,
      seed: Math.random() * 1000
    });
  }

  function drawCell(c, t) {
    const driftAngle = t * 0.00035 + c.seed;
    const driftX = Math.cos(driftAngle) * c.r * 0.035;
    const driftY = Math.sin(driftAngle) * c.r * 0.035;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.shadowColor = 'rgba(255,255,255,0.25)';
    ctx.shadowBlur = 28;

    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    const material = ctx.createRadialGradient(
      -c.r * 0.15 + driftX, -c.r * 0.2 + driftY, c.r * 0.2,
      0, 0, c.r * 1.05
    );
    material.addColorStop(0, 'rgba(255,255,255,0.55)');
    material.addColorStop(0.7, 'rgba(240,240,244,0.4)');
    material.addColorStop(1, 'rgba(222,224,230,0.28)');
    ctx.fillStyle = material;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.ellipse(-c.r * 0.2 + driftX, -c.r * 0.24 + driftY, c.r * 0.34, c.r * 0.22, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    ctx.restore();
  }

  let lastT = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    ctx.clearRect(0, 0, W, H);

    for (const c of cells) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      const margin = c.r + 20;
      if (c.x < margin) { c.x = margin; c.vx = Math.abs(c.vx); }
      if (c.x > W - margin) { c.x = W - margin; c.vx = -Math.abs(c.vx); }
      if (c.y < margin) { c.y = margin; c.vy = Math.abs(c.vy); }
      if (c.y > H - margin) { c.y = H - margin; c.vy = -Math.abs(c.vy); }
      drawCell(c, t);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
