"use client";

export default function StudioNav({ locale, onLocale }: { locale?: string; onLocale?: () => void }) {
  return (
    <header className="studio-nav">
      <a className="wordmark" href="/">PulseBuild<span className="dot">.</span></a>
      <nav>
        <a href="/product">Product</a>
        <a href="/pricing">Pricing</a>
        <a href="/case-studies">Case studies</a>
        <a href="/contact">Contact</a>
      </nav>
      <div className="nav-end">
        {onLocale && (
          <button type="button" className="sq" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        )}
        <a className="sq" href="/product">See product</a>
        <a className="sq fill" href="/login">Sign in</a>
      </div>
    </header>
  );
}
