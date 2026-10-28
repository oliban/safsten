// Portfolio view of every non-game project in projects.json, grouped by category.
const STRINGS = {
  sv: {
    title: "Projekt — Fredrik Säfsten",
    description: "Appar, verktyg och experiment byggda av Fredrik Säfsten.",
    heading: "Andra projekt",
    lede: "Appar, verktyg och experiment jag har byggt utanför arkaden. Alla byggda med AI.",
    loading: "Laddar…",
    loadError: "Kunde inte ladda projekten.",
    backToArcade: "Letar du efter spelen? Tillbaka till arkaden",
    groups: { apps: "Appar & verktyg", calculators: "Poängräknare", misc: "Övrigt" },
  },
  en: {
    title: "Projects — Fredrik Säfsten",
    description: "Apps, tools and experiments built by Fredrik Säfsten.",
    heading: "Other projects",
    lede: "Apps, tools and experiments I've built outside the arcade. All of them built with AI.",
    loading: "Loading…",
    loadError: "Couldn't load the projects.",
    backToArcade: "Looking for the games? Back to the arcade",
    groups: { apps: "Apps & Tools", calculators: "Calculators", misc: "Misc" },
  },
};
const T = applyStrings(STRINGS);

const GROUPS = ["apps", "calculators", "misc"].map((key) => ({ key, label: T.groups[key] }));

const hostOf = (url) => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } };

function rowHTML(p) {
  return `
    <li>
      <a class="row" href="${p.url}" target="_blank" rel="noopener">
        <div class="thumb">
          <img src="${p.screenshot}" alt="" loading="lazy" onerror="this.remove()" />
        </div>
        <div class="text">
          <h3>${p.title}</h3>
          <p>${loc(p, "pitch")}</p>
          <span class="host">${hostOf(p.url)} ↗</span>
        </div>
      </a>
    </li>`;
}

async function main() {
  const list = document.getElementById("list");
  let projects;
  try {
    projects = await fetch("projects.json").then((r) => r.json());
  } catch {
    list.innerHTML = `<p class="muted">${T.loadError}</p>`;
    return;
  }
  list.innerHTML = GROUPS.map((g) => {
    const items = projects.filter((p) => p.category === g.key);
    if (!items.length) return "";
    return `
      <section class="group">
        <h2>${g.label}</h2>
        <ul>${items.map(rowHTML).join("")}</ul>
      </section>`;
  }).join("");
}

main();
