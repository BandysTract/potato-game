export const HOUSE_ACTIVITIES = [
  { id: 'john', name: 'John', theme: 'Hana’s husband', label: 'Say hello to John', action: 'Say hello', message: 'John gets the bowls. Hana goes to spend a moment with Aldo.' },
  { id: 'aldo', name: 'Aldo', theme: 'Hana and John’s infant son', label: 'Spend a moment with Aldo', action: 'Spend a moment', message: 'Aldo settles into his cot. It’s time to prepare the potatoes.' },
  { id: 'prepare', name: 'Kitchen counter', label: 'Prepare the potatoes', action: 'Prepare', message: 'Hana washes and chops the potatoes. The pot is waiting on the stove.' },
  { id: 'cook', name: 'Stove', label: 'Cook dinner', action: 'Cook', message: 'The potatoes simmer into soup. Dinner’s ready to bring to the table.' },
  { id: 'serve', name: 'Dinner table', label: 'Serve dinner at the table', action: 'Serve dinner', message: 'Hana and John sit down to supper while Aldo sleeps nearby.' },
];

// Original fictional conversations, not quotations from Czech folklore.
export const DIALOGUES = {
  john: {
    opening: { cs: '„Ahoj, lásko. Aldo už čekal, až se ozvou tvoje kroky. Jak bylo v lese?“', en: '“Hello, love. Aldo’s been listening for your footsteps. How was the forest?”' },
    choices: [
      {
        cs: 'Zpívala jsem s vílami. A nesu nám brambory k večeři.',
        en: 'I sang with the fairies. And I brought potatoes for our supper.',
        reply: { cs: '„Tak mi při vaření něco zazpíváš? Já zatím připravím stůl.“', en: '“Will you sing me a little of it while we cook? I’ll set the table.”' },
        reflection: { cs: 'Nejdřív se půjdu podívat na našeho malého.', en: 'First, I’ll go and see our little boy.' },
      },
      {
        cs: 'Bylo tam krásně. Ale už jsem se na vás oba těšila.',
        en: 'It was lovely. But I missed you both.',
        reply: { cs: '„My tebe taky. Aldo se před chvílí probudil. Běž za ním, já najdu misky.“', en: '“We missed you, too. Aldo woke a moment ago. Go and see him. I’ll find the bowls.”' },
        reflection: { cs: 'Jsem ráda, že jsem doma.', en: 'I’m glad I’m home.' },
      },
    ],
  },
  aldo: {
    opening: { cs: 'Malý Aldo leží v kolébce. Když uslyší Hanu, zamrká a natáhne ručičku.', en: 'Baby Aldo lies in his cot. When he hears Hana, he blinks and reaches out a tiny hand.' },
    choices: [
      {
        cs: 'Nabídnu mu prst, ať se může chytit.',
        en: 'Offer him a finger to hold.',
        reply: { cs: 'Aldo sevře Hanin prst. Chvíli se na ni dívá a pak tiše zívne.', en: 'Aldo curls his hand around Hana’s finger. He watches her for a while, then gives a little yawn.' },
        reflection: { cs: 'Ahoj, maličký. Už jsem u tebe.', en: 'Hello, little one. I’m here.' },
      },
      {
        cs: 'Potichu mu zabroukám písničku z lesa.',
        en: 'Hum him the tune from the woods.',
        reply: { cs: 'Aldo poslouchá, ručičky mu pomalu klesnou a oči se zavřou.', en: 'Aldo listens. His hands relax, and his eyes slowly close.' },
        reflection: { cs: 'Odpočiň si. Budeme kousek od tebe.', en: 'Rest now. We’ll be nearby.' },
      },
    ],
  },
  fox: [
    {
      theme: { cs: 'Stejné porce, nebo různý hlad?', en: 'Equal shares, or different appetites?' },
      opening: { cs: '„Představ si šest brambor a u stolu dva hladové lidi. John celý den nosil dřevo, ty jsi prošla les. Rozdělíš večeři napůl?“', en: '“Suppose you’ve got six potatoes and two hungry people at the table. John’s carried wood all day, and you’ve walked the forest. Will you split supper equally?”' },
      choices: [
        {
          cs: 'Ano. Stejná porce znamená, že má každý stejné právo na večeři.',
          en: 'Yes. An equal share means we’ve each got the same claim to supper.',
          reply: { cs: '„Pěkně rovné misky. A když jeden odejde hladový a druhý nechá polovinu? Brambory se o tvém pravidle nedozvědí.“', en: '“Fine, even bowls. What if one of you leaves hungry and the other leaves half a portion? The potatoes won’t admire your rule.”' },
          reflection: { cs: 'Začnu stejnými porcemi, ale zeptám se, kdo chce přidat. Stejné právo nemusí znamenat stejný počet soust.', en: 'I’ll start with equal portions, then ask who wants more. An equal claim doesn’t have to mean the same number of bites.' },
        },
        {
          cs: 'Dám víc tomu, kdo má větší hlad. Večeře má lidi nasytit.',
          en: 'I’ll give more to whoever’s hungrier. Supper ought to feed people.',
          reply: { cs: '„To se mi líbí. Já mám obrovský hlad, kdykoli vidím cizí misku. Kdo rozhodne, čí hlad je větší?“', en: '“I like the sound of it. I’m terribly hungry whenever I see someone else’s bowl. Who gets to judge whose hunger is greater?”' },
          reflection: { cs: 'Nemusím Johnův hlad odhadovat za něj. Můžeme si říct, kolik chceme, a část nechat na přidání.', en: 'I don’t have to guess John’s hunger for him. We can say how much we want and keep some in the pot.' },
        },
      ],
    },
    {
      theme: { cs: 'Co dluží nálezce?', en: 'What does a finder owe?' },
      opening: { cs: '„U rozcestí leží košík hub. Nikdo nikde, na uchu jen vybledlá stužka. Necháš ho tam, nebo ho odneseš do bezpečí?“', en: '“There’s a basket of mushrooms at the fork. Nobody about, only a faded ribbon on the handle. Will you leave it there or carry it somewhere safe?”' },
      choices: [
        {
          cs: 'Nechám ho na místě. Majitel se nejspíš vrátí stejnou cestou.',
          en: 'I’ll leave it where it is. Its owner will probably come back along the same path.',
          reply: { cs: '„A já půjdu kolem taky. Ponechat košík tam, kde ho někdo najde, není totéž jako nechat ho v bezpečí.“', en: '“And I’ll pass along the path, too. Leaving a basket where someone can find it isn’t the same as keeping it safe.”' },
          reflection: { cs: 'Můžu chvíli počkat a košík nechat dobře viditelný. Když musím odejít, nemám právo tvářit se, že jsem ho uhlídala.', en: 'I can wait a little and keep the basket in view. If I have to leave, I can’t pretend I’ve kept it safe.' },
        },
        {
          cs: 'Vezmu ho k chaloupce a u rozcestí nechám zprávu.',
          en: 'I’ll take it to the cottage and leave a note at the fork.',
          reply: { cs: '„A když majitel neumí číst? Zachránila jsi houby, ale možná jsi mu přidala cestu až k tvé večeři.“', en: '“What if its owner can’t read? You’ve rescued the mushrooms, but perhaps you’ve made them walk all the way to your supper.”' },
          reflection: { cs: 'Zpráva sama nestačí pro každého. Než košík odnesu, zkusím někoho oslovit a zjistit, komu patří.', en: 'A note won’t work for everyone. Before I move the basket, I’ll ask around and try to find out whose it is.' },
        },
      ],
    },
    {
      theme: { cs: 'Kdy laskavost vytváří dluh?', en: 'When does a favor become a debt?' },
      opening: { cs: '„Zajíc mi ukázal zkratku. Teď chce, abych mu každý večer hlídala zahradu. Pomoc jsem přijala, ale o hlídání nebyla řeč. Dlužím mu to?“', en: '“Hare showed me a shortcut. Now he wants me to guard his garden every evening. I took the help, but nobody mentioned guarding. Do I owe him?”' },
      choices: [
        {
          cs: 'Něco mu dlužíš. Jinak bude pomoc vždycky práce jen pro jednoho.',
          en: 'You owe him something. Otherwise, helping will always be one person’s work.',
          reply: { cs: '„Něco. Ale kolik večerů stojí jedna zkratka? Když cenu určí až potom, měla jsem vůbec možnost odmítnout?“', en: '“Something. But how many evenings does a shortcut cost? If he sets the price afterward, did I ever have a chance to refuse?”' },
          reflection: { cs: 'Vděčnost není souhlas s každou cenou. Můžeš nabídnout jednu službu a nechat zajíce rozhodnout, jestli ji přijme.', en: 'Gratitude isn’t agreement to any price. You can offer one favor and let Hare decide whether to accept it.' },
        },
        {
          cs: 'Nedlužíš mu hlídání. Dar nemůže dodatečně změnit na obchod.',
          en: 'You don’t owe him guarding. He can’t turn a gift into a bargain afterward.',
          reply: { cs: '„Tak si nechám zkratku a on nedostane nic? Výborná dohoda pro lišku. Méně výborná pro dalšího, kdo bude potřebovat pomoc.“', en: '“So I keep the shortcut and he gets nothing? A fine arrangement for a fox. Less fine for the next traveler who needs help.”' },
          reflection: { cs: 'Můžeš odmítnout hlídání a přesto mu pomoct jinak. Ale raději mu to řekni, než začne s tvými večery počítat.', en: 'You can refuse the guarding and still help another way. Tell him before he starts counting on your evenings.' },
        },
      ],
    },
  ],
  owl: [
    {
      theme: { cs: 'Kdy přestat věřit mapě?', en: 'When should you question a map?' },
      opening: { cs: '„Mapa vede přes březový háj. Čerstvé stopy však míří jinam. Možná tam spadl strom, možná někdo hledal houby. Čemu dáš přednost?“', en: '“The map leads through the birch grove, but fresh tracks go another way. Perhaps a tree fell, or perhaps someone wanted mushrooms. Which will you follow?”' },
      choices: [
        {
          cs: 'Mapě. Zachycuje celou cestu, stopy jen něčí odbočku.',
          en: 'The map. It shows the whole route. The tracks only show someone’s detour.',
          reply: { cs: '„Mapa ví víc o cestě, ale stopy víc o dnešku. Kolik nových stop bys potřebovala, než se půjdeš podívat?“', en: '“The map knows more about the route, but the tracks know more about today. How many fresh tracks would make you look?”' },
          reflection: { cs: 'Půjdu po mapě k prvnímu místu, odkud uvidím dál. Když bude cesta zavřená, otočím se dřív, než se protlačím mezi větvemi.', en: 'I’ll use the map as far as the next clear view. If the path’s blocked, I’ll turn back before squeezing through branches.' },
        },
        {
          cs: 'Stopám. Někdo tudy prošel nedávno a viděl, co mapa nevidí.',
          en: 'The tracks. Someone passed recently and saw what the map can’t see.',
          reply: { cs: '„Viděl. Ale nevíš, kam chtěl dojít. Čerstvá zkušenost může být přesná a přesto tě vést jinam.“', en: '“They saw it. But you don’t know where they wanted to go. Recent experience can be accurate and still lead you somewhere else.”' },
          reflection: { cs: 'Než odbočím, zkusím poznat směr stop a porovnat ho s mapou. Novější zpráva ještě nemusí odpovídat na mou otázku.', en: 'Before turning, I’ll check where the tracks lead against the map. A newer clue may answer a different question from mine.' },
        },
      ],
    },
    {
      theme: { cs: 'Co dělat s neshodou?', en: 'What should you do with disagreement?' },
      opening: { cs: '„Zajíc tvrdí, že potok stoupl. Veverka říká, že ho přešla suchou nohou. Oba znáš a oba mluví vážně. Je jeden z nich špatný svědek?“', en: '“Hare says the brook has risen. Squirrel says she crossed with dry feet. You know them both, and both sound certain. Is one a poor witness?”' },
      choices: [
        {
          cs: 'Spíš věřím zajícovi. Nízká voda by mu nevyděsila takový výraz.',
          en: 'I’d trust Hare more. Low water wouldn’t have frightened him so much.',
          reply: { cs: '„Strach ti říká, jak mu bylo. Říká ti také, u kterého břehu stál a kdy tam byl?“', en: '“His fear tells you how he felt. Does it also tell you which bank he stood on or when he was there?”' },
          reflection: { cs: 'Nejdřív se zeptám na místo a čas. Zajíc mohl stát jinde než veverka, nebo přišel po dešti.', en: 'I’ll ask where and when first. Hare may have stood somewhere else or arrived after the rain.' },
        },
        {
          cs: 'Spíš věřím veverce. Sama přešla, takže cestu opravdu zkusila.',
          en: 'I’d trust Squirrel more. She crossed herself, so she actually tried the route.',
          reply: { cs: '„Výborný pokus pro veverku. Víš, jestli skákala po větvích, nebo šla tam, kde půjdeš ty?“', en: '“An excellent test for a squirrel. Do you know whether she used the branches or walked where you’ll walk?”' },
          reflection: { cs: 'Zeptám se, kudy přesně přešla. Její úspěch mi pomůže, až budu vědět, jestli máme stejné možnosti.', en: 'I’ll ask exactly how she crossed. Her success will help once I know whether we can take the same route.' },
        },
      ],
    },
    {
      theme: { cs: 'Jak říct, že nevíš?', en: 'How should you say you don’t know?' },
      opening: { cs: '„John se zeptá, jestli bude zítra pršet. Nad hřebenem vidíš tmavé mraky, ale vítr se mění. Potřebuje rozhodnout, zda nechat dřevo venku. Co mu řekneš?“', en: '“John asks whether it’ll rain tomorrow. You see dark clouds over the ridge, but the wind’s changing. He needs to decide whether to leave the wood outside. What will you say?”' },
      choices: [
        {
          cs: 'Řeknu, že nejspíš zaprší. Bez nějakého odhadu se nerozhodne.',
          en: 'I’ll say it’ll probably rain. He needs an estimate to make a decision.',
          reply: { cs: '„Užitečné. Ale uslyší John tvé ‚nejspíš‘, nebo jen déšť? Co když kvůli tvému odhadu přenese celou hromadu?“', en: '“Useful. But will John hear your ‘probably’ or only the rain? What if your guess makes him carry the whole pile?”' },
          reflection: { cs: 'Řeknu, co jsem viděla a co se změnilo. Pak mu navrhnu přikrýt dřevo, místo abych odhad vydávala za jistotu.', en: 'I’ll say what I saw and what changed. Then I’ll suggest covering the wood instead of making my guess sound certain.' },
        },
        {
          cs: 'Řeknu, že nevím. Nechci ho poslat do práce kvůli domněnce.',
          en: 'I’ll say I don’t know. I don’t want a guess to send him into extra work.',
          reply: { cs: '„Poctivé. Jenže mraky jsi viděla. Když mu zamlčíš i je, bude se rozhodovat s méně zprávami než ty.“', en: '“Honest. Yet you did see the clouds. If you leave them out, he’ll have less to go on than you do.”' },
          reflection: { cs: 'Můžu nevědět a přesto podat zprávu. Popíšu mraky i vítr a nechám Johnovi prostor, aby rozhodl sám.', en: 'I can be unsure and still report what I saw. I’ll describe the clouds and wind, then leave room for John to decide.' },
        },
      ],
    },
  ],
  deer: [
    {
      theme: { cs: 'Utěšit, nebo naslouchat?', en: 'Offer comfort, or listen?' },
      opening: { cs: '„Představ si vílu, která dnes nechce zpívat. Její přítelkyně odešla za hřeben a háj jí připadá prázdný. Zkusíš jí připomenout něco krásného, nebo s ní chvíli pobudeš ve smutku?“', en: '“Suppose a fairy doesn’t feel like singing. Her friend has gone beyond the ridge, and the grove feels empty. Will you remind her of something lovely or sit with her sadness?”' },
      choices: [
        {
          cs: 'Připomenu jí, že se zase uvidí. Naděje by jí mohla ulevit.',
          en: 'I’ll remind her they’ll meet again. Some hope could help her feel better.',
          reply: { cs: '„Možná. Ale víš, kdy se přítelkyně vrátí? Útěcha, kterou nemůžeš slíbit, se může zítra proměnit v další zklamání.“', en: '“Perhaps. But do you know when her friend will return? Comfort you can’t promise may become another disappointment tomorrow.”' },
          reflection: { cs: 'Nebudu jí slibovat návrat. Můžu se zeptat na přítelkyni a připomenout skutečnou společnou vzpomínku.', en: 'I won’t promise a return. I can ask about her friend and help her remember something they really shared.' },
        },
        {
          cs: 'Posadím se vedle ní. Nemusí se hned cítit lépe, abych mohla zůstat.',
          en: 'I’ll sit beside her. She doesn’t have to feel better right away for me to stay.',
          reply: { cs: '„To může pomoct. Jen se jí zeptej, jestli společnost chce. Někdo si přeje posluchače, jiný chce chvíli plakat sám.“', en: '“It can help. Ask whether she wants company, though. Some people want a listener, and others want a little time to cry alone.”' },
          reflection: { cs: 'Nabídnu jí společnost i prostor. Nemusím poznat správnou útěchu z jejího výrazu, když se můžu zeptat.', en: 'I’ll offer company and room to be alone. I don’t have to guess the right comfort from her face when I can ask.' },
        },
      ],
    },
    {
      theme: { cs: 'Kdo rozhodne o pomoci?', en: 'Who decides what help looks like?' },
      opening: { cs: '„Starý ježek nese jablka pomalu. Nabídla jsem mu pomoc, ale odmítl ji. Když půjde sám, dorazí až za tmy. Mám jeho košík přesto vzít?“', en: '“An old hedgehog’s carrying apples slowly. I offered help, and he refused. If he walks alone, he’ll arrive after dark. Should I take his basket anyway?”' },
      choices: [
        {
          cs: 'Respektuj jeho odpověď. O jeho košíku nemá rozhodovat někdo jiný.',
          en: 'Respect his answer. Carrying a basket doesn’t give someone else the right to decide for him.',
          reply: { cs: '„Souhlasím, že je jeho. Ale možná odmítl proto, že nechtěl zdržovat mě. Je jedno odmítnutí opravdu celá odpověď?“', en: '“I agree it’s his. But perhaps he refused because he didn’t want to delay me. Is one refusal the whole answer?”' },
          reflection: { cs: 'Můžeš říct, že máš čas, a nabídnout společnou cestu. Pak mu nech možnost odmítnout, aniž by ti musel vysvětlovat proč.', en: 'You can say you’ve got time and offer to walk together. Then let him refuse without having to explain why.' },
        },
        {
          cs: 'Zkus mu ukázat, kolik zbývá cesty. Možná si pomoc rozmyslí.',
          en: 'Show him how much farther he’s got to go. He may reconsider the help.',
          reply: { cs: '„A pokud cestu zná lépe než já? Když mu budu pořád dokazovat, že pomoc potřebuje, může přijmout jen proto, abych přestala.“', en: '“What if he knows the route better than I do? If I keep proving he needs help, he may accept only to make me stop.”' },
          reflection: { cs: 'Stačí jedna konkrétní nabídka. Můžeš mu vzít pár jablek nebo půjčit světlo, ale jeho souhlas nemáš získávat únavou.', en: 'One clear offer is enough. You can carry a few apples or lend a light, but you shouldn’t wear him down into agreeing.' },
        },
      ],
    },
    {
      theme: { cs: 'Pro koho ustoupit z cesty?', en: 'Who should make room on the path?' },
      opening: { cs: '„Na úzké cestě stojí srnče, které se bojí kolemjdoucích. Když všichni obejdou louku, pošlapou květy. Když půjdou dál, srnče uteče. Co bys navrhla?“', en: '“A fawn’s afraid of walkers on the narrow path. If everyone goes around the meadow, they’ll trample flowers. If they keep walking, the fawn will flee. What would you suggest?”' },
      choices: [
        {
          cs: 'Ať udělají okliku. Živému zvířeti bych dala přednost před květy.',
          en: 'Ask them to go around. I’d put a frightened animal ahead of the flowers.',
          reply: { cs: '„Květům se uhýbá hůř než srnčeti. Žijí tam i brouci. Kolik dalších obyvatel louky zaplatí za jeho klid?“', en: '“Flowers can’t move aside as easily as a fawn. Beetles live there, too. How many meadow residents will pay for its peace?”' },
          reflection: { cs: 'Nejdřív bych lidi požádala, aby počkali. Oklika pro jednoho není stejná jako oklika pro celý den plný chodců.', en: 'I’d first ask the walkers to wait. A detour for one person isn’t the same as a whole day of feet across the meadow.' },
        },
        {
          cs: 'Ať zůstanou na cestě a projdou tiše. Srnče se může schovat mezi stromy.',
          en: 'Ask them to stay on the path and pass quietly. The fawn can shelter among the trees.',
          reply: { cs: '„Může, pokud zná bezpečný úkryt. Z tvého místa vypadá ústup snadněji než z jeho. Co potřebuje, aby se mohlo pohnout?“', en: '“It can, if it knows a safe place. Retreat looks easier from where you stand than from where it stands. What does it need before it can move?”' },
          reflection: { cs: 'Nechala bych mu volnou cestu k lesu a chvíli času. Tišší kroky pomohou, ale ne když ho lidé obklopí.', en: 'I’d leave a clear route to the woods and give it time. Quieter footsteps can help, but they won’t help if people surround it.' },
        },
      ],
    },
  ],
  badger: [
    {
      theme: { cs: 'Opravit domov, nebo odejít?', en: 'Repair a home, or leave it?' },
      opening: { cs: '„Ve staré noře prosakuje voda. Znám každý kořen, ale na svahu je sušší místo. Mám opravit střechu, nebo začít kopat nový domov?“', en: '“Water’s seeping into my old burrow. I know every root, but there’s a drier spot uphill. Should I repair the roof or start digging a new home?”' },
      choices: [
        {
          cs: 'Oprav noru. Známé místo už má hodnotu, kterou nová díra nemá.',
          en: 'Repair it. A familiar place already has a value a new hole doesn’t have.',
          reply: { cs: '„Má. Jenže vlhká podestýlka mě budí každou noc. Kolik oprav ještě zaplatím za to, že nechci ztratit známé kořeny?“', en: '“It does. But damp bedding wakes me every night. How many repairs will I pay for because I don’t want to lose familiar roots?”' },
          reflection: { cs: 'Nejdřív zjisti, odkud voda přitéká. Jedna netěsnost se dá opravit, ale celý mokrý svah není špatná střecha.', en: 'Find out where the water’s coming from first. One leak can be repaired, but a wet hillside isn’t a faulty roof.' },
        },
        {
          cs: 'Vykopej novou. Domov má být místo, kde se vyspíš v suchu.',
          en: 'Dig a new one. A home ought to be a place where you can sleep dry.',
          reply: { cs: '„To bych rád. Jenže novou noru nevyhrabu za večer. Kde budu spát a co budu jíst, než bude hotová?“', en: '“I’d like that. But I won’t dig a new burrow in an evening. Where will I sleep, and what will I eat until it’s ready?”' },
          reflection: { cs: 'Můžeš zatím opravit místo na spaní a novou noru kopat postupně. Rozhodnutí odejít ještě nemusí znamenat odejít dnes.', en: 'You could patch the sleeping room while digging the new burrow a little at a time. Deciding to leave doesn’t have to mean leaving today.' },
        },
      ],
    },
    {
      theme: { cs: 'Sníst poslední bramboru, nebo ji zasadit?', en: 'Eat the last potato, or plant it?' },
      opening: { cs: '„Ve spíži mi zbývá poslední brambora. Když ji zasadím, snad jich na podzim sklidím víc. Když ji sním, nebudu dnes hladový. Kam patří?“', en: '“There’s one potato left in my pantry. If I plant it, perhaps I’ll harvest more in autumn. If I eat it, I won’t be hungry today. Where does it belong?”' },
      choices: [
        {
          cs: 'Do země. Další úroda potřebuje začátek, i když něco stojí.',
          en: 'In the ground. Another harvest needs a beginning, even when it costs something.',
          reply: { cs: '„Jistě. Ale hladový jezevec špatně ryje a ještě hůř čeká na podzim. Z čeho mám žít, zatímco bude brambora růst?“', en: '“Certainly. But a hungry badger digs poorly and waits for autumn even worse. What am I to live on while the potato grows?”' },
          reflection: { cs: 'Nejdřív potřebuješ jídlo na mezidobí. Můžeme se poptat po sadbě, ale nemůžu ti slíbit úrodu místo dnešní večeře.', en: 'You’ll need food for the weeks between. We can ask around for seed potatoes, but I can’t offer a future harvest in place of supper.' },
        },
        {
          cs: 'Na talíř. Dnešní hlad je jistý, podzimní úroda není.',
          en: 'On the plate. Today’s hunger is certain, and an autumn harvest isn’t.',
          reply: { cs: '„Tak se najím. Zítra však zůstane spíž prázdná. Když pokaždé sním sadbu, jak se něco změní?“', en: '“Then I’ll eat. Tomorrow the pantry will still be empty. If I keep eating the seed potatoes, how will anything change?”' },
          reflection: { cs: 'Dnešní večeře řeší dnešek. Potom potřebuješ plán na další jídlo i sadbu, aby se stejná volba nevracela každý večer.', en: 'Tonight’s supper handles tonight. Then you’ll need a plan for food and seed, so the same choice doesn’t return every evening.' },
        },
      ],
    },
    {
      theme: { cs: 'Kdy je práce hotová?', en: 'When is the work finished?' },
      opening: { cs: '„Polička v noře se trochu naklání. Misky drží, ale vidím každou křivou hranu. Venku už čekají přátelé. Mám ji před návštěvou předělat?“', en: '“The shelf in my burrow leans a little. It holds the bowls, but I see every crooked edge. My friends are waiting outside. Should I rebuild it before they visit?”' },
      choices: [
        {
          cs: 'Předělej ji. Budeš mít klid, když uděláš práci pořádně.',
          en: 'Rebuild it. You’ll feel at ease once you’ve done the work properly.',
          reply: { cs: '„Možná. Minule jsem pak uviděl křivou židli. A předtím hrbol u dveří. Budou přátelé čekat, až v lese najdu poslední rovnou větev?“', en: '“Perhaps. Last time, I noticed a crooked chair next. Before that, a bump by the door. Must my friends wait until I find the forest’s last straight branch?”' },
          reflection: { cs: 'Zkontroluj, jestli polička pevně drží. Jestli ano, nech rovné hrany na zítřek a pusť přátele dovnitř.', en: 'Check whether the shelf is secure. If it is, leave the straight edges for tomorrow and let your friends in.' },
        },
        {
          cs: 'Nech ji být a pozvi je dál. Přišli za tebou, ne za poličkou.',
          en: 'Leave it and invite them in. They’ve come to see you, not your shelf.',
          reply: { cs: '„To říkají. Ale kdyby na ně spadly misky, asi by si všimli i poličky. Kde končí malá vada a začíná zanedbaná práce?“', en: '“So they say. But if the bowls fell on them, they’d probably notice the shelf, too. Where does a small flaw become neglected work?”' },
          reflection: { cs: 'Přátelé mohou chvíli počkat, když je něco nebezpečné. Potřebuješ zkoušku, jestli polička unese misky, ne jestli se ti líbí každý roh.', en: 'Friends can wait a little if something’s unsafe. You need to check whether the shelf holds the bowls, not whether you like every corner.' },
        },
      ],
    },
  ],
};
