import { useEffect, useState } from "react";
import {
  Activity, Apple, Award, Check, ChevronRight, CircleHelp, Dumbbell, Home, Menu,
  Moon, ShoppingBag, Sun, UserRound, Wallet, X, Languages, Settings2, Sparkles, type LucideIcon,
} from "lucide-react";
import { translations, type Language, type TranslationKey } from "./i18n";

type Theme = "light" | "dark";
type Section = "dashboard" | "workouts" | "meals" | "progress" | "habits" | "shop";

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  const [section, setSection] = useState<Section>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = (key: TranslationKey) => translations[language][key];
const [toast, setToast] = useState("");

  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
    document.documentElement.dataset.theme = theme;
  }, [language, theme]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const sectionLabels: Record<Section, TranslationKey> = {
    dashboard: "dashboard",
    workouts: "workouts",
    progress: "progress",
    profile: "profile",
  };

  const navItems: { id: Section; icon: typeof Home; label: TranslationKey }[] = [
{ id: "dashboard", icon: Home, label: "dashboard" },
{ id: "workouts", icon: Dumbbell, label: "workouts" },
{ id: "meals", icon: Apple, label: "meals" },
{ id: "progress", icon: Activity, label: "progress" },
{ id: "habits", icon: Check, label: "habits" },
{ id: "shop", icon: ShoppingBag, label: "shop" },
  ];

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const toggleLanguage = () => {
    const nextLanguage: Language = language === "en" ? "hi" : "en";
    setLanguage(nextLanguage);
    setToast(translations[nextLanguage].toastLanguage);
  };

  const chooseSection = (id: Section) => {
    setSection(id);
    setDrawerOpen(false);
  };

  const showSoon = () => setToast(t("toastSoon"));

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="icon-button menu-button" aria-label={t("openMenu")} aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <Menu size={21} />
        </button>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); chooseSection("dashboard"); }}>
          <span className="brand-mark">K</span>
          <span>KAAVO<span className="brand-fit"> FIT</span></span>
        </a>
        <div className="top-actions">
          <button className="language-pill" aria-label={t("language")} onClick={toggleLanguage}>
            <Languages size={16} />
            {language === "en" ? "हिंदी" : "English"}
          </button>
          <button className="icon-button theme-button" aria-label={t("theme")} aria-pressed={theme === "light"} onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setToast(t("toastTheme")); }}>
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>

      <div className="preview-banner"><span className="status-dot" />{t("shellLabel")}</div>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t("greeting")}</p>
          <h1>{t("headline").split("\n").map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h1>
          <p className="hero-subtitle">{t("subtitle")}</p>
          <button className="primary-button" onClick={() => chooseSection("workouts")}>
            {t("start")} <ChevronRight size={18} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <Dumbbell className="hero-dumbbell" strokeWidth={1.25} />
          <span className="art-tag tag-top"><Sparkles size={14} /> {t("consistency")}</span>
          <span className="art-tag tag-bottom">01 / {t("startLabel")}</span>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">{t("activeSection")}</p>
          <h2>{t(sectionLabels[section])}</h2>
        </div>
        <span className="section-count">01 — 04</span>
      </section>

      {section === "dashboard" ? (
        <section className="empty-card">
          <div className="empty-icon"><Activity size={25} /></div>
          <div>
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyBody")}</p>
          </div>
        </section>
      ) : (
        <section className="empty-card">
          <div className="empty-icon"><Sparkles size={25} /></div>
          <div>
            <span className="mini-label">{t("comingSoon")}</span>
            <h3>{t(sectionLabels[section])}</h3>
            <p>{t("toastSoon")}</p>
          </div>
          <button className="text-button" onClick={showSoon}>{t("comingSoon")} <ChevronRight size={16} /></button>
        </section>
      )}

      <footer className="footer-note">KAAVO FIT <span>·</span> {t("shellLabel")}</footer>

      <nav className="bottom-nav" aria-label={t("navLabel")}>
        {navItems.map(({ id, icon: Icon, label }) => (
          <button key={id} className={`nav-item ${section === id ? "active" : ""}`} aria-current={section === id ? "page" : undefined} onClick={() => chooseSection(id)}>
            <Icon size={20} strokeWidth={section === id ? 2.3 : 1.8} />
            <span>{t(label)}</span>
          </button>
        ))}
      </nav>

      {drawerOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label={t("menu")}>
            <div className="drawer-header">
              <div className="brand"><span className="brand-mark">K</span><span>KAAVO<span className="brand-fit"> FIT</span></span></div>
              <button className="icon-button" aria-label={t("close")} onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <p className="drawer-intro">{t("drawerIntro")}</p>
            <div className="drawer-links">
              <button onClick={() => chooseSection("dashboard")}><Home size={18} />{t("dashboard")}<ChevronRight size={16} /></button>
              <button onClick={() => chooseSection("workouts")}><Dumbbell size={18} />{t("workouts")}<ChevronRight size={16} /></button>
              <button onClick={() => chooseSection("progress")}><Activity size={18} />{t("progress")}<ChevronRight size={16} /></button>
              <button onClick={() => chooseSection("profile")}><UserRound size={18} />{t("profile")}<ChevronRight size={16} /></button>
            </div>
            <div className="drawer-divider" />
            <p className="drawer-section-label">{t("settings")}</p>
            <button className="drawer-setting" onClick={toggleLanguage}>
              <Languages size={18} /><span>{t("language")}<small>{language === "en" ? "English" : "हिन्दी"}</small></span><ChevronRight size={16} />
            </button>
            <button className="drawer-setting" onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setToast(t("toastTheme")); }}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}<span>{t("theme")}<small>{t(theme)}</small></span><ChevronRight size={16} />
            </button>
            <div className="drawer-divider" />
            <p className="drawer-section-label">{t("wallet")} & {t("rewards")}</p>
            <button className="drawer-setting" onClick={showSoon}><Wallet size={18} /><span>{t("wallet")}<small>{t("comingSoon")}</small></span><ChevronRight size={16} /></button>
            <button className="drawer-setting" onClick={showSoon}><Award size={18} /><span>{t("rewards")}<small>{t("comingSoon")}</small></span><ChevronRight size={16} /></button>
            <button className="drawer-setting" onClick={showSoon}><CircleHelp size={18} /><span>{t("help")}<small>{t("comingSoon")}</small></span><ChevronRight size={16} /></button>
            <div className="drawer-bottom"><Settings2 size={15} /> {t("drawerFootnote")}</div>
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
