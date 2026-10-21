// Grounded animal quizzes. English player text is copied from plans/animal-quiz-content.md
// (Title, Question, options, Explanation, and Feedback only). Czech is an original translation.
// Correctness is keyed by option ID, never by label or position.

export const QUIZ_SOURCES = {
  S01: {
    id: 'S01',
    name: {
      cs: 'Problém Montyho Halla, University of Illinois a Massachusettský technologický institut (MIT)',
      en: 'Monty Hall problem, University of Illinois and Massachusetts Institute of Technology (MIT)',
    },
    summary: {
      cs: 'Obě lekce popisují hádanku z televizní soutěže, ve které moderátor ví, kde je výhra, a vždycky otevře prázdné dveře, které hráč nevybral. Ukazují, že změna volby vyhraje ve 2 ze 3 stejně pravděpodobných výchozích případů.',
      en: 'Both lessons describe a game show puzzle in which the host knows where the prize is and always opens an empty door the player didn’t pick. They show that switching wins in 2 of 3 equally likely starting cases.',
    },
    links: [
      {
        label: { cs: 'The Monty Hall Problem, University of Illinois Data Science Discovery (anglicky)', en: 'The Monty Hall Problem, University of Illinois Data Science Discovery' },
        url: 'https://discovery.cs.illinois.edu/learn/Prediction-and-Probability/The-Monty-Hall-Problem/',
      },
      {
        label: { cs: 'MIT OpenCourseWare, řešení úloh ke 3. lekci, úloha 1 (anglicky)', en: 'MIT OpenCourseWare, class 3 solutions, problem 1' },
        url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/mit18_05_s22_class03_pset_sol.pdf',
      },
    ],
  },
  S02: {
    id: 'S02',
    name: {
      cs: 'Massachusettský technologický institut (MIT), 4. přednáška o pravděpodobnosti',
      en: 'Massachusetts Institute of Technology (MIT), probability lecture 4',
    },
    summary: {
      cs: 'Přednáška pracuje s nezávislými hody spravedlivou mincí, při kterých je každé možné pořadí výsledků stejně pravděpodobné. Ukazuje také, jak určit šanci, když víme, že nastala určitá událost.',
      en: 'The lecture works with independent tosses of a fair coin, where every sequence of heads and tails is equally likely. It also shows how to find a chance once you know that a particular event happened.',
    },
    links: [
      {
        label: { cs: 'MIT OpenCourseWare, přepis 4. přednášky o pravděpodobnosti (anglicky)', en: 'MIT OpenCourseWare, probability lecture 4 transcript' },
        url: 'https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/6oV3pKLgW2I_transcript.pdf',
      },
    ],
  },
  S03: {
    id: 'S03',
    name: {
      cs: 'Výzkumná kapitola o sociálním uvažování, Kalifornská univerzita v Santa Barbaře',
      en: 'Research chapter on social reasoning, University of California, Santa Barbara',
    },
    summary: {
      cs: 'Kapitola popisuje Wasonovu výběrovou úlohu, karetní hádanku o ověřování pravidla typu „když P, pak Q“. Její obrázek 87.1 vysvětluje, proč porušení pravidla může odhalit jen karta s P a karta s ne-Q.',
      en: 'The chapter describes the Wason selection task, a card puzzle about checking a rule of the form “if P, then Q.” Its figure 87.1 explains why only the P card and the not-Q card can reveal a violation.',
    },
    links: [
      {
        label: { cs: 'The Cognitive Neuroscience of Social Reasoning, Kalifornská univerzita v Santa Barbaře (anglicky)', en: 'The Cognitive Neuroscience of Social Reasoning, University of California, Santa Barbara' },
        url: 'https://www.cep.ucsb.edu/wp-content/uploads/2023/05/Socialreas.pdf',
      },
    ],
  },
  S04: {
    id: 'S04',
    name: {
      cs: 'Správa národních parků Spojených států, stránky o lišejnících v parcích Acadia a Grand Teton',
      en: 'National Park Service, lichen pages for Acadia and Grand Teton',
    },
    summary: {
      cs: 'Obě stránky vysvětlují, že lišejník je společenství houby a řas nebo sinic, tedy bakterií, které umějí vyrábět potravu ze slunečního světla. Stránka parku Grand Teton uvádí, že houba tvoří tělo lišejníku a její partner vyrábí potravu.',
      en: 'Both park pages explain that a lichen is a partnership between a fungus and algae or cyanobacteria, which are bacteria that can make food from sunlight. The Grand Teton page says the fungus builds the lichen’s body, while its partner makes food.',
    },
    links: [
      {
        label: { cs: 'Lichens, národní park Acadia (anglicky)', en: 'Lichens, Acadia National Park' },
        url: 'https://www.nps.gov/acad/learn/nature/lichens.htm',
      },
      {
        label: { cs: 'Lichen, národní park Grand Teton (anglicky)', en: 'Lichen, Grand Teton National Park' },
        url: 'https://home.nps.gov/grte/learn/nature/lichen.htm',
      },
    ],
  },
  S05: {
    id: 'S05',
    name: {
      cs: 'Správa národních parků Spojených států, výukový materiál Matter in Motion',
      en: 'National Park Service, Matter in motion',
    },
    summary: {
      cs: 'Výukový materiál vysvětluje fotosyntézu: rostliny pomocí energie slunečního světla mění oxid uhličitý a vodu na cukry a uvolňují kyslík.',
      en: 'The classroom guide explains photosynthesis: plants use energy from sunlight to turn carbon dioxide and water into sugars, and they release oxygen.',
    },
    links: [
      {
        label: { cs: 'Matter in Motion, National Park Service (anglicky)', en: 'Matter in Motion, National Park Service' },
        url: 'https://home.nps.gov/teachers/classrooms/matter-in-motion.htm',
      },
    ],
  },
  S06: {
    id: 'S06',
    name: {
      cs: 'Lesní služba Spojených států, zpráva o houbách v pohoří Blue Mountains',
      en: 'United States Forest Service, report on Blue Mountains mushrooms',
    },
    summary: {
      cs: 'Oddíl zprávy o rozmnožování vysvětluje, že viditelné houby jsou plodnice, které vytvářejí výtrusy. Většinu houby podle zprávy tvoří podhoubí, síť jemných vláken v půdě nebo ve dřevě, která často zůstává skrytá.',
      en: 'The report’s section on reproduction explains that mushrooms are reproductive structures that produce spores. It says the bulk of the fungus is mycelium, a network of fine threads in soil or wood that often stays out of sight.',
    },
    links: [
      {
        label: { cs: 'Wild Edible Mushrooms in the Blue Mountains, Lesní služba Spojených států (anglicky)', en: 'Wild Edible Mushrooms in the Blue Mountains, United States Forest Service' },
        url: 'https://research.fs.usda.gov/treesearch/download/5106.pdf',
      },
    ],
  },
  S07: {
    id: 'S07',
    name: {
      cs: 'Stanfordská encyklopedie filozofie, heslo Relativní identita',
      en: 'Stanford Encyclopedia of Philosophy, Relative identity',
    },
    summary: {
      cs: 'Oddíl 2.5 rozebírá Théseovu loď, starý příběh o lodi opravované novými prkny, který zaznamenal Plútarchos, i dodatek Thomase Hobbese, podle kterého někdo ze starých dílů postaví druhou loď. Ukazuje, že různá pojetí toho, co znamená zůstat týmž předmětem, můžou za původní označit různé lodě, a žádnou odpověď nevyhlašuje za rozhodnutou.',
      en: 'Section 2.5 discusses the Ship of Theseus, an old story recorded by Plutarch about a ship repaired with new planks, and Thomas Hobbes’s addition of a second ship rebuilt from the old parts. It shows how different ideas of staying the same object can point to different ships, without declaring one answer settled.',
    },
    links: [
      {
        label: { cs: 'Relative Identity, Stanford Encyclopedia of Philosophy (anglicky)', en: 'Relative Identity, Stanford Encyclopedia of Philosophy' },
        url: 'https://plato.stanford.edu/entries/identity-relative/',
      },
    ],
  },
  S08: {
    id: 'S08',
    name: {
      cs: 'Stanfordská encyklopedie filozofie, heslo Paradox hromady',
      en: 'Stanford Encyclopedia of Philosophy, Sorites paradox',
    },
    summary: {
      cs: 'Heslo vysvětluje paradox hromady, ve kterém se zdá, že přidání jediného zrnka nikdy nic nezmění, a spojuje ho se slovy s nejasnými hranicemi. Porovnává několik navržených řešení a žádné neprohlašuje za jediné správné.',
      en: 'The entry explains the paradox of the heap, where adding one grain never seems to make the difference, and connects it to words with unclear boundaries. It compares several proposed solutions rather than declaring one correct.',
    },
    links: [
      {
        label: { cs: 'Sorites Paradox, Stanford Encyclopedia of Philosophy (anglicky)', en: 'Sorites Paradox, Stanford Encyclopedia of Philosophy' },
        url: 'https://plato.stanford.edu/entries/sorites-paradox/',
      },
    ],
  },
  S09: {
    id: 'S09',
    name: {
      cs: 'Internetová encyklopedie filozofie, heslo Stroj na zážitky',
      en: 'Internet Encyclopedia of Philosophy, The experience machine',
    },
    summary: {
      cs: 'Heslo popisuje myšlenkový experiment Roberta Nozicka se strojem, který dává zážitky, třeba pocit, že píšeš skvělou báseň, aniž by se něco takového skutečně stalo. Zabývá se také pokračující debatou o tom, co experiment ukazuje.',
      en: 'The entry describes Robert Nozick’s thought experiment about a machine that gives you experiences, such as the feeling of writing a great poem, without the real achievement. It also covers the continuing debate about what the experiment shows.',
    },
    links: [
      {
        label: { cs: 'The Experience Machine, Internet Encyclopedia of Philosophy (anglicky)', en: 'The Experience Machine, Internet Encyclopedia of Philosophy' },
        url: 'https://iep.utm.edu/experience-machine/',
      },
    ],
  },
};

export const QUIZZES = {
  fox: [
    {
      id: 'fox-monty',
      kind: 'probability',
      title: { cs: 'Tři košíky', en: 'Three baskets' },
      premise: {
        cs: 'Brambora je náhodně schovaná v jednom ze tří přikrytých košíků. Zbylé dva jsou prázdné. Vybereš si jeden košík. Já vím, kde brambora je. Vždycky odkryju prázdný košík, který sis nevybrala, a pak ti nabídnu výměnu. Která strategie najde během mnoha kol víc brambor?',
        en: 'A potato is hidden at random in one of three covered baskets. The other two are empty. You choose a basket. I know where the potato is. I always uncover an empty basket you didn’t choose, then offer a swap. Which strategy finds more potatoes over many rounds?',
      },
      options: [
        { id: 'stay', cs: 'Nechat si první košík.', en: 'Keep the first basket.' },
        { id: 'switch', cs: 'Vyměnit za druhý přikrytý košík.', en: 'Swap to the other covered basket.' },
        { id: 'equal', cs: 'Obě strategie vyhrávají stejně často.', en: 'Both strategies win equally often.' },
      ],
      correctOptionId: 'switch',
      explanation: {
        cs: 'Tvoje první volba vyhraje v 1 ze 3 stejně pravděpodobných výchozích případů. Výměna vyhraje ve zbylých 2, protože Liška vždycky vyřadí prázdnou možnost. Jedno šťastné nebo smolné kolo nezmění, která strategie vyhrává častěji.',
        en: 'Your first choice wins in 1 of 3 equally likely starting cases. Swapping wins in the other 2, because Fox always removes an empty alternative. One lucky or unlucky round doesn’t change which strategy wins more often.',
      },
      feedback: {
        stay: {
          cs: 'Když si necháš první košík, zůstane mu původní šance 1 ze 3.',
          en: 'Keeping the first basket preserves its original 1-in-3 chance.',
        },
        switch: {
          cs: 'Výměna vyhraje pokaždé, když byla tvoje první volba špatná, a to se stane ve 2 ze 3 výchozích případů.',
          en: 'Swapping wins whenever your first choice was wrong, which happens in 2 of the 3 starting cases.',
        },
        equal: {
          cs: 'Dva přikryté košíky ještě neznamenají, že jsou obě strategie rovnocenné. Liška věděla, kde brambora je, a vyřadila prázdný košík.',
          en: 'Two closed baskets don’t make the strategies equal. Fox knowingly removed an empty one.',
        },
      },
      sources: [{ id: 'S01', section: { cs: 'MIT, řešení úloh ke 3. lekci, úloha 1', en: 'MIT class 3 solutions, problem 1' } }],
    },
    {
      id: 'fox-independent',
      kind: 'probability',
      title: { cs: 'Paměť mince', en: 'A coin’s memory' },
      premise: {
        cs: 'Spravedlivá mince se pokaždé hází nezávisle. Pětkrát za sebou padla panna. Jaká je šance, že při dalším hodu padne panna?',
        en: 'A fair coin is tossed independently each time. It has landed heads five times in a row. What’s the chance of heads on the next toss?',
      },
      options: [
        { id: 'half', cs: '1 ze 2.', en: '1 in 2.' },
        { id: 'less', cs: 'Méně než 1 ze 2, protože je na řadě orel.', en: 'Less than 1 in 2, because tails is due.' },
        { id: 'more', cs: 'Více než 1 ze 2, protože panna má zrovna šňůru.', en: 'More than 1 in 2, because heads has a streak.' },
      ],
      correctOptionId: 'half',
      explanation: {
        cs: '„Nezávisle“ znamená, že dřívější hody nemění šanci při dalším hodu. Spravedlivá mince má pořád dva stejně pravděpodobné výsledky. Žádný dluh vůči orlovi ani vítězná šňůra pravidla zadání nemění.',
        en: '“Independent” means earlier tosses don’t change the next toss’s chance. A fair coin still has two equally likely outcomes. Neither a debt to tails nor a winning streak changes the stated rules.',
      },
      feedback: {
        half: {
          cs: 'Mince je spravedlivá a dřívější nezávislé hody nemění její šanci při dalším hodu.',
          en: 'The coin is fair, and earlier independent tosses don’t change its next chance.',
        },
        less: {
          cs: 'Orel na řadě není. Dřívější hody nesnižují šanci, že při dalším hodu padne panna.',
          en: 'Tails isn’t due. Earlier tosses don’t make heads less likely on the next toss.',
        },
        more: {
          cs: 'Když panna padla několikrát za sebou, podle pravidel zadání to šanci na další pannu nezvyšuje.',
          en: 'A run of heads doesn’t make another head more likely under the stated rules.',
        },
      },
      sources: [{ id: 'S02', section: null }],
    },
    {
      id: 'fox-two-coins',
      kind: 'probability',
      title: { cs: 'Dvě mince', en: 'Two coins' },
      premise: {
        cs: 'Hoď dvěma nezávislými spravedlivými mincemi. Kdykoli na obou padne orel, hod zopakuj. Jaká je šance, že v kole, které ponecháš, padla na obou panna?',
        en: 'Toss two independent fair coins. Repeat whenever both are tails. In a round you keep, what’s the chance both are heads?',
      },
      options: [
        { id: 'quarter', cs: '1 ze 4.', en: '1 in 4.' },
        { id: 'half', cs: '1 ze 2.', en: '1 in 2.' },
        { id: 'third', cs: '1 ze 3.', en: '1 in 3.' },
      ],
      correctOptionId: 'third',
      explanation: {
        cs: 'Panna/panna, panna/orel, orel/panna a orel/orel jsou na začátku stejně pravděpodobné. Po vyřazení možnosti orel/orel zbudou tři stejně pravděpodobné výsledky. Dvě panny má jen jeden z nich.',
        en: 'Heads/heads, heads/tails, tails/heads, and tails/tails begin equally likely. Discarding tails/tails leaves three equally likely outcomes. Only one has two heads.',
      },
      feedback: {
        quarter: {
          cs: '1 ze 4 započítává i kola orel/orel, která zadání vyřazuje.',
          en: '1 in 4 counts the tails/tails rounds that the question discards.',
        },
        half: {
          cs: 'Jedna panna může padnout dvěma způsoby: panna/orel a orel/panna. Jsou to dva různé výsledky.',
          en: 'One head can happen in two ways: heads/tails and tails/heads. They’re separate outcomes.',
        },
        third: {
          cs: 'Dvě panny má jeden ze tří zbývajících stejně pravděpodobných výsledků.',
          en: 'One of the three remaining equally likely outcomes has two heads.',
        },
      },
      sources: [{ id: 'S02', section: null }],
    },
  ],
  owl: [
    {
      id: 'owl-cards',
      kind: 'logic',
      title: { cs: 'Otoč správné karty', en: 'Turn the right cards' },
      premise: {
        cs: 'Každá karta má na jedné straně písmeno a na druhé číslo. Vidíš A, D, 4 a 7. Pravidlo říká, že každá samohláska má na druhé straně sudé číslo. Které karty musíš otočit, abys zjistila, jestli některá karta pravidlo porušuje?',
        en: 'Each card has a letter on one side and a number on the other. You can see A, D, 4, and 7. The rule says every vowel has an even number on its other side. Which cards must you turn over to check for a violation?',
      },
      options: [
        { id: 'a-four', cs: 'A a 4.', en: 'A and 4.' },
        { id: 'a-seven', cs: 'A a 7.', en: 'A and 7.' },
        { id: 'all', cs: 'Nutné jsou všechny čtyři karty.', en: 'All four cards are necessary.' },
      ],
      correctOptionId: 'a-seven',
      explanation: {
        cs: 'Na druhé straně A může být liché číslo. Na druhé straně 7 může být samohláska. Obojí by pravidlo porušilo. Karty D a 4 toto jednosměrné pravidlo porušit nemůžou, ať je na jejich skryté straně cokoli.',
        en: 'A could hide an odd number. 7 could hide a vowel. Either would break the rule. D and 4 can’t break the stated one-way rule, whatever their hidden sides show.',
      },
      feedback: {
        'a-four': {
          cs: 'Karta 4 pravidlo porušit nemůže, ale neotočená 7 může skrývat samohlásku.',
          en: 'The 4 can’t break the rule, but an unchecked 7 could hide a vowel.',
        },
        'a-seven': {
          cs: 'Právě tyhle dvě karty můžou odhalit porušení pravidla.',
          en: 'These are the two cards that could reveal a violation.',
        },
        all: {
          cs: 'Otočit všechny čtyři by fungovalo, ale kontrolovat D a 4 nutné není.',
          en: 'Turning all four would work, but D and 4 aren’t necessary checks.',
        },
      },
      sources: [{ id: 'S03', section: { cs: 'obrázek 87.1', en: 'figure 87.1' } }],
    },
    {
      id: 'owl-counterexample',
      kind: 'logic',
      title: { cs: 'Jeden protipříklad', en: 'One counterexample' },
      premise: {
        cs: 'Každá karta má na jedné straně buď list, nebo květ a na druhé straně buď kruh, nebo čtverec. Sovino pravidlo říká, že každý list má na druhé straně kruh. Které zjištění dokazuje, že pravidlo neplatí?',
        en: 'Each card has a leaf or a flower on one side, and a circle or a square on the other. Owl’s rule says every leaf has a circle on its other side. Which discovery disproves the rule?',
      },
      options: [
        { id: 'match', cs: 'List, který má na druhé straně kruh.', en: 'A leaf with a circle on the other side.' },
        { id: 'irrelevant', cs: 'Květ, který má na druhé straně kruh.', en: 'A flower with a circle on the other side.' },
        { id: 'violation', cs: 'List, který má na druhé straně čtverec a žádný kruh.', en: 'A leaf with a square, and no circle, on the other side.' },
      ],
      correctOptionId: 'violation',
      explanation: {
        cs: 'K porušení obecného pravidla stačí jediný případ, který splní jeho podmínku, ale nesplní jeho důsledek. Karta, která pravidlu odpovídá, s ním souhlasí. O kartách s květy pravidlo neříká nic.',
        en: 'A universal rule is broken by one case that meets its condition but fails its consequence. The matching card agrees with the rule. The rule says nothing about cards with flowers.',
      },
      feedback: {
        match: {
          cs: 'List spojený s kruhem s pravidlem souhlasí.',
          en: 'A leaf paired with a circle agrees with the rule.',
        },
        irrelevant: {
          cs: 'Pravidlo nijak neomezuje, co je na druhé straně květu.',
          en: 'The rule places no restriction on a flower’s other side.',
        },
        violation: {
          cs: 'List bez kruhu je přesně ten druh karty, který pravidlo zakazuje.',
          en: 'A leaf without a circle is exactly the kind of card the rule forbids.',
        },
      },
      sources: [{ id: 'S03', section: { cs: 'obrázek 87.1', en: 'figure 87.1' } }],
    },
    {
      id: 'owl-reverse',
      kind: 'logic',
      title: { cs: 'Dá se pravidlo obrátit?', en: 'Can you reverse a rule?' },
      premise: {
        cs: 'Každá karta má na jedné straně buď list, nebo květ a na druhé straně buď kruh, nebo čtverec. Každý list má na druhé straně kruh. Na kartě je vidět kruh. Musí být na její skryté straně list?',
        en: 'Each card has a leaf or a flower on one side, and a circle or a square on the other. Every leaf has a circle on its other side. A card shows a circle. Must its hidden side have a leaf?',
      },
      options: [
        { id: 'yes', cs: 'Ano, pravidlo list zaručuje.', en: 'Yes, the rule guarantees a leaf.' },
        { id: 'not-required', cs: 'Ne. List tam být může, ale povolený je i jiný symbol.', en: 'No. A leaf is possible, but another symbol is allowed.' },
        { id: 'forbidden', cs: 'Ne. List by pravidlo porušil.', en: 'No. A leaf would break the rule.' },
      ],
      correctOptionId: 'not-required',
      explanation: {
        cs: '„Když list, pak kruh“ neznamená „když kruh, pak list“. Kruh může být spojený s květem, aniž by se pravidlo porušilo. List je povolený také.',
        en: '“If leaf, then circle” doesn’t mean “if circle, then leaf.” A circle could be paired with a flower without breaking the rule. A leaf is also allowed.',
      },
      feedback: {
        yes: {
          cs: 'Květ spojený s kruhem pravidlo také splňuje, takže list zaručený není.',
          en: 'A flower paired with a circle also obeys the rule, so a leaf isn’t guaranteed.',
        },
        'not-required': {
          cs: 'Na druhé straně karty s kruhem smí být list i květ.',
          en: 'Both a leaf and a flower are allowed behind a circle.',
        },
        forbidden: {
          cs: 'List spojený s kruhem pravidlo splňuje. Zakázaný není.',
          en: 'A leaf paired with a circle satisfies the rule. It isn’t forbidden.',
        },
      },
      sources: [{ id: 'S03', section: { cs: 'obrázek 87.1', en: 'figure 87.1' } }],
    },
  ],
  deer: [
    {
      id: 'deer-lichen',
      kind: 'nature',
      title: { cs: 'Partneři na kameni', en: 'Partners on a rock' },
      premise: {
        cs: 'V lišejníku spolu žijí houba a řasy nebo určité bakterie. Který partner vyrábí potravu pomocí slunečního světla?',
        en: 'A lichen includes a fungus and algae or certain bacteria living together. Which partner makes food using sunlight?',
      },
      options: [
        { id: 'fungus', cs: 'Houba.', en: 'The fungus.' },
        { id: 'light-partner', cs: 'Partner, kterým jsou řasy nebo bakterie.', en: 'The algae or bacterial partner.' },
        { id: 'rock', cs: 'Kámen nebo kůra pod lišejníkem.', en: 'The rock or bark underneath.' },
      ],
      correctOptionId: 'light-partner',
      explanation: {
        cs: 'Řasy nebo sinice vyrábějí potravu pomocí světla. Sinice jsou bakterie, které umějí vyrábět potravu pomocí slunečního světla. Houba tvoří stavbu lišejníku a poskytuje chráněné místo k životu.',
        en: 'Algae or cyanobacteria use light to make food. Cyanobacteria are bacteria that can make food using sunlight. The fungus contributes structure and a protected place to live.',
      },
      feedback: {
        fungus: {
          cs: 'Houba tvoří stavbu lišejníku, zatímco řasy nebo sinice vyrábějí potravu ze světla.',
          en: 'The fungal partner supplies structure, while the algae or cyanobacteria make food from light.',
        },
        'light-partner': {
          cs: 'Řasy nebo sinice dodávají potravu vyrobenou pomocí slunečního světla.',
          en: 'The algae or cyanobacteria supply food made using sunlight.',
        },
        rock: {
          cs: 'Kámen nebo kůra můžou lišejníku sloužit jako podklad, ale nejsou partnerem, který vyrábí potravu.',
          en: 'Rock or bark can support the lichen, but isn’t its food-making partner.',
        },
      },
      sources: [{ id: 'S04', section: null }],
    },
    {
      id: 'deer-leaf',
      kind: 'nature',
      title: { cs: 'Suroviny listu', en: 'A leaf’s ingredients' },
      premise: {
        cs: 'Zelený list vyrábí na slunci cukry. Který plyn přijímá ze vzduchu, aby je mohl vytvořit?',
        en: 'A green leaf makes sugars in sunlight. Which gas does it take from the air to build them?',
      },
      options: [
        { id: 'oxygen', cs: 'Kyslík.', en: 'Oxygen.' },
        { id: 'nitrogen', cs: 'Dusík.', en: 'Nitrogen.' },
        { id: 'carbon-dioxide', cs: 'Oxid uhličitý.', en: 'Carbon dioxide.' },
      ],
      correctOptionId: 'carbon-dioxide',
      explanation: {
        cs: 'Fotosyntéza je proces, při kterém zelený list používá energii světla, oxid uhličitý a vodu k výrobě cukrů. Uhlík v cukrech pochází z oxidu uhličitého.',
        en: 'Photosynthesis is the process by which a green leaf uses light energy, carbon dioxide, and water to make sugars. Carbon dioxide supplies the sugars’ carbon.',
      },
      feedback: {
        oxygen: {
          cs: 'Listy při fotosyntéze kyslík uvolňují. Není to zdroj uhlíku v cukrech.',
          en: 'Leaves release oxygen during photosynthesis. It isn’t the source of the sugars’ carbon.',
        },
        nitrogen: {
          cs: 'Dusík je pro rostliny důležitý, ale není to plyn, který do těchto cukrů dodává uhlík.',
          en: 'Nitrogen matters to plants, but it isn’t the gas used to supply the carbon in these sugars.',
        },
        'carbon-dioxide': {
          cs: 'List přijímá oxid uhličitý a jeho uhlík používá k výrobě cukrů.',
          en: 'The leaf takes in carbon dioxide and uses its carbon to make sugars.',
        },
      },
      sources: [{ id: 'S05', section: null }],
    },
    {
      id: 'deer-mushroom',
      kind: 'nature',
      title: { cs: 'Houba na dohled', en: 'A fungus in view' },
      premise: {
        cs: 'U padlého kmene vyrostla houba. Jakou část houbového organismu obvykle vidíš?',
        en: 'A mushroom appears beside a fallen log. What part of its fungus are you usually seeing?',
      },
      options: [
        { id: 'fruiting', cs: 'Útvar, který vytváří výtrusy.', en: 'A structure that produces spores.' },
        { id: 'entire', cs: 'Celý organismus.', en: 'The entire organism.' },
        { id: 'root', cs: 'Kořen rostliny, který vyrůstá z kmene.', en: 'A plant root coming out of the log.' },
      ],
      correctOptionId: 'fruiting',
      explanation: {
        cs: 'To, čemu běžně říkáme houba, je plodnice, tedy útvar, který vytváří výtrusy k rozmnožování. Velkou část organismu může tvořit síť jemných vláken v půdě nebo ve dřevě. Té síti se říká podhoubí. Houby nejsou rostliny.',
        en: 'A mushroom is a fungal fruiting body, a structure that produces spores for reproduction. Much of the organism can be a network of fine threads in soil or wood. The network is called mycelium. Fungi aren’t plants.',
      },
      feedback: {
        fruiting: {
          cs: 'Viditelná houba je útvar k rozmnožování, zatímco velká část organismu může zůstat skrytá.',
          en: 'The mushroom is a reproductive structure, while much of the fungus can remain out of sight.',
        },
        entire: {
          cs: 'Síť houbových vláken může sahat i mimo viditelnou houbu.',
          en: 'A network of fungal threads can extend beyond the visible mushroom.',
        },
        root: {
          cs: 'Houby nejsou rostliny a viditelná houba není kořen rostliny.',
          en: 'Fungi aren’t plants, and the mushroom isn’t a plant root.',
        },
      },
      sources: [{ id: 'S06', section: { cs: 'oddíl o rozmnožování', en: 'reproduction section' } }],
    },
  ],
  badger: [
    {
      id: 'badger-theseus',
      kind: 'thought-experiment',
      title: { cs: 'Opravená loďka', en: 'The repaired boat' },
      premise: {
        cs: 'Prkna loďky se vyměňují jedno po druhém. Ze všech starých prken někdo postaví další loďku. Které dvě představy o tom, co znamená být původní loďkou, teď táhnou každá jiným směrem?',
        en: 'A boat’s planks are replaced one at a time. Someone builds another boat from all the old planks. Which two ideas about being the original boat now pull in different directions?',
      },
      options: [
        { id: 'size-speed', cs: 'Její velikost a její rychlost.', en: 'Its size and its speed.' },
        { id: 'materials-history', cs: 'Zachování původního materiálu a zachování nepřerušené historie.', en: 'Keeping the original material and keeping a continuous history.' },
        { id: 'name-color', cs: 'Její jméno a barva jejího nátěru.', en: 'Its name and its paint color.' },
      ],
      correctOptionId: 'materials-history',
      explanation: {
        cs: 'Jedna loďka trvá i během všech oprav. Druhá obsahuje starý materiál. Myšlenkový experiment s Théseovou lodí se ptá, díky čemu zůstává předmět i přes změny týmž předmětem. Nerozhoduje, která loďka musí být ta původní.',
        en: 'One boat continues through the repairs. The other contains the old material. The Ship of Theseus experiment asks what makes an object remain the same through change. It doesn’t settle which boat must be the original.',
      },
      feedback: {
        'size-speed': {
          cs: 'Hádanka vzniká, i když mají obě loďky stejnou velikost a rychlost.',
          en: 'The puzzle arises even if the boats have equal size and speed.',
        },
        'materials-history': {
          cs: 'Starý materiál a nepřerušená historie teď patří dvěma různým loďkám.',
          en: 'The old material and the continuous history now belong to different boats.',
        },
        'name-color': {
          cs: 'Jméno ani nátěr nevystihují rozpor, který vznikl výměnou dílů a jejich opětovným sestavením.',
          en: 'Names and paint don’t capture the conflict created by replacing and reassembling the parts.',
        },
      },
      sources: [{ id: 'S07', section: { cs: 'oddíl 2.5', en: 'section 2.5' } }],
    },
    {
      id: 'badger-heap',
      kind: 'thought-experiment',
      title: { cs: 'Kdy je to hromada?', en: 'When is it a heap?' },
      premise: {
        cs: 'Jezevec přidává zrnka písku jedno po druhém. Jedno zrnko není hromada, ale nakonec hromada je. Proč je těžké určit přesné zrnko, u kterého ke změně dojde?',
        en: 'Badger adds grains of sand one at a time. One grain isn’t a heap, but eventually there’s a heap. Why is it hard to name the exact grain where the change happens?',
      },
      options: [
        { id: 'cannot-count', cs: 'Písek nejde spočítat ani v principu.', en: 'Sand can’t be counted, even in principle.' },
        { id: 'sand-grows', cs: 'Každé zrnko se zvětší, když přibude další.', en: 'Each grain gets larger when another arrives.' },
        { id: 'vague-word', cs: 'Běžné slovo ‚hromada‘ neurčuje zjevnou ostrou hranici.', en: 'The ordinary word ‘heap’ doesn’t give an obvious sharp boundary.' },
      ],
      correctOptionId: 'vague-word',
      explanation: {
        cs: 'Kdyby jedno přidané zrnko nikdy nemohlo udělat hromadu z něčeho, co hromada není, žádný počet zrnek by hromadu nevytvořil. Velká kupa písku přitom hromadou zjevně je. Paradox hromady (sorites) tento rozpor používá ke zkoumání slov s nejasnými hranicemi.',
        en: 'If adding one grain could never turn a non-heap into a heap, no number of grains could make a heap. Yet a large pile clearly is one. The Sorites paradox uses the conflict to explore words with unclear boundaries.',
      },
      feedback: {
        'cannot-count': {
          cs: 'Hádanka zůstává, i když se každé zrnko přesně spočítá.',
          en: 'The puzzle remains even when every grain is counted accurately.',
        },
        'sand-grows': {
          cs: 'Každé zrnko může mít pořád stejnou velikost. Hádanka se týká toho, kdy se slovo dá použít.',
          en: 'Every grain can keep the same size. The puzzle concerns how the word applies.',
        },
        'vague-word': {
          cs: '„Hromada“ má jasné příklady i nejasné hraniční případy. Kvůli drobným změnám je těžké hranici najít.',
          en: '“Heap” has clear examples and unclear boundary cases. Tiny changes make the boundary difficult to identify.',
        },
      },
      sources: [{ id: 'S08', section: null }],
    },
    {
      id: 'badger-experience',
      kind: 'thought-experiment',
      title: { cs: 'Prožitá píseň', en: 'An experienced song' },
      premise: {
        cs: 'Stroj ti dá zážitek přesně takový, jako když skládáš nádhernou píseň, přestože mimo tento zážitek žádná píseň nevznikne. Co ti stroj zaručil?',
        en: 'A machine gives you an experience exactly like composing a wonderful song, although no song is composed outside the experience. What has the machine guaranteed?',
      },
      options: [
        { id: 'published', cs: 'Skutečnou píseň, kterou můžou slyšet i ostatní.', en: 'A real song other people can hear.' },
        { id: 'experienced', cs: 'Zážitek skládání, aniž by zaručil skutečnou činnost.', en: 'The experience of composing, without guaranteeing the real activity.' },
        { id: 'nothing-felt', cs: 'Že necítíš vůbec nic.', en: 'That you feel nothing at all.' },
      ],
      correctOptionId: 'experienced',
      explanation: {
        cs: 'Nozickův stroj na zážitky odděluje to, jak člověk život prožívá, od toho, co skutečně dělá. Jestli pro dobrý život stačí samotné zážitky, je další filozofická otázka.',
        en: 'Nozick’s experience machine separates how life feels from what someone really does. Whether experience alone is enough for a good life is a further philosophical question.',
      },
      feedback: {
        published: {
          cs: 'Zadání neslibuje píseň, která by vznikla mimo zážitek.',
          en: 'The premise doesn’t promise a song composed outside the experience.',
        },
        experienced: {
          cs: 'Skládání působí skutečně, ale odpovídající činnost se mimo zážitek dít nemusí.',
          en: 'The composing feels real, while the corresponding activity needn’t happen outside the experience.',
        },
        'nothing-felt': {
          cs: 'Zadání slibuje živý zážitek, ne to, že nic neucítíš.',
          en: 'The premise promises a vivid experience, not an absence of feeling.',
        },
      },
      sources: [{ id: 'S09', section: null }],
    },
  ],
};

export const QUIZ_IDS = Object.values(QUIZZES).flat().map(item => item.id);

const QUIZ_INDEX = new Map(Object.entries(QUIZZES).flatMap(([animal, items]) => items.map(item => [item.id, { item, animal }])));

export function findQuiz(id) {
  return QUIZ_INDEX.get(id)?.item ?? null;
}

export function quizAnimal(id) {
  return QUIZ_INDEX.get(id)?.animal ?? null;
}
