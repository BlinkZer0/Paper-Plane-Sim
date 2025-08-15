import { audioReady, effects } from './loader.js';
import { playCollisionBurst } from './synth.js';

const collisionEffects = {
  dart: 'collision-dart',
  glider: 'collision-glider',
  stunt: 'collision-stunt',
  heavy: 'collision-heavy',
  snub: 'collision-snub',
  fighter: 'collision-fighter'
};

function playEffect(name) {
  audioReady.then(() => {
    const s = effects[name];
    if (s) {
      try {
        s.currentTime = 0;
        s.play();
      } catch (e) {
        // Ignore play errors (e.g., without user interaction)
      }
    }
  });
}

function playThrow() {
  playEffect('swoosh');
}

function playCollision(planeKey) {
  const name = collisionEffects[planeKey];
  if (name) {
    playEffect(name);
  }
  playCollisionBurst(planeKey);
}

function playUpdraft() {
  playEffect('updraft');
}

export { playThrow, playCollision, playUpdraft, collisionEffects };
