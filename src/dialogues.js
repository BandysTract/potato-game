// Original fictional conversations, not quotations from Czech folklore.
export const DIALOGUES = {
  fox: {
    opening: { cs: 'Když najdeš bramboru, patří tobě, nebo zemi, která ji živila?', en: 'When you find a potato, does it belong to you, or to the earth that fed it?' },
    choices: [
      {
        cs: 'Tomu, kdo ji vypěstoval. Bez práce by nebyla úroda.',
        en: 'To whoever grew it. Without work, there would be no harvest.',
        reply: { cs: 'A déšť si za svou práci nic nezaslouží? Ani žížala?', en: 'And does the rain deserve nothing for its work? Nor the earthworm?' },
        reflection: { cs: 'Pak vlastnit neznamená být jediným dárcem. Možná mám i povinnost něco vrátit.', en: 'Then owning something doesn’t mean I’m its only maker. Perhaps I also have a duty to give something back.' },
      },
      {
        cs: 'Zemi. Já si ji jen na chvíli půjčím.',
        en: 'To the earth. I’m only borrowing it for a while.',
        reply: { cs: 'Půjčenou bramboru ale sníš. Jak ji vrátíš?', en: 'But you’ll eat the borrowed potato. How will you return it?' },
        reflection: { cs: 'Stejnou nevrátím. Můžu zasadit další a rozdělit se o večeři.', en: 'I can’t return the same one. I can plant another and share my supper.' },
      },
    ],
  },
  owl: {
    opening: { cs: 'Znáš cestu, protože máš mapu, nebo protože ses už někdy ztratila?', en: 'Do you know the way because you have a map, or because you’ve been lost before?' },
    choices: [
      {
        cs: 'Mapa uchovává zkušenost těch, kdo šli přede mnou.',
        en: 'A map keeps the experience of those who walked before me.',
        reply: { cs: 'To ano. Ale když přes noc spadne strom, mapa o něm ještě neví.', en: 'True. But if a tree falls overnight, the map doesn’t know it yet.' },
        reflection: { cs: 'Budu věřit mapě a dívat se kolem sebe. Důvěra nemusí znamenat zavřené oči.', en: 'I’ll trust the map and look around me. Trust needn’t mean closed eyes.' },
      },
      {
        cs: 'Bloudění mě naučilo všímat si lesa.',
        en: 'Getting lost taught me to notice the forest.',
        reply: { cs: 'A přesto můžeš stejnou chybu udělat znovu. Je každá zkušenost také poučením?', en: 'And yet you can make the same mistake again. Is every experience also a lesson?' },
        reflection: { cs: 'Není. Poučením se stane, až se zeptám, proč jsem zabloudila.', en: 'No. It becomes a lesson when I ask why I got lost.' },
      },
    ],
  },
  deer: {
    opening: { cs: 'Sbíráš slzy radosti. Byly by slzy smutku méně cenné?', en: 'You gather tears of joy. Would tears of sorrow be worth less?' },
    choices: [
      {
        cs: 'Radost bych přála každému. Smutek bych nejraději odstranila.',
        en: 'I’d wish joy for everyone. I’d rather take sorrow away.',
        reply: { cs: 'A když někdo pláče po příteli, chtěla bys odstranit i lásku, ze které smutek vyrostl?', en: 'And when someone weeps for a friend, would you also remove the love from which the sorrow grew?' },
        reflection: { cs: 'Ne. Nemusím každý smutek napravit. Někdy stačí zůstat nablízku.', en: 'No. I don’t have to mend every sorrow. Sometimes it’s enough to stay nearby.' },
      },
      {
        cs: 'Ne. Obojí ukazuje, že nám na něčem záleží.',
        en: 'No. Both show that something matters to us.',
        reply: { cs: 'Tak proč jedny sbíráš a druhým se lidé vyhýbají?', en: 'Then why gather one kind while people turn away from the other?' },
        reflection: { cs: 'Radost se sdílí snadněji. Ale i smutek potřebuje někoho, kdo ho unese s námi.', en: 'Joy is easier to share. But sorrow also needs someone willing to carry it with us.' },
      },
    ],
  },
};
