# Co se v Peci peče?

**What’s cooking in Pec?**

A gentle, illustrated browser adventure set in an imagined forest above Pec pod Sněžkou. Play as Hana, gather 6 potatoes, learn familiar Czech songs from 3 fairies, and restore gardens along a winding forest loop. Answer short quizzes from a fox, an owl, a deer, and a badger, each built on an established fact or a well-known thought experiment. Sing again at three scenic spots if you like. Come home to Hana’s husband John, their infant son Aldo, and Percy the seal point tabby, then prepare, cook, and serve dinner. After supper, choose the family dance or Hana’s transformation into a Slavic goddess. In the dance ending, John pulls down a projector screen for Karel Gott’s “Mám styl Čendy,” and Hana, John, Aldo, and Percy dance together. Both endings are also available in Scene select. The Czech/English switch translates the whole game and preserves your progress.

## Play locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. The game runs entirely in the browser. The forest, household chapter, and original goddess ending work offline once installed. The dance ending loads an online YouTube video and needs an internet connection. No account is required. The game saves your completed steps in this browser, so you can continue a walk later.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Walk in the direction shown on screen |
| E | Gather a nearby potato or answer an animal’s quiz |
| E near a fairy | Listen, then automatically hum her song to learn it and receive a tear |
| E at a garden | Choose a learned song to restore it |
| E at a singing spot | Sing a learned song again and hear a small reply |
| E at the cottage | Go inside after gathering all gifts and restoring all 3 gardens |
| E inside | Greet John, visit Aldo, prepare the potatoes, cook, and serve dinner |
| M | Open or close the map |
| H | How to play |
| F2 | Open or close Scene select |
| Esc | Stop an unfinished song, pause, or close the current panel |

The game starts in Czech. Choose “English” on the title screen or during play to switch languages. Touch screens have directional buttons and an action button. Use the title screen’s sound button to hear the opening theme. Music can also begin with your first click or keypress in the introduction. The sound button can mute it, and starting or replaying keeps your choice. The forest map shows available potatoes, fairies, restoration sites, and Hana’s position. A wrong song offers a clue and consumes nothing. Movement, pause, or losing focus stops an unfinished performance. Learned songs are reusable, and restored gardens stay restored. Two potatoes appear only after their garden is restored. The final rain song needs all 3 tears, and the tears remain in the inventory as keepsakes. Inside, it becomes a room plan with the five dinner steps. Release the action button between household tasks. Quizzes are optional and never block supper or either ending. A wrong answer costs nothing and comes with an explanation. Singing spots award nothing. The pause menu’s “Guidance” switch hides the optional goal details once you know the way, while prompts, the map, pause, sound, and language stay available. After serving, supper settles on the table, and “Continue” leads to the ending choice. There’s no combat, time limit, or failure penalty. The reduced-motion setting keeps the scenery still, lowers the projector immediately, and holds the family in still poses. It also shows the original goddess without the animated rise. Changing the setting during play takes effect immediately.

## Saving your walk

The game keeps one saved walk in this browser, using its local database (IndexedDB). It saves after each completed step: a gathered potato, a learned song, a restored garden, a quiz you’ve answered and closed, a household task, or a change to language, sound, or guidance. An unfinished song or action isn’t saved, and a reward is never given twice. The title screen offers “Continue” when a valid saved walk exists, and “New walk” asks before replacing it.

The save stays with this browser and this address. Another browser, a private window, clearing site data, or opening the game from a different address or port may not find it, and there’s no account or cloud copy to recover it from. If saving fails, play continues and the game says that progress isn’t being saved. “Play without saving” starts a walk that won’t be saved at all. If two tabs play at once, the first to save keeps the slot, and the other tab says another tab saved a different walk instead of overwriting it.

## Study a scene

Choose “Scene select” on the title screen, pause menu, or either ending, or press F2. Choose a fairy, a garden, a singing spot, an animal quiz, a household task, or an ending. The game prepares the songs and supplies needed for the chosen scene. Each animal has a menu for its three questions. A prepared scene is a study, and progress there isn’t saved. Your saved walk stays available through “Return to saved walk.” Closing the panel resumes the previous scene without changing progress. Language and sound choices carry across scene changes.

## Family dance

John lowers the screen before Karel Gott’s [1984 live performance of “Mám styl Čendy” (“I’m Still Standing”)](https://www.youtube.com/watch?v=DrQMROGD-EE) starts. Hana and John sway and step, Aldo waves and kicks from his cot, and Percy prances. The family’s dance follows actual video playback and pauses with it. Game music stops during the finale. Sound, language, replay, scene selection, and a new walk remain available.

The video uses YouTube’s embedded player and isn’t downloaded or included in the repository. The player loads only during the dance ending. Browser autoplay rules may require pressing “Play video.” If YouTube is unavailable or embedding is blocked, the game offers a retry and a link to the performance. Leaving the ending destroys its player. Reduced motion affects the game’s animation, not the recorded performance.

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

Each clearing has its own look. The birch grove has pale trunks around soft shafts of light, the open mountain meadow looks out to a painted Krkonoše ridge with Sněžka, and the brook has dark roots and still reflections. Outdoor light follows Hana’s progress rather than the clock: morning, warmer light, late afternoon, then early evening as each garden is restored. Each garden answers its song note by note. In the woodland, branches unwind and mushrooms lift their caps. In the meadow, a wave crosses the grass before the flowers open. At the cottage, rain reaches the fence, the leaves, and a watering can, and the garden stays watered. Stopping a song early lets the garden ease back. Each quiz has small illustrated props, such as the fox’s three baskets or the owl’s cards, that restate the question without hinting at the answer. Animals Hana answered may look in through the windows at supper. Hana’s embroidery opens into a brief frame for the goddess ending. These props share one texture painted in code.

Fir and birch trunks have distinct bark, tapered profiles, and moss around flared roots. Occasional breezes move the branches and nearby plants while trunks stay rooted. Hana listens to each fairy before answering with six painted singing poses, including hand gestures, mouth changes, and closed eyes. A glowing tear descends from the fairy and floats into a small glass jar beside Hana when the song is learned. The jar fills with each tear, closes with a cork, and tucks away after collection. Potatoes stay in her basket. Reduced motion keeps branches still, uses steady listening and singing poses, and shows the tear without travel.

Original painted character sheets and portraits were generated for the game. Owner-supplied photos informed Hana, John, and Percy’s appearance. The photos themselves aren’t distributed. Hana has golden hair with darker roots, a braid, and an embroidered blouse. John has sandy-blonde swept hair and a neat short beard, following the later photo reference. Percy has an ivory body, striped points, a ringed tail, and pale blue eyes. The character folder records the generation prompts. Other illustrated textures are drawn in code.

Hana has four directions and eight walking frames per direction, plus separate six-frame gathering and petting sequences, singing, preparing, cooking, serving, and goddess poses. Her walk includes passing steps and a body rise timed to each footfall. Idle frames add blinking and slight cloth movement. John greets Hana and sits for supper. All three fairies and four forest animals use detailed painted sheets with three animation frames each. Fairies keep fluttering after teaching their songs. Animals turn their heads, face Hana, and breathe. The cottage uses an open front and side for visibility. Percy can be petted without advancing dinner.

The soundtrack uses fresh arrangements of “Ach synku, synku,” “Já do lesa nepojedu,” and “Prší, prší.” The same melody data drives Hana’s humming and the background music. The title, meadow, and dinner use “Ach synku, synku,” the woodland uses “Já do lesa nepojedu,” and the brook uses “Prší, prší.” The title uses a lower clarinet lead. Animal quizzes retain the animals’ distinct original themes. Each restored garden adds one quiet accompaniment part, which joins at the start of the next loop of the melody. Household steps and singing-spot replies add short cues built from the same melodies.

Locally bundled violin, clarinet, plucked double bass, and tambourine recordings come from VSCO 2 Community Edition under CC0. Source links, tuning information, file hashes, and licensing are in `public/assets/audio/`. Music waits up to 1 second for the recordings before beginning with synthesized instruments if loading is still in progress. If samples fail to load, the same melodies play through synthesized instruments, and the game displays a short status message. Instrument notes have gentle attacks and releases, stereo placement, and a short shared room effect. The fairy teaches each melody using recorded “la” syllables sung by buggly, released under CC0. Three edited samples retain the singer’s natural onset and pitch movement, with crossfaded sustain loops for longer notes. The fairy sings an octave below Hana to keep the recording near the singer’s range. Hana answers with a softer synthesized hum. If samples aren’t available, the fairy uses the previous synthesized vowel voice. There’s no lyric track. Music follows the browser’s audio clock. Performance completion follows elapsed game time, independently of sound or mute, while movement clamps a stalled frame to avoid jumps.

Each animal asks three questions in Czech and English, 12 in all. The fox asks about probability, the owl about logic, the deer about forest biology, and the badger about classic thought experiments. A new walk picks a random starting question for each animal. An animal moves to its next question only after you answer and close it, whether the answer was right or not. Changing language keeps the question and your answer. Each result explains the answer, and “About the question” summarizes its sources. Source links open only when you choose them. No score is kept.

The title plays on Pec and the Czech word *pec*, an oven. The mountain town, Krkonoše setting, trail-marking tradition, and regional food are real. The route, forest gardens, fairy characters, and animal characters are invented for the game. The quiz facts and thought experiments come from the sources below. The goddess is an original Slavic-inspired character, rather than a depiction of a named historical deity. Hana gathers potatoes from planted gardens. Fairy tears water her garden. They aren’t presented as an ingredient in a traditional recipe.

- [The Eastern Krkonoše municipal association](https://vychodnikrkonose.cz/informace/clenske-obce/pec-pod-snezkou) records the town’s early smelting-furnace history.
- [Pec pod Sněžkou’s official visitor website](https://www.pecpodsnezkou.cz/) describes local walks, mountain meadows, valleys, and forests.
- [The Krkonoše region’s traditional cuisine](https://www.krkonose.eu/tradicni-gastronomie) documents kyselo, a regional sourdough soup with mushrooms and potatoes, and other local potato dishes.
- [The Czech Tourist Club’s marking system](https://kct.cz/turisticke-znaceni/system-turistickeho-znaceni/) describes the colored stripe between white stripes used on Czech walking trails. The game uses blue blazes as a visual reference.
- [The regional tourism office’s autumn stories](https://www.krkonose.eu/en/autumn-trips-krkonose) describe Krakonoš and the mountain landscape. The quiz wording and family dialogue are original writing, not traditional sayings or folk quotations.

Quiz sources:

- [University of Illinois, The Monty Hall Problem](https://discovery.cs.illinois.edu/learn/Prediction-and-Probability/The-Monty-Hall-Problem/) and [MIT OpenCourseWare, class 3 solutions](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/mit18_05_s22_class03_pset_sol.pdf), for the fox’s baskets.
- [MIT OpenCourseWare, probability lecture 4](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/6oV3pKLgW2I_transcript.pdf), for the fox’s coins.
- [University of California, Santa Barbara, social reasoning research](https://www.cep.ucsb.edu/wp-content/uploads/2023/05/Socialreas.pdf), for the owl’s card questions.
- National Park Service lichen pages for [Acadia](https://www.nps.gov/acad/learn/nature/lichens.htm) and [Grand Teton](https://home.nps.gov/grte/learn/nature/lichen.htm), and [Matter in motion](https://home.nps.gov/teachers/classrooms/matter-in-motion.htm), for the deer’s lichen and leaf questions.
- [United States Forest Service, “Wild Edible Mushrooms in the Blue Mountains”](https://research.fs.usda.gov/treesearch/download/5106.pdf), for the deer’s mushroom question. The game explains what a mushroom is and gives no foraging advice.
- Stanford Encyclopedia of Philosophy entries on [relative identity](https://plato.stanford.edu/entries/identity-relative/) and the [sorites paradox](https://plato.stanford.edu/entries/sorites-paradox/), and the Internet Encyclopedia of Philosophy entry on [the experience machine](https://iep.utm.edu/experience-machine/), for the badger’s questions.

The game map isn't a real hiking map. Czech text includes diacritics and English translations. Native-speaker editorial review hasn't been performed, including for the Czech quiz text.
