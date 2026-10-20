# Animal quiz content

The first release contains 12 quizzes, three per animal. These English questions define the reasoning and answer keys. Implementation must supply complete, equivalent Czech text, including option feedback and source summaries. The questions are original wording based on the sources below. They aren’t quotations or claims of traditional Czech folklore.

## Content rules

Every quiz has a localized title, three options with stable IDs, exactly one correct option, a concise explanation, and feedback keyed to every option ID. Only Title, Question, option labels, Explanation, and Feedback are player-facing fields. Source summaries are written separately for “About the question.” Authoring notes never appear in the game. Keep the premise visible with the result. Source links are optional and never loaded automatically.

Questions test facts, deductions, or understanding of an established experiment. They don’t test whether the player knows an author’s name. Questions about an unresolved philosophical issue test what the issue or argument says. They don’t declare one contested answer settled. Don’t add invented historical attribution, precise wildlife identification, foraging advice, or claims about what all members of an animal species do.

No question consumes a potato, tear, or song. Getting an answer wrong produces an explanation and allows the player to continue. Don’t add a timer, streak, leaderboard, numeric total, or reward for guessing repeatedly.

## Fox and probability

### fox-monty

**Source:** S01. Adaptation of Monty Hall. Show the complete rules before asking.

**Title:** Three baskets.

**Question:** “A potato is hidden at random in one of three covered baskets. The other two are empty. You choose a basket. I know where the potato is. I always uncover an empty basket you didn’t choose, then offer a swap. Which strategy finds more potatoes over many rounds?”

- `stay`: Keep the first basket.
- `switch`: Swap to the other covered basket. **Correct.**
- `equal`: Both strategies win equally often.

**Explanation:** Your first choice wins in 1 of 3 equally likely starting cases. Swapping wins in the other 2, because Fox always removes an empty alternative. One lucky or unlucky round doesn’t change which strategy wins more often.

**Feedback:**
- `stay`: Keeping the first basket preserves its original 1-in-3 chance.
- `switch`: Swapping wins whenever your first choice was wrong, which happens in 2 of the 3 starting cases.
- `equal`: Two closed baskets don’t make the strategies equal. Fox knowingly removed an empty one.

**Authoring notes:** Compare strategies over all rounds. If Fox has two empty alternatives, select randomly between them. Never present that instruction as advice to the player. Illustrative potatoes don’t enter the inventory.

### fox-independent

**Source:** S02. Independent fair coin tosses.

**Title:** A coin’s memory.

**Question:** “A fair coin is tossed independently each time. It has landed heads five times in a row. What’s the chance of heads on the next toss?”

- `half`: 1 in 2. **Correct.**
- `less`: Less than 1 in 2, because tails is due.
- `more`: More than 1 in 2, because heads has a streak.

**Explanation:** “Independent” means earlier tosses don’t change the next toss’s chance. A fair coin still has two equally likely outcomes. Neither a debt to tails nor a winning streak changes the stated rules.

**Feedback:**
- `half`: The coin is fair, and earlier independent tosses don’t change its next chance.
- `less`: Tails isn’t due. Earlier tosses don’t make heads less likely on the next toss.
- `more`: A run of heads doesn’t make another head more likely under the stated rules.

**Authoring notes:** Preserve “fair” and “independently” in both languages. Explain independence on the screen, as the Explanation does.

### fox-two-coins

**Source:** S02 for independent fair tosses. The conditional answer is also established by the complete outcome list below.

**Title:** Two coins.

**Question:** “Toss two independent fair coins. Repeat whenever both are tails. In a round you keep, what’s the chance both are heads?”

- `quarter`: 1 in 4.
- `half`: 1 in 2.
- `third`: 1 in 3. **Correct.**

**Explanation:** Heads/heads, heads/tails, tails/heads, and tails/tails begin equally likely. Discarding tails/tails leaves three equally likely outcomes. Only one has two heads.

**Feedback:**
- `quarter`: 1 in 4 counts the tails/tails rounds that the question discards.
- `half`: One head can happen in two ways: heads/tails and tails/heads. They’re separate outcomes.
- `third`: One of the three remaining equally likely outcomes has two heads.

**Authoring notes:** Show the three kept outcomes beside the explanation. Don’t replace the discard procedure with an observer choosing which coin to reveal.

## Owl and evidence

### owl-cards

**Source:** S03. Wason selection task, with letters and numbers.

**Title:** Turn the right cards.

**Question:** “Each card has a letter on one side and a number on the other. You can see A, D, 4, and 7. The rule says every vowel has an even number on its other side. Which cards must you turn over to check for a violation?”

- `a-four`: A and 4.
- `a-seven`: A and 7. **Correct.**
- `all`: All four cards are necessary.

**Explanation:** A could hide an odd number. 7 could hide a vowel. Either would break the rule. D and 4 can’t break the stated one-way rule, whatever their hidden sides show.

**Feedback:**
- `a-four`: The 4 can’t break the rule, but an unchecked 7 could hide a vowel.
- `a-seven`: These are the two cards that could reveal a violation.
- `all`: Turning all four would work, but D and 4 aren’t necessary checks.

**Authoring notes:** Preserve the minimum-necessary meaning of “must” in both languages.

### owl-counterexample

**Source:** S03 for testing violations of a conditional rule. The deduction is shown explicitly here.

**Title:** One counterexample.

**Question:** “Each card has a leaf or a flower on one side, and a circle or a square on the other. Owl’s rule says every leaf has a circle on its other side. Which discovery disproves the rule?”

- `match`: A leaf with a circle on the other side.
- `irrelevant`: A flower with a circle on the other side.
- `violation`: A leaf with a square, and no circle, on the other side. **Correct.**

**Explanation:** A universal rule is broken by one case that meets its condition but fails its consequence. The matching card agrees with the rule. The rule says nothing about cards with flowers.

**Feedback:**
- `match`: A leaf paired with a circle agrees with the rule.
- `irrelevant`: The rule places no restriction on a flower’s other side.
- `violation`: A leaf without a circle is exactly the kind of card the rule forbids.

**Authoring notes:** These are stipulated card rules, not claims about real plants. Keep both symbol domains explicit.

### owl-reverse

**Source:** S03 for the one-way conditional. The answer follows by considering a counterexample.

**Title:** Can you reverse a rule?

**Question:** “Each card has a leaf or a flower on one side, and a circle or a square on the other. Every leaf has a circle on its other side. A card shows a circle. Must its hidden side have a leaf?”

- `yes`: Yes, the rule guarantees a leaf.
- `not-required`: No. A leaf is possible, but another symbol is allowed. **Correct.**
- `forbidden`: No. A leaf would break the rule.

**Explanation:** “If leaf, then circle” doesn’t mean “if circle, then leaf.” A circle could be paired with a flower without breaking the rule. A leaf is also allowed.

**Feedback:**
- `yes`: A flower paired with a circle also obeys the rule, so a leaf isn’t guaranteed.
- `not-required`: Both a leaf and a flower are allowed behind a circle.
- `forbidden`: A leaf paired with a circle satisfies the rule. It isn’t forbidden.

**Authoring notes:** Preserve the distinction between “not guaranteed” and “impossible” in Czech.

## Deer and woodland life

### deer-lichen

**Source:** S04.

**Title:** Partners on a rock.

**Question:** “A lichen includes a fungus and algae or certain bacteria living together. Which partner makes food using sunlight?”

- `fungus`: The fungus.
- `light-partner`: The algae or bacterial partner. **Correct.**
- `rock`: The rock or bark underneath.

**Explanation:** Algae or cyanobacteria use light to make food. Cyanobacteria are bacteria that can make food using sunlight. The fungus contributes structure and a protected place to live.

**Feedback:**
- `fungus`: The fungal partner supplies structure, while the algae or cyanobacteria make food from light.
- `light-partner`: The algae or cyanobacteria supply food made using sunlight.
- `rock`: Rock or bark can support the lichen, but isn’t its food-making partner.

**Authoring notes:** Don’t claim a lichen always contains exactly two organisms or the same partners. Keep the unfamiliar term “cyanobacteria” in the explanation, where it’s immediately defined. No extra glossary field is required.

### deer-leaf

**Source:** S05.

**Title:** A leaf’s ingredients.

**Question:** “A green leaf makes sugars in sunlight. Which gas does it take from the air to build them?”

- `oxygen`: Oxygen.
- `nitrogen`: Nitrogen.
- `carbon-dioxide`: Carbon dioxide. **Correct.**

**Explanation:** Photosynthesis is the process by which a green leaf uses light energy, carbon dioxide, and water to make sugars. Carbon dioxide supplies the sugars’ carbon.

**Feedback:**
- `oxygen`: Leaves release oxygen during photosynthesis. It isn’t the source of the sugars’ carbon.
- `nitrogen`: Nitrogen matters to plants, but it isn’t the gas used to supply the carbon in these sugars.
- `carbon-dioxide`: The leaf takes in carbon dioxide and uses its carbon to make sugars.

**Authoring notes:** Don’t imply sunlight becomes matter or that soil and water contribute no material to a tree.

### deer-mushroom

**Source:** S06.

**Title:** A fungus in view.

**Question:** “A mushroom appears beside a fallen log. What part of its fungus are you usually seeing?”

- `fruiting`: A structure that produces spores. **Correct.**
- `entire`: The entire organism.
- `root`: A plant root coming out of the log.

**Explanation:** A mushroom is a fungal fruiting body, a structure that produces spores for reproduction. Much of the organism can be a network of fine threads in soil or wood. The network is called mycelium. Fungi aren’t plants.

**Feedback:**
- `fruiting`: The mushroom is a reproductive structure, while much of the fungus can remain out of sight.
- `entire`: A network of fungal threads can extend beyond the visible mushroom.
- `root`: Fungi aren’t plants, and the mushroom isn’t a plant root.

**Authoring notes:** Don’t imply every fungus makes mushrooms or give foraging advice.

## Badger and established thought experiments

### badger-theseus

**Source:** S07, section 2.5. Ship of Theseus, including the old-parts reconstruction variant.

**Title:** The repaired boat.

**Question:** “A boat’s planks are replaced one at a time. Someone builds another boat from all the old planks. Which two ideas about being the original boat now pull in different directions?”

- `size-speed`: Its size and its speed.
- `materials-history`: Keeping the original material and keeping a continuous history. **Correct.**
- `name-color`: Its name and its paint color.

**Explanation:** One boat continues through the repairs. The other contains the old material. The Ship of Theseus experiment asks what makes an object remain the same through change. It doesn’t settle which boat must be the original.

**Feedback:**
- `size-speed`: The puzzle arises even if the boats have equal size and speed.
- `materials-history`: The old material and the continuous history now belong to different boats.
- `name-color`: Names and paint don’t capture the conflict created by replacing and reassembling the parts.

**Authoring notes:** Attribute the old-parts reconstruction addition to Hobbes if naming its author. Don’t attribute that whole variant to Plutarch or quiz players on author names.

### badger-heap

**Source:** S08. Sorites paradox.

**Title:** When is it a heap?

**Question:** “Badger adds grains of sand one at a time. One grain isn’t a heap, but eventually there’s a heap. Why is it hard to name the exact grain where the change happens?”

- `cannot-count`: Sand can’t be counted, even in principle.
- `sand-grows`: Each grain gets larger when another arrives.
- `vague-word`: The ordinary word ‘heap’ doesn’t give an obvious sharp boundary. **Correct.**

**Explanation:** If adding one grain could never turn a non-heap into a heap, no number of grains could make a heap. Yet a large pile clearly is one. The Sorites paradox uses the conflict to explore words with unclear boundaries.

**Feedback:**
- `cannot-count`: The puzzle remains even when every grain is counted accurately.
- `sand-grows`: Every grain can keep the same size. The puzzle concerns how the word applies.
- `vague-word`: “Heap” has clear examples and unclear boundary cases. Tiny changes make the boundary difficult to identify.

**Authoring notes:** The question identifies the puzzle, not one uncontested solution. Don’t assert that no sharp boundary could exist under any theory.

### badger-experience

**Source:** S09. Nozick’s experience machine. Use the premise below as a small illustration of the experience/action distinction, not a substitute for every condition of Nozick’s full experiment.

**Title:** An experienced song.

**Question:** “A machine gives you an experience exactly like composing a wonderful song, although no song is composed outside the experience. What has the machine guaranteed?”

- `published`: A real song other people can hear.
- `experienced`: The experience of composing, without guaranteeing the real activity. **Correct.**
- `nothing-felt`: That you feel nothing at all.

**Explanation:** Nozick’s experience machine separates how life feels from what someone really does. Whether experience alone is enough for a good life is a further philosophical question.

**Feedback:**
- `published`: The premise doesn’t promise a song composed outside the experience.
- `experienced`: The composing feels real, while the corresponding activity needn’t happen outside the experience.
- `nothing-felt`: The premise promises a vivid experience, not an absence of feeling.

**Authoring notes:** Don’t grade accepting or rejecting a simulated life as right or wrong, or claim the argument conclusively disproves a theory.

## Sources and independent checks

Sources inspected October 19, 2026. Preserve these links and the relevant section labels in the implemented source registry. Reopen them during implementation if wording changes a premise or answer. Write explanations in original language, rather than copying the source.

| ID | Source | What it supports |
| --- | --- | --- |
| S01 | [University of Illinois Data Science Discovery, Monty Hall](https://discovery.cs.illinois.edu/learn/Prediction-and-Probability/The-Monty-Hall-Problem/) and [MIT class 3 solutions, problem 1](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/mit18_05_s22_class03_pset_sol.pdf) | Switching wins in 2 of 3 starting cases in the standard game. Preserve the informed-host rules in the question. |
| S02 | [MIT probability lecture 4 transcript](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/6oV3pKLgW2I_transcript.pdf) | Independent fair tosses, equally likely sequences, and conditioning on a specified event. The exact two-coin answer is independently derived from HH, HT, TH, and TT. |
| S03 | [UCSB research chapter on social reasoning, figure 87.1 and conditional reasoning discussion](https://www.cep.ucsb.edu/wp-content/uploads/2023/05/Socialreas.pdf) | For “if P then Q,” check P and not-Q for violations. Card symbols and the two further deductions are original applications of the same rule. No claim about disputed evolutionary psychology is used. |
| S04 | [National Park Service, Acadia lichens](https://www.nps.gov/acad/learn/nature/lichens.htm) and [Grand Teton lichens](https://home.nps.gov/grte/learn/nature/lichen.htm) | Fungal and photosynthetic partners. The latter source explicitly describes the partners’ roles. |
| S05 | [National Park Service, Matter in motion](https://home.nps.gov/teachers/classrooms/matter-in-motion.htm) | Photosynthesis uses carbon dioxide and water to form sugars with light energy. |
| S06 | [US Forest Service, GTR393, reproduction discussion](https://research.fs.usda.gov/treesearch/download/5106.pdf) | Mushrooms as reproductive structures and mycelium as a network of fungal threads. |
| S07 | [Stanford Encyclopedia of Philosophy, Relative identity, section 2.5](https://plato.stanford.edu/entries/identity-relative/) | Replacement, reconstructed old parts, competing identity criteria, and the Hobbes attribution. |
| S08 | [Stanford Encyclopedia of Philosophy, Sorites paradox](https://plato.stanford.edu/entries/sorites-paradox/) | Vague boundaries and the paradox of gradual changes. It doesn’t establish one uncontested solution. |
| S09 | [Internet Encyclopedia of Philosophy, The experience machine](https://iep.utm.edu/experience-machine/) | The distinction between experiences and actual activities, plus the continuing debate about the argument. |

Before approval of the implemented pack, independently enumerate Monty Hall starting placements and the two-coin outcomes. Check the three Owl items against every allowed letter/symbol pairing. A content-shape test can check IDs and translations but cannot establish scientific or philosophical truth. Record a separate source/answer review for all 12 items.
