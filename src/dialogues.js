export const HOUSE_ACTIVITIES = [
  { id: 'john', name: 'John', theme: 'Hana’s husband', label: 'Say hello to John', action: 'Say hello', message: 'John gets the bowls. Hana goes to spend a moment with Aldo.' },
  { id: 'aldo', name: 'Aldo', theme: 'Hana and John’s infant son', label: 'Spend a moment with Aldo', action: 'Spend a moment', message: 'Aldo settles into his cot. It’s time to prepare the potatoes.' },
  { id: 'prepare', name: 'Kitchen counter', label: 'Prepare the potatoes', action: 'Prepare', message: 'Hana washes and chops the potatoes. The pot is waiting on the stove.' },
  { id: 'cook', name: 'Stove', label: 'Cook dinner', action: 'Cook', message: 'The potatoes simmer into soup. Dinner’s ready to bring to the table.' },
  { id: 'serve', name: 'Dinner table', label: 'Serve dinner at the table', action: 'Serve dinner', message: 'Hana brings supper to John while Aldo rests nearby.' },
];

// Original fictional family conversations. Animal quizzes live in quizzes.js.
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
};
