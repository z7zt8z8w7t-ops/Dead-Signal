DEAD SIGNAL v0.12 UPDATE

Upload index.html, game.js, sw.js and README.txt to the root of main, replacing their previous versions.
Upload ALL files from this ZIP's assets folder into your existing assets folder. Keep the other assets already there.
The reception-room-v11.webp image is included again because it was missing from the earlier GitHub upload. It must be inside assets, not at the repository root.
Wait for GitHub Pages deployment and reopen the game. Check the corner version reads v0.12.

Changes
- Officer is 30% larger, including feet and shadow.
- Collision clearance and occupied-door protection match the larger officer.
- Gun muzzle, bullets, weapon torch and vest light origins scale with him.
- Pistol shot has a stronger direct attack and more low/mid weight.
- Room-specific weapon reverberation: reception has the longest broad echo; corridors have shorter reflections; carpeted offices are muted; security and maintenance have their own responses; outside has very little tail.
- Reverb buses are reused, and pause/mute clears their remaining tails. Output limiter controls peaks.

The existing recorded shot remains the source; this update is not a new recording of an actual Glock. See assets/SOUND-CREDITS.txt.
No creatures in this test. Controls and 17-round magazine remain unchanged. The emergency-light switch is on reception's west (left) wall.

Validation
Real artwork rendered in a canvas harness. Larger-body routes, sliding doors, collision, barrel/torch offsets, reload, holster, map and lighting checks passed. Audio graph tests covered all six room profiles, shot routing, voice cleanup, mute and pause. Safari/iPad listening still needs a play test.
