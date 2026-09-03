// Synthesized SFX for UNO — same Web Audio approach as Rummikub's sound.js
// (no audio files), kept as its own copy with its own mute preference so
// the two games stay independent.

const MUTE_STORAGE_KEY = "arcade-uno-sound-muted";

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

export function playCardPlay() {
    playTone({ frequency: 480, duration: 0.08, type: "triangle", peakGain: 0.1 });
    playTone({ frequency: 620, startTime: 0.03, duration: 0.06, type: "triangle", peakGain: 0.07 });
}

export function playDraw() {
    playTone({ frequency: 340, duration: 0.09, type: "sine", peakGain: 0.1 });
}

export function playSkipOrReverse() {
    playTone({ frequency: 300, duration: 0.09, type: "sawtooth", peakGain: 0.09 });
    playTone({ frequency: 220, startTime: 0.06, duration: 0.12, type: "sawtooth", peakGain: 0.09 });
}

export function playDrawPenalty() {
    [260, 220, 180].forEach((frequency, index) => {
        playTone({ frequency, startTime: index * 0.07, duration: 0.14, type: "sawtooth", peakGain: 0.1 });
    });
}

export function playInvalid() {
    playTone({ frequency: 160, duration: 0.16, type: "sawtooth", peakGain: 0.12 });
}

export function playUnoCall() {
    [660, 880].forEach((frequency, index) => {
        playTone({ frequency, startTime: index * 0.07, duration: 0.18, type: "square", peakGain: 0.08 });
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
