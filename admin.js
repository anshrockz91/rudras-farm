'use strict';
// Admin control panel for the test sandbox (index.html?sandbox=1, opened from admin.html).
// Everything here works on the sandbox save only: separate storage, no cloud writes, no accounts.
(() => {
  const A = window.__admin;
  if (!A) return;
  // no key for this browser: back to the code screen
  let ok = false;
  try { ok = [sessionStorage, localStorage].some(st => st.getItem('rf.admin') === (window.ADMIN_KEY || {}).hash); } catch (e) { /* storage blocked */ }
  if (!ok) {
    const s = document.createElement('script');
    s.src = 'admin-key.js';
    s.onload = () => {
      try { ok = [sessionStorage, localStorage].some(st => st.getItem('rf.admin') === window.ADMIN_KEY.hash); } catch (e) { /* storage blocked */ }
      if (ok) start(); else location.replace('admin.html');
    };
    s.onerror = () => location.replace('admin.html');
    document.head.appendChild(s);
    return;
  }
  start();

  function start() {
    const S = () => A.S, fmt = A.fmt;
    const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const css = document.createElement('style');
    css.textContent = `
      .adm-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 300; display: flex; align-items: center; gap: 8px; padding: 6px 10px calc(6px + env(safe-area-inset-bottom));
        background: #1f2233; color: #fff; font: 600 14px Fredoka, system-ui, sans-serif; box-shadow: 0 -4px 14px rgba(0,0,0,.25); }
      .adm-bar b { color: #ffc83d; } .adm-bar .sp { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .adm-bar button, .adm button { font: 700 14px Fredoka, system-ui, sans-serif; border: 0; border-radius: 10px; padding: 7px 11px; cursor: pointer; background: #ffc83d; color: #3a2a00; }
      .adm-bar button.ghost { background: #3a3f5c; color: #fff; }
      .adm { position: fixed; top: 0; right: 0; bottom: 0; width: min(440px, 100vw); z-index: 310; background: #f4f5fb; color: #1f2233; overflow-y: auto;
        font: 500 15px Fredoka, system-ui, sans-serif; box-shadow: -10px 0 30px rgba(0,0,0,.3); transform: translateX(105%); transition: transform .25s; padding-bottom: 80px; }
      .adm.open { transform: none; }
      .adm h2 { position: sticky; top: 0; margin: 0; padding: 14px 16px; background: #1f2233; color: #fff; font-size: 20px; display: flex; justify-content: space-between; align-items: center; z-index: 2; }
      .adm h2 button { background: #3a3f5c; color: #fff; }
      .adm details { margin: 10px 12px; background: #fff; border-radius: 14px; box-shadow: 0 2px 0 rgba(0,0,0,.06); }
      .adm summary { padding: 12px 14px; font-weight: 700; font-size: 17px; cursor: pointer; }
      .adm .bd { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 8px; }
      .adm .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      .adm .row > .lbl { flex: 1 1 100%; font-weight: 700; display: flex; justify-content: space-between; gap: 6px; }
      .adm .row > .lbl i { font-style: normal; color: #6b7090; font-weight: 600; }
      .adm button.s { background: #e8eaf4; color: #1f2233; } .adm button.r { background: #ffd9d9; color: #7a1f1f; } .adm button.g { background: #d6f5c6; color: #1f5a12; }
      .adm button.on { outline: 3px solid #1f2233; }
      .adm input[type=number], .adm input[type=text], .adm select, .adm textarea { font: inherit; border: 2px solid #d6d9e8; border-radius: 10px; padding: 6px 8px; min-width: 0; }
      .adm input[type=number] { width: 120px; } .adm select { max-width: 100%; flex: 1; } .adm textarea { width: 100%; height: 90px; font-size: 12px; }
      .adm .note { font-size: 13px; color: #6b7090; line-height: 1.35; }
      .adm .sep { height: 1px; background: #eceef6; margin: 4px 0; }
      html.sandbox #mapview { bottom: 46px; } html.sandbox #laneView { bottom: 46px; }
    `;
    document.head.appendChild(css);

    const bar = document.createElement('div');
    bar.className = 'adm-bar';
    bar.innerHTML = `<span class="sp">🧪 <b>TEST MODE</b> · nothing here changes real games</span><button id="admOpen">🛠️ Admin</button><button class="ghost" id="admExit">🚪 Exit</button>`;
    document.body.appendChild(bar);
    const P = document.createElement('div');
    P.className = 'adm';
    document.body.appendChild(P);
    bar.querySelector('#admOpen').onclick = () => { render(); P.classList.add('open'); };
    bar.querySelector('#admExit').onclick = () => {
      if (!confirm('Leave the test sandbox? (Your test game is kept on this device.)')) return;
      try { sessionStorage.removeItem('rf.admin'); } catch (e) { /* ignore */ }
      location.href = 'index.html';
    };

    const say = t => { const n = document.createElement('div'); n.className = 'toast'; n.textContent = t; document.body.appendChild(n); setTimeout(() => n.remove(), 2200); };
    const apply = (where, msg) => { A.refresh(where); render(); if (msg) say(msg); };
    const worldName = w => `${A.WD[w].icon} ${A.WD[w].title}`;
    const allDone = () => Object.fromEntries(A.QUESTS.map(q => [q.id, 1]));

    // ---------- actions ----------
    const act = {
      coins(w, how) {
        const ws = w === 'all' ? A.S.worlds.map((_, i) => i) : [+w];
        ws.forEach(i => {
          const g = A.S.worlds[i];
          if (how === 'x10') g.coins *= 10;
          else if (how === 'zero') g.coins = 0;
          else if (how === 'set') { const v = Number(P.querySelector(`#cset${i}`).value); if (v >= 0) g.coins = v; }
          else { g.coins += +how; g.total += +how; }
        });
        apply(null);
      },
      worldOpen(w, on) {
        const g = A.S.worlds[w];
        if (w === 0) return say('The farm is always open');
        g.u = on;
        if (!on) {
          // undo what opens it too, or it would open again straight away
          if (A.WD[w].wonder) { delete A.S.wonders[A.WD[w].wonder]; delete A.S.map.wslots[A.WD[w].wonder]; } else A.S.worlds[w - 1].lanes[5].u = false;
          delete A.S.map.places['w' + w]; if (A.S.cur === w) A.S.cur = 0;
        }
        apply(null, on ? `${worldName(w)} opened` : `${worldName(w)} locked`);
      },
      pens(w, on) { A.S.worlds[w].lanes.forEach((l, k) => { l.u = on || k === 0; }); apply(null, on ? 'All pens open' : 'Only the first pen open'); },
      animals(w) { A.S.worlds[w].lanes.forEach(l => { if (l.u) l.n = A.MAX_ANIMALS; }); apply(null, 'Every open pen is full'); },
      workers(w) {
        const n = Math.max(0, Math.min(A.MAXLVL, Number(P.querySelector(`#wl${w}`).value) | 0));
        A.S.worlds[w].lanes.forEach(l => { if (l.u) { l.col = n; l.cash = n; l.truck = n; } });
        apply(null, `Workers set to level ${n}`);
      },
      builds(w, on) {
        A.S.worlds[w].b = A.S.worlds[w].b.map(() => on);
        if (!on) A.S.map.slots['w' + w] = {};
        apply(null, on ? 'All buildings built' : 'Buildings removed');
      },
      go(w) { if (!A.S.worlds[w].u) return say('Open that world first'); P.classList.remove('open'); A.goWorld(+w); },
      wonder(id, on) {
        if (on) A.S.wonders[id] = Date.now(); else { delete A.S.wonders[id]; delete A.S.map.wslots[id]; }
        apply(null);
      },
      story(how) {
        const st = A.S.story;
        if (how === 'jump') {
          const n = Number(P.querySelector('#qsel').value);
          st.intro = true; st.finale = false; st.q = n;
          st.done = Object.fromEntries(A.QUESTS.slice(0, n).map(q => [q.id, 1]));
          apply('city', `Story moved to step ${n + 1}`);
        } else if (how === 'all') {
          st.intro = true; st.done = allDone(); st.q = A.QUESTS.length; st.finale = true;
          apply('city', 'Whole story finished');
        } else if (how === 'finale') {
          st.intro = true; st.done = allDone(); st.q = A.QUESTS.length; st.finale = false;
          P.classList.remove('open'); apply('city'); // the finale plays on the next story check
        } else if (how === 'reset') {
          A.S.story = { q: 0, done: {}, intro: false, finale: false };
          P.classList.remove('open'); apply('city'); A.startStory();
        }
      },
      rides(on) { A.S.city.cars = {}; if (on) A.RIDES.forEach(r => { A.S.city.cars[r.id] = Date.now(); }); A.S.city.ride = on ? A.RIDES[A.RIDES.length - 1].id : ''; apply(null); },
      food(on) { A.S.city.food = {}; if (on) A.FOOD.forEach(f => { A.S.city.food[f.id] = Date.now(); }); apply(null); },
      tips() { Object.keys(A.S.city.food).forEach(id => { A.S.city.food[id] = Date.now() - 600000; }); apply(null, 'Restaurants have 10 minutes of tips'); },
      rescue() { P.classList.remove('open'); if (A.S.story.done.q11) { A.setView('city'); setTimeout(A.spawnRescue, 400); } else say('Rescues start after story step 12 (fire crew)'); },
      visitor() { P.classList.remove('open'); if (A.S.story.done.q4) { A.setView('city'); setTimeout(A.spawnVisitor, 400); } else say('Visitors start after story step 5'); },
      ach(on) { A.S.ach = {}; if (on) A.ACH.forEach(a => { A.S.ach[a.id] = Date.now(); }); apply(null, on ? 'All achievements unlocked' : 'Achievements cleared'); },
      time(v) { A.FORCE.phase = v === 'auto' ? null : +v; A.dayNight(); render(); },
      weather(v) { A.FORCE.weather = v === 'auto' ? null : v; A.weatherTick(); render(); },
      speed(v) { A.FORCE.speed = +v; render(); say(`Game speed ×${v}`); },
      away(mins) { A.S.last = Date.now() - mins * 60000; P.classList.remove('open'); A.applyOffline(); },
      pin() { A.S.parent.pin = null; A.S.parent.salt = ''; A.S.play.lock = null; apply(null, 'Grown-ups PIN removed'); },
      grownups() { P.classList.remove('open'); A.openGrownups(); },
      preset(kind) {
        if (!confirm('Replace the test game with this setup?')) return;
        const d = A.fresh();
        if (kind === 'mid') {
          [0, 1].forEach(w => { const g = d.worlds[w]; g.u = true; g.coins = 1e6; g.total = 5e6; g.b = g.b.map((_, i) => i < 3);
            g.lanes.forEach((l, k) => { l.u = k < 4; l.n = 3; l.col = 3; l.cash = 3; l.truck = k < 2 ? 3 : 0; l.sold = 80; }); });
          d.story = { q: 12, done: Object.fromEntries(A.QUESTS.slice(0, 12).map(q => [q.id, 1])), intro: true, finale: false };
        } else if (kind === 'all') {
          d.worlds.forEach(g => { g.u = true; g.coins = 1e12; g.total = 1e13; g.b = g.b.map(() => true);
            g.lanes.forEach(l => { l.u = true; l.n = A.MAX_ANIMALS; l.col = A.MAXLVL; l.cash = A.MAXLVL; l.truck = A.MAXLVL; l.sold = 1e4; }); });
          A.WONDERS.forEach(x => { d.wonders[x.id] = Date.now(); });
          d.story = { q: A.QUESTS.length, done: allDone(), intro: true, finale: true };
          A.RIDES.forEach(r => { d.city.cars[r.id] = Date.now(); }); d.city.ride = 'heli';
          A.FOOD.forEach(f => { d.city.food[f.id] = Date.now(); });
        }
        P.classList.remove('open');
        A.replace(d);
        if (kind === 'new') A.startStory();
        say('Test game replaced');
      },
      async copyReal() {
        const code = A.cleanCode(P.querySelector('#rcode').value);
        if (!A.validCode(code)) return say('That is not a player code (looks like TIGER-ABCD-1234)');
        try {
          const c = await A.cloudFetch(code);
          if (!c || !c.data) return say('No game found for that code');
          if (!confirm(`Copy ${c.name || 'that player'}'s game into the sandbox? Their real game is not changed.`)) return;
          A.replace(JSON.parse(c.data)); P.classList.remove('open'); say(`Copied ${c.name || 'the'} game (read-only copy)`);
        } catch (e) { say('Could not load it (offline?)'); }
      },
      exportSave() {
        const t = P.querySelector('#io');
        t.value = JSON.stringify(A.S);
        t.select();
        try { navigator.clipboard.writeText(t.value).then(() => say('Copied to clipboard')); } catch (e) { /* select is enough */ }
      },
      importSave() {
        try { const d = JSON.parse(P.querySelector('#io').value); A.replace(d); say('Save loaded'); } catch (e) { say('That text is not a save'); }
      },
    };

    // ---------- the panel ----------
    const btn = (label, fn, cls) => `<button class="${cls || ''}" data-a="${esc(fn)}">${label}</button>`;
    let openSecs = new Set(['coins']);
    function render() {
      const s = S();
      const qOpts = A.QUESTS.map((q, i) => `<option value="${i}"${i === Math.min(s.story.q, A.QUESTS.length - 1) ? ' selected' : ''}>${i + 1}. ${esc(A.PEOPLE[q.who].name)}${q.shop ? ' · ' + esc(q.shop[1]) : ''}</option>`).join('');
      const sec = (id, title, body) => `<details data-s="${id}"${openSecs.has(id) ? ' open' : ''}><summary>${title}</summary><div class="bd">${body}</div></details>`;
      const pick = (cur, v, label, fn) => btn(label, fn, 's' + (String(cur) === String(v) ? ' on' : ''));
      P.innerHTML = `<h2>🛠️ Admin <button data-a="close">✖</button></h2>
      ${sec('coins', '💰 Coins', `<div class="row">${btn('All +1B', "coins('all',1e9)", 'g')}${btn('All +1T', "coins('all',1e12)", 'g')}${btn('All to 0', "coins('all','zero')", 'r')}</div>
        ${s.worlds.map((g, w) => `<div class="sep"></div><div class="row"><span class="lbl">${worldName(w)} <i>💰 ${fmt(g.coins)}${g.u ? '' : ' · locked'}</i></span>
          ${btn('+1K', `coins(${w},1e3)`, 's')}${btn('+1M', `coins(${w},1e6)`, 's')}${btn('+1B', `coins(${w},1e9)`, 's')}${btn('×10', `coins(${w},'x10')`, 's')}${btn('0', `coins(${w},'zero')`, 'r')}
          <input type="number" id="cset${w}" min="0" placeholder="exact">${btn('Set', `coins(${w},'set')`)}</div>`).join('')}`)}
      ${sec('worlds', '🌍 Worlds, pens, workers, buildings', s.worlds.map((g, w) => `<div class="row"><span class="lbl">${worldName(w)} <i>${g.u ? 'open' : 'locked'} · ${g.lanes.filter(l => l.u).length}/6 pens · ${g.b.filter(Boolean).length}/6 built</i></span>
          ${w ? (g.u ? btn('Lock world', `worldOpen(${w},false)`, 'r') : btn('Open world', `worldOpen(${w},true)`, 'g')) : ''}
          ${btn('Open all pens', `pens(${w},true)`, 'g')}${btn('Lock pens', `pens(${w},false)`, 'r')}${btn('Fill pens', `animals(${w})`, 's')}
          ${btn('Build all', `builds(${w},true)`, 'g')}${btn('Remove buildings', `builds(${w},false)`, 'r')}
          <input type="number" id="wl${w}" min="0" max="${A.MAXLVL}" value="${Math.max(...g.lanes.map(l => l.col))}" style="width:70px">${btn('Set workers', `workers(${w})`, 's')}
          ${btn('Go there ➜', `go(${w})`)}</div><div class="sep"></div>`).join('')
          + '<div class="note">Locking a world also undoes what opens it (the last pen of the world before, or its wonder).</div>')}
      ${sec('wonders', '🏛️ Wonders', A.WONDERS.map(x => `<div class="row"><span class="lbl">${x.e} ${esc(x.n)} <i>${s.wonders[x.id] ? 'built' : 'not built'}</i></span>
          ${s.wonders[x.id] ? btn('Remove', `wonder('${x.id}',false)`, 'r') : btn('Build', `wonder('${x.id}',true)`, 'g')}</div>`).join(''))}
      ${sec('story', '📖 Story', `<div class="note">Now on step ${Math.min(s.story.q, A.QUESTS.length) + 1} of ${A.QUESTS.length}${s.story.finale ? ' · finished' : ''}</div>
        <div class="row"><select id="qsel">${qOpts}</select>${btn('Jump here', "story('jump')")}</div>
        <div class="row">${btn('Finish whole story', "story('all')", 'g')}${btn('Play the ending', "story('finale')", 's')}${btn('Start over (intro)', "story('reset')", 'r')}</div>`)}
      ${sec('city', '🚗 City: garage, food, rescues', `<div class="row">${btn('Own all rides', 'rides(true)', 'g')}${btn('Remove rides', 'rides(false)', 'r')}</div>
        <div class="row">${btn('Open all restaurants', 'food(true)', 'g')}${btn('Close all', 'food(false)', 'r')}${btn('Fill tips', 'tips()', 's')}</div>
        <div class="row">${btn('🚨 Rescue now', 'rescue()', 's')}${btn('🍦 Visitor now', 'visitor()', 's')}</div>`)}
      ${sec('ach', `⭐ Stars & achievements <i style="font-style:normal;color:#6b7090">(${A.starCount()} ⭐)</i>`, `<div class="row">${btn('Unlock all', 'ach(true)', 'g')}${btn('Clear all', 'ach(false)', 'r')}</div>
        <div class="note">Stars come from achievements plus finished story steps.</div>`)}
      ${sec('time', '☀️ Time, weather, speed', `<div class="row"><span class="lbl">Time of day</span>${pick(A.FORCE.phase ?? 'auto', 'auto', 'Auto', "time('auto')")}${pick(A.FORCE.phase, 0.25, '☀️ Day', 'time(0.25)')}${pick(A.FORCE.phase, 0.64, '🌇 Dusk', 'time(0.64)')}${pick(A.FORCE.phase, 0.8, '🌙 Night', 'time(0.8)')}</div>
        <div class="row"><span class="lbl">Weather</span>${['auto', 'sun', 'rain', 'rainbow', 'snow'].map(v => pick(A.FORCE.weather || 'auto', v, { auto: 'Auto', sun: '☀️ Sun', rain: '🌧️ Rain', rainbow: '🌈 Rainbow', snow: '❄️ Snow' }[v], `weather('${v}')`)).join('')}</div>
        <div class="row"><span class="lbl">Game speed</span>${[1, 2, 5, 10].map(v => pick(A.FORCE.speed, v, '×' + v, `speed(${v})`)).join('')}</div>
        <div class="row"><span class="lbl">Pretend I was away</span>${btn('10 min', 'away(10)', 's')}${btn('1 hour', 'away(60)', 's')}${btn('8 hours', 'away(480)', 's')}</div>`)}
      ${sec('parent', '👨‍👩‍👧 Grown-ups area', `<div class="row">${btn('Open grown-ups area', 'grownups()', 's')}${btn('Remove PIN', 'pin()', 'r')}</div>
        <div class="note">Test the timer and break tasks here (they only affect the test game). If you get locked, use Remove PIN.</div>`)}
      ${sec('save', '💾 Test game', `<div class="row"><span class="lbl">Start from</span>${btn('Brand-new player', "preset('new')", 's')}${btn('Middle of the game', "preset('mid')", 's')}${btn('Everything unlocked', "preset('all')", 'g')}</div>
        <div class="sep"></div><div class="row"><span class="lbl">Copy a real player's game (read-only)</span><input type="text" id="rcode" placeholder="TIGER-ABCD-1234" style="flex:1">${btn('Copy', 'copyReal()')}</div>
        <div class="note">Makes a copy here to test with. The real game is never changed.</div>
        <div class="sep"></div><textarea id="io" placeholder="Save text"></textarea><div class="row">${btn('Export', 'exportSave()', 's')}${btn('Import', 'importSave()', 's')}</div>`)}`;
      P.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => { if (d.open) openSecs.add(d.dataset.s); else openSecs.delete(d.dataset.s); }));
    }
    P.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { P.classList.remove('open'); return; }
      const m = a.match(/^(\w+)\((.*)\)$/);
      const args = m[2] ? m[2].split(',').map(x => { x = x.trim(); return /^'.*'$/.test(x) ? x.slice(1, -1) : x === 'true' ? true : x === 'false' ? false : Number(x); }) : [];
      act[m[1]](...args);
    });
    // live coin numbers while the panel is open
    setInterval(() => { if (P.classList.contains('open') && !P.contains(document.activeElement)) { const y = P.scrollTop; render(); P.scrollTop = y; } }, 2000);
  }
})();
