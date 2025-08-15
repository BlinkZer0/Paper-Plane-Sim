// Preload audio elements defined in index.html and expose when ready

const trackList = [
  { id: 'track-kansai', title: 'Kansai 90s', artist: 'Shuriken Miasma' },
  { id: 'track-sidewinder', title: 'Sidewinder', artist: 'Shuriken Miasma' },
  { id: 'track-sunshowers', title: 'Sunshowers', artist: 'Shuriken Miasma' }
];

const effectMap = {
  swoosh: 'effect-swoosh'
};

function getElement(id) {
  return /** @type {HTMLAudioElement} */ (document.getElementById(id));
}

function waitFor(el) {
  return new Promise(resolve => {
    if (el.readyState >= 4) {
      resolve();
    } else {
      el.addEventListener('canplaythrough', () => resolve(), { once: true });
    }
  });
}

const tracks = trackList.map(info => ({ ...info, el: getElement(info.id) }));
const effects = Object.fromEntries(
  Object.entries(effectMap).map(([name, id]) => [name, getElement(id)])
);

const audioReady = Promise.all([
  ...tracks.map(t => waitFor(t.el)),
  ...Object.values(effects).map(waitFor)
]);

export { tracks, effects, audioReady };

