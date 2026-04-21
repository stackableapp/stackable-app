(() => {
  const GRID = 20;
  const TICK_MS = 110;

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-msg');
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('reset');

  const styles = getComputedStyle(document.documentElement);
  const COLOR_BG = styles.getPropertyValue('--bg-white').trim() || '#FAFAF7';
  const COLOR_GRID = styles.getPropertyValue('--border').trim() || '#E8E2D9';
  const COLOR_SNAKE = styles.getPropertyValue('--navy').trim() || '#120DA6';
  const COLOR_HEAD = styles.getPropertyValue('--plum').trim() || '#40062B';
  const COLOR_FOOD = styles.getPropertyValue('--pink-light').trim() || '#F2BDD6';
  const COLOR_FOOD_RING = styles.getPropertyValue('--navy').trim() || '#120DA6';

  const BEST_KEY = 'snake.best';
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = best;

  let snake, dir, nextDir, food, score, tickTimer, state;
  // state: 'idle' | 'running' | 'paused' | 'over'

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    scoreEl.textContent = score;
    placeFood();
    draw();
  }

  function placeFood() {
    while (true) {
      const x = Math.floor(Math.random() * GRID);
      const y = Math.floor(Math.random() * GRID);
      if (!snake.some(s => s.x === x && s.y === y)) {
        food = { x, y };
        return;
      }
    }
  }

  function start() {
    if (state === 'running') return;
    if (state === 'over' || state === 'idle') reset();
    state = 'running';
    overlay.classList.add('hidden');
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, TICK_MS);
  }

  function pause() {
    if (state !== 'running') return;
    state = 'paused';
    clearInterval(tickTimer);
    overlayTitle.textContent = 'Paused';
    overlayMsg.textContent = 'Press Space or tap Resume';
    startBtn.textContent = 'Resume';
    overlay.classList.remove('hidden');
  }

  function gameOver() {
    state = 'over';
    clearInterval(tickTimer);
    pauseBtn.disabled = true;
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = best;
      overlayTitle.textContent = 'New best!';
    } else {
      overlayTitle.textContent = 'Game over';
    }
    overlayMsg.textContent = `Score ${score}. Press Space to play again.`;
    startBtn.textContent = 'Play again';
    overlay.classList.remove('hidden');
  }

  function tick() {
    dir = nextDir;
    const head = {
      x: (snake[0].x + dir.x + GRID) % GRID,
      y: (snake[0].y + dir.y + GRID) % GRID,
    };

    if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const cell = w / GRID;

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(w, i * cell);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (food) {
      const fx = food.x * cell + cell / 2;
      const fy = food.y * cell + cell / 2;
      const r = cell * 0.36;
      ctx.fillStyle = COLOR_FOOD;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLOR_FOOD_RING;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (snake) {
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? COLOR_HEAD : COLOR_SNAKE;
        const pad = cell * 0.1;
        const rr = cell * 0.25;
        roundRect(ctx, seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, rr);
        ctx.fill();
      });
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function setDir(x, y) {
    if (snake.length > 1 && x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
  }

  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (state === 'running') pause();
      else start();
      return;
    }
    if (state !== 'running') return;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') setDir(0, -1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') setDir(0, 1);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') setDir(-1, 0);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') setDir(1, 0);
  });

  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!touchStart || state !== 'running') return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const threshold = 20;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', () => {
    if (state === 'running') pause();
    else if (state === 'paused') start();
  });
  resetBtn.addEventListener('click', () => {
    clearInterval(tickTimer);
    state = 'idle';
    pauseBtn.disabled = true;
    reset();
    overlayTitle.textContent = 'Ready?';
    overlayMsg.textContent = 'Press Space or tap Start';
    startBtn.textContent = 'Start';
    overlay.classList.remove('hidden');
  });

  window.addEventListener('resize', resizeCanvas);

  state = 'idle';
  reset();
  resizeCanvas();
})();
