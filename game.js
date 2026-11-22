// Star Catch — a tiny browser game, built from one prompt.
// "Build me a tiny browser game — catch the falling stars."
//
// How to play: move the paddle with Left / Right arrows (or A / D, or the
// mouse) and catch the falling stars. Gold stars are +10, pink stars are +25.
// Miss a star and you lose a life. Three lives. It gets faster as you score.
//
// The game logic lives in createGame() and knows nothing about the canvas:
// it draws through the small `g` interface below (rect, circle, star, rrect,
// text), so the same code runs in a browser and headless. The browser
// adapter is in index.html; the video for this bounty was rendered by
// running this exact code in Node and replaying its draw calls.

export function createGame(width, height) {
  const W = width;
  const H = height;
  const FLOOR = H - 30;

  // A fixed twinkling starfield so the sky is never empty.
  const sky = [];
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 90; i++) {
    sky.push({ x: rnd() * W, y: rnd() * (H - 140), r: 0.6 + rnd() * 1.6, p: rnd() * 6.28 });
  }

  const state = {
    time: 0,
    score: 0,
    lives: 3,
    level: 1,
    catches: 0,
    over: false,
    paddle: { x: W / 2 - 60, w: 120, h: 16, y: FLOOR - 16 },
    stars: [],
    particles: [],
    popups: [],
    spawnIn: 0.4,
  };

  function spawnStar() {
    const pink = rnd() < 0.18;
    state.stars.push({
      x: 30 + rnd() * (W - 60),
      y: -20,
      vy: 130 + rnd() * 60 + state.level * 15,
      r: pink ? 15 : 12 + rnd() * 6,
      rot: rnd() * 6.28,
      vr: (rnd() - 0.5) * 2.4,
      kind: pink ? 'pink' : 'gold',
      value: pink ? 25 : 10,
    });
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28;
      const sp = 60 + rnd() * 160;
      state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.5 + rnd() * 0.3, max: 0.8, r: 2 + rnd() * 3, color });
    }
  }

  // input: { left, right } booleans, or { targetX } to steer toward a point.
  function step(dt, input) {
    if (state.over) return;
    state.time += dt;

    const p = state.paddle;
    const speed = 540;
    if (input) {
      if (typeof input.targetX === 'number') {
        const cx = p.x + p.w / 2;
        const dx = input.targetX - cx;
        const move = Math.max(-speed * dt, Math.min(speed * dt, dx));
        p.x += move;
      } else {
        if (input.left) p.x -= speed * dt;
        if (input.right) p.x += speed * dt;
      }
    }
    p.x = Math.max(8, Math.min(W - p.w - 8, p.x));

    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.stars.length < 3) {
      spawnStar();
      const gap = Math.max(0.5, 0.85 - state.level * 0.05);
      state.spawnIn = gap * (0.7 + rnd() * 0.6);
    } else if (state.spawnIn <= 0) {
      state.spawnIn = 0.15;
    }

    const pcx = p.x + p.w / 2;
    for (let i = state.stars.length - 1; i >= 0; i--) {
      const s = state.stars[i];
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      const caught = s.y + s.r >= p.y && s.y - s.r <= p.y + p.h && Math.abs(s.x - pcx) <= p.w / 2 + s.r;
      if (caught) {
        state.score += s.value;
        state.catches += 1;
        state.level = Math.floor(state.score / 100) + 1;
        burst(s.x, s.y, s.kind === 'pink' ? '#ff5da2' : '#ffd23e', 14);
        state.popups.push({ x: s.x, y: s.y - 10, text: `+${s.value}`, life: 0.9, color: s.kind === 'pink' ? '#ff5da2' : '#ffd23e' });
        state.stars.splice(i, 1);
      } else if (s.y - s.r > H) {
        state.lives -= 1;
        state.popups.push({ x: s.x, y: H - 60, text: 'MISS', life: 1.0, color: '#ff4d6d' });
        state.stars.splice(i, 1);
        if (state.lives <= 0) state.over = true;
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 220 * dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.popups.length - 1; i >= 0; i--) {
      const pp = state.popups[i];
      pp.life -= dt;
      pp.y -= 34 * dt;
      if (pp.life <= 0) state.popups.splice(i, 1);
    }
  }

  function drawStar(g, cx, cy, r, rot, color) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    g.poly(pts, color);
  }

  function render(g) {
    // Night-sky background, painted as bands so the draw stream stays simple.
    const bands = 18;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const r = Math.round(11 + t * 22);
      const gg = Math.round(16 + t * 12);
      const b = Math.round(38 + t * 26);
      g.rect(0, (H * i) / bands, W, H / bands + 1, `rgb(${r},${gg},${b})`);
    }
    for (const s of sky) {
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(state.time * 1.6 + s.p));
      g.circle(s.x, s.y, s.r, `rgba(255,255,255,${tw.toFixed(2)})`);
    }

    // Falling stars, with a soft glow behind each one.
    for (const s of state.stars) {
      const glow = s.kind === 'pink' ? 'rgba(255,93,162,0.25)' : 'rgba(255,210,62,0.25)';
      g.circle(s.x, s.y, s.r * 1.9, glow);
      drawStar(g, s.x, s.y, s.r, s.rot, s.kind === 'pink' ? '#ff5da2' : '#ffd23e');
    }

    // Particles.
    for (const pt of state.particles) {
      g.circle(pt.x, pt.y, pt.r, pt.color, Math.max(0, pt.life / pt.max));
    }

    // Paddle: magenta glow bar with a bright cyan core.
    const p = state.paddle;
    g.rrect(p.x - 6, p.y - 6, p.w + 12, p.h + 12, 12, 'rgba(255,45,149,0.35)');
    g.rrect(p.x, p.y, p.w, p.h, 8, '#ff2d95');
    g.rrect(p.x + 8, p.y + 3, p.w - 16, 4, 2, '#7df9ff');

    // Score popups.
    for (const pp of state.popups) {
      g.text(pp.text, pp.x, pp.y, 22, pp.color, 'center', 'bold');
    }

    // HUD.
    g.text(`SCORE  ${state.score}`, 20, 42, 26, '#ffffff', 'left', 'bold');
    g.text(`LEVEL ${state.level}`, 20, 72, 18, '#8b93b8', 'left', 'bold');
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < state.lives ? '♥' : '♡';
    g.text(hearts, W - 20, 44, 26, '#ff4d6d', 'right', 'bold');
    g.text(`CAUGHT ${state.catches}`, W - 20, 74, 18, '#8b93b8', 'right', 'bold');

    if (state.over) {
      g.rect(0, 0, W, H, 'rgba(5,8,20,0.72)');
      g.text('GAME OVER', W / 2, H / 2 - 30, 54, '#ffffff', 'center', 'bold');
      g.text(`Final score: ${state.score}  ·  ${state.catches} stars caught`, W / 2, H / 2 + 24, 24, '#ffd23e', 'center', 'bold');
      g.text('Press R to play again', W / 2, H / 2 + 62, 18, '#8b93b8', 'center', 'bold');
    }
  }

  return { state, step, render };
}
