# Game evolution handoff

Status, October 20: attempt 02 completed the steps below, apart from what its progress record lists as remaining. Read `evidence/game-evolution/attempt-02/PROGRESS.md` (local only) before acting on anything here.

October 20, 2026. Attempt 01 stopped at a clean point because the session's context was filling. Work is on the local branch `game-evolution`, committed and pushed at the owner's request. The authority is still [the implementation plan](game-evolution-implementation.md). Local evidence is under `evidence/game-evolution/attempt-01/` (gitignored, so it exists only on this Mac). Read its `PROGRESS.md` first.

## How the branch is organized

1. The first commit records the inherited uncommitted work exactly as it was when this attempt started (the earlier storybook character upgrade, its scripts, and the planning documents). Its file list matches `evidence/game-evolution/attempt-01/starting-status.txt`, and its contents come from the pre-edit copies in `baseline/`.
2. The second commit holds this attempt's work. `git diff HEAD~1` shows only what attempt 01 changed.

## Status by milestone

| Milestone | State | Evidence so far |
| --- | --- | --- |
| M1 quizzes | Model, entry point, interface, and all 12 bilingual quizzes are done. Quiz props in the 3D world belong to the visuals work below. | `tests/game.test.js`, `tests/sequences.test.js`, `tests/title-screen.test.js`, `tests/quizzes.test.js`; `content-review/` (answer enumeration, source check, proofreading notes) |
| M2 clearings and restorations | Music stages and the `restoration-finish` moment are done and tested. Clearing art, chapter palettes, and restoration choreography are the visuals work. | `tests/audio.test.js` (same-tune loop handoff, variants), entry tests for each garden |
| M3 singing and household | Practice spots, practice Scene select entries, practice and household cues, and the supper presentation are done and tested. Practice-spot visuals and the supper window callback are the visuals work. | `tests/audio.test.js`, `tests/title-screen.test.js` |
| M4 endings and interactions | Folded map, Show guidance preference, and John’s salt line are done. Goddess embroidery frame, dance window callback, and gathering refinement are the visuals work. | `tests/title-screen.test.js` guidance test |
| M5 continuation | `src/save.js` and its integration are done: Continue, New walk, Return, Play without saving, Reload, checkpoints, conflict and failure panels, all status variants, sound intent and states, video sound intent. | `tests/save.test.js` (38), `tests/continuation.test.js` (26), mutation results in `save-module/` |
| World visuals | Not yet visible in the game. Tested logic and procedural art exist as unconnected modules: `src/palette.js` (chapter colors without drift), `src/restoration.js` (garden choreography states), `src/quiz-props.js` (when and how the 12 quiz props show), `src/prop-art.js` (one canvas atlas plus a ridge texture, never rendered or inspected), and `src/clearings.js` (placements with clearance). `src/world.js` and `src/finale-scene.js` are unchanged from the starting state. | `tests/palette.test.js`, `tests/restoration.test.js`, `tests/quiz-props.test.js`, `tests/clearings.test.js`; two mutation proofs in `visuals/mutants/` |

Handoff verification, each run alone: `npm test` exited 0 with 245 passed and 0 failed (`handoff-tests-01.log`). The build exited 0 with 28 modules and the existing large-bundle warning (`handoff-build-01.log`, output in `build-handoff/`). `git diff --check` exited 0 with an empty log. No browser check of the new behavior has run yet.

## What a fresh session must still do

1. Read the plan, this handoff, and `PROGRESS.md`. Run `npm test`, `npm run build -- --outDir <task-owned dir> --emptyOutDir`, and `git diff --check` as three separate commands with their own logs.
2. Wire the world visuals into `src/world.js`, in this order, under the plan's art and performance rules:
   - Outdoor palette: register outdoor scenery materials once after construction, skipping additive glows, characters, fairy and creature sprites, potato items and plants, garden rings, beds, flowers, halos, rain, and the fence. Replace the per-frame `scene.background.set` with a palette-registered outdoor color and a fixed indoor color. Call `palette.apply(chapterFor(game))` each frame; it does nothing unless the chapter changed.
   - When removing trees for the meadow opening, keep the seeded scenery identical: still record a skipped tree's spot and draw the same random numbers (6 for a birch, 1 for a fir). Put any new low-plant skip after the size roll.
   - Woodland garden first, inspected at beginning, middle, cancellation, completion, and settled state through a capture-only stage page in `visuals/`. Then meadow and cottage.
   - Quiz props grouped per quiz, anchored 1.5 units in front of whichever of Hana and the animal is nearer the camera; practice markers and responses; window callbacks (hidden in the dance wherever they overlap `projectorBounds`); supper steam and warm stove versus cool window light; the goddess embroidery frame; gathering cues (contact at progress 0.27 to 0.5, soil at 0.36 to 0.6, a short landing cue on the basket rim after completion). Existing poses cover the gathering motion, so no new painted art is needed there.
   - Mountain backdrop: the fixed 30° camera never shows a horizon, so a world-placed ridge is either off-screen or inside the walkable area. Use a camera-fixed band in the top fifth of the view at forward distance camera height × cos(30° − θc)/sin(θc) with θc = 19.5°, hidden below its ground intersection, fading in with `dt` when Hana is north of the meadow line and snapping under reduced motion. If the procedural ridge looks wrong, route an exact prompt to a Codex image-generation agent.
   - Captures at desktop, 390×844, and 844×390, then `tools/perf.mjs` five times against `perf-baseline.json`.
3. Design-guard mutations still owed at the entry point: correct option always first, third choice ignored, unanswered close advancing rotation, practice entering restoration rewards, music using frame time, and title or study mode writing a save. Run them on copies, never the shared files. The save module's four guards and the quiz content guards already ran.
4. Freeze a production build and its source hashes, then run the browser checks through `evidence/game-evolution/attempt-01/tools/` (Playwright from the Codex runtime, no installation) and the built-in browser:
   - Two real tabs on one origin: two compare-and-write transactions from the same revision (exactly one commits), another tab's write between reread and put, request success then abort, and a higher-version open from another tab against a playing first tab.
   - Sound under normal autoplay rules with real keyboard and touch input, including hydrated-on Continue and saved-off Continue. A permissive or already-unlocked browser doesn't count.
   - All 36 quiz results in the real interface in both languages, the keyboard path through answer, result, sources, and Continue, offline source summaries, 390×844 and 844×390 in both languages, and 200% zoom.
   - Reduced motion and muted play through quiz, restoration, practice, care, supper, and endings.
   - F01 routes: one natural full walk with quizzes and practice, one skipping every animal, both endings.
   - R01: `tools/perf.mjs` against the frozen build, compared with `perf-baseline.json`.
5. Update `README.md` (quizzes, continuation and its local-storage limits, controls, source credits, the existing online video) and the plan's milestone status.
6. Run the review gate: read `~/prefs/references/review-procedure.md` and `cross-review.md`, check `~/prefs/bin/cross-review status`, and run correctness and design with `--deep` against the same frozen state. The cross-review packet limit is 256 KB, and this diff is large. Measure it first; if it won't fit, ask the owner how to proceed rather than trimming the subject silently. Resolve under the two-pass cap.

## Decisions made in attempt 01

- Quiz titles drop the pack's trailing field period, because they're headings and selector labels. Question-mark titles keep it.
- Question text is shown without the pack's wrapping quotation marks.
- `answerQuiz(game, optionId, quizId)` requires the quiz id, so an event without one is ignored.
- Practice spots: Birch hollow (−20.5, −3), Meadow rise (−2.5, −32.8), Brook bend (25.6, −7.5). Each is at least 5.7 units from every existing target.
- Supper presentation: real serving shows a 1.6-second settled supper with Continue; Escape also continues; prepared endings skip it.
- A storage failure leaves the store in `normal` mode with `available: false`; main derives the “couldn't be saved” status from that.
- An intentional abort refused with `InvalidStateError` no longer counts as intentional. The transaction's own terminal event decides, so an abnormal close during a committing write is a failure and a waiting Return cancels.
- After Play without saving, a latched conflict no longer drives the unsaved walk's status.
- Walk again on an unsaved or study walk now asks for confirmation, as the common New walk flow requires.

## Open editorial items for the owner

- No native Czech speaker has reviewed the new copy. The content subagent's least-certain lines are in `content-review/proofreading-notes.md`.
- The mushroom source's real title is “Wild Edible Mushrooms in the Blue Mountains.” It's kept as the link label for accuracy; the game gives no foraging advice.
- Musical quality of the new stages and cues hasn't had a listening check.
