import "./globals.css";
import AppFrame from "../components/AppFrame";

const BOOT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("pb_theme");var l=localStorage.getItem("pb_locale");d.setAttribute("data-theme",t==="dark"?"dark":"light");if(l==="ar"){d.lang="ar";d.dir="rtl";}else{d.lang="en";d.dir="ltr";}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body suppressHydrationWarning>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
