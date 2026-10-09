# Co se v Peci peče?

**What’s cooking in Pec?**

A gentle, illustrated browser adventure set in an imagined forest above Pec pod Sněžkou. Play as Hana, gather 6 potatoes, and sing a different song with each of 3 fairies along a winding forest loop. Talk with a fox, an owl, a deer, and a badger through short philosophical conversations. Come home to Hana’s husband John and their infant son Aldo, then prepare, cook, and serve dinner. After supper, Hana glows, rises gently, and becomes a pagan Slavic goddess. The Czech/English switch translates the whole game and preserves your progress.

## Play locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. The game runs entirely in the browser. Once installed, it doesn't need an account, a connection to any game service, or downloaded artwork. Reloading begins a fresh adventure.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Walk in the direction shown on screen |
| E | Gather a nearby potato or talk with a creature |
| Hold E while standing still | Sing with a fairy for 2 seconds |
| E at the cottage | Go inside after gathering all the gifts |
| E inside | Greet John, visit Aldo, prepare the potatoes, cook, and serve dinner |
| M | Open or close the map |
| H | How to play |
| Esc | Pause or close the current panel |

The game starts in Czech. Choose “English” on the title screen or during play to switch languages. Touch screens have directional buttons and an action button. Use the title screen’s sound button to hear the opening theme. Music can also begin with your first click or keypress in the introduction. The sound button can mute it, and starting or replaying keeps your choice. The forest map shows every remaining gift and Hana’s position. Inside, it becomes a room plan with the five dinner steps. Release the action button between household tasks. Forest conversations can be revisited and don’t have right or wrong answers. There’s no combat, time limit, or failure penalty. The reduced-motion setting keeps the scenery still and shows a glowing goddess without the animated rise. Changing the setting during play takes effect immediately.

## Build and checks

```sh
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. Serve it with an HTTP server, such as the preview command. Opening `index.html` as a local file won't run the module-based game.

On macOS, `node launcher/start-game.mjs` opens the production build in your default browser and starts the local preview server if needed. Run `npm install` and `npm run build` first.

## Art and cultural notes

All sprite art is original, drawn in code onto canvas textures. Three.js arranges the illustrations in layers with depth, paths, a brook, and an orthographic camera. The world renders at the viewport size with smooth edges. The visual direction is a contemporary illustrated 2D woodland, with matte foliage, expressive faces, shaped hands and paws, detailed clothing, and layered undergrowth. Trees and plants sway gently, ripples travel along the brook, and the fairies flutter their wings. The cottage has a furnished kitchen, John, and Aldo in his cot. Hana’s goddess form wears a floral crown and an embroidered dress, surrounded by a soft golden glow.

An original 32-bar title waltz combines a woodwind melody, warm horn tones, strings, and plucked notes. Starting the walk switches to a separate 3/4 tune with woodwind, bass, and plucked chords. Hana’s synthesized solo voice uses changing vowel resonances, breath, gentle pitch slides, and delayed vibrato. It isn’t a human recording. Each fairy has a distinct melody and rhythm, and each animal has its own conversation theme. Music and collection sounds are synthesized locally through the browser.

Each animal has three original conversations in Czech and English. A new walk picks a random starting conversation for each animal. Revisiting an animal cycles through its three conversations before repeating. Changing language keeps the current conversation and selected reply. The exchanges explore fairness, knowledge, kindness, and life at home, without scoring Hana’s answers.

The title plays on Pec and the Czech word *pec*, an oven. The mountain town, Krkonoše setting, trail-marking tradition, and regional food are real. The route, forest gardens, fairy characters, and philosophical conversations are invented for the game. The goddess is an original Slavic-inspired character, rather than a depiction of a named historical deity. Hana gathers potatoes from planted gardens. Fairy tears water her garden. They aren’t presented as an ingredient in a traditional recipe.

- [The Eastern Krkonoše municipal association](https://vychodnikrkonose.cz/informace/clenske-obce/pec-pod-snezkou) records the town’s early smelting-furnace history.
- [Pec pod Sněžkou’s official visitor website](https://www.pecpodsnezkou.cz/) describes local walks, mountain meadows, valleys, and forests.
- [The Krkonoše region’s traditional cuisine](https://www.krkonose.eu/tradicni-gastronomie) documents kyselo, a regional sourdough soup with mushrooms and potatoes, and other local potato dishes.
- [The Czech Tourist Club’s marking system](https://kct.cz/turisticke-znaceni/system-turistickeho-znaceni/) describes the colored stripe between white stripes used on Czech walking trails. The game uses blue blazes as a visual reference.
- [The regional tourism office’s autumn stories](https://www.krkonose.eu/en/autumn-trips-krkonose) describe Krakonoš and the mountain landscape. The conversations in the game are original writing, not traditional sayings or folk quotations.

The game map isn't a real hiking map. Czech text includes diacritics and English translations. Native-speaker editorial review hasn't been performed.
