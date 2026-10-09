import { BOUNDS, BROOK, HOME, HOUSE_BOUNDS, HOUSE_TARGETS, POTATOES, FAIRIES, CREATURES, LANDMARKS, TRAILS } from './data.js';
import { DIALOGUES, HOUSE_ACTIVITIES } from './dialogues.js';
import { t, placeName } from './i18n.js';

const icons = {
  potato: '<path d="M7 4c3-3 10-2 12 3s-2 12-7 13S2 17 3 12s1-6 4-8Z"/><path d="m8 9 .1.1m7 0 .1.1m-4 6 .1.1"/>',
  tear: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15c0 2 1 3 3 3"/>',
  sound: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-5 4H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 11 9-8 9 8M6 9v12h12V9m-9 12v-7h6v7"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  leaf: '<path d="M20 3C6 2 1 10 5 17s16 3 15-14ZM5 19 16 8m-7 7-1-5m4 2h5"/>',
};
const icon = (name, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${icons[name]}</svg>`;
const sprig = `<svg class="botanical" viewBox="0 0 100 110" fill="none" aria-hidden="true"><path d="M46 104C60 73 38 34 60 6" stroke="currentColor" stroke-width="1.2"/><path d="M50 84C20 83 16 62 20 57c19 1 29 11 30 27Zm0-21c24 0 37-16 34-23-19 0-31 10-34 23Zm-2-18C27 40 25 25 28 20c17 5 22 12 20 25Zm5-16C68 27 77 16 75 9c-12 1-19 8-22 20Z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.1"/><circle cx="59" cy="5" r="3" fill="currentColor"/></svg>`;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function mapMarkup(language) {
  const l = (key, values) => escape(t(language, key, values));
  const trails = TRAILS.map((trail) => `<polyline points="${trail.map(([x, z]) => `${x},${z}`).join(' ')}" class="map-trail"/>`).join('');
  const potatoes = POTATOES.map((item) => `<g data-map-potato="${item.id}" transform="translate(${item.x} ${item.z})"><title>${l('Potato: {place}', { place: placeName(language, item.name) })}</title><circle r="1.25" class="map-potato"/><path d="m-.4-.25.01.01m.7.5.01.01" class="map-potato-eye"/></g>`).join('');
  const fairies = FAIRIES.map((item) => `<g data-map-fairy="${item.id}" transform="translate(${item.x} ${item.z})"><title>${l('{name}: fairy tear of joy', { name: item.name })}</title><path d="M0-1.7.55-.55 1.7 0 .55.55 0 1.7-.55.55-1.7 0-.55-.55Z" class="map-fairy"/></g>`).join('');
  const creatures = CREATURES.map((item) => `<g data-map-creature="${item.id}" transform="translate(${item.x} ${item.z})"><title>${l('{name}: conversation', { name: t(language, item.englishName) })}</title><rect x="-.85" y="-.85" width="1.7" height="1.7" rx=".3" transform="rotate(45)" class="map-creature"/></g>`).join('');
  const labels = LANDMARKS.map((item) => `<text x="${item.x}" y="${item.z + (item.id === 'home' ? 5 : -4)}" class="map-label" text-anchor="middle">${escape(placeName(language, item.name))}</text>`).join('');
  return `<svg class="trail-map" viewBox="${BOUNDS.minX - 4} ${BOUNDS.minZ - 5} ${BOUNDS.maxX - BOUNDS.minX + 8} ${BOUNDS.maxZ - BOUNDS.minZ + 10}" role="img" aria-label="${l('North-up map of the forest. Orange circles mark remaining potatoes, gold stars mark fairies, violet diamonds mark forest creatures, and the green dot marks Hana.')}">
    <defs><pattern id="map-grain" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".07" fill="#a5a182" opacity=".5"/></pattern></defs>
    <rect x="${BOUNDS.minX - 4}" y="${BOUNDS.minZ - 5}" width="${BOUNDS.maxX - BOUNDS.minX + 8}" height="${BOUNDS.maxZ - BOUNDS.minZ + 10}" fill="url(#map-grain)"/>
    <path class="map-contour" d="M-24 13c-5-15-1-31 11-36s24-5 32 4m-43 38c4-8 3-17 8-23s14-11 20-10 11 4 17 3M-22 22c5-4 5-12 12-14s15 3 23 4 9-2 13-6M-23-20c4-5 12-5 17-5m17 3c7 1 12 5 14 11"/>
    <path class="map-woodland" d="M-24-6c0-12 14-15 20-8s-2 12-9 19-14-2-11-11Zm20 8c2-7 9-9 12-4s1 12-5 12S-5 7-4 2Z"/>
    <polyline class="map-water" points="${BROOK.map(([x, z]) => `${x},${z}`).join(' ')}"/>
    ${trails}${labels}${potatoes}${fairies}${creatures}
    <g transform="translate(${HOME.x} ${HOME.z})" class="map-home"><title>${escape(placeName(language, 'Hana’s cottage'))}</title><path d="m-1.5-.2 1.5-1.5L1.5-.2M-1-.7V1H1V-.7"/></g>
    <g data-map-player class="map-player"><title>${l('Hana, your current location')}</title><circle class="map-player-halo" r="2"/><circle class="map-player-dot" r=".8"/></g>
    <g transform="translate(${BOUNDS.minX + 3} ${BOUNDS.minZ + 4})" class="map-north"><text text-anchor="middle" y="-2">${l('N')}</text><path d="m0-1-1 4 1-1 1 1Z"/></g>
  </svg>`;
}

function houseMapMarkup(language) {
  const stops = HOUSE_TARGETS.map((target, index) => `<g data-house-stop="${index}" transform="translate(${target.x} ${target.z})"><title>${escape(t(language, HOUSE_ACTIVITIES[index].label))}</title><circle r=".7"/><text class="house-stop-number" text-anchor="middle" y=".25">${index + 1}</text><text class="house-stop-label" text-anchor="middle" y="1.75">${escape(t(language, HOUSE_ACTIVITIES[index].name))}</text></g>`).join('');
  return `<svg class="trail-map house-map" viewBox="-11 -9 22 18" role="img" aria-label="${escape(t(language, 'Plan of the cottage. Numbered stops mark John, Aldo, the kitchen counter, the stove, and the dinner table. The green dot marks Hana.'))}"><rect class="house-map-room" x="-10" y="-8" width="20" height="16" rx=".5"/><path class="house-map-door" d="M-1 8h2M-1 8V6h2"/>${stops}<g data-house-player class="map-player"><title>${escape(t(language, 'Hana, your current location'))}</title><circle class="map-player-halo" r=".85"/><circle class="map-player-dot" r=".35"/></g></svg>`;
}

function createLocalizedUI(root, onAction, language, heldInputs) {
  const l = (key, values) => escape(t(language, key, values));
  const titleParts = language === 'cs' ? ['Co se', 'v Peci', 'peče?'] : ['What’s', 'cooking', 'in Pec?'];
  const languageButton = `<button class="language-button" data-action="language" type="button" aria-label="${l(language === 'cs' ? 'Switch to English' : 'Switch to Czech')}"><span lang="cs" class="${language === 'cs' ? 'current-language' : ''}">Česky</span> / <span lang="en" class="${language === 'en' ? 'current-language' : ''}">English</span></button>`;
  root.lang = language;
  root.innerHTML = `
    <div class="play-surface" hidden>
      <header class="masthead">
        <div class="wordmark"><span class="wordmark-title">${l('What’s cooking in Pec?')}</span><span class="wordmark-place">Pec pod Sněžkou · Krkonoše</span></div>
        <nav class="game-nav" aria-label="${l('Game controls')}">${languageButton}
          <button class="icon-button sound-button" data-action="sound" type="button" aria-label="${l('Turn sound on')}" aria-pressed="false">${icon('mute')}<span class="nav-label">${l('Sound off')}</span></button>
          <button class="icon-button" data-action="map" type="button" aria-label="${l('Open map, M')}">${icon('map')}<span class="nav-label">${l('Map')}</span></button>
          <button class="icon-button" data-action="pause" type="button" aria-label="${l('Pause, Escape')}">${icon('pause')}<span class="nav-label">${l('Pause')}</span></button>
        </nav>
      </header>
      <aside class="basket-panel" aria-label="${l('Your basket and next destination')}">
        <div class="panel-heading"><span class="eyebrow" data-progress-heading>${l('In your basket')}</span>${icon('leaf')}</div>
        <div class="basket-counts">
          <div class="basket-count potato-count">${icon('potato')}<span><strong data-potato-count>0 <span>/ 6</span></strong><span>${l('Potatoes')}</span></span></div>
          <div class="basket-count tear-count">${icon('tear')}<span><strong data-tear-count>0 <span>/ 3</span></strong><span>${l('Fairy tears')}</span></span></div>
        </div>
        <div class="house-progress" hidden><strong data-house-progress></strong><div class="house-progress-stops" aria-hidden="true">${HOUSE_TARGETS.map((_, index) => `<i data-house-progress-stop="${index}"></i>`).join('')}</div></div>
        <p class="full-objective">${l('Gather 6 potatoes and 3 fairy tears, then come home to make supper.')}</p>
        <div class="destination"><span class="destination-symbol">${icon('map')}</span><div><span class="eyebrow" data-goal-kicker>${l('Up ahead')}</span><strong data-goal-label>${l('Cottage garden')}</strong><span class="goal-distance" data-goal-distance>${l('A short walk away')}</span></div></div>
      </aside>
      <div class="region-label">${icon('leaf')}<span data-region>${l('Cottage garden')}</span></div>
      <div class="interaction-wrap"><div class="interaction" hidden><kbd class="interaction-key">E</kbd><div class="interaction-copy"><strong data-interaction-title></strong><span data-interaction-detail></span><div class="song-track" role="progressbar" aria-label="${l('Song progress')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden><span class="song-fill"></span></div></div><span class="song-note" aria-hidden="true">♪</span></div></div>
      <p class="event-toast" role="status" aria-live="polite" aria-atomic="true" hidden></p>
      <div class="control-legend" aria-label="${l('Keyboard controls')}"><span><kbd>W A S D</kbd> ${l('/ arrows')} <span class="legend-verb">${l('walk')}</span></span><span><kbd>E</kbd> ${l('interact / hold to sing')} </span><button data-action="help" type="button">${l('How to play')} <kbd>H</kbd></button></div>
      <div class="touch-controls" aria-label="${l('Touch controls')}"><div class="dpad" role="group" aria-label="${l('Walk')}"><button class="dpad-n" data-direction="north" type="button" aria-label="${l('Walk up')}">↑</button><button class="dpad-w" data-direction="west" type="button" aria-label="${l('Walk left')}">←</button><span class="dpad-center" aria-hidden="true">✦</span><button class="dpad-e" data-direction="east" type="button" aria-label="${l('Walk right')}">→</button><button class="dpad-s" data-direction="south" type="button" aria-label="${l('Walk down')}">↓</button></div><button class="touch-action" type="button" disabled>${icon('leaf')}<span>${l('Gather')}</span></button></div>
    </div>
    <section class="intro-screen overlay" data-overlay="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title" hidden>
      <div class="intro-panel parchment">
        <div class="intro-topline"><span class="eyebrow">${l('A Krkonoše adventure')}</span>${languageButton}</div>
        <div class="intro-title-wrap">${sprig}<h1 id="intro-title" aria-label="${l('What’s cooking in Pec?')}">${escape(titleParts[0])}<br>${escape(titleParts[1])}<br><span class="quest-word">${escape(titleParts.slice(2).join(' '))}</span></h1></div>
        <p class="intro-story">${l('The mountains have a story for you.')}</p>
        <p class="intro-body">${l('Hana’s heading into the woods above her hometown, Pec pod Sněžkou. There are potatoes to find, fairies to sing with, and forest creatures with big questions.')}</p>
        <div class="intro-mission"><div>${icon('potato')}<span><strong>${l('6 potatoes')}</strong><span>${l('For a warm supper')}</span></span></div><div>${icon('tear')}<span><strong>${l('3 fairy tears of joy')}</strong><span>${l('For the cottage garden')}</span></span></div></div>
        <p class="intro-return">${l('Bring every gift home, then make dinner with Hana’s husband John and spend a moment with their infant son Aldo. Forest conversations are optional.')}</p>
        <button class="button primary begin-button" data-action="start" data-initial-focus type="button">${l('Let’s go')} ${icon('arrow')}</button>
        <div class="intro-links"><button class="text-button" data-action="help" type="button">${l('How to play')}</button><span aria-hidden="true">·</span><button class="text-button" data-action="map" type="button">${l('Look at the map')}</button></div>
        <div class="intro-sound"><button class="icon-button sound-button" data-action="sound" type="button" aria-label="${l('Turn sound on')}" aria-pressed="false">${icon('mute')}<span class="nav-label">${l('Sound off')}</span></button><span>${l('A tune for the mountains')}</span></div>
        <p class="intro-sound-status" role="status" aria-live="polite" aria-atomic="true" hidden></p>
        <div class="intro-controls"><span><kbd>W A S D</kbd> ${l('/ arrows to walk')}</span><span><kbd>E</kbd> ${l('interact / hold to sing')} </span><span><kbd>M</kbd> ${l('map')} <span class="control-dot">·</span> <kbd>Esc</kbd> ${l('pause')}</span></div>
      </div>
      <div class="scene-caption"><span class="caption-rule"></span><span>${l('A quiet corner of the mountains')}</span></div>
    </section>
    <section class="dialog-scrim overlay" data-overlay="pause" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden><div class="dialog parchment pause-dialog"><div class="dialog-language">${languageButton}</div>${sprig}<span class="eyebrow">${l('A moment on the trail')}</span><h2 id="pause-title">${l('Rest a while.')}</h2><p>${l('Hana will be here when you’re ready.')}</p><button class="button primary" data-action="resume" data-initial-focus type="button">${l('Keep walking')} ${icon('arrow')}</button><button class="button secondary" data-action="help" type="button">${l('How to play')}</button></div></section>
    <section class="dialog-scrim overlay" data-overlay="help" role="dialog" aria-modal="true" aria-labelledby="help-title" hidden><div class="dialog parchment help-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="close" data-initial-focus type="button" aria-label="${l('Close help')}">${icon('close')}</button><span class="eyebrow">${l('Find your own pace')}</span><h2 id="help-title">${l('How to play')}</h2><p>${l('Gather 6 potatoes and 3 fairy tears, then return to the cottage. Water the garden, say hello to John and baby Aldo, and make supper. The guide shows your next stop.')}</p><p class="conversation-help">${l('Stop to talk with the fox, owl, deer, and badger. Return for another question after a conversation.')}</p><dl class="help-controls"><div><dt><kbd>W A S D</kbd> ${l('/ arrow keys')} </dt><dd>${l('Walk through the forest and the cottage.')}</dd></div><div><dt><kbd>E</kbd></dt><dd>${l('Gather a potato or enter the cottage. At home, press E near the next person or kitchen stop. Release E between actions. Near a fairy, stand still and hold E until the song is complete.')}</dd></div><div><dt><kbd>M</kbd></dt><dd>${l('Open the forest map or the cottage plan. Walking keys follow the screen.')}</dd></div><div><dt><kbd>Esc</kbd></dt><dd>${l('Pause or close a guide.')}</dd></div></dl><p class="touch-help">${l('On a touch screen, hold a direction to walk. Tap the round action button to gather or interact at home. Release it between actions. To sing, stand still and hold the button.')}</p><p class="small-note">${l('Refreshing the page starts a new walk.')}</p><button class="button secondary" data-action="close" type="button">${l('Back to the walk')}</button></div></section>
    <section class="dialog-scrim overlay" data-overlay="map" role="dialog" aria-modal="true" aria-labelledby="map-title" hidden><div class="dialog parchment map-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="close" data-initial-focus type="button" aria-label="${l('Close map')}">${icon('close')}</button><span class="eyebrow">${l('Find your way')}</span><h2 id="map-title">${l('Hana’s forest map')}</h2><p class="map-description">${l('Follow the blue trail, or find your own way. North is at the top. Walking keys follow the screen.')}</p><div data-map-outdoors>${mapMarkup(language)}</div><div data-map-house hidden>${houseMapMarkup(language)}</div><div class="map-legend" data-outdoor-legend aria-label="${l('Map legend')}"><span><i class="legend-player"></i>${l('Hana')}</span><span><i class="legend-potato"></i>${l('Potato')}</span><span><i class="legend-fairy">✦</i>${l('Fairy')}</span><span>${icon('home')}${l('Cottage')}</span><span><i class="legend-creature"></i>${l('Conversation')}</span></div><p class="map-objective" data-map-objective>${l('Gather 6 potatoes and 3 fairy tears, then return to the cottage.')}</p></div></section>
    <section class="dialog-scrim overlay" data-overlay="dialogue" role="dialog" aria-modal="true" aria-labelledby="dialogue-title" hidden><div class="dialog parchment dialogue-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="dialogueFinish" type="button" aria-label="${l('Leave conversation')}">${icon('close')}</button><span class="eyebrow" data-dialogue-kicker>${l('A voice in the forest')}</span><h2 id="dialogue-title" data-initial-focus tabindex="-1">${l('A forest conversation')}</h2><p class="dialogue-theme" data-dialogue-theme></p><div class="conversation-line opening-line"><span class="speaker" data-dialogue-speaker></span><p data-dialogue-opening></p></div><div class="dialogue-choices"><p class="choice-invitation">${l('Hana replies')}</p><button class="dialogue-choice" data-dialogue-choice="0" type="button"><span data-choice="0"></span>${icon('arrow')}</button><button class="dialogue-choice" data-dialogue-choice="1" type="button"><span data-choice="1"></span>${icon('arrow')}</button></div><div class="dialogue-result" tabindex="-1" hidden><div class="conversation-line hana-line"><span class="speaker">${l('Hana')}</span><p data-selected></p></div><div class="conversation-line"><span class="speaker" data-reply-speaker></span><p data-reply></p></div><div class="conversation-line reflection-line"><span class="speaker">${l('Hana')}</span><p data-reflection></p></div><button class="button primary" data-action="dialogueFinish" type="button"><span data-dialogue-continue>${l('Continue walking')}</span> ${icon('arrow')}</button></div></div></section>
    <section class="ending-screen overlay" data-overlay="win" role="dialog" aria-modal="true" aria-labelledby="win-title" hidden><div class="ending-panel parchment"><div class="dialog-language">${languageButton}</div><div class="ending-emblem" aria-hidden="true">${icon('home')}${sprig}</div><span class="eyebrow">${l('A gift from the mountains')}</span><h2 id="win-title">${l('Supper, then a little wonder.')}</h2><p class="ending-lead">${l('The mountains have one more gift for Hana.')}</p><p>${l('The garden’s watered. Hana and her husband John eat supper as baby Aldo sleeps. Hana glows and rises, a Slavic goddess of home and harvest.')}</p><div class="ending-gifts"><span>${icon('potato')}${l('6 potatoes')}</span><span>${icon('tear')}${l('3 fairy tears')}</span></div><button class="button primary" data-action="restart" data-initial-focus type="button">${l('Walk again')} ${icon('arrow')}</button></div></section>`;

  const find = (selector) => root.querySelector(selector);
  const play = find('.play-surface');
  const dialogs = new Map([...root.querySelectorAll('[data-overlay]')].map((el) => [el.dataset.overlay, el]));
  const textNodes = new Map();
  const setText = (selector, value) => { const node = textNodes.get(selector) || find(selector); textNodes.set(selector, node); if (node.textContent !== value) node.textContent = value; };
  const potatoCount = find('[data-potato-count]');
  const tearCount = find('[data-tear-count]');
  const soundButtons = [...root.querySelectorAll('.sound-button')];
  const soundStatus = find('.intro-sound-status');
  const interaction = find('.interaction');
  const songTrack = find('.song-track');
  const songFill = find('.song-fill');
  const toast = find('.event-toast');
  const touchAction = find('.touch-action');
  const playerMarker = find('[data-map-player]');
  const houseMarker = find('[data-house-player]');
  const houseStops = [...root.querySelectorAll('[data-house-stop]')];
  const houseProgressStops = [...root.querySelectorAll('[data-house-progress-stop]')];
  const mapPotatoes = [...root.querySelectorAll('[data-map-potato]')];
  const mapFairies = [...root.querySelectorAll('[data-map-fairy]')];
  const mapCreatures = [...root.querySelectorAll('[data-map-creature]')];
  const dialogueChoices = find('.dialogue-choices');
  const dialogueResult = find('.dialogue-result');
  let previousDialogue = '';
  let previousCreature = null;
  let previousTalked = '';
  let previousOverlay;
  let previousCounts = '';
  let previousSound;
  let previousMessage = '';
  let currentOverlay = null;
  let playable = false;
  let disposed = false;
  const focusByOverlay = new Map();
  const directionPointers = heldInputs?.directionPointers || new Map();
  const actionPointers = heldInputs?.actionPointers || new Set();
  const vectors = { north: { x: 0, y: -1 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 }, east: { x: 1, y: 0 } };
  const abort = new AbortController();
  const listen = (target, name, handler, options = {}) => target.addEventListener(name, handler, { ...options, signal: abort.signal });
  const visible = (node) => node && !node.closest('[hidden]') && node.getClientRects().length > 0;

  function move() {
    let x = 0; let y = 0;
    for (const direction of directionPointers.values()) { x += vectors[direction].x; y += vectors[direction].y; }
    const length = Math.hypot(x, y);
    onAction('touchMove', length ? { x: x / length, y: y / length } : { x: 0, y: 0 });
  }
  function releaseInputs() {
    if (directionPointers.size) { directionPointers.clear(); move(); }
    if (actionPointers.size) { actionPointers.clear(); onAction('touchInteract', false); }
    for (const button of root.querySelectorAll('.is-held')) button.classList.remove('is-held');
  }
  listen(root, 'click', (event) => {
    const choice = event.target.closest('[data-dialogue-choice]');
    if (choice) { onAction('dialogueChoice', Number(choice.dataset.dialogueChoice)); return; }
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) onAction(button.dataset.action, button.dataset.action === 'language' ? (language === 'cs' ? 'en' : 'cs') : undefined);
  });
  listen(root, 'keydown', (event) => {
    if (event.key !== 'Tab' || !currentOverlay) return;
    const dialog = dialogs.get(currentOverlay);
    if (!dialog) { event.preventDefault(); return; }
    const controls = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter(visible);
    if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
    const first = controls[0]; const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  for (const button of root.querySelectorAll('[data-direction]')) {
    listen(button, 'pointerdown', (event) => {
      if (!playable) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      directionPointers.set(event.pointerId, button.dataset.direction);
      button.classList.add('is-held'); move();
    });
    const release = (event) => { if (!directionPointers.delete(event.pointerId)) return; if (![...directionPointers.values()].includes(button.dataset.direction)) button.classList.remove('is-held'); move(); };
    listen(button, 'pointerup', release); listen(button, 'pointercancel', release); listen(button, 'lostpointercapture', release);
    const keyboardId = `key-${button.dataset.direction}`;
    listen(button, 'keydown', (event) => {
      if (!playable || ![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      directionPointers.set(keyboardId, button.dataset.direction); button.classList.add('is-held'); move();
    });
    const releaseKeyboard = (event) => {
      if (event.type === 'keyup' && ![' ', 'Enter'].includes(event.key)) return;
      if (directionPointers.delete(keyboardId)) { button.classList.remove('is-held'); move(); }
    };
    listen(button, 'keyup', releaseKeyboard); listen(button, 'blur', releaseKeyboard);
  }
  listen(touchAction, 'pointerdown', (event) => {
    if (!playable || touchAction.disabled) return;
    event.preventDefault(); touchAction.setPointerCapture(event.pointerId); actionPointers.add(event.pointerId); touchAction.classList.add('is-held'); onAction('touchInteract', true);
  });
  const releaseAction = (event) => { if (actionPointers.delete(event.pointerId) && !actionPointers.size) { touchAction.classList.remove('is-held'); onAction('touchInteract', false); } };
  listen(touchAction, 'pointerup', releaseAction); listen(touchAction, 'pointercancel', releaseAction); listen(touchAction, 'lostpointercapture', releaseAction);
  const releasePointer = (event) => {
    const direction = directionPointers.get(event.pointerId);
    if (directionPointers.delete(event.pointerId)) {
      if (![...directionPointers.values()].includes(direction)) find(`[data-direction="${direction}"]`).classList.remove('is-held');
      move();
    }
    releaseAction(event);
  };
  listen(window, 'pointerup', releasePointer); listen(window, 'pointercancel', releasePointer);
  listen(touchAction, 'keydown', (event) => {
    if (!playable || touchAction.disabled || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    actionPointers.add('keyboard'); touchAction.classList.add('is-held'); onAction('touchInteract', true);
  });
  const releaseActionKeyboard = (event) => {
    if (event.type === 'keyup' && ![' ', 'Enter'].includes(event.key)) return;
    if (actionPointers.delete('keyboard') && !actionPointers.size) { touchAction.classList.remove('is-held'); onAction('touchInteract', false); }
  };
  listen(touchAction, 'keyup', releaseActionKeyboard); listen(touchAction, 'blur', releaseActionKeyboard);
  listen(window, 'blur', releaseInputs);
  listen(document, 'visibilitychange', () => { if (document.hidden) releaseInputs(); });

  function update(game, view) {
    if (disposed) return;
    const overlay = view.overlay || null;
    const overlayChanged = overlay !== previousOverlay;
    currentOverlay = overlay;
    playable = game.phase === 'playing' && !overlay;
    const showPlay = game.phase === 'playing';
    play.hidden = !showPlay;
    play.inert = Boolean(overlay);
    if (overlayChanged) {
      if (!heldInputs || heldInputs.overlay !== overlay) releaseInputs();
      heldInputs = null;
      if (root.contains(document.activeElement)) focusByOverlay.set(previousOverlay || null, document.activeElement);
      for (const [name, dialog] of dialogs) dialog.hidden = name !== overlay;
      const focusTarget = (overlay === 'dialogue' ? null : focusByOverlay.get(overlay)) || (overlay ? dialogs.get(overlay)?.querySelector('[data-initial-focus]') : null);
      const fallback = !overlay && showPlay ? find('[data-action="map"]') : null;
      const nextFocus = visible(focusTarget) ? focusTarget : overlay ? dialogs.get(overlay)?.querySelector('[data-initial-focus]') : fallback;
      if (nextFocus) nextFocus.focus({ preventScroll: true });
      previousOverlay = overlay;
    }
    root.dataset.phase = game.phase;
    root.dataset.scene = game.scene;
    const indoors = game.scene === 'house';
    find('.basket-counts').hidden = indoors;
    find('.house-progress').hidden = !indoors;
    setText('[data-progress-heading]', t(language, indoors ? 'At home' : 'In your basket'));
    setText('.full-objective', t(language, indoors ? 'Say hello to John and Aldo, then make supper.' : 'Gather 6 potatoes and 3 fairy tears, then come home to make supper.'));
    setText('[data-house-progress]', t(language, 'Step {step} of 5', { step: game.houseStep + 1 }));
    for (const [index, node] of houseProgressStops.entries()) { node.classList.toggle('is-done', index < game.houseStep); node.classList.toggle('is-current', index === game.houseStep); }
    find('[data-map-outdoors]').hidden = indoors;
    find('[data-map-house]').hidden = !indoors;
    find('[data-outdoor-legend]').hidden = indoors;
    setText('#map-title', t(language, indoors ? 'Hana’s cottage plan' : 'Hana’s forest map'));
    setText('.map-description', t(language, indoors ? 'Numbered stops follow the supper guide. Walking keys follow the screen.' : 'Follow the blue trail, or find your own way. North is at the top. Walking keys follow the screen.'));
    const potatoes = game.potatoes.length;
    const tears = game.tears.length;
    const allGifts = potatoes === POTATOES.length && tears === FAIRIES.length;
    const counts = `${potatoes}:${tears}`;
    if (counts !== previousCounts) {
      potatoCount.firstChild.textContent = `${potatoes} `;
      tearCount.firstChild.textContent = `${tears} `;
      potatoCount.closest('.basket-count').setAttribute('aria-label', t(language, '{count} of 6 potatoes', { count: potatoes }));
      tearCount.closest('.basket-count').setAttribute('aria-label', t(language, '{count} of 3 fairy tears', { count: tears }));
      for (const item of mapPotatoes) item.toggleAttribute('hidden', game.potatoes.includes(item.dataset.mapPotato));
      for (const item of mapFairies) item.toggleAttribute('hidden', game.tears.includes(item.dataset.mapFairy));
      previousCounts = counts;
    }
    const talked = (game.talked || []).join(':');
    if (talked !== previousTalked) { for (const item of mapCreatures) item.classList.toggle('is-visited', (game.talked || []).includes(item.dataset.mapCreature)); previousTalked = talked; }
    const dialogueState = view.dialogue;
    if (dialogueState && overlay === 'dialogue') {
      const creature = CREATURES.find((item) => item.id === dialogueState.creatureId) || HOUSE_ACTIVITIES.find((item) => item.id === dialogueState.creatureId);
      const collection = DIALOGUES[dialogueState.creatureId];
      const dialogue = Array.isArray(collection) ? collection[dialogueState.index] : collection;
      const dialogueKey = `${dialogueState.creatureId}:${dialogueState.index}:${dialogueState.choice}`;
      if (creature && dialogue && dialogueKey !== previousDialogue) {
        const selected = Number.isInteger(dialogueState.choice) ? dialogue.choices[dialogueState.choice] : null;
        const name = t(language, creature.englishName || creature.name);
        setText('[data-dialogue-kicker]', t(language, indoors ? 'A moment at home' : 'A voice in the forest'));
        setText('[data-dialogue-continue]', t(language, indoors ? 'Continue at home' : 'Continue walking'));
        setText('#dialogue-title', name);
        setText('[data-dialogue-theme]', dialogue.theme?.[language] || t(language, creature.theme));
        setText('[data-dialogue-speaker]', name);
        setText('[data-reply-speaker]', name);
        setText('[data-dialogue-opening]', dialogue.opening[language]);
        dialogue.choices.forEach((choice, index) => setText(`[data-choice="${index}"]`, choice[language]));
        const wasChoosing = !dialogueChoices.hidden;
        dialogueChoices.hidden = Boolean(selected); dialogueResult.hidden = !selected;
        if (selected) {
          setText('[data-selected]', selected[language]);
          setText('[data-reply]', selected.reply[language]);
          setText('[data-reflection]', selected.reflection[language]);
          if (wasChoosing) dialogueResult.focus({ preventScroll: true });
        } else if (overlayChanged || previousCreature !== creature.id) {
          find('#dialogue-title').focus({ preventScroll: true });
        }
        previousCreature = creature.id;
        previousDialogue = dialogueKey;
      }
    } else previousDialogue = '';
    setText('[data-region]', placeName(language, view.region || 'Cottage garden'));
    setText('[data-goal-kicker]', t(language, indoors ? 'Next at home' : allGifts ? 'Time to head home' : 'Up ahead'));
    setText('[data-goal-label]', placeName(language, view.goal?.label || (allGifts ? 'Hana’s cottage' : t(language, 'Follow the blue trail'))));
    setText('[data-goal-distance]', t(language, view.goal?.distance < 3 ? 'You’re close' : view.goal?.distance < 9 ? 'Nearby' : 'A little farther along'));
    setText('[data-map-objective]', indoors ? t(language, HOUSE_ACTIVITIES[game.houseStep].label) : allGifts ? t(language, 'Your basket is full. Return to Hana’s cottage to make supper.') : t(language, '{potatoes} of 6 potatoes · {tears} of 3 fairy tears. Gather every gift, then return to the cottage.', { potatoes, tears }));
    playerMarker.setAttribute('transform', `translate(${Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, game.player.x))} ${Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, game.player.z))})`);
    houseMarker.setAttribute('transform', `translate(${Math.max(HOUSE_BOUNDS.minX, Math.min(HOUSE_BOUNDS.maxX, game.player.x))} ${Math.max(HOUSE_BOUNDS.minZ, Math.min(HOUSE_BOUNDS.maxZ, game.player.z))})`);
    for (const [index, node] of houseStops.entries()) { node.classList.toggle('is-current', index === game.houseStep); node.classList.toggle('is-done', index < game.houseStep); }
    if (view.sound !== previousSound) {
      for (const button of soundButtons) {
        button.innerHTML = `${icon(view.sound ? 'sound' : 'mute')}<span class="nav-label">${l(view.sound ? 'Sound on' : 'Sound off')}</span>`;
        button.setAttribute('aria-label', t(language, view.sound ? 'Turn sound off' : 'Turn sound on'));
        button.setAttribute('aria-pressed', String(Boolean(view.sound)));
      }
      previousSound = view.sound;
    }
    const soundError = view.soundError || '';
    const soundErrorChanged = soundStatus.textContent !== soundError;
    if (soundErrorChanged) soundStatus.textContent = soundError;
    soundStatus.hidden = !soundError;
    if (soundError && soundErrorChanged && overlay === 'intro') soundStatus.scrollIntoView({ block: 'nearest' });
    let title = ''; let detail = ''; let action = 'Gather'; let canInteract = false; let singing = false;
    const nearby = view.nearby;
    if (nearby?.type === 'potato' && !game.potatoes.includes(nearby.id)) { title = 'A potato for supper'; detail = 'Press E to gather'; canInteract = true; }
    else if (nearby?.type === 'fairy' && !game.tears.includes(nearby.id)) { title = t(language, 'Sing with {name}', { name: nearby.name }); detail = 'Stand still and hold E to sing'; action = 'Hold to sing'; canInteract = true; singing = true; }
    else if (nearby?.type === 'creature') { title = t(language, 'Talk with {name}', { name: t(language, CREATURES.find((item) => item.id === nearby.id)?.englishName || nearby.name) }); detail = 'Press E for a conversation'; action = 'Talk'; canInteract = true; }
    else if (nearby?.type === 'home') { title = allGifts ? 'Welcome home, Hana' : 'The cottage is waiting'; detail = allGifts ? 'Press E to water the garden and go inside' : 'Find every gift, then return here'; action = 'Go home'; canInteract = allGifts; }
    else if (nearby?.type === 'house') {
      const activity = HOUSE_ACTIVITIES.find((item) => item.id === nearby.id);
      title = activity.label;
      detail = nearby.ready ? 'Press E, then release between actions' : nearby.completed ? 'Already done. Follow the house guide.' : 'Follow the house guide first';
      action = activity.action;
      canInteract = nearby.ready;
    }
    interaction.hidden = !title || !playable;
    setText('[data-interaction-title]', t(language, title)); setText('[data-interaction-detail]', t(language, detail));
    songTrack.hidden = !singing; find('.song-note').hidden = !singing;
    const progress = Math.max(0, Math.min(1, game.holdProgress || 0));
    songFill.style.transform = `scaleX(${progress})`; songTrack.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    touchAction.disabled = !canInteract || !playable;
    setText('.touch-action span', t(language, action)); touchAction.setAttribute('aria-label', singing ? t(language, 'Hold to sing with {name}', { name: nearby.name }) : t(language, action));
    if (touchAction.disabled && actionPointers.size) { actionPointers.clear(); touchAction.classList.remove('is-held'); onAction('touchInteract', false); }
    const message = game.messageTime > 0 ? game.message || '' : '';
    if (message !== previousMessage) { toast.textContent = message; toast.hidden = !message; previousMessage = message; }
  }
  for (const direction of directionPointers.values()) find(`[data-direction="${direction}"]`).classList.add('is-held');
  if (actionPointers.size) touchAction.classList.add('is-held');
  for (const [index, node] of [...root.querySelectorAll('button, a[href], [tabindex]')].entries()) node.dataset.focusKey = String(index);
  return { update, dispose({ preserveInputs = false } = {}) {
    disposed = true;
    abort.abort();
    if (preserveInputs) return { overlay: previousOverlay, directionPointers, actionPointers };
    releaseInputs();
    root.replaceChildren();
  } };
}

export function createUI(root, onAction) {
  let current = null;
  let language = null;
  return {
    update(game, view) {
      const nextLanguage = game.language === 'en' ? 'en' : 'cs';
      if (nextLanguage !== language) {
        const focusKey = root.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
        const openPanel = root.querySelector('[data-overlay]:not([hidden]) .parchment');
        const scrollTop = openPanel?.scrollTop || 0;
        language = nextLanguage;
        const heldInputs = current?.dispose({ preserveInputs: true });
        current = createLocalizedUI(root, onAction, language, heldInputs);
        current.update(game, view);
        const nextPanel = root.querySelector('[data-overlay]:not([hidden]) .parchment');
        if (nextPanel) nextPanel.scrollTop = scrollTop;
        const previousControl = focusKey == null ? null : root.querySelector(`[data-focus-key="${focusKey}"]`);
        if (previousControl && !previousControl.disabled && !previousControl.closest('[hidden]')) previousControl.focus({ preventScroll: true });
      } else current.update(game, view);
    },
    dispose() { current?.dispose(); current = null; },
  };
}
