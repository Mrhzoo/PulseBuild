# S11 Auth + app shell

Login `/login` uses the landing CloudFront video + token card.
Prefill of seed Owner happens only on `localhost` or `NEXT_PUBLIC_APP_ENV=development`.

Protected routes (`/app`, `/flags`, `/billing`, `/onboarding`): no `pb_token` → `/login`.
Authed `/login` → `/app`.
Public: `/`, `/marketing/*`, `/share/*`, `/login`.

Sign out clears `pb_token` and `pb_role`.

Click test:
1. Open `/app` logged out → `/login`
2. Sign in as `owner@demo.pulsebuild.local` / `demo-owner-pass` → `/app`
3. Toggle theme/locale in the shell
4. Sign out → landing
