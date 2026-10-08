# Co se v Peci peče?

**What’s cooking in Pec?**

A gentle, sprite-based 3D browser adventure set in an imagined forest above Pec pod Sněžkou. Play as Hana, gather 6 potatoes, sing with 3 fairies for their tears of joy, and return to the cottage for supper. Talk with a fox, an owl, and a deer through short philosophical conversations. The Czech/English switch translates the whole game and preserves your progress.

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
| E at the cottage | Finish after gathering all the gifts |
| M | Open or close the map |
| H | How to play |
| Esc | Pause or close the current panel |

The game starts in Czech. Choose “English” on the title screen or during play to switch languages. Touch screens have directional buttons and an action button. Use the title screen’s sound button to hear the opening theme. Music can also begin with your first click or keypress in the introduction. The sound button can mute it, and starting or replaying keeps your choice. The map shows every remaining gift and Hana’s position. Conversations can be revisited and don't have right or wrong answers. There's no combat, time limit, or failure penalty.

## Build and checks

```sh
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. Serve it with an HTTP server, such as the preview command. Opening `index.html` as a local file won't run the module-based game.

On macOS, `node launcher/start-game.mjs` opens the production build in your default browser and starts the local preview server if needed. Run `npm install` and `npm run build` first.

## Art and cultural notes

All sprite art is original, drawn in code onto small canvas textures. Three.js places the sprites in a 3D scene with depth, paths, a brook, and an orthographic camera. The world renders at the viewport size with smooth edges. Shaded sprites and rounded scenery carry the classic console feel without pixelating the image. An original 32-bar title waltz combines a woodwind melody, warm horn tones, strings, and plucked notes. Starting the walk switches to a separate 3/4 tune with woodwind, bass, and plucked chords. Hana’s song uses airy choir tones. The fox, owl, and deer each have a longer theme with their own melody and accompaniment. Music and collection sounds are synthesized locally through the browser.

The title plays on Pec and the Czech word *pec*, an oven. The mountain town, Krkonoše setting, trail-marking tradition, and regional food are real. The route, forest gardens, fairy characters, and philosophical conversations are invented for the game. Hana gathers potatoes from planted gardens. Fairy tears water her garden. They aren't presented as an ingredient in a traditional recipe.

- [The Eastern Krkonoše municipal association](https://vychodnikrkonose.cz/informace/clenske-obce/pec-pod-snezkou) records the town’s early smelting-furnace history.
- [Pec pod Sněžkou’s official visitor website](https://www.pecpodsnezkou.cz/) describes local walks, mountain meadows, valleys, and forests.
- [The Krkonoše region’s traditional cuisine](https://www.krkonose.eu/tradicni-gastronomie) documents kyselo, a regional sourdough soup with mushrooms and potatoes, and other local potato dishes.
- [The Czech Tourist Club’s marking system](https://kct.cz/turisticke-znaceni/system-turistickeho-znaceni/) describes the colored stripe between white stripes used on Czech walking trails. The game uses blue blazes as a visual reference.
- [The regional tourism office’s autumn stories](https://www.krkonose.eu/en/autumn-trips-krkonose) describe Krakonoš and the mountain landscape. The conversations in the game are original writing, not traditional sayings or folk quotations.

The game map isn't a real hiking map. Czech text includes diacritics and English translations. Native-speaker editorial review hasn't been performed.
