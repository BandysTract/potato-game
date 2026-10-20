export const HOUSE_ACTIVITIES = [
  { id: 'john', name: 'John', theme: 'Hana’s husband', label: 'Say hello to John', action: 'Say hello', message: 'John gets the bowls. Hana goes to spend a moment with Aldo.' },
  { id: 'aldo', name: 'Aldo', theme: 'Hana and John’s infant son', label: 'Spend a moment with Aldo', action: 'Spend a moment', message: 'Aldo settles into his cot. It’s time to prepare the potatoes.' },
  { id: 'prepare', name: 'Kitchen counter', label: 'Prepare the potatoes', action: 'Prepare', message: 'Hana washes and chops the potatoes. The pot is waiting on the stove.' },
  { id: 'cook', name: 'Stove', label: 'Cook dinner', action: 'Cook', message: 'The potatoes simmer into soup. Dinner’s ready to bring to the table.' },
  { id: 'serve', name: 'Dinner table', label: 'Serve dinner at the table', action: 'Serve dinner', message: 'Hana brings supper to John while Aldo rests nearby.' },
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
        reply: { cs: 'Aldo natáhne ručičku k Haně.', en: 'Aldo reaches his little hand toward Hana.' },
        reflection: { cs: 'Ahoj, maličký. Už jsem u tebe.', en: 'Hello, little one. I’m here.' },
      },
      {
        cs: 'Potichu mu zabroukám písničku z lesa.',
        en: 'Hum him the tune from the woods.',
        reply: { cs: 'Aldo ztichne a pozoruje Hanu.', en: 'Aldo goes quiet and watches Hana.' },
        reflection: { cs: 'Poslouchej, maličký. Běla mě naučila písničku.', en: 'Listen, little one. Běla taught me a song.' },
      },
    ],
  },
  fox: [
    {
      theme: { cs: 'Stejné porce, nebo různý hlad?', en: 'Equal shares, or different appetites?' },
      opening: { cs: '„Šest brambor, dva hladoví lidé. Stejné porce, nebo víc pro hladovějšího?“', en: '“Six potatoes, two hungry people. Equal bowls, or more for the hungrier one?”' },
      choices: [
        {
          cs: 'Začnu stejnými porcemi.',
          en: 'Start with equal bowls.',
          reply: { cs: '„To je spravedlivé. A kam si má dát misku hladová liška?“', en: '“Very fair. Where does a hungry fox put her bowl?”' },
          reflection: { cs: 'Vedle nás, když pomůžeš loupat.', en: 'Beside ours, if you help peel.' },
        },
        {
          cs: 'Zeptám se, kdo chce víc.',
          en: 'Ask who needs more.',
          reply: { cs: '„Já. Ještě jsem brambory ani neviděla, ale mám jasno.“', en: '“Me. I haven’t even seen the potatoes, and I’m certain.”' },
          reflection: { cs: 'Nejdřív se zeptám Johna, než odpovíš i za něj.', en: 'I’ll ask John before you answer for him.' },
        },
      ],
    },
    {
      theme: { cs: 'Co dluží nálezce?', en: 'What does a finder owe?' },
      opening: { cs: '„Někdo nechal na rozcestí houby. Necháš košík tam, nebo ho odneseš do bezpečí?“', en: '“Someone left mushrooms at the fork. Leave the basket, or take it somewhere safe?”' },
      choices: [
        {
          cs: 'Nechám ho tam, kde ho majitel najde.',
          en: 'Leave it where its owner can find it.',
          reply: { cs: '„Tak ho pohlídám. Několik nebezpečných hub poznám podle chuti.“', en: '“Then I’ll keep watch. I know several unsafe mushrooms by taste.”' },
          reflection: { cs: 'Hlídej prosím se zavřenou pusou.', en: 'Keep watch with your mouth shut, please.' },
        },
        {
          cs: 'Odnesu ho domů a nechám tam vzkaz.',
          en: 'Take it home and leave a note.',
          reply: { cs: '„Napiš tam i čas večeře. Kvůli majiteli, samozřejmě.“', en: '“Put your supper time on the note. For the owner, of course.”' },
          reflection: { cs: 'Pro toho, kdo neumí číst, nakreslím chaloupku.', en: 'I’ll draw the cottage for anyone who can’t read.' },
        },
      ],
    },
    {
      theme: { cs: 'Kdy laskavost vytváří dluh?', en: 'When does a favor become a debt?' },
      opening: { cs: '„Zajíc mi ukázal zkratku. Teď chce týden hlídání zahrady. Dlužím mu to?“', en: '“Hare showed me a shortcut. Now he wants a week of garden duty. Do I owe him?”' },
      choices: [
        {
          cs: 'Nabídni mu menší laskavost.',
          en: 'Offer him a smaller favor.',
          reply: { cs: '„Jeden večer? Mrkev bych hlídala opravdu zblízka.“', en: '“One evening? I could watch the carrots very closely.”' },
          reflection: { cs: 'Raději nabídni něco bez mrkve.', en: 'Perhaps offer something without carrots.' },
        },
        {
          cs: 'K daru se účet neposílá dodatečně.',
          en: 'A gift doesn’t come with a bill afterward.',
          reply: { cs: '„Přesně. Ale další zkratku bych od něj chtěla taky.“', en: '“Exactly. Though I’d like him to show me the next shortcut, too.”' },
          reflection: { cs: 'Tak mu poděkuj, než budeš chtít další.', en: 'Then thank him before asking for another.' },
        },
      ],
    },
  ],
  owl: [
    {
      theme: { cs: 'Kdy přestat věřit mapě?', en: 'When should you question a map?' },
      opening: { cs: '„Mapa ukazuje doleva. Čerstvé stopy vedou doprava. Čemu věříš?“', en: '“The map says left. Fresh tracks go right. Which do you trust?”' },
      choices: [
        {
          cs: 'Mapa zná celou cestu.',
          en: 'The map knows the whole route.',
          reply: { cs: '„Cestu ano. Padlé stromy ale opravy neposílají.“', en: '“The route, yes. Fallen trees don’t always send corrections.”' },
          reflection: { cs: 'Půjdu podle ní tam, odkud uvidím dál.', en: 'I’ll follow it as far as the next clear view.' },
        },
        {
          cs: 'Stopy mi říkají, že tu nedávno někdo prošel.',
          en: 'The tracks tell me someone passed recently.',
          reply: { cs: '„Nedávno a užitečně není totéž. To je pěkné rozlišení, že?“', en: '“Recently and usefully are different things. A fine distinction, if I do say so myself.”' },
          reflection: { cs: 'Možná hledali houby.', en: 'Perhaps they were looking for mushrooms.' },
        },
      ],
    },
    {
      theme: { cs: 'Co dělat s neshodou?', en: 'What should you do with disagreement?' },
      opening: { cs: '„Zajíc říká, že je potok rozvodněný. Veverka přešla suchou nohou. Komu věříš?“', en: '“Hare says the brook is high. Squirrel crossed dry. Whom would you believe?”' },
      choices: [
        {
          cs: 'Zajíc zněl vyděšeně.',
          en: 'Hare sounded frightened.',
          reply: { cs: '„To ano. Zapomněla jsem se zeptat, kudy přecházel.“', en: '“He did. I forgot to ask where he crossed.”' },
          reflection: { cs: 'Zeptáme se, než si namočíme nohy.', en: 'Let’s ask before getting our feet wet.' },
        },
        {
          cs: 'Veverka přechod sama vyzkoušela.',
          en: 'Squirrel tried the crossing herself.',
          reply: { cs: '„Po zemi, nebo po větvích? Pořád zapomínám, že ne každý potřebuje most.“', en: '“With feet or branches? I keep forgetting not everyone needs a bridge.”' },
          reflection: { cs: 'Já budu potřebovat cestu bez větví.', en: 'I’ll need the version without branches.' },
        },
      ],
    },
    {
      theme: { cs: 'Jak říct, že nevíš?', en: 'How should you say you don’t know?' },
      opening: { cs: '„Tmavé mraky, proměnlivý vítr a Johnovo dřevo venku. Předpovíš déšť?“', en: '“Dark clouds, a changing wind, and John’s wood outside. Will you predict rain?”' },
      choices: [
        {
          cs: 'Řeknu mu, že to vypadá na déšť.',
          en: 'I’ll tell him rain looks likely.',
          reply: { cs: '„Vypadá. Užitečné slovo, pokud ho uslyší.“', en: '“Likely. A useful word, provided he hears it.”' },
          reflection: { cs: 'Při povídání přinesu plachtu.', en: 'I’ll bring the cover while we talk.' },
        },
        {
          cs: 'Řeknu, že zatím nevím.',
          en: 'I’ll say I don’t know yet.',
          reply: { cs: '„Já taky ne. Místo mraků jsem pozorovala tebe.“', en: '“Nor do I. I’ve been watching you instead of the clouds.”' },
          reflection: { cs: 'Můžeme se podívat znovu obě.', en: 'We can both look again.' },
        },
      ],
    },
  ],
  deer: [
    {
      theme: { cs: 'Utěšit, nebo naslouchat?', en: 'Offer comfort, or listen?' },
      opening: { cs: '„Víle chybí kamarádka a nechce zpívat. Nabídneš jí naději, nebo si k ní sedneš?“', en: '“A fairy misses her friend and won’t sing. Would you offer hope or sit beside her?”' },
      choices: [
        {
          cs: 'Připomenu jí jejich hezký společný den.',
          en: 'I’d remind her of a happy day together.',
          reply: { cs: '„Taky bych si o něm ráda poslechla.“ Srna skloní hlavu.', en: '“I’d like to hear about it, too.” The deer lowers her head.' },
          reflection: { cs: 'Může nám o něm povědět, až bude chtít.', en: 'She can tell us when she’s ready.' },
        },
        {
          cs: 'Zeptám se, jestli chce společnost.',
          en: 'I’d ask whether she wants company.',
          reply: { cs: '„A když řekne ne?“ Srna nechá vedle sebe trochu místa.', en: '“And if she says no?” The deer leaves a little space beside her.' },
          reflection: { cs: 'Můžu zůstat poblíž, aniž bych jí seděla přede dveřmi.', en: 'I can stay nearby without sitting on her doorstep.' },
        },
      ],
    },
    {
      theme: { cs: 'Kdo rozhodne o pomoci?', en: 'Who decides what help looks like?' },
      opening: { cs: '„Ježek odmítl pomoc s jablky. Brzy bude tma. Mám se zeptat znovu?“', en: '“Hedgehog refused help with his apples. It’s nearly dark. Should I ask again?”' },
      choices: [
        {
          cs: 'Nech ho rozhodnout.',
          en: 'Let him keep his answer.',
          reply: { cs: '„Nechám. Taky na mě čeká moje srnče.“', en: '“I will. My own fawn is waiting for me, too.”' },
          reflection: { cs: 'Můžeš mu popřát šťastnou cestu.', en: 'You can wish him a safe walk.' },
        },
        {
          cs: 'Nabídni mu světlo na zbytek cesty.',
          en: 'Offer a light for the last stretch.',
          reply: { cs: '„Světlo, aniž bych mu brala košík. Jednou se zeptat můžu.“', en: '“A light, without taking his basket. I could ask once.”' },
          reflection: { cs: 'A nech ho odmítnout i světlo.', en: 'And let him say no to the light, too.' },
        },
      ],
    },
    {
      theme: { cs: 'Pro koho ustoupit z cesty?', en: 'Who should make room on the path?' },
      opening: { cs: '„Moje srnče se bojí pohnout z cesty. Mají lidé obejít květiny, nebo tiše projít?“', en: '“My fawn’s frozen on the path. Should walkers cross the flowers or pass him quietly?”' },
      choices: [
        {
          cs: 'Ať mu nechají prostor.',
          en: 'Make room around him.',
          reply: { cs: '„Děkuju. V květinách ale bydlí brouci.“', en: '“Thank you. But the beetles live in the flowers.”' },
          reflection: { cs: 'Snad můžou všichni chvíli počkat.', en: 'Perhaps everyone can wait a moment.' },
        },
        {
          cs: 'Ať zůstanou na cestě a jdou pomalu.',
          en: 'Stay on the path and pass slowly.',
          reply: { cs: '„Nechte mu cestu ke stromům. Postavím se tak, aby mě viděl.“', en: '“Leave him a way into the trees. I’ll stand where he can see me.”' },
          reflection: { cs: 'Počkám tady, než k tobě dojde.', en: 'I’ll wait here until he reaches you.' },
        },
      ],
    },
  ],
  badger: [
    {
      theme: { cs: 'Opravit domov, nebo odejít?', en: 'Repair a home, or leave it?' },
      opening: { cs: '„Zase mi teče do střechy. Opravit starou noru, nebo kopat výš?“', en: '“My roof leaks again. Patch the old burrow, or dig uphill?”' },
      choices: [
        {
          cs: 'Zkus jednu pořádnou opravu.',
          en: 'Try one careful repair.',
          reply: { cs: '„Znám tam každý kořen. Déšť bohužel taky.“', en: '“I know every root in there. Unfortunately, so does the rain.”' },
          reflection: { cs: 'Podíváme se, kudy zatéká.', en: 'Let’s find where it gets in.' },
        },
        {
          cs: 'Najdi si suché místo na spaní.',
          en: 'Find somewhere dry to sleep.',
          reply: { cs: '„Nejdřív přestěhuju podestýlku. Polička se tu může mračit do zítřka.“', en: '“I’ll move the bedding first. The shelf can sulk here until tomorrow.”' },
          reflection: { cs: 'Můžu vzít deku.', en: 'I can carry a blanket.' },
        },
      ],
    },
    {
      theme: { cs: 'Sníst poslední bramboru, nebo ji zasadit?', en: 'Eat the last potato, or plant it?' },
      opening: { cs: '„Zbývá poslední brambora. Dnešní večeře, nebo podzimní sadba?“', en: '“One potato left. Supper tonight, or seed for autumn?”' },
      choices: [
        {
          cs: 'Zasaď ji pro další úrodu.',
          en: 'Plant it for another harvest.',
          reply: { cs: '„Můj žaludek vznesl námitku. Dost hlasitou.“', en: '“My stomach has raised an objection. Quite loudly.”' },
          reflection: { cs: 'Než vyroste, budeme potřebovat něco k jídlu.', en: 'We’ll need something to eat while it grows.' },
        },
        {
          cs: 'Dnes se najez a poohlédni se po sadbě.',
          en: 'Eat tonight and look for more seed.',
          reply: { cs: '„Můžu se zeptat souseda. Radši půjčuju rýč, než přiznávám prázdnou spíž.“', en: '“I can ask my neighbor. I’d rather lend a spade than admit an empty pantry.”' },
          reflection: { cs: 'Můžeš ten rýč vzít s sebou.', en: 'You could bring the spade when you ask.' },
        },
      ],
    },
    {
      theme: { cs: 'Kdy je práce hotová?', en: 'When is the work finished?' },
      opening: { cs: '„Polička se naklání a přátelé už čekají u dveří. Opravit ji, nebo je pustit dál?“', en: '“My shelf leans, and my friends are at the door. Fix it or let them in?”' },
      choices: [
        {
          cs: 'Zkontroluj ji, než si pod ni někdo sedne.',
          en: 'Check it before anyone sits below it.',
          reply: { cs: '„Misky unese. Zkoušel jsem to třikrát. Se snídaní čtyřikrát.“', en: '“It holds the bowls. I’ve tested it three times. Four, counting breakfast.”' },
          reflection: { cs: 'Tak se možná věnuj dveřím.', en: 'Then perhaps the door needs your attention.' },
        },
        {
          cs: 'Pusť je dál a křivý okraj nech být.',
          en: 'Let them in and leave the crooked edge.',
          reply: { cs: '„Nejdřív přendám misky. U mě doma nikdo polévku do klína nedostane.“', en: '“I’ll move the bowls first. Nobody’s getting soup in their lap in my house.”' },
          reflection: { cs: 'Podržím dveře, zatímco budeš rovnat misky.', en: 'I’ll hold the door while you fuss.' },
        },
      ],
    },
  ],
};
