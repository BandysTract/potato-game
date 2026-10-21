import { BOUNDS, BROOK, HOME, HOUSE_BOUNDS, HOUSE_TARGETS, POTATOES, FAIRIES, CREATURES, LANDMARKS, TRAILS, SONGS, SONG_SITES } from './data.js';
import { DIALOGUES, HOUSE_ACTIVITIES } from './dialogues.js';
import { QUIZZES, QUIZ_SOURCES, findQuiz } from './quizzes.js';
import { t, placeName } from './i18n.js';
import { SEQUENCES } from './sequences.js';
import './scene-selector.css';

const icons = {
  potato: '<path d="M7 4c3-3 10-2 12 3s-2 12-7 13S2 17 3 12s1-6 4-8Z"/><path d="m8 9 .1.1m7 0 .1.1m-4 6 .1.1"/>',
  tear: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M8 15c0 2 1 3 3 3"/>',
  jar: '<path d="M8 3h8v4l3 3v9c0 3-14 3-14 0v-9l3-3V3Zm0 2h8M5 14c4 2 10 2 14 0M9 2h6"/><path d="M8 11v7"/>',
  sound: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-5 4H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 11 9-8 9 8M6 9v12h12V9m-9 12v-7h6v7"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  leaf: '<path d="M20 3C6 2 1 10 5 17s16 3 15-14ZM5 19 16 8m-7 7-1-5m4 2h5"/>',
  sprout: '<path d="M12 21V11M12 14C3 14 3 6 3 6s9-1 9 8Zm0-3C12 3 21 3 21 3s1 8-9 8ZM7 21h10"/>',
  rain: '<path d="M6 13a5 5 0 0 1 0-10 6 6 0 0 1 11 2 4 4 0 0 1 1 8H6Zm1 4-1 3m6-3-1 3m6-3-1 3"/>',
};
const songSymbols = { woodland: 'leaf', growth: 'sprout', rain: 'rain' };
const icon = (name, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${icons[name]}</svg>`;
const sprig = `<svg class="botanical" viewBox="0 0 100 110" fill="none" aria-hidden="true"><path d="M46 104C60 73 38 34 60 6" stroke="currentColor" stroke-width="1.2"/><path d="M50 84C20 83 16 62 20 57c19 1 29 11 30 27Zm0-21c24 0 37-16 34-23-19 0-31 10-34 23Zm-2-18C27 40 25 25 28 20c17 5 22 12 20 25Zm5-16C68 27 77 16 75 9c-12 1-19 8-22 20Z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.1"/><circle cx="59" cy="5" r="3" fill="currentColor"/></svg>`;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function mapMarkup(language) {
  const l = (key, values) => escape(t(language, key, values));
  const trails = TRAILS.map((trail) => `<polyline points="${trail.map(([x, z]) => `${x},${z}`).join(' ')}" class="map-trail"/>`).join('');
  const potatoes = POTATOES.map((item) => `<g data-map-potato="${item.id}" transform="translate(${item.x} ${item.z})"><title>${l('Potato: {place}', { place: placeName(language, item.name) })}</title><circle r="1.25" class="map-potato"/><path d="m-.4-.25.01.01m.7.5.01.01" class="map-potato-eye"/></g>`).join('');
  const fairies = FAIRIES.map((item) => `<g data-map-fairy="${item.id}" transform="translate(${item.x} ${item.z})"><title>${l('{name}: fairy tear of joy', { name: item.name })}</title><path d="M0-1.7.55-.55 1.7 0 .55.55 0 1.7-.55.55-1.7 0-.55-.55Z" class="map-fairy"/><path d="m1.2 1.2 .6.6 1.1-1.1" class="map-fairy-learned"/></g>`).join('');
  const creatures = CREATURES.map((item) => `<g data-map-creature="${item.id}" transform="translate(${item.x} ${item.z})"><title>${l('{name}: quiz', { name: t(language, item.englishName) })}</title><rect x="-.85" y="-.85" width="1.7" height="1.7" rx=".3" transform="rotate(45)" class="map-creature"/></g>`).join('');
  const sites = SONG_SITES.map((site) => `<g data-map-site="${site.id}" transform="translate(${site.x} ${site.z})"><title>${l('{place}: needs a song', { place: placeName(language, site.name) })}</title><circle r="2" class="map-site"/><path d="m-1 0 .7.7L1-.7" class="map-site-check"/><text y="3.8" text-anchor="middle" class="map-site-status">${l('Needs a song')}</text></g>`).join('');
  const labels = LANDMARKS.map((item) => `<text x="${item.x}" y="${item.z + (item.id === 'home' ? 5 : -4)}" class="map-label" text-anchor="middle">${escape(placeName(language, item.name))}</text>`).join('');
  return `<svg class="trail-map" viewBox="${BOUNDS.minX - 4} ${BOUNDS.minZ - 5} ${BOUNDS.maxX - BOUNDS.minX + 8} ${BOUNDS.maxZ - BOUNDS.minZ + 10}" role="img" aria-label="${l('North-up map of the forest. Orange circles mark available potatoes, gold stars mark fairies, violet diamonds mark animal quizzes, rings mark song sites, and the green dot marks Hana.')}">
    <defs><pattern id="map-grain" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".07" fill="#a5a182" opacity=".5"/></pattern></defs>
    <rect x="${BOUNDS.minX - 4}" y="${BOUNDS.minZ - 5}" width="${BOUNDS.maxX - BOUNDS.minX + 8}" height="${BOUNDS.maxZ - BOUNDS.minZ + 10}" fill="url(#map-grain)"/>
    <path class="map-contour" d="M-24 13c-5-15-1-31 11-36s24-5 32 4m-43 38c4-8 3-17 8-23s14-11 20-10 11 4 17 3M-22 22c5-4 5-12 12-14s15 3 23 4 9-2 13-6M-23-20c4-5 12-5 17-5m17 3c7 1 12 5 14 11"/>
    <path class="map-woodland" d="M-24-6c0-12 14-15 20-8s-2 12-9 19-14-2-11-11Zm20 8c2-7 9-9 12-4s1 12-5 12S-5 7-4 2Z"/>
    <g class="map-art" aria-hidden="true"><path class="map-ridge" d="M${BOUNDS.minX - 4} ${BOUNDS.minZ - 1}l6-3 4 1.6 5-3.4 4 2.2 3-1.2 6 3 5-2.6 4 1.4 5-3.2 6 3.4 4-1.6 5 2.4 5-2.2 6 3V${BOUNDS.minZ - 5}H${BOUNDS.minX - 4}Z"/>${[[-27, -14], [-25, 4], [-9, 19], [9, 15], [-6, -18], [10, -18], [27, 16], [20, -33]].map(([x, z]) => `<path class="map-tree" transform="translate(${x} ${z})" d="M0-1.6 1 0H.5l.9 1.2H-1.4L-.5 0H-1Z"/>`).join('')}<path class="map-fold" d="M${BOUNDS.minX + (BOUNDS.maxX - BOUNDS.minX) / 3} ${BOUNDS.minZ - 5}V${BOUNDS.maxZ + 5}M${BOUNDS.minX + (BOUNDS.maxX - BOUNDS.minX) * 2 / 3} ${BOUNDS.minZ - 5}V${BOUNDS.maxZ + 5}M${BOUNDS.minX - 4} ${(BOUNDS.minZ + BOUNDS.maxZ) / 2}H${BOUNDS.maxX + 4}"/></g>
    <polyline class="map-water" points="${BROOK.map(([x, z]) => `${x},${z}`).join(' ')}"/>
    ${trails}${labels}${sites}${potatoes}${fairies}${creatures}
    <g transform="translate(${HOME.x} ${HOME.z})" class="map-home"><title>${escape(placeName(language, 'Hana’s cottage'))}</title><path d="m-1.5-.2 1.5-1.5L1.5-.2M-1-.7V1H1V-.7"/></g>
    <g data-map-player class="map-player"><title>${l('Hana, your current location')}</title><circle class="map-player-halo" r="2"/><circle class="map-player-dot" r=".8"/></g>
    <g transform="translate(${BOUNDS.minX + 3} ${BOUNDS.minZ + 4})" class="map-north"><text text-anchor="middle" y="-2">${l('N')}</text><path d="m0-1-1 4 1-1 1 1Z"/></g>
  </svg>`;
}

function houseMapMarkup(language) {
  const stops = HOUSE_TARGETS.map((target, index) => `<g data-house-stop="${index}" transform="translate(${target.x} ${target.z})"><title>${escape(t(language, HOUSE_ACTIVITIES[index].label))}</title><circle r=".7"/><text class="house-stop-number" text-anchor="middle" y=".25">${index + 1}</text><text class="house-stop-label" text-anchor="middle" y="1.75">${escape(t(language, HOUSE_ACTIVITIES[index].name))}</text></g>`).join('');
  return `<svg class="trail-map house-map" viewBox="-11 -9 22 18" role="img" aria-label="${escape(t(language, 'Plan of the cottage. Numbered stops mark John, Aldo, the kitchen counter, the stove, and the dinner table. The green dot marks Hana.'))}"><rect class="house-map-room" x="-10" y="-8" width="20" height="16" rx=".5"/><path class="house-map-door" d="M-1 8h2M-1 8V6h2"/>${stops}<g data-house-player class="map-player"><title>${escape(t(language, 'Hana, your current location'))}</title><circle class="map-player-halo" r=".85"/><circle class="map-player-dot" r=".35"/></g></svg>`;
}

function sceneSelectorMarkup(language) {
  const l = (key, values) => escape(t(language, key, values));
  const groups = [...new Set(SEQUENCES.map((sequence) => sequence.group))];
  return groups.map((group, index) => `<section class="scene-group" aria-labelledby="scene-group-${index}"><h3 id="scene-group-${index}">${l(group)}</h3><div class="scene-options">${SEQUENCES.filter((sequence) => sequence.group === group).map((sequence) => sequence.variants
    ? `<div class="scene-conversation"><label for="scene-${sequence.id}">${l(sequence.label)}</label><select id="scene-${sequence.id}" data-scene-variant="${sequence.id}" aria-label="${l('Choose a question from {name}', { name: t(language, sequence.label) })}">${sequence.variants.map((variant) => `<option value="${variant.id}">${escape(variant.label[language])}</option>`).join('')}</select><button class="scene-choice" data-sequence="${sequence.id}" type="button" aria-label="${l('Start a quiz with {name}', { name: t(language, sequence.label) })}">${l('Start quiz')}${icon('arrow')}</button></div>`
    : `<button class="scene-choice" data-sequence="${sequence.id}"${sequence.id === 'start' ? ' data-own-gesture' : ''} type="button"><span><strong>${l(sequence.label)}</strong>${sequence.detail ? `<span>${l(sequence.detail)}</span>` : ''}</span>${icon('arrow')}</button>`).join('')}</div></section>`).join('');
}

function createLocalizedUI(root, onAction, language, heldInputs, memory) {
  const l = (key, values) => escape(t(language, key, values));
  const titleParts = language === 'cs' ? ['Co se', 'v Peci', 'peče?'] : ['What’s', 'cooking', 'in Pec?'];
  const languageButton = `<button class="language-button" data-action="language" type="button" aria-label="${l(language === 'cs' ? 'Switch to English' : 'Switch to Czech')}"><span lang="cs" class="${language === 'cs' ? 'current-language' : ''}">Česky</span> / <span lang="en" class="${language === 'en' ? 'current-language' : ''}">English</span></button>`;
  root.lang = language;
  root.innerHTML = `
    <button class="finale-scene-select button secondary" data-action="admin" type="button" hidden>${l('Scene select')}</button>
    <div class="play-surface" hidden>
      <header class="masthead">
        <div class="wordmark"><span class="wordmark-title">${l('What’s cooking in Pec?')}</span><span class="wordmark-place">Pec pod Sněžkou · Krkonoše</span></div>
        <nav class="game-nav" aria-label="${l('Game controls')}">${languageButton}
          <span class="sound-control"><button class="icon-button sound-button" data-action="sound" type="button" aria-label="${l('Turn sound on')}" aria-pressed="false">${icon('mute')}<span class="nav-label">${l('Sound off')}</span></button><p id="play-sound-status" class="play-sound-status" role="status" aria-live="polite" aria-atomic="true"></p></span>
          <button class="icon-button" data-action="map" type="button" aria-label="${l('Open map, M')}">${icon('map')}<span class="nav-label">${l('Map')}</span></button>
          <button class="icon-button" data-action="pause" type="button" aria-label="${l('Pause, Escape')}">${icon('pause')}<span class="nav-label">${l('Pause')}</span></button>
        </nav>
      </header>
      <aside class="basket-panel" aria-label="${l('Your supplies and next destination')}">
        <div class="basket-counts">
          <div class="basket-count potato-count">${icon('potato')}<span><strong data-potato-count>0 <span>/ 6</span></strong><span>${l('Potatoes')}</span></span></div>
          <div class="basket-count tear-count">${icon('jar')}<span><strong data-tear-count>0 <span>/ 3</span></strong><span>${l('Fairy tears')}</span></span></div>
        </div>
        <div class="song-inventory" aria-label="${l('Learned songs')}">${SONGS.map((song) => `<span role="img" data-inventory-song="${song.id}" title="${l(song.name)}">${icon(songSymbols[song.id])}<span class="song-inventory-name">${l(song.name)}</span></span>`).join('')}</div><div class="house-progress" hidden><strong data-house-progress></strong></div>
        <div class="destination"><span class="destination-symbol">${icon('map')}</span><div><span class="eyebrow" data-goal-kicker>${l('Up ahead')}</span><strong data-goal-label>${l('Cottage garden')}</strong><span class="goal-distance" data-goal-distance>${l('A short walk away')}</span></div></div>
      </aside>
      <div class="region-label">${icon('leaf')}<span data-region>${l('Cottage garden')}</span></div>
      <div class="interaction-wrap"><div class="interaction" hidden><kbd class="interaction-key">E</kbd><div class="interaction-copy"><strong data-interaction-title></strong><span data-interaction-detail></span><div class="song-track" role="progressbar" aria-label="${l('Song progress')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden><span class="song-fill"></span></div></div><span class="song-note" aria-hidden="true">♪</span></div><p class="save-banner" data-save-banner role="status" aria-live="polite" aria-atomic="true"></p></div>
      <p class="event-toast" role="status" aria-live="polite" aria-atomic="true" hidden></p>
      <div class="control-legend" aria-label="${l('Keyboard controls')}"><span><kbd>W A S D</kbd> ${l('/ arrows')} <span class="legend-verb">${l('walk')}</span></span><span><kbd>E</kbd> ${l('interact / sing')} </span><button data-action="help" type="button">${l('How to play')} <kbd>H</kbd></button></div>
      <div class="touch-controls" aria-label="${l('Touch controls')}"><div class="dpad" role="group" aria-label="${l('Walk')}"><button class="dpad-n" data-direction="north" type="button" aria-label="${l('Walk up')}">↑</button><button class="dpad-w" data-direction="west" type="button" aria-label="${l('Walk left')}">←</button><span class="dpad-center" aria-hidden="true">✦</span><button class="dpad-e" data-direction="east" type="button" aria-label="${l('Walk right')}">→</button><button class="dpad-s" data-direction="south" type="button" aria-label="${l('Walk down')}">↓</button></div><button class="touch-action" type="button" disabled>${icon('leaf')}<span>${l('Gather')}</span></button></div>
    </div>
    <section class="intro-screen overlay" data-overlay="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title" hidden>
      <div class="intro-panel parchment">
        <div class="intro-topline"><span class="eyebrow">${l('A Krkonoše adventure')}</span>${languageButton}</div>
        <div class="intro-title-wrap"><div class="character-portrait intro-portrait" data-character="hana" aria-hidden="true"></div><h1 id="intro-title" aria-label="${l('What’s cooking in Pec?')}">${escape(titleParts[0])}<br>${escape(titleParts[1])}<br><span class="quest-word">${escape(titleParts.slice(2).join(' '))}</span></h1></div>
        <p class="intro-story">${l('The mountains have a story for you.')}</p>
        <p class="intro-body">${l('Hana’s heading into the woods above her hometown, Pec pod Sněžkou. There are potatoes to find, fairies to sing with, and forest creatures with big questions.')}</p>
        <div class="intro-mission"><div>${icon('potato')}<span><strong>${l('6 potatoes')}</strong><span>${l('For a warm supper')}</span></span></div><div>${icon('tear')}<span><strong>${l('3 fairy tears of joy')}</strong><span>${l('For the cottage garden')}</span></span></div></div>
        <p class="intro-return">${l('Bring every gift home, then make dinner with Hana’s husband John and spend a moment with their infant son Aldo. The animals’ quizzes are optional.')}</p>
        <div class="intro-actions"><button class="button primary begin-button" data-action="continue" data-own-gesture type="button" hidden>${l('Continue')} ${icon('arrow')}</button><button class="button primary begin-button" data-action="newWalk" data-own-gesture data-initial-focus type="button">${l('New walk')} ${icon('arrow')}</button><button class="button secondary" data-action="playUnsaved" data-own-gesture type="button" hidden>${l('Play without saving')}</button><button class="button secondary" data-action="reload" data-own-gesture type="button" hidden>${l('Reload')}</button></div>
        <p class="save-status intro-save-status" data-title-save-status role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="intro-links"><button class="text-button" data-action="help" type="button">${l('How to play')}</button><span aria-hidden="true">·</span><button class="text-button" data-action="map" type="button">${l('Look at the map')}</button><span aria-hidden="true">·</span><button class="text-button" data-action="admin" type="button">${l('Scene select')}</button></div>
        <div class="intro-sound"><button class="icon-button sound-button" data-action="sound" type="button" aria-label="${l('Turn sound on')}" aria-pressed="false">${icon('mute')}<span class="nav-label">${l('Sound off')}</span></button><span>${l('A tune for the mountains')}</span></div>
        <p class="intro-sound-status" role="status" aria-live="polite" aria-atomic="true" hidden></p>
        <div class="intro-controls"><span><kbd>W A S D</kbd> ${l('/ arrows to walk')}</span><span><kbd>E</kbd> ${l('interact / sing')} </span><span><kbd>M</kbd> ${l('map')} <span class="control-dot">·</span> <kbd>Esc</kbd> ${l('pause')}</span></div>
      </div>
      <div class="scene-caption"><span class="caption-rule"></span><span>${l('A quiet corner of the mountains')}</span></div>
    </section>
    <section class="dialog-scrim overlay" data-overlay="pause" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden><div class="dialog parchment pause-dialog"><div class="dialog-language">${languageButton}</div>${sprig}<span class="eyebrow">${l('A moment on the trail')}</span><h2 id="pause-title">${l('Rest a while.')}</h2><p>${l('Hana will be here when you’re ready.')}</p><button class="button primary" data-action="resume" data-initial-focus type="button">${l('Keep walking')} ${icon('arrow')}</button><button class="button secondary" data-action="returnSaved" data-own-gesture type="button" hidden>${l('Return to saved walk')}</button><button class="button secondary" data-action="help" type="button">${l('How to play')}</button><button class="button secondary guidance-toggle" data-action="guidance" type="button" aria-pressed="true">${l('Guidance')}<span data-guidance-state aria-hidden="true"></span></button><button class="button secondary" data-action="admin" type="button">${l('Scene select')}</button><button class="button secondary" data-action="newWalk" data-own-gesture type="button">${l('New walk')}</button><p class="save-status" data-pause-save-status></p></div></section>
    <section class="dialog-scrim overlay" data-overlay="help" role="dialog" aria-modal="true" aria-labelledby="help-title" hidden><div class="dialog parchment help-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="close" data-initial-focus type="button" aria-label="${l('Close help')}">${icon('close')}</button><span class="eyebrow">${l('Find your own pace')}</span><h2 id="help-title">${l('How to play')}</h2><p>${l('Learn songs from Běla, Jitřenka, and Rusalka. Use the songs to restore the woodland garden, upper meadow, and cottage garden. Gather 6 potatoes and 3 fairy tears, then come home. Say hello to John and baby Aldo, and make supper. The guide shows your next stop.')}</p><p class="conversation-help">${l('The fox, owl, deer, and badger each have three quiz questions. A wrong answer costs nothing and comes with an explanation. Visit the animal again for its next question.')}</p><dl class="help-controls"><div><dt><kbd>W A S D</kbd> ${l('/ arrow keys')} </dt><dd>${l('Walk through the forest and the cottage.')}</dd></div><div><dt><kbd>E</kbd></dt><dd>${l('Press E to gather, talk, take a quiz, or enter the cottage. Press E near a fairy to learn her song. At a garden or meadow, press E to choose a song. At a singing spot, press E to sing a song you’ve learned. Move or press Esc to stop singing. At home, release E between actions.')}</dd></div><div><dt><kbd>M</kbd></dt><dd>${l('Open the forest map or the cottage plan. Walking keys follow the screen.')}</dd></div><div><dt><kbd>Esc</kbd></dt><dd>${l('Pause or close a guide.')}</dd></div></dl><p class="touch-help">${l('On a touch screen, hold a direction to walk. Tap the round action button to gather, talk, take a quiz, learn a song, sing at a singing spot, or choose a song at a garden or meadow. Tap a learned song to sing it. Move to stop singing.')}</p><p class="small-note" data-help-save-status></p><button class="button secondary" data-action="close" type="button">${l('Back to the walk')}</button></div></section>
    <section class="dialog-scrim overlay" data-overlay="map" role="dialog" aria-modal="true" aria-labelledby="map-title" hidden><div class="dialog parchment map-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="close" data-initial-focus type="button" aria-label="${l('Close map')}">${icon('close')}</button><span class="eyebrow">${l('Find your way')}</span><h2 id="map-title">${l('Hana’s forest map')}</h2><p class="map-description">${l('Follow the blue trail, or find your own way. North is at the top. Walking keys follow the screen.')}</p><div data-map-outdoors>${mapMarkup(language)}</div><div data-map-house hidden>${houseMapMarkup(language)}</div><div class="map-legend" data-outdoor-legend aria-label="${l('Map legend')}"><span><i class="legend-player"></i>${l('Hana')}</span><span><i class="legend-potato"></i>${l('Potato')}</span><span><i class="legend-fairy">✦</i>${l('Fairy')}</span><span>${icon('home')}${l('Cottage')}</span><span><i class="legend-creature"></i>${l('Quiz')}</span><span><i class="legend-site"></i>${l('Needs a song')}</span><span><i class="legend-site restored"></i>${l('Restored')}</span></div><p class="map-objective" data-map-objective>${l('Gather 6 potatoes and 3 fairy tears, then return to the cottage.')}</p></div></section>
    <section class="dialog-scrim overlay" data-overlay="songs" role="dialog" aria-modal="true" aria-labelledby="songs-title" hidden><div class="dialog parchment songs-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="close" type="button" aria-label="${l('Close songs')}">${icon('close')}</button><span class="eyebrow">${l('Learned songs')}</span><h2 id="songs-title" data-initial-focus tabindex="-1">${l('Choose a song')}</h2><p data-song-site></p><div class="song-choices">${SONGS.map((song) => `<button class="song-choice" data-song-choice="${song.id}" type="button" disabled>${icon(songSymbols[song.id])}<span><strong>${l(song.name)}</strong><span>${l(song.effect)}</span><span class="song-lock-hint" data-song-hint="${song.id}">${l('Learn from {name}', { name: song.teacher })}</span></span>${icon('arrow')}</button>`).join('')}</div><p class="small-note" data-song-stop></p></div></section>
    <section class="dialog-scrim overlay" data-overlay="dialogue" role="dialog" aria-modal="true" aria-labelledby="dialogue-title" hidden><div class="dialog parchment dialogue-dialog"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="dialogueFinish" type="button" aria-label="${l('Leave conversation')}">${icon('close')}</button><span class="eyebrow" data-dialogue-kicker>${l('A voice in the forest')}</span><h2 id="dialogue-title" data-initial-focus tabindex="-1">${l('A forest conversation')}</h2><div class="character-portrait" data-character-portrait hidden aria-hidden="true"></div><p class="dialogue-theme" data-dialogue-theme></p><div class="quiz" data-quiz hidden><p class="quiz-title" data-quiz-title></p><p class="quiz-premise" data-quiz-premise></p><p class="choice-invitation" data-quiz-invitation>${l('Choose an answer')}</p><div class="quiz-options" role="group" aria-label="${l('Answers')}">${[0, 1, 2].map((index) => `<button class="dialogue-choice quiz-option" data-quiz-option="${index}" type="button"><span data-quiz-label></span><span class="quiz-tag" data-quiz-tag></span></button>`).join('')}</div><div class="quiz-result" hidden><h3 class="quiz-verdict" data-quiz-verdict tabindex="-1"></h3><p class="quiz-feedback" data-quiz-feedback></p><p class="quiz-explanation" data-quiz-explanation></p><details class="quiz-about" data-quiz-about><summary>${l('About the question')}</summary><div data-quiz-sources></div></details><button class="button primary" data-action="dialogueFinish" type="button"><span>${l('Continue walking')}</span> ${icon('arrow')}</button></div></div><div class="family-conversation" data-family><div class="conversation-line opening-line"><span class="speaker" data-dialogue-speaker></span><p data-dialogue-opening></p></div><div class="dialogue-choices"><p class="choice-invitation">${l('Hana replies')}</p><button class="dialogue-choice" data-dialogue-choice="0" type="button"><span data-choice="0"></span>${icon('arrow')}</button><button class="dialogue-choice" data-dialogue-choice="1" type="button"><span data-choice="1"></span>${icon('arrow')}</button></div><div class="dialogue-result" tabindex="-1" hidden><div class="conversation-line hana-line"><span class="speaker">${l('Hana')}</span><p data-selected></p></div><div class="conversation-line"><span class="speaker" data-reply-speaker></span><p data-reply></p></div><div class="conversation-line reflection-line"><span class="speaker">${l('Hana')}</span><p data-reflection></p></div><button class="button primary" data-action="dialogueFinish" type="button"><span data-dialogue-continue>${l('Continue walking')}</span> ${icon('arrow')}</button></div></div></div></section>
    <section class="dialog-scrim overlay" data-overlay="admin" role="dialog" aria-modal="true" aria-labelledby="admin-title" aria-describedby="admin-description" hidden><div class="dialog parchment scene-selector"><div class="dialog-language">${languageButton}</div><button class="dialog-close icon-button" data-action="close" data-initial-focus type="button" aria-label="${l('Close scene select')}">${icon('close')}</button><span class="eyebrow">${l('Study a scene')}</span><h2 id="admin-title">${l('Scene select')}</h2><p id="admin-description">${l('Choose a scene to start with the songs and supplies it needs.')} <span data-selector-note></span> ${l('Close to return without changing anything.')}</p><button class="button secondary selector-return" data-action="returnSaved" data-own-gesture type="button" hidden>${l('Return to saved walk')}</button>${sceneSelectorMarkup(language)}</div></section>
    <section class="dialog-scrim overlay" data-overlay="confirmWalk" role="alertdialog" aria-modal="true" aria-labelledby="confirm-walk-text" aria-describedby="confirm-walk-notice" hidden><div class="dialog parchment confirm-dialog"><p class="save-status" id="confirm-walk-notice" data-confirm-notice></p><h2 id="confirm-walk-text" data-confirm-text></h2><div class="confirm-actions"><button class="button primary" data-action="confirmWalk" data-own-gesture type="button" data-confirm-label></button><button class="button secondary" data-action="cancelConfirm" data-initial-focus type="button">${l('Cancel')}</button></div></div></section>
    <section class="dialog-scrim overlay" data-overlay="saveFailure" role="alertdialog" aria-modal="true" aria-labelledby="save-failure-text" hidden><div class="dialog parchment confirm-dialog"><h2 id="save-failure-text" data-failure-text></h2><div class="confirm-actions"><button class="button primary" data-action="playUnsaved" data-own-gesture type="button" data-failure-primary></button><button class="button secondary" data-action="failureBack" data-initial-focus type="button" data-failure-back></button></div></div></section>
    <section class="dialog-scrim overlay" data-overlay="supper" role="dialog" aria-modal="true" aria-labelledby="supper-title" hidden><div class="dialog parchment supper-choice"><div class="dialog-language">${languageButton}</div><span class="eyebrow">${l('Supper at home')}</span><h2 id="supper-title">${l('Supper’s on the table.')}</h2><p>${l('The forest’s songs came home with Hana.')}</p><button class="button primary" data-action="supperContinue" data-initial-focus type="button">${l('Continue')} ${icon('arrow')}</button><p class="save-status" data-supper-save-status></p></div></section>
    <section class="dialog-scrim overlay" data-overlay="endingChoice" role="dialog" aria-modal="true" aria-labelledby="ending-choice-title" hidden><div class="dialog parchment supper-choice"><div class="dialog-language">${languageButton}</div><span class="eyebrow">${l('After supper')}</span><h2 id="ending-choice-title" data-initial-focus tabindex="-1">${l('How should the evening end?')}</h2><p>${l('John: “Shall I put on a song?”')}</p><p>${l('Hana: “Or shall we see what the forest brought home?”')}</p><div class="song-choices"><button class="song-choice" data-ending="dance" type="button">${icon('home')}<span><strong>${l('Family dance')}</strong><span>${l('John plays Karel Gott, and everyone joins in.')}</span></span>${icon('arrow')}</button><button class="song-choice" data-ending="goddess" type="button">${icon('tear')}<span><strong>${l('Slavic goddess')}</strong><span>${l('Hana rises in a glow of light.')}</span></span>${icon('arrow')}</button></div><button class="button secondary" data-action="admin" type="button">${l('Scene select')}</button><p class="save-status" data-chooser-save-status></p></div></section>
    <section class="ending-screen overlay" data-overlay="win" role="dialog" aria-modal="true" aria-labelledby="win-title" hidden><div class="ending-panel parchment"><div class="dialog-language">${languageButton}</div><div class="ending-emblem" aria-hidden="true">${icon('home')}${sprig}</div><span class="eyebrow">${l('A gift from the mountains')}</span><h2 id="win-title">${l('Supper, then a little wonder.')}</h2><p class="ending-lead">${l('The mountains have one more gift for Hana.')}</p><p>${l('The garden’s watered. Hana and her husband John eat supper as baby Aldo sleeps. Hana glows and rises, a Slavic goddess of home and harvest.')}</p><p class="ending-joke">${l('John: “Will you still pass the salt?”')}</p><div class="ending-gifts"><span>${icon('potato')}${l('6 potatoes')}</span><span>${icon('tear')}${l('3 fairy tears')}</span></div><button class="button primary" data-action="restart" data-own-gesture data-initial-focus type="button">${l('Walk again')} ${icon('arrow')}</button><button class="button secondary" data-action="playUnsaved" data-own-gesture type="button" hidden>${l('Play without saving')}</button><button class="button secondary" data-action="admin" type="button">${l('Scene select')}</button><p class="save-status" data-ending-save-status></p></div></section>`;

  const find = (selector) => root.querySelector(selector);
  const play = find('.play-surface');
  const finaleSceneSelect = find('.finale-scene-select');
  const dialogs = new Map([...root.querySelectorAll('[data-overlay]')].map((el) => [el.dataset.overlay, el]));
  const textNodes = new Map();
  const setText = (selector, value) => { const node = textNodes.get(selector) || find(selector); textNodes.set(selector, node); if (node.textContent !== value) node.textContent = value; };
  const potatoCount = find('[data-potato-count]');
  const tearCount = find('[data-tear-count]');
  const soundButtons = [...root.querySelectorAll('.sound-button')];
  const soundStatus = find('.intro-sound-status');
  const playSoundStatus = find('#play-sound-status');
  const touchLayout = window.matchMedia('(pointer: coarse), (max-width: 700px)');
  const interaction = find('.interaction');
  const songTrack = find('.song-track');
  const songFill = find('.song-fill');
  const toast = find('.event-toast');
  const touchAction = find('.touch-action');
  const playerMarker = find('[data-map-player]');
  const houseMarker = find('[data-house-player]');
  const houseStops = [...root.querySelectorAll('[data-house-stop]')];
  const mapPotatoes = [...root.querySelectorAll('[data-map-potato]')];
  const mapFairies = [...root.querySelectorAll('[data-map-fairy]')];
  const mapCreatures = [...root.querySelectorAll('[data-map-creature]')];
  const mapSites = [...root.querySelectorAll('[data-map-site]')];
  const songChoices = [...root.querySelectorAll('[data-song-choice]')];
  const inventorySongs = [...root.querySelectorAll('[data-inventory-song]')];
  const dialogueChoices = find('.dialogue-choices');
  const dialogueResult = find('.dialogue-result');
  const quizPanel = find('[data-quiz]');
  const familyPanel = find('[data-family]');
  const quizOptions = [...root.querySelectorAll('[data-quiz-option]')];
  const quizResult = find('.quiz-result');
  const quizVerdict = find('[data-quiz-verdict]');
  const quizAbout = find('[data-quiz-about]');
  let previousDialogue = '';
  let previousCreature = null;
  let previousTalked = '';
  let previousOverlay, awaitedFocus = null, awaitedDefault = false;
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
  listen(quizAbout, 'toggle', () => { memory.aboutOpen = quizAbout.open ? quizAbout.dataset.quizId : null; });
  listen(root, 'click', (event) => {
    const quizOption = event.target.closest('[data-quiz-option]');
    if (quizOption) {
      if (!quizOption.disabled && currentOverlay === 'dialogue') onAction('quizAnswer', { quizId: quizOption.dataset.quizId, optionId: quizOption.dataset.optionId });
      return;
    }
    const sequence = event.target.closest('[data-sequence]');
    if (sequence && currentOverlay === 'admin') {
      const variant = find(`[data-scene-variant="${sequence.dataset.sequence}"]`);
      onAction('jump', variant?.value || sequence.dataset.sequence, event);
      return;
    }
    const ending = event.target.closest('[data-ending]');
    if (ending && currentOverlay === 'endingChoice') { onAction('ending', ending.dataset.ending); return; }
    const song = event.target.closest('[data-song-choice]');
    if (song && !song.disabled && currentOverlay === 'songs') { onAction('chooseSong', song.dataset.songChoice); return; }
    const choice = event.target.closest('[data-dialogue-choice]');
    if (choice) { onAction('dialogueChoice', Number(choice.dataset.dialogueChoice)); return; }
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) onAction(button.dataset.action, button.dataset.action === 'language' ? (language === 'cs' ? 'en' : 'cs') : undefined, event);
  });
  listen(root, 'keydown', (event) => {
    if (currentOverlay === 'songs' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const choices = songChoices.filter((button) => !button.disabled);
      if (!choices.length) return;
      const index = choices.indexOf(document.activeElement);
      const direction = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1;
      choices[index < 0 ? (direction < 0 ? choices.length - 1 : 0) : (index + direction + choices.length) % choices.length].focus();
      return;
    }
    if (event.key !== 'Tab' || !currentOverlay) return;
    const dialog = dialogs.get(currentOverlay);
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), select:not([disabled]), a[href], summary, [tabindex="0"]')].filter(visible);
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

  function sourceMarkup(quiz) {
    return quiz.sources.map(({ id, section }) => {
      const source = QUIZ_SOURCES[id];
      const links = source.links.map((link) => `<a href="${escape(link.url)}" target="_blank" rel="noopener noreferrer">${escape(link.label[language])}<span class="visually-hidden"> ${l('(opens in a new tab)')}</span></a>`).join('');
      return `<div class="quiz-source"><strong>${escape(source.name[language])}${section ? ` · ${escape(section[language])}` : ''}</strong><p>${escape(source.summary[language])}</p><p class="quiz-links">${links}</p></div>`;
    }).join('') + `<p class="small-note">${l('The links open the sources online. Nothing loads unless you choose a link.')}</p>`;
  }

  function renderQuiz(state, quiz, overlayChanged) {
    const answerId = state.quiz.answerId;
    const key = `quiz:${quiz.id}:${answerId}`;
    if (key === previousDialogue) return;
    const wasChoosing = previousDialogue === `quiz:${quiz.id}:null`;
    const creature = CREATURES.find((item) => item.id === state.creatureId);
    setText('[data-dialogue-kicker]', t(language, 'A question in the forest'));
    find('.dialogue-dialog .dialog-close').setAttribute('aria-label', t(language, 'Close the question'));
    setText('#dialogue-title', t(language, creature.englishName));
    find('[data-character-portrait]').hidden = true;
    setText('[data-quiz-title]', quiz.title[language]);
    setText('[data-quiz-premise]', quiz.premise[language]);
    quizOptions.forEach((button, index) => {
      const option = quiz.options[index];
      const chosen = option.id === answerId;
      const correct = Boolean(answerId) && option.id === quiz.correctOptionId;
      button.dataset.quizId = quiz.id;
      button.dataset.optionId = option.id;
      button.disabled = Boolean(answerId);
      button.classList.toggle('is-chosen', chosen);
      button.classList.toggle('is-correct', correct);
      button.querySelector('[data-quiz-label]').textContent = option[language];
      button.querySelector('[data-quiz-tag]').textContent = correct ? t(language, chosen ? 'Your answer, correct' : 'Correct answer') : chosen ? t(language, 'Your answer') : '';
    });
    find('[data-quiz-invitation]').hidden = Boolean(answerId);
    quizResult.hidden = !answerId;
    if (answerId) {
      quizVerdict.textContent = t(language, answerId === quiz.correctOptionId ? 'Correct' : 'Not quite');
      setText('[data-quiz-feedback]', quiz.feedback[answerId][language]);
      setText('[data-quiz-explanation]', quiz.explanation[language]);
      find('[data-quiz-sources]').innerHTML = sourceMarkup(quiz);
      quizAbout.dataset.quizId = quiz.id;
      quizAbout.open = memory.aboutOpen === quiz.id;
      // Announce the short verdict once, when the answer is first shown.
      if (wasChoosing) { quizVerdict.focus({ preventScroll: true }); quizVerdict.scrollIntoView?.({ block: 'nearest' }); }
    } else {
      if (memory.aboutOpen && memory.aboutOpen !== quiz.id) memory.aboutOpen = null;
      find('.dialogue-dialog').scrollTop = 0;
      if (overlayChanged || previousCreature !== quiz.id) find('#dialogue-title').focus({ preventScroll: true });
    }
    previousCreature = quiz.id;
    previousDialogue = key;
  }

  function update(game, view) {
    if (disposed) return;
    const overlay = view.overlay || null;
    const overlayChanged = overlay !== previousOverlay;
    currentOverlay = overlay;
    playable = game.phase === 'playing' && !overlay;
    const showPlay = game.phase === 'playing';
    play.hidden = !showPlay;
    play.inert = Boolean(overlay);
    finaleSceneSelect.hidden = game.phase !== 'won' || game.ending !== 'goddess' || dialogs.has(overlay);
    if (overlayChanged) {
      if (!heldInputs || heldInputs.overlay !== overlay) releaseInputs();
      heldInputs = null;
      if (root.contains(document.activeElement)) focusByOverlay.set(previousOverlay || null, document.activeElement);
      for (const [name, dialog] of dialogs) dialog.hidden = name !== overlay;
      const remembered = !overlay || overlay === 'dialogue' && previousOverlay !== 'admin' ? null : focusByOverlay.get(overlay);
      const focusTarget = remembered || (overlay ? dialogs.get(overlay)?.querySelector('[data-initial-focus]') : null);
      const fallback = !finaleSceneSelect.hidden ? finaleSceneSelect : !overlay && showPlay ? document.querySelector('#world') : null;
      const nextFocus = visible(focusTarget) ? focusTarget : dialogs.get(overlay)?.querySelector('[data-initial-focus]') || fallback;
      if (nextFocus) nextFocus.focus({ preventScroll: true });
      awaitedFocus = nextFocus || null;
      // A restored focus target, such as New walk after Cancel, is the player's own choice.
      awaitedDefault = Boolean(nextFocus) && nextFocus !== remembered;
      previousOverlay = overlay;
    }
    root.dataset.phase = game.phase;
    root.dataset.scene = game.scene;
    const indoors = game.scene === 'house';
    const lullaby = view.moment?.kind === 'aldo-lullaby';
    const focusedGift = view.moment?.kind === 'fairy-gift' && !view.moment.focusReleased;
    const quietEncounter = game.activeSong?.kind === 'learn' || focusedGift;
    root.classList.toggle('quiet-encounter', Boolean(quietEncounter));
    root.classList.toggle('has-animal-conversation', overlay === 'dialogue' && !indoors);
    dialogs.get('dialogue').classList.toggle('animal-conversation', !indoors);
    const storage = view.storage || {};
    const showIf = (selector, shown) => { for (const node of root.querySelectorAll(selector)) node.hidden = !shown; };
    showIf('[data-overlay="intro"] [data-action="continue"]', storage.offerContinue);
    showIf('[data-overlay="intro"] [data-action="playUnsaved"], [data-overlay="win"] [data-action="playUnsaved"]', storage.offerUnsaved);
    showIf('[data-overlay="intro"] [data-action="reload"]', storage.offerReload);
    showIf('[data-action="returnSaved"]', storage.offerReturn);
    for (const button of root.querySelectorAll('[data-action="newWalk"], [data-action="continue"], [data-action="returnSaved"], [data-action="restart"], [data-action="confirmWalk"], [data-sequence]')) button.disabled = Boolean(storage.busy || storage.pending);
    // A panel's first control may be disabled while storage settles, and the browser drops focus
    // from it. Once it can be used, hand it the focus, unless the player has moved focus elsewhere.
    // On the title, a returning player's default is Continue once the check offers it.
    const titleContinue = find('[data-overlay="intro"] [data-action="continue"]');
    const titleNewWalk = find('[data-overlay="intro"] [data-action="newWalk"]');
    titleNewWalk.classList.toggle('primary', !storage.offerContinue);
    titleNewWalk.classList.toggle('secondary', Boolean(storage.offerContinue));
    if (awaitedFocus && !awaitedFocus.disabled) {
      const target = awaitedDefault && awaitedFocus === titleNewWalk && storage.offerContinue ? titleContinue : awaitedFocus;
      const unmoved = !document.activeElement || document.activeElement === document.body || document.activeElement === awaitedFocus;
      if (unmoved && visible(target)) target.focus({ preventScroll: true });
      awaitedFocus = null;
    }
    setText('[data-title-save-status]', storage.status || '');
    setText('[data-pause-save-status]', storage.helpStatus || '');
    setText('[data-help-save-status]', storage.helpStatus || '');
    setText('[data-ending-save-status]', storage.status || '');
    setText('[data-save-banner]', game.phase === 'playing' ? storage.status || '' : '');
    setText('[data-selector-note]', storage.selectorNote || '');
    setText('[data-confirm-notice]', storage.confirm?.notice || '');
    setText('[data-confirm-text]', storage.confirm?.text || '');
    setText('[data-confirm-label]', storage.confirm?.label || '');
    setText('[data-failure-text]', storage.failure?.text || '');
    setText('[data-failure-primary]', storage.failure?.primary || '');
    setText('[data-failure-back]', storage.failure?.back || '');
    setText('[data-supper-save-status]', storage.studyStatus || '');
    setText('[data-chooser-save-status]', storage.studyStatus || '');
    const guidance = view.guidance !== false;
    // Indoors the guide names the next required step, which the house prompts point to.
    find('.destination').hidden = Boolean(quietEncounter) || !guidance && !indoors;
    find('.control-legend').hidden = !guidance;
    const guidanceToggle = find('[data-action="guidance"]');
    guidanceToggle.setAttribute('aria-pressed', String(guidance));
    setText('[data-guidance-state]', t(language, guidance ? ': on' : ': off'));
    find('[data-goal-kicker]').hidden = indoors;
    find('.basket-counts').hidden = indoors;
    find('.song-inventory').hidden = indoors;
    find('.house-progress').hidden = !indoors;
    setText('[data-house-progress]', t(language, 'At home'));
    find('[data-map-outdoors]').hidden = indoors;
    find('[data-map-house]').hidden = !indoors;
    find('[data-outdoor-legend]').hidden = indoors;
    setText('#map-title', t(language, indoors ? 'Hana’s cottage plan' : 'Hana’s forest map'));
    setText('.map-description', t(language, indoors ? 'Numbered stops follow the supper guide. Walking keys follow the screen.' : 'Follow the blue trail, or find your own way. North is at the top. Walking keys follow the screen.'));
    const potatoes = game.potatoes.length;
    const tears = game.tears.length;
    const allGifts = potatoes === POTATOES.length && tears === FAIRIES.length && SONG_SITES.every((site) => (game.restoredSites || []).includes(site.id));
    const counts = `${potatoes}:${tears}`;
    if (counts !== previousCounts) {
      potatoCount.firstChild.textContent = `${potatoes} `;
      tearCount.firstChild.textContent = `${tears} `;
      potatoCount.closest('.basket-count').setAttribute('aria-label', t(language, '{count} of 6 potatoes', { count: potatoes }));
      tearCount.closest('.basket-count').setAttribute('aria-label', t(language, '{count} of 3 fairy tears in your jar', { count: tears }));
      previousCounts = counts;
    }
    const learnedSongs = game.learnedSongs || [];
    const restoredSites = game.restoredSites || [];
    for (const item of mapPotatoes) {
      const site = SONG_SITES.find((candidate) => candidate.potatoId === item.dataset.mapPotato);
      item.toggleAttribute('hidden', game.potatoes.includes(item.dataset.mapPotato) || Boolean(site && !restoredSites.includes(site.id)));
    }
    for (const item of mapFairies) {
      const song = SONGS.find((candidate) => candidate.fairyId === item.dataset.mapFairy);
      const learned = Boolean(song && learnedSongs.includes(song.id));
      const fairy = FAIRIES.find((candidate) => candidate.id === item.dataset.mapFairy);
      item.classList.toggle('is-learned', learned);
      item.dataset.learned = String(learned);
      item.querySelector('title').textContent = t(language, learned ? '{name}: song learned' : '{name}: fairy tear of joy', { name: fairy.name });
    }
    for (const item of mapSites) {
      const site = SONG_SITES.find((candidate) => candidate.id === item.dataset.mapSite);
      const restored = restoredSites.includes(site.id);
      item.classList.toggle('is-restored', restored);
      item.dataset.restored = String(restored);
      item.querySelector('title').textContent = t(language, restored ? '{place}: restored' : '{place}: needs a song', { place: placeName(language, site.name) });
      item.querySelector('.map-site-status').textContent = t(language, restored ? 'Restored' : 'Needs a song');
    }
    for (const button of songChoices) {
      const learned = learnedSongs.includes(button.dataset.songChoice);
      button.disabled = !learned;
      button.querySelector('.song-lock-hint').hidden = learned;
    }
    for (const item of inventorySongs) {
      const song = SONGS.find((candidate) => candidate.id === item.dataset.inventorySong);
      const learned = learnedSongs.includes(song.id);
      item.classList.toggle('is-learned', learned);
      const label = t(language, learned ? '{song}: learned' : '{song}: learn from {name}', { song: t(language, song.name), name: song.teacher });
      item.setAttribute('aria-label', label);
      item.title = label;
    }
    if (overlay === 'songs') {
      const site = SONG_SITES.find((candidate) => candidate.id === game.songSite);
      setText('[data-song-site]', site ? placeName(language, site.name) : t(language, 'Choose a song'));
      if (overlayChanged && (!visible(focusByOverlay.get('songs')) || focusByOverlay.get('songs').disabled)) (songChoices.find((button) => !button.disabled) || find('#songs-title')).focus({ preventScroll: true });
    }
    const talked = (game.talked || []).join(':');
    if (talked !== previousTalked) { for (const item of mapCreatures) item.classList.toggle('is-visited', (game.talked || []).includes(item.dataset.mapCreature)); previousTalked = talked; }
    const dialogueState = view.dialogue;
    const activeQuiz = dialogueState && overlay === 'dialogue' && !indoors && dialogueState.quiz ? findQuiz(dialogueState.quiz.quizId) : null;
    quizPanel.hidden = !activeQuiz;
    familyPanel.hidden = Boolean(activeQuiz);
    if (activeQuiz) renderQuiz(dialogueState, activeQuiz, overlayChanged);
    else if (dialogueState && overlay === 'dialogue') {
      const creature = HOUSE_ACTIVITIES.find((item) => item.id === dialogueState.creatureId);
      const dialogue = DIALOGUES[dialogueState.creatureId];
      const dialogueKey = `${dialogueState.creatureId}:${dialogueState.index}:${dialogueState.choice}`;
      if (creature && dialogue && dialogueKey !== previousDialogue) {
        const selected = Number.isInteger(dialogueState.choice) ? dialogue.choices[dialogueState.choice] : null;
        const name = t(language, creature.englishName || creature.name);
        setText('[data-dialogue-kicker]', t(language, indoors ? 'A moment at home' : 'A voice in the forest'));
        find('.dialogue-dialog .dialog-close').setAttribute('aria-label', t(language, 'Leave conversation'));
        setText('[data-dialogue-continue]', t(language, indoors ? 'Continue at home' : 'Continue walking'));
        setText('#dialogue-title', name);
        const portrait = find('[data-character-portrait]');
        portrait.dataset.character = creature.id;
        portrait.hidden = creature.id !== 'john';
        setText('[data-dialogue-theme]', dialogue.theme?.[language] || t(language, creature.theme));
        setText('[data-dialogue-speaker]', name);
        setText('[data-reply-speaker]', name);
        setText('[data-dialogue-opening]', dialogue.opening[language]);
        dialogue.choices.forEach((choice, index) => setText(`[data-choice="${index}"]`, choice[language]));
        const wasChoosing = !dialogueChoices.hidden;
        dialogueChoices.hidden = Boolean(selected); dialogueResult.hidden = !selected;
        find('.opening-line').hidden = Boolean(selected) && !indoors;
        if (!selected || wasChoosing) find('.dialogue-dialog').scrollTop = 0;
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
    setText('[data-goal-label]', lullaby ? t(language, 'Hana hums to Aldo.') : placeName(language, view.goal?.label || (allGifts ? 'Hana’s cottage' : t(language, 'Follow the blue trail'))));
    setText('[data-goal-distance]', t(language, view.goal?.distance < 3 ? 'You’re close' : view.goal?.distance < 9 ? 'Nearby' : 'A little farther along'));
    setText('[data-map-objective]', indoors ? t(language, HOUSE_ACTIVITIES[game.houseStep].label) : allGifts ? t(language, 'Your basket is full. Return to Hana’s cottage to make supper.') : t(language, '{potatoes} of 6 potatoes · {tears} of 3 fairy tears. Gather every gift, then return to the cottage.', { potatoes, tears }));
    playerMarker.setAttribute('transform', `translate(${Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, game.player.x))} ${Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, game.player.z))})`);
    houseMarker.setAttribute('transform', `translate(${Math.max(HOUSE_BOUNDS.minX, Math.min(HOUSE_BOUNDS.maxX, game.player.x))} ${Math.max(HOUSE_BOUNDS.minZ, Math.min(HOUSE_BOUNDS.maxZ, game.player.z))})`);
    for (const [index, node] of houseStops.entries()) { node.classList.toggle('is-current', index === game.houseStep); node.classList.toggle('is-done', index < game.houseStep); }
    // Waiting and running both mean sound is wanted, so the control reads pressed.
    const soundState = view.soundState || (view.sound ? 'running' : 'idle');
    if (soundState !== previousSound) {
      const on = soundState === 'running' || soundState === 'waiting';
      for (const button of soundButtons) {
        button.innerHTML = `${icon(on ? 'sound' : 'mute')}<span class="nav-label">${l(soundState === 'running' ? 'Sound on' : soundState === 'waiting' ? 'Sound waiting' : 'Sound off')}</span>`;
        button.setAttribute('aria-label', t(language, on ? 'Turn sound off' : 'Turn sound on'));
        button.setAttribute('aria-pressed', String(on));
      }
      previousSound = soundState;
    }
    if (playSoundStatus.textContent !== (view.soundError || '')) playSoundStatus.textContent = view.soundError || '';
    const soundError = view.soundError || view.sampleFallback || '';
    const soundErrorChanged = soundStatus.textContent !== soundError;
    if (soundErrorChanged) soundStatus.textContent = soundError;
    soundStatus.hidden = !soundError;
    if (soundError && soundErrorChanged && overlay === 'intro') soundStatus.scrollIntoView({ block: 'nearest' });
    const stopInstruction = t(language, touchLayout.matches ? 'Move to stop singing.' : 'Move or press Esc to stop singing.');
    setText('[data-song-stop]', stopInstruction);
    let title = ''; let detail = ''; let action = 'Gather'; let canInteract = false;
    const singing = Boolean(game.activeSong);
    const nearby = view.nearby;
    if (singing) {
      const song = SONGS.find((song) => song.id === game.activeSong.songId);
      title = t(language, song?.name || 'Sing');
      const phase = game.activeSong.kind === 'learn' ? t(language, game.activeSong.progress < 0.5 ? 'Listen, then sing with {name}.' : 'Your turn to sing.', { name: song.teacher }) : '';
      detail = [phase, stopInstruction].filter(Boolean).join(' ');
      action = 'Sing';
    }
    else if (focusedGift) { title = game.message; }
    else if (lullaby && nearby?.id === 'aldo') { title = 'Hana hums to Aldo.'; detail = 'Stay a while, or keep walking.'; }
    else if (nearby?.type === 'potato' && !game.potatoes.includes(nearby.id)) { title = 'A potato for supper'; detail = 'Press E to gather'; canInteract = true; }
    else if (nearby?.type === 'fairy') { title = t(language, nearby.learned ? '{name} remembers your song' : 'Sing with {name}', { name: nearby.name }); detail = nearby.learned ? 'Song learned' : 'Press E to sing'; action = 'Sing'; canInteract = !nearby.learned; }
    else if (nearby?.type === 'practice') {
      const song = SONGS.find((item) => item.id === nearby.songId);
      title = nearby.name; action = 'Sing'; canInteract = true;
      const songName = t(language, song.name.toLowerCase());
      detail = t(language, nearby.learned ? 'Press E to sing the {song} again' : 'Learn the {song} from {name} first.', { song: songName, name: song.teacher });
    }
    else if (nearby?.type === 'songSite') { title = placeName(language, nearby.name); detail = nearby.completed ? 'Restored' : 'Press E to choose a song'; action = 'Choose a song'; canInteract = !nearby.completed; }
    else if (nearby?.type === 'cat') { title = 'Pet Percy'; detail = 'Press E to pet Percy'; action = 'Pet Percy'; canInteract = true; }
    else if (nearby?.type === 'creature') { title = t(language, '{name} has a question', { name: t(language, CREATURES.find((item) => item.id === nearby.id)?.englishName || nearby.name) }); detail = 'Press E for a quiz'; action = 'Quiz'; canInteract = true; }
    else if (nearby?.type === 'home') { title = allGifts ? 'Welcome home, Hana' : 'The cottage is waiting'; detail = allGifts ? 'Press E to go inside' : 'Find every gift, then return here'; action = 'Go home'; canInteract = allGifts; }
    else if (nearby?.type === 'house') {
      const activity = HOUSE_ACTIVITIES.find((item) => item.id === nearby.id);
      title = activity.label;
      detail = nearby.ready ? 'Press E, then release between actions' : nearby.completed ? 'Already done. Follow the house guide.' : 'Follow the house guide first';
      action = activity.action;
      canInteract = nearby.ready;
    }
    interaction.hidden = !title || !playable;
    interaction.classList.toggle('is-singing', singing);
    interaction.classList.toggle('is-moment', Boolean(focusedGift || lullaby));
    setText('[data-interaction-title]', t(language, title)); setText('[data-interaction-detail]', t(language, detail));
    songTrack.hidden = !singing; find('.song-note').hidden = !singing;
    const progress = Math.max(0, Math.min(1, game.activeSong?.progress || 0));
    songFill.style.transform = `scaleX(${progress})`; songTrack.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    touchAction.disabled = !canInteract || !playable;
    setText('.touch-action span', t(language, action)); touchAction.setAttribute('aria-label', t(language, action));
    if (touchAction.disabled && actionPointers.size) { actionPointers.clear(); touchAction.classList.remove('is-held'); onAction('touchInteract', false); }
    const message = game.activeSong?.kind === 'learn' ? '' : game.messageTime > 0 ? game.message || '' : '';
    toast.classList.toggle('visually-hidden', Boolean(focusedGift));
    if (message !== previousMessage) { toast.textContent = message; toast.hidden = !message; previousMessage = message; }
  }
  for (const direction of directionPointers.values()) find(`[data-direction="${direction}"]`).classList.add('is-held');
  if (actionPointers.size) touchAction.classList.add('is-held');
  for (const [index, node] of [...root.querySelectorAll('button, select, a[href], [tabindex]')].entries()) node.dataset.focusKey = String(index);
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
  const memory = { aboutOpen: null };
  return {
    update(game, view) {
      const nextLanguage = game.language === 'en' ? 'en' : 'cs';
      if (nextLanguage !== language) {
        const focusKey = root.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
        const selectedVariants = [...root.querySelectorAll('[data-scene-variant]')].map((select) => [select.dataset.sceneVariant, select.value]);
        const openPanel = root.querySelector('[data-overlay]:not([hidden]) .parchment');
        const scrollTop = openPanel?.scrollTop || 0;
        language = nextLanguage;
        const heldInputs = current?.dispose({ preserveInputs: true });
        current = createLocalizedUI(root, onAction, language, heldInputs, memory);
        current.update(game, view);
        for (const [id, value] of selectedVariants) root.querySelector(`[data-scene-variant="${id}"]`).value = value;
        const nextPanel = root.querySelector('[data-overlay]:not([hidden]) .parchment');
        if (nextPanel) nextPanel.scrollTop = scrollTop;
        const previousControl = focusKey == null ? null : root.querySelector(`[data-focus-key="${focusKey}"]`);
        if (previousControl && !previousControl.disabled && !previousControl.closest('[hidden]')) previousControl.focus({ preventScroll: true });
      } else current.update(game, view);
    },
    dispose() { current?.dispose(); current = null; },
  };
}
