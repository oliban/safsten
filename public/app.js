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

const SECTIONS = [
  { key: "games", label: "Games", emoji: "🕹️", accent: "var(--games)" },
  { key: "calculators", label: "Calculators", emoji: "🧮", accent: "var(--calc)" },
  { key: "apps", label: "Apps & Tools", emoji: "🛠️", accent: "var(--apps)" },
  { key: "misc", label: "Misc & Mischief", emoji: "🎭", accent: "var(--misc)" },
];
const SECMAP = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

const STATE_META = {
  live: { cls: "is-live", label: "online" },
  sleep: { cls: "is-sleep", label: "asleep · insert coin" },
  unknown: { cls: "", label: "ready" },
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

const badge = (state) => `<span class="status-badge"><span class="dot"></span>${STATE_META[state].label}</span>`;

/* ---------- Featured cabinet ---------- */
let projects = [];
let statusMap = {};
let featuredId = null;

function renderHero(p) {
  const hero = document.getElementById("hero");
  const sec = SECMAP[p.category];
  const state = liveness(p, statusMap);
  const letter = (p.title[0] || "?").toUpperCase();
  hero.innerHTML = `
    <div class="cab ${STATE_META[state].cls}" style="--accent:${sec.accent}">
      <div class="cab-top">
        <span class="now">now playing</span>
        <button class="shuffle" id="shuffle" type="button">🎲 shuffle cabinet</button>
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
          <p class="feat-pitch">${p.pitch}</p>
          <div class="feat-foot">
            <a class="coin-btn" id="hero-coin" href="${p.url}" target="_blank" rel="noopener" role="button">
              <span class="slot"><span class="coin"></span></span> insert coin
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
  const sec = SECMAP[p.category];
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
        <p class="card-pitch">${p.pitch}</p>
        <div class="coinrow">
          <span class="card-host">${hostOf(p.url)}</span>
          <span class="coin-cta"><span class="slot"><span class="coin"></span></span>insert coin<span class="arrow">▸</span></span>
        </div>
      </div>
    </a>`;
}

function renderSections() {
  const app = document.getElementById("app");
  let i = 0;
  app.innerHTML = SECTIONS.map((sec) => {
    const items = projects.filter((p) => p.category === sec.key);
    if (!items.length) return "";
    const cards = items.map((p) => cardHTML(p, i++)).join("");
    return `
      <section class="section">
        <div class="section-head">
          <span class="section-tag" style="--accent:${sec.accent}">${sec.emoji} ${sec.label}</span>
          <span class="section-count">${items.length} ${items.length === 1 ? "cabinet" : "cabinets"}</span>
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
      fetch("projects.json").then((r) => r.json()),
      fetch("api/status").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]);
  } catch {
    document.getElementById("app").innerHTML = `<p class="loading">Couldn't load the arcade.</p>`;
    return;
  }

  const liveN = projects.filter((p) => liveness(p, statusMap) === "live").length;
  document.getElementById("live-count").textContent = `● ${liveN} online`;
  document.getElementById("total-count").textContent = `${projects.length} cabinets`;

  featuredId = projects[Math.floor(Math.random() * projects.length)].id;
  renderHero(projects.find((p) => p.id === featuredId));
  renderSections();
}

main();
