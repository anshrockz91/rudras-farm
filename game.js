'use strict';
(() => {
  // ---------- config ----------
  const SAVE_KEY = 'rudrasFarm.v1'; // same key as v1 so existing farm progress carries over
  const PEN_X = 0.34, COUNTER_X = 0.63, TRUCK_STOP = 0.80, TRUCK_OUT = 1.25;
  const PLAYER_SPEED = 0.75, PLAYER_CAP = 15, MAXLVL = 10, MAX_ANIMALS = 5;

  // Every world shares one economy curve; only the look changes. Later worlds cost more.
  const PRICE = [1, 8, 50, 300, 2000, 12000];
  const TIME = [2, 2.5, 3, 3.5, 3, 4];
  const NEED = [0, 100, 80, 60, 50, 40];
  const UNLOCK = [0, 250, 2500, 20000, 150000, 1000000];
  const BCOST = [300, 5000, 40000, 250000, 2000000, 15000000];
  const BFX = ['⚡x2', '⚡x1.5', '💤x2', '💰x2', '💰x2', '👑💰x3'];
  const WORLD_BONUS = 1.5; // every finished world (last building bought) boosts all worlds

  // lanes: [animal, product, card tint, pen ground, awning stripe, deco1, deco2]
  const WORLD_DEFS = [
    {
      icon: '🚜', title: "Rudra's Farm", done: "Rudra's Farm Company", t1: '🌻',
      bg: ['#8fd8ff', '#c9f1ff', '#bfe9a0', '#a7dd80'], fence: ['#b9773b', '#8a5426'], work: ['🧑‍🌾', '🧑‍💼', '🚚'],
      lanes: [
        ['🐔', '🥚', '#fff1bf', '#ecd39b', '#ff5a5a', '🌾', '🌼'],
        ['🐄', '🥛', '#dcf3c8', '#b8e08f', '#3d8bff', '🌿', '🌷'],
        ['🐑', '🧶', '#e3ebff', '#c8e6a6', '#a259ff', '🌼', '🌸'],
        ['🐖', '🍄', '#ffdde5', '#c69a6a', '#ff7eb6', '🌳', '🌰'],
        ['🐝', '🍯', '#fff4c2', '#bfe58f', '#ffb000', '🌻', '🌸'],
        ['🐎', '🎟️', '#f5e3cf', '#e3c48e', '#00b37a', '🥕', '🌳'],
      ],
      build: [['🛖', 'Coop'], ['🏡', 'Barn'], ['🏠', 'Farmhouse'], ['🏪', 'Shop'], ['🏭', 'Factory'], ['🏢', 'Company']],
    },
    {
      icon: '🐶', title: "Rudra's Puppy Town", done: "Rudra's Pet Palace", t1: '🐾',
      bg: ['#ffc9e6', '#ffeef7', '#c8f0b0', '#a9e38c'], fence: ['#ffffff', '#c7b3c7'], work: ['🧑‍⚕️', '🧑‍💼', '🚐'],
      lanes: [
        ['🐕', '🐶', '#ffe7d1', '#f6dcb8', '#ff8a3d', '🦴', '🎾'],
        ['🐈', '🐱', '#ffe3f1', '#f8d4e6', '#ff5fa2', '🧶', '🐟'],
        ['🐇', '🐰', '#e9f7dc', '#cdeeb0', '#57c84d', '🥕', '🌷'],
        ['🐹', '🐹', '#fff3d6', '#f1dfb0', '#f5a623', '🌻', '🧀'],
        ['🐢', '🐢', '#dff5f2', '#9fdfe8', '#14b8a6', '🌿', '🐚'],
        ['🦜', '🦜', '#e5f0ff', '#cfe6c0', '#3d8bff', '🌴', '🍌'],
      ],
      build: [['⛺', 'Kennel'], ['🏥', 'Vet'], ['🏨', 'Pet Hotel'], ['🧸', 'Toy Shop'], ['🏬', 'Pet Mall'], ['🏰', 'Pet Palace']],
    },
    {
      icon: '🦁', title: "Rudra's Safari Zoo", done: "Rudra's Mega Zoo", t1: '🌴',
      bg: ['#ffd77a', '#fff3cf', '#e6d58a', '#d4c06a'], fence: ['#7a9a3a', '#4f6b1f'], work: ['🤠', '🧑‍💼', '🚌'],
      lanes: [
        ['🐊', '🎈', '#dcf5ff', '#7cc8e8', '#00a3d9', '🌿', '🐸'],
        ['🐼', '🎋', '#eef7e6', '#cfe8b8', '#2e9e4f', '🍃', '🌸'],
        ['🦘', '🥊', '#ffe9d6', '#e8c48e', '#ff5a3d', '🌵', '☀️'],
        ['🐅', '📸', '#fff0d6', '#d9c47a', '#ff9a00', '🌴', '🌾'],
        ['🦁', '👑', '#fff6c8', '#e3cf80', '#ffc400', '🌴', '🦴'],
        ['🐘', '💦', '#e6eefc', '#a9cfe8', '#5b7cfa', '🌳', '🥜'],
      ],
      build: [['🎪', 'Big Tent'], ['🎡', 'Big Wheel'], ['🎢', 'Coaster'], ['🛍️', 'Gift Shop'], ['🏨', 'Zoo Hotel'], ['🏟️', 'Mega Zoo']],
    },
    {
      icon: '🏗️', title: "Rudra's Builder Town", done: "Rudra's Rocket", t1: '🔨', still: true,
      bg: ['#9fd3ff', '#e6f4ff', '#e8d3a8', '#d9bd86'], fence: ['#f5a623', '#b8730a'], work: ['👷', '🧑‍💼', '🚛'],
      lanes: [
        ['🌲', '🪵', '#e3f3d8', '#9ccf7a', '#2e9e4f', '🌲', '🍄'],
        ['⛰️', '🪨', '#ececec', '#c9c2b5', '#7a7a7a', '🌵', '🌾'],
        ['🔥', '🧱', '#ffe3d6', '#e8b08e', '#e2552e', '🪣', '⛏️'],
        ['⚙️', '🔩', '#e6ecf2', '#c3ccd6', '#4a6fa5', '🔧', '🔨'],
        ['⚡', '🔋', '#fff8d1', '#e9dd96', '#ffcc00', '💡', '🔌'],
        ['⛏️', '💎', '#ece6ff', '#b9a9d9', '#8a5cf6', '🔦', '🪨'],
      ],
      build: [['🛠️', 'Workshop'], ['🏗️', 'Crane'], ['🏘️', 'Houses'], ['🌉', 'Bridge'], ['🏙️', 'City'], ['🚀', 'Rocket']],
    },
    {
      icon: '🌙', title: "Rudra's Space Farm", done: 'Planet Rudra', t1: '✨', wonder: 'space',
      bg: ['#1d2257', '#3b3f8f', '#8f7fc4', '#6f5fa8'], fence: ['#c9d1e0', '#7d8aa3'], work: ['👨‍🚀', '👩‍🚀', '🛸'],
      lanes: [
        ['🌙', '🧀', '#eef0ff', '#d9d4ef', '#5b5fd6', '⭐', '🌟'],
        ['👽', '🛸', '#e6ffe9', '#b9e8c0', '#22c55e', '🌟', '🪐'],
        ['🤖', '🧸', '#e8f1ff', '#c3d3ea', '#3d8bff', '⚙️', '💫'],
        ['🦄', '🌈', '#ffe8fb', '#efd0f0', '#ec4899', '🌸', '⭐'],
        ['🦖', '🦴', '#e9f7df', '#bfdc9e', '#16a34a', '🌋', '🌿'],
        ['🐉', '🪙', '#fff1d6', '#f0cf91', '#f59e0b', '🔥', '💎'],
      ],
      build: [['🏕️', 'Moon Camp'], ['🔭', 'Telescope'], ['🧪', 'Space Lab'], ['📡', 'Big Dish'], ['🌌', 'Galaxy Mall'], ['🪐', 'Planet Rudra']],
    },
  ];
  // delivery vehicle per upgrade tier (levels 1-3, 4-6, 7-9, 10), per world
  const VEH = [['🛻', '🚚', '🚛', '🚁'], ['🛺', '🚐', '🚌', '🚁'], ['🚙', '🚌', '🚎', '🎈'], ['🛻', '🚛', '🚂', '🚁'], ['🛸', '🚀', '☄️', '🌠']];
  const COL_RIDE = ['', '🛹', '🛴', '🚀'];
  const CASH_HAT = ['', '🧢', '🎩', '👑'];
  const tierOf = l => (l >= 10 ? 3 : l >= 7 ? 2 : l >= 4 ? 1 : 0);
  const WD = WORLD_DEFS.map((d, w) => {
    const scale = Math.pow(2, w);
    return Object.assign({}, d, {
      lanes: d.lanes.map(([a, p, tint, dirt, stripe, d1, d2], k) => ({
        a, p, tint, dirt, stripe, deco: [d1, d2], price: PRICE[k], time: TIME[k],
        unlock: k ? { need: NEED[k] + 25 * w, cost: UNLOCK[k] * scale } : null,
      })),
      build: d.build.map(([e, n], i) => ({ e, n, fx: i === 0 ? d.lanes[0][0] + BFX[0] : BFX[i], cost: BCOST[i] * scale })),
      work: { col: { e: d.work[0], base: 10 }, cash: { e: d.work[1], base: 25 }, truck: { e: d.work[2], base: 120 } },
    });
  });

  // Wonders: giant projects that need several worlds and are paid with their coins,
  // so finished worlds keep having something to save up for. Built in order.
  // need: [world, building index] or [world, 'u'] (world opened)
  const WONDERS = [
    { id: 'train', e: '🚂', n: 'Train Station', fx: '📦 x2', need: [[0, 5], [1, 1]], cost: [[0, 5e7], [1, 2e5]] },
    { id: 'fair', e: '🎠', n: 'Fun Fair', fx: '💰 x2', need: [[1, 5], [2, 'u']], cost: [[0, 1e9], [1, 5e7]] },
    { id: 'castle', e: '🏯', n: "Rudra's Castle", fx: '💰 x3', need: [[0, 5], [1, 5], [2, 2]], cost: [[0, 5e9], [1, 5e8], [2, 1e7]] },
    { id: 'space', e: '🛰️', n: 'Space Center', fx: '🌙 ✨', need: [[2, 5], [3, 5]], cost: [[0, 1e11], [1, 1e10], [2, 1e9], [3, 1e8]] },
    { id: 'statue', e: '🗽', n: 'Golden Rudra', fx: '💰 x5', need: [[4, 5]], cost: [[0, 1e12], [1, 1e11], [2, 1e10], [3, 1e9], [4, 1e8]] },
  ];

  // ---------- state ----------
  const DEFAULT_TASKS = ['🧸 Tidy up your play area', '🍎 Eat a healthy snack', '💧 Drink a glass of water', '📚 Read a book for 10 minutes', '🤸 Do 10 jumping jacks'];
  const parentDefaults = () => ({ pin: null, salt: '', ti: 0, timer: { on: false, minutes: 15, daily: 0, tasks: DEFAULT_TASKS.slice() } });
  const storyDefaults = () => ({ q: 0, done: {}, intro: false, finale: false });
  const cityDefaults = () => ({ cars: {}, ride: '', food: {}, visitors: {}, rescues: 0, hi: {} });
  const mapDefaults = () => ({ places: {}, slots: {}, wslots: {} });
  const playDefaults = () => ({ used: 0, day: '', dayUsed: 0, extra: 0, warned: false, lock: null });
  function freshWorld(w) {
    return {
      u: w === 0, coins: 0, total: 0, b: [false, false, false, false, false, false],
      lanes: [0, 1, 2, 3, 4, 5].map(i => ({ u: i === 0, n: 1, g: 0, st: 0, sold: 0, col: 0, cash: 0, truck: 0 })),
      stats: { del: 0 },
    };
  }
  function fresh() {
    return { v: 2, rev: 0, pend: false, cur: 0, ach: {}, wonders: {}, parent: parentDefaults(), play: playDefaults(), story: storyDefaults(), city: cityDefaults(), map: mapDefaults(), mute: false, silly: true, last: Date.now(), seen: WD.map((_, i) => i === 0), worlds: WD.map((_, i) => freshWorld(i)) };
  }
  function mergeWorld(w, d) {
    const g = freshWorld(w);
    if (!d) return g;
    ['u', 'coins', 'total'].forEach(f => { if (d[f] != null) g[f] = d[f]; });
    g.lanes = g.lanes.map((L, i) => Object.assign(L, (d.lanes || [])[i] || {}));
    g.b = g.b.map((_, i) => !!(d.b || [])[i]);
    g.stats = Object.assign({ del: 0 }, d.stats);
    if (w === 0) g.u = true;
    return g;
  }
  // ---------- profiles (one save per player, each synced to the cloud by its secret code) ----------
  const PROFILES_KEY = 'rudrasFarm.profiles';
  const saveKey = code => 'rudrasFarm.save.' + code;
  const CODE_WORDS = ['TIGER', 'PANDA', 'HIPPO', 'KOALA', 'ZEBRA', 'OTTER', 'LLAMA', 'EAGLE', 'SHARK', 'WHALE', 'MANGO', 'LEMON',
    'ROBOT', 'CANDY', 'PIZZA', 'TRUCK', 'HONEY', 'BUNNY', 'PUPPY', 'KITTY', 'STARS', 'CLOUD', 'RIVER', 'MAPLE'];
  const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  function newCode() {
    const r = new Uint32Array(9);
    crypto.getRandomValues(r);
    let c = CODE_WORDS[r[0] % CODE_WORDS.length];
    for (let i = 1; i < 9; i++) c += CODE_CHARS[r[i] % CODE_CHARS.length];
    return c;
  }
  const cleanCode = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const validCode = c => /^[A-Z]{5}[2-9A-Z]{8}$/.test(c);
  const prettyCode = c => `${c.slice(0, 5)}-${c.slice(5, 9)}-${c.slice(9)}`;
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }

  let PR = readJSON(PROFILES_KEY);
  const qs = new URLSearchParams(location.search);
  const imports = (qs.get('import') || '').split(',').map(cleanCode).filter(validCode);
  const linkCode = cleanCode(qs.get('p') || qs.get('cur') || imports[0]);
  const old = readJSON(SAVE_KEY); // progress from before profiles existed (kept as a backup too)
  if (!PR || !Array.isArray(PR.list) || !PR.list.length) {
    PR = { cur: null, list: [] };
    if (old || !validCode(linkCode)) {
      const code = newCode();
      PR = { cur: code, list: [{ code, name: old ? 'Rudra' : 'Player', av: '🧒', auto: !old }] };
      if (old) writeJSON(saveKey(code), old);
    }
  }
  // opening a share link (?p=CODE) adds that profile on this device and switches to it
  if (validCode(linkCode)) {
    dropBlankDefaults(linkCode);
    imports.concat(linkCode).forEach(c => { if (!PR.list.some(p => p.code === c)) PR.list.push({ code: c, name: '…', av: '🧒' }); });
    PR.cur = linkCode;
    history.replaceState(null, '', location.pathname);
  }
  if (!PR.list.some(p => p.code === PR.cur)) PR.cur = PR.list[0].code;
  const saveProfiles = () => writeJSON(PROFILES_KEY, PR);
  // forget the empty auto-created profile once this device joins a real one
  function dropBlankDefaults(keep) {
    PR.list = PR.list.filter(p => {
      if (p.code === keep || !p.auto) return true;
      const d = readJSON(saveKey(p.code));
      const blank = !d || !d.worlds || d.worlds.every(g => !g.total);
      if (blank) localStorage.removeItem(saveKey(p.code));
      return !blank;
    });
  }
  const curProfile = () => PR.list.find(p => p.code === PR.cur);
  saveProfiles();

  function parseSave(d) {
    const base = fresh();
    if (!d) return base;
    if (d.v === 1) { // single-farm save from the first version
      base.worlds[0] = mergeWorld(0, d);
    } else if (d.v === 2) {
      base.worlds = WD.map((_, i) => mergeWorld(i, (d.worlds || [])[i]));
      base.cur = base.worlds[d.cur] && base.worlds[d.cur].u ? d.cur : 0;
      base.seen = WD.map((_, i) => !!(d.seen || [])[i] || i === base.cur);
    } else return base;
    base.ach = d.ach || {};
    base.mute = !!d.mute;
    base.silly = d.silly !== false;
    base.wonders = d.wonders || {};
    base.parent = Object.assign(parentDefaults(), d.parent || {});
    base.parent.timer = Object.assign(parentDefaults().timer, (d.parent || {}).timer || {});
    base.play = Object.assign(playDefaults(), d.play || {});
    base.story = Object.assign(storyDefaults(), d.story || {});
    base.city = Object.assign(cityDefaults(), d.city || {});
    base.map = Object.assign(mapDefaults(), d.map || {});
    base.rev = d.rev | 0;
    base.pend = !!d.pend;
    if (d.last) base.last = d.last;
    return base;
  }
  const load = code => parseSave(readJSON(saveKey(code)));
  let S = load(PR.cur);
  let syncedSnap = null; // the state we last saw in the cloud (null = not known yet)
  const snapshot = () => JSON.stringify(Object.assign({}, S, { last: 0, rev: 0, pend: false }));
  function save() {
    S.last = Date.now();
    const cp = curProfile();
    if (cp.auto && progress(S) > 0) { delete cp.auto; saveProfiles(); }
    if (syncedSnap !== null && snapshot() !== syncedSnap) S.pend = true;
    writeJSON(saveKey(PR.cur), S);
  }
  // a world opens once the previous world's last animal is unlocked
  function unlockWorlds() {
    let opened = false;
    for (let w = 1; w < WD.length; w++) {
      const ready = WD[w].wonder ? !!S.wonders[WD[w].wonder] : S.worlds[w - 1].lanes[5].u;
      if (!S.worlds[w].u && ready) { S.worlds[w].u = true; opened = true; }
    }
    return opened;
  }
  unlockWorlds();

  // current-world bindings (rebound by bindWorld when travelling)
  let G, ANIMALS, BUILD, WORK;
  function bindWorld() {
    G = S.worlds[S.cur];
    ANIMALS = WD[S.cur].lanes; BUILD = WD[S.cur].build; WORK = WD[S.cur].work;
  }
  bindWorld();

  const anyLane = f => S.worlds.some(g => g.u && g.lanes.some(L => L.u && f(L)));
  const totalEarned = () => S.worlds.reduce((t, g) => t + g.total, 0);
  const F = () => S.worlds[0];
  const ACH = [
    { id: 'egg1',   e: '🥚', t: '1',    s: 1, ok: () => F().lanes[0].sold >= 1 },
    { id: 'egg100', e: '🥚', t: '100',  s: 2, ok: () => F().lanes[0].sold >= 100 },
    { id: 'egg1k',  e: '🥚', t: '1000', s: 3, ok: () => F().lanes[0].sold >= 1000 },
    { id: 'col',    e: '🧑‍🌾', t: '',     s: 1, ok: () => anyLane(L => L.col > 0) },
    { id: 'cash',   e: '🧑‍💼', t: '',     s: 1, ok: () => anyLane(L => L.cash > 0) },
    { id: 'truck',  e: '🚚', t: '',     s: 1, ok: () => S.worlds.some(g => g.stats.del >= 1) },
    { id: 'crew',   e: '🤝', t: '3',    s: 2, ok: () => anyLane(L => L.col && L.cash && L.truck) },
    { id: 'herd',   e: '🐔', t: '5',    s: 2, ok: () => anyLane(L => L.n >= MAX_ANIMALS) },
    { id: 'maxlvl', e: '🏅', t: '10',   s: 3, ok: () => anyLane(L => Math.max(L.col, L.cash, L.truck) >= MAXLVL) },
    { id: 'c100',   e: '💰', t: '100',  s: 1, ok: () => totalEarned() >= 100 },
    { id: 'c1k',    e: '💰', t: '1K',   s: 1, ok: () => totalEarned() >= 1e3 },
    { id: 'c10k',   e: '💰', t: '10K',  s: 2, ok: () => totalEarned() >= 1e4 },
    { id: 'c100k',  e: '💰', t: '100K', s: 2, ok: () => totalEarned() >= 1e5 },
    { id: 'c1m',    e: '💰', t: '1M',   s: 3, ok: () => totalEarned() >= 1e6 },
    { id: 'c10m',   e: '💰', t: '10M',  s: 3, ok: () => totalEarned() >= 1e7 },
    { id: 'c100m',  e: '💰', t: '100M', s: 3, ok: () => totalEarned() >= 1e8 },
    { id: 'c1b',    e: '💰', t: '1B',   s: 5, ok: () => totalEarned() >= 1e9 },
    { id: 'milk',   e: '🥛', t: '100',  s: 2, ok: () => F().lanes[1].sold >= 100 },
    { id: 'honey',  e: '🍯', t: '100',  s: 2, ok: () => F().lanes[4].sold >= 100 },
    { id: 'ride',   e: '🎟️', t: '100',  s: 3, ok: () => F().lanes[5].sold >= 100 },
    ...[1, 2, 3, 4, 5].map(k => ({ id: 'u' + k, e: WD[0].lanes[k].a, t: '🔓', s: 2, ok: () => F().lanes[k].u })),
    { id: 'coop',   e: '🛖', t: '',     s: 2, ok: () => F().b[0] },
    { id: 'shop',   e: '🏪', t: '',     s: 3, ok: () => F().b[3] },
    { id: 'company', e: '🏢', t: '👑',  s: 5, ok: () => F().b[5] },
  ].map(a => Object.assign({ w: 0 }, a));
  for (let w = 1; w < WD.length; w++) {
    const D = WD[w], g = () => S.worlds[w];
    ACH.push({ w, id: `w${w}open`, e: D.icon, t: '🗺️', s: 3, ok: () => g().u });
    ACH.push({ w, id: `w${w}p100`, e: D.lanes[0].p, t: '100', s: 2, ok: () => g().lanes[0].sold >= 100 });
    for (let k = 1; k < 6; k++) ACH.push({ w, id: `w${w}u${k}`, e: D.lanes[k].a, t: '🔓', s: 2, ok: () => g().lanes[k].u });
    ACH.push({ w, id: `w${w}done`, e: D.build[5].e, t: '👑', s: 5, ok: () => g().b[5] });
  }

  ACH.push({ w: WD.length, id: 'rescue5', e: '🚒', t: '5', s: 3, ok: () => (S.city.rescues || 0) >= 5 });
  ACH.push({ w: WD.length, id: 'visitors3', e: '🦄', t: '3', s: 3, ok: () => Object.keys(S.city.visitors).length >= 3 });
  ACH.push({ w: WD.length, id: 'ride_super', e: '🏎️', t: '', s: 3, ok: () => !!S.city.cars.supercar });
  ACH.push({ w: WD.length, id: 'food6', e: '🍽️', t: '6', s: 5, ok: () => Object.keys(S.city.food).length >= 6 });
  WONDERS.forEach(x => ACH.push({ w: WD.length, id: 'wonder_' + x.id, e: x.e, t: '🗺️', s: 5, ok: () => !!S.wonders[x.id] }));

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
  function prodTime(k, w = S.cur) {
    const b = S.worlds[w].b;
    return WD[w].lanes[k].time / ((k === 0 && b[0] ? 2 : 1) * (b[1] ? 1.5 : 1));
  }
  const starCount = () => ACH.reduce((t, a) => t + (S.ach[a.id] ? a.s : 0), 0) + Object.keys(S.story.done).length;
  const worldsDone = () => S.worlds.filter(g => g.b[5]).length;
  function mult(w = S.cur) {
    const b = S.worlds[w].b;
    let m = (1 + 0.02 * starCount()) * Math.pow(WORLD_BONUS, worldsDone());
    if (S.wonders.fair) m *= 2;
    if (S.wonders.castle) m *= 3;
    if (S.wonders.statue) m *= 5;
    if (b[3]) m *= 2;
    if (b[4]) m *= 2;
    if (b[5]) m *= 3;
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

  // runtime-only objects per lane (rebuilt whenever the world changes)
  const RT = [0, 1, 2, 3, 4, 5].map(() => ({ el: null }));
  function resetRT() {
    RT.forEach(R => Object.assign(R, {
      player: { x: 0.5, carry: 0, goal: null },
      col: { x: COUNTER_X, carry: 0, ph: 'toPen' },
      truck: { x: TRUCK_OUT, ph: 'away', t: 1, load: 0 },
      cashT: 0, gShown: -1, stShown: -1,
    }));
  }
  resetRT();

  // ---------- sound (everything is synthesised; no audio files) ----------
  let AC = null, OUT = null, NOISE = null, voiceGain = 1;
  function ac() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      OUT = AC.createDynamicsCompressor(); // keeps stacked sounds from clipping
      OUT.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  // schedule a value path [[fraction of dur, value], ...] on an AudioParam
  function path(param, pts, t, dur, linear) {
    pts.forEach(([at, v], i) => {
      if (!i) param.setValueAtTime(v, t);
      else if (linear) param.linearRampToValueAtTime(v, t + at * dur);
      else param.exponentialRampToValueAtTime(Math.max(v, 1), t + at * dur);
    });
  }
  function envelope(a, t, dur, vol) {
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    vol = Math.min(0.9, vol * voiceGain);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.025, dur / 4));
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }
  function lfo(a, t, dur, rate, depth, target) {
    const l = a.createOscillator(), lg = a.createGain();
    l.frequency.value = rate; lg.gain.value = depth;
    l.connect(lg).connect(target);
    l.start(t); l.stop(t + dur + 0.05);
  }
  // one oscillator voice: pitch path, vibrato, filter sweep, tremolo ("brrrt")
  function voice({ type = 'sawtooth', f, dur, vol = 0.25, vib = 0, vibRate = 6, filt = null, ff = [[0, 1000]], q = 1, am = 0, amRate = 30, delay = 0 }) {
    if (S.mute) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    o.type = type;
    path(o.frequency, f, t, dur);
    if (vib) lfo(a, t, dur, vibRate, vib, o.frequency);
    let node = o;
    if (filt) {
      const bq = a.createBiquadFilter();
      bq.type = filt; bq.Q.value = q;
      path(bq.frequency, ff, t, dur, true);
      node.connect(bq); node = bq;
    }
    const g = envelope(a, t, dur, vol);
    node.connect(g); node = g;
    if (am) {
      const tg = a.createGain();
      tg.gain.value = 1 - am;
      lfo(a, t, dur, amRate, am, tg.gain);
      node.connect(tg); node = tg;
    }
    node.connect(OUT);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise({ dur, vol = 0.2, filt = 'bandpass', ff = [[0, 1000]], q = 1, delay = 0 }) {
    if (S.mute) return;
    const a = ac(); if (!a) return;
    if (!NOISE) {
      NOISE = a.createBuffer(1, a.sampleRate, a.sampleRate);
      const d = NOISE.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = a.currentTime + delay;
    const n = a.createBufferSource();
    n.buffer = NOISE; n.loop = true;
    const bq = a.createBiquadFilter();
    bq.type = filt; bq.Q.value = q;
    path(bq.frequency, ff, t, dur, true);
    n.connect(bq).connect(envelope(a, t, dur, vol)).connect(OUT);
    n.start(t); n.stop(t + dur + 0.05);
  }
  function tone(f, d = 0.12, type = 'sine', v = 0.2, f2 = null, delay = 0) {
    voice({ type, f: f2 ? [[0, f], [1, f2]] : [[0, f], [1, f]], dur: d, vol: v, delay });
  }

  // --- farts (the star of the show)
  function fartOne(base, dur, delay = 0, wob = 1) {
    voice({ type: 'sawtooth', f: [[0, base * 1.35], [0.3, base], [1, base * 0.6]], dur, vol: 0.5, delay,
      vib: base * 0.3 * wob, vibRate: rnd(14, 28), filt: 'lowpass', ff: [[0, 900], [1, 280]], q: 2, am: 0.65, amRate: rnd(24, 46) });
    noise({ dur, vol: 0.1, ff: [[0, base * 4], [1, base * 2]], q: 2, delay });
  }
  function fart(kind) {
    kind = kind || pick(['classic', 'squeaky', 'long', 'triple', 'wet', 'classic']);
    if (kind === 'squeaky') return fartOne(rnd(170, 270), rnd(0.25, 0.45), 0, 0.6);
    if (kind === 'long') return fartOne(rnd(45, 62), rnd(0.9, 1.3), 0, 1.2);
    if (kind === 'triple') return [0, 0.17, 0.32].forEach((d, i) => fartOne(rnd(70, 100) * (1 + i * 0.18), rnd(0.11, 0.16), d));
    if (kind === 'wet') { fartOne(rnd(58, 78), rnd(0.35, 0.5)); noise({ dur: 0.45, vol: 0.14, filt: 'lowpass', ff: [[0, 1300], [1, 250]] }); return; }
    fartOne(rnd(70, 100), rnd(0.35, 0.6));
  }

  // --- animal and machine voices, one per lane
  const VOICES = {
    cluck: () => {
      [0, 0.11, 0.2].forEach(d => voice({ type: 'square', f: [[0, 620], [1, 460]], dur: 0.07, vol: 0.16, filt: 'bandpass', ff: [[0, 1300]], q: 3, delay: d }));
      voice({ f: [[0, 520], [0.3, 950], [1, 600]], dur: 0.28, vol: 0.22, filt: 'bandpass', ff: [[0, 1500]], q: 2, delay: 0.32 });
    },
    moo: () => voice({ f: [[0, 115], [0.3, 150], [1, 100]], dur: 1.0, vol: 0.4, vib: 3, vibRate: 5, filt: 'lowpass', ff: [[0, 250], [0.3, 950], [1, 330]], q: 5 }),
    baa: () => voice({ f: [[0, 430], [1, 350]], dur: 0.75, vol: 0.3, vib: 32, vibRate: 9, filt: 'bandpass', ff: [[0, 900], [0.2, 1600], [1, 1100]], q: 3 }),
    oink: () => {
      [0, 0.2].forEach(d => voice({ type: 'square', f: [[0, 260], [0.4, 430], [1, 210]], dur: 0.15, vol: 0.28, filt: 'bandpass', ff: [[0, 1400]], q: 6, delay: d }));
      noise({ dur: 0.12, vol: 0.12, ff: [[0, 700]], q: 3, delay: 0.4 });
    },
    buzz: () => voice({ f: [[0, 210], [0.5, 245], [1, 200]], dur: 0.9, vol: 0.18, vib: 20, vibRate: 3, filt: 'bandpass', ff: [[0, 650]], q: 2, am: 0.7, amRate: 48 }),
    neigh: () => voice({ f: [[0, 700], [0.2, 1150], [1, 480]], dur: 0.95, vol: 0.24, vib: 130, vibRate: 13, filt: 'bandpass', ff: [[0, 1600], [1, 900]], q: 2 }),
    woof: () => [0, 0.22].forEach(d => {
      noise({ dur: 0.1, vol: 0.25, filt: 'lowpass', ff: [[0, 900]], delay: d });
      voice({ f: [[0, 270], [1, 140]], dur: 0.15, vol: 0.38, filt: 'lowpass', ff: [[0, 800]], q: 2, delay: d });
    }),
    meow: () => voice({ f: [[0, 460], [0.35, 760], [1, 420]], dur: 0.75, vol: 0.3, vib: 8, vibRate: 6, filt: 'bandpass', ff: [[0, 500], [0.35, 1900], [1, 700]], q: 5 }),
    hop: () => [0, 0.17].forEach(d => voice({ type: 'sine', f: [[0, 260], [1, 950]], dur: 0.13, vol: 0.3, delay: d })),
    squeak: () => [0, 0.12, 0.24].forEach(d => voice({ type: 'sine', f: [[0, 1800], [0.5, 2600], [1, 2000]], dur: 0.09, vol: 0.18, delay: d })),
    bloop: () => [[0, 520, 150], [0.3, 380, 100]].forEach(([d, a, b]) => voice({ type: 'sine', f: [[0, a], [1, b]], dur: 0.25, vol: 0.35, delay: d })),
    squawk: () => [0, 0.3].forEach(d => voice({ f: [[0, 1100], [0.5, 1450], [1, 900]], dur: 0.25, vol: 0.2, vib: 220, vibRate: 28, filt: 'bandpass', ff: [[0, 2000]], q: 3, delay: d })),
    chomp: () => [0, 0.26].forEach(d => {
      noise({ dur: 0.07, vol: 0.45, ff: [[0, 350]], q: 2, delay: d });
      voice({ type: 'square', f: [[0, 95], [1, 55]], dur: 0.1, vol: 0.3, filt: 'lowpass', ff: [[0, 600]], delay: d });
    }),
    munch: () => [0, 0.09, 0.2, 0.28, 0.4].forEach(d => noise({ dur: 0.045, vol: 0.3, ff: [[0, rnd(1800, 3200)]], q: 1.5, delay: d })),
    boing: () => voice({ type: 'sine', f: [[0, 110], [0.4, 520], [1, 330]], dur: 0.55, vol: 0.35, vib: 70, vibRate: 18 }),
    roar: () => {
      voice({ f: [[0, 85], [0.3, 150], [1, 65]], dur: 1.1, vol: 0.45, am: 0.5, amRate: 32, filt: 'lowpass', ff: [[0, 400], [0.3, 1500], [1, 300]], q: 3 });
      noise({ dur: 1.0, vol: 0.18, filt: 'lowpass', ff: [[0, 900], [1, 200]] });
    },
    trumpet: () => voice({ f: [[0, 340], [0.15, 720], [0.8, 660], [1, 400]], dur: 0.95, vol: 0.34, vib: 26, vibRate: 7, filt: 'bandpass', ff: [[0, 900], [0.2, 1900], [1, 1000]], q: 4 }),
    chop: () => [0, 0.2].forEach(d => {
      noise({ dur: 0.08, vol: 0.45, filt: 'lowpass', ff: [[0, 600]], delay: d });
      voice({ type: 'sine', f: [[0, 190], [1, 80]], dur: 0.13, vol: 0.4, delay: d });
    }),
    clack: () => [0, 0.15].forEach(d => {
      noise({ dur: 0.05, vol: 0.35, ff: [[0, 2300]], q: 4, delay: d });
      voice({ type: 'square', f: [[0, 900], [1, 650]], dur: 0.05, vol: 0.12, delay: d });
    }),
    whoosh: () => noise({ dur: 0.65, vol: 0.3, ff: [[0, 300], [1, 2600]], q: 1.2 }),
    clank: () => [[0, 620], [0.01, 935], [0.25, 700]].forEach(([d, f]) => voice({ type: 'square', f: [[0, f], [1, f * 0.98]], dur: 0.3, vol: 0.12, filt: 'bandpass', ff: [[0, f * 3]], q: 10, delay: d })),
    zap: () => { voice({ f: [[0, 2500], [1, 70]], dur: 0.28, vol: 0.2 }); noise({ dur: 0.2, vol: 0.12, filt: 'highpass', ff: [[0, 3000]] }); },
    ting: () => [0, 0.22].forEach(d => { tone(2100, 0.4, 'sine', 0.22, null, d); tone(3150, 0.25, 'triangle', 0.08, null, d); }),
  };
  const LANE_VOICES = [
    ['cluck', 'moo', 'baa', 'oink', 'buzz', 'neigh'],
    ['woof', 'meow', 'hop', 'squeak', 'bloop', 'squawk'],
    ['chomp', 'munch', 'boing', 'roar', 'roar', 'trumpet'],
    ['chop', 'clack', 'whoosh', 'clank', 'zap', 'ting'],
  ];
  const VOICE_GAIN = { cluck: 3, baa: 3, oink: 4, buzz: 3.5, neigh: 2.5, meow: 3.5, squawk: 4, munch: 2, trumpet: 3, clack: 1.6, whoosh: 2, clank: 3.5, squeak: 1.8 };
  const lastVoice = {};
  function laneVoice(k, force) {
    if (S.mute) return;
    const now = performance.now();
    if (!force && now - (lastVoice[k] || 0) < 600) return; // don't spam when tapping fast
    lastVoice[k] = now;
    const name = LANE_VOICES[S.cur][k];
    voiceGain = VOICE_GAIN[name] || 1; // filtered voices lose energy; even out loudness
    VOICES[name]();
    voiceGain = 1;
  }

  let lastTiny = 0;
  const sfx = {
    pop: () => tone(480, 0.12, 'sine', 0.3, 950),
    coin: () => { tone(988, 0.09, 'square', 0.07); tone(1319, 0.22, 'square', 0.07, null, 0.08); },
    tiny: () => { const n = performance.now(); if (n - lastTiny < 140) return; lastTiny = n; tone(1568, 0.06, 'triangle', 0.06); },
    buy: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.2, null, i * 0.07)),
    nope: () => (S.silly ? fart() : tone(240, 0.18, 'sawtooth', 0.07, 150)),
    honk: () => {
      if (!S.silly) { tone(392, 0.12, 'square', 0.06); tone(392, 0.14, 'square', 0.06, null, 0.17); return; }
      [0, 0.55].forEach(d => voice({ type: 'square', f: [[0, 210], [0.45, 330], [1, 345]], dur: 0.48, vol: 0.18, filt: 'lowpass', ff: [[0, 1500]], q: 3, delay: d })); // AH-OOGA
    },
    burp: () => voice({ f: [[0, 95], [0.5, 78], [1, 58]], dur: 0.6, vol: 0.42, am: 0.5, amRate: 21, filt: 'lowpass', ff: [[0, 520], [1, 240]], q: 6 }),
    boing: () => VOICES.boing(),
    slideUp: () => voice({ type: 'triangle', f: [[0, 320], [1, 1500]], dur: 0.42, vol: 0.22, vib: 12, vibRate: 7 }),
    yippee: () => [0, 0.1, 0.2].forEach((d, i) => voice({ type: 'triangle', f: [[0, 700 + i * 200], [1, 1300 + i * 250]], dur: 0.09, vol: 0.22, delay: d })),
    partyHorn: () => voice({ f: [[0, 380], [0.12, 820], [1, 790]], dur: 0.65, vol: 0.55, vib: 9, vibRate: 11, filt: 'bandpass', ff: [[0, 1500]], q: 2 }),
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
  function puff(target) {
    if (!S.silly || !target) return;
    const r = target.getBoundingClientRect();
    const p = el('div', 'puff', '💨');
    p.style.left = (r.left + r.width * 0.5) + 'px';
    p.style.top = (r.top + r.height * 0.4) + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
  function shake(e) { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); sfx.nope(); puff(e); }
  function tapFx(e) { e.classList.add('tapped'); setTimeout(() => e.classList.remove('tapped'), 110); }

  // ---------- earning ----------
  function earn(k, n, bonus) {
    if (n <= 0) return 0;
    const v = n * ANIMALS[k].price * mult() * bonus;
    G.coins += v; G.total += v; G.lanes[k].sold += n;
    return v;
  }

  // ---------- player actions ----------
  function tapPen(k) {
    ac(); buzz(8); tapFx(RT[k].el.pen);
    RT[k].player.goal = 'pen';
  }
  function animalTap(k, an) {
    an.classList.remove('jump'); void an.offsetWidth; an.classList.add('jump');
    if (S.silly && Math.random() < 0.25) { fart(); puff(an); } else laneVoice(k, true);
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
    const L = G.lanes[k], R = RT[k], A = ANIMALS[k];
    // animals lay / produce
    const cap = penCap(L);
    if (L.g < cap) L.g = Math.min(cap, L.g + L.n * dt / prodTime(k));

    // the player (Rudra)
    const P = R.player; P.moving = false;
    if (P.goal) {
      const atPen = P.goal === 'pen';
      if (move(P, atPen ? PEN_X : COUNTER_X, playerSpeed(), dt)) {
        if (atPen) {
          const take = Math.min(Math.floor(L.g), playerCap() - P.carry);
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
          if (S.silly && T.load >= truckCap(L.truck) && Math.random() < 0.4) sfx.burp();
          const v = earn(k, T.load, 1.5);
          G.stats.del++; sfx.coin();
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
    const L = G.lanes[k], R = RT[k], E = R.el, A = ANIMALS[k];
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
    const L = G.lanes[k], E = RT[k].el;
    E.col.style.display = L.col ? '' : 'none';
    E.cashier.style.display = L.cash ? '' : 'none';
    E.truck.style.display = L.truck ? '' : 'none';
  }

  // workers get new gear (and the stall gets fancier) every few upgrade levels
  function applyTiers(k) {
    const L = G.lanes[k], E = RT[k].el;
    const tc = tierOf(L.col), ts = tierOf(L.cash), tt = tierOf(L.truck);
    E.col.querySelector('.ride').textContent = COL_RIDE[tc];
    E.col.querySelector('.hat').textContent = tc === 3 ? '👑' : '';
    E.col.className = E.col.className.replace(/ ?t\d/g, '') + ' t' + tc;
    E.col.classList.toggle('hashat', tc === 3);
    E.cashier.querySelector('.hat').textContent = CASH_HAT[ts];
    E.counter.className = 'counter s' + (L.cash ? ts : 0);
    const veh = VEH[S.cur][tt];
    E.truck.querySelector('.body').textContent = veh;
    E.truck.classList.toggle('fly', tt === 3);
    E.btns.truck.querySelector('.we').textContent = veh;
    E.btns.col.querySelector('.wacc').textContent = COL_RIDE[tc];
    E.btns.cash.querySelector('.wacc').textContent = CASH_HAT[ts];
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
    const A = ANIMALS[k], L = G.lanes[k], R = RT[k];
    const sec = el('section', 'card lane');
    sec.style.setProperty('--tint', A.tint);
    sec.style.setProperty('--dirt', A.dirt);
    sec.style.setProperty('--stripe', A.stripe);
    const btn = (w, e) => `<button class="wbtn" data-w="${w}"><span class="we">${e}</span><span class="wacc"></span><span class="wl"></span><span class="wp">💰<b></b></span></button>`;
    sec.innerHTML = `
      <div class="lane-head"><span>${A.a}</span><span class="lh-sold">${A.p} <b>0</b></span></div>
      <div class="scene">
        <div class="deco" style="left:44%;top:4%">${A.deco[0]}</div>
        <div class="deco" style="left:52%;top:30%">${A.deco[1]}</div>
        <div class="deco" style="left:2%;top:84%">${A.deco[0]}</div>
        <div class="deco" style="left:30%;top:86%">${A.deco[1]}</div>
        <div class="road"></div>
        <div class="pen"><div class="ground"></div><div class="herd"></div><b class="gcount"></b></div>
        <div class="counter"><div class="awning"></div><div class="cashier"><span class="hat"></span>${WORK.cash.e}</div><div class="table"><div class="pile"></div><b class="stock"></b></div></div>
        <div class="actor truck"><span class="flip"><span class="body">${WORK.truck.e}</span></span><div class="carry"></div></div>
        <div class="actor col"><span class="flip"><span class="body">${WORK.col.e}</span><span class="ride"></span></span><span class="hat"></span><div class="carry"></div></div>
        <div class="actor player"><span class="flip"><span class="body">${curProfile().av}</span><span class="ride">${rideEmoji()}</span></span><div class="carry"></div></div>
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
    R.el.pen.addEventListener('click', e => {
      const an = e.target.closest('.animal');
      if (an) animalTap(k, an); else laneVoice(k);
      tapPen(k);
    });
    R.el.counter.addEventListener('click', () => tapCounter(k));
    for (let i = 0; i < L.n; i++) addAnimal(k, false);
    setVisibility(k);
    applyTiers(k);
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

  // ---------- navigation: city map -> district map -> business ----------
  let view = 'city';   // 'city' | 'district'
  let openK = -1;      // lane open in the business view, or -1
  const laneView = $('#laneView');
  function renderLanes() { if (openK >= 0) openLane(openK, true); }
  function openLane(k, keep) {
    const L = G.lanes[k];
    if (!L || !L.u) return;
    if (!keep) resetRT();
    RT.forEach(R => { R.el = null; });
    openK = k;
    laneWrap.innerHTML = '';
    laneWrap.appendChild(buildLane(k));
    $('#lvTitle').innerHTML = `${WD[S.cur].icon} ${ANIMALS[k].a} ${ANIMALS[k].p}`;
    laneView.classList.remove('hidden');
    if (!keep) laneView.scrollTop = 0;
    shownCoins = -1; refreshUI();
  }
  function closeLane(quiet) {
    if (openK < 0) return;
    openK = -1;
    RT.forEach(R => { R.el = null; });
    laneWrap.innerHTML = '';
    laneView.classList.add('hidden');
    if (!quiet) { renderCurrent(); shownCoins = -1; refreshUI(); }
  }
  $('#lvBack').addEventListener('click', () => { ac(); sfx.pop(); closeLane(); });

  function renderNav() {
    const nav = $('#navbar'), D = WD[S.cur];
    nav.innerHTML = view === 'city'
      ? `<span class="navtitle"><span class="skyicon">☀️</span><span class="wxicon"></span> ${esc(townName())}</span><span class="navhint">${needPlacing().length ? '📍' : '👆'}</span>`
      : `<button class="navback" id="navBack">⬅️ 🏙️</button><span class="navtitle"><span class="wxicon"></span>${D.icon} ${esc(G.b[5] ? D.done : D.title)}</span>`;
    const b = $('#navBack');
    if (b) b.onclick = () => { ac(); sfx.pop(); setView('city'); };
    refreshMapBtn();
    layoutMap();
    wxShown = '';
  }
  function setView(v, focus) {
    if (openK >= 0) closeLane(true);
    view = v;
    renderNav();
    renderCurrent(focus);
    shownCoins = -1; refreshUI();
  }
  function renderCurrent(focus) { if (view === 'city') renderCityMap(focus); else renderDistrictMap(focus); }
  function renderCity() { renderCurrent(); }   // older call sites
  function openDistrict(w, focus) {
    ac();
    if (!S.worlds[w] || !S.worlds[w].u) return;
    if (!placed('w' + w)) { setView('city'); return; } // choose where it goes first
    if (w !== S.cur) { S.cur = w; S.seen[w] = true; bindWorld(); resetRT(); applyTheme(); save(); }
    sfx.buy(); buzz(20);
    setView('district', focus);
  }
  const goWorld = (w, focus) => openDistrict(w, focus);
  function applyTheme() {
    const D = WD[S.cur], r = document.documentElement.style;
    D.bg.forEach((c, i) => r.setProperty('--bg' + (i + 1), c));
    r.setProperty('--wood', D.fence[0]);
    r.setProperty('--wood2', D.fence[1]);
  }

  // ---------- placing things on the maps ----------
  const placed = key => S.map.places[key] != null;
  const placeIcon = key => (key === 'garage' ? '🚗' : key === 'food' ? '🍽️' : WD[+key.slice(1)].icon);
  const placeName = key => (key === 'garage' ? 'Garage' : key === 'food' ? 'Food Street' : WD[+key.slice(1)].title);
  function openedPlaces() {
    const out = [];
    S.worlds.forEach((g, w) => { if (g.u) out.push('w' + w); });
    if (garageOpen()) out.push('garage');
    if (foodOpen()) out.push('food');
    return out;
  }
  const needPlacing = () => openedPlaces().filter(k => !placed(k));
  const freePlots = () => Object.keys(PLOTS).filter(p => !Object.values(S.map.places).includes(p));
  const slotsOf = w => (S.map.slots['w' + w] = S.map.slots['w' + w] || {});
  // games saved before the map existed: put everything already unlocked somewhere sensible
  function autoPlaceLegacy() {
    const pref = { w0: 'p1', w1: 'p2', w2: 'p4', w3: 'p5', w4: 'p6', garage: 'p8', food: 'p3' };
    const brandNew = !S.story.intro && progress(S) === 0;
    needPlacing().forEach(key => {
      if (key === 'w0' && brandNew) return; // a new player chooses the farm's spot
      const free = freePlots();
      if (free.length) S.map.places[key] = free.includes(pref[key]) ? pref[key] : free[0];
    });
    S.worlds.forEach((g, w) => {
      const sl = slotsOf(w), used = () => Object.values(sl);
      g.b.forEach((own, i) => {
        if (own && sl[i] == null) { const f = [0, 1, 2, 3, 4, 5, 6, 7].find(x => !used().includes(x)); if (f != null) sl[i] = f; }
      });
    });
    WONDERS.forEach(x => {
      if (S.wonders[x.id] && S.map.wslots[x.id] == null) {
        const f = [0, 1, 2, 3, 4].find(i => !Object.values(S.map.wslots).includes(i));
        if (f != null) S.map.wslots[x.id] = f;
      }
    });
  }
  // a little building site: crane, dust and hammering, then the thing appears
  function construct(sel, done) {
    const t = $('#mapworld ' + sel);
    if (!t) { done(); return; }
    const site = el('div', 'site', '<span>🏗️</span><span>🚧</span><i>💨</i><i>💨</i><i>💨</i>');
    t.appendChild(site);
    [0, 0.3, 0.6, 0.9, 1.2, 1.5].forEach(d => { noise({ dur: 0.06, vol: 0.3, filt: 'lowpass', ff: [[0, 700]], delay: d }); tone(170, 0.08, 'square', 0.08, 120, d); });
    setTimeout(() => { done(); sfx.partyHorn(); confetti(80); }, 1900);
  }
  function placeHere(plot, key) {
    S.map.places[key] = plot; S.pend = true; save();
    construct(`[data-plot="${plot}"]`, () => {
      renderNav(); renderCurrent({ plot }); toast(`${placeIcon(key)} ${placeName(key)}!`);
      // the very first farm: walk straight in and start
      if (key === 'w0' && !G.lanes[0].sold) setTimeout(() => openDistrict(0, { pen: 0 }), 900);
    });
  }

  // ---------- buildings inside a district ----------
  function showBuildSheet(slot) {
    const next = G.b.indexOf(false);
    if (next < 0) { toast('✅ 🏗️'); return; }
    const b = BUILD[next], can = G.coins >= b.cost;
    openModal(`<div class="wonderbox"><div class="wbig built">${b.e}</div><h2>${esc(b.n)}</h2><div class="wfx">${b.fx}</div>
      <div class="chips"><span class="chip ${can ? 'ok' : 'no'}">${WD[S.cur].icon} 💰${fmt(b.cost)} ${can ? '✅' : '❌'}</span></div>
      <button class="bigbtn${can ? ' can' : ''}" id="bBuild">🔨 ${b.e}</button></div>`);
    $('#bBuild').onclick = e => buildBuildingAt(next, slot, e.currentTarget);
  }
  function buildBuildingAt(i, slot, btn) {
    ac();
    if (G.coins < BUILD[i].cost) return shake(btn);
    G.coins -= BUILD[i].cost; G.b[i] = true;
    slotsOf(S.cur)[i] = slot;
    S.pend = true; save(); closeModal();
    construct(`[data-slot="${slot}"]`, () => {
      renderCurrent(); renderNav(); shownCoins = -1; refreshUI();
      celebrate(BUILD[i].e, 0, i === 5 ? WD[S.cur].done + '!' : BUILD[i].fx);
      if (i === 5) setTimeout(() => confetti(260), 600);
    });
  }
  function slotTap(slot, btn) {
    ac();
    const i = Object.keys(slotsOf(S.cur)).find(b => slotsOf(S.cur)[b] === slot);
    if (i == null) return showBuildSheet(slot);
    btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle');
    sfx.boing(); toast(`${BUILD[i].e} ${BUILD[i].fx}`);
  }
  function penTap(k, btn) {
    ac();
    const L = G.lanes[k];
    if (L.u) { sfx.pop(); laneVoice(k, true); openLane(k); return; }
    if (k === G.lanes.findIndex(x => !x.u)) {
      openModal('<div id="unlockBox"></div>');
      lockEl = buildLock(k);
      $('#unlockBox').appendChild(lockEl);
      refreshUI();
      return;
    }
    shake(btn);
  }

  // ---------- wonders (built on the Town Square plots) ----------
  const wonderBuilt = x => !!S.wonders[x.id];
  function needMet(x) {
    const i = WONDERS.indexOf(x);
    if (i > 0 && !wonderBuilt(WONDERS[i - 1])) return false;
    return x.need.every(([w, b]) => (b === 'u' ? S.worlds[w].u : S.worlds[w].b[b]));
  }
  const canPay = x => x.cost.every(([w, c]) => S.worlds[w].coins >= c);
  const wonderReady = x => !wonderBuilt(x) && needMet(x) && canPay(x);
  function refreshMapBtn() {
    const b = $('#navBack');
    if (b) b.classList.toggle('new', WONDERS.some(wonderReady) || needPlacing().length > 0);
  }
  function freeWonderSlot() { return [0, 1, 2, 3, 4].find(i => !Object.values(S.map.wslots).includes(i)); }
  function buildWonder(x, btn, slot) {
    ac();
    if (!wonderReady(x)) return shake(btn);
    x.cost.forEach(([w, c]) => { S.worlds[w].coins -= c; });
    S.wonders[x.id] = Date.now();
    S.map.wslots[x.id] = slot != null ? slot : freeWonderSlot();
    const opened = unlockWorlds();
    save(); closeModal();
    if (view !== 'city') setView('city');
    construct(`[data-wslot="${S.map.wslots[x.id]}"]`, () => {
      renderCurrent(); renderNav(); shownCoins = -1; refreshUI();
      celebrate(x.e, 0, x.n + '!');
      setTimeout(() => confetti(220), 500);
      if (opened) toast('📍 ' + placeIcon('w4') + '?');
    });
  }
  function showWonder(x, slot) {
    ac(); sfx.pop();
    const built = wonderBuilt(x), ready = wonderReady(x), prev = WONDERS[WONDERS.indexOf(x) - 1];
    const chip = (ok, html) => `<span class="chip ${ok ? 'ok' : 'no'}">${html} ${ok ? '✅' : '❌'}</span>`;
    openModal(`<div class="wonderbox"><div class="wbig${built ? ' built' : ''}">${x.e}</div><h2>${x.n}</h2>
      <div class="wfx">${x.fx}</div>
      ${built ? '<div class="wfx">⭐⭐⭐⭐⭐</div>' : `
      <div class="chips">${prev ? chip(wonderBuilt(prev), prev.e) : ''}${x.need.map(([w, b]) => chip(b === 'u' ? S.worlds[w].u : S.worlds[w].b[b], WD[w].icon + (b === 'u' ? '🔓' : WD[w].build[b].e))).join('')}</div>
      <div class="chips">${x.cost.map(([w, c]) => chip(S.worlds[w].coins >= c, `${WD[w].icon} 💰${fmt(c)}`)).join('')}</div>
      <button class="bigbtn${ready ? ' can' : ''}" id="wBuild">🔨 ${x.e}</button>`}</div>`);
    const bb = $('#wBuild');
    if (bb) bb.addEventListener('click', () => buildWonder(x, bb, slot));
  }
  function wonderSlotTap(slot, btn) {
    const x = WONDERS.find(y => S.map.wslots[y.id] === slot);
    if (x) { btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle'); sfx.boing(); toast(`${x.e} ${x.fx}`); return; }
    const next = WONDERS.find(y => !wonderBuilt(y));
    if (next) showWonder(next, slot); else toast('⭐');
  }
  // story "Go" button: take the player to exactly the right place
  function goQuest(q) {
    const [t, w, k] = q.g;
    if (t === 'wonder') { setView('city', { wonders: true }); setTimeout(() => showWonder(WONDERS.find(x => x.id === w)), 500); return; }
    if (!S.worlds[w].u) return;
    if (!placed('w' + w)) { setView('city'); return; }
    if (t === 'sold' || t === 'hire') { openDistrict(w); if (G.lanes[k].u) openLane(k); return; }
    openDistrict(w, t === 'lane' ? { pen: k } : { slots: true });
  }

  // ---------- story: Snoozeville wakes up ----------
  const { PEOPLE, QUESTS, CHAPTERS } = window.STORY;
  const activeQuest = () => QUESTS[S.story.q] || null;
  const helpedQuest = q => !!S.story.done[q.id];
  const personHelped = id => QUESTS.some(q => q.who === id && helpedQuest(q));
  const face = id => (personHelped(id) ? PEOPLE[id].job : PEOPLE[id].e);
  const heroName = () => esc(curProfile().name);
  const townName = () => (S.story.finale ? `${curProfile().name}ville` : 'Snoozeville');
  function goalMet(g) {
    const [t, w, k, n] = g;
    if (t === 'wonder') return !!S.wonders[w];
    const W = S.worlds[w];
    if (t === 'sold') return W.lanes[k].sold >= n;
    if (t === 'lane') return W.lanes[k].u;
    if (t === 'hire') return W.lanes[k].col > 0;
    if (t === 'build') return W.b[k];
    return false;
  }
  function goalChip(g) {
    const [t, w, k, n] = g;
    if (t === 'wonder') { const x = WONDERS.find(y => y.id === w); return `🏙️ ${x.e} 🔨`; }
    const D = WD[w], where = w !== S.cur || view === 'city' ? D.icon + ' ' : '';
    if (t === 'sold') return `${where}${D.lanes[k].p} ${Math.min(S.worlds[w].lanes[k].sold, n)}/${n}`;
    if (t === 'lane') return `${where}${D.lanes[k].a} 🔓`;
    if (t === 'hire') return `${where}${D.work.col.e} ➕`;
    if (t === 'build') return `${where}${D.build[k].e} 🔨`;
    return '';
  }
  const questDistrict = q => CHAPTERS[q.c].w;
  const askStep = q => ({ who: q.who, text: q.ask, file: q.id + 'a', quest: q });
  const chapterStep = c => ({ who: CHAPTERS[c].who, text: CHAPTERS[c].text, file: 'ch' + c, chapter: `${c + 1}. ${CHAPTERS[c].title}` });
  function completeQuest(q, show) {
    S.story.done[q.id] = Date.now();
    S.story.q = QUESTS.indexOf(q) + 1;
    if (show) { const [w, amt] = q.r; S.worlds[w].coins += amt; S.worlds[w].total += amt; }
    S.pend = true; save();
    renderQuest(); refreshMapBtn();
    renderCurrent(); renderNav();
    if (!show) return;
    talk({ who: q.who, text: q.thanks, file: q.id + 'b', reward: q.r, shop: q.shop });
    const nq = activeQuest();
    if (nq) { if (nq.c !== q.c) talk(chapterStep(nq.c)); talk(askStep(nq)); }
  }
  // progress made before the story existed counts straight away (no rewards, no speeches)
  function silentStory() {
    let q;
    while ((q = activeQuest()) && goalMet(q.g)) completeQuest(q, false);
  }
  function checkStory() {
    if (talking || !S.story.intro || S.play.lock) return;
    const q = activeQuest();
    if (q) { if (goalMet(q.g)) completeQuest(q, true); return; }
    if (!S.story.finale) {
      S.story.finale = true; S.pend = true; save();
      talk({ who: 'max', text: window.STORY.FINALE.text, file: 'finale', finale: true });
    }
  }
  function startStory() {
    silentStory();
    if (S.story.intro) return;
    S.story.intro = true; S.pend = true; save();
    talk({ who: 'max', text: window.STORY.INTRO.text, file: 'intro' });
    const q = activeQuest();
    if (q) { talk(chapterStep(q.c)); talk(askStep(q)); }
  }

  // ---------- speech bubbles with voices ----------
  const talkQ = [];
  let talking = false, voiceEl = null;
  function stopVoice() { if (voiceEl) { voiceEl.pause(); voiceEl = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  function playVoice(file, text, onState) {
    stopVoice();
    if (S.mute) return;
    const a = new Audio('audio/' + file + '.mp3');
    voiceEl = a;
    a.onplay = () => onState(true);
    a.onended = a.onpause = () => onState(false);
    a.play().catch(() => { if (voiceEl === a) say(text.replace(/\{hero\}/g, 'hero')); }); // no audio: browser voice
  }
  function talk(step) {
    talkQ.push(step);
    if (!talking) nextTalk();
  }
  function nextTalk() {
    const st = talkQ.shift(), box = $('#dlg');
    if (!st) {
      talking = false; box.classList.add('hidden'); box.innerHTML = ''; stopVoice();
      if (!celOpen && celQueue.length) celebrate(...celQueue.shift());
      return;
    }
    talking = true;
    const P = PEOPLE[st.who];
    const text = esc(st.text).replace(/\{hero\}/g, heroName());
    const goW = st.quest ? goalWorldOf(st.quest.g) : null;
    box.classList.remove('hidden');
    box.innerHTML = `${st.chapter ? `<div class="chap">${st.chapter}</div>` : ''}
      <div class="dcard${st.finale ? ' fin' : ''}">
        <div class="dwho"><span class="dface" id="dFace">${face(st.who)}</span><b>${esc(P.name)}</b>${P.hero ? '<span class="herotag">🦸</span>' : ''}</div>
        <div class="dtext">${text}</div>
        ${st.shop ? `<div class="dshop">${st.shop[0]} ${esc(st.shop[1])} ✨</div>` : ''}
        ${st.reward ? `<div class="dreward">${WD[st.reward[0]].icon} +${fmt(st.reward[1])} 💰 · ⭐</div>` : ''}
        ${st.quest ? `<div class="dgoal">${goalChip(st.quest.g)}</div>` : ''}
        <div class="dbtns"><button class="bigbtn" id="dSay">🔊</button>
          ${goW != null ? `<button class="bigbtn" id="dGo">▶️ ${goW === 'city' ? '🏙️' : WD[goW].icon}</button>` : ''}
          <button class="bigbtn can" id="dNext">${talkQ.length ? '▶️' : '👍'}</button></div>
      </div>`;
    const fc = $('#dFace');
    const speak = () => playVoice(st.file, st.text, on => fc && fc.classList.toggle('talk', on));
    speak();
    if (st.shop || st.finale) { confetti(st.finale ? 260 : 90); sfx.partyHorn(); }
    $('#dSay').onclick = speak;
    $('#dNext').onclick = () => { sfx.pop(); nextTalk(); };
    const go = $('#dGo');
    if (go) go.onclick = () => {
      talkQ.length = 0; nextTalk();
      goQuest(st.quest);
    };
    if (st.finale) setTimeout(() => { renderCity(); renderQuest(); }, 300);
  }
  function goalWorldOf(g) {
    if (g[0] === 'wonder') return 'city';
    return S.worlds[g[1]].u ? g[1] : null;
  }

  // ---------- quest card (always shows what to do next) ----------
  function renderQuest() {
    const box = $('#quest'), q = activeQuest();
    if (!S.story.intro) { box.classList.add('hidden'); layoutMap(); return; }
    if (box.classList.contains('hidden')) { box.classList.remove('hidden'); layoutMap(); }
    const html = q ? `<span class="qface">${face(q.who)}</span><span class="qgoal">${goalChip(q.g)}</span><span class="qgo">💬</span>`
      : `<span class="qface">🏆</span><span class="qgoal">${esc(townName())} ✨</span><span class="qgo">🏙️</span>`;
    if (box._h !== html) { box.innerHTML = html; box._h = html; layoutMap(); }
  }
  $('#quest').addEventListener('click', () => {
    ac();
    const q = activeQuest();
    if (q) talk(askStep(q)); else setView('city');
  });

  // ---------- the maps ----------
  const mapView = $('#mapview'), mapWorld = $('#mapworld');
  const CW = 1000, CH = 1400;             // city map size
  const DW = 900, DH = 800;               // district map size
  const PLOT_W = 300, PLOT_H = 250;
  const PLOTS = { p1: [190, 1210], p2: [810, 1210], p3: [180, 850], p4: [820, 820], p5: [190, 470], p6: [810, 430], p7: [500, 190], p8: [500, 1250] };
  const WSLOTS = [[420, 735], [580, 735], [420, 930], [580, 930], [500, 1010]];
  const RING = { x1: 340, y1: 540, x2: 660, y2: 1080 };
  const SLOT_POS = [[120, 250], [340, 250], [560, 250], [780, 250], [120, 385], [340, 385], [560, 385], [780, 385]];
  const PEN_POS = [[150, 585], [450, 585], [750, 585], [150, 722], [450, 722], [750, 722]];

  // ----- drag to move, pinch / wheel to zoom -----
  const PZ = {};                          // remembered position per map
  let pz = null;
  function layoutMap() {
    const q = $('#quest'), ref = q && !q.classList.contains('hidden') ? q : $('#navbar');
    const top = Math.round(ref.getBoundingClientRect().bottom + 8);
    document.documentElement.style.setProperty('--mapTop', top + 'px');
    if (pz) pz.apply();
  }
  window.addEventListener('resize', () => setTimeout(layoutMap, 50));
  function usePZ(key, W, H) {
    mapWorld.style.width = W + 'px'; mapWorld.style.height = H + 'px';
    const fresh = !PZ[key];
    const st = PZ[key] || (PZ[key] = { x: 0, y: 0, s: 1 });
    const vw = () => mapView.clientWidth, vh = () => mapView.clientHeight;
    const fit = () => Math.min(vw() / W, vh() / H);
    const minS = () => fit() * 0.95, maxS = () => Math.max(1.6, fit() * 4);
    function apply() {
      st.s = Math.min(maxS(), Math.max(minS(), st.s));
      const ww = W * st.s, wh = H * st.s;
      st.x = ww <= vw() ? (vw() - ww) / 2 : Math.min(0, Math.max(vw() - ww, st.x));
      st.y = wh <= vh() ? (vh() - wh) / 2 : Math.min(0, Math.max(vh() - wh, st.y));
      mapWorld.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`;
    }
    function zoomAt(px, py, s) {
      const wx = (px - st.x) / st.s, wy = (py - st.y) / st.s;
      st.s = Math.min(maxS(), Math.max(minS(), s));
      st.x = px - wx * st.s; st.y = py - wy * st.s;
      apply();
    }
    function centerOn(wx, wy, s) {
      if (s) st.s = s;
      st.x = vw() / 2 - wx * st.s; st.y = vh() / 2 - wy * st.s;
      apply();
    }
    if (fresh) { st.s = Math.max(fit(), Math.min(1, vw() / (W === CW ? 800 : W))); centerOn(W / 2, H / 2); }
    pz = { st, apply, zoomAt, centerOn, W, H };
    apply();
    return pz;
  }
  (function panZoomEvents() {
    const pts = new Map();
    let moved = 0, pinch = null;
    mapView.addEventListener('pointerdown', e => {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) moved = 0;
      if (pts.size === 2 && pz) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: pz.st.s };
      }
    });
    window.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId) || !pz) return;
      const [ox, oy] = pts.get(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      const r = mapView.getBoundingClientRect();
      if (pts.size === 1) {
        pz.st.x += e.clientX - ox; pz.st.y += e.clientY - oy;
        moved += Math.abs(e.clientX - ox) + Math.abs(e.clientY - oy);
        pz.apply();
      } else if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        pz.zoomAt((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, pinch.s * d / pinch.d);
        moved += 20;
      }
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // a drag is not a tap
    mapView.addEventListener('click', e => { if (moved > 12) { e.stopPropagation(); e.preventDefault(); } }, true);
    mapView.addEventListener('wheel', e => {
      if (!pz) return;
      e.preventDefault();
      const r = mapView.getBoundingClientRect();
      pz.zoomAt(e.clientX - r.left, e.clientY - r.top, pz.st.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    }, { passive: false });
  })();

  // ----- moving pictures for buildings -----
  const SVGS = {
    ferris: () => {
      const spokes = [...Array(8)].map((_, i) => `<line x1="60" y1="52" x2="${(60 + 42 * Math.cos(i * Math.PI / 4)).toFixed(1)}" y2="${(52 + 42 * Math.sin(i * Math.PI / 4)).toFixed(1)}"/>`).join('');
      const cars = ['#ff5a5a', '#3d8bff', '#ffd84d', '#4cd964', '#ff7eb6', '#a259ff', '#ff9a3c', '#14b8a6']
        .map((c, i) => `<circle cx="${(60 + 42 * Math.cos(i * Math.PI / 4)).toFixed(1)}" cy="${(52 + 42 * Math.sin(i * Math.PI / 4)).toFixed(1)}" r="7" fill="${c}" stroke="#fff" stroke-width="1.5"/>`).join('');
      return `<svg viewBox="0 0 120 124" class="svgb"><g stroke="#8a5cf6" stroke-width="4" stroke-linecap="round"><line x1="60" y1="52" x2="32" y2="120"/><line x1="60" y1="52" x2="88" y2="120"/><line x1="24" y1="120" x2="96" y2="120"/></g>
        <g class="spin" style="transform-origin:60px 52px"><circle cx="60" cy="52" r="42" fill="none" stroke="#ff5a5a" stroke-width="4"/><g stroke="#ffe27a" stroke-width="2">${spokes}</g>${cars}</g><circle cx="60" cy="52" r="6" fill="#3b2a1a"/></svg>`;
    },
    coaster: () => {
      const track = 'M6,104 C22,10 40,10 50,78 S78,116 88,36 S110,26 116,104';
      const legs = [[20, 50], [38, 30], [62, 96], [88, 40], [104, 56]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x}" y2="118"/>`).join('');
      const cart = (c, b) => `<g><rect x="-8" y="-6" width="16" height="10" rx="3" fill="${c}" stroke="#fff" stroke-width="1"/><animateMotion dur="3.4s" begin="${b}s" repeatCount="indefinite" rotate="auto" path="${track}"/></g>`;
      return `<svg viewBox="0 0 122 122" class="svgb"><g stroke="#9b7653" stroke-width="2.5">${legs}</g>
        <path d="${track}" fill="none" stroke="#ff5a5a" stroke-width="6" stroke-linecap="round"/><path d="${track}" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 5"/>
        ${cart('#3d8bff', 0)}${cart('#ffd84d', -0.25)}${cart('#4cd964', -0.5)}</svg>`;
    },
    crane: () => `<svg viewBox="0 0 120 124" class="svgb"><g stroke="#f5a623" stroke-width="5" stroke-linecap="round"><line x1="40" y1="120" x2="40" y2="22"/></g>
      <g stroke="#f5a623" stroke-width="2"><line x1="34" y1="110" x2="46" y2="96"/><line x1="34" y1="90" x2="46" y2="76"/><line x1="34" y1="70" x2="46" y2="56"/><line x1="34" y1="50" x2="46" y2="36"/></g>
      <g class="swing" style="transform-origin:40px 22px"><line x1="10" y1="22" x2="112" y2="22" stroke="#f5a623" stroke-width="5" stroke-linecap="round"/><rect x="6" y="20" width="16" height="12" fill="#7a7a7a"/>
      <g class="hoist"><line x1="96" y1="22" x2="96" y2="64" stroke="#3b2a1a" stroke-width="1.5"/><rect x="86" y="64" width="20" height="14" rx="2" fill="#e2552e"/></g></g>
      <rect x="28" y="116" width="24" height="6" fill="#7a7a7a"/></svg>`,
    dish: () => `<svg viewBox="0 0 120 120" class="svgb"><rect x="54" y="70" width="12" height="40" fill="#9aa5b8"/><rect x="38" y="106" width="44" height="8" rx="3" fill="#7d8aa3"/>
      <g class="swing" style="transform-origin:60px 70px"><path d="M18,52 Q60,100 102,52 Z" fill="#e6ecf2" stroke="#7d8aa3" stroke-width="3"/><line x1="60" y1="74" x2="60" y2="34" stroke="#7d8aa3" stroke-width="3"/><circle cx="60" cy="32" r="5" fill="#ff5a5a" class="blinkdot"/></g></svg>`,
    windmill: () => `<svg viewBox="0 0 120 130" class="svgb"><path d="M48,126 L54,52 L66,52 L72,126 Z" fill="#f3e6cf" stroke="#b9773b" stroke-width="2"/><rect x="55" y="104" width="10" height="22" fill="#b9773b"/>
      <g class="spin slow" style="transform-origin:60px 50px">${[0, 90, 180, 270].map(a => `<rect x="56" y="6" width="8" height="44" rx="2" fill="#fff" stroke="#b9773b" stroke-width="1.5" transform="rotate(${a} 60 50)"/>`).join('')}</g><circle cx="60" cy="50" r="5" fill="#8a5426"/></svg>`,
    carousel: () => `<svg viewBox="0 0 120 120" class="svgb"><rect x="57" y="30" width="6" height="74" fill="#ffd84d"/><ellipse cx="60" cy="104" rx="50" ry="10" fill="#ff7eb6"/>
      <path d="M10,40 L60,8 L110,40 Z" fill="#ff5a5a"/><path d="M10,40 L60,8 L35,40 Z M60,8 L85,40 L110,40 Z" fill="#fff" opacity=".85"/><circle cx="60" cy="8" r="4" fill="#ffd84d"/>
      ${[24, 60, 96].map((x, i) => `<text x="${x}" y="84" font-size="26" text-anchor="middle" class="ride${i}">🐴</text>`).join('')}</svg>`,
    fountain: () => `<svg viewBox="0 0 120 120" class="svgb"><ellipse cx="60" cy="96" rx="52" ry="18" fill="#c9c2b5"/><ellipse cx="60" cy="92" rx="44" ry="13" fill="#7cc8e8"/>
      <rect x="54" y="52" width="12" height="40" fill="#c9c2b5"/><ellipse cx="60" cy="52" rx="20" ry="6" fill="#c9c2b5"/>
      <g class="water">${[-1, 0, 1].map(d => `<path d="M60,48 Q${60 + d * 26},${4} ${60 + d * 40},90" fill="none" stroke="#7cc8e8" stroke-width="4" stroke-linecap="round"/>`).join('')}</g>
      ${[0, 1, 2, 3].map(i => `<circle cx="${36 + i * 16}" cy="70" r="3" fill="#bfe7fa" class="drop d${i}"/>`).join('')}</svg>`,
  };
  const fxHTML = {
    smoke: '<i class="fx smoke"><b></b><b></b><b></b></i>',
    flag: '<i class="fx flag"></i>',
    flags: '<i class="fx flag"></i><i class="fx flag f2"></i>',
    blink: '<i class="fx blink"></i>',
    spark: '<i class="fx spark">✨</i>',
    peck: '<i class="fx peck">🐔</i>',
    wag: '<i class="fx wag">🐕</i>',
    hammer: '<i class="fx hammer">🔨</i>',
    bubbles: '<i class="fx bubbles"><b></b><b></b><b></b></i>',
    orbit: '<i class="fx orbit"><b>🌙</b></i>',
    fireworks: '<i class="fx fw">🎆</i>',
    flame: '<i class="fx flame">🔥</i>',
    wheat: '<i class="fx peck">🌾</i>',
    bounce: '',
  };
  // what each world's six buildings look like on the map
  const BV = [
    [['peck'], ['wheat'], ['smoke'], ['flag'], ['smoke', 'smoke'], ['flags', 'glow']],
    [['wag'], ['blink'], ['glow'], ['bounce'], ['flag'], ['flags', 'spark']],
    [['flags'], 'ferris', 'coaster', ['flag'], ['glow'], ['fireworks', 'flags']],
    [['hammer'], 'crane', ['smoke'], ['glow'], ['glow', 'spark'], ['flame', 'rocket']],
    [['flag'], ['swingE'], ['bubbles'], 'dish', ['spark', 'glow'], ['orbit']],
  ];
  function bvis(e, look) {
    if (typeof look === 'string' && SVGS[look]) return `<span class="bv svgwrap">${SVGS[look]()}</span>`;
    const fx = (look || []).map(f => fxHTML[f] || '').join('');
    const cls = (look || []).filter(f => ['glow', 'bounce', 'rocket', 'swingE'].includes(f)).join(' ');
    return `<span class="bv ${cls}"><span class="be">${e}</span>${fx}</span>`;
  }
  const WONDER_LOOK = { train: ['smoke'], fair: 'carousel', castle: ['flags'], space: ['orbit', 'blink'], statue: ['spark', 'glow'] };

  // ----- a district: shops street, building plots, road, animal pens -----
  function districtScene(w, mini) {
    const D = WD[w], g = S.worlds[w], sl = S.map.slots['w' + w] || {};
    const inSlot = {}; Object.keys(sl).forEach(b => { inSlot[sl[b]] = +b; });
    const next = g.b.indexOf(false), nextLane = g.lanes.findIndex(L => !L.u);
    const shops = QUESTS.filter(q => q.shop && questDistrict(q) === w).map((q, i) => {
      const isNow = activeQuest() === q, st = helpedQuest(q) ? 'open' : isNow ? 'now' : 'closed';
      return `<button class="mshop ${st}" data-shop="${q.id}" style="left:${75 + i * 125 - 55}px;top:38px">
        <span class="se">${st === 'open' ? q.shop[0] : '🏚️'}</span><span class="so">${face(q.who)}${st === 'now' ? '<i>❗</i>' : st === 'closed' ? '<i>💤</i>' : ''}</span>
        <span class="lbl">${st === 'open' ? esc(q.shop[1]) : esc(PEOPLE[q.who].name)}</span></button>`;
    }).join('');
    const slots = SLOT_POS.map(([x, y], s) => {
      const b = inSlot[s];
      if (b != null) return `<button class="mslot built" data-slot="${s}" style="left:${x - 75}px;top:${y - 62}px">${bvis(D.build[b].e, BV[w][b])}<span class="lbl">${esc(D.build[b].n)}</span></button>`;
      const can = next >= 0 && g.coins >= D.build[next].cost;
      return `<button class="mslot empty${can ? ' can' : ''}" data-slot="${s}" style="left:${x - 75}px;top:${y - 62}px"><span class="plus">＋</span><span class="ssign">🪧</span></button>`;
    }).join('');
    const pens = PEN_POS.map(([x, y], k) => {
      const A = D.lanes[k], L = g.lanes[k];
      if (!L.u) {
        const isNext = k === nextLane, P = D.lanes[k - 1];
        return `<button class="mpen locked${isNext ? ' next' : ''}" data-pen="${k}" style="left:${x - 125}px;top:${y - 57}px">
          <span class="lockA">${A.a}</span><span class="plock">🔒</span>${isNext ? `<span class="pgoal" data-goal="${k}">${P.p} ${Math.min(S.worlds[w].lanes[k - 1].sold, A.unlock.need)}/${A.unlock.need}</span>` : ''}</button>`;
      }
      const herd = [...Array(Math.min(L.n, 5))].map((_, i) => `<i style="left:${10 + i * 15}%;animation-duration:${3 + (i * 7 % 4)}s;animation-delay:-${i * 1.3}s">${A.a}</i>`).join('');
      return `<button class="mpen" data-pen="${k}" style="left:${x - 125}px;top:${y - 57}px;--dirt:${A.dirt}">
        <span class="herd${D.still ? ' still' : ''}">${herd}</span>
        <span class="pbadge" data-penk="${k}">${A.p} ${fmt(Math.floor(L.g))}</span>
        ${L.col ? `<span class="mworker">${D.work.col.e}</span>` : ''}
        ${L.cash ? `<span class="mstall">🏪<b>${D.work.cash.e}</b></span>` : '<span class="mstall">🪵</span>'}
        ${L.truck ? `<span class="mtruck">${VEH[w][tierOf(L.truck)]}</span>` : ''}
        <span class="lbl">${A.a} ${fmt(L.sold)}</span></button>`;
    }).join('');
    const deco = [[30, 470, 0], [870, 470, 1], [20, 780, 1], [880, 790, 0], [300, 168, 0], [600, 168, 1]]
      .map(([x, y, i]) => `<span class="ddeco" style="left:${x}px;top:${y}px">${D.lanes[i].deco[i]}</span>`).join('');
    const extra = w === 0 ? `<span class="dbig" style="left:822px;top:120px">${SVGS.windmill()}</span>`
      : w === 2 ? '<span class="pond" style="left:20px;top:150px"><i class="duck">🦆</i><i class="duck d2">🦆</i></span>'
      : w === 4 ? '<span class="crater" style="left:30px;top:140px"></span><span class="crater c2" style="left:840px;top:430px"></span>' : '';
    const tier = Math.max(...g.lanes.map(L => L.truck));
    const car = tier ? `<span class="dcar"><span>${VEH[w][tierOf(tier)]}</span></span>` : '';
    return `<div class="dground g${w}" style="--g1:${D.lanes[0].tint};--g2:${D.bg[3]}">
      <svg class="droads" viewBox="0 0 ${DW} ${DH}" preserveAspectRatio="none"><path d="M0,168 H${DW} M0,470 H${DW} M300,168 V${DH} M600,168 V${DH}" stroke="#e3dccb" stroke-width="46" fill="none"/>
      <path d="M0,168 H${DW} M0,470 H${DW} M300,168 V${DH} M600,168 V${DH}" stroke="#9a9a9a" stroke-width="30" fill="none"/>
      <path d="M0,470 H${DW}" stroke="#fff" stroke-width="3" stroke-dasharray="14 12" fill="none"/></svg>
      ${extra}${deco}<div class="dstreet">${car}</div>${shops}${mini ? '' : shoppers(w)}${slots}${pens}${mini || w > 1 ? '' : '<span class="fly1">🦋</span><span class="fly1 b2">🦋</span>'}
      ${mini ? '' : `<div class="dname">${D.icon} ${esc(g.b[5] ? D.done : D.title)}</div>`}</div>`;
  }
  // people walk along the shop street, pop into an open shop and come out with a bag
  function shoppers(w) {
    const open = QUESTS.filter(q => q.shop && questDistrict(q) === w).map((q, i) => helpedQuest(q) ? i : -1).filter(i => i >= 0);
    if (!open.length) return '';
    const folk = ['🚶', '🚶‍♀️', '🧑', '👩', '👴', '👧'];
    return open.slice(0, 4).map((i, n) => `<span class="shopper" style="--to:${75 + i * 125 - 20}px;animation-duration:${9 + n * 2}s;animation-delay:-${n * 2.7}s">
      <b>${folk[(n + w) % folk.length]}</b><i>🛍️</i></span>`).join('');
  }
  // clouds (with their shadows on the ground) and birds over a map
  function skyLife() {
    return [0, 1, 2].map(i => `<div class="cloud c${i}"><span>☁️</span><b class="shade"></b></div>`).join('')
      + '<div class="birds"><i>🐦</i><i>🐦</i><i>🐦</i></div>';
  }
  function renderDistrictMap(focus) {
    usePZ('w' + S.cur, DW, DH);
    $('#mapbannerHost').innerHTML = '';
    mapWorld.className = 'district';
    mapWorld.innerHTML = districtScene(S.cur, false) + '<div class="dsky">' + skyLife() + '</div><div class="nightveil"></div>';
    mapWorld.querySelectorAll('.mpen').forEach(b => b.addEventListener('click', () => penTap(+b.dataset.pen, b)));
    mapWorld.querySelectorAll('.mslot').forEach(b => b.addEventListener('click', () => slotTap(+b.dataset.slot, b)));
    mapWorld.querySelectorAll('.mshop').forEach(b => b.addEventListener('click', () => shopTap(b.dataset.shop, b)));
    if (focus && focus.pen != null) {
      const [x, y] = PEN_POS[focus.pen];
      pz.centerOn(x, y);
      const p = $(`#mapworld [data-pen="${focus.pen}"]`); if (p) p.classList.add('focus');
    }
    if (focus && focus.slots) { mapWorld.querySelectorAll('.mslot.empty').forEach(s => s.classList.add('focus')); pz.centerOn(DW / 2, 320); }
    dayNight();
  }
  function shopTap(id, b) {
    const q = QUESTS.find(x => x.id === id);
    b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    if (helpedQuest(q)) talk({ who: q.who, text: q.thanks, file: q.id + 'b' });
    else if (activeQuest() === q) talk(askStep(q));
    else { sfx.pop(); toast('💤'); }
  }

  // ----- mini scenes for the garage and food street plots -----
  function garageMini() {
    const owned = RIDES.filter(r => S.city.cars[r.id]);
    const parked = owned.map((r, i) => `<span class="parked" style="left:${18 + (i % 5) * 54}px;top:${40 + Math.floor(i / 5) * 70}px">${r.e}</span>`).join('');
    return `<div class="lot">${parked}<span class="lotdrive"><span>${rideEmoji() || '🚶'}</span><b>${curProfile().av}</b></span><span class="lotsign">🚗</span></div>`;
  }
  function foodMini() {
    return `<div class="foodst">${FOOD.map((f, i) => {
      const own = !!S.city.food[f.id];
      return `<span class="fshop${own ? ' own' : ''}" style="left:${12 + (i % 3) * 96}px;top:${22 + Math.floor(i / 3) * 112}px">
        <span>${own ? f.e : '🏚️'}</span>${own ? `<i class="tip" data-tip="${f.id}"></i><em>🧑👧</em>` : ''}</span>`;
    }).join('')}</div>`;
  }

  // ----- the whole city -----
  function cityRoads() {
    const r = RING, c = (a, b) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
    const links = [c([r.x1, r.y2], [r.x1, 1210]), c([r.x2, r.y2], [r.x2, 1210]), c([500, r.y2], [500, 1125]), c([r.x1, 850], [330, 850]),
      c([r.x2, 820], [670, 820]), c([r.x1, r.y1], [r.x1, 470]), c([r.x2, r.y1], [r.x2, 430]), c([500, r.y1], [500, 315])].join(' ');
    return { ring: `M${r.x1},${r.y1} H${r.x2} V${r.y2} H${r.x1} Z`, links };
  }
  function renderCityMap(focus) {
    usePZ('city', CW, CH);
    mapWorld.className = 'citymap';
    const roads = cityRoads(), pending = needPlacing();
    const lit = !!S.story.done.q23, done = Object.keys(S.story.done).length;
    // traffic grows as the town wakes up
    const pool = ['🚗', '🚕', '🚙', '🚌', '🛵', '🚲'];
    if (S.story.done.q11) pool.push('🚒');
    if (S.story.done.q20) pool.push('🚓');
    const nCars = done ? Math.min(6, 1 + Math.floor(done / 5)) : 0;
    // every car waits at the traffic light (top right) and the bus stop (bottom left) on its way round
    const stops = 'keyPoints="0;0.25;0.25;0.75;0.75;1" keyTimes="0;0.22;0.3;0.68;0.76;1" calcMode="linear"';
    const cars = [...Array(nCars)].map((_, i) => `<text font-size="34" class="mcar" dy="12" text-anchor="middle">${i === 1 ? '🚌' : pool[(i * 3 + done) % pool.length]}<animateMotion dur="${20 + i * 3}s" begin="-${i * 4.3}s" repeatCount="indefinite" ${stops} path="${roads.ring}"/></text>`).join('');
    const folk = ['🚶', '🚶‍♀️', '🏃‍♀️', '👫'].concat(Object.keys(PEOPLE).filter(personHelped).map(id => PEOPLE[id].job));
    const peds = [...Array(Math.min(8, Math.ceil(done / 4)))].map((_, i) => `<text font-size="22" dy="-16" text-anchor="middle">${folk[(i * 5) % folk.length]}<animateMotion dur="${50 + i * 7}s" begin="-${i * 9}s" repeatCount="indefinite" path="${roads.ring}"/></text>`).join('');
    const lamps = lit ? [[RING.x1, 700], [RING.x1, 950], [RING.x2, 700], [RING.x2, 950], [450, RING.y1], [550, RING.y2], [500, 420], [RING.x1, 1150], [RING.x2, 1150]]
      .map(([x, y]) => `<circle cx="${x + 22}" cy="${y}" r="7" class="lamp"/>`).join('') : '';
    const train = S.wonders.train ? `<path d="M30,40 H970 V1370 H30 Z" fill="none" stroke="#8a5426" stroke-width="10" stroke-dasharray="4 10"/><path d="M30,40 H970 V1370 H30 Z" fill="none" stroke="#666" stroke-width="3"/>
      ${['🚂', '🚃', '🚃', '🚃'].map((t, i) => `<text font-size="38" text-anchor="middle" dy="12">${t}<animateMotion dur="40s" begin="-${i * 0.75}s" repeatCount="indefinite" path="M30,40 H970 V1370 H30 Z"/></text>`).join('')}` : '';
    const svg = `<svg class="terrain" viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}">
      <defs><pattern id="grassdots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="2" fill="#6fbf4a"/><circle cx="28" cy="30" r="2.5" fill="#86d062"/></pattern>
        <pattern id="flowers" width="130" height="110" patternUnits="userSpaceOnUse"><circle cx="20" cy="30" r="3" fill="#fff"/><circle cx="26" cy="34" r="3" fill="#ffd84d"/><circle cx="90" cy="80" r="3" fill="#ff8fb8"/><circle cx="96" cy="76" r="2.5" fill="#fff"/><circle cx="60" cy="10" r="2.5" fill="#c8a2ff"/></pattern></defs>
      <rect width="${CW}" height="${CH}" fill="#8fd16a"/><rect width="${CW}" height="${CH}" fill="url(#grassdots)"/><rect width="${CW}" height="${CH}" fill="url(#flowers)" opacity=".8"/>
      <path d="M0,22 C200,60 360,0 520,28 S820,70 1000,20 L1000,0 L0,0 Z" fill="#7cc8e8"/>
      <path d="M0,22 C200,60 360,0 520,28 S820,70 1000,20" fill="none" stroke="#5aa9d6" stroke-width="4"/>
      <path d="M10,14 C200,46 360,-6 520,18 S820,58 990,12" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10 26" class="shimmer" opacity=".8"/>
      <ellipse cx="500" cy="810" rx="150" ry="170" fill="#efe4c9" stroke="#d8c7a0" stroke-width="6"/>
      <path d="${roads.ring} ${roads.links}" fill="none" stroke="#e3dccb" stroke-width="60" stroke-linejoin="round"/>
      <path d="${roads.ring} ${roads.links}" fill="none" stroke="#8d8d8d" stroke-width="40" stroke-linejoin="round"/>
      <path d="M${RING.x1 - 20},${RING.y1 + 40} h40 M${RING.x1 - 20},${RING.y1 + 52} h40 M${RING.x1 - 20},${RING.y1 + 64} h40" stroke="#fff" stroke-width="6"/>
      <path d="${roads.ring} ${roads.links}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="16 14"/>
      ${train}${lamps}${cars}${peds}</svg>`;
    const plots = Object.entries(PLOTS).map(([id, [x, y]]) => {
      const key = Object.keys(S.map.places).find(k => S.map.places[k] === id);
      const style = `left:${x - PLOT_W / 2}px;top:${y - PLOT_H / 2}px;width:${PLOT_W}px;height:${PLOT_H}px`;
      if (!key) return `<div role="button" class="cplot empty${pending.length ? ' pick' : ''}" data-plot="${id}" style="${style}"><span class="psign">🪧</span>${pending.length ? '<span class="arrow">⬇️</span>' : ''}</div>`;
      let inner;
      if (key === 'garage') inner = garageMini();
      else if (key === 'food') inner = foodMini();
      else {
        const sc = Math.min(PLOT_W / DW, PLOT_H / DH);
        inner = `<div class="dmap mini" style="left:${(PLOT_W - DW * sc) / 2}px;top:${(PLOT_H - DH * sc) / 2}px;transform:scale(${sc})">${districtScene(+key.slice(1), true)}</div>`;
      }
      const w = key[0] === 'w' ? +key.slice(1) : null;
      const here = w != null && activeQuest() && questDistrict(activeQuest()) === w;
      return `<div role="button" class="cplot placed${here ? ' here' : ''}" data-plot="${id}" data-key="${key}" style="${style}">${inner}<span class="plotsign">${placeIcon(key)} ${esc(placeName(key))}${w != null && S.worlds[w].b[5] ? ' 👑' : ''}</span></div>`;
    }).join('');
    const wslots = WSLOTS.map(([x, y], i) => {
      const x0 = WONDERS.find(v => S.map.wslots[v.id] === i);
      const ready = !x0 && WONDERS.some(wonderReady);
      return `<button class="wslot${x0 ? ' built' : ''}${ready ? ' ready' : ''}" data-wslot="${i}" style="left:${x - 55}px;top:${y - 55}px">
        ${x0 ? bvis(x0.e, WONDER_LOOK[x0.id]) + `<span class="lbl">${esc(x0.n)}</span>` : '<span class="plus">🏛️</span>'}</button>`;
    }).join('');
    const trees = [[60, 120], [130, 60], [880, 640], [950, 980], [50, 640], [40, 1000], [960, 1330], [40, 1340], [690, 1360], [320, 1370], [930, 180], [880, 90]]
      .map(([x, y], i) => `<span class="tree" style="left:${x}px;top:${y}px">${i % 3 ? '🌳' : '🌲'}</span>`).join('');
    const mount = '<span class="mount" style="left:880px;top:40px">⛰️</span><span class="mount" style="left:20px;top:40px">🏔️</span>';
    const fly = (S.story.done.q24 ? '<div class="flyover">🚁</div>' : '') + (S.story.done.q30 ? '<div class="flyover hero">🦸</div>' : '');
    const banner = pending.length ? `<div class="mapbanner">📍 ${placeIcon(pending[0])} ${esc(placeName(pending[0]))}? 👇 🪧</div>` : '';
    const life = '<span class="tlight" style="left:690px;top:640px">🚦</span><span class="bstop" style="left:296px;top:950px">🚏</span>'
      + '<span class="fish" style="left:240px;top:14px">🐟</span><span class="fish f2" style="left:700px;top:20px">🐠</span>'
      + skyLife();
    mapWorld.innerHTML = svg + trees + mount + life
      + `<button class="hall" data-who="max" style="left:445px;top:575px"><span>🏛️</span><b>${face('max')}</b></button>`
      + `<span class="fountain" style="left:450px;top:770px">${SVGS.fountain()}</span>`
      + wslots + plots + fly + '<div class="nightveil"><span>✨</span><span>⭐</span><span>✨</span><span>🌙</span><span>⭐</span></div>';
    $('#mapbannerHost').innerHTML = banner;
    mapWorld.querySelectorAll('.cplot').forEach(b => b.addEventListener('click', () => plotTap(b)));
    mapWorld.querySelectorAll('.wslot').forEach(b => b.addEventListener('click', () => wonderSlotTap(+b.dataset.wslot, b)));
    mapWorld.querySelector('.hall').addEventListener('click', () => {
      const q = activeQuest();
      if (q && q.who === 'max') talk(askStep(q)); else talk({ who: 'max', text: window.STORY.INTRO.text, file: 'intro' });
    });
    // where to look: the plot to choose, the wonder plots, or the current quest's place
    let target = null;
    if (focus && focus.plot) target = PLOTS[focus.plot];
    else if (pending.length) { const f = freePlots()[0]; if (f) target = PLOTS[f]; }
    else if (focus && focus.wonders) target = [500, 860];
    if (focus && focus.wonders) mapWorld.querySelectorAll('.wslot:not(.built)').forEach(s => s.classList.add('focus'));
    if (target) pz.centerOn(target[0], target[1]);
    attachCityThings(); dayNight(); updateTips();
    if (!talking) cityHellos();
  }
  function plotTap(b) {
    ac();
    const key = b.dataset.key, pending = needPlacing();
    if (!key) {
      if (pending.length) return placeHere(b.dataset.plot, pending[0]);
      sfx.pop(); toast('🪧 🔒'); return;
    }
    if (key === 'garage') return showGarage();
    if (key === 'food') return showFood();
    openDistrict(+key.slice(1));
  }
  function showGarage() { ac(); openModal(garageBlock()); bindPlaceSheet(); }
  function showFood() { ac(); openModal(foodBlock()); bindPlaceSheet(); updateTips(); }
  function bindPlaceSheet() {
    document.querySelectorAll('#sheet .rideb').forEach(b => b.addEventListener('click', () => tapRide(b.dataset.r, b)));
    document.querySelectorAll('#sheet .eat').forEach(b => b.addEventListener('click', () => tapFood(b.dataset.f, b)));
  }
  // live numbers on the map, 4x a second (no full redraw)
  function liveMap() {
    if (view === 'district' && openK < 0) {
      G.lanes.forEach((L, k) => {
        const b = $(`#mapworld [data-penk="${k}"]`);
        if (b) b.textContent = `${ANIMALS[k].p} ${fmt(Math.floor(L.g))}`;
        const gl = $(`#mapworld [data-goal="${k}"]`);
        if (gl) gl.textContent = `${ANIMALS[k - 1].p} ${Math.min(G.lanes[k - 1].sold, ANIMALS[k].unlock.need)}/${ANIMALS[k].unlock.need}`;
      });
      const next = G.b.indexOf(false), can = next >= 0 && G.coins >= BUILD[next].cost;
      mapWorld.querySelectorAll('.mslot.empty').forEach(s => s.classList.toggle('can', can));
    }
    updateTips();
  }

  // ---------- living city: garage, food street, rescues, visitors, day & night ----------
  // City things are paid for (and pay out) in Farm coins: the farm is the town bank.
  const BANK = 0;
  const RIDES = [
    { id: 'bike', e: '🚲', n: 'Bike', cost: 50 },
    { id: 'scooter', e: '🛴', n: 'Scooter', cost: 500 },
    { id: 'moped', e: '🛵', n: 'Moped', cost: 5000 },
    { id: 'motorbike', e: '🏍️', n: 'Motorbike', cost: 50000 },
    { id: 'car', e: '🚗', n: 'Car', cost: 300000 },
    { id: 'jeep', e: '🚙', n: 'Jeep', cost: 2e6 },
    { id: 'camper', e: '🚐', n: 'Camper', cost: 1e7 },
    { id: 'supercar', e: '🏎️', n: 'Super Car', cost: 6e7 },
    { id: 'heli', e: '🚁', n: 'Helicopter', cost: 4e8, world: 3 },
    { id: 'ufo', e: '🛸', n: 'UFO', cost: 3e9, world: 4 },
  ];
  const FOOD = [
    { id: 'burger', e: '🍔', n: 'Burger Bots', cost: 2000 },
    { id: 'taco', e: '🌮', n: 'Taco Rocket', cost: 20000 },
    { id: 'noodle', e: '🍜', n: 'Noodle Moon', cost: 200000 },
    { id: 'sushi', e: '🍣', n: 'Sushi Sub', cost: 2e6 },
    { id: 'curry', e: '🍛', n: 'Curry Cloud', cost: 2e7 },
    { id: 'pancake', e: '🥞', n: 'Pancake Hill', cost: 2e8 },
  ];
  const TIP_PAYBACK = 300; // a restaurant earns its price back in about 5 minutes of tips
  const TIP_CAP = 600;     // tips stop piling up after 10 minutes until collected
  const rideRank = () => { const i = RIDES.findIndex(r => r.id === S.city.ride); return i < 0 ? 0 : i + 1; };
  const playerSpeed = () => PLAYER_SPEED * (1 + 0.12 * rideRank());
  const playerCap = () => PLAYER_CAP + 5 * rideRank();
  const rideEmoji = () => { const r = RIDES.find(x => x.id === S.city.ride); return r ? r.e : ''; };
  const garageOpen = () => !!S.story.done.q2;
  const foodOpen = () => !!S.story.done.q6;
  // a fair reward that grows with the farm: about `sec` seconds of farm income
  function townReward(sec) {
    let rate = 0;
    for (let k = 0; k < 6; k++) { const r = laneRate(BANK, k); if (r) rate += r.coins; }
    return Math.max(25, Math.round(rate * sec));
  }
  function payBank(amount) { const g = S.worlds[BANK]; g.coins += amount; g.total += amount; S.pend = true; }

  // short spoken pop-up (no buttons) for quick moments like rescues and visitors
  function quip(file, after) {
    const L = window.STORY.CITY[file], P = PEOPLE[L.who];
    const q = el('div', 'quip', `<span class="qf">${face(L.who)}</span><span class="qt"><b>${esc(P.name)}</b>${esc(L.text).replace(/\{hero\}/g, heroName())}</span>`);
    document.body.appendChild(q);
    playVoice(file, L.text, on => q.classList.toggle('talk', on));
    setTimeout(() => { q.classList.add('bye'); setTimeout(() => q.remove(), 400); if (after) after(); }, 4200);
  }

  // ----- garage -----
  function garageBlock() {
    if (!garageOpen()) return lockedBlock('garage', '🚗 Garage', 'leo');
    const bank = S.worlds[BANK].coins;
    const rides = RIDES.map(r => {
      const own = !!S.city.cars[r.id], locked = r.world != null && !S.worlds[r.world].u;
      const cls = own ? (S.city.ride === r.id ? 'own sel' : 'own') : locked ? 'locked' : bank >= r.cost ? 'can' : 'poor';
      return `<button class="rideb ${cls}" data-r="${r.id}"><span class="re">${r.e}</span>
        <span class="rn">${own ? (S.city.ride === r.id ? '✅' : esc(r.n)) : locked ? WD[r.world].icon + '🔒' : '🚜 💰' + fmt(r.cost)}</span></button>`;
    }).join('');
    return `<section class="dist garage" data-d="garage">
      <div class="dhead">🚗 Garage <small>⚡ x${(1 + 0.12 * rideRank()).toFixed(2)} · 🎒 +${5 * rideRank()}</small></div>
      <div class="mydrive"><span class="myride">${rideEmoji() || '🚶'}</span><span class="mydriver">${curProfile().av}</span></div>
      <div class="rides">${rides}</div></section>`;
  }
  function tapRide(id, btn) {
    ac();
    const r = RIDES.find(x => x.id === id);
    if (S.city.cars[id]) { S.city.ride = id; save(); sfx.honk(); refreshPlace('garage'); renderLanes(); return; }
    if (r.world != null && !S.worlds[r.world].u) return shake(btn);
    if (S.worlds[BANK].coins < r.cost) return shake(btn);
    S.worlds[BANK].coins -= r.cost;
    S.city.cars[id] = Date.now(); S.city.ride = id; S.pend = true; save();
    sfx.honk(); confetti(70); toast(`${r.e} ${r.n}!`);
    refreshPlace('garage'); renderLanes(); refreshUI();
  }
  function refreshPlace(kind) {
    if (!$('#modal').classList.contains('hidden')) (kind === 'garage' ? showGarage : showFood)();
    renderCurrent();
  }

  // ----- food street -----
  function tipsOf(f) {
    const since = S.city.food[f.id];
    if (!since) return 0;
    const secs = Math.min(TIP_CAP, (Date.now() - since) / 1000);
    return Math.floor(secs * f.cost / TIP_PAYBACK);
  }
  function foodBlock() {
    if (!foodOpen()) return lockedBlock('food', '🍽️ Food Street', 'pablo');
    const bank = S.worlds[BANK].coins;
    const spots = FOOD.map(f => {
      const own = !!S.city.food[f.id];
      if (own) {
        const crowd = ['🧑', '👧', '👴', '👩', '👦'].slice(0, 2 + (f.id.length % 3)).map((c, i) => `<i style="animation-delay:-${i * 0.3}s">${c}</i>`).join('');
        return `<button class="eat own" data-f="${f.id}"><span class="fe">${f.e}</span><span class="fn">${esc(f.n)}</span>
          <span class="tip" data-tip="${f.id}"></span><span class="crowd">${crowd}</span></button>`;
      }
      return `<button class="eat ${bank >= f.cost ? 'can' : 'poor'}" data-f="${f.id}"><span class="fe">🏚️</span><span class="fn">${esc(f.n)}</span>
        <span class="price">🚜 💰${fmt(f.cost)}</span></button>`;
    }).join('');
    return `<section class="dist food" data-d="food"><div class="dhead">🍽️ Food Street</div><div class="eats">${spots}</div></section>`;
  }
  function tapFood(id, btn) {
    ac();
    const f = FOOD.find(x => x.id === id);
    if (S.city.food[id]) {
      const t = tipsOf(f);
      if (t < 1) { sfx.pop(); return; }
      payBank(t); S.city.food[id] = Date.now(); save();
      sfx.coin(); flyCoins(btn, 3); toast(`+${fmt(t)} 💰`);
      updateTips(); refreshUI();
      return;
    }
    if (S.worlds[BANK].coins < f.cost) return shake(btn);
    S.worlds[BANK].coins -= f.cost;
    S.city.food[id] = Date.now(); S.pend = true; save();
    confetti(90); sfx.partyHorn(); refreshPlace('food'); refreshUI();
    quip('o_eat');
  }
  function updateTips() {
    document.querySelectorAll('[data-tip]').forEach(s => {
      const t = tipsOf(FOOD.find(f => f.id === s.dataset.tip));
      s.textContent = t >= 1 ? '💰' + fmt(t) : '';
      s.classList.toggle('full', t >= 1);
    });
  }

  function lockedBlock(d, title, who) {
    return `<section class="dist locked ${d}" data-d="${d}"><div class="dhead">${title}</div>
      <div class="fog"><span>☁️</span><span>🔒</span><span>${face(who)}</span></div><div style="height:70px"></div></section>`;
  }

  // ----- rescues & visitors -----
  const RESCUES = [
    { id: 'fire', e: '🔥', crew: 'woof', ride: '🚒', need: 'q11', line: 'r_fire' },
    { id: 'jam', e: '🚦', crew: 'whiskers', ride: '🚓', need: 'q20', line: 'r_jam' },
    { id: 'hurt', e: '🤕', crew: 'hoot', ride: '🚁', need: 'q24', line: 'r_hurt' },
  ];
  const VISITORS = [
    { id: 'icecream', e: '🍦', line: 'v_icecream', need: 'q4', sec: 45 },
    { id: 'unicorn', e: '🦄', line: 'v_unicorn', need: 'q5', sec: 90 },
    { id: 'balloon', e: '🎈', need: 'q18', sec: 60 },
    { id: 'super', e: '🦸', line: 'v_super', need: 'q11', sec: 120 },
    { id: 'dragon', e: '🐉', line: 'v_dragon', need: 'q28', sec: 180 },
  ];
  let cityEv = null, visitor = null, cityT = 0, busyRescue = false;
  // ----- rescues & visitors on the city map -----
  const ROAD_SPOTS = [[RING.x1, 690], [RING.x1, 960], [RING.x2, 700], [RING.x2, 990], [450, RING.y1], [590, RING.y2], [500, 420], [RING.x1, 1160], [RING.x2, 1160], [500, 1110]];
  function openDistricts() { return Object.keys(S.map.places).filter(k => k[0] === 'w').map(k => S.map.places[k]); }
  function spawnRescue() {
    const kinds = RESCUES.filter(r => S.story.done[r.need]), spots = openDistricts();
    if (view !== 'city' || !kinds.length || !spots.length) return;
    const r = pick(kinds), [px, py] = PLOTS[pick(spots)];
    cityEv = { r, x: px + (Math.random() - 0.5) * 140, y: py + (Math.random() - 0.5) * 90, until: Date.now() + 25000 };
    attachCityThings();
    tone(880, 0.12, 'square', 0.06); tone(660, 0.12, 'square', 0.06, null, 0.15); // nee-naw
  }
  function spawnVisitor() {
    const kinds = VISITORS.filter(v => S.story.done[v.need]);
    if (view !== 'city' || !kinds.length) return;
    const [x, y] = pick(ROAD_SPOTS);
    visitor = { v: pick(kinds), x, y, until: Date.now() + 15000 };
    attachCityThings();
    sfx.tiny();
  }
  // keep the rescue / visitor buttons in sync with state, without replacing ones already on screen
  function attachCityThings() {
    if (view !== 'city' || openK >= 0) return;
    const cev = $('#mapworld .cev');
    if (cev && (!cityEv || cev._ev !== cityEv) && !busyRescue) cev.remove();
    if (cityEv && !$('#mapworld .cev')) {
      const e = el('button', 'cev', `<span>${cityEv.r.e}</span><i>🚨</i>`);
      e._ev = cityEv;
      e.style.left = cityEv.x + 'px'; e.style.top = cityEv.y + 'px';
      e.addEventListener('click', () => doRescue(e));
      mapWorld.appendChild(e);
    }
    const vis = $('#mapworld .visitor');
    if (vis && (!visitor || vis._v !== visitor)) vis.remove();
    if (visitor && !$('#mapworld .visitor')) {
      const e = el('button', 'visitor', visitor.v.e);
      e._v = visitor;
      e.style.left = visitor.x + 'px'; e.style.top = visitor.y + 'px';
      e.addEventListener('click', () => meetVisitor(e));
      mapWorld.appendChild(e);
    }
  }
  function doRescue(spot) {
    if (busyRescue || !cityEv) return;
    busyRescue = true; ac();
    const ev = cityEv, r = ev.r;
    // the crew sets off from the Town Hall and races to the call
    const z = el('div', 'zoomer' + (r.ride === '🚁' ? ' air' : ''), `<span>${r.ride}</span><b>${face(r.crew)}</b>`);
    z.style.left = '500px'; z.style.top = '640px';
    mapWorld.appendChild(z);
    requestAnimationFrame(() => requestAnimationFrame(() => { z.style.left = (ev.x - 30) + 'px'; z.style.top = (ev.y - 10) + 'px'; }));
    if (r.ride === '🚁') tone(90, 1.2, 'sawtooth', 0.05);
    else [0, 0.35, 0.7].forEach(d => { tone(960, 0.18, 'square', 0.05, null, d); tone(720, 0.18, 'square', 0.05, null, d + 0.18); });
    setTimeout(() => {
      spot.innerHTML = '<span>✅</span>';
      const amt = townReward(40);
      payBank(amt); S.city.rescues = (S.city.rescues || 0) + 1; save();
      confetti(60); sfx.coin(); toast(`${r.ride} +${fmt(amt)} 💰`);
      quip(r.line);
      setTimeout(() => { z.remove(); spot.remove(); cityEv = null; busyRescue = false; refreshUI(); }, 1300);
    }, 1400);
  }
  function meetVisitor(e) {
    if (!visitor) return;
    ac();
    const v = visitor.v, amt = townReward(v.sec);
    visitor = null;
    e.classList.add('poof');
    payBank(amt); S.city.visitors[v.id] = (S.city.visitors[v.id] || 0) + 1; save();
    sfx.yippee(); confetti(50); toast(`${v.e} +${fmt(amt)} 💰`);
    if (v.line) quip(v.line);
    setTimeout(() => e.remove(), 500);
    refreshUI();
  }

  // ----- day & night (a whole day takes about 6 minutes) -----
  const DAY_LEN = 360;
  function dayPhase() { return (Date.now() / 1000 % DAY_LEN) / DAY_LEN; }
  function dayNight() {
    const p = dayPhase();
    const night = p > 0.68 && p < 0.93, dusk = (p > 0.6 && p <= 0.68) || p >= 0.93;
    mapView.classList.toggle('night', night);
    mapView.classList.toggle('dusk', dusk);
    const sky = $('#navbar .skyicon');
    if (sky) sky.textContent = night ? '🌙' : dusk ? '🌇' : '☀️';
  }
  // one weather per in-game day: mostly sunny, sometimes a rain shower then a rainbow, snow in winter months
  function weatherNow() {
    const day = Math.floor(Date.now() / 1000 / DAY_LEN), p = dayPhase();
    const r = ((day * 9301 + 49297) % 233280) / 233280;
    const m = new Date().getMonth(), snowy = [5, 6, 7, 11].includes(m);
    if (r < 0.22) return p > 0.12 && p < 0.42 ? 'rain' : p >= 0.42 && p < 0.56 ? 'rainbow' : 'sun';
    if (r < 0.34 && snowy) return 'snow';
    return 'sun';
  }
  let wxShown = '', rainNode = null;
  function rainSound(on) {
    if (on && !rainNode && !S.mute) {
      const a = ac(); if (!a) return;
      if (!NOISE) noise({ dur: 0.01, vol: 0.0001 }); // builds the shared noise buffer
      const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      n.buffer = NOISE; n.loop = true; f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6; g.gain.value = 0.035;
      n.connect(f).connect(g).connect(OUT); n.start();
      rainNode = n;
    } else if (!on && rainNode) { try { rainNode.stop(); } catch (e) { /* already stopped */ } rainNode = null; }
  }
  function weatherTick() {
    const w = weatherNow(), visible = !document.hidden && openK < 0;
    rainSound(w === 'rain' && visible);
    if (w === wxShown) return;
    wxShown = w;
    ['rain', 'snow', 'rainbow'].forEach(c => mapView.classList.toggle(c, w === c));
    const ic = $('#navbar .wxicon');
    if (ic) ic.textContent = w === 'rain' ? '🌧️' : w === 'snow' ? '❄️' : w === 'rainbow' ? '🌈' : '';
  }
  (function weatherLayer() {
    const wx = el('div', 'wx', '<div class="rainfall"></div><div class="snowfall">' + '<i>❄️</i>'.repeat(14) + '</div><div class="bow"></div>');
    wx.id = 'wx';
    mapView.appendChild(wx);
  })();
  // every frame: called from the main loop
  function cityTick(dt) {
    if (document.hidden) return;
    cityT += dt;
    if (cityT < 1) return;
    cityT = 0;
    dayNight();
    weatherTick();
    if (view !== 'city' || openK >= 0) return;
    if (talking || !$('#modal').classList.contains('hidden') || S.play.lock) return;
    const now = Date.now();
    if (cityEv && now > cityEv.until && !busyRescue) { cityEv = null; attachCityThings(); }
    if (visitor && now > visitor.until) { visitor = null; attachCityThings(); }
    if (!cityEv && Math.random() < 1 / 20) spawnRescue();
    if (!visitor && Math.random() < 1 / 30) spawnVisitor();
  }
  // first time a new place opens: a hello (and the map asks where to build it)
  function cityHellos() {
    if (garageOpen() && !S.city.hi.garage) { S.city.hi.garage = 1; save(); quip('o_garage'); return true; }
    if (foodOpen() && !S.city.hi.food) { S.city.hi.food = 1; save(); quip('o_food'); return true; }
    return false;
  }

  // ---------- buying ----------
  function buy(k, w, btn) {
    ac();
    const L = G.lanes[k], R = RT[k];
    if (w === 'n') {
      if (L.n >= MAX_ANIMALS) return shake(btn);
      const c = animalCost(k, L.n);
      if (G.coins < c) return shake(btn);
      G.coins -= c; L.n++;
      addAnimal(k, true);
      floatText(k, 0.2, 0.2, '+1 ' + ANIMALS[k].a, true);
      sfx.boing(); setTimeout(() => laneVoice(k, true), 350);
    } else {
      const lvl = L[w];
      if (lvl >= MAXLVL) return shake(btn);
      const c = workCost(k, w, lvl);
      if (G.coins < c) return shake(btn);
      G.coins -= c; L[w]++;
      if (lvl === 0) {
        if (w === 'col') Object.assign(R.col, { x: COUNTER_X, ph: 'toPen', carry: 0 });
        if (w === 'truck') Object.assign(R.truck, { x: TRUCK_OUT, ph: 'away', t: 0.5, load: 0 });
        setVisibility(k);
      }
      const at = w === 'col' ? [R.col.x, 0.55] : w === 'cash' ? [0.815, 0.2] : [Math.min(R.truck.x, 0.9), 0.6];
      const newLook = lvl > 0 && tierOf(L[w]) > tierOf(lvl);
      floatText(k, at[0], at[1], lvl === 0 ? '🎉' : newLook ? '✨ NEW ✨' : '⬆️', true);
      if (newLook) { sfx.partyHorn(); confetti(40); } else if (lvl === 0) sfx.yippee(); else sfx.slideUp();
      applyTiers(k);
    }
    buzz(20);
    refreshUI(); save();
  }

  function unlockLane(k, btn) {
    ac();
    const u = ANIMALS[k].unlock;
    if (G.lanes[k - 1].sold < u.need || G.coins < u.cost) return shake(btn);
    G.coins -= u.cost;
    G.lanes[k].u = true;
    const opened = unlockWorlds();
    lockEl = null; closeModal(); save();
    construct(`[data-pen="${k}"]`, () => {
      renderCurrent(); renderNav(); shownCoins = -1; refreshUI();
      celebrate(ANIMALS[k].a, 0, ANIMALS[k].p);
      setTimeout(() => { if (S.silly) sfx.partyHorn(); laneVoice(k, true); }, 900);
      if (opened) setTimeout(() => { toast('📍 🗺️'); setView('city'); }, 3200);
    });
  }

  // ---------- UI refresh (4x per second) ----------
  function setBtn(b, cost, badge, maxed) {
    const can = !maxed && G.coins >= cost;
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
    const cw = view === 'city' && openK < 0 ? BANK : S.cur, c = Math.floor(S.worlds[cw].coins);
    if (c !== shownCoins) { $('#coins').textContent = fmt(c); $('#coinWorld').textContent = WD[cw].icon; shownCoins = c; }
    const st = starCount();
    if (st !== shownStars) { $('#stars').textContent = st; shownStars = st; }

    G.lanes.forEach((L, k) => {
      const E = RT[k].el; if (!E) return;
      E.sold.textContent = fmt(L.sold);
      setBtn(E.btns.n, animalCost(k, L.n), L.n, L.n >= MAX_ANIMALS);
      ['col', 'cash', 'truck'].forEach(w => setBtn(E.btns[w], workCost(k, w, L[w]), L[w] ? L[w] : '+', L[w] >= MAXLVL));
    });

    // tutorial finger in the chicken lane
    const R0 = RT[0];
    if (R0.el && R0.el.hint) {
      const P = R0.player, L0 = G.lanes[0];
      let where = null;
      if (L0.sold < 15 && !L0.col) {
        if (P.carry > 0) where = [0.81, 0.32];
        else if (L0.g >= 1) where = [0.2, 0.36];
      }
      R0.el.hint.style.display = where ? '' : 'none';
      if (where) { R0.el.hint.style.left = where[0] * 100 + '%'; R0.el.hint.style.top = where[1] * 100 + '%'; }
    }

    if (lockEl) {
      const k = lockEl._k, u = ANIMALS[k].unlock, sold = G.lanes[k - 1].sold;
      const met = sold >= u.need;
      lockEl.querySelector('.bar i').style.width = Math.min(100, sold / u.need * 100) + '%';
      lockEl.querySelector('.gtxt').textContent = met ? '✅' : `${sold}/${u.need}`;
      lockEl.classList.toggle('ready', met);
      lockEl.querySelector('.bigbtn').classList.toggle('can', met && G.coins >= u.cost);
    }

    liveMap();
    refreshMapBtn();
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
    if (celOpen || talking) { celQueue.push([e, stars, text]); return; }
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
  function closeModal() { $('#modal').classList.add('hidden'); parentOpen = false; }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  function showAchievements() {
    ac(); sfx.pop();
    const tile = a => `<div class="ach${S.ach[a.id] ? ' got' : ''}"><div class="ae">${a.e}</div><div class="at">${a.t}</div><div class="as">${'⭐'.repeat(a.s)}</div></div>`;
    const tiles = [...WD.map(D => D.icon), '🗺️'].map((icon, w) => `<div class="agroup">${icon}</div>` + ACH.filter(a => a.w === w).map(tile).join('')).join('');
    const pct = Math.round(starCount() * 2);
    openModal(`<h2>⭐ ${starCount()}</h2><div class="agrid">${tiles}</div><div class="bonus">⭐ = 💰 +${pct}%</div>`);
  }
  $('#starBtn').addEventListener('click', showAchievements);
  $('#setBtn').addEventListener('click', showSettings);
  $('#profBtn').addEventListener('click', () => showProfile());
  $('#coinPill').addEventListener('click', () => { ac(); sfx.coin(); });

  // ---------- offline & background earnings ----------
  // steady-state income of a fully automated lane (needs a collector plus a cashier or truck)
  function laneRate(w, k) {
    const L = S.worlds[w].lanes[k];
    if (!L.u || !L.col) return null;
    const prod = L.n / prodTime(k, w);
    const colR = colCap(L.col) / (2 * (COUNTER_X - PEN_X) / colSpeed(L.col));
    const cashR = L.cash ? 1 / cashIv(L.cash) : 0;
    const trR = L.truck ? truckCap(L.truck) / (2 * (TRUCK_OUT - TRUCK_STOP) / truckSpeed(L.truck) + 0.7 + truckCd(L.truck)) : 0;
    const flow = Math.min(prod, colR, cashR + trR);
    if (flow <= 0) return null;
    const truckShare = trR / (cashR + trR);
    return { items: flow, coins: flow * WD[w].lanes[k].price * mult(w) * (1 + 0.5 * truckShare) };
  }
  // run a world's automation for `secs` without animating it; returns coins earned
  function simLane(w, k, secs, eff) {
    const g = S.worlds[w], L = g.lanes[k];
    if (!L.u) return 0;
    const r = laneRate(w, k);
    if (!r) { L.g = Math.min(penCap(L), L.g + L.n * secs / prodTime(k, w)); return 0; }
    const coins = r.coins * secs * eff;
    L.sf = (L.sf || 0) + r.items * secs * eff;
    const whole = Math.floor(L.sf);
    L.sf -= whole; L.sold += whole;
    g.coins += coins; g.total += coins;
    return coins;
  }
  // run a world's automation for `secs` without animating it; returns coins earned
  function simWorld(w, secs, eff) {
    let coins = 0;
    for (let k = 0; k < 6; k++) coins += simLane(w, k, secs, eff);
    return coins;
  }
  function applyOffline() {
    const now = Date.now();
    const away = (now - S.last) / 1000;
    S.last = now;
    if (!(away > 30)) return;
    const lines = [];
    let longest = 0;
    S.worlds.forEach((g, w) => {
      if (!g.u) return;
      const secs = Math.min(away, g.b[2] ? 8 * 3600 : 2 * 3600);
      longest = Math.max(longest, secs);
      const c = simWorld(w, secs, (g.b[2] ? 1 : 0.5) * (S.wonders.train ? 2 : 1));
      if (c >= 1) lines.push(`<div class="oc">${WD[w].icon} +${fmt(c)} 💰</div>`);
    });
    if (!lines.length) return;
    save();
    const hrs = Math.floor(longest / 3600), mins = Math.floor((longest % 3600) / 60);
    openModal(`<div class="offline"><div class="oe">😴🌙</div><div class="ot">⏰ ${hrs ? hrs + 'h ' : ''}${mins}m</div>
      ${lines.join('')}<button class="bigbtn" id="okOff">👍</button></div>`);
    $('#okOff').onclick = () => { ac(); sfx.coin(); flyCoins($('#okOff'), 6); closeModal(); };
  }

  // ---------- cloud save (Firestore REST; the profile code is the document id) ----------
  const FB_KEY = 'AIzaSyCOxqx3i4FyJ5mm8TymPe6kJNoYv2ItPxw'; // public web key; access is controlled by firestore.rules
  const FB_URL = code => `https://firestore.googleapis.com/v1/projects/rudras-farm-game/databases/(default)/documents/saves/${code}?key=${FB_KEY}`;
  async function cloudGet(code) {
    const r = await fetch(FB_URL(code), { cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('cloud get ' + r.status);
    const f = (await r.json()).fields || {};
    const str = k => f[k] && f[k].stringValue;
    return { rev: Number(f.rev && f.rev.integerValue) || 0, data: str('data'), name: str('name'), av: str('av') };
  }
  function cloudPut(code, rev, state, prof, keepalive) {
    const body = JSON.stringify({ fields: {
      rev: { integerValue: String(rev) },
      data: { stringValue: JSON.stringify(Object.assign({}, state, { rev, pend: false })) },
      name: { stringValue: String(prof.name || 'Player').slice(0, 30) },
      av: { stringValue: prof.av || '🧒' },
    } });
    return fetch(FB_URL(code), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body, keepalive: !!keepalive })
      .then(r => { if (!r.ok) throw new Error('cloud put ' + r.status); });
  }
  const progress = st => st.worlds.reduce((t, g) => t + g.total, 0);

  let syncBusy = false, syncAgain = false, syncState = 'busy';
  function setSync(st) {
    syncState = st;
    $('#syncDot').textContent = st === 'ok' ? '✅' : st === 'busy' ? '🔄' : '⚠️';
    const line = $('#syncLine');
    if (line) line.textContent = st === 'ok' ? '☁️ ✅' : st === 'busy' ? '☁️ 🔄' : '☁️ ⚠️ offline';
  }
  async function sync(force) {
    if (syncBusy) { syncAgain = true; return; }
    syncBusy = true; setSync('busy');
    const code = PR.cur;
    try {
      const cloud = await cloudGet(code);
      if (code !== PR.cur) return; // switched profile while waiting
      const p = curProfile();
      // pick up a rename / new avatar made on another device
      if (cloud && cloud.name && (p.name === '…' || cloud.rev > S.rev) && (p.name !== cloud.name || p.av !== cloud.av)) {
        p.name = cloud.name; p.av = cloud.av || p.av; saveProfiles(); updateProfBtn();
      }
      let theirs = null;
      try { theirs = cloud && cloud.data ? parseSave(JSON.parse(cloud.data)) : null; } catch (e) { /* unreadable cloud copy */ }
      // newer copy from another device wins unless this device has made more progress (a tie goes to the cloud)
      if (!force && theirs && cloud.rev > S.rev && (!S.pend || progress(theirs) >= progress(S))) {
        adopt(theirs, cloud.rev); // another device has newer progress
      } else if (force || S.pend || !cloud || cloud.rev < S.rev) {
        const rev = Math.max(cloud ? cloud.rev : 0, S.rev) + 1, snap = snapshot(), st = S;
        await cloudPut(code, rev, st, p);
        st.rev = rev;
        if (st === S) { syncedSnap = snap; if (snapshot() === snap) S.pend = false; }
        writeJSON(saveKey(code), st);
      } else {
        syncedSnap = snapshot();
      }
      setSync('ok');
    } catch (e) {
      setSync('off');
    } finally {
      syncBusy = false;
      if (syncAgain) { syncAgain = false; setTimeout(() => sync(), 200); }
    }
  }
  // fire-and-forget upload when the app is being hidden or closed
  function pushNow() {
    if (!S.pend) return;
    const code = PR.cur, st = S, rev = S.rev + 1;
    cloudPut(code, rev, st, curProfile(), true)
      .then(() => { st.rev = rev; st.pend = false; writeJSON(saveKey(code), st); })
      .catch(() => { /* next sync sorts it out */ });
  }
  function adopt(st, rev) {
    S = st; S.rev = rev; S.pend = false;
    writeJSON(saveKey(PR.cur), S);
    syncedSnap = snapshot();
    reloadAll();
    applyOffline();
  }
  function silentAch() {
    // no party for old progress, except a newly opened world (worth celebrating on first visit)
    ACH.forEach(a => { if (!S.ach[a.id] && a.ok() && !/open$/.test(a.id)) S.ach[a.id] = Date.now(); });
  }
  function reloadAll() {
    celQueue.length = 0;
    bindWorld(); resetRT(); applyTheme();
    closeLane(true);
    silentAch();
    autoPlaceLegacy();
    startStory(); renderQuest();
    setView(view === 'district' && G.lanes[0].u && placed('w' + S.cur) ? 'district' : 'city');
    shownCoins = -1; shownStars = -1; refreshUI(); updateProfBtn();
  }
  function updateProfBtn() { $('#profAv').textContent = curProfile().av; }
  function switchProfile(code) {
    save(); pushNow();
    PR.cur = code; saveProfiles();
    S = load(code); syncedSnap = null;
    reloadAll(); closeModal();
    lastT = performance.now();
    sync();
  }

  let qrLib = null;
  function loadQR() {
    if (!qrLib) qrLib = new Promise((ok, fail) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
      sc.onload = ok; sc.onerror = () => { qrLib = null; fail(); };
      document.head.appendChild(sc);
    });
    return qrLib;
  }
  const esc = t => String(t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  // ---------- kid-facing profile & settings (grown-up things live behind the PIN) ----------
  const AVATARS = ['🧒', '👦', '👧', '🧑', '👨', '👩', '🐶', '🐱', '🦁', '🐼', '🐯', '🦖'];
  function showProfile() {
    ac(); sfx.pop();
    const p = curProfile();
    openModal(`<h2 class="pav" id="pAv">${p.av}</h2>
      <input id="pName" class="pname" maxlength="20" value="${esc(p.name)}" aria-label="Name">
      <div class="avs">${AVATARS.map(a => `<button class="av${a === p.av ? ' on' : ''}">${a}</button>`).join('')}</div>
      <div class="syncline" id="syncLine"></div>
      <div class="setrow"><button class="bigbtn" id="toParent">👨‍👩‍👧</button></div>`);
    setSync(syncState);
    $('#pName').addEventListener('change', e => {
      p.name = e.target.value.trim().slice(0, 20) || 'Player';
      saveProfiles(); S.pend = true; save(); sync(); accountSync();
    });
    document.querySelectorAll('#sheet .av').forEach(b => b.addEventListener('click', () => {
      p.av = b.textContent; saveProfiles(); S.pend = true; save(); sync(); accountSync();
      document.querySelectorAll('#sheet .av').forEach(x => x.classList.toggle('on', x === b));
      $('#pAv').textContent = p.av; updateProfBtn(); renderLanes(); sfx.pop();
    }));
    $('#toParent').addEventListener('click', openGrownups);
  }
  function showSettings() {
    ac(); sfx.pop();
    openModal(`<h2>⚙️</h2>
      <div class="setrow"><button class="bigbtn" id="muteBtn">${S.mute ? '🔇' : '🔊'}</button>
      <button class="bigbtn" id="sillyBtn">${S.silly ? '💨 ✅' : '💨 ❌'}</button>
      <button class="bigbtn" id="toParent">👨‍👩‍👧</button></div>`);
    $('#muteBtn').onclick = () => { S.mute = !S.mute; $('#muteBtn').textContent = S.mute ? '🔇' : '🔊'; save(); sfx.pop(); };
    $('#sillyBtn').onclick = () => {
      S.silly = !S.silly; $('#sillyBtn').textContent = S.silly ? '💨 ✅' : '💨 ❌'; save();
      if (S.silly) fart('triple'); else sfx.pop();
    };
    $('#toParent').addEventListener('click', openGrownups);
  }

  // ---------- parent PIN ----------
  async function hashPin(pin, salt) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const pinBlock = { fails: 0, until: 0 }; // slows down a child guessing PINs
  function pinPad(box, title, onPin) {
    let v = '';
    box.innerHTML = `<div class="pintitle">${title}</div><div class="pindots"></div><div class="pinmsg"></div>
      <div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => `<button class="pk"${k === '' ? ' disabled' : ''}>${k}</button>`).join('')}</div>`;
    const dots = box.querySelector('.pindots'), msg = box.querySelector('.pinmsg');
    const draw = () => { dots.innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < v.length ? 'on' : ''}"></i>`).join(''); };
    const fail = text => {
      dots.classList.remove('bad'); void dots.offsetWidth; dots.classList.add('bad');
      tone(220, 0.2, 'square', 0.08); msg.textContent = text || '';
    };
    draw();
    box.querySelectorAll('.pk').forEach(b => b.addEventListener('click', () => {
      const k = b.textContent;
      if (!k) return;
      tone(900, 0.04, 'triangle', 0.05);
      if (k === '⌫') v = v.slice(0, -1); else if (v.length < 4) v += k;
      draw();
      if (v.length === 4) { const pin = v; v = ''; setTimeout(() => { draw(); onPin(pin, fail); }, 120); }
    }));
  }
  // returns an onPin handler that checks the current profile's PIN
  function checkPin(ok) {
    return async (pin, fail) => {
      const now = Date.now();
      if (now < pinBlock.until) return fail(`⏳ ${Math.ceil((pinBlock.until - now) / 1000)}s`);
      if (await hashPin(pin, S.parent.salt) === S.parent.pin) { pinBlock.fails = 0; ok(); return; }
      pinBlock.fails++;
      if (pinBlock.fails >= 5) { pinBlock.until = now + 30000 * Math.pow(2, pinBlock.fails - 5); pinBlock.fails = 4; }
      fail('❌');
    };
  }
  function setPinFlow(done) {
    openModal(`<h2>👨‍👩‍👧</h2><p class="phint">Grown-ups: choose a 4-digit PIN. You'll need it to unlock play time and open these settings.</p><div id="pinBox"></div>`);
    pinPad($('#pinBox'), 'New PIN', first => {
      pinPad($('#pinBox'), 'Same PIN again', async (second, fail) => {
        if (second !== first) { fail('Didn’t match, try again'); setTimeout(() => setPinFlow(done), 900); return; }
        const salt = newCode();
        S.parent.salt = salt;
        S.parent.pin = await hashPin(first, salt);
        S.pend = true; save(); sync();
        done();
      });
    });
  }
  let parentOpen = false;
  function openGrownups() {
    ac();
    if (!S.parent.pin) return setPinFlow(showParent);
    openModal(`<h2>👨‍👩‍👧</h2><div id="pinBox"></div><button class="linkbtn" id="forgotPin">Forgot PIN?</button>`);
    pinPad($('#pinBox'), 'PIN', checkPin(showParent));
    $('#forgotPin').onclick = forgotPin;
  }
  function forgotPin() {
    openModal(`<h2>🔑</h2>
      <p class="phint">Type this game's secret code (shown under Profiles when you set things up), or sign in with the parent account's email and password.</p>
      <input id="fpCode" class="pname" placeholder="TIGER-XXXX-XXXX" autocapitalize="characters" autocomplete="off">
      <div class="setrow"><button class="bigbtn can" id="fpCodeGo">✅</button></div>
      <div class="or">or</div>
      <input id="fpEmail" class="pname" type="email" placeholder="Email" autocomplete="username">
      <input id="fpPass" class="pname" type="password" placeholder="Password" autocomplete="current-password">
      <div class="setrow"><button class="bigbtn" id="fpEmailGo">✅</button></div><div class="amsg" id="fpMsg"></div>`);
    const resetPin = () => { S.parent.pin = null; S.pend = true; save(); setPinFlow(showParent); };
    $('#fpCodeGo').onclick = e => (cleanCode($('#fpCode').value) === PR.cur ? resetPin() : shake(e.currentTarget));
    $('#fpEmailGo').onclick = async () => {
      $('#fpMsg').textContent = '🔄';
      try {
        const A = await authInit();
        await A.signInWithEmailAndPassword(auth, $('#fpEmail').value.trim(), $('#fpPass').value);
        await accountSync(true);
        if (acctCodes.includes(PR.cur)) resetPin();
        else $('#fpMsg').textContent = 'This game isn’t saved to that account.';
      } catch (e) { $('#fpMsg').textContent = authError(e); }
    };
  }

  // ---------- the grown-ups screen ----------
  function showParent() {
    parentOpen = true;
    const p = curProfile(), T = S.parent.timer;
    const link = location.origin + location.pathname + '?p=' + p.code;
    const others = PR.list.filter(x => x.code !== p.code);
    const opt = (vals, cur, label) => vals.map(v => `<option value="${v}"${+cur === v ? ' selected' : ''}>${label(v)}</option>`).join('');
    openModal(`<h2>👨‍👩‍👧 Grown-ups</h2>
      <p class="phint center">Settings for <b>${p.av} ${esc(p.name)}</b></p>
      <section class="pz">
        <h3>⏳ Play time</h3>
        <label class="tog"><input type="checkbox" id="tOn"${T.on ? ' checked' : ''}><span>Lock the game for a break</span></label>
        <div class="pzrow">after <select id="tMin">${opt([5, 10, 15, 20, 30, 45, 60], T.minutes, v => v + ' min')}</select> of play</div>
        <div class="pzrow">Daily limit <select id="tDay">${opt([0, 30, 45, 60, 90, 120, 180], T.daily, v => (v ? v + ' min' : 'none'))}</select></div>
        <div class="pzstat">Today: ${Math.floor(S.play.dayUsed / 60)} min played${T.on ? ` · next break in ${Math.max(0, Math.ceil((T.minutes * 60 - S.play.used) / 60))} min` : ''}</div>
        <div class="setrow"><button class="smallbtn" id="lockNow">🔒 Break now</button><button class="smallbtn" id="newSession">⏱️ Restart timer</button></div>
      </section>
      <section class="pz">
        <h3>📝 Break tasks</h3>
        <p class="phint">When time is up your child sees the next task (read aloud). Only your PIN starts the next session.</p>
        <div id="taskList"></div>
        <button class="smallbtn" id="addTask">➕ Add a task</button>
      </section>
      <section class="pz">
        <h3>👤 Profiles</h3>
        <div class="cloudbox">
          <div class="syncline" id="syncLine"></div>
          <div class="qr" id="qr"></div>
          <div class="pcode">${prettyCode(p.code)}</div>
          <div class="phint">Secret code for ${esc(p.name)}'s game. Scan, share or type it on another device. Keep a copy somewhere safe.</div>
          <button class="smallbtn" id="shareBtn">📤 Share</button>
        </div>
        ${others.length ? `<div class="plist">${others.map(o => `<button class="pbtn" data-c="${o.code}"><span>${o.av}</span>${esc(o.name)}</button>`).join('')}</div>` : ''}
        <div class="setrow"><button class="smallbtn" id="newProf">➕ New player</button><button class="smallbtn" id="joinBtn">🔑 I have a code</button></div>
        <div class="setrow hidden" id="joinRow"><input id="joinCode" class="pname" placeholder="TIGER-XXXX-XXXX" autocapitalize="characters" autocomplete="off"><button class="bigbtn can" id="joinGo">✅</button></div>
      </section>
      <section class="pz">
        <h3>☁️ Parent account</h3>
        <div id="acctBox"></div>
      </section>
      <section class="pz">
        <h3>⚙️ More</h3>
        <div class="setrow"><button class="smallbtn" id="chgPin">🔢 Change PIN</button><button class="smallbtn danger" id="resetBtn">🔄 Restart this game</button></div>
        <div class="setrow hidden" id="confirmRow"><span>Start ${esc(p.name)}'s game from zero?</span>
          <button class="smallbtn danger" id="yesReset">Yes, restart</button><button class="smallbtn" id="noReset">No</button></div>
      </section>`);
    setSync(syncState);
    renderAcct();
    const changed = () => { S.pend = true; save(); sync(); };
    $('#tOn').onchange = e => { T.on = e.target.checked; if (T.on) { S.play.used = 0; S.play.warned = false; } changed(); };
    $('#tMin').onchange = e => { T.minutes = +e.target.value; changed(); };
    $('#tDay').onchange = e => { T.daily = +e.target.value; changed(); };
    $('#lockNow').onclick = () => { T.on = true; S.play.used = T.minutes * 60; changed(); closeModal(); };
    $('#newSession').onclick = e => { S.play.used = 0; S.play.warned = false; changed(); e.currentTarget.textContent = '✅'; };
    const drawTasks = () => {
      $('#taskList').innerHTML = T.tasks.map((t, i) => `<div class="taskrow"><input class="taskin" data-i="${i}" maxlength="80" value="${esc(t)}"><button class="taskx" data-i="${i}" aria-label="Remove">✖</button></div>`).join('')
        || '<p class="phint">No tasks yet: a simple "Take a break" screen is shown.</p>';
      document.querySelectorAll('#taskList .taskin').forEach(inp => inp.addEventListener('change', () => { T.tasks[+inp.dataset.i] = inp.value.trim(); T.tasks = T.tasks.filter(Boolean); changed(); drawTasks(); }));
      document.querySelectorAll('#taskList .taskx').forEach(b => b.addEventListener('click', () => { T.tasks.splice(+b.dataset.i, 1); changed(); drawTasks(); }));
    };
    drawTasks();
    $('#addTask').onclick = () => {
      T.tasks.push(''); drawTasks();
      const ins = document.querySelectorAll('#taskList .taskin'); ins[ins.length - 1].placeholder = 'e.g. 🦷 Brush your teeth'; ins[ins.length - 1].focus();
    };
    $('#shareBtn').addEventListener('click', async e => {
      const btn = e.currentTarget;
      try {
        if (navigator.share) await navigator.share({ title: "Rudra's Farm", text: `${p.name}'s game: ${prettyCode(p.code)}`, url: link });
        else { await navigator.clipboard.writeText(link); btn.textContent = '✅ Copied'; }
      } catch (err) { /* share sheet closed */ }
    });
    loadQR().then(() => {
      const q = window.qrcode(0, 'M'); q.addData(link); q.make();
      const box = $('#qr'); if (box) box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    }).catch(() => { const box = $('#qr'); if (box) box.remove(); });
    document.querySelectorAll('#sheet .pbtn').forEach(b => b.addEventListener('click', () => { sfx.buy(); switchProfile(b.dataset.c); }));
    $('#newProf').addEventListener('click', () => {
      const code = newCode(), rules = JSON.parse(JSON.stringify(S.parent)); // same PIN and play rules
      PR.list.push({ code, name: 'Player ' + (PR.list.length + 1), av: AVATARS[PR.list.length % AVATARS.length] });
      saveProfiles(); sfx.buy();
      switchProfile(code);
      S.parent = rules; S.pend = true; save(); sync(); accountSync();
      showParent();
    });
    $('#joinBtn').addEventListener('click', () => { $('#joinRow').classList.remove('hidden'); $('#joinCode').focus(); });
    $('#joinGo').addEventListener('click', async e => {
      const btn = e.currentTarget, code = cleanCode($('#joinCode').value);
      if (!validCode(code)) return shake(btn);
      if (PR.list.some(x => x.code === code)) return switchProfile(code);
      btn.textContent = '🔄';
      try {
        const cloud = await cloudGet(code);
        if (!cloud) { btn.textContent = '❓'; return shake(btn); }
        PR.list.push({ code, name: cloud.name || 'Player', av: cloud.av || '🧒' });
        saveProfiles(); sfx.buy();
        switchProfile(code);
        dropBlankDefaults(code); saveProfiles(); accountSync();
      } catch (err) { btn.textContent = '⚠️'; shake(btn); }
    });
    $('#chgPin').onclick = () => setPinFlow(showParent);
    $('#resetBtn').onclick = () => $('#confirmRow').classList.remove('hidden');
    $('#noReset').onclick = () => $('#confirmRow').classList.add('hidden');
    $('#yesReset').onclick = () => {
      const keep = { mute: S.mute, silly: S.silly, rev: S.rev, parent: S.parent, play: S.play };
      S = Object.assign(fresh(), keep);
      save(); reloadAll(); closeModal(); sync(true);
    };
  }

  // ---------- play timer & break lock ----------
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const noEmoji = t => String(t).replace(/\p{Extended_Pictographic}|️|‍/gu, '').trim();
  function say(text) {
    if (S.mute || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(noEmoji(text));
      u.rate = 0.95; u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) { /* no speech on this device */ }
  }
  function toast(text) {
    const t = el('div', 'toast', text);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  function updatePlay(dt) {
    const T = S.parent.timer, P = S.play, today = todayStr();
    if (P.day !== today) { P.day = today; P.dayUsed = 0; P.extra = 0; if (P.lock && P.lock.type === 'day') P.lock = null; }
    if (!T.on || !S.parent.pin) { if (P.lock) P.lock = null; return; }
    if (P.lock || document.hidden || parentOpen) return;
    P.used += dt; P.dayUsed += dt;
    const left = T.minutes * 60 - P.used;
    if (left <= 60 && !P.warned) {
      P.warned = true;
      toast('⏳ 1 minute left!'); say('One more minute!');
      [784, 988].forEach((f, i) => tone(f, 0.18, 'triangle', 0.15, null, i * 0.18));
    }
    if (left <= 0) {
      const tasks = T.tasks.filter(Boolean);
      P.lock = { type: 'task', text: tasks.length ? tasks[S.parent.ti % tasks.length] : '🌈 Take a little break' };
      S.pend = true; save(); sync();
    } else if (T.daily && P.dayUsed >= T.daily * 60 + P.extra) {
      P.lock = { type: 'day' };
      S.pend = true; save(); sync();
    }
  }
  let lockShown = '';
  function renderLock() {
    const L = S.play.lock, key = L ? L.type + ':' + (L.text || '') : '';
    if (key === lockShown) return;
    lockShown = key;
    const box = $('#lock');
    if (!L) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    const day = L.type === 'day';
    stopVoice();
    box.classList.remove('hidden');
    box.innerHTML = `<div class="lockcard">
      <div class="lk-e">${day ? '🌙' : '⏰'}</div>
      <div class="lk-t">${day ? 'All done for today!' : esc(L.text)}</div>
      <div class="lk-s">${day ? 'See you tomorrow 😊' : 'When you’ve done it, ask a grown-up ✅'}</div>
      <div class="setrow" id="lkBtns"><button class="bigbtn" id="lkSay">🔊</button><button class="bigbtn can" id="lkDone">👨‍👩‍👧</button></div>
      <div id="lkPad"></div></div>`;
    const speak = () => say(day ? 'All done for today! See you tomorrow.' : L.text + '. When you have done it, ask a grown-up.');
    $('#lkSay').onclick = speak;
    setTimeout(speak, 500);
    tone(660, 0.25, 'sine', 0.15); tone(523, 0.35, 'sine', 0.15, null, 0.25);
    $('#lkDone').onclick = () => {
      $('#lkBtns').classList.add('hidden');
      pinPad($('#lkPad'), '👨‍👩‍👧 PIN', checkPin(() => {
        if (!day) return unlockPlay(0);
        $('#lkPad').innerHTML = `<div class="pintitle">More time today?</div><div class="setrow">
          ${[15, 30, 60].map(m => `<button class="smallbtn" data-m="${m}">+${m} min</button>`).join('')}
          <button class="smallbtn" data-m="0">Done for today</button></div>`;
        document.querySelectorAll('#lkPad [data-m]').forEach(b => b.addEventListener('click', () => {
          const m = +b.dataset.m;
          if (!m) { lockShown = ''; $('#lkPad').innerHTML = ''; $('#lkBtns').classList.remove('hidden'); return; }
          unlockPlay(m);
        }));
      }));
    };
  }
  function unlockPlay(extraMin) {
    const P = S.play;
    if (P.lock && P.lock.type === 'task') { S.parent.ti++; P.used = 0; P.warned = false; }
    if (extraMin) P.extra = P.dayUsed - S.parent.timer.daily * 60 + extraMin * 60;
    P.lock = null;
    S.pend = true; save(); sync();
    sfx.yippee(); confetti(80);
    lastT = performance.now();
  }
  function timePill() {
    const T = S.parent.timer, pill = $('#timePill');
    if (!T.on || !S.parent.pin || S.play.lock) { pill.classList.add('hidden'); return; }
    const left = Math.max(0, T.minutes * 60 - S.play.used);
    pill.classList.remove('hidden');
    pill.textContent = '⏳ ' + (left >= 60 ? Math.ceil(left / 60) + 'm' : Math.ceil(left) + 's');
    pill.classList.toggle('low', left <= 60);
  }

  // ---------- parent accounts (Firebase Auth; profiles list in users/{uid}) ----------
  const FB_CFG = {
    apiKey: FB_KEY, projectId: 'rudras-farm-game', appId: '1:610156002030:web:8ca32374b66902f4ab51ff',
    // same-site auth handler on our own hosting keeps redirect sign-in working in Safari / home-screen apps
    authDomain: /\.web\.app$|\.firebaseapp\.com$/.test(location.hostname) ? location.host : 'rudras-farm-game.firebaseapp.com',
  };
  let auth = null, user = null, authReady = null, acctCodes = [];
  function authInit() {
    if (!authReady) {
      authReady = (async () => {
        const v = '10.14.1';
        const [appM, A] = await Promise.all([
          import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
          import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`),
        ]);
        auth = A.initializeAuth(appM.initializeApp(FB_CFG), {
          persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence],
          popupRedirectResolver: A.browserPopupRedirectResolver,
        });
        A.onAuthStateChanged(auth, u => {
          user = u;
          if (u) { PR.acct = { email: u.email || '' }; saveProfiles(); accountSync(); }
          renderAcct();
        });
        A.getRedirectResult(auth).catch(e => acctMsg(authError(e)));
        return A;
      })();
      authReady.catch(() => { authReady = null; });
    }
    return authReady;
  }
  const USER_URL = uid => `https://firestore.googleapis.com/v1/projects/rudras-farm-game/databases/(default)/documents/users/${uid}`;
  let acctBusy = null;
  // merge this device's profiles with the account's: every device signed in sees every child's game
  function accountSync(wait) {
    if (!user) return Promise.resolve();
    if (acctBusy) return wait ? acctBusy.then(() => accountSync()) : acctBusy;
    acctBusy = (async () => {
      const H = { Authorization: 'Bearer ' + await user.getIdToken(), 'Content-Type': 'application/json' };
      const r = await fetch(USER_URL(user.uid), { headers: H, cache: 'no-store' });
      let theirs = [];
      if (r.ok) {
        const f = (await r.json()).fields || {};
        theirs = ((f.profiles && f.profiles.arrayValue.values) || []).map(x => {
          const m = x.mapValue.fields;
          return { code: m.code.stringValue, name: m.name.stringValue, av: m.av.stringValue };
        }).filter(x => validCode(x.code));
      } else if (r.status !== 404) throw new Error('account ' + r.status);
      const cur = curProfile();
      const wasBlank = cur.auto && !PR.list.some(x => !x.auto) && theirs.length;
      theirs.forEach(t => { if (!PR.list.some(x => x.code === t.code)) PR.list.push(t); });
      const mine = PR.list.filter(x => !x.auto || theirs.some(t => t.code === x.code));
      acctCodes = mine.map(x => x.code);
      const body = { fields: {
        profiles: { arrayValue: { values: mine.map(x => ({ mapValue: { fields: {
          code: { stringValue: x.code }, name: { stringValue: String(x.name).slice(0, 30) }, av: { stringValue: x.av } } } })) } },
        updated: { integerValue: String(Date.now()) },
      } };
      const w = await fetch(USER_URL(user.uid), { method: 'PATCH', headers: H, body: JSON.stringify(body) });
      if (!w.ok) throw new Error('account save ' + w.status);
      saveProfiles();
      if (wasBlank) { const to = theirs[0].code; switchProfile(to); dropBlankDefaults(to); saveProfiles(); }
      renderAcct();
    })().catch(() => { /* offline: try again later */ }).finally(() => { acctBusy = null; });
    return acctBusy;
  }
  function authError(e) {
    const c = (e && e.code) || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return 'Email or password is not right.';
    if (/email-already-in-use/.test(c)) return 'That email already has an account. Tap Sign in.';
    if (/weak-password/.test(c)) return 'Password needs at least 6 characters.';
    if (/invalid-email/.test(c)) return 'That email doesn’t look right.';
    if (/popup-closed|cancelled-popup/.test(c)) return '';
    if (/network|failed to fetch/i.test(c + (e && e.message))) return 'No internet right now.';
    if (/too-many-requests/.test(c)) return 'Too many tries. Wait a minute.';
    return 'Something went wrong (' + (c || 'error') + ').';
  }
  function acctMsg(t) { const m = $('#aMsg'); if (m) m.textContent = t; }
  function renderAcct() {
    const box = $('#acctBox');
    if (!box) return;
    const state = user ? 'in:' + user.uid : 'out';
    if (box.dataset.state === state) return; // don't wipe what a parent is typing
    box.dataset.state = state;
    if (user) {
      box.innerHTML = `<p class="phint">✅ Signed in as <b>${esc(user.email || 'Google account')}</b>. All players on this device are saved to this account. Sign in on any phone, tablet or computer to get them back.</p>
        <div class="setrow"><button class="smallbtn" id="aOut">Sign out</button></div>`;
      $('#aOut').onclick = async () => { const A = await authInit(); await A.signOut(auth); PR.acct = null; saveProfiles(); renderAcct(); };
      return;
    }
    box.innerHTML = `<p class="phint">Sign in so your child's games are never lost, even if this device is lost or wiped.</p>
      <button class="gbtn" id="gSign"><b>G</b> Continue with Google</button>
      <div class="or">or use email</div>
      <input id="aEmail" class="pname" type="email" placeholder="Email" autocomplete="username">
      <input id="aPass" class="pname" type="password" placeholder="Password (6+ characters)" autocomplete="current-password">
      <div class="setrow"><button class="smallbtn" id="aIn">Sign in</button><button class="smallbtn" id="aUp">Create account</button></div>
      <button class="linkbtn" id="aForgot">Forgot password?</button>
      <div class="amsg" id="aMsg"></div>`;
    let typed = ['', ''];
    const run = fn => async () => {
      typed = [$('#aEmail').value.trim(), $('#aPass').value]; // read before the sign-in library loads
      acctMsg('🔄');
      try { const A = await authInit(); await fn(A); acctMsg(''); } catch (e) { acctMsg(authError(e)); }
    };
    const creds = () => typed;
    $('#gSign').onclick = run(async A => {
      const prov = new A.GoogleAuthProvider();
      prov.setCustomParameters({ prompt: 'select_account' });
      const homeScreenIOS = (navigator.standalone || matchMedia('(display-mode: standalone)').matches) && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
      if (homeScreenIOS) return A.signInWithRedirect(auth, prov);
      try { await A.signInWithPopup(auth, prov); } catch (e) {
        if (/popup-blocked|operation-not-supported|web-storage-unsupported/.test(e.code)) return A.signInWithRedirect(auth, prov);
        throw e;
      }
    });
    $('#aIn').onclick = run(A => A.signInWithEmailAndPassword(auth, ...creds()));
    $('#aUp').onclick = run(A => A.createUserWithEmailAndPassword(auth, ...creds()));
    $('#aForgot').onclick = run(async A => {
      const email = creds()[0];
      if (!email) throw { code: 'invalid-email' };
      await A.sendPasswordResetEmail(auth, email);
      setTimeout(() => acctMsg('📧 Check your email for a reset link.'), 0);
    });
  }

  // ---------- moving from the old address (GitHub Pages) to our own hosting ----------
  const NEW_HOME = 'https://rudras-farm-game.web.app/';
  async function moveHome() {
    if (location.hostname !== 'anshrockz91.github.io') return;
    openModal(`<div class="offline"><div class="oe">🚚</div><div class="ot">Moving to the game's new home…</div></div>`);
    try {
      save();
      const keep = PR.list.filter(x => !x.auto);
      for (const x of keep) { // make sure every game is safely in the cloud first
        const st = x.code === PR.cur ? S : readJSON(saveKey(x.code));
        if (!st) continue;
        const cloud = await cloudGet(x.code);
        if (!cloud || st.pend || (st.rev | 0) > cloud.rev) await cloudPut(x.code, Math.max(cloud ? cloud.rev : 0, st.rev | 0) + 1, st, x);
      }
      if (!keep.length) return location.replace(NEW_HOME); // nothing saved here yet
      const cur = keep.some(x => x.code === PR.cur) ? PR.cur : keep[0].code;
      location.replace(`${NEW_HOME}?import=${keep.map(x => x.code).join(',')}&cur=${cur}`);
    } catch (e) {
      closeModal(); // offline: keep playing here and try again next time
    }
  }
  // games imported from a move or a share link arrive with placeholder names; fetch the real ones
  async function fillNames() {
    for (const x of PR.list.filter(p => p.name === '…')) {
      try { const c = await cloudGet(x.code); if (c) { x.name = c.name || 'Player'; x.av = c.av || x.av; } } catch (e) { return; }
    }
    saveProfiles(); updateProfBtn();
  }

  // ---------- main loop ----------
  let lastT = performance.now(), uiT = 0, saveT = 0, bgT = 0;
  function tick(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    G.lanes.forEach((L, k) => {
      if (!L.u || !RT[k].el) return;
      stepLane(k, dt);
      renderLane(k);
    });
    bgT += dt;
    if (bgT >= 1) {
      S.worlds.forEach((g, w) => { if (g.u && w !== S.cur) simWorld(w, bgT, S.wonders.train ? 2 : 1); });
      G.lanes.forEach((L, k) => { if (L.u && !RT[k].el) simLane(S.cur, k, bgT, 1); });
      bgT = 0;
    }
    updatePlay(dt);
    renderLock();
    cityTick(dt);
    uiT += dt; saveT += dt;
    if (uiT > 0.25) { uiT = 0; refreshUI(); checkAch(); timePill(); checkStory(); renderQuest(); }
    if (saveT > 5) { saveT = 0; save(); }
    S.last = Date.now();
    requestAnimationFrame(tick);
  }

  // animals wander around their pens
  setInterval(() => {
    RT.forEach((R, k) => {
      if (!R.el || !G.lanes[k].u || WD[S.cur].still) return;
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
    if (document.hidden) { save(); pushNow(); }
    else { applyOffline(); lastT = performance.now(); sync(); }
  });
  window.addEventListener('pagehide', () => { save(); pushNow(); });
  window.addEventListener('online', () => sync());
  setInterval(() => { if (S.pend && !document.hidden) sync(); }, 30000);
  document.addEventListener('pointerdown', () => ac(), { once: true });

  // ---------- start ----------
  applyTheme();
  silentAch();
  updateProfBtn();
  applyOffline();
  autoPlaceLegacy();
  setView('city');
  startStory();
  renderQuest();
  requestAnimationFrame(tick);
  sync();
  if (PR.acct) authInit().catch(() => { /* offline */ });
  fillNames();
  moveHome();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.__farm = { get S() { return S; }, get PR() { return PR; }, get user() { return user; }, RT, mult, fmt, weatherNow: () => weatherNow(), goWorld, goQuest: q => goQuest(QUESTS[q]), openLane, closeLane: () => closeLane(), placeHere, needPlacing, get view() { return view; }, sync, setView, showWonder, WONDERS, spawnRescue: () => spawnRescue(), spawnVisitor: () => spawnVisitor(), RIDES, FOOD, get talking() { return talking; }, authInit, accountSync, openGrownups,
    // test hook: render sounds into an OfflineAudioContext
    audio: { VOICES, fart, sfx, voice(n) { voiceGain = VOICE_GAIN[n] || 1; VOICES[n](); voiceGain = 1; }, useContext(ctx) { AC = ctx; OUT = ctx.destination; NOISE = null; } } }; // handy for debugging
})();
