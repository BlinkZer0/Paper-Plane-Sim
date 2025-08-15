let audioCtx = null;
let dest = null;

function initSynth(ctx, d) {
  audioCtx = ctx;
  dest = d;
}

function createWind() {
  if (!audioCtx) return { update() {} };
  const bufSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;
  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest || audioCtx.destination);
  src.start();
  return {
    update(s) {
      const v = Math.min(0.1, s * 0.02);
      gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.05);
    }
  };
}

const collisionFreq = {
  dart: 600,
  glider: 300,
  stunt: 800,
  heavy: 200,
  snub: 500,
  fighter: 900
};

function playCollisionBurst(type) {
  if (!audioCtx) return;
  const f = collisionFreq[type] || 400;
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = f;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(dest || audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.21);
}

export { initSynth, createWind, playCollisionBurst };
