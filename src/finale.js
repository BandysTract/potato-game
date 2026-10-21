import './finale.css';

export const FINALE_VIDEO_ID = 'DrQMROGD-EE';
let apiPromise;

function youtubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let timeout;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      apiPromise = null;
      reject(new Error('Video player unavailable'));
    };
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(window.YT); };
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = fail;
    timeout = setTimeout(fail, 12000);
    document.head.append(script);
  });
  return apiPromise;
}

const cs = {
  'One more song.': 'Ještě jednu písničku.',
  'John pulls down the screen.': 'John stahuje promítací plátno.',
  'Karel Gott · Mám styl Čendy': 'Karel Gott · Mám styl Čendy',
  'Loading the video…': 'Načítá se video…',
  'Hana, John, Aldo, and Percy dance together.': 'Hana, John, Aldo a Percy spolu tančí.',
  'Press play to start the music and dancing.': 'Spusť přehrávání a rodina se dá do tance.',
  'The video is unavailable. Check your connection and try again, or watch on YouTube.': 'Video není dostupné. Zkontroluj připojení a zkus to znovu, nebo ho přehraj na YouTube.',
  'Thanks for the dance.': 'Díky za tanec.',
  'Play video': 'Přehrát video',
  'Pause video': 'Pozastavit video',
  'Play again': 'Přehrát znovu',
  'Try again': 'Zkusit znovu',
  'Sound on': 'Zvuk zapnutý',
  'Sound off': 'Zvuk vypnutý',
  'Scene select': 'Výběr scény',
  'Walk again': 'Znovu do lesa',
  'Watch on YouTube': 'Přehrát na YouTube',
  'Online video from YouTube': 'Online video z YouTube',
  'Play without saving': 'Hrát bez ukládání',
};

// Kept outside the translated game panels so changing language never reloads video.
export function createFinale(container, onAction, onPlayback) {
  const root = document.createElement('section');
  root.className = 'family-finale';
  root.hidden = true;
  root.setAttribute('aria-labelledby', 'finale-title');
  root.innerHTML = `<header class="finale-heading"><h1 id="finale-title"></h1><p data-finale-caption></p></header>
    <div class="projector-video" hidden><div data-video-host></div></div>
    <footer class="finale-controls parchment"><p data-finale-status role="status" aria-live="polite"></p>
      <div class="finale-buttons"><button class="button primary" data-finale-play type="button"></button><button class="icon-button" data-finale-sound data-own-gesture type="button"></button><button class="icon-button" data-finale-language type="button"></button><button class="icon-button" data-finale-admin type="button"></button><button class="icon-button" data-finale-restart data-own-gesture type="button"></button><button class="icon-button" data-finale-unsaved data-own-gesture type="button" hidden></button></div>
      <p class="finale-save" data-finale-save></p>
      <a href="https://www.youtube.com/watch?v=${FINALE_VIDEO_ID}" target="_blank" rel="noopener noreferrer" data-finale-link></a><span class="finale-source" data-finale-source></span>
    </footer>`;
  container.append(root);
  const find = selector => root.querySelector(selector);
  const screen = find('.projector-video');
  const host = find('[data-video-host]');
  const play = find('[data-finale-play]');
  let player = null;
  let session = 0;
  let currentGame = null;
  let language = 'cs';
  let sound = false;
  let active = false;
  let ready = false;
  let started = false;
  let status = 'reveal';
  let playing = false;
  let readyTimeout;
  let disposed = false;
  const abort = new AbortController();
  const listen = (node, name, callback) => node.addEventListener(name, callback, { signal: abort.signal });
  const l = text => language === 'cs' ? cs[text] || text : text;
  function text(node, value) { if (node.textContent !== value) node.textContent = value; }
  function render() {
    text(find('#finale-title'), l('One more song.'));
    text(find('[data-finale-caption]'), l(status === 'reveal' ? 'John pulls down the screen.' : 'Karel Gott · Mám styl Čendy'));
    const message = { reveal: 'John pulls down the screen.', loading: 'Loading the video…', buffering: 'Loading the video…', playing: 'Hana, John, Aldo, and Percy dance together.', paused: 'Press play to start the music and dancing.', ended: 'Thanks for the dance.', error: 'The video is unavailable. Check your connection and try again, or watch on YouTube.' }[status];
    text(find('[data-finale-status]'), l(message));
    text(play, l(status === 'error' ? 'Try again' : playing ? 'Pause video' : status === 'ended' ? 'Play again' : 'Play video'));
    play.disabled = status === 'reveal' || status === 'loading';
    text(find('[data-finale-sound]'), l(sound ? 'Sound on' : 'Sound off'));
    find('[data-finale-sound]').setAttribute('aria-pressed', String(sound));
    text(find('[data-finale-language]'), language === 'cs' ? 'English' : 'Česky');
    text(find('[data-finale-admin]'), l('Scene select'));
    text(find('[data-finale-restart]'), l('Walk again'));
    text(find('[data-finale-unsaved]'), l('Play without saving'));
    text(find('[data-finale-link]'), l('Watch on YouTube'));
    text(find('[data-finale-source]'), l('Online video from YouTube'));
  }
  function playback(next) { playing = next; onPlayback(next); }
  function pause() {
    if (ready) player?.pauseVideo();
    if (playing) { playback(false); status = 'paused'; render(); }
  }
  function clearPlayer() {
    session += 1;
    clearTimeout(readyTimeout);
    ready = false;
    player?.destroy();
    player = null;
    host.replaceChildren();
    started = false;
    playback(false);
  }
  async function load() {
    clearPlayer();
    started = true;
    status = 'loading';
    render();
    const token = session;
    const fail = (error) => {
      if (disposed || token !== session) return;
      console.warn('The projector video could not play.', error?.data || error?.message || 'Player timed out.');
      clearPlayer();
      // Keep the failure visible until the user chooses to retry.
      started = true;
      status = 'error';
      render();
    };
    try {
      const YT = await youtubeAPI();
      if (disposed || token !== session) return;
      const mount = document.createElement('div');
      host.append(mount);
      readyTimeout = setTimeout(fail, 15000);
      player = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        videoId: FINALE_VIDEO_ID,
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, rel: 0, origin: window.location.origin, autoplay: 0, controls: 0, disablekb: 1, hl: language },
        events: {
          onReady(event) {
            if (token !== session || disposed) return;
            clearTimeout(readyTimeout);
            ready = true;
            event.target.getIframe().title = 'Karel Gott · Mám styl Čendy';
            event.target.getIframe().setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            sound ? event.target.unMute() : event.target.mute();
            status = 'paused';
            if (active) event.target.playVideo();
            render();
          },
          onStateChange(event) {
            if (token !== session || disposed) return;
            if (event.data === 1 && !active) { event.target.pauseVideo(); return; }
            playback(event.data === 1);
            if (event.data === 1) status = 'playing';
            else if (event.data === 3) status = 'buffering';
            else if (event.data === 0) status = 'ended';
            else if (event.data === 2 || event.data === 5) status = 'paused';
            render();
          },
          onAutoplayBlocked() { if (token === session) { status = 'paused'; render(); } },
          onError: fail,
        },
      });
    } catch (error) { fail(error); }
  }
  listen(play, 'click', () => {
    if (!active) return;
    if (status === 'error') load();
    else if (ready) {
      if (playing) pause();
      else { if (status === 'ended') player.seekTo(0); player.playVideo(); }
    }
  });
  // The video follows sound intent, independent of the paused game audio engine.
  listen(find('[data-finale-sound]'), 'click', (event) => onAction('sound', 'video', event));
  listen(find('[data-finale-language]'), 'click', () => onAction('language'));
  listen(find('[data-finale-admin]'), 'click', () => onAction('admin'));
  listen(find('[data-finale-restart]'), 'click', (event) => onAction('restart', undefined, event));
  listen(find('[data-finale-unsaved]'), 'click', (event) => onAction('playUnsaved', undefined, event));
  return {
    update(game, view, bounds) {
      if (disposed) return;
      const dance = game.phase === 'won' && game.ending === 'dance';
      if (game !== currentGame || !dance) {
        if (started) clearPlayer();
        currentGame = game;
        status = 'reveal';
      }
      const wasActive = active;
      active = dance && view.overlay === 'dance' && view.focused;
      const visible = dance && view.overlay === 'dance';
      root.hidden = !visible;
      if (!active && wasActive) pause();
      language = game.language;
      // Saving status arrives translated; a latched conflict keeps the unsaved route here.
      text(find('[data-finale-save]'), view.saveStatus || '');
      find('[data-finale-unsaved]').hidden = !view.offerUnsaved;
      if (sound !== view.soundWanted) {
        sound = view.soundWanted;
        if (ready) sound ? player.unMute() : player.mute();
      }
      screen.hidden = !visible || !bounds?.visible;
      if (visible && bounds) {
        Object.assign(screen.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px` });
      }
      if (active && bounds?.visible && !started) load();
      if (visible) render();
      if (visible && root.dataset.open !== 'true') find('[data-finale-admin]').focus({ preventScroll: true });
      root.dataset.open = String(visible);
    },
    pause,
    getPlaybackTime() {
      if (!ready || !active || !playing) return null;
      const time = player.getCurrentTime();
      return Number.isFinite(time) && time >= 0 ? time : null;
    },
    containsFocus() { return root.contains(document.activeElement); },
    dispose() { disposed = true; clearPlayer(); abort.abort(); root.remove(); },
  };
}
