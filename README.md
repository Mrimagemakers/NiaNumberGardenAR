# Nia & the Number Garden — Deluxe AR Book

A living 3D, AR and VR edition of *Nia & the Number Garden — Deluxe Edition* by Darnell Clark (PenGame Publishing / Bright Minds Explorers).

**Live:** https://mrimagemakers.github.io/NiaNumberGardenAR/

## What it does
- **3D flipbook** of all 63 pages with real page turns, read-aloud narration and a star passport.
- **A pop-up math adventure for every chapter**, following the book's "AR Experience" column: open the 4 + 4 gate, cross the Addition Bridge, wake Carlo 1–10, help Subby subtract, sort the shape flowers, build Milly's arrays, finish the Pattern Pond, measure flowers, read the Time Flower, pay at the Market of Money, skip count with Skippy, unlock the Heart of the Garden, solve in Nia's dreams, and draw on the magic chalkboard.
- **Character spotlights** for every character page, with rigged Nia, Addie, Freddy and Gwenda.
- **Watch / Games / Links / Music / Follow / Replay** buttons inside every pop-up, including chapter video clips.
- **Nia's songs** ("Number Garden" and "Rocket Ship to Number Land") play softly in the background and dip under narration and videos.
- **Follow & share**: social links and a share button. Add channel links in the `SOCIAL` list in `app.js`.

## Modes
| Button | Works on |
|---|---|
| AR (place the book on a table) | Chrome on Android (ARCore), Meta Quest |
| VR (garden world) | Meta Quest browser and other WebXR headsets |
| Camera (pop-ups over the live camera) | iPhone, Android, laptops |
| Scan my book (point at the printed cover or chapter pictures) | iPhone, Android |

Camera, AR and VR need HTTPS, which GitHub Pages provides.

## Files
- `index.html`, `app.js`: book, modes, UI
- `exps.js`: the chapter experiences
- `core.js`, `props.js`, `garden.js`: characters, props, garden
- `pages/`: book pages · `music/`: songs · `videos/`: chapter clips · `models/`: character models (packed as JS)
- `targets.js`: image-tracking data for the printed book (MindAR)
- `nia-number-garden.zip`: the earlier interactive math activity (archived)
