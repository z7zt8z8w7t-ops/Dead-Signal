DEAD SIGNAL v0.14 - SHADOW FIX

Upload index.html, game.js, sw.js and README.txt to the root of main, replacing existing versions.
Wait for GitHub Pages deployment and reopen. Check v0.14 in the corner.
No asset uploads or deletions are needed for this update. Keep all current room images, officer images and audio files.

Changes
Walls and doors remain full light barriers, including while doors slide open or closed.
Furniture now casts short, soft visual shadows, capped at 64 world pixels (about one metre) beyond its footprint. Low tables and sofas use shorter shadows. Covered remains and the stool use tiny contact shadows; flat debris retains its painted contact shading.
The torch and room lamps no longer treat low objects as infinitely tall walls.
The contaminated wing has a faint dark red ambient glow, so the room remains readable between lamp flickers.
Unopened, undiscovered rooms are hidden in both the game view and map. Opening a door reveals the connected room; it remains discovered if the door is closed again. Reset clears discovery. The objective marker remains visible on the map.
Movement, bullets, key progression, audio and the level layout are retained.

Validation
Real-asset canvas render checks show previously obscured lab details are visible again. Tests verify bounded shadow geometry, light passing low props, wall/closed-door occlusion and changing door gaps, plus door-gated room discovery, reset of discovery, key/notes progression, accessible rooms, reload/holster/map and reset. Please play-test on iPad/Safari.
