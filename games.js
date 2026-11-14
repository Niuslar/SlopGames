// SlopGames registry — one entry per game.
// To add your game: copy an entry, change the fields, and put your game at games/<slug>/index.html.
// See README.md for the full guide.
window.SLOP_GAMES = [
  {
    slug: "moonbreach",               // folder name under games/ (lowercase, dashes)
    title: "Moonbreach",
    description: "You're a narwhal with two minutes and one goal: the moon. Burst out of the sea, chain flips and twists, and sling off glowing lights to climb past the clouds.",
    author: "SlopGames",              // your name or handle
    authorUrl: "",                    // optional: GitHub profile, website…
    madeWith: "Claude",               // the AI or tool that wrote it
    tags: ["relaxing", "high-score"],
    controls: "Keyboard or touch",
    added: "2026-11-14",              // YYYY-MM-DD
    thumbnail: "games/moonbreach/moonbreach-thumbnail.jpeg"                     // optional: e.g. "games/moonbreach/thumb.png" (16:9)
  },
  {
    slug: "isekai-alchemist",
    title: "Isekai Alchemist",
    description: "Pulled into a magic kingdom to be its hero, then thrown out as useless: no strength, no magic. But you can see atoms. Snap them together into real compounds, cross the kingdom and stop the Demon Lord's smoke.",
    author: "SlopGames",
    authorUrl: "",
    madeWith: "Claude",
    tags: ["puzzle", "educational", "relaxing", "mobile"],
    controls: "Mouse or touch (Enter to transmute)",
    added: "2026-11-14",
    thumbnail: "games/isekai-alchemist/thumb.svg"
  },
  {
    slug: "jamblobs",
    title: "Jamblobs",
    description: "Make a song in a minute. Tap beats, basslines, melodies and silly effects to wake up a band of blobs, switch moods, rewrite their loops and hunt for secret band combos.",
    author: "SlopGames",
    authorUrl: "",
    madeWith: "Claude",
    tags: ["music", "toy", "relaxing", "mobile"],
    controls: "Mouse or touch (Space to play/stop)",
    added: "2026-11-14",
    thumbnail: "games/jamblobs/thumb.svg"
  },
];
