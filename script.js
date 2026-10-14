(() => {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const weekdayEl = document.getElementById('weekday');
  const quoteEl = document.getElementById('quote');
  const authorEl = document.getElementById('quote-author');
  const progressEl = document.getElementById('quote-progress');
  const cursorGlow = document.getElementById('cursor-glow');
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  // Edit or add your own quotes here.
  const quotes = [
    { text: 'Not all those who wander are lost.', author: 'J. R. R. TOLKIEN' },
    { text: 'The journey of a thousand miles begins with a single step.', author: 'LAO TZU' },
    { text: 'Adventure is worthwhile in itself.', author: 'AMELIA EARHART' },
    { text: 'Wherever you go, go with all your heart.', author: 'CONFUCIUS' },
    { text: 'Collect moments, not things.', author: 'UNKNOWN' },
    { text: 'Life is either a daring adventure or nothing at all.', author: 'HELEN KELLER' },
    { text: 'The world is wide, and I will not waste my life in one corner of it.', author: 'UNKNOWN' },
    { text: 'It always seems impossible until it’s done.', author: 'NELSON MANDELA' },
    { text: 'A good traveler has no fixed plans.', author: 'LAO TZU' },
    { text: 'Go where you feel most alive.', author: 'UNKNOWN' },
    { text: 'Some beautiful paths can’t be discovered without getting lost.', author: 'EROL OZAN' },
    { text: 'The best view comes after the hardest climb.', author: 'UNKNOWN' }
  ];
  const QUOTE_INTERVAL = 30 * 60 * 1000;
  let quoteIndex = Math.floor(Math.random() * quotes.length);
  let quoteStarted = Date.now();

  function updateClock() {
    const now = new Date();
    clockEl.textContent = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now);
    dateEl.textContent = new Intl.DateTimeFormat('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    }).format(now).toUpperCase().replace(',', ',');
    weekdayEl.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now).toUpperCase();
  }

  function setQuote(next = false) {
    if (next && quotes.length > 1) {
      let nextIndex;
      do { nextIndex = Math.floor(Math.random() * quotes.length); } while (nextIndex === quoteIndex);
      quoteIndex = nextIndex;
    }
    quoteEl.classList.add('changing');
    window.setTimeout(() => {
      quoteEl.textContent = `“${quotes[quoteIndex].text}”`;
      authorEl.textContent = `— ${quotes[quoteIndex].author} —`;
      quoteEl.classList.remove('changing');
    }, 450);
    quoteStarted = Date.now();
  }

  // Canvas particles: gentle upward drift with a spring-like pull toward the cursor.
  let width = 0, height = 0, dpr = 1;
  let particles = [];
  const pointer = { x: -1000, y: -1000, active: false };
  const rand = (min, max) => Math.random() * (max - min) + min;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(145, Math.max(55, Math.floor(width * height / 10500)));
    particles = Array.from({ length: count }, createParticle);
  }

  function createParticle() {
    const r = rand(1, 4.6);
    return {
      x: rand(0, width), y: rand(0, height), r,
      baseR: r, vx: rand(-.12, .12), vy: rand(-.48, -.12),
      alpha: rand(.18, .68), phase: rand(0, Math.PI * 2),
      wobble: rand(.15, .55), attracted: 0
    };
  }

  function drawParticle(p) {
    const grad = ctx.createRadialGradient(p.x - p.r * .28, p.y - p.r * .35, .1, p.x, p.y, p.r * 1.8);
    grad.addColorStop(0, `rgba(242, 253, 255, ${Math.min(1, p.alpha + .2)})`);
    grad.addColorStop(.38, `rgba(151, 226, 247, ${p.alpha})`);
    grad.addColorStop(1, 'rgba(77, 186, 220, 0)');
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, p.r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (p.r > 2.4) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(185, 239, 255, ${p.alpha * .48})`;
      ctx.lineWidth = .7;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  let lastTime = 0;
  function animate(time = 0) {
    const dt = Math.min(2, (time - lastTime) / 16.67 || 1);
    lastTime = time;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.phase += .012 * dt;
      p.x += (p.vx + Math.sin(p.phase) * p.wobble * .12) * dt;
      p.y += p.vy * dt;

      if (pointer.active) {
        const dx = pointer.x - p.x, dy = pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        const radius = 175;
        if (dist < radius && dist > 1) {
          const force = (1 - dist / radius) * .055;
          p.vx += (dx / dist) * force * dt;
          p.vy += (dy / dist) * force * dt;
          p.attracted = Math.min(1, p.attracted + .06 * dt);
        } else {
          p.attracted *= .96;
        }
      } else p.attracted *= .96;

      p.vx *= .994;
      p.vx = Math.max(-1.1, Math.min(1.1, p.vx));
      p.vy = Math.max(-1.15, Math.min(.55, p.vy));
      if (p.y < -15) { p.y = height + rand(5, 40); p.x = rand(0, width); p.vy = rand(-.48, -.12); }
      if (p.x < -20) p.x = width + 10;
      if (p.x > width + 20) p.x = -10;
      drawParticle(p);
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('resize', resize);

  updateClock();
  window.setInterval(updateClock, 250);
  setQuote(false);
  window.setInterval(() => setQuote(true), QUOTE_INTERVAL);
  window.setInterval(() => {
    const elapsed = Date.now() - quoteStarted;
    progressEl.style.width = `${Math.min(100, elapsed / QUOTE_INTERVAL * 100)}%`;
  }, 1000);
  resize();
  requestAnimationFrame(animate);
})();
