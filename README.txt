DEAD SIGNAL v0.13 - ATMOSPHERE LEVEL UPDATE

INSTALL
Replace index.html, game.js, sw.js and README.txt in the root of main.
Upload all NINE room-*-v13.webp images from this ZIP into your existing assets folder.
Keep the other officer and audio files already there. Wait for GitHub Pages deployment, reopen and check v0.13 in the corner.
The game will now report missing room images instead of silently showing older graphics.

ASSET CLEANUP
No deletions are required.
After v0.13 is working, these old assets are optional to remove because they are no longer used:
furniture-atlas.png
surface-atlas.png
reception-room-v11.webp
pistol.wav
Keep officer-drawn-v10.png, officer-holstered-v10.png, pistol-v12.wav and all other current WAV files.

LEVEL
Start outside in the rain and enter the clean reception. Use the paper beside the reception desk to read the visitor record.
Head north into the office corridor. The west office contains her field notes. The east office contains the security key near its filing cabinet.
Use the northern security door with the key. It leads to a filthy service passage, contaminated laboratory, service store and isolation room. Explore the blood trails and scattered remains under dark red flickering lighting.
Both notes can be reread. Reading pauses the action; Close note or Escape returns to play.
No living creatures in this atmosphere test. The reception west-wall power switch still toggles yellow emergency beacons in the clean wing. Red lighting in the contaminated wing remains active.

VISUALS / CONTROLS
Nine separate room/corridor/exterior images contain static walls, floors and furniture, with matching invisible barriers. The game draws only visible sections and no longer keeps an additional full-level background canvas. Artwork is loaded at start for this small test; nearby-only loading can be added for larger levels.
Animated doors remain separate. Both torches have feathered angular edges and radial falloff; walls and furniture block them. Short glowing tracers briefly reveal nearby surfaces.
Controls unchanged: left stick moves/faces, MAP above it, DRAW/HOLSTER below; USE above FIRE; RELOAD below. Glock 17, 17-round magazine, unlimited reserve, manual 1.5-second reload.
Larger officer and room-dependent gunshot reverb retained.

CHECKS
Real-asset canvas render and mechanics harness checked locked-wing access, reachable notes/key, read/pause/close, unlocking/opening, body clearance to every room, atmosphere transition and red flicker, torch/tracer rendering, reload/holster/map, and reset. Needs iPad/Safari play testing.

ARTWORK
Built-in image-generation tool used for office and contaminated lab sources. Offline background baking makes the nine runtime modules; no source atlas is needed at runtime.
Office prompt: detailed directly overhead carpeted corporate office; preserve supplied furniture and empty doorway footprints; walnut desks with computers and records, filing cabinet, neutral diffuse lighting.
Lab prompt: detailed directly overhead abandoned bioscience laboratory; preserve supplied walls and empty door openings; stained equipment, concrete, blood trails, scattered remains and debris; neutral material lighting for dynamic red lights.
The reception artwork and source sound credits are retained from earlier versions.
