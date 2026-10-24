'use strict';
(() => {
  // ---------- config ----------
  const SAVE_KEY = 'rudrasFarm.v1';
  const PEN_X = 0.34, COUNTER_X = 0.63, TRUCK_STOP = 0.80, TRUCK_OUT = 1.25;
  const PLAYER_SPEED = 0.75, PLAYER_CAP = 15, MAXLVL = 10, MAX_ANIMALS = 5;

  const ANIMALS = [
    { a: '🐔', p: '🥚', price: 1,     time: 2,   tint: '#fff1bf', dirt: '#ecd39b', stripe: '#ff5a5a', deco: ['🌾', '🌼'] },
    { a: '🐄', p: '🥛', price: 8,     time: 2.5, tint: '#dcf3c8', dirt: '#b8e08f', stripe: '#3d8bff', deco: ['🌿', '🌷'], unlock: { need: 100, cost: 250 } },
    { a: '🐑', p: '🧶', price: 50,    time: 3,   tint: '#e3ebff', dirt: '#c8e6a6', stripe: '#a259ff', deco: ['🌼', '🌸'], unlock: { need: 80, cost: 2500 } },
    { a: '🐖', p: '🍄', price: 300,   time: 3.5, tint: '#ffdde5', dirt: '#c69a6a', stripe: '#ff7eb6', deco: ['🌳', '🌰'], unlock: { need: 60, cost: 20000 } },
    { a: '🐝', p: '🍯', price: 2000,  time: 3,   tint: '#fff4c2', dirt: '#bfe58f', stripe: '#ffb000', deco: ['🌻', '🌸'], unlock: { need: 50, cost: 150000 } },
    { a: '🐎', p: '🎟️', price: 12000, time: 4,   tint: '#f5e3cf', dirt: '#e3c48e', stripe: '#00b37a', deco: ['🥕', '🌳'], unlock: { need: 40, cost: 1000000 } },
  ];
  const WORK = {
    col:   { e: '🧑‍🌾', base: 10 },
    cash:  { e: '🧑‍💼', base: 25 },
    truck: { e: '🚚', base: 120 },
  };
  const BUILD = [
    { e: '🛖', n: 'Coop',      fx: '🐔⚡x2',  cost: 300 },
    { e: '🏡', n: 'Barn',      fx: '⚡x1.5',  cost: 5000 },
    { e: '🏠', n: 'Farmhouse', fx: '💤x2',    cost: 40000 },
    { e: '🏪', n: 'Shop',      fx: '💰x2',    cost: 250000 },
    { e: '🏭', n: 'Factory',   fx: '💰x2',    cost: 2000000 },
    { e: '🏢', n: 'Company',   fx: '👑💰x3',  cost: 15000000 },
  ];

  const anyLane = f => S.lanes.some((L, k) => L.u && f(L, k));
  const ACH = [
    { id: 'egg1',   e: '🥚', t: '1',    s: 1, ok: () => S.lanes[0].sold >= 1 },
    { id: 'egg100', e: '🥚', t: '100',  s: 2, ok: () => S.lanes[0].sold >= 100 },
    { id: 'egg1k',  e: '🥚', t: '1000', s: 3, ok: () => S.lanes[0].sold >= 1000 },
    { id: 'col',    e: '🧑‍🌾', t: '',     s: 1, ok: () => anyLane(L => L.col > 0) },
    { id: 'cash',   e: '🧑‍💼', t: '',     s: 1, ok: () => anyLane(L => L.cash > 0) },
    { id: 'truck',  e: '🚚', t: '',     s: 1, ok: () => S.stats.del >= 1 },
    { id: 'crew',   e: '🤝', t: '3',    s: 2, ok: () => anyLane(L => L.col && L.cash && L.truck) },
    { id: 'herd',   e: '🐔', t: '5',    s: 2, ok: () => anyLane(L => L.n >= MAX_ANIMALS) },
    { id: 'maxlvl', e: '🏅', t: '10',   s: 3, ok: () => anyLane(L => Math.max(L.col, L.cash, L.truck) >= MAXLVL) },
    { id: 'c100',   e: '💰', t: '100',  s: 1, ok: () => S.total >= 100 },
    { id: 'c1k',    e: '💰', t: '1K',   s: 1, ok: () => S.total >= 1e3 },
    { id: 'c10k',   e: '💰', t: '10K',  s: 2, ok: () => S.total >= 1e4 },
    { id: 'c100k',  e: '💰', t: '100K', s: 2, ok: () => S.total >= 1e5 },
    { id: 'c1m',    e: '💰', t: '1M',   s: 3, ok: () => S.total >= 1e6 },
    { id: 'c10m',   e: '💰', t: '10M',  s: 3, ok: () => S.total >= 1e7 },
    { id: 'milk',   e: '🥛', t: '100',  s: 2, ok: () => S.lanes[1].sold >= 100 },
    { id: 'honey',  e: '🍯', t: '100',  s: 2, ok: () => S.lanes[4].sold >= 100 },
    { id: 'ride',   e: '🎟️', t: '100',  s: 3, ok: () => S.lanes[5].sold >= 100 },
    ...[1, 2, 3, 4, 5].map(k => ({ id: 'u' + k, e: ANIMALS[k].a, t: '🔓', s: 2, ok: () => S.lanes[k].u })),
    { id: 'coop',   e: '🛖', t: '',     s: 2, ok: () => S.b[0] },
    { id: 'shop',   e: '🏪', t: '',     s: 3, ok: () => S.b[3] },
    { id: 'company', e: '🏢', t: '👑',  s: 5, ok: () => S.b[5] },
  ];

  // ---------- formulas ----------
  const colSpeed = l => 0.2 * (1 + 0.15 * (l - 1));
  const colCap = l => 3 + 2 * (l - 1);
  const cashIv = l => 1.6 * Math.pow(0.8, l - 1);
  const truckCap = l => 10 * l;
  const truckSpeed = l => 0.35 * (1 + 0.1 * (l - 1));
  const truckCd = l => 4 * Math.pow(0.88, l - 1);
  const penCap = L => 6 + 3 * L.n;
  const workCost = (k, w, lvl) => Math.ceil(WORK[w].base * ANIMALS[k].price * Math.pow(1.75, lvl));
  const animalCost = (k, n) => Math.ceil(15 * ANIMALS[k].price * Math.pow(1.8, n - 1));
  const prodTime = k => ANIMALS[k].time / ((k === 0 && S.b[0] ? 2 : 1) * (S.b[1] ? 1.5 : 1));
  const starCount = () => ACH.reduce((t, a) => t + (S.ach[a.id] ? a.s : 0), 0);
  function mult() {
    let m = 1 + 0.02 * starCount();
    if (S.b[3]) m *= 2;
    if (S.b[4]) m *= 2;
    if (S.b[5]) m *= 3;
    return m;
  }
  function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    const u = ['K', 'M', 'B', 'T', 'Q'];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (n < 10 ? Math.floor(n * 10) / 10 : Math.floor(n)) + u[i];
  }

  // ---------- state ----------
  function fresh() {
    return {
      v: 1, coins: 0, total: 0, ach: {}, b: BUILD.map(() => false),
      lanes: ANIMALS.map((_, i) => ({ u: i === 0, n: 1, g: 0, st: 0, sold: 0, col: 0, cash: 0, truck: 0 })),
      stats: { del: 0 }, mute: false, last: Date.now(),
    };
  }
  function load() {
    const base = fresh();
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d || d.v !== 1) return base;
      Object.assign(base, d);
      base.lanes = fresh().lanes.map((L, i) => Object.assign(L, (d.lanes || [])[i] || {}));
      base.b = BUILD.map((_, i) => !!(d.b || [])[i]);
      base.stats = Object.assign({ del: 0 }, d.stats);
      base.ach = d.ach || {};
    } catch (e) { /* corrupted or blocked storage: start fresh */ }
    return base;
  }
  let S = load();
  function save() {
    S.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ }
  }

  // runtime-only objects per lane
  const RT = ANIMALS.map(() => ({
    el: null,
    player: { x: 0.5, carry: 0, goal: null },
    col: { x: COUNTER_X, carry: 0, ph: 'toPen' },
    truck: { x: TRUCK_OUT, ph: 'away', t: 1, load: 0 },
    cashT: 0, gShown: -1, stShown: -1,
  }));

  // ---------- sound ----------
  let AC = null;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d = 0.12, type = 'sine', v = 0.2, f2 = null, delay = 0) {
    if (S.mute) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + d + 0.03);
  }
  let lastTiny = 0;
  const sfx = {
    pop: () => tone(480, 0.12, 'sine', 0.3, 950),
    coin: () => { tone(988, 0.09, 'square', 0.07); tone(1319, 0.22, 'square', 0.07, null, 0.08); },
    tiny: () => { const n = performance.now(); if (n - lastTiny < 140) return; lastTiny = n; tone(1568, 0.06, 'triangle', 0.06); },
    buy: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.2, null, i * 0.07)),
    nope: () => tone(240, 0.18, 'sawtooth', 0.07, 150),
    honk: () => { tone(392, 0.12, 'square', 0.06); tone(392, 0.14, 'square', 0.06, null, 0.17); },
    fanfare: () => [[523, 0], [659, .12], [784, .24], [1047, .38], [784, .55], [1047, .68]].forEach(([f, d]) => {
      tone(f, 0.28, 'triangle', 0.2, null, d); tone(f / 2, 0.28, 'sine', 0.12, null, d);
    }),
  };
  const buzz = ms => {
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* unsupported */ }
  };

  // ---------- helpers ----------
  const $ = s => document.querySelector(s);
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function floatText(k, x, y, text, big) {
    const R = RT[k]; if (!R.el) return;
    const f = el('div', 'float' + (big ? ' big' : ''), text);
    f.style.left = (x * 100) + '%'; f.style.top = (y * 100) + '%';
    R.el.scene.appendChild(f);
    setTimeout(() => f.remove(), 1150);
  }
  function flyCoins(fromEl, count) {
    const pill = $('#coinPill');
    if (!fromEl || !pill.animate) return;
    const a = fromEl.getBoundingClientRect(), b = pill.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const c = el('div', 'flycoin', '💰');
      document.body.appendChild(c);
      const sx = a.left + a.width / 2 + (Math.random() - .5) * 40, sy = a.top + a.height / 2;
      const anim = c.animate([
        { transform: `translate(${sx}px,${sy}px) scale(.6)`, opacity: 1 },
        { transform: `translate(${(sx + b.left) / 2}px,${Math.min(sy, b.top) - 60}px) scale(1.2)`, opacity: 1, offset: .4 },
        { transform: `translate(${b.left + 20}px,${b.top + 8}px) scale(.7)`, opacity: .8 },
      ], { duration: 650 + i * 90, easing: 'ease-in' });
      anim.onfinish = () => { c.remove(); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); };
    }
  }
  function shake(e) { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); sfx.nope(); }
  function tapFx(e) { e.classList.add('tapped'); setTimeout(() => e.classList.remove('tapped'), 110); }

  // ---------- earning ----------
  function earn(k, n, bonus) {
    if (n <= 0) return 0;
    const v = n * ANIMALS[k].price * mult() * bonus;
    S.coins += v; S.total += v; S.lanes[k].sold += n;
    return v;
  }

  // ---------- player actions ----------
  function tapPen(k) {
    ac(); buzz(8); tapFx(RT[k].el.pen);
    RT[k].player.goal = 'pen';
  }
  function tapCounter(k) {
    ac(); buzz(8); tapFx(RT[k].el.counter);
    RT[k].player.goal = 'counter';
  }

  // ---------- simulation ----------
  function move(o, tx, sp, dt) {
    const d = tx - o.x, step = sp * dt;
    if (Math.abs(d) <= step) { o.x = tx; return true; }
    o.x += Math.sign(d) * step; o.dir = Math.sign(d); o.moving = true;
    return false;
  }

  function stepLane(k, dt) {
    const L = S.lanes[k], R = RT[k], A = ANIMALS[k];
    // animals lay / produce
    const cap = penCap(L);
    if (L.g < cap) L.g = Math.min(cap, L.g + L.n * dt / prodTime(k));

    // the player (Rudra)
    const P = R.player; P.moving = false;
    if (P.goal) {
      const atPen = P.goal === 'pen';
      if (move(P, atPen ? PEN_X : COUNTER_X, PLAYER_SPEED, dt)) {
        if (atPen) {
          const take = Math.min(Math.floor(L.g), PLAYER_CAP - P.carry);
          if (take > 0) { L.g -= take; P.carry += take; sfx.pop(); floatText(k, PEN_X, 0.32, '+' + take + ' ' + A.p); }
        } else {
          L.st += P.carry; P.carry = 0;
          if (L.st > 0) {
            const v = earn(k, L.st, 1); L.st = 0;
            sfx.coin(); buzz(15);
            floatText(k, 0.8, 0.25, '+' + fmt(v) + ' 💰', true);
            flyCoins(R.el.counter, 3);
          }
        }
        P.goal = null;
      }
    }

    // collector worker
    const C = R.col; C.moving = false;
    if (L.col) {
      const sp = colSpeed(L.col);
      if (C.ph === 'toPen' && move(C, PEN_X, sp, dt)) C.ph = 'wait';
      if (C.ph === 'wait') {
        const take = Math.min(Math.floor(L.g), colCap(L.col));
        if (take > 0) { L.g -= take; C.carry = take; C.ph = 'toCounter'; }
      } else if (C.ph === 'toCounter' && move(C, COUNTER_X, sp, dt)) {
        L.st += C.carry; C.carry = 0; C.ph = 'toPen';
      }
    }

    // truck driver (bulk seller, pays x1.5). The cashier waits while the truck loads.
    const T = R.truck; T.moving = false;
    if (L.truck) {
      const sp = truckSpeed(L.truck);
      if (T.ph === 'away') {
        T.t -= dt;
        if (T.t <= 0 && L.st >= 1) { T.ph = 'in'; sfx.honk(); }
      } else if (T.ph === 'in') {
        if (move(T, TRUCK_STOP, sp, dt)) { T.ph = 'load'; T.t = 0.7; }
      } else if (T.ph === 'load') {
        const take = Math.min(L.st, truckCap(L.truck) - T.load);
        if (take > 0) { L.st -= take; T.load += take; }
        T.t -= dt;
        if (T.t <= 0) T.ph = 'out';
      } else if (T.ph === 'out' && move(T, TRUCK_OUT, sp, dt)) {
        if (T.load > 0) {
          const v = earn(k, T.load, 1.5);
          S.stats.del++; sfx.coin();
          floatText(k, 0.86, 0.6, '🚚 +' + fmt(v) + ' 💰', true);
          flyCoins(R.el.road, 4);
        }
        T.load = 0; T.ph = 'away'; T.t = truckCd(L.truck);
      }
    }

    // cashier
    if (L.cash && T.ph !== 'load') {
      R.cashT += dt;
      const iv = cashIv(L.cash);
      if (L.st < 1) R.cashT = Math.min(R.cashT, iv);
      while (R.cashT >= iv && L.st >= 1) {
        R.cashT -= iv; L.st--;
        const v = earn(k, 1, 1);
        floatText(k, 0.82, 0.12, '+' + fmt(v));
        sfx.tiny();
        const ce = R.el.cashier; ce.classList.remove('sell'); void ce.offsetWidth; ce.classList.add('sell');
      }
    }
  }

  // ---------- rendering ----------
  function placeActor(e, o, carryEmoji) {
    const x = Math.round(o.x * 1000) / 10;
    if (o._x !== x) { e.style.left = x + '%'; o._x = x; }
    e.classList.toggle('walk', !!o.moving);
    if (o.dir) e.classList.toggle('r', o.dir > 0);
    const c = o.load != null ? o.load : o.carry;
    if (o._c !== c) { e.lastChild.innerHTML = c > 0 ? `${carryEmoji}<b>${c}</b>` : ''; o._c = c; }
  }
  function renderLane(k) {
    const L = S.lanes[k], R = RT[k], E = R.el, A = ANIMALS[k];
    placeActor(E.player, R.player, A.p);
    if (L.col) placeActor(E.col, R.col, A.p);
    if (L.truck) placeActor(E.truck, R.truck, A.p);
    const g = Math.floor(L.g);
    if (g !== R.gShown) {
      R.gShown = g;
      const show = Math.min(g, 12), w = E.ground;
      while (w.children.length < show) {
        const i = w.children.length, s = el('span', 'item', A.p);
        s.style.left = (12 + ((i * 37) % 76)) + '%';
        s.style.top = (52 + ((i * 29) % 38)) + '%';
        w.appendChild(s);
      }
      while (w.children.length > show) w.lastChild.remove();
      E.gcount.textContent = g > 0 ? `${A.p}${g}` : '';
      E.gcount.style.display = g > 0 ? '' : 'none';
    }
    if (L.st !== R.stShown) {
      R.stShown = L.st;
      const show = Math.min(L.st, 6), p = E.pile;
      while (p.children.length < show) p.appendChild(el('span', '', A.p));
      while (p.children.length > show) p.lastChild.remove();
      E.stock.textContent = L.st > 0 ? L.st : '';
    }
  }
  function setVisibility(k) {
    const L = S.lanes[k], E = RT[k].el;
    E.col.style.display = L.col ? '' : 'none';
    E.cashier.style.display = L.cash ? '' : 'none';
    E.truck.style.display = L.truck ? '' : 'none';
  }

  // ---------- building the page ----------
  const laneWrap = $('#lanes');
  const B_EL = [];
  let lockEl = null;

  function addAnimal(k, newborn) {
    const E = RT[k].el, A = ANIMALS[k];
    const s = el('div', 'animal' + (newborn ? ' newborn' : ''), `<span class="f"><span class="b">${A.a}</span></span>`);
    s.style.left = (18 + Math.random() * 64) + '%';
    s.style.top = (30 + Math.random() * 50) + '%';
    s.querySelector('.b').style.animationDelay = (Math.random() * -1) + 's';
    E.herd.appendChild(s);
  }

  function buildLane(k) {
    const A = ANIMALS[k], L = S.lanes[k], R = RT[k];
    const sec = el('section', 'card lane');
    sec.style.setProperty('--tint', A.tint);
    sec.style.setProperty('--dirt', A.dirt);
    sec.style.setProperty('--stripe', A.stripe);
    const btn = (w, e) => `<button class="wbtn" data-w="${w}"><span class="we">${e}</span><span class="wl"></span><span class="wp">💰<b></b></span></button>`;
    sec.innerHTML = `
      <div class="lane-head"><span>${A.a}</span><span class="lh-sold">${A.p} <b>0</b></span></div>
      <div class="scene">
        <div class="deco" style="left:44%;top:4%">${A.deco[0]}</div>
        <div class="deco" style="left:52%;top:30%">${A.deco[1]}</div>
        <div class="deco" style="left:2%;top:84%">${A.deco[0]}</div>
        <div class="deco" style="left:30%;top:86%">${A.deco[1]}</div>
        <div class="road"></div>
        <div class="pen"><div class="ground"></div><div class="herd"></div><b class="gcount"></b></div>
        <div class="counter"><div class="awning"></div><div class="cashier">${WORK.cash.e}</div><div class="table"><div class="pile"></div><b class="stock"></b></div></div>
        <div class="actor truck"><span class="flip"><span class="body">${WORK.truck.e}</span></span><div class="carry"></div></div>
        <div class="actor col"><span class="flip"><span class="body">${WORK.col.e}</span></span><div class="carry"></div></div>
        <div class="actor player"><span class="flip"><span class="body">🧒</span></span><div class="carry"></div></div>
        ${k === 0 ? '<div class="hint">👆</div>' : ''}
      </div>
      <div class="workers">${btn('n', A.a)}${btn('col', WORK.col.e)}${btn('cash', WORK.cash.e)}${btn('truck', WORK.truck.e)}</div>`;
    const q = s => sec.querySelector(s);
    R.el = {
      sec, scene: q('.scene'), pen: q('.pen'), ground: q('.ground'), herd: q('.herd'), gcount: q('.gcount'),
      counter: q('.counter'), pile: q('.pile'), stock: q('.stock'), cashier: q('.cashier'), road: q('.road'),
      player: q('.actor.player'), col: q('.actor.col'), truck: q('.actor.truck'), hint: q('.hint'),
      sold: q('.lh-sold b'), btns: {},
    };
    R.gShown = -1; R.stShown = -1;
    [R.player, R.col, R.truck].forEach(o => { o._x = null; o._c = null; });
    sec.querySelectorAll('.wbtn').forEach(b => {
      R.el.btns[b.dataset.w] = b;
      b.addEventListener('click', () => buy(k, b.dataset.w, b));
    });
    R.el.pen.addEventListener('click', () => tapPen(k));
    R.el.counter.addEventListener('click', () => tapCounter(k));
    for (let i = 0; i < L.n; i++) addAnimal(k, false);
    setVisibility(k);
    return sec;
  }

  function buildLock(k) {
    const A = ANIMALS[k], P = ANIMALS[k - 1], u = A.unlock;
    const sec = el('section', 'card lock');
    sec.innerHTML = `
      <div class="lock-a"><span class="ga">${A.a}</span><span class="lk">🔒</span></div>
      <div class="goal"><span>${P.p}</span><div class="bar"><i></i></div><b class="gtxt"></b></div>
      <button class="bigbtn">🔓 💰${fmt(u.cost)}</button>`;
    sec.querySelector('.bigbtn').addEventListener('click', e => unlockLane(k, e.currentTarget));
    sec._k = k;
    return sec;
  }

  function renderLanes() {
    laneWrap.innerHTML = '';
    RT.forEach(R => { R.el = null; });
    lockEl = null;
    S.lanes.forEach((L, k) => { if (L.u) laneWrap.appendChild(buildLane(k)); });
    const next = S.lanes.findIndex(L => !L.u);
    if (next > 0) { lockEl = buildLock(next); laneWrap.appendChild(lockEl); }
  }

  function buildFarm() {
    const c = $('#buildings');
    c.innerHTML = `<div class="farm-title" id="farmTitle"></div><div class="btiles"></div>`;
    const tiles = c.querySelector('.btiles');
    BUILD.forEach((b, i) => {
      const t = el('button', 'btile', `<span class="be">${b.e}</span><span class="bn">${b.n}</span><span class="bfx">${b.fx}</span><span class="bp">💰${fmt(b.cost)}</span>`);
      t.addEventListener('click', () => buyBuilding(i, t));
      tiles.appendChild(t); B_EL[i] = t;
    });
  }

  // ---------- buying ----------
  function buy(k, w, btn) {
    ac();
    const L = S.lanes[k], R = RT[k];
    if (w === 'n') {
      if (L.n >= MAX_ANIMALS) return shake(btn);
      const c = animalCost(k, L.n);
      if (S.coins < c) return shake(btn);
      S.coins -= c; L.n++;
      addAnimal(k, true);
      floatText(k, 0.2, 0.2, '+1 ' + ANIMALS[k].a, true);
    } else {
      const lvl = L[w];
      if (lvl >= MAXLVL) return shake(btn);
      const c = workCost(k, w, lvl);
      if (S.coins < c) return shake(btn);
      S.coins -= c; L[w]++;
      if (lvl === 0) {
        if (w === 'col') Object.assign(R.col, { x: COUNTER_X, ph: 'toPen', carry: 0 });
        if (w === 'truck') Object.assign(R.truck, { x: TRUCK_OUT, ph: 'away', t: 0.5, load: 0 });
        setVisibility(k);
      }
      const at = w === 'col' ? [R.col.x, 0.55] : w === 'cash' ? [0.815, 0.2] : [Math.min(R.truck.x, 0.9), 0.6];
      floatText(k, at[0], at[1], lvl === 0 ? '🎉' : '⬆️', true);
    }
    sfx.buy(); buzz(20);
    refreshUI(); save();
  }

  function unlockLane(k, btn) {
    ac();
    const u = ANIMALS[k].unlock;
    if (S.lanes[k - 1].sold < u.need || S.coins < u.cost) return shake(btn);
    S.coins -= u.cost;
    S.lanes[k].u = true;
    renderLanes(); refreshUI(); save();
    celebrate(ANIMALS[k].a, 0, ANIMALS[k].p);
    setTimeout(() => RT[k].el && RT[k].el.sec.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }

  function buyBuilding(i, t) {
    ac();
    if (S.b[i]) { tapFx(t); sfx.pop(); return; }
    const next = S.b.indexOf(false);
    if (i !== next || S.coins < BUILD[i].cost) return shake(t);
    S.coins -= BUILD[i].cost; S.b[i] = true;
    refreshUI(); save();
    celebrate(BUILD[i].e, 0, i === 5 ? "Rudra's Farm Company!" : BUILD[i].fx);
    if (i === 5) setTimeout(() => confetti(260), 600);
  }

  // ---------- UI refresh (4x per second) ----------
  function setBtn(b, cost, badge, maxed) {
    const can = !maxed && S.coins >= cost;
    b.classList.toggle('max', maxed);
    b.classList.toggle('can', can);
    b.classList.toggle('poor', !maxed && !can);
    b.querySelector('.wp').innerHTML = maxed ? '⭐' : '💰<b>' + fmt(cost) + '</b>';
    const wl = b.querySelector('.wl');
    wl.textContent = badge;
    wl.classList.toggle('hire', badge === '+');
  }

  let shownCoins = -1, shownStars = -1;
  function refreshUI() {
    const c = Math.floor(S.coins);
    if (c !== shownCoins) { $('#coins').textContent = fmt(c); shownCoins = c; }
    const st = starCount();
    if (st !== shownStars) { $('#stars').textContent = st; shownStars = st; }

    S.lanes.forEach((L, k) => {
      const E = RT[k].el; if (!E) return;
      E.sold.textContent = fmt(L.sold);
      setBtn(E.btns.n, animalCost(k, L.n), L.n, L.n >= MAX_ANIMALS);
      ['col', 'cash', 'truck'].forEach(w => setBtn(E.btns[w], workCost(k, w, L[w]), L[w] ? L[w] : '+', L[w] >= MAXLVL));
    });

    // tutorial finger in the chicken lane
    const R0 = RT[0];
    if (R0.el && R0.el.hint) {
      const P = R0.player, L0 = S.lanes[0];
      let where = null;
      if (L0.sold < 15 && !L0.col) {
        if (P.carry > 0) where = [0.81, 0.32];
        else if (L0.g >= 1) where = [0.2, 0.36];
      }
      R0.el.hint.style.display = where ? '' : 'none';
      if (where) { R0.el.hint.style.left = where[0] * 100 + '%'; R0.el.hint.style.top = where[1] * 100 + '%'; }
    }

    if (lockEl) {
      const k = lockEl._k, u = ANIMALS[k].unlock, sold = S.lanes[k - 1].sold;
      const met = sold >= u.need;
      lockEl.querySelector('.bar i').style.width = Math.min(100, sold / u.need * 100) + '%';
      lockEl.querySelector('.gtxt').textContent = met ? '✅' : `${sold}/${u.need}`;
      lockEl.classList.toggle('ready', met);
      lockEl.querySelector('.bigbtn').classList.toggle('can', met && S.coins >= u.cost);
    }

    const next = S.b.indexOf(false);
    B_EL.forEach((t, i) => {
      const cls = 'btile ' + (S.b[i] ? 'owned' : i === next ? 'next' + (S.coins >= BUILD[i].cost ? ' can' : '') : 'future');
      if (t._cls !== cls) { t.className = cls; t._cls = cls; }
    });
    const title = $('#farmTitle');
    const tHtml = S.b[5] ? "👑 <span class=\"gt\">Rudra's Farm Company</span> 👑" : "🌻 Rudra's Farm 🌻";
    if (title._h !== tHtml) { title.innerHTML = tHtml; title._h = tHtml; }
    title.classList.toggle('company', S.b[5]);
  }

  // ---------- achievements & celebration ----------
  const celQueue = [];
  let celOpen = false;
  function checkAch() {
    ACH.forEach(a => {
      if (!S.ach[a.id] && a.ok()) {
        S.ach[a.id] = Date.now();
        celQueue.push([a.e, a.s, a.t]);
        save();
      }
    });
    if (!celOpen && celQueue.length) celebrate(...celQueue.shift());
  }
  function celebrate(e, stars, text) {
    if (celOpen) { celQueue.push([e, stars, text]); return; }
    celOpen = true;
    const box = $('#celebrate');
    box.innerHTML = `<div class="cel-card"><div class="cel-rays"></div><div class="cel-e">${e}</div>${stars ? `<div class="cel-s">${'⭐'.repeat(stars)}</div>` : ''}<div class="cel-t">${text || ''}</div></div>`;
    box.classList.remove('hidden');
    sfx.fanfare(); buzz([30, 40, 30]);
    confetti(140);
    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      box.classList.add('hidden'); celOpen = false;
      setTimeout(() => { if (!celOpen && celQueue.length) celebrate(...celQueue.shift()); }, 250);
    };
    box.onclick = close;
    setTimeout(close, 2800);
  }

  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], confRun = false;
  const CONF_COLORS = ['#ff5a5a', '#ffd84d', '#4cd964', '#3d8bff', '#ff7eb6', '#a259ff', '#ff9a3c'];
  function confetti(n) {
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4,
        vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4,
        r: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
        w: 7 + Math.random() * 7, h: 4 + Math.random() * 6, c: CONF_COLORS[i % CONF_COLORS.length],
      });
    }
    if (!confRun) { confRun = true; requestAnimationFrame(confStep); }
  }
  function confStep() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.vx *= 0.995; p.r += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); cx.restore();
    });
    parts = parts.filter(p => p.y < innerHeight + 30);
    if (parts.length) requestAnimationFrame(confStep);
    else { confRun = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // ---------- modals ----------
  function openModal(html) {
    $('#sheet').innerHTML = `<button class="x" aria-label="Close">✖</button>` + html;
    $('#modal').classList.remove('hidden');
    $('#sheet .x').onclick = closeModal;
  }
  function closeModal() { $('#modal').classList.add('hidden'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  function showAchievements() {
    ac(); sfx.pop();
    const tiles = ACH.map(a => `<div class="ach${S.ach[a.id] ? ' got' : ''}"><div class="ae">${a.e}</div><div class="at">${a.t}</div><div class="as">${'⭐'.repeat(a.s)}</div></div>`).join('');
    const pct = Math.round(starCount() * 2);
    openModal(`<h2>⭐ ${starCount()}</h2><div class="agrid">${tiles}</div><div class="bonus">⭐ = 💰 +${pct}%</div>`);
  }
  function showSettings() {
    ac(); sfx.pop();
    openModal(`<h2>⚙️</h2>
      <div class="setrow"><button class="bigbtn" id="muteBtn">${S.mute ? '🔇' : '🔊'}</button>
      <button class="bigbtn danger" id="resetBtn">🔄</button></div>
      <div class="setrow hidden" id="confirmRow"><span style="font-size:40px">🔄❓</span>
      <button class="bigbtn danger" id="yesReset">✅</button><button class="bigbtn" id="noReset">❌</button></div>`);
    $('#muteBtn').onclick = () => { S.mute = !S.mute; $('#muteBtn').textContent = S.mute ? '🔇' : '🔊'; save(); sfx.pop(); };
    $('#resetBtn').onclick = () => $('#confirmRow').classList.remove('hidden');
    $('#noReset').onclick = () => $('#confirmRow').classList.add('hidden');
    $('#yesReset').onclick = () => {
      const mute = S.mute;
      S = fresh(); S.mute = mute;
      RT.forEach(R => Object.assign(R, {
        player: { x: 0.5, carry: 0, goal: null }, col: { x: COUNTER_X, carry: 0, ph: 'toPen' },
        truck: { x: TRUCK_OUT, ph: 'away', t: 1, load: 0 }, cashT: 0,
      }));
      save(); renderLanes(); refreshUI(); closeModal();
    };
  }
  $('#starBtn').addEventListener('click', showAchievements);
  $('#setBtn').addEventListener('click', showSettings);

  // ---------- offline earnings ----------
  function laneRate(k) {
    const L = S.lanes[k];
    if (!L.u || !L.col) return null;
    const prod = L.n / prodTime(k);
    const colR = colCap(L.col) / (2 * (COUNTER_X - PEN_X) / colSpeed(L.col));
    const cashR = L.cash ? 1 / cashIv(L.cash) : 0;
    const trR = L.truck ? truckCap(L.truck) / (2 * (TRUCK_OUT - TRUCK_STOP) / truckSpeed(L.truck) + 0.7 + truckCd(L.truck)) : 0;
    const flow = Math.min(prod, colR, cashR + trR);
    if (flow <= 0) return null;
    const truckShare = trR / (cashR + trR);
    return { items: flow, coins: flow * ANIMALS[k].price * mult() * (1 + 0.5 * truckShare) };
  }
  function applyOffline() {
    const now = Date.now();
    const away = (now - S.last) / 1000;
    S.last = now;
    if (!(away > 30)) return;
    const secs = Math.min(away, S.b[2] ? 8 * 3600 : 2 * 3600);
    const eff = S.b[2] ? 1 : 0.5;
    let coins = 0;
    S.lanes.forEach((L, k) => {
      if (!L.u) return;
      L.g = Math.min(penCap(L), L.g + L.n * secs / prodTime(k));
      const r = laneRate(k);
      if (!r) return;
      coins += r.coins * secs * eff;
      L.sold += Math.floor(r.items * secs * eff);
    });
    if (coins < 1) return;
    S.coins += coins; S.total += coins;
    save();
    const hrs = Math.floor(secs / 3600), mins = Math.floor((secs % 3600) / 60);
    openModal(`<div class="offline"><div class="oe">😴🌙</div><div class="ot">⏰ ${hrs ? hrs + 'h ' : ''}${mins}m</div>
      <div class="oc">+${fmt(coins)} 💰</div><button class="bigbtn" id="okOff">👍</button></div>`);
    $('#okOff').onclick = () => { ac(); sfx.coin(); flyCoins($('#okOff'), 6); closeModal(); };
  }

  // ---------- main loop ----------
  let lastT = performance.now(), uiT = 0, saveT = 0;
  function tick(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    S.lanes.forEach((L, k) => {
      if (!L.u || !RT[k].el) return;
      stepLane(k, dt);
      renderLane(k);
    });
    uiT += dt; saveT += dt;
    if (uiT > 0.25) { uiT = 0; refreshUI(); checkAch(); }
    if (saveT > 5) { saveT = 0; save(); }
    S.last = Date.now();
    requestAnimationFrame(tick);
  }

  // animals wander around their pens
  setInterval(() => {
    RT.forEach((R, k) => {
      if (!R.el || !S.lanes[k].u) return;
      const herd = R.el.herd.children;
      if (!herd.length) return;
      const a = herd[Math.floor(Math.random() * herd.length)];
      const nx = 15 + Math.random() * 70;
      a.classList.toggle('r', nx > parseFloat(a.style.left));
      a.style.left = nx + '%';
      a.style.top = (28 + Math.random() * 54) + '%';
    });
  }, 700);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else { applyOffline(); lastT = performance.now(); }
  });
  window.addEventListener('pagehide', save);
  document.addEventListener('pointerdown', () => ac(), { once: true });

  // ---------- start ----------
  buildFarm();
  renderLanes();
  ACH.forEach(a => { if (!S.ach[a.id] && a.ok()) S.ach[a.id] = Date.now(); }); // no party for old progress
  refreshUI();
  applyOffline();
  requestAnimationFrame(tick);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.__farm = { get S() { return S; }, RT, mult, fmt }; // handy for debugging
})();
