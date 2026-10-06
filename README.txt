DEAD SIGNAL — HOME MORNING PLAY TEST v0.15

UPDATE YOUR EXISTING GITHUB REPOSITORY
Upload index.html, game.js, rooms.js, sw.js and README.txt into the repository root on main.
Upload every file from this ZIP's assets folder INTO your existing assets folder.
Keep your existing manifest.webmanifest, icon.svg, icon-192.png and icon-512.png.
No assets need deleting. Old research-facility art may stay; this Home build does not load it.
Wait for GitHub Pages to finish deploying, reopen the app and check v0.15 · Home.
If it still shows an old version, fully close the Home Screen app, open the site in Safari once while online, then reopen it.

PLAY SEQUENCE
Move the joystick to get Jim out of bed. His lower body remains fully obscured.
USE picks up the flashing white towel beside the bed.
Open the bedroom door and bathroom door with USE. USE the shower from beside its entrance.
The shower uses opaque blur/steam coverage. The towel is restored before that coverage clears.
Return to the bedroom wardrobe and USE to dress in a black vest, jeans and flip-flops.
Walk onto the stairs to descend automatically. A short fade changes floors; no USE required.
USE breakfast beside the kitchen peninsula: health increases from 80 to 100.
USE Emma's flashing note from beside the dining table. Read notes stop flashing but remain readable.
Once dressed, fed and the note has been read, a phone reminder signals that it is time to leave.
USE the pink front door or garage door, then approach the UK driver's side of the yellow Vivaro and USE.
This play test ends with Jim leaving for the police station. It does not include the station or research facility yet.

CONTROLS
Left stick moves and faces the pushed direction. Right USE interacts.
MAP above the stick opens/closes the current explored floor plan.
Keyboard: WASD/arrows movement, E use, M map, Escape pause/close note.
No gun controls are shown during the Home tutorial.

HOME CATALOGUE
rooms.js records each approved room's background, footprint, doors, furniture collision boxes,
floor surface, item placement surfaces and separate accessible interaction positions.
Rooms are linked using door connections. Furniture remains in the approved room artwork.
Home's story note has a deliberate dining-table position. Item surfaces also reserve note/keycard locations for future areas.
Ground-floor toilet is part of the approved entrance-hall module.
The upstairs landing and downstairs hall have automatic staircase triggers, placed outside solid stairwell boundaries.
Undiscovered rooms remain hidden until their connecting door opens. Previously discovered rooms stay visible.

CHARACTERS
Jim has identical render width/height and collision radius in his morning and dressed states.
Generated feet that pointed backwards are excluded from the shipped torso assets.
Feet are rendered separately with forward-facing toes and animated steps. Arm movement and idle breathing are animated.
Bella is a border collie with animated paws, body movement and tail wag. She wanders accessible ground-floor rooms,
occasionally follows Jim and can be petted with USE. She avoids closed doors and furniture; she cannot physically block Jim.

AUDIO / GRAPHICS
Room artwork uses the approved generated previews, converted to WebP without changing each image's aspect ratio.
Recorded door and surface-adapted footstep samples are reused from the earlier play tests.
Shower ambience and phone reminder are generated locally with Web Audio; no external audio service is required.
All required Home assets are precached for offline Home Screen use after a successful online load.

VALIDATION
Local native-canvas rendering and game-state checks cover asset loading, collision routes, interaction reachability,
all morning tasks, health increase, notes, stairs/no immediate return, van exit, map, pause and restart.
Actual iPad/Safari touch behaviour and audio still require your device play test.
