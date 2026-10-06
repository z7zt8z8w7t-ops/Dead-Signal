DEAD SIGNAL — HOME PLAY TEST v0.16

UPDATE FROM THE EXISTING v0.15 HOME BUILD
This ZIP contains changed files only: 5 root files and 12 new artwork files.
Upload index.html, game.js, rooms.js, sw.js and README.txt into the repository root on main.
Upload all 12 files from the ZIP's assets folder into your EXISTING assets folder.
Keep your existing manifest.webmanifest, icons, WAV sound files,
home-driveway-v15.webp and home-collie-v15.webp. Those unchanged files are not in this ZIP.
No asset deletions are required. Do not empty the assets folder.
After GitHub Pages deploys, reopen the app and check v0.16 · Home.
If you still see an old version, fully close the Home Screen app, open the site online in Safari once,
then close and reopen it. Offline use requires one successful online load of all new files first.

WHAT CHANGED
The two house floors follow the agreed contiguous layouts, using one scale: 100 world units per metre.
The main house is 7.5 m wide by 9 m deep; the single-storey garage adds 3.5 m on the right.
Room artwork contains detailed furniture. Shared walls and door openings are placed independently
at exact coordinates, so adjacent rooms meet directly without connector corridors.
The lounge doorway and downstairs WC doorway were shifted 0.2 m toward the front
so Jim can pass their centres without overlapping the stairs or toilet.
The garage doorway remains clear of the hall console.
All internal doors are 0.9 m wide except the downstairs WC door, which is 0.8 m.
Both stair footprints align between floors. The lower stair image is positioned separately.
Jim now uses the approved directly overhead eight-frame walk in both outfits, with the stronger arm swing.
The old torso and separate generated feet are no longer drawn. Character size and collision radius
remain the same between dressed, towel and obscured wake-up states.
Stairs activate when moving onto them in the appropriate direction; idle or sideways movement
near the entrance does not change floors. No USE is required.
Bella, the yellow Vivaro with two roof bars, audio and the morning story sequence are retained.

PLAY SEQUENCE
Move the joystick to wake and get out of bed. Jim's lower body is obscured.
USE the flashing towel beside the bed, then open the bedroom and bathroom doors.
Approach the shower entrance and USE; opaque steam covers the shower scene.
Return to the bedroom wardrobe and USE to dress in the black vest, jeans and flip-flops.
Walk onto the stairs to descend automatically with a short fade.
USE breakfast from beside the peninsula to restore health from 80 to 100.
Read Emma's flashing note on the dining table. Reading pauses the game.
After breakfast, dressing and reading the note, the phone reminder signals time for work.
USE the pink front door or garage vehicle door, then approach the driver's side of the Vivaro and USE.
The play test ends with Jim leaving for the police station. The station and facility are not included yet.

CONTROLS
Left joystick moves and faces that direction. Right USE interacts with nearby objects and doors.
MAP above the joystick toggles the explored current-floor view.
WASD/arrows move, E uses, M toggles map, Escape pauses/closes a note.
Home has no weapon controls. Notes remain readable after collection; the flashing stops.
Rooms are hidden until their connecting doors have opened, then stay discovered for this playthrough.
Bella wanders the accessible ground floor, animates and can be petted; she cannot block Jim.

ROOM CATALOGUE
rooms.js records room bounds, floor masks, doorway apertures, furniture collisions,
surface types, item surfaces and accessible approach positions.
The tutorial note stays on the dining table; future note/keycard placement surfaces are reserved.
The downstairs toilet now has its own room/discovery and door collision.
Wall thickness is 0.15 m. Rendered thresholds are feathered into the adjacent floor artwork.

VALIDATION
Local native-canvas and game-state checks passed for all required artwork, every shared doorway,
closed-door collisions, discovery, reachable task approaches, full morning progression,
health/notes, stairs in both directions, avoiding accidental stair triggers, van exit,
map, pause/restart, eight distinct gait frames and Bella's collision-safe movement.
Both assembled floors were rendered and reviewed. ZIP entries are checked against source bytes.
Actual iPad/Safari touch input, sound and Home Screen behaviour still need your device play test.
