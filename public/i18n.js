// Shared language handling for both pages. Swedish is the default; a visitor's
// pick (the SV | EN switch, or a ?lang= link) is remembered in localStorage.
const LANGS = ["sv", "en"];

function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(q)) {
    try { localStorage.setItem("lang", q); } catch {}
    return q;
  }
  try {
    const saved = localStorage.getItem("lang");
    if (LANGS.includes(saved)) return saved;
  } catch {}
  return "sv";
}

const LANG = pickLang();
document.documentElement.lang = LANG;

// A project field in the current language: `pitch_sv` when Swedish, else `pitch`.
const loc = (p, field) => (LANG === "sv" && p[`${field}_sv`]) || p[field];

// Fill static text from the page's string table: [data-i18n] elements get innerHTML,
// and `title` / `description` update the document head. Also marks the active switch link.
function applyStrings(strings) {
  const t = strings[LANG];
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.innerHTML = t[el.dataset.i18n]; });
  if (t.title) document.title = t.title;
  if (t.description) {
    document.querySelectorAll('meta[name="description"], meta[property="og:description"]')
      .forEach((m) => m.setAttribute("content", t.description));
  }
  document.querySelectorAll(".lang-switch a").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.lang === LANG);
  });
  return t;
}
