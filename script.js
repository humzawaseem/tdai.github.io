// ---- Year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Mobile menu ----
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');
  menuBtn.setAttribute('aria-expanded', String(!open));
});
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);

// ---- Reduced motion ----
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll('.reveal');
if (reduceMotion) {
  revealEls.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), (i % 4) * 70);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
}

// ---- Animated counters ----
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
  const dur = 1200, start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); countObserver.unobserve(e.target); } });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(c => countObserver.observe(c));

// ---- Hero network animation (particle nodes + links) ----
(function () {
  const canvas = document.getElementById('net');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, nodes = [], raf;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function init() {
    size();
    const count = Math.min(60, Math.floor(w / 22));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(46,125,255,${0.16 * (1 - dist / 130)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = 'rgba(125,176,255,0.7)';
      ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  init();
  if (!reduceMotion) draw(); else { /* draw one static frame */ draw(); cancelAnimationFrame(raf); }
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(init, 200); });
})();

// ---- How-it-works decision pipeline animation ----
(function () {
  const svg = document.getElementById('pipeline');
  if (!svg) return;
  const nodes = [...svg.querySelectorAll('.pnode')];
  const pulse = document.getElementById('pulse');
  const verdict = document.getElementById('verdictG');
  // path of node centers the pulse visits, in order
  const path = nodes.map(g => {
    const c = g.querySelector('circle');
    return { x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), g };
  });

  function clearActive() { nodes.forEach(n => n.classList.remove('active')); }

  function runOnce() {
    clearActive();
    verdict.setAttribute('opacity', '0');
    let i = 0;
    pulse.setAttribute('opacity', '1');
    function moveTo(idx) {
      if (idx >= path.length) {
        verdict.setAttribute('opacity', '1');
        setTimeout(runOnce, 2600);
        return;
      }
      const p = path[idx];
      pulse.setAttribute('cx', p.x);
      pulse.setAttribute('cy', p.y);
      p.g.classList.add('active');
      setTimeout(() => moveTo(idx + 1), 360);
    }
    moveTo(0);
  }

  // hover a node to highlight it
  nodes.forEach(n => {
    n.addEventListener('mouseenter', () => n.classList.add('active'));
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (reduce) { nodes.forEach(n => n.classList.add('active')); verdict.setAttribute('opacity','1'); pulse.setAttribute('opacity','0'); }
        else runOnce();
        io.disconnect();
      }
    });
  }, { threshold: 0.4 });
  io.observe(svg);
})();

// ---- Credibility backtest equity curve ----
(function () {
  const svg = document.getElementById('btChart');
  if (!svg) return;
  const linePath = document.getElementById('btLine');
  const areaPath = document.getElementById('btArea');
  const dot = document.getElementById('btDot');
  const tip = document.getElementById('btTip');
  const tipBox = document.getElementById('btTipBox');
  const t1 = document.getElementById('btTipT1');
  const t2 = document.getElementById('btTipT2');

  const X0 = 30, X1 = 470, Y0 = 200, Y1 = 30;
  const N = 60;
  // deterministic equity curve rising with drawdowns (market cycles)
  let seed = 42;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const vals = [];
  let eq = 100;
  for (let i = 0; i < N; i++) {
    const cycle = Math.sin(i / 7) * 1.2;           // waves = regimes
    const drift = 0.9;                              // upward bias
    const noise = (rnd() - 0.5) * 2.2;
    eq += drift + cycle + noise;
    if (i === 22) eq -= 6;                          // a bear drawdown
    if (i === 40) eq -= 4;                          // a range chop
    vals.push(eq);
  }
  const min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => {
    const x = X0 + (X1 - X0) * (i / (N - 1));
    const y = Y0 - (Y0 - Y1) * ((v - min) / (max - min));
    return [x, y];
  });
  const regimes = i => (i < 18 ? 'Bull trend' : i < 30 ? 'Bear drawdown' : i < 44 ? 'Range / chop' : 'Recovery');
  const years = i => 2021 + (i / (N - 1)) * 5;

  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  linePath.setAttribute('d', d);
  areaPath.setAttribute('d', d + ` L${X1} ${Y0} L${X0} ${Y0} Z`);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play() {
    if (reduce) { dot.setAttribute('cx', pts.at(-1)[0]); dot.setAttribute('cy', pts.at(-1)[1]); return; }
    const len = linePath.getTotalLength();
    linePath.style.strokeDasharray = len;
    linePath.style.strokeDashoffset = len;
    areaPath.style.opacity = 0;
    const dur = 1800, start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      linePath.style.strokeDashoffset = len * (1 - p);
      areaPath.style.opacity = p;
      const pt = linePath.getPointAtLength(len * p);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // hover to inspect
  function nearest(mx) {
    let best = 0, bd = 1e9;
    pts.forEach((p, i) => { const dd = Math.abs(p[0] - mx); if (dd < bd) { bd = dd; best = i; } });
    return best;
  }
  svg.addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * 480;
    if (mx < X0 || mx > X1) { tip.setAttribute('opacity', 0); return; }
    const i = nearest(mx);
    const [x, y] = pts[i];
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    t1.textContent = `${years(i).toFixed(0)} · eq ${vals[i].toFixed(0)}`;
    t2.textContent = regimes(i);
    const w = Math.max(t1.getComputedTextLength ? t1.getComputedTextLength() : 90, 90) + 20;
    tipBox.setAttribute('width', w);
    let tx = x + 10; if (tx + w > 480) tx = x - w - 10;
    const ty = Math.max(4, y - 44);
    tip.setAttribute('transform', `translate(${tx},${ty})`);
    tip.setAttribute('opacity', 1);
  });
  svg.addEventListener('mouseleave', () => tip.setAttribute('opacity', 0));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { play(); io.disconnect(); } });
  }, { threshold: 0.4 });
  io.observe(svg);
})();
