let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSFXMasterVolume(vol: number) {
  if (masterGain) {
    masterGain.gain.setValueAtTime(vol, getCtx().currentTime);
  }
}

export function playShoot() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.1);

  const shootNoise = ctx.createBufferSource();
  const shootBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const shootData = shootBuf.getChannelData(0);
  for (let i = 0; i < shootData.length; i++) {
    shootData[i] = Math.random() * 2 - 1;
  }
  shootNoise.buffer = shootBuf;
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  shootNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(masterGain!);
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  shootNoise.start(now);
  shootNoise.stop(now + 0.05);
}

export function playPowerUp() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(523, now);
  osc.frequency.setValueAtTime(659, now + 0.07);
  osc.frequency.setValueAtTime(784, now + 0.14);
  osc.frequency.setValueAtTime(1047, now + 0.21);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.setValueAtTime(0.1, now + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.35);
}

export function playShield() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.3;
  const shieldNoise = ctx.createBufferSource();
  const shieldBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const shieldData = shieldBuf.getChannelData(0);
  for (let i = 0; i < shieldData.length; i++) {
    shieldData[i] = Math.random() * 2 - 1;
  }
  shieldNoise.buffer = shieldBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(4000, now + 0.15);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.3);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  shieldNoise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain!);
  shieldNoise.start(now);
  shieldNoise.stop(now + 0.35);
}

export function playHit() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.35);

  const hitNoise = ctx.createBufferSource();
  const hitBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const hitData = hitBuf.getChannelData(0);
  for (let i = 0; i < hitData.length; i++) {
    hitData[i] = Math.random() * 2 - 1;
  }
  hitNoise.buffer = hitBuf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  hitNoise.connect(noiseGain);
  noiseGain.connect(masterGain!);
  hitNoise.start(now);
  hitNoise.stop(now + 0.2);
}

export function playGameOver() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(gain);
  gain.connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.6);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(150, now + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(30, now + 0.7);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.08, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  osc2.connect(gain2);
  gain2.connect(masterGain!);
  osc2.start(now);
  osc2.stop(now + 0.8);
}
