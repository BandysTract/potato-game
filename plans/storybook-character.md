# Storybook character implementation plan

The next upgrade should make the fairy encounters, forest conversations, and family homecoming feel more personal. Keep the gentle Czech woodland adventure, its affectionate family humor, and its unhurried play. Spend the work on framing, expressive actions, a warmer cottage, and connections between the forest and evening.

## Status and authority

- Status: five outcomes implemented and locally verified under the October 18 execution request. Implementation and the two-pass cross-provider gate are complete. The pass-2 phone-ending blocker was fixed and verified afterward, with no third review. Remaining human/device limits and report-only notes are recorded. Planning review completed through pass 2. Detailed acceptance evidence and limits: `evidence/storybook-character/attempt-01/VERIFICATION.md`.
- Created: October 18, 2026.
- Repository: `/Users/johncampbell/Documents/ChatGPT/Potato game 2`.
- Inspected baseline: commit `deb1b5c8255975d51bf0f295d1c92c58bc9b838f` on `main`.
- User request: “Write this up as a plan, then run it through the cross-provider reviewer gate and then edit in place accordingly. The goal is a robust, detailed plan a fresh session can execute on independently.”
- The requested output is the reviewed plan. Editing the plan in place doesn’t authorize implementing the game, committing, pushing, publishing, rebuilding the desktop app, installing dependencies, or running local models.
- A later instruction to execute the plan authorizes its local code, artwork, and verification work, subject to then-current instructions and permissions. Commit, push, publication, installation, and local model execution still need their own authority.
- The plan is the execution entry point for the upgrade. Older `PLAN.md` and evidence folders describe earlier work. Use them for specific evidence, not as current task authority.
- Pre-existing untracked `scripts/` belongs to earlier work. Preserve it. The plan must remain executable without those scripts.

## The five outcomes

1. **Closer fairy encounters.** The camera frames Hana and the fairy together. During the song and gift, the interface gives the encounter room while keeping cancellation and navigation available.
2. **A warmer homecoming.** The cottage matches the painted characters more closely. John visibly helps with supper, and household guidance names the next action without presenting family time as a numbered chore list.
3. **More characterful conversations.** The four animals retain their philosophical questions, but have clearer individual voices, shorter exchanges, and endings that allow humor or uncertainty. Hana and the animal remain visible during conversation.
4. **A family dance with individual personalities.** Hana and John have dedicated dance poses. Percy has a playful interruption. Aldo remains safely in his cot. The family visibly responds to one another.
5. **An evening that remembers the forest.** Aldo’s existing lullaby choice produces a short humming performance. The goddess reveal echoes the fairies’ visual language. The ending choice grows out of a family exchange and still clearly offers both endings.

These are proposed implementation decisions. The owner has requested their conversion into an executable plan, not verified the finished appearance.

## Preserve the game contract

Keep all of the following through every milestone:

- Gather 6 potatoes, learn 3 songs, receive 3 fairy tears, restore the same 3 gardens, and pass the existing cottage entrance requirements. Tears stay as keepsakes. Songs remain reusable.
- Keep the current forest layout, walking speed, collisions, interaction reach, song lengths, and action completion rules. Don’t add combat, deadlines, failure penalties, scored dialogue answers, or new mandatory errands.
- Keep all four animals, three conversations per animal, and two complete reply branches per conversation. Conversations stay optional. A new walk randomizes starting questions, and revisits rotate before repeating.
- Preserve the household order: John, Aldo, preparation, cooking, and serving. Petting Percy stays optional and never advances supper.
- Preserve Czech as the default and the complete English switch. Switching language preserves progress, selected reply, current scene, sound preference, and any new presentation moment.
- Keep keyboard and touch play, map/help/pause, focus recovery, Scene select, F2/Escape behavior, replay, and live reduced motion. Retain native selector keyboard behavior.
- Preserve both endings during normal play and through Scene select. The family dance keeps Karel Gott’s current embedded performance. Don’t replace, download, bundle, or seek a new recording.
- The forest, cottage, and goddess ending remain local and offline after installation. Only the existing dance video uses YouTube. Add no account, analytics, remote service, dependency, or local model.
- Preserve owner likeness cues from the existing distributed art. Don’t search for or bundle source family photos. Use current game assets as references for new art.
- Preserve existing source assets and historical evidence. Add new filenames and switch explicit references. Remove only temporary files created by the implementation session.

## What the current code does

Recheck these anchors before editing. Function names are navigation aids, not a substitute for opening the files.

| File | Role and relevant boundary |
| --- | --- |
| `src/game.js` | Owns inventory, song learning/restoration, interaction rules, household progress, and conversation completion. `completeSong()` awards a tear. `finishConversation()` advances John/Aldo. `completeAction()` moves serving directly to `phase: 'won'`. |
| `src/main.js` | Owns overlays, input clearing, `dialogueChoice`, scene replacement, sound controls, focus handling, `beginEnding()`, and the animation loop. The entry point is the place to coordinate new presentation moments without changing reward rules. |
| `src/world.js` | Draws the forest and cottage, follows Hana with the camera, shows existing tear/jar animation, poses household characters, and performs the goddess transformation. `surfaceTexture()` supplies cottage wood, plaster, cloth, and window surfaces. Ordinary song encounters currently use the normal walking camera. |
| `src/forest-art.js` | Supplies procedural painted textures, bark, tear/jar art, and breeze helpers. Reuse appropriate texture methods for cottage materials. |
| `src/sprites.js` | `aldoCot()` draws the cottage's static 384×300 baby/cot texture. `createSpriteTextures()` builds the maps, and `maps.dispose()` handles textures and arrays. These are separate from the finale's private animated baby drawing. |
| `src/characters.js` | Loads painted sheets and prepares textures once. Uses consistent size groups and a median foot anchor where configured. New atlases must satisfy its actual cell and fitting rules. |
| `src/animation.js` | Provides short pose crossfades and frame selection. Preserve loop length, exact stills, and bounded texture allocation. A crossfade isn’t a newly painted pose. |
| `src/ui.js`, `src/style.css` | Render localized panels, dialogue choices/results, house progress, song status, focus, and touch controls. Current dialogue obscures and blurs the scene. The household panel says “Step {step} of 5.” |
| `src/dialogues.js`, `src/i18n.js` | Hold both-language dialogue and interface copy. Aldo already has a text choice to hear a woodland tune. Don’t present adding the choice itself as new work. |
| `src/audio.js`, `src/songs.js` | Schedule music and voices. `songPhrase()` supplies melody and duration. `audio.tick()` currently admits active song performances only outdoors. Text about humming doesn’t currently trigger a household vocal performance. |
| `src/finale-scene.js` | Composes the projector and family. Hana uses singing art, John uses greeting/idle art, and Percy uses existing cat poses. `game.danceTime` drives the dance. |
| `src/finale.js` | Owns YouTube loading, actual playback state/time, mute, retry, and cleanup. Preserve its external-player contract. |
| `src/sequences.js` | `createSequenceGame()` prepares complete, playable scenes and supplies. Keep existing IDs and prerequisites. |

Baseline verification for the planning task: `npm test` exited 0 with 130 tests passing and no failures. `npm run build` exited 0. The existing warning about a bundle over 500 kB remains. Logs are in `reviews/storybook-character-plan/baseline/`. These checks establish the starting code, not the proposed upgrade.

Previous animation evidence is in `evidence/animation-fluidity/VERIFICATION.md`. It records rejected optical-flow experiments, rejected denser walking art, and limits on physical phone performance. Keep those decisions intact. Don’t revive rejected approaches because their files still exist.

## Start a fresh implementation session

1. Read the plan, current project instructions, and the current review references under `~/prefs/references/`. Check current authority before executing anything beyond local implementation.
2. Run `git status --short`, `git log -5 --oneline`, and inspect changes since the recorded baseline. Record the actual starting commit and dirty paths in a new attempt folder. Don’t overwrite, revert, or absorb unrelated changes. Stop only the affected work if another edit conflicts with a named contract.
3. Open the source anchors above. Confirm the current tears, household, ending, language, and focus paths still match. Update the plan’s implementation notes if code has moved. A baseline mismatch isn’t permission to restore old code.
4. Create `evidence/storybook-character/attempt-01/`, or the next unused attempt number. Save baseline screenshots, command logs, a source manifest, and an implementation checklist there. Keep failed attempts.
5. Run the baseline tests and build as separate commands, with separate output files and their own exit statuses. Investigate new failures before claiming a regression. Never infer a verdict from a pipe or the final lines alone.
6. Open a preview of the actual build. Sample Běla, one animal exchange, John, Aldo, preparation, and both endings through Scene select. Also walk from the cottage to the first encounters normally. Record viewport, browser, device, pixel ratio, and motion setting with captures.
7. Compare the proposed art with current source sheets before generation. Read the imagegen skill before using the image tool. No new family photos or local model loading are needed.

Keep the plan’s progress checklist current after each implemented and verified milestone. Put detailed execution evidence in the attempt folder so the plan stays readable.

## Shared presentation design

### Keep presentation separate from rewards

Use one bounded, transient presentation moment owned by `src/main.js`. A moment is a short animation coordinated across the view and sound. It never awards an item, changes a household step, or changes the chosen ending.

Use a plain object with stable identity for its lifetime: `kind`, `subjectId`, `elapsed`, and `duration`, with `songId` for a lullaby and a `focusReleased` flag for a fairy gift. Supported kinds are `fairy-gift`, `john-bowls`, `aldo-finger`, and `aldo-lullaby`. A lullaby also records the household step reached when it starts, so a deferred instruction can be discarded if the player has moved on. Keep at most one active moment. A small pure helper module, `src/moments.js`, may own creation and advancement so its lifecycle can be tested. Don’t add an event bus, queue, persistence, or a general cutscene framework.

Pass the same moment reference into the renderer and audio, and expose its relevant state through the UI view. Audio must admit only `aldo-lullaby` with the known woodland song during indoor play as a vocal source. It must ignore `fairy-gift`, `john-bowls`, and `aldo-finger` before calling `schedulePerformance()`, because they have no `songId`. Preserve the existing outdoor `game.activeSong` path. Don’t rebuild an equivalent object on every frame. Update the existing `world.update()` and `audio.tick()` callers and their test doubles together. Their exact current signatures are documented by the source, not by the proposed shape.

Use visible, unpaused elapsed time for new moments. A stalled visible frame may finish a short presentation moment. It must not add rewards, restart a voice, or move Hana farther. Continue to use the existing independent audio clock for sound scheduling and confirmed video time for dancing. Don’t replace the movement time clamp or derive video time from the new moment clock.

### Moment transitions and interruption rules

| Trigger | Start or change | Required result |
| --- | --- | --- |
| A real learning song finishes and the game gains a tear | Start `fairy-gift` for that fairy, 3.5 seconds | The gift, jar, camera hold, and quiet interface use one elapsed value. No simulated receipt when a prepared scene already has tears. |
| Hana moves after receiving the tear | Set `focusReleased` | Restore walking camera and guidance immediately. Let the tear/jar finish without taking back the reward or blocking movement. |
| John’s conversation is completed through Continue or normal conversation close | Start `john-bowls`, 2.4 seconds | John stacks two bowls onto a tray beside his existing position. The step advances through the existing model exactly once. |
| Aldo’s finger reply is completed | Start `aldo-finger`, 2.4 seconds | Show Hana’s offered hand and Aldo’s small response. No voice or new gameplay action. |
| Aldo’s humming reply is completed | Start `aldo-lullaby` using the opening `woodland` phrase | Show Hana humming toward the cot and play the same learned melody once. Duration comes from `songPhrase('woodland')`, not a duplicated number. |
| Movement during `john-bowls` | Keep the moment running | John completes the independent action while Hana walks toward Aldo. A new moment, scene replacement, or its own completion ends it. |
| Movement during either Aldo moment | Cancel the moment | Restore ordinary pose and sound without undoing the completed greeting or blocking the next task. Release any deferred lullaby instruction under the rule below. |
| A successful new gameplay interaction during `fairy-gift` | Finish its presentation before the new action or panel opens | A conversation, song picker, new learning song, or gathering action must not leave a frozen open jar visible. Keep the earned tear and learned song unchanged. An ineffective E press has no effect. |
| A new gameplay interaction during an Aldo moment | Cancel the moment and discard the deferred instruction | The new action owns its guidance. Don’t show the old preparation message over it. |
| Pause, help, map, Scene select, blur, or hidden document | Freeze the moment and its camera/poses. Pause its sound | Closing a panel resumes the same moment. Opening a guide may still cancel an unfinished learning song under the existing policy. |
| Language changes | Keep identity, elapsed time, and selected reply | Translate visible text without restarting motion or sound. |
| Scene jump, restart, ending start, graphics failure, or disposal | Clear the moment and retire its audio | A delayed completion can’t change the replacement game. Scene select close preserves the previous moment. |
| Reduced motion changes during a moment | Use the appropriate final still immediately | Keep the same gameplay state. Lullaby sound can continue. Don’t wait for a visual transition to finish. |

In `onAction('dialogueFinish')`, snapshot the conversation ID and selected reply before clearing them. Only create the matching home moment after the model has actually completed that household step. Close the dialogue before starting the moment, or explicitly preserve the newly created moment through overlay cleanup. Opening, translating, or redrawing a reply isn’t a performance trigger. No selected reply means no care performance, even though existing conversation closing can advance the step.

The fairy gift’s existing 2.8-second tear flight and 3.5-second jar lifetime should read the shared gift moment. Keep the current cork/tuck sequence. Remove the replaced inference from per-fairy learned-state changes so prepared scenes don’t manufacture a receipt. Don’t run two competing gift timers. On movement, only release framing. On cancellation by scene replacement, clear all gift art.

The ordinary play camera has lowest priority. An active animal conversation frames its pair. Family dialogue keeps the existing portrait, context, and overlay. After the family dialogue closes, an Aldo care moment may frame Hana and the cot. An active learning song frames Hana and the fairy. A gift holds the last pair unless framing was released. The ending composition takes precedence over all of them. A modal map/help/pause/admin panel preserves the camera underneath it. Any explicit scene jump chooses the destination’s initial camera directly.

## Milestone one fairy framing and quieter guidance

Likely files: `src/main.js`, `src/world.js`, `src/ui.js`, `src/style.css`, `src/i18n.js`, the new moment helper, and relevant tests.

1. During learning, frame the midpoint of Hana and the active fairy. Fit both complete figures and the visible gift/jar path inside the usable scene area. Account for the bottom action panel, top controls, and phone touch controls instead of choosing a desktop-only zoom distance.
2. Keep the same camera angle. Use a gentle approach and return during ordinary motion. Start with a roughly 0.6-second approach, then tune after viewing. Reduced motion changes framing immediately with no camera glide. A clipped hand, fairy wing, or jar path means the fit is wrong.
3. Quiet the basket’s destination line, region chip, duplicate toast, and repeated keyboard instructions during learning and the focused gift. Keep the sound, language, pause, and map controls reachable. Keep one concise song phase and the stop instruction visible. Preserve touch movement for cancellation and a useful accessible label on progress.
4. On gift receipt, announce the actual learned song and stored tear once. Don’t announce progress every frame. Hold the next-destination prompt until the gift finishes or Hana moves. Don’t wait for the audio device before completing a song.
5. Keep garden restoration available through the existing picker and duration. Don’t expand the new close framing into a new restoration mechanic.

Acceptance: F01, F02, L01, L02, A01, and A02 below.

## Milestone two cottage and family care

Likely files: `src/world.js`, `src/sprites.js`, `src/characters.js`, `src/main.js`, `src/audio.js`, `src/ui.js`, `src/style.css`, `src/dialogues.js`, and `src/i18n.js`. Reuse `surfaceTexture()` in `world.js` for cottage materials. Change `forest-art.js` only if an existing helper actually needs an extension.

### Cottage art

Keep the current room footprint, openings, furniture locations, clear central aisle, and interaction spots. Add painted wood and plaster variation, softer material colors, and warm window/stove accents. Use baked texture detail or existing material methods before adding real lights, dynamic shadows, or extra transparent layers.

Add only three small personal details: a folded baby blanket by the cot, a botanical print or embroidered hanging, and the bowl tray by John. Place them outside interaction approaches and the projector’s view. Reuse the cot and existing household scale. Don’t make the room busier with unrelated collectibles.

Replace the “Step {step} of 5” heading and segmented task bar with the heading “At home” alone. Inside the household guide panel, the existing destination line carries the current action exactly once. Remove its redundant “Next at home” kicker indoors. A nearby task’s separate interaction prompt may repeat the action. During the lullaby, the moment label replaces the destination line. Keep the cottage map’s numbered stops, which remain useful navigation. Update help and map wording only where it refers to the removed progress display. The underlying five steps stay intact.

### Family actions

- Give John a short, dedicated bowl-stacking action beside his current standing spot. Use the tray and two bowls as visible props. No walking route or collision change is needed. The tray’s settled state can derive from completed John progress. It resets on a new walk. Don’t move the interactive John target away from his rendered figure.
- Give Hana a quiet care pose directed toward Aldo for the existing finger and lullaby choices. Use a short lean/reach and a clear resting pose. Aldo remains supported in the cot. Don’t reuse a vigorous dance or gathering pose for care.
- Parameterize the existing cottage `aldoCot()` drawing to produce three prebuilt variants: its unchanged base, a small hand response, and a relaxed hand pose. Keep the mattress, rails, body, scale, and face position fixed. Select the hand variants during `aldo-finger`, then return to the base. A quiet still is sufficient during humming. Register the variants with the map factory and its existing recursive disposal. Don’t swap in the differently drawn finale cot or create frames on ticks.
- For lullaby sound, extend `audio.tick()` to accept the moment alongside the game. Explicitly select only indoor `aldo-lullaby` as a home performance. Reuse `songPhrase()` and Hana’s existing soft voice with no fairy call. Keep the outside song and new home moment as mutually exclusive vocal sources. A completed home moment can’t award a tear, restore a garden, or change inventory. Test all nonvocal moment kinds with real audio enabled so an undefined tune can’t stop the frame loop.
- Reuse performance-group retirement and music ducking. Pause/mute cancels scheduled vocal sources. Resuming schedules only the unplayed remainder at the moment’s elapsed position. Muting doesn’t stop the silent visual moment. Enabling sound midway starts only the remaining phrase. A language redraw does neither. An expired moment produces no late vocal restart.
- Reword the Aldo humming reply and reflection in both languages to lead into care instead of saying he has already heard the tune and fallen asleep. A suitable English reply is “Aldo goes quiet and watches Hana.” The text must not claim the performance is already complete.
- During `aldo-lullaby`, replace the next-destination line with one brief moment label, such as “Hana hums to Aldo.” Capture the deferral and clear the preparation toast created by `finishConversation()` before the first UI redraw after conversation completion, so its 7-second lifetime isn’t consumed invisibly. When the lullaby finishes or movement cancels it, publish the existing Aldo completion message with a fresh 7-second lifetime only if the same game is still indoors at the recorded next step, with no new action or conversation. A new interaction, scene change, ending, or restart discards the deferred instruction. Derive the source message from Aldo’s existing activity rather than caching translated text. Keep one deferred instruction belonging to the moment, not a message queue.
- Returning from care to play doesn’t add a new required task. Players may linger, move on, or pet Percy. Movement stays usable during care, and useful next-step guidance returns on completion or interruption.

Acceptance: H01, H02, H03, H04, L01, L02, A01, A02, and R01.

## Milestone three animal voices and conversation layout

Likely files: `src/dialogues.js`, `src/ui.js`, `src/style.css`, `src/world.js`, `src/main.js`, and `src/i18n.js`.

Rewrite the existing 12 conversations in place, preserving IDs, their three themes per animal, both branches, and rotation rules. Keep the current data shape unless a demonstrated need prevents it. Avoid adding more dialogue stages or choices.

| Animal | Voice direction | Specific revision direction |
| --- | --- | --- |
| Fox | Playful, hungry, and willing to twist a rule for personal benefit | Keep the potatoes and favors, but let the fox make a cheeky request or expose her own self-interest. Hana can push back with humor. |
| Owl | Precise and curious, occasionally too pleased with a distinction | Keep maps and conflicting reports. Allow an admission that more looking is needed. Avoid making every reply a lecture about evidence. |
| Deer | Attentive and gentle, with needs of her own | Keep kindness and consent. Use concrete moments and let a pause or small gesture carry part of the exchange. |
| Badger | Practical, house-proud, and mildly stubborn | Keep repair, planting, and unfinished work. Let domestic detail and a wry remark replace a tidy concluding rule. |

As editing targets, aim for one to two short sentences in an opening, one short sentence per option, and one to two sentences in a reply/reflection. Don’t turn word counts into a linter or cut meaning to satisfy a quota. Keep a real question and two defensible responses. Both branches may end differently without declaring a correct answer. Never score them or make them unlock dinner.

For animal conversations, replace the full-screen blur with a smaller lower dialogue panel. Frame Hana and the speaking animal together above it. Show only the opening and choices before selection. After selection, show the chosen line, the animal’s response, and Hana’s brief final response without duplicating the opening. Retain speaker names, the two choices, Continue, close, language, and the existing modal focus trap.

Use content-sized layout with a scrollable panel when necessary. At 390×844, both characters should remain identifiable above the panel and all controls must remain reachable. At landscape height or increased text size, allow scrolling and a wider scene view rather than shrinking text below the existing readable size. Keep map/help/admin panels unchanged. Scope new CSS to conversation panels, not `.dialog-scrim` globally.

Apply the shorter family dialogue layout only if it keeps the current John portrait, Aldo’s context, and two choices clear. The animal view must not accidentally hide family information through a shared selector.

Acceptance: D01, D02, D03, L01, A01, and A02.

## Milestone four dedicated family dance

Likely files: `public/assets/characters/`, `src/characters.js`, `src/finale-scene.js`, and their tests. Change `src/finale.js` only if a verified integration need requires it.

Create a small, coherent dance loop for each adult. Use eight readable poses per adult as the starting art brief, retaining the same face, clothes, height, and foot placement. Hana has no gathering basket in the dance art. Give John an enthusiastic step and Hana an answering sway or step. Each needs a planted phase, a passing phase, and a return to the starting pose. Reject repeated near-identical frames masquerading as a gait.

Use a four-beat family phrase at the current dance rate of 1.9 beats per second. John starts the gesture, Hana answers two beats later, and Percy makes a brief playful hop near their feet once per phrase. Match Percy’s actual appearance. A small dedicated pose set is appropriate if the existing cat art can’t show the interruption clearly. Don’t add a new walk system. Keep the projector pull separate from the dance and retain its existing hand/cord alignment.

Keep Aldo’s existing 32-pose cot animation and safe lying position. Align its phase with the shared phrase if needed, while preserving its detail and exact reduced-motion still. Don’t add standing, unsupported sitting, or dancing outside the cot.

All family phase calculations must remain pure functions of confirmed `game.danceTime`. Starting a requested video isn’t proof of playback. Paused, buffering, ended, unfocused, and administrative states show exact single painted poses without an unfinished blend or continued movement. Replay at video position 0 resets the phrase. Keep the current video’s picture ratio, player region, retry, mute, language, and cleanup behavior.

Acceptance: P01, P02, P03, L01, L02, A01, A02, and R01.

## Milestone five forest connections and ending choice

Likely files: `src/game.js`, `src/sequences.js`, `src/world.js`, `src/ui.js`, `src/style.css`, `src/dialogues.js`, `src/i18n.js`, and `src/main.js` only where needed.

The lullaby in milestone two is the sound connection. Use the opening woodland phrase Hana learned from Běla. Don’t add a song-selection menu or new tracking field to remember a favorite.

For the goddess reveal, reuse the existing fairy colors and botanical motifs in the glow and crown accents. Keep the original Slavic-inspired character and restrained rise. Avoid a new deity claim or historical explanation in the game. The household and garden story should remain understandable without an animal conversation.

When serving completes, keep the existing ending-choice overlay and explicit choice. Use the existing serve target in `HOUSE_TARGETS` as the single supper position. Set Hana’s position once when `completeAction()` enters the won phase, and use the same target for the direct Scene select ending states. This replaces the current room-center final placement without changing movement or any playable task. Never write player coordinates from the renderer or duplicate supper coordinates in different files.

The one-time placement at serving completion may move Hana by up to the existing 2-unit interaction reach, because serving can begin before she reaches the target center. Accept that declared staging change at the end of serving. The continuity guarantee starts with the chooser and covers the transition into the goddess reveal. It isn’t a claim that serving itself ends without a position change.

During the chooser, show Hana standing at the table with the existing serving-dish pose, `painted.actions[7]`, while John is seated. Keep that position and pose through the opening of the goddess reveal until the existing goddess pose takes over. The camera, Hana, radiance, crown, and shadow must all use the same supper position. The reveal rises from supper rather than jumping to the room center. The dance keeps its separate fixed family composition. No new seated Hana art is needed.

Use a brief family exchange above the two choices. Suggested English draft: John asks, “Shall I put on a song?” Hana replies, “Or shall we see what the forest brought home?” Keep the buttons explicitly labeled “Family dance” and “Slavic goddess,” with short descriptions naming what will happen. Provide natural Czech counterparts. The poetic line must not make the result mysterious to someone choosing an ending.

Don’t add a mandatory supper timer, a third ending, another confirmation screen, or an extra required input before the two choices. The smaller chooser should leave the family gathered at the table visible. Both endings keep their replay and Scene select controls.

Acceptance: E01, E02, L01, A01, and A02.

## Artwork and resource boundaries

- Put new source sheets under new descriptive filenames in `public/assets/characters/`. Save exact generation prompts, source references by repository path, crop/cell maps, accepted/omitted cells, and dimensions alongside the art metadata. Don’t overwrite old sheets.
- Inspect every intended cell on transparency and over both dark and light backgrounds. Check hands, feet, tails, faces, props, cell gutters, and loop seams. Use actual composites and alpha bounds. A generator preview alone is insufficient.
- Compare each action with its existing idle figure at the same game camera and size. No drifting foot anchor, unexplained height change, detached body part, doubled basket, or changing likeness. Check the middle transition as well as endpoints.
- Reuse prebuilt textures and materials. No canvas, geometry, texture, or material creation on a frame tick. Register owned resources in the existing disposal path. New moments store only bounded transient state.
- Measure before/after asset bytes and renderer geometry/texture/program counts on the same warmed scenes. Record cold-load timing separately from frame cadence. Don’t turn the older Mac measurements into a promise about a physical phone.
- Compare five warmed entries into forest, care, dance, and goddess scenes. Counts may rise to a new initial ceiling, but must stop growing across repeated entries. If the new art materially increases loading or memory, reduce atlas dimensions/unused poses or load the new household art when first needed before expanding scope into a loader rewrite.
- Subjective art approval is separate from successful parsing, higher frame counts, or automated checks. Save normal-size gameplay captures and a short real playback inspection for each new action. Ask the owner to judge likeness and tone only after a concrete local result exists.

## Acceptance and verification

These checks are required evidence, not claims that the new behavior already works. Automated tests prove state and lifecycle rules. Browser checks prove rendering and real input paths. Owner review judges tone, likeness, and warmth.

| ID | Required behavior | Verification and counterexample |
| --- | --- | --- |
| F01 | All three real fairy learning exchanges frame both figures and retain working cancellation | Start each with `createSequenceGame(fairy.id)` and real input. Check learning, response, gift, return, and movement cancellation. In browser, inspect desktop and phone-size subject bounds. A missing fairy or camera that never changes must fail the focused framing guard. |
| F02 | A tear produces one gift and one announcement, followed by useful guidance | Observe the actual inventory transition, gift subject, jar, and message. Move during gift. From Jitřenka’s canonical scene, finish learning, walk toward the deer, and start its real conversation before 3.5 seconds. The gift visuals must finish before the conversation, with inventory unchanged. Also enter a ready garden/home scene with existing tears and verify no false gift. No duplicate reward, timer, or announcement. |
| H01 | Cottage art preserves navigation and interaction reach | Inspect the furnished room and walk between all five targets and Percy using the real model/renderer. Reuse `world-data` and sequence clearance checks. Decor must not cover targets or the video. |
| H02 | John and each Aldo reply produce the intended optional action once | Start the canonical household scene, select each reply, and finish through the real entry point. Start walking on John’s first action frame and confirm his 2.4-second action still completes. The same movement must cancel Aldo care. Inspect Aldo’s changing hand texture during `aldo-finger` and its return to base. Repeated frames, language switches, and Continue/close can’t duplicate an action. Unselected close produces no invented care choice. Household steps advance only through the existing game functions. |
| H03 | Only the lullaby reaches the actual voice consumer, once, and stops correctly | With real `createAudio()`, sound on, and pause off, pass each of the three nonvocal moment kinds and assert no throw and no performance voice. Confirm the test rejects a scene-only filter that admits all house moments. Also test the real lullaby path with a real-engine render or browser audio capture. Check the woodland phrase, music ducking, mute/unmute midphrase, pause/resume, and a long frame stall with independent clocks. A positive output check must detect deliberate removal of the household performance branch. |
| H04 | Care doesn’t add a gate, alter inventory, or urge the player to interrupt it | No preparation message or next-destination prompt appears during the lullaby. Natural completion or movement restores the existing message with its full lifetime. A new interaction discards the old instruction. Move out of care, pet Percy, and start preparation normally. Assert songs, tears, potatoes, restored sites, and the expected household step. A scene jump while a voice is pending must not affect the new scene. Count “At home” and the current action label inside the household guide panel only, in each language and layout, outside the lullaby. During the lullaby, check the moment label there instead. The separate nearby-task prompt is outside that count. |
| D01 | All 12 animal conversations retain two complete bilingual branches and correct rotation | Reuse the real data/model checks for all branch combinations, preserving current questions/themes. Add no right/wrong answer or required visit. Compare opening and both branches as writing, not as a sentiment score. |
| D02 | Conversation is readable while both participants remain visible | Inspect every conversation opening/result in both languages at 1440×900 and 390×844. Spot-check 844×390 and 200% browser zoom with the longest text. Tab through controls and scroll to Continue. Check actual character projection, not only panel width. |
| D03 | Language and closing preserve conversation state | Through real `src/main.js`, select a reply, switch language, open/close Scene select, and continue. Current animal/question/reply persist until finished. Scene jumps clear the old selection. |
| P01 | Adults and Percy show a coherent shared dance phrase | Inspect actual artwork and browser playback at phrase start, middle, handoff, and loop seam. Verify Hana’s dance has no basket and adults use dedicated dance textures. Review motion by watching it, not by pose count alone. |
| P02 | Family motion follows actual playback and exact stills | Reuse finale-controller, finale-scene, and entry-point checks. Inject slow game frames while the video clock advances independently. Exercise paused, buffering, ended, replay, and live reduced motion. Deliberately using the frame clock must fail. |
| P03 | Player loading, failure, and exit behavior stay intact | Keep current `finale.test.js` guards. In browser, reach actual playback once and inspect mute/language/exit. Exercise blocked/offline loading separately, using current supported browser tooling. If live playback is unavailable, report it as unverified and retain working retry/link behavior. |
| E01 | Both endings remain clear and reachable, with continuous chooser-to-goddess placement | Approach serving from the stove and record the last serving position and first chooser position. Verify the declared end-of-serving placement reaches the serve target and moves no farther than the existing interaction reach. Inspect Hana’s serving-dish pose there, with John seated. Choose each ending on separate runs and verify the goddess reveal/family dance. Compare Hana’s world position, camera target, and opening pose before and immediately after the goddess choice, and against direct `ending-goddess` entry. They must match before the rise. Verify both direct Scene select ending entries bypass the chooser. |
| E02 | Forest echoes are visible/audible without hidden prerequisites | Complete the game without animal conversations. Verify lullaby choice uses the learned woodland phrase and goddess accents match the current fairy palette. Text-only mentions don’t satisfy the performance requirement. |
| L01 | All new state survives language, guide, and focus transitions correctly | Test the transition table above through the real entry point. Include F2/Escape with a native select focused. Pause at a positive intermediate moment before checking it is frozen, then confirm it resumes. |
| L02 | New transient work can’t leak into another game or restart | Start a moment, replace the scene or restart, then deliver a late audio-ready callback. Assert no old voice, framing, gift, or care action reaches the replacement. Test disposal and graphics failure too. |
| A01 | Keyboard, touch, and accessible controls remain usable | Keyboard focus stays within the modal and returns sensibly. Hidden controls can’t keep input pressed. Check touch direction/action cancellation, visible stop guidance, useful button labels, and one-time status announcements. Physical multitouch needs a real device if claimed. |
| A02 | Live reduced motion gives composed stills without losing progress | Change the setting during learning, gift, care, dance, and goddess reveal. Inspect immediate stable poses, no camera glide, correct final composition, and preserved game state. Recorded video itself is outside the game’s motion setting. |
| R01 | Resources stay bounded and art loads correctly | Measure same-device before/after assets and warmed renderer counts across five entries. Check no tick allocates textures. Reject a deliberate replay allocation variant with the focused guard. Inspect atlas boundaries and normal-size gameplay. |

### Test implementation rules

- Extend existing `tests/game.test.js`, `tests/title-screen.test.js`, `tests/audio.test.js`, `tests/finale-scene.test.js`, and `tests/sequences.test.js` as their responsibilities require. Add focused pure moment tests rather than duplicating a browser implementation inside a fixture.
- The entry-point tests run real `main.js` with substitute browser surfaces. They don’t run the real layout or audio output. Keep that limit explicit, and verify the corresponding consumer in a browser or audio engine.
- Use `createSequenceGame()` for focused scenes, then exercise the real completion path. Prepared scenes supplement a complete normal journey. They can’t prove the outdoor route or natural sequence of prerequisites.
- For deterministic defects, run the regression before the fix and after it. For a new design guard, test one tempting wrong implementation and confirm the intended assertion fails. Use isolated copies or exact inverse edits so unrelated work is preserved.
- Don’t automate taste with hard-coded word counts, banned-word linting, snapshot counts, or “warmth” scores. Review Czech and English meaning, voice, and layout directly. If native Czech editorial review is unavailable, name that limit.

### Final integrated checks

Run `npm test`, `npm run build`, and `git diff --check` as separate commands. Redirect each to a distinct log, retain its own exit status, and read its summary independently. Use the installed project runtime. Don’t install a missing dependency without authority.

Freeze a production build for browser checks. Record the source manifest and built entry files. Don’t change source during a whole journey or let another worker control the same tab. If the build changes, rerun affected evidence against the new frozen build.

Perform one normal complete walk without jumps: 6 potatoes, 3 learned songs/tears, all 3 restored gardens, cottage entry, family greetings/care, preparation, cooking, serving, and an ending. Perform both endings from real serving across the integrated runs, and both Aldo reply branches through focused canonical scenes. Include a language switch during active play, one selected animal reply, one new moment, and the ending choice. Use the canonical scenes for the remaining branch/layout/motion matrix above.

Keep one browser owner. Use the current supported browser API, not a hard-coded debugging port or an untracked helper from a past session. Save captures and receipts with source/build identity, viewport, motion preference, language, and actual outcome. A hidden ancestor or a closed panel isn’t proof that an action completed. Assert a positive starting state and the real inventory, step, or player transition.

## Review and completion

Before reviewing implementation, verify it locally and inspect the final diff. Read `~/prefs/references/review-procedure.md` and `~/prefs/references/cross-review.md` afresh. Run `~/prefs/bin/cross-review status` using the authorized outside-sandbox route. Don’t change cross-provider settings.

Because the implementation coordinates input, overlays, animation, and audio across the product, use both correctness and design reviewers with `--deep` for pass 1. Give each the same frozen subject, actual requirements, owner writing rules, verification evidence, and limits. Keep packets, patches, reports, and resolution records in a durable task folder. Confirm complete packet delivery before accepting a review. Don’t direct reviewers to infer requirements from `AGENTS.md` or `CLAUDE.md`.

Check every finding against the source and evidence. Fix valid blockers and bounded in-scope worth-fixing findings. Record rejected findings with reasons. Report minor and out-of-scope findings without widening the upgrade. If resolution invents non-trivial logic or design, use one targeted pass 2 on that delta only. Fix blockers in pass 2 and report everything else. There is no third pass. A non-trivial final fix after pass 2 is verified but explicitly unreviewed.

Completion means the five outcomes are implemented, applicable acceptance checks have evidence, all valid blockers are resolved, the review gate is recorded, and remaining human/device/external-service limits are stated. A test suite doesn’t prove tone, likeness, physical-phone performance, or current YouTube availability. No final delivery statement may imply commit, push, publication, or app rebuild unless separately authorized and verified.

### Progress for the implementing session

- [x] Revalidate source, authority, baseline, and unrelated edits. HEAD matches `deb1b5c`; initial dirty paths were only untracked `plans/` and `scripts/`. Baseline: 130 tests passed, build passed, existing bundle warning retained.
- [x] Implement and verify shared moments and fairy framing.
- [x] Implement and verify cottage art, family care, and lullaby.
- [x] Revise and inspect all bilingual animal branches and conversation layouts.
- [x] Produce and inspect dedicated family dance art and playback behavior.
- [x] Connect the forest to the supper choice and goddess reveal.
- [x] Complete integrated checks, evidence, and resource measurements.
- [x] Complete the implementation review gate and bounded resolution.
- [x] Report result, remaining limits, and any separate delivery decision.

### Planning review record

Pass 1 completed with separate cross-provider correctness and design reviews. Both confirmed all eight packet sections and reported no blockers. The plan was revised for the valid in-scope findings: explicit audio admission, John’s independent action, care guidance and timing, gift interruption, one indoor action label, supported supper pose and position, cottage baby/material sources, family-camera scope, and owner writing rules.

The targeted correctness pass 2 confirmed all eight packet sections and reported no blockers. Two overbroad verification claims were narrowed afterward as factual corrections: the position guarantee covers chooser-to-goddess continuity, and the single-label count covers the household guide panel. No new implementation logic or design was added after pass 2. There was no third review.

Report-only refinements remain under the pass limit. The main one is the finished-task interaction prompt at Aldo’s position, which can still say to follow the house guide during humming. A repeated E press there may also post a generic guide toast. The plan suppresses the preparation toast and destination, but doesn’t yet define a change to that separate prompt or ineffective press. Other minor notes cover the cot-variant container shape, first-redraw ordering, serving-platter copy, the optional figurative ending line, and the entry-point test harness import reminder. John’s behavior behind family dialogue remains an open presentation question. These aren’t blockers and weren’t implemented as extra resolution work.

Detailed findings, source checks, report-only decisions, frozen snapshots, patches, and final validation are under `reviews/storybook-character-plan/`. Baseline logs record 130 passing tests and a successful build. Game source and assets remain unchanged by the planning task. The implementation checklist stays unchecked until a later authorized session performs the work.

### Implementation decisions, attempt 01

The October 18 execution request authorizes local implementation and verification. No commit, push, publication, installation, or local model execution is authorized. Family dialogue retains its portrait layout. John continues his independent bowl action behind family conversation. The lullaby replaces the finished Aldo prompt and ignores an ineffective interaction at the cot. Care textures use an array in the existing recursive disposal path. Serving copy describes Hana bringing supper, matching her standing pose. Animal dialogue temporarily hides inactive play controls so both figures remain visible on narrow screens. Hana’s small visual stance offsets leave model coordinates unchanged. John sets two bowls on a supported tray beside him. The chooser keeps explicit ending buttons and a brief family exchange. All new source art preserves old assets. Native Czech editing, owner likeness approval, physical-phone testing, native 200% browser zoom, and speaker listening remain unverified. The owner requested silence during another session’s microphone work. Audio verification uses a real offline audio engine, and live video playback was muted. Implementation pass 1 and resolution are recorded in `reviews/storybook-character/RESOLUTION.md`. All 142 tests and the build pass. The second pass is complete. Its final one-line panel-position fix was verified afterward and was not separately reviewed.

### Implementation review progress

Both pass 1 reviewers confirmed all eight packet sections and reported no blockers. Valid in-scope findings were resolved: smooth decorative stances, one visual gift receipt, synchronized reveal focus behavior, meaningful pause tests, a grounded pale blanket, the owl idiom, and a family-visible supper composition. Minor findings remain report-only in the resolution record. Fresh-origin artwork loading and the final warmed resource ceiling are measured. Targeted correctness pass 2 reviewed only the resolution delta. It found a phone completion panel covering the goddess. A one-line CSS placement fix passed six actual-renderer/panel checks afterward. No third review ran. Final verification: 142 tests pass, build passes, and whitespace check passes. Native 200% zoom, physical-phone/multitouch testing, screen-reader speech, native Czech editing, owner likeness/tone approval, and speaker listening remain unverified. All original source assets and pre-existing scripts are preserved. No commit, push, publication, dependency installation, desktop-app rebuild, or local model execution occurred.
