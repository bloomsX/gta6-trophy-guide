// Vice Legend — GTA VI trophy guide & tracker.
// Plain ES module, no dependencies, no network at run time beyond this app's
// own files (data/trophies.json, data/roadmap.json). Progress lives in
// localStorage and can be exported to a file and imported back.

const EARNED_KEY = 'vice-legend-earned-v1';
const SPOILER_KEY = 'vice-legend-spoiler-v1';

const KIND_LABELS = {
  all: 'All kinds',
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectibles',
  activity: 'Activities',
  side: 'Side quests',
  world: 'Open world',
  online: 'Online',
};

const SOURCES = [
  { name: 'Exophase', url: null, what: 'The official trophy list as PlayStation publishes it: all 55 names, descriptions, grades and hidden flags.' },
  { name: 'PSNProfiles', url: null, what: 'The per-trophy counts PlayStation tracks (42 shooting-range golds, 250 stunts, 18 meditations and the rest).' },
  { name: 'Push Square', url: null, what: 'First report of the public PS5 list (18 November 2026), citing Exophase: 55 trophies including a Platinum, no online trophies.' },
  { name: 'GTABase', url: 'https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series', what: 'The main method source: the roadmap, the 100% checklist numbers, and how to unlock each trophy.' },
  { name: 'PowerPyx', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/', what: 'Difficulty 4/10, about 200 hours to the platinum, the Chapter 1 missable flag, and the three-step roadmap.' },
  { name: 'GTA Zone', url: 'https://gta-zone.com/news/gta-6-trophies-achievements/', what: 'Cross-check on the full list, the 18 meditation spots in 10 locations, and the five unconfirmed trophies.' },
  { name: 'KeenGamer', url: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/', what: 'Cross-check on the roadmap and the 55-trophy list.' },
  { name: 'OutputLag', url: 'https://outputlag.com/guides/gta-6-trophy-list/', what: 'Cross-check naming the five trophies with no confirmed method yet.' },
];

const doc = await (await fetch('data/trophies.json')).json();
const roadmap = await (await fetch('data/roadmap.json')).json();
const trophies = [...doc.trophies].sort((a, b) => a.id - b.id);
const byId = new Map(trophies.map((t) => [t.id, t]));

// ---- state ---------------------------------------------------------------
const params = new URLSearchParams(location.search);
let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
earned = new Set([...earned].filter((id) => byId.has(id)));
let spoiler = params.get('spoiler') === 'off' ? false : params.get('spoiler') === 'on' ? true : (localStorage.getItem(SPOILER_KEY) ?? 'true') === 'true';
let kindFilter = params.get('filter') && KIND_LABELS[params.get('filter')] ? params.get('filter') : 'all';
let gradeFilter = 'all';
let earnedFilter = 'all';
let query = '';
let selectedId = Number(params.get('trophy')) || null;
if (selectedId && !byId.has(selectedId)) selectedId = null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detailPanel');

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}
function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoiler ? 'true' : 'false');
}

function isMasked(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}
function shownName(t) {
  return isMasked(t) ? 'Hidden story trophy' : t.name;
}
function shownDesc(t) {
  return isMasked(t) ? 'Finish the story to reveal this trophy.' : t.description;
}
function matchesKind(t) {
  if (kindFilter === 'all') return true;
  if (kindFilter === 'missable') return t.missable === true;
  if (kindFilter === 'online') return false;
  return t.kind === kindFilter;
}
function visibleTrophies() {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (earnedFilter === 'earned' && !earned.has(t.id)) return false;
    if (earnedFilter === 'remaining' && earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---- progress ------------------------------------------------------------
function renderProgress() {
  const total = trophies.length;
  const n = earned.size;
  const pct = ((n / total) * 100).toFixed(1);
  $('progressText').textContent = `${n} / ${total} earned`;
  $('progressPct').textContent = `${pct}% to platinum — ${total - n} to go`;
  $('progressFill').style.width = `${(n / total) * 100}%`;
  $('progressBar').setAttribute('aria-valuenow', String(n));
  const counts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => {
      const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
      const all = trophies.filter((t) => t.grade === g).length;
      return `<b>${got}/${all}</b> ${g}`;
    })
    .join(' · ');
  $('gradeCounts').innerHTML = counts;
}

// ---- kind chips ----------------------------------------------------------
function renderChips() {
  const chips = $('kindChips');
  chips.replaceChildren();
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const count = key === 'all' ? trophies.length
      : key === 'missable' ? trophies.filter((t) => t.missable).length
      : key === 'online' ? 0
      : trophies.filter((t) => t.kind === key).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (kindFilter === key ? ' active' : '');
    btn.textContent = `${label} `;
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = `(${count})`;
    btn.append(n);
    btn.addEventListener('click', () => { kindFilter = key; render(); });
    chips.append(btn);
  }
}

// ---- trophy list ---------------------------------------------------------
function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  $('emptyState').hidden = true;
  if (kindFilter === 'online') {
    $('emptyState').hidden = false;
    $('emptyState').textContent = 'No online trophies — all 55 are single-player. PowerPyx and GTABase both confirm the list has zero online trophies, and GTA VI launches with no online mode.';
  } else if (shown.length === 0) {
    $('emptyState').hidden = false;
    $('emptyState').textContent = 'No trophies match these filters. Clear the search or pick another kind.';
  }
  for (const t of shown) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `trophy-item grade-${t.grade}` + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    btn.setAttribute('aria-pressed', String(selectedId === t.id));

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveEarned();
      render();
    });

    const mid = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'trophy-name';
    const dot = document.createElement('span');
    dot.className = 'grade-dot';
    name.append(dot, document.createTextNode(shownName(t)));
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.style.display = 'block';
    desc.textContent = shownDesc(t);
    mid.append(name, desc);

    const tags = document.createElement('span');
    tags.className = 'tags';
    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'tag missable';
      tag.textContent = 'Possibly missable';
      tags.append(tag);
    }
    if (t.hidden) {
      const tag = document.createElement('span');
      tag.className = 'tag hidden-tag';
      tag.textContent = 'Hidden';
      tags.append(tag);
    }
    const kindTag = document.createElement('span');
    kindTag.className = 'tag kind';
    kindTag.textContent = KIND_LABELS[t.kind] ?? t.kind;
    tags.append(kindTag);
    if (t.count != null) {
      const tag = document.createElement('span');
      tag.className = 'tag count';
      tag.textContent = `Target ${t.count.toLocaleString('en-US')}`;
      tags.append(tag);
    }
    mid.append(tags);

    const pill = document.createElement('span');
    pill.className = `grade-pill ${t.grade}`;
    pill.textContent = t.grade;

    btn.append(box, mid, pill);
    btn.addEventListener('click', () => { selectedId = t.id; render(); });
    li.append(btn);
    listEl.append(li);
  }
  $('resultLine').textContent = kindFilter === 'online'
    ? 'Showing 0 of 55 — this game has no online trophies.'
    : `Showing ${shown.length} of ${trophies.length} trophies · ${earned.size} earned`;
}

// ---- detail panel --------------------------------------------------------
function sourceList(sources) {
  const wrap = document.createElement('div');
  wrap.className = 'sources';
  const h = document.createElement('h3');
  h.textContent = 'Sources for this guide';
  wrap.append(h);
  const p = document.createElement('p');
  p.className = 'source-line';
  sources.forEach((s, i) => {
    if (i > 0) p.append(document.createTextNode(' · '));
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      p.append(a);
    } else {
      const span = document.createElement('span');
      span.className = 'no-link';
      span.textContent = s.name;
      p.append(span);
    }
  });
  wrap.append(p);
  return wrap;
}

function renderDetail() {
  detailEl.replaceChildren();
  const t = selectedId ? byId.get(selectedId) : null;
  if (!t) {
    const div = document.createElement('div');
    div.className = 'detail-empty';
    const h = document.createElement('h2');
    h.textContent = 'Pick a trophy to read its guide';
    const p = document.createElement('p');
    p.textContent = 'Select any trophy on the left. Its guide names the sources behind every step — and where no source has confirmed a step yet, it says so instead of guessing.';
    div.append(h, p);
    detailEl.append(div);
    return;
  }
  const h = document.createElement('h2');
  h.textContent = shownName(t);
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = shownDesc(t);
  detailEl.append(h, desc);

  const meta = document.createElement('p');
  meta.className = 'grade-counts';
  meta.innerHTML = `<b>${t.grade}</b> · ${t.hidden ? 'hidden on PlayStation until earned' : 'visible from the start'}` +
    (t.count != null ? ` · target <b>${t.count.toLocaleString('en-US')}</b>` : '') +
    ` · roadmap stage <b>${t.stage}</b>`;
  detailEl.append(meta);

  if (t.missable) {
    const box = document.createElement('p');
    box.className = 'missable-box';
    box.innerHTML = '<b>Possibly missable.</b> This is the only trophy any guide flags as missable — see the guide below and keep a manual save from Chapter 1.';
    detailEl.append(box);
  }

  if (isMasked(t)) {
    const p = document.createElement('p');
    p.className = 'guide';
    p.textContent = 'Spoiler hidden. Earn this trophy, or turn “Hide story spoilers” off, to read its guide.';
    detailEl.append(p);
  } else {
    const guide = document.createElement('p');
    guide.className = 'guide';
    const strong = document.createElement('b');
    strong.textContent = 'How to get it: ';
    guide.append(strong, document.createTextNode(t.guide));
    detailEl.append(guide);
    detailEl.append(sourceList(t.sources));
  }

  const note = document.createElement('div');
  note.className = 'roadmap-note';
  const nh = document.createElement('h3');
  nh.textContent = 'Where it sits on the roadmap';
  const np = document.createElement('p');
  const stage = roadmap.stages.find((s) => s.n === t.stage);
  np.textContent = stage ? `Stage ${stage.n}: ${stage.title} (${stage.hours}).` : '';
  note.append(nh, np);
  detailEl.append(note);

  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.className = 'earn-btn' + (earned.has(t.id) ? ' earned' : '');
  earnBtn.textContent = earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  earnBtn.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveEarned();
    render();
  });
  detailEl.append(earnBtn);
}

// ---- roadmap tab ---------------------------------------------------------
function renderRoadmap() {
  const body = $('roadmapBody');
  body.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'roadmap-intro';
  intro.innerHTML = `Difficulty <b>${roadmap.difficulty}</b> · Time <b>${roadmap.time}</b> · Playthroughs <b>${roadmap.playthroughs}</b> · Online trophies <b>${roadmap.online}</b>`;
  body.append(intro);

  for (const stage of roadmap.stages) {
    const sec = document.createElement('section');
    sec.className = 'stage';
    const h = document.createElement('h2');
    const no = document.createElement('span');
    no.className = 'step-no';
    no.textContent = `Step ${stage.n}`;
    h.append(no, document.createTextNode(stage.title));
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    const ol = document.createElement('ol');
    for (const step of stage.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.append(li);
    }
    sec.append(h, hours, ol);
    if (stage.n === 2) {
      const h3 = document.createElement('h3');
      h3.textContent = 'The 100% checklist (Progress > Stats > 100% Completion)';
      h3.style.margin = '14px 0 4px';
      const table = document.createElement('table');
      table.className = 'checklist-table';
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      for (const label of ['What counts', 'Needed', 'Note']) {
        const th = document.createElement('th');
        th.textContent = label;
        tr.append(th);
      }
      thead.append(tr);
      const tbody = document.createElement('tbody');
      for (const row of roadmap.checklist100) {
        const r = document.createElement('tr');
        const a = document.createElement('td');
        a.textContent = row.item;
        const b = document.createElement('td');
        b.className = 'need';
        b.textContent = row.need;
        const c = document.createElement('td');
        c.textContent = row.note;
        r.append(a, b, c);
        tbody.append(r);
      }
      table.append(thead, tbody);
      sec.append(h3, table);
      const src = document.createElement('p');
      src.className = 'grade-counts';
      src.textContent = 'Checklist numbers: GTABase, confirmed by PowerPyx.';
      sec.append(src);
    }
    body.append(sec);
  }

  const warn = document.createElement('section');
  warn.className = 'warnings';
  const wh = document.createElement('h2');
  wh.textContent = 'Watch out';
  const ul = document.createElement('ul');
  for (const w of roadmap.warnings) {
    const li = document.createElement('li');
    li.textContent = w;
    ul.append(li);
  }
  warn.append(wh, ul);
  body.append(warn);
}

// ---- sources tab ---------------------------------------------------------
function renderSources() {
  const body = $('sourcesBody');
  body.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'source-list';
  for (const s of SOURCES) {
    const card = document.createElement('div');
    card.className = 'source-card';
    const h = document.createElement('h3');
    h.textContent = s.name;
    const p = document.createElement('p');
    p.textContent = s.what;
    card.append(h, p);
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.url;
      card.append(a);
    }
    grid.append(card);
  }
  body.append(grid);
  const honesty = document.createElement('div');
  honesty.className = 'honesty';
  const h = document.createElement('h2');
  h.textContent = 'How this guide stays honest';
  const p1 = document.createElement('p');
  p1.textContent = 'Grand Theft Auto VI launched on 19 November 2026, and its trophy list only went public the day before. Every guide on this page is written in our own words from the sources above — never copied from another guide. Where the official description plus the cited guides don’t pin down a step, the guide says what is known and marks the rest unconfirmed, instead of inventing a location, a mission name or a method.';
  const p2 = document.createElement('p');
  p2.textContent = 'Five trophies are marked unconfirmed in this guide: In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There and Ten Pin. As players confirm them, the guides will be updated with a named source.';
  honesty.append(h, p1, p2);
  body.append(honesty);
}

// ---- tabs ----------------------------------------------------------------
function showTab(name) {
  for (const btn of document.querySelectorAll('.tab')) {
    const active = btn.dataset.tab === name;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  }
  $('tab-tracker').hidden = name !== 'tracker';
  $('tab-roadmap').hidden = name !== 'roadmap';
  $('tab-sources').hidden = name !== 'sources';
}
for (const btn of document.querySelectorAll('.tab')) {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
}

// ---- controls ------------------------------------------------------------
$('search').addEventListener('input', (e) => { query = e.target.value; renderList(); });
$('gradeFilter').addEventListener('change', (e) => { gradeFilter = e.target.value; renderList(); });
$('earnedFilter').addEventListener('change', (e) => { earnedFilter = e.target.value; renderList(); });
$('spoilerToggle').checked = spoiler;
$('spoilerToggle').addEventListener('change', (e) => {
  spoiler = e.target.checked;
  saveSpoiler();
  render();
});

$('exportBtn').addEventListener('click', () => {
  const payload = { app: 'vice-legend', version: 1, game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b), savedAt: new Date().toISOString() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'vice-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    const next = new Set(ids.filter((id) => byId.has(id)));
    earned = next;
    saveEarned();
    render();
  } catch {
    alert('That file is not a Vice Legend progress export.');
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveEarned();
    render();
  }
});

// ---- render all ----------------------------------------------------------
function render() {
  renderProgress();
  renderChips();
  renderList();
  renderDetail();
}
renderRoadmap();
renderSources();
render();
if (params.get('tab') === 'roadmap' || params.get('tab') === 'sources') showTab(params.get('tab'));
