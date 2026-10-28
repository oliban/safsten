// Pellets along the top edge; each is "eaten" exactly when Pac-Man reaches it.
// Pac covers the top edge over the first TOP_FRAC of its LAP-second lap (see CSS
// pac-loop). A pellet at horizontal fraction x is reached at lap phase x*TOP_FRAC,
// so its eat animation (phase 0 = eaten) is delayed by that much. Using a POSITIVE
// delay (equivalent to the negative one mod LAP, since the animation is periodic)
// keeps the pellet visible during the first lap and animates reliably everywhere.
function makePellets() {
  const wrap = document.querySelector(".pellets");
  if (!wrap) return;
  const N = 18, LAP = 24, TOP_FRAC = 0.39;
  let html = "";
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N;
    const delay = x * TOP_FRAC * LAP;
    html += `<span class="pellet" style="left:${(x * 100).toFixed(2)}%;animation:eat ${LAP}s linear ${delay.toFixed(2)}s infinite"></span>`;
  }
  wrap.innerHTML = html;
}

const STRINGS = {
  sv: {
    description: "Alla spel Fredrik Säfsten har byggt. Stoppa i ett mynt.",
    tag: "Alla spel jag har byggt — under samma neonskylt. Stoppa i ett mynt och spela.",
    loading: "värmer upp spelautomaten…",
    loadError: "Kunde inte ladda arkaden.",
    more: "Inte så mycket för spel? Kolla in mina andra projekt ▸",
    quote: "”Detta är ett slags CV över projekt jag lekt ihop med AI” <cite>— Fredrik Säfsten</cite>",
    nowPlaying: "spelas nu",
    shuffle: "🎲 slumpa automat",
    insertCoin: "stoppa i mynt",
    live: "online",
    sleep: "sover · stoppa i mynt",
    ready: "redo",
    online: (n) => `● ${n} online`,
    cabinets: (n) => `${n} ${n === 1 ? "automat" : "automater"}`,
    shelves: { solo: "Snabba enspelarspel", friends: "Spela med kompisar", gamenight: "För spelkvällar", education: "Utbildning" },
  },
  en: {
    description: "Every game Fredrik Säfsten has shipped. Insert coin.",
    tag: "Every game I've shipped — under one neon sign. Drop a coin and play.",
    loading: "warming up the cabinet…",
    loadError: "Couldn't load the arcade.",
    more: "Not a gamer? See my other projects ▸",
    quote: "“This is actually my resume of sorts of play projects I made with AI” <cite>— Fredrik Säfsten</cite>",
    nowPlaying: "now playing",
    shuffle: "🎲 shuffle cabinet",
    insertCoin: "insert coin",
    live: "online",
    sleep: "asleep · insert coin",
    ready: "ready",
    online: (n) => `● ${n} online`,
    cabinets: (n) => `${n} ${n === 1 ? "cabinet" : "cabinets"}`,
    shelves: { solo: "Quick solo games", friends: "Play with friends", gamenight: "For game nights", education: "Education" },
  },
};
const T = applyStrings(STRINGS);

// The arcade only shows games; each game's `shelf` in projects.json picks its section.
// Everything else lives on the portfolio page (projects.html).
const SECTIONS = [
  { key: "solo", emoji: "🕹️", accent: "var(--games)" },
  { key: "friends", emoji: "👥", accent: "var(--apps)" },
  { key: "gamenight", emoji: "🧭", accent: "var(--misc)" },
  { key: "education", emoji: "🧮", accent: "var(--calc)" },
].map((s) => ({ ...s, label: T.shelves[s.key] }));
const SECMAP = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

const STATE_META = {
  live: { cls: "is-live", label: T.live },
  sleep: { cls: "is-sleep", label: T.sleep },
  unknown: { cls: "", label: T.ready },
};

const hostOf = (url) => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } };

// GitHub-Pages projects (flyApp null) are always live; "deployed" -> live;
// any other known state -> asleep (wakes on coin); no data -> unknown.
function liveness(p, statusMap) {
  if (!p.flyApp) return "live";
  const s = statusMap[p.flyApp];
  if (s === undefined) return "unknown";
  return s === "deployed" ? "live" : "sleep";
}

// Insert-coin interaction: spin a coin into the slot, THEN open the project in a
// new tab. The open is deferred to the end of the animation; it stays within the
// browser's ~5s transient-activation window after the click, so pop-up blockers
// allow it. Falls back to same-tab navigation if a window can't be opened.
function insertCoin(el, url) {
  if (el.classList.contains("inserting")) return;
  el.classList.add("inserting");
  setTimeout(() => {
    let w = null;
    try { w = window.open(url, "_blank"); } catch { w = null; }
    if (w) w.opener = null;
    else location.href = url;
    el.classList.remove("inserting");
  }, 560);
}

function onCoinClick(el, url) {
  return (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let browser open natively
    e.preventDefault();
    insertCoin(el, url);
  };
}

const tagsHTML = (p) => {
  const tags = loc(p, "tags");
  return tags?.length ? `<ul class="tags">${tags.map((t) => `<li>${t}</li>`).join("")}</ul>` : "";
};

const badge = (state) => `<span class="status-badge"><span class="dot"></span>${STATE_META[state].label}</span>`;

/* ---------- Featured cabinet ---------- */
let projects = [];
let statusMap = {};
let featuredId = null;

function renderHero(p) {
  const hero = document.getElementById("hero");
  const sec = SECMAP[p.shelf];
  const state = liveness(p, statusMap);
  const letter = (p.title[0] || "?").toUpperCase();
  hero.innerHTML = `
    <div class="cab ${STATE_META[state].cls}" style="--accent:${sec.accent}">
      <div class="cab-top">
        <span class="now">${T.nowPlaying}</span>
        <button class="shuffle" id="shuffle" type="button">${T.shuffle}</button>
      </div>
      <div class="cab-body">
        <div class="cab-screen" data-letter="${letter}">
          ${badge(state)}
          <img src="${p.screenshot}" alt="${p.title}"
               onerror="this.remove(); this.closest('.cab-screen').classList.add('is-empty')" />
        </div>
        <div class="cab-info">
          <span class="cat-chip">${sec.emoji} ${sec.label}</span>
          <h2 class="feat-title">${p.title}</h2>
          <p class="feat-pitch">${loc(p, "pitch")}</p>
          ${tagsHTML(p)}
          <div class="feat-foot">
            <a class="coin-btn" id="hero-coin" href="${p.url}" target="_blank" rel="noopener" role="button">
              <span class="slot"><span class="coin"></span></span> ${T.insertCoin}
            </a>
            <span class="feat-host">${hostOf(p.url)}</span>
          </div>
        </div>
      </div>
    </div>`;

  const cab = hero.querySelector(".cab");
  hero.querySelector("#hero-coin").addEventListener("click", onCoinClick(cab, p.url));
  hero.querySelector("#shuffle").addEventListener("click", () => {
    const pool = projects.filter((x) => x.id !== featuredId);
    const next = pool[Math.floor(Math.random() * pool.length)];
    featuredId = next.id;
    renderHero(next);
  });
}

/* ---------- Card grid ---------- */
function cardHTML(p, index) {
  const sec = SECMAP[p.shelf];
  const state = liveness(p, statusMap);
  const letter = (p.title[0] || "?").toUpperCase();
  return `
    <a class="card ${STATE_META[state].cls}" href="${p.url}" target="_blank" rel="noopener"
       data-url="${p.url}" tabindex="0" style="--accent:${sec.accent}; --d:${index * 55}ms">
      <div class="card-shot" data-letter="${letter}">
        <span class="card-status status-badge"><span class="dot"></span>${STATE_META[state].label}</span>
        <img src="${p.screenshot}" alt="${p.title}" loading="lazy"
             onerror="this.remove(); this.closest('.card-shot').classList.add('is-empty')" />
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-pitch">${loc(p, "pitch")}</p>
        ${tagsHTML(p)}
        <div class="coinrow">
          <span class="card-host">${hostOf(p.url)}</span>
          <span class="coin-cta"><span class="slot"><span class="coin"></span></span>${T.insertCoin}<span class="arrow">▸</span></span>
        </div>
      </div>
    </a>`;
}

function renderSections() {
  const app = document.getElementById("app");
  let i = 0;
  app.innerHTML = SECTIONS.map((sec) => {
    const items = projects.filter((p) => p.shelf === sec.key);
    if (!items.length) return "";
    const cards = items.map((p) => cardHTML(p, i++)).join("");
    return `
      <section class="section">
        <div class="section-head">
          <span class="section-tag" style="--accent:${sec.accent}">${sec.emoji} ${sec.label}</span>
          <span class="section-count">${T.cabinets(items.length)}</span>
        </div>
        <div class="grid">${cards}</div>
      </section>`;
  }).join("");

  app.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", onCoinClick(card, card.dataset.url));
  });
}

async function main() {
  makePellets();
  try {
    [projects, statusMap] = await Promise.all([
      fetch("projects.json").then((r) => r.json())
        .then((all) => all.filter((p) => p.category === "games" && SECMAP[p.shelf])),
      fetch("api/status").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]);
  } catch {
    document.getElementById("app").innerHTML = `<p class="loading">${T.loadError}</p>`;
    return;
  }

  const liveN = projects.filter((p) => liveness(p, statusMap) === "live").length;
  // Every game sleeps until someone visits, so "0 online" would make the arcade look
  // switched off; hide the chip instead.
  const liveChip = document.getElementById("live-count");
  if (liveN) liveChip.textContent = T.online(liveN);
  else liveChip.hidden = true;
  document.getElementById("total-count").textContent = T.cabinets(projects.length);

  featuredId = projects[Math.floor(Math.random() * projects.length)].id;
  renderHero(projects.find((p) => p.id === featuredId));
  renderSections();
}

main();
