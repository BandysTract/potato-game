# Game evolution proposal

October 19, 2026. Creative background for the implementation plan.

The implementation entry point is [Game evolution implementation plan](game-evolution-implementation.md). It supersedes the exploratory choices below where they differ. Animal encounters are sourced quizzes under the owner’s later direction.

## A playable musical folktale

Hana goes out for six potatoes and accidentally brings the forest home for supper.

Make the songs the organizing idea of the adventure. Each one changes a place, reveals a peculiar character detail, and returns in the evening. The pleasures are discovery, musical cause and effect, affectionate absurdity, and the feeling of having passed through a carefully made little world.

Keep the title, family likenesses, Czech setting, bilingual play, and gentle pace. The existing walk provides enough space. The next investment should make its places and events more distinctive.

## Build on the recent character work

The current source already includes closer fairy and animal framing, John’s bowl action, Aldo’s lullaby, dedicated adult dance art, and a Percy interruption. Those are foundations for the evolution. Recommending them again would understate the next step.

The visible opportunity is a stronger relationship between the scenery, music, player actions, and ending. The forest has rich foliage, but many encounters share a similar visual setting. The cottage has painted surfaces and personal moments, but its broad, evenly lit room still offers room for a more intimate composition. Garden restoration already opens branches, grows flowers, and brings rain. Give those effects a beginning, development, and payoff.

## The six changes

### 1. Give each clearing a memorable composition

Make the birch grove, mountain meadow, and brook recognizable from their shapes before a location label appears. Use pale vertical trunks and enclosed light for the grove, a broad opening and distant mountain backdrop for the meadow, and reflective water framed by dark roots for the brook. Reduce repeated scenery where an encounter needs breathing room.

Keep the painted character style and fixed viewing angle. Add depth through overlapping scenery, grounded contact shadows, and carefully placed light. Give the cottage a warm stove glow, a cooler window, and a more closely framed table. A few expressive objects, such as a crooked towel or a chair pulled out for Hana, will contribute more than shelves full of decoration.

Let the light move toward evening as the adventure advances. Tie the change to completed story events so lingering never creates a deadline or penalty.

**Product effect:** Places become easier to remember, and returning home feels like arriving somewhere different.

**Main cost:** New environment art, lighting, and composition work. Preserve the current walking route and interaction locations in the first version.

### 2. Turn the three restorations into musical set pieces

Build a distinct sequence around each existing song. In the woodland garden, tangled branches unwind in response to successive phrases. Mushrooms lift their caps, and one small mushroom responds a beat late. In the meadow, a wave travels through the grass before flowers open. At the cottage, the first drops strike the fence, leaves, and watering can with different musical sounds.

Each scene needs one clear focal action and one small surprise. Keep the changes visible after Hana walks away. Preserve the earned reward if she leaves before the decorative flourish finishes.

Extend the existing arrangements with a restrained extra part after each restoration. The return walk should sound like a fuller version of the world Hana entered. Keep every musical layer compatible with the current regional melodies.

**Product effect:** A successful song produces a memorable event, and progress changes the atmosphere as well as the counters.

**Main cost:** Coordinating new animation and musical arrangements. Prove one scene before producing the other two.

### 3. Give the animals grounded quizzes

Replace the invented philosophical exchanges with short quizzes grounded in facts, valid deductions, or established thought experiments. Each question has three choices, a defensible answer, and a short explanation. Keep animal personalities in their delivery and staging.

- Fox tests probability, including the Monty Hall problem, with three covered baskets.
- Owl tests logic and evidence, including the Wason card selection task.
- Deer asks about real woodland biology, including lichens, photosynthesis, and fungi.
- Badger introduces established thought experiments about identity, vague boundaries, and experience.

Explain why the answer follows and why an appealing alternative fails. For disputed philosophical problems, test the setup or a stated argument’s implications. Don’t mark a contested worldview as the correct answer. Keep sources available after answering and bundle the questions locally.

One or two encounters can leave a modest trace at home. For example, visiting Fox could produce a hopeful nose at the window during supper. Skipping the animals must still deliver a complete ending, without implying a missed obligation.

**Product effect:** Optional encounters test reasoning and teach something concrete.

**Main cost:** Source checking, question writing, Czech translation, interaction changes, and a small number of poses and props. The [quiz content pack](animal-quiz-content.md) defines the first 12 questions.

### 4. Give the player a little musical authorship

Keep the current listen-and-answer interaction as the default. The first implementation extends automatic singing to three optional scenic spots. Manual note controls are deferred so the musical scenes can be developed without another control system.

Once a song is learned, let Hana sing it for pleasure at a few clearly marked optional spots. A bird answers, a reflection briefly blooms, or an animal hums the wrong final note. These responses grant no resources and introduce no new errands.

**Product effect:** Players can participate in the music and discover small consequences beyond unlocking gardens.

**Main cost:** Three bounded scene responses and careful reuse of the existing song, cancellation, and audio paths.

### 5. Make supper the musical payoff

Carry the forest’s musical phrases into existing household actions. Chopping supplies a quiet pulse. The spoon taps the pot. John answers with the bowls. Aldo’s lullaby, already present, becomes the gentle center of the sequence. Percy listens until a movement suggests something worth pouncing on.

Arrange the cooking sequence so the sounds form a brief shared phrase, without requiring accurate timing from the player. Give serving a short, composed pause before the ending choice. Let the family look at the meal and at one another.

Keep both endings. Give the goddess reveal a stronger visual transformation: embroidered shapes from Hana’s blouse expand into a temporary frame of branches, stars, and the three fairy colors. The cottage remains visible so the miracle belongs to family life. A draft final line from John: “Will you still pass the salt?”

For the dance, extend the current family choreography with a restrained visual callback from the forest at the window. Preserve the Karel Gott performance and actual playback synchronization. Keep the projector clear, and let the family be the focus of the joke.

**Product effect:** Gathering, music, family care, cooking, and the final absurdity feel like parts of one story.

**Main cost:** A musical arrangement spanning existing household events, plus a carefully composed ending effect. New art and timing will matter more than additional dialogue.

### 6. Finish the experience as a small crafted object

Use a folded illustrated map and a compact basket display that match the world’s materials. Keep optional guidance available while allowing the view to grow quieter after players learn the controls. Show the jar and basket clearly when their contents change.

Make gathering feel grounded through contact, a brief pull, disturbed soil, and a satisfying landing in the basket. Prioritize coherent motion and poses over adding more frames. Let feet, hands, and objects meet convincingly.

Add local “Continue” support so closing the browser doesn’t require repeating the walk. Save completed progress, language, and sound choices. Resume between activities, with a clear “New walk” choice. Define save recovery and test it before relying on the feature.

Keep reduced-motion versions composed and expressive. Every musical consequence also needs a visible cue for muted play. Check text at real play size, short taps on touch controls, and the path back from every menu.

**Product effect:** The game feels considered during ordinary play, interruptions, and return visits.

**Main cost:** Detailed visual and interaction finishing. Saving adds persistent state and needs separate correctness review.

## Build one complete scene first

Use the woodland garden as the first playable proof. Include its revised clearing, existing song, phrase-by-phrase branch movement, mushroom payoff, persistent restored appearance, and musical continuation as Hana walks away. Test ordinary play, muted play, and reduced motion.

The scene succeeds when a new player can tell what the song changed, remembers a specific surprise, and keeps moving without extra instructions. Watch whether the spectacle helps or interrupts the walk. Inspect actual animation at normal play size, including its return to idle.

Review the finished scene before expanding the art and arrangements. The largest production risk is making several individually attractive effects that don’t feel like one world. A complete scene exposes the mismatch early.

## Order and scope

| Stage | Deliverable | Relative effort | Decision it supports |
| --- | --- | --- | --- |
| First | One complete woodland restoration | Medium | Does the musical direction feel worth extending? |
| Next | All three clearings and restorations | Large | Can the same visual and musical language carry the walk? |
| Then | Sourced animal quizzes and supper reprise | Large | Do the encounters teach something and connect to the evening? |
| Finish | Ending composition, interface detail, and local continuation | Medium to large | Does the whole journey feel finished and easy to return to? |

Effort labels compare scope, not delivery dates. Art iteration and musical coordination are the largest uncertainties. Manual note controls remain outside the implementation scope.

Keep the current six potatoes, three songs, three tears, three restorations, and both endings. Keep quizzes optional, with clear answer feedback and no resource penalty or moral score. Preserve Czech as the default, the complete English switch, local play outside the existing online dance video, and the family’s likeness cues. Leave a larger map, seasons, extra resource systems, and additional endings outside the proposed first release.

## Source anchors

- `src/game.js`: Current rewards, interactions, garden prerequisites, and household progression.
- `src/world.js`: Current scenery, restoration effects, encounter framing, cottage, and goddess presentation.
- `src/dialogues.js`: Animal subjects, voices, and family exchanges.
- `src/moments.js`, `src/main.js`: Existing fairy gifts, bowl action, and Aldo care moments.
- `src/audio.js`, `src/songs.js`: Existing arrangements and musical performance flow.
- `src/finale-scene.js`, `src/finale.js`: Dedicated dance art, family staging, and embedded video control.
- `plans/storybook-character.md`: Scope of the recent character upgrade. Recheck current source before making an implementation plan.

Browser inspection for the proposal covered the title, normal forest view, woodland restoration interaction, Fox conversation, and cottage cooking scene. The proposal doesn’t claim a new playthrough qualification or measured production estimate.
