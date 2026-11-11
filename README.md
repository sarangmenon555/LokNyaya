# LokNyaya

Open-source agent that helps anyone in India with a civil dispute find the right forum, see every deadline, and prepare the paperwork. Built for the Code for a Billion Bharat Agentic-AI Hackathon 2026, Timely Justice track.

LokNyaya provides legal information, not legal advice.

## Status

Phase 1: rules engine, pack format, jurisdiction list, three starter packs.

Phase 2: static web app with the 30-second deadline checker, the Ink and Lamp design system, a language picker for nine languages, a drawn clock ring, calendar export and read-aloud. English and Hindi are translated; the other seven languages show English until their files are added in `apps/web/lib/i18n.ts`.

Every pack is marked pending until it has been checked against the official text. Pending packs must be shown to users as needing review.

Phase 3: explanations and recovery hints are now built from structured results so they translate, and a Draft Studio writes a legal notice for consumer, money-lent and breach-of-contract matters. The notice is plain text, editable, and prints to PDF from the browser. Packs opt in with `"draft": "demand-notice"`.

Phase 4: a state and union territory picker that filters packs and shows free help near the user (legal services authority, and for Keralam, Tamil Nadu and West Bengal the High Court, consumer commission and real estate regulator), calendar reminders for the deadline plus day 7, 14 and 30 follow-ups, a follow-up page, anonymous impact counters, and a public `/impact` dashboard. Counters hold totals only, never per-person rows, and outcomes are self-reported.

Phase 5: first state packs (Tamil Nadu and Keralam rent and deposits), a public `/coverage` page showing what is covered and what has been signed off, and reviewer tools.

Phase 6: an old-to-new section finder at `/sections`, built from `packs/concordance.json`. The entries record who checked them and when. They were checked by the project owner and should get an independent legal review before launch.

Phase 7: Tamil Nadu and Keralam tenancy packs corrected against the statute text, Tamil Nadu appeal deadlines added, Kerala claims routed by value between the Munsiff's Court and the Sub Court, and `docs/verification-ledger.md` recording what each source supports.

Phase 8: the result card names the governing Act with its year and whether it is a Central Act or a State or UT Act, the wizard's first step asks which kind of law applies, matter cards show the Act that governs them, and the result adds a review badge, a same-day warning, WhatsApp sharing and a start-over button. Packs list their state or UT Acts in `stateActs`.

Phase 10: Malayalam, Tamil and Bengali added (drafts, not yet checked by native speakers; the footer says so). `docs/translation-review.csv` lists every string in English, Hindi, Malayalam, Tamil and Bengali with a column for reviewer corrections. Language files live in `apps/web/lib/lang`.

## Layout

    packages/engine   limitation clock, forum routing, pack schema and registry
    apps/web          Next.js static site, runs entirely in the browser
    packs             rule packs as JSON, plus the list of 28 states and 8 union territories

## Setup on Windows

    corepack enable
    pnpm install
    pnpm test
    pnpm typecheck

If corepack is unavailable, run `npm install -g pnpm` first.

Run the site locally:

    pnpm dev

## Deploy free on Cloudflare Pages

Connect the GitHub repository and set:

    Build command:           pnpm install && pnpm build
    Build output directory:  apps/web/out

The pages are static. The counters use one free Cloudflare D1 database:

    npx wrangler d1 create loknyaya
    npx wrangler d1 execute loknyaya --remote --file=apps/web/schema.sql

Put the returned id in `apps/web/wrangler.toml`, then in the Pages project open Settings, Bindings, and add a D1 binding named `DB`. Without it the site still works and `/impact` shows a notice.

## Adding a pack

1. Copy an existing file in `packs`.
2. Set `layer` to `central`, `state` or `ut`. State and union territory packs list their jurisdiction codes.
3. Cite the Act and section in every `source` field.
4. Add golden cases. Every golden case is run by the test suite.
5. Leave `verification.status` as `pending` until a reviewer has checked the text, then record the reviewer and date.

## Licence

Apache-2.0

## Getting a pack reviewed

Print a checklist for a legal reviewer:

    pnpm --filter @loknyaya/engine review tn-tenancy-2017

The reviewer checks each line against the official text and writes corrections. Apply the corrections to the pack file, run `pnpm test`, then record the sign-off:

    pnpm --filter @loknyaya/engine verify-pack tn-tenancy-2017 "Reviewer Name"

Only run the second command after a person has actually checked the pack. A verified pack no longer shows the awaiting-review notice to users.
