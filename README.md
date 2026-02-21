# Apple Catching Game

A simple apple-catching game for young kids. Drag falling apples into the basket to score points. Works on desktop and mobile/tablet with touch support.

## Play

Once deployed, open the GitHub Pages URL in any browser (desktop or mobile):

```
https://marcopeg.github.io/games/
```

## Setup GitHub Pages

1. Go to your repo on GitHub: https://github.com/marcopeg/games
2. Click **Settings** > **Pages** (in the left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Set branch to **main** and folder to **/ (root)**
5. Click **Save**

The site will be live at `https://marcopeg.github.io/games/` within a minute or two.

## Deploy

Every push to `main` automatically deploys:

```bash
git add -A
git commit -m "your changes"
git push
```

That's it. GitHub Pages picks up the changes automatically. Deploys typically take under a minute.

## Project Structure

```
index.html   - Game page (entry point for GitHub Pages)
game.js      - Game logic (Phaser 3)
.nojekyll    - Tells GitHub Pages to skip Jekyll processing
```

## Tech

- [Phaser 3](https://phaser.io/) via CDN (no build step needed)
- Web Audio API for sound effects and music
- Fully static — no server, no dependencies, no build
