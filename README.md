# Co se v Peci peče?

**What’s cooking in Pec?**

A gentle, illustrated browser adventure set in an imagined forest above Pec pod Sněžkou. Play as Hana, gather 6 potatoes, learn familiar Czech songs from 3 fairies, and restore gardens along a winding forest loop. Talk with a fox, an owl, a deer, and a badger through short philosophical conversations. Come home to Hana’s husband John, their infant son Aldo, and Percy the seal point tabby, then prepare, cook, and serve dinner. After supper, Hana glows, rises gently, and becomes a pagan Slavic goddess. The Czech/English switch translates the whole game and preserves your progress.

## Play locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. The game runs entirely in the browser. Once installed, it doesn't need an account, a connection to any game service, or outside asset service. Reloading begins a fresh adventure.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Walk in the direction shown on screen |
| E | Gather a nearby potato or talk with a creature |
| E near a fairy | Listen, then automatically hum her song to learn it and receive a tear |
| E at a garden | Choose a learned song to restore it |
| E at the cottage | Go inside after gathering all gifts and restoring all 3 gardens |
| E inside | Greet John, visit Aldo, prepare the potatoes, cook, and serve dinner |
| M | Open or close the map |
| H | How to play |
| Esc | Stop an unfinished song, pause, or close the current panel |

The game starts in Czech. Choose “English” on the title screen or during play to switch languages. Touch screens have directional buttons and an action button. Use the title screen’s sound button to hear the opening theme. Music can also begin with your first click or keypress in the introduction. The sound button can mute it, and starting or replaying keeps your choice. The forest map shows available potatoes, fairies, restoration sites, and Hana’s position. A wrong song offers a clue and consumes nothing. Movement, pause, or losing focus stops an unfinished performance. Learned songs are reusable, and restored gardens stay restored. Two potatoes appear only after their garden is restored. The final rain song needs all 3 tears, and the tears remain in the inventory as keepsakes. Inside, it becomes a room plan with the five dinner steps. Release the action button between household tasks. Forest conversations can be revisited and don’t have right or wrong answers. There’s no combat, time limit, or failure penalty. The reduced-motion setting keeps the scenery still and shows a glowing goddess without the animated rise. Changing the setting during play takes effect immediately.

## Build and checks

```sh
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. Serve it with an HTTP server, such as the preview command. Opening `index.html` as a local file won't run the module-based game.

On macOS, `node launcher/start-game.mjs` opens the production build in your default browser and starts the local preview server if needed. Run `npm install` and `npm run build` first.

## Art and cultural notes

The world uses a fixed perspective camera at a 30° downward angle and a 45° diagonal. Tree trunks, painted fir fronds, layered birch crowns, rocks, garden beds, cottage walls, and kitchen furniture have depth. Foreground foliage fades around Hana and the nearest interaction. Decorative terrain stays off the walking paths.

Fir and birch trunks have distinct bark, tapered profiles, and moss around flared roots. Occasional breezes move the branches and nearby plants while trunks stay rooted. Hana listens to each fairy before answering with six painted singing poses, including hand gestures, mouth changes, and closed eyes. A glowing tear descends from the fairy and floats into a small glass jar beside Hana when the song is learned. The jar fills with each tear, closes with a cork, and tucks away after collection. Potatoes stay in her basket. Reduced motion keeps branches still, uses steady listening and singing poses, and shows the tear without travel.

Original painted character sheets and portraits were generated for the game. Owner-supplied photos informed Hana, John, and Percy’s appearance. The photos themselves aren’t distributed. Hana has golden hair with darker roots, a braid, and an embroidered blouse. John has sandy-blonde swept hair and a neat short beard, following the later photo reference. Percy has an ivory body, striped points, a ringed tail, and pale blue eyes. The character folder records the generation prompts. Other illustrated textures are drawn in code.

Hana has four directions and eight walking frames per direction, plus separate six-frame gathering and petting sequences, singing, preparing, cooking, serving, and goddess poses. Her walk includes passing steps and a body rise timed to each footfall. Idle frames add blinking and slight cloth movement. John greets Hana and sits for supper. All three fairies and four forest animals use detailed painted sheets with three animation frames each. Fairies keep fluttering after teaching their songs. Animals turn their heads, face Hana, and breathe. The cottage uses an open front and side for visibility. Percy can be petted without advancing dinner.

The soundtrack uses fresh arrangements of “Ach synku, synku,” “Já do lesa nepojedu,” and “Prší, prší.” The same melody data drives Hana’s humming and the background music. The title, meadow, and dinner use “Ach synku, synku,” the woodland uses “Já do lesa nepojedu,” and the brook uses “Prší, prší.” The title uses a lower clarinet lead. Animal conversations retain their distinct original themes.

Locally bundled violin, clarinet, plucked double bass, and tambourine recordings come from VSCO 2 Community Edition under CC0. Source links, tuning information, file hashes, and licensing are in `public/assets/audio/`. Music waits up to 1 second for the recordings before beginning with synthesized instruments if loading is still in progress. If samples fail to load, the same melodies play through synthesized instruments, and the game displays a short status message. Instrument notes have gentle attacks and releases, stereo placement, and a short shared room effect. The fairy teaches each melody using recorded “la” syllables sung by buggly, released under CC0. Three edited samples retain the singer’s natural onset and pitch movement, with crossfaded sustain loops for longer notes. The fairy sings an octave below Hana to keep the recording near the singer’s range. Hana answers with a softer synthesized hum. If samples aren’t available, the fairy uses the previous synthesized vowel voice. There’s no lyric track. Music follows the browser’s audio clock. Performance completion follows elapsed game time, independently of sound or mute, while movement clamps a stalled frame to avoid jumps.

Each animal has three original conversations in Czech and English. A new walk picks a random starting conversation for each animal. Revisiting an animal cycles through its three conversations before repeating. Changing language keeps the current conversation and selected reply. The exchanges explore fairness, knowledge, kindness, and life at home, without scoring Hana’s answers.

The title plays on Pec and the Czech word *pec*, an oven. The mountain town, Krkonoše setting, trail-marking tradition, and regional food are real. The route, forest gardens, fairy characters, and philosophical conversations are invented for the game. The goddess is an original Slavic-inspired character, rather than a depiction of a named historical deity. Hana gathers potatoes from planted gardens. Fairy tears water her garden. They aren’t presented as an ingredient in a traditional recipe.

- [The Eastern Krkonoše municipal association](https://vychodnikrkonose.cz/informace/clenske-obce/pec-pod-snezkou) records the town’s early smelting-furnace history.
- [Pec pod Sněžkou’s official visitor website](https://www.pecpodsnezkou.cz/) describes local walks, mountain meadows, valleys, and forests.
- [The Krkonoše region’s traditional cuisine](https://www.krkonose.eu/tradicni-gastronomie) documents kyselo, a regional sourdough soup with mushrooms and potatoes, and other local potato dishes.
- [The Czech Tourist Club’s marking system](https://kct.cz/turisticke-znaceni/system-turistickeho-znaceni/) describes the colored stripe between white stripes used on Czech walking trails. The game uses blue blazes as a visual reference.
- [The regional tourism office’s autumn stories](https://www.krkonose.eu/en/autumn-trips-krkonose) describe Krakonoš and the mountain landscape. The conversations in the game are original writing, not traditional sayings or folk quotations.

The game map isn't a real hiking map. Czech text includes diacritics and English translations. Native-speaker editorial review hasn't been performed.
