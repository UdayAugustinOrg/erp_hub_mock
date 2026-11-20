/* ==========================================================
   tour.js: guided tour engine. Runs each step's setup
   (switch screen), spotlights the target and places a
   coach-mark card. The dim is four panels around the
   highlight, so the highlighted area stays clickable.

   Step shape:
     chapter, title, body   text on the card
     why                    optional "why it matters" line
     target                 CSS selector to spotlight (omit = centred card)
     placement              preferred side: right | left | top | bottom
     setup                  fn run before the step is shown
     tryIt                  { label, run } optional hands-on action

   Usage: Tour.define(id, { title, minutes }, steps)
          app.html?tour=<id>[&step=<n>] auto-starts (n is 1-based)
   ========================================================== */

const Tour = (() => {
  const PAD = 8;
  const GAP = 16;
  const tours = {};
  let cur = null;
  let steps = [];
  let index = 0;
  let busy = false;
  let root = null;
  let trackTimer = 0;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(selector, timeout = 2500) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const el = document.querySelector(selector);
      if (el && el.getBoundingClientRect().height) return el;
      await wait(60);
    }
    return null;
  }

  function measure(el) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    const top = Math.max(r.top - PAD, 4);
    const bottom = Math.min(r.bottom + PAD, window.innerHeight - 4);
    return { top, left: Math.max(4, r.left - PAD), width: Math.min(r.width + PAD * 2, window.innerWidth - 8), height: Math.max(0, bottom - top) };
  }

  /* Picks the side of the highlight with room for the card; overlays the bottom corner when nothing fits */
  function placeCard(rect, preferred, w, h) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!rect) return { style: { top: vh / 2 - h / 2, left: vw / 2 - w / 2 }, arrow: null };
    const room = { right: vw - rect.left - rect.width, left: rect.left, top: rect.top, bottom: vh - rect.top - rect.height };
    const fits = (s) => (s === 'left' || s === 'right' ? room[s] >= w + GAP : room[s] >= h + GAP);
    const side = [preferred || 'right', 'right', 'left', 'bottom', 'top'].find(fits);
    const clampX = (x) => Math.max(12, Math.min(x, vw - w - 12));
    const clampY = (y) => Math.max(12, Math.min(y, vh - h - 12));
    const midY = clampY(rect.top + rect.height / 2 - h / 2);
    const midX = clampX(rect.left + rect.width / 2 - w / 2);
    if (!side) return { style: { left: vw - w - 20, top: vh - h - 20 }, arrow: null };
    if (side === 'right') return { style: { left: rect.left + rect.width + GAP, top: midY }, arrow: 'left' };
    if (side === 'left') return { style: { left: Math.max(12, rect.left - w - GAP), top: midY }, arrow: 'right' };
    if (side === 'top') return { style: { left: midX, top: Math.max(12, rect.top - h - GAP) }, arrow: 'bottom' };
    return { style: { left: midX, top: clampY(rect.top + rect.height + GAP) }, arrow: 'top' };
  }

  function cardHtml(step) {
    const last = index === steps.length - 1;
    return `<div class="tour-card" role="dialog" aria-label="${step.title}">
      <span class="tour-arrow"></span>
      <div class="tour-top">${step.chapter ? `<span class="tour-chapter">${step.chapter}</span>` : ''}<span class="tour-name">${tours[cur].meta.title}</span></div>
      <div class="tour-title">${step.title}</div>
      <p class="tour-body">${step.body}</p>
      ${step.why ? `<p class="tour-why"><span>Why it matters</span>${step.why}</p>` : ''}
      <div class="tour-foot">
        <div class="tour-progress"><span class="tour-count">${index + 1} / ${steps.length}</span>
          <span class="tour-bar"><i style="width:${((index + 1) / steps.length) * 100}%"></i></span><span class="tour-keys">← → keys</span></div>
        <div class="tour-actions">
          <button class="tour-btn ghost" data-tour="skip">${last ? 'Close' : 'End tour'}</button>
          ${step.tryIt ? `<button class="tour-btn try" data-tour="try">${step.tryIt.label}</button>` : ''}
          ${index > 0 ? '<button class="tour-btn ghost" data-tour="back">Back</button>' : ''}
          <button class="tour-btn solid" data-tour="next">${last ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>`;
  }

  function layout() {
    if (!root) return;
    const step = steps[index];
    const el = step.target ? document.querySelector(step.target) : null;
    const rect = el ? measure(el) : null;
    const dims = root.querySelectorAll('.tour-dim');
    const boxes = rect ? [
      { top: 0, left: 0, width: '100%', height: Math.max(0, rect.top) },
      { top: rect.top + rect.height, left: 0, width: '100%', height: `calc(100% - ${rect.top + rect.height}px)` },
      { top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height },
      { top: rect.top, left: rect.left + rect.width, width: `calc(100% - ${rect.left + rect.width}px)`, height: rect.height },
    ] : [{ top: 0, left: 0, width: '100%', height: '100%' }, {}, {}, {}];
    dims.forEach((d, i) => {
      const b = boxes[i];
      const px = (v) => (typeof v === 'number' ? v + 'px' : v || '0');
      Object.assign(d.style, { top: px(b.top), left: px(b.left), width: px(b.width), height: px(b.height) });
    });
    const ring = root.querySelector('.tour-ring');
    ring.style.display = rect ? 'block' : 'none';
    if (rect) Object.assign(ring.style, { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', height: rect.height + 'px' });
    const card = root.querySelector('.tour-card');
    if (!card) return;
    const { style, arrow } = placeCard(rect, step.placement, card.offsetWidth, card.offsetHeight);
    card.style.top = style.top + 'px';
    card.style.left = style.left + 'px';
    card.querySelector('.tour-arrow').className = `tour-arrow ${arrow ? 'tour-arrow-' + arrow : ''}`;
  }

  function setBusy(on) {
    busy = on;
    root?.querySelectorAll('[data-tour="next"],[data-tour="back"],[data-tour="try"]').forEach((b) => { b.disabled = on; });
  }

  /* Keeps ?tour=<id>&step=<n> in the address bar so a reload resumes at the same step */
  function syncUrl() {
    const q = root ? `?tour=${cur}&step=${index + 1}` : '';
    history.replaceState(null, '', location.pathname + q + location.hash);
  }

  async function show(i) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    const step = steps[index];
    root.querySelector('.tour-card')?.remove();
    root.dataset.state = 'loading';
    setBusy(true);
    closeModals();
    try { if (step.setup) await step.setup(); } catch (e) { console.warn('tour setup', e); }
    const el = step.target ? await waitFor(step.target) : null;
    if (!root) return;
    root.insertAdjacentHTML('beforeend', cardHtml(step));
    const card = root.querySelector('.tour-card');
    card.style.visibility = 'hidden';
    if (el) {
      /* Try a few scroll positions until the card fits beside the highlight instead of covering it */
      const modes = el.getBoundingClientRect().height > window.innerHeight * 0.7 ? ['start'] : ['center', 'start', 'end'];
      for (const block of modes) {
        el.scrollIntoView({ block, inline: 'nearest', behavior: 'instant' });
        await wait(40);
        const rect = measure(el);
        if (placeCard(rect, step.placement, card.offsetWidth, card.offsetHeight).arrow) break;
      }
      await wait(80);
    }
    setBusy(false);
    layout();
    card.style.visibility = '';
    syncUrl();
    root.dataset.state = 'ready';
    root.dataset.step = String(index + 1);
  }

  async function tryIt() {
    const step = steps[index];
    if (!step.tryIt || busy) return;
    setBusy(true);
    try { await step.tryIt.run(); } catch (e) { /* ignore */ }
    await wait(150);
    setBusy(false);
    layout();
  }

  function next() { if (busy) return; if (index === steps.length - 1) stop(); else show(index + 1); }
  function back() { if (!busy && index > 0) show(index - 1); }

  function onKey(e) {
    if (!root || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const keys = { Escape: stop, ArrowRight: next, Enter: next, ArrowLeft: back };
    if (!keys[e.key]) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    keys[e.key]();
  }
  function onClick(e) {
    const b = e.target.closest('[data-tour]');
    if (!b || b.disabled) return;
    ({ skip: stop, next, back, try: tryIt })[b.dataset.tour]();
  }

  function start(id, at = 0) {
    if (!tours[id]) return;
    if (root) stop();
    closeMenu();
    cur = id;
    steps = tours[id].steps;
    root = document.createElement('div');
    root.className = 'tour-root';
    root.innerHTML = '<div class="tour-dim"></div><div class="tour-dim"></div><div class="tour-dim"></div><div class="tour-dim"></div><div class="tour-ring"></div>';
    root.addEventListener('click', onClick);
    document.body.appendChild(root);
    document.body.classList.add('tour-on');
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', layout);
    window.addEventListener('scroll', layout, { passive: true });
    trackTimer = setInterval(layout, 250);
    show(at);
  }

  function stop() {
    if (!root) return;
    clearInterval(trackTimer);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', layout);
    window.removeEventListener('scroll', layout);
    root.remove();
    root = null;
    document.body.classList.remove('tour-on');
    syncUrl();
  }

  function define(id, meta, list) { tours[id] = { meta, steps: list }; }

  /* ---------- Launcher with tour menu ---------- */
  let menu = null;
  function closeMenu() { menu?.remove(); menu = null; }
  function openMenu() {
    if (menu) return closeMenu();
    menu = document.createElement('div');
    menu.className = 'tour-menu';
    menu.innerHTML = `<div class="tour-menu-h">Guided tours</div>${Object.entries(tours).map(([id, t]) => `<button data-start="${id}"><b>${t.meta.title}</b><span>${t.steps.length} steps · about ${t.meta.minutes} min</span></button>`).join('')}`;
    menu.addEventListener('click', (e) => { const b = e.target.closest('[data-start]'); if (b) start(b.dataset.start); });
    document.body.appendChild(menu);
  }
  function mount() {
    const btn = document.createElement('button');
    btn.className = 'tour-launch';
    btn.innerHTML = `${icon('play')}Guided tours`;
    btn.addEventListener('click', openMenu);
    document.body.appendChild(btn);
    const p = new URLSearchParams(location.search);
    const id = p.get('tour');
    if (id && tours[id]) setTimeout(() => start(id, Math.max(0, (parseInt(p.get('step'), 10) || 1) - 1)), 300);
  }

  const state = () => ({ id: cur, index, total: steps.length, target: root ? steps[index]?.target || null : null, ready: root?.dataset.state === 'ready' });
  return { define, start, stop, mount, waitFor, wait, state, list: () => Object.fromEntries(Object.entries(tours).map(([k, t]) => [k, t.steps.map((s) => s.title)])) };
})();
