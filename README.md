# Vice Legend — GTA VI Trophy Guide & Tracker

[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/bloomsX/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/bloomsX/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of **Grand Theft Auto VI** — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online — built for the [make.fun GTA 6 Trophy Guide bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Tracker** — a checklist of all 55 trophies with their official names, descriptions and grades. Progress is saved in `localStorage`, and can be exported to a file and imported back. Search, filter by grade, by kind (story, missable, collectibles, activities, side quests, open world, online) and by earned / not earned yet.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the Platinum** — three stages built from the official descriptions: play the five chapters (60–80 hours), the 100% checklist (about 100 hours), then Strangers & Freaks and clean-up (about 10 hours). About 200 hours in all, difficulty 4/10 (PowerPyx). The one possibly missable trophy — Positive Mental Attitude, a Chapter 1 meditation — is flagged everywhere it matters.
- **Cited guides** — every trophy gets a guide written for this page, in our own words, naming its sources beside it (GTABase, PowerPyx, Exophase, PSNProfiles, Push Square and others). Where no source has confirmed a step yet — five trophies at launch — the guide says so instead of inventing a location or a method.
- **Offline** — static files under `app/`, no build step, no network requests at run time. Serve `app/` with any static server and open `index.html` in desktop Chrome with the network off.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged).

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself (dark neon Vice look, original design, no Rockstar artwork).
- `app/data/trophies.json` — the 55 trophies: official name, description, grade, hidden flag, kind, missable flag, PSN-tracked count, roadmap stage, guide and sources.
- `app/data/roadmap.json` — the three roadmap stages, the 100% checklist table and the warnings.
- `screenshots/` — 4 real renders of the app in a browser (cover: tracker with a guide open; roadmap; filters with spoilers on; a second guide).
- `main.ts`, `serve.ts`, `shots.json`, `LICENSE` (MIT).
