"use client";

export default function MarketingHeader({
  theme,
  locale,
  onTheme,
  onLocale,
}: {
  theme: string;
  locale: string;
  onTheme: () => void;
  onLocale: () => void;
}) {
  return (
    <header className="mkt-bar">
      <a className="shell-logo" href="/"><span className="logo-circle">PB</span><strong>PulseBuild</strong></a>
      <nav className="mkt-nav">
        <a href="/">Home</a>
        <a href="/product">Product</a>
        <a href="/case-studies">Case Studies</a>
        <a href="/pricing">Pricing</a>
        <a href="/contact">Contact</a>
      </nav>
      <div className="shell-actions">
        <button type="button" onClick={onTheme}>{theme === "dark" ? "Light" : "Dark"}</button>
        <button type="button" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        <a href="/login">Sign in</a>
      </div>
    </header>
  );
}
