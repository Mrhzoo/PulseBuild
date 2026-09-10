# S10 Design system

Tokens live in `frontend/src/styles/tokens.css` and are mirrored in `frontend/public/marketing/styles.css`.

| Token | Use |
| --- | --- |
| `--bg` `--text` `--muted` | Surfaces |
| `--pill` `--border` `--shadow` | Chrome |
| `--font-sans` `--font-display` | Inter + Bubbledot / Geist Pixel |

Theme on `<html data-theme="dark|light">`. Default dark.

Prefs (shared landing + app):
- `localStorage.pb_theme` = `light` \| `dark`
- `localStorage.pb_locale` = `en` \| `ar` (sets `dir=rtl` when `ar`)

Add a string: put the key in both `frontend/src/i18n/en.json` and `ar.json`. Landing chrome also has an inline map in `public/marketing/main.js`.

Placeholders:
- `frontend/public/marketing/assets/logo.webp`
- `frontend/public/marketing/fonts/GeistPixel-Circle.woff2`

Video first source is the founder CloudFront MP4. BubbledotICG-FinePos from OnlineWebFonts.

Manual check: toggle theme + language on `/` and `/login`. Prefs survive navigation.
