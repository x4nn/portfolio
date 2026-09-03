// Lightweight synthesized sound effects — no audio files to fetch or ship,
// everything is generated on the fly with the Web Audio API. Browsers block
// audio before a user gesture, so the AudioContext is created lazily on the
// first call (which always happens from inside a click/tap handler anyway).

const MUTE_STORAGE_KEY = "arcade-rummikub-sound-muted";

let audioContext = null;
let isMuted = false;

try {
    isMuted = localStorage.getItem(MUTE_STORAGE_KEY) === "true";
} catch (error) {
    isMuted = false;
}

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();
    }
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
    return audioContext;
}

// One short tone: a sine/triangle blip that fades out, so nothing ever clicks
// or pops at the edges.
function playTone({ frequency, startTime = 0, duration = 0.12, type = "sine", peakGain = 0.16 }) {
    if (isMuted) return;
    try {
        const context = getAudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const now = context.currentTime + startTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gainNode).connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
    } catch (error) {
        // Audio is a nice-to-have — never let it break gameplay.
    }
}

export function playPickup() {
    playTone({ frequency: 520, duration: 0.06, type: "triangle", peakGain: 0.08 });
}

export function playDrop() {
    playTone({ frequency: 260, duration: 0.09, type: "sine", peakGain: 0.14 });
    playTone({ frequency: 340, startTime: 0.02, duration: 0.07, type: "sine", peakGain: 0.08 });
}

export function playInvalid() {
    playTone({ frequency: 160, duration: 0.16, type: "sawtooth", peakGain: 0.12 });
    playTone({ frequency: 120, startTime: 0.05, duration: 0.2, type: "sawtooth", peakGain: 0.12 });
}

export function playDraw() {
    playTone({ frequency: 440, duration: 0.05, type: "triangle", peakGain: 0.07 });
    playTone({ frequency: 660, startTime: 0.04, duration: 0.08, type: "triangle", peakGain: 0.08 });
}

export function playEndTurnSuccess() {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
        playTone({ frequency, startTime: index * 0.06, duration: 0.16, type: "sine", peakGain: 0.11 });
    });
}

export function playYourTurn() {
    playTone({ frequency: 587.33, duration: 0.1, type: "sine", peakGain: 0.1 });
    playTone({ frequency: 880, startTime: 0.09, duration: 0.14, type: "sine", peakGain: 0.1 });
}

export function playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        playTone({ frequency, startTime: index * 0.09, duration: 0.3, type: "triangle", peakGain: 0.13 });
    });
}

export function isSoundMuted() {
    return isMuted;
}

export function setSoundMuted(muted) {
    isMuted = muted;
    try {
        localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch (error) {
        // ignore — mute preference just won't persist
    }
}
