const STRINGS = {
  en: {
    nav_home: "Home", nav_product: "Product", nav_cases: "Case Studies", nav_contact: "Contact",
    login: "Sign in", get_started: "Get Started",
    hero_line1: "See the risk", hero_line2: "Before it hits cash",
    hero_sub: "Project-risk briefings for UAE subcontractors and suppliers.<br />Upload PDFs, forward email, get Act / Watch before margin slips.",
    trust: "Built for UAE construction SMEs",
    stat_briefing: "Risk briefing", stat_gate: "Act evidence gate", stat_watch: "Email is the briefing SLA", stat_uae: "UAE first",
  },
  ar: {
    nav_home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", nav_product: "\u0627\u0644\u0645\u0646\u062a\u062c", nav_cases: "\u062d\u0627\u0644\u0627\u062a", nav_contact: "\u062a\u0648\u0627\u0635\u0644",
    login: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", get_started: "\u0627\u0628\u062f\u0623",
    hero_line1: "\u0634\u0627\u0647\u062f \u0627\u0644\u0645\u062e\u0627\u0637\u0631", hero_line2: "\u0642\u0628\u0644 \u0623\u0646 \u064a\u0645\u0633 \u0627\u0644\u0646\u0642\u062f",
    hero_sub: "\u0625\u062d\u0627\u0637\u0627\u062a \u0645\u062e\u0627\u0637\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0644\u0645\u0642\u0627\u0648\u0644\u064a \u0627\u0644\u0628\u0646\u0627\u0621 \u0641\u064a \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a.<br />\u0627\u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0623\u0648 \u062d\u0648\u0651\u0644 \u0627\u0644\u0628\u0631\u064a\u062f، \u0648احصل على Act / Watch قبل أن يتأثر الهامش.",
    trust: "\u0645\u0628\u0646\u064a \u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0628\u0646\u0627\u0621 \u0641\u064a \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a",
    stat_briefing: "\u0625\u062d\u0627\u0637\u0629 \u0645\u062e\u0627\u0637\u0631", stat_gate: "\u0634\u0631\u0637 \u0627\u0644\u062f\u0644\u064a\u0644", stat_watch: "\u0627\u0644\u0628\u0631\u064a\u062f \u0647\u0648 \u0627\u0644\u062a\u0632\u0627\u0645 \u0627\u0644\u0625\u062d\u0627\u0637\u0629", stat_uae: "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0623\u0648\u0644\u0627\u064b",
  },
};

function applyPrefs() {
  const theme = localStorage.getItem("pb_theme") || "dark";
  const locale = localStorage.getItem("pb_locale") || "en";
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  const pack = STRINGS[locale] || STRINGS.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = pack[el.getAttribute("data-i18n")] || el.textContent;
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = pack[el.getAttribute("data-i18n-html")] || el.innerHTML;
  });
  const lb = document.getElementById("locale-btn");
  if (lb) lb.textContent = locale === "ar" ? "EN" : "\u0639";
  const tb = document.getElementById("theme-btn");
  if (tb) tb.textContent = theme === "dark" ? "Aa" : "A";
}

document.getElementById("theme-btn")?.addEventListener("click", () => {
  const next = (localStorage.getItem("pb_theme") || "dark") === "dark" ? "light" : "dark";
  localStorage.setItem("pb_theme", next);
  applyPrefs();
});
document.getElementById("locale-btn")?.addEventListener("click", () => {
  const next = (localStorage.getItem("pb_locale") || "en") === "en" ? "ar" : "en";
  localStorage.setItem("pb_locale", next);
  applyPrefs();
});

const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");
if (burger && drawer) {
  burger.addEventListener("click", () => drawer.classList.toggle("open"));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => drawer.classList.remove("open")));
}
document.getElementById("bg")?.play?.().catch(() => {});
applyPrefs();
