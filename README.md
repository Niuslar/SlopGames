# SlopGames

An open arcade of vibe-coded browser games.

People are making small, fun games with AI. Usually each one is a single HTML file, and most of them end up forgotten in someone's downloads folder. SlopGames puts them in one place where anyone can play them.

**Play:** [SlopGames is hosted here](https://github.com/Niuslar/SlopGames), or clone the repository and open `index.html` in your browser.

---

## Adding a game

Adding a game takes three steps and one pull request.

### 1. Put your game in its own folder

```
games/
  your-game-slug/
    index.html      ← your game (required)
    thumb.png       ← 16:9 screenshot (optional, recommended)
```

- The **slug** is the folder name. Use lowercase letters, numbers and dashes, for example `space-goose-3000`.
- The game must start from `games/<slug>/index.html`.
- Your game runs inside the arcade's player page, under a thin bar with a "← All games" button and a full-screen button. You don't need to add your own back button. Size the game to the window (`innerWidth` / `innerHeight` or `100%`) instead of assuming a fixed screen size.
- One file is best. If your game needs other assets (sounds, sprites), put them in the same folder and link to them with **relative paths**.

### 2. Register it in `games.js`

Add an entry to the `window.SLOP_GAMES` list:

```js
{
  slug: "space-goose-3000",
  title: "Space Goose 3000",
  description: "Honk your way through an asteroid field. One or two sentences.",
  author: "your-github-handle",
  authorUrl: "https://github.com/your-github-handle",  // optional
  madeWith: "Claude",                                   // the AI/tool that wrote it
  tags: ["arcade", "mobile"],                           // see tag list below
  controls: "Arrow keys + space",
  added: "2026-11-14",                                  // today, YYYY-MM-DD
  thumbnail: "games/space-goose-3000/thumb.png"         // optional, "" if none
},
```

The order of entries doesn't matter, because the dashboard sorts them. A game added in the last 14 days gets a **NEW** badge. A game without a thumbnail gets a colored cover with its initials.

### 3. Open a pull request

1. Fork this repo.
2. Add your folder and your `games.js` entry.
3. Open `index.html` locally and check that your card shows up and the game runs.
4. Open a PR titled `Add game: <Title>`.

An automatic check runs on every PR and tells you if something in `games.js` or your game folder is wrong. Fix what it reports and push again, and the check re-runs. To run the same check on your machine before opening the PR (needs [Node.js](https://nodejs.org)):

```bash
node scripts/check-games.mjs
```

---

## Rules

Games need to be fun to play and safe to open. A PR will be merged when the game:

- **Runs in a browser with no build step.** Open the file and it works.
- **Is self-contained.** It loads no trackers, ads or analytics, and it doesn't call remote APIs. Loading libraries from a well-known CDN (cdnjs, jsDelivr, unpkg) is OK.
- **Asks for nothing personal.** No logins, no data collection, no asking for keys. Saving high scores in `localStorage` is fine.
- **Is yours to share.** Don't submit a clone of an existing commercial game, its name, characters, art or music. Games in a familiar genre are fine.
- **Is under 5 MB** for the whole folder.
- **Is safe for a general audience.**

"Slop" refers to how the games were made, not how good they are. Polish is welcome but not required.

### Suggested tags

`arcade` · `puzzle` · `platformer` · `shooter` · `racing` · `rhythm` · `strategy` · `idle` · `word` · `toy` · `multiplayer` · `mobile` (plays well on touch) · `score-attack` · `relaxing`

You can make up a new tag if none of these fit. Just keep it short and lowercase.

---

## Project layout

```
index.html     the dashboard (search, tag filter, random game)
play.html      the player page: shows a game under a "← All games" bar
games.js       the game registry, the one file contributors edit
games/<slug>/  one folder per game
scripts/       the format check that runs on every PR
.github/       the GitHub Action that runs it
```

## License

The site code is MIT licensed (see `LICENSE`). Each game belongs to its author. By submitting a game, you agree to release it under the MIT license unless your game folder contains its own `LICENSE` file.
