// ============================================================
// 白貓博士的海洋復育行動 - 益智問答遊戲
// Video-driven, pure HTML/CSS/JS (no game engine)
// ============================================================

const GAME_W = 720;
const GAME_H = 1280;

// ── Sound Generator (Web Audio, no files needed) ──
const SoundGen = {
    ctx: null,
    bgmNodes: null,
    getCtx() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        return this.ctx;
    },
    resume() {
        const ctx = this.getCtx();
        if (ctx.state === 'suspended') ctx.resume();
    },
    play(type) {
        const ctx = this.getCtx();
        this.resume();
        switch (type) {
            case 'tap': this._tone(ctx, 600, 0.08, 'sine', 0.2); break;
            case 'correct': this._correctSfx(ctx); break;
            case 'wrong': this._wrongSfx(ctx); break;
            case 'tick': this._tone(ctx, 800, 0.05, 'sine', 0.1); break;
            case 'streak': this._streakSfx(ctx); break;
            case 'fanfare': this._fanfareSfx(ctx); break;
            case 'splash': this._noise(ctx, 0.2, 0.15); break;
            case 'timesup': this._timesupSfx(ctx); break;
            case 'countdown': this._countdownSfx(ctx); break;
            case 'select': this._selectSfx(ctx); break;
            case 'whoosh': this._whoosh(ctx); break;
            default: break;
        }
    },
    // Rich effect sounds
    _correctSfx(ctx) {
        // Sparkly rising chime
        [523, 659, 784, 1047].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.08;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.2, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2);
            // Harmonic shimmer
            const o2 = ctx.createOscillator(), g2 = ctx.createGain();
            o2.type = 'sine'; o2.frequency.value = f * 2;
            g2.gain.setValueAtTime(0.06, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            o2.connect(g2); g2.connect(ctx.destination); o2.start(t); o2.stop(t + 0.15);
        });
    },
    _wrongSfx(ctx) {
        // Descending buzz + thud
        const t = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(300, t);
        o.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.35);
        // Low thud
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(80, t + 0.05);
        o2.frequency.exponentialRampToValueAtTime(40, t + 0.2);
        g2.gain.setValueAtTime(0.2, t + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.05); o2.stop(t + 0.25);
    },
    _streakSfx(ctx) {
        // Triumphant ascending with sparkle
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.07;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.18, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
        });
        // Sparkle noise burst at end
        setTimeout(() => this._noise(ctx, 0.15, 0.08), 350);
    },
    _fanfareSfx(ctx) {
        // Grand victory fanfare
        const notes = [523, 523, 659, 784, 784, 1047, 1047, 1319];
        const durs =  [0.1,  0.1,  0.12, 0.15, 0.1,  0.15, 0.1,  0.3];
        let t = ctx.currentTime;
        notes.forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            g.gain.setValueAtTime(0.22, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + durs[i] + 0.1);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + durs[i] + 0.1);
            // Harmony (5th above)
            const o2 = ctx.createOscillator(), g2 = ctx.createGain();
            o2.type = 'sine'; o2.frequency.value = f * 1.5;
            g2.gain.setValueAtTime(0.06, t);
            g2.gain.exponentialRampToValueAtTime(0.001, t + durs[i] + 0.08);
            o2.connect(g2); g2.connect(ctx.destination); o2.start(t); o2.stop(t + durs[i] + 0.08);
            t += durs[i];
        });
    },
    _timesupSfx(ctx) {
        // Alarm-like descending buzz
        [500, 400, 300, 200].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.15;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'square'; o.frequency.value = f;
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.12);
        });
    },
    _countdownSfx(ctx) {
        // Urgent tick with rising pitch
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 1200;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.06);
    },
    _selectSfx(ctx) {
        // Cheerful double blip
        [880, 1175].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.08;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.2, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.1);
        });
    },
    _whoosh(ctx) {
        // Screen transition whoosh
        const n = ctx.sampleRate * 0.3, buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(i / n * Math.PI);
        const s = ctx.createBufferSource(); s.buffer = buf;
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass'; bpf.frequency.value = 1000; bpf.Q.value = 0.5;
        const g = ctx.createGain(); g.gain.value = 0.1;
        s.connect(bpf); bpf.connect(g); g.connect(ctx.destination); s.start();
    },
    playClickSfx() {
        const ctx = this.getCtx();
        this.resume();
        const sfx = [
            () => this._bubble(ctx),
            () => this._waterdrop(ctx),
            () => this._shell(ctx),
            () => this._pop(ctx),
            () => this._blip(ctx),
            () => this._chime(ctx),
            () => this._sonar(ctx),
            () => this._splash2(ctx),
        ];
        sfx[Math.floor(Math.random() * sfx.length)]();
    },
    // Fun click sounds
    _bubble(ctx) {
        const freq = 300 + Math.random() * 400;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(freq * 2, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.15);
    },
    _waterdrop(ctx) {
        const freq = 1000 + Math.random() * 500;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.08);
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.12);
    },
    _shell(ctx) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(800, ctx.currentTime);
        o.frequency.setValueAtTime(1200, ctx.currentTime + 0.03);
        o.frequency.setValueAtTime(600, ctx.currentTime + 0.06);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.15);
    },
    _pop(ctx) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(400, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.06);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.08);
    },
    _blip(ctx) {
        const freq = 600 + Math.random() * 600;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.06);
    },
    _chime(ctx) {
        // Wind chime sound
        const freqs = [1200, 1500, 1800].map(f => f + Math.random() * 100);
        freqs.forEach((f, i) => {
            const t = ctx.currentTime + i * 0.04;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2);
        });
    },
    _sonar(ctx) {
        // Sonar ping
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 1500;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.4);
    },
    _splash2(ctx) {
        // Bigger splash with filter sweep
        const n = ctx.sampleRate * 0.25, buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / n * 4);
        const s = ctx.createBufferSource(); s.buffer = buf;
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(5000, ctx.currentTime);
        lpf.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
        const g = ctx.createGain(); g.gain.value = 0.15;
        s.connect(lpf); lpf.connect(g); g.connect(ctx.destination); s.start();
    },
    // Core helpers
    _tone(ctx, freq, dur, type, vol) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
    },
    _melody(ctx, freqs, dur, type, vol) {
        freqs.forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type; o.frequency.value = f;
            const t = ctx.currentTime + i * dur;
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
            o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
        });
    },
    _noise(ctx, dur, vol) {
        const n = ctx.sampleRate * dur, buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / n * 5);
        const s = ctx.createBufferSource(), g = ctx.createGain();
        s.buffer = buf; g.gain.value = vol;
        s.connect(g); g.connect(ctx.destination); s.start();
    },
    // BGM: rich procedural ocean music
    bgmTimer: null,
    startBGM() {
        if (this.bgmNodes) return;
        const ctx = this.getCtx();
        this.resume();

        const master = ctx.createGain();
        master.gain.value = 0.10;
        master.connect(ctx.destination);

        // --- Reverb (simulated with delay) ---
        const delay = ctx.createDelay(); delay.delayTime.value = 0.15;
        const feedback = ctx.createGain(); feedback.gain.value = 0.25;
        const wetGain = ctx.createGain(); wetGain.gain.value = 0.3;
        delay.connect(feedback); feedback.connect(delay);
        delay.connect(wetGain); wetGain.connect(master);

        // --- Warm pad layer (C major 7th chord, slow evolving) ---
        const padFreqs = [130.81, 164.81, 196, 246.94]; // C3 E3 G3 B3
        const padOscs = padFreqs.map((freq, i) => {
            const o = ctx.createOscillator();
            o.type = 'sine'; o.frequency.value = freq;
            const g = ctx.createGain(); g.gain.value = 0.06;
            // Slow LFO for gentle movement
            const lfo = ctx.createOscillator();
            lfo.type = 'sine'; lfo.frequency.value = 0.08 + i * 0.03;
            const lfoG = ctx.createGain(); lfoG.gain.value = 3;
            lfo.connect(lfoG); lfoG.connect(o.frequency);
            o.connect(g); g.connect(master); g.connect(delay);
            o.start(); lfo.start();
            return { osc: o, lfo };
        });

        // --- Sub bass (gentle pulse) ---
        const bass = ctx.createOscillator();
        bass.type = 'sine'; bass.frequency.value = 65.41; // C2
        const bassG = ctx.createGain(); bassG.gain.value = 0.08;
        const bassLfo = ctx.createOscillator();
        bassLfo.type = 'sine'; bassLfo.frequency.value = 0.25;
        const bassLfoG = ctx.createGain(); bassLfoG.gain.value = 0.04;
        bassLfo.connect(bassLfoG); bassLfoG.connect(bassG.gain);
        bass.connect(bassG); bassG.connect(master);
        bass.start(); bassLfo.start();

        // --- Melody: 4 phrases that rotate, pentatonic + gentle ---
        const phrases = [
            // Phrase A: upward hopeful
            [523, 587, 659, 784, 880, 784, 659, 784],
            // Phrase B: gentle wave
            [659, 587, 523, 440, 523, 587, 659, 523],
            // Phrase C: playful bounce
            [784, 880, 784, 659, 587, 659, 784, 880],
            // Phrase D: calm resolve
            [880, 784, 659, 523, 587, 523, 440, 523],
        ];
        const noteDur = 0.38;
        const phraseLen = 8 * noteDur;
        let melodyStart = ctx.currentTime + 0.8;
        let phraseIdx = 0;

        // --- Arpegio layer (background sparkle) ---
        const arpNotes = [1047, 1319, 1568, 1319, 1047, 880, 1047, 1319]; // C6 E6 G6...
        const arpDur = 0.3;

        // --- Rhythm: soft kick + hi-hat pattern ---
        const scheduleRhythm = (startTime) => {
            const beatDur = noteDur;
            for (let i = 0; i < 8; i++) {
                const t = startTime + i * beatDur;
                // Soft kick on beats 0, 2, 4, 6
                if (i % 2 === 0) {
                    const kick = ctx.createOscillator();
                    kick.type = 'sine'; kick.frequency.setValueAtTime(80, t);
                    kick.frequency.exponentialRampToValueAtTime(40, t + 0.08);
                    const kg = ctx.createGain();
                    kg.gain.setValueAtTime(0.07, t);
                    kg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    kick.connect(kg); kg.connect(master);
                    kick.start(t); kick.stop(t + 0.12);
                }
                // Soft hi-hat (noise burst) on off-beats
                if (i % 2 === 1) {
                    const bufLen = ctx.sampleRate * 0.04;
                    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
                    const d = buf.getChannelData(0);
                    for (let j = 0; j < bufLen; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / bufLen * 8);
                    const hat = ctx.createBufferSource(); hat.buffer = buf;
                    // High-pass filter for hat
                    const hpf = ctx.createBiquadFilter();
                    hpf.type = 'highpass'; hpf.frequency.value = 8000;
                    const hg = ctx.createGain(); hg.gain.value = 0.03;
                    hat.connect(hpf); hpf.connect(hg); hg.connect(master);
                    hat.start(t);
                }
            }
        };

        const schedulePhrase = () => {
            const now = ctx.currentTime;
            const phrase = phrases[phraseIdx % phrases.length];
            phraseIdx++;

            // Melody
            phrase.forEach((freq, i) => {
                const t = melodyStart + i * noteDur;
                if (t < now - 0.1) return;
                const o = ctx.createOscillator();
                o.type = 'triangle';
                o.frequency.value = freq;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.14, t + 0.03);
                g.gain.setValueAtTime(0.14, t + noteDur * 0.4);
                g.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.9);
                o.connect(g); g.connect(master); g.connect(delay);
                o.start(t); o.stop(t + noteDur);
            });

            // Arpeggio (quieter, sparkly)
            arpNotes.forEach((freq, i) => {
                const t = melodyStart + i * arpDur;
                if (t < now - 0.1) return;
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.value = freq;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.04, t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, t + arpDur * 0.8);
                o.connect(g); g.connect(master); g.connect(delay);
                o.start(t); o.stop(t + arpDur);
            });

            // Rhythm
            scheduleRhythm(melodyStart);

            melodyStart += phraseLen;
        };

        schedulePhrase();
        this.bgmTimer = setInterval(() => {
            if (ctx.currentTime > melodyStart - 1.5) schedulePhrase();
        }, 400);

        const allOscs = padOscs.flatMap(p => [p.osc, p.lfo]).concat([bass, bassLfo]);
        this.bgmNodes = { master, oscs: allOscs, extras: [delay, feedback, wetGain] };
    },
    // Reaction jingles (play during answer reaction videos)
    _reactionNodes: null,
    playCorrectJingle(long) {
        this.stopReactionJingle();
        const ctx = this.getCtx();
        this.resume();
        const master = ctx.createGain();
        master.gain.value = 0.30;
        master.connect(ctx.destination);

        // Big bright reverb
        const dly = ctx.createDelay(); dly.delayTime.value = 0.15;
        const dfb = ctx.createGain(); dfb.gain.value = 0.3;
        const dwet = ctx.createGain(); dwet.gain.value = 0.4;
        dly.connect(dfb); dfb.connect(dly); dly.connect(dwet); dwet.connect(master);

        const t0 = ctx.currentTime;

        // Helper: noise sparkle burst
        const sparkle = (t, dur, vol) => {
            const n = ctx.sampleRate * dur;
            const buf = ctx.createBuffer(1, n, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / n * 5);
            const s = ctx.createBufferSource(); s.buffer = buf;
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 6000;
            const sg = ctx.createGain(); sg.gain.value = vol;
            s.connect(hpf); hpf.connect(sg); sg.connect(master); sg.connect(dly);
            s.start(t);
        };

        if (long) {
            // === EPIC VICTORY: fast ascending fanfare + harmony + drum roll + sparkle cascade ===

            // Drum roll build-up
            for (let i = 0; i < 12; i++) {
                const t = t0 + i * 0.06;
                const kick = ctx.createOscillator(); kick.type = 'sine';
                kick.frequency.setValueAtTime(60 + i * 5, t);
                kick.frequency.exponentialRampToValueAtTime(30, t + 0.05);
                const kg = ctx.createGain();
                kg.gain.setValueAtTime(0.08 + i * 0.01, t);
                kg.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                kick.connect(kg); kg.connect(master);
                kick.start(t); kick.stop(t + 0.06);
            }

            // Ascending fanfare melody with big sound
            const notes = [523, 587, 659, 784, 880, 1047, 1319, 1568];
            const dur = 0.2;
            const fanfareStart = t0 + 0.2;
            notes.forEach((f, i) => {
                const t = fanfareStart + i * dur;
                // Main (loud triangle)
                const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.28, t);
                g.gain.exponentialRampToValueAtTime(0.01, t + dur * 1.2);
                o.connect(g); g.connect(master); g.connect(dly);
                o.start(t); o.stop(t + dur * 1.2);
                // Harmony 3rd above
                const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 1.26;
                const g2 = ctx.createGain();
                g2.gain.setValueAtTime(0.12, t);
                g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
                o2.connect(g2); g2.connect(master); g2.connect(dly);
                o2.start(t); o2.stop(t + dur);
                // Octave shimmer
                const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 2;
                const g3 = ctx.createGain();
                g3.gain.setValueAtTime(0.06, t);
                g3.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
                o3.connect(g3); g3.connect(master); g3.connect(dly);
                o3.start(t); o3.stop(t + dur);
                // Sparkle on every other note
                if (i % 2 === 0) sparkle(t, 0.1, 0.06);
            });

            // GRAND VICTORY CHORD (C major spread + bright)
            const chordT = fanfareStart + notes.length * dur;
            [261, 330, 392, 523, 659, 784, 1047, 1568].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = i < 4 ? 'triangle' : 'sine'; o.frequency.value = f;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.15, chordT);
                g.gain.exponentialRampToValueAtTime(0.001, chordT + 1.5);
                o.connect(g); g.connect(master); g.connect(dly);
                o.start(chordT); o.stop(chordT + 1.5);
            });

            // Big sparkle cascade over chord
            for (let i = 0; i < 5; i++) sparkle(chordT + i * 0.15, 0.15, 0.08);

            // Celebration bass boom
            const boom = ctx.createOscillator(); boom.type = 'sine';
            boom.frequency.setValueAtTime(80, chordT);
            boom.frequency.exponentialRampToValueAtTime(40, chordT + 0.3);
            const boomG = ctx.createGain();
            boomG.gain.setValueAtTime(0.25, chordT);
            boomG.gain.exponentialRampToValueAtTime(0.001, chordT + 0.5);
            boom.connect(boomG); boomG.connect(master);
            boom.start(chordT); boom.stop(chordT + 0.5);

        } else {
            // === SHORT VICTORY: rapid rising + big chord ===
            [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
                const t = t0 + i * 0.07;
                const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.28, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                o.connect(g); g.connect(master); g.connect(dly);
                o.start(t); o.stop(t + 0.2);
            });
            // Chord punch
            const ct = t0 + 0.45;
            [523, 659, 784, 1047].forEach(f => {
                const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.2, ct);
                g.gain.exponentialRampToValueAtTime(0.001, ct + 0.6);
                o.connect(g); g.connect(master); g.connect(dly);
                o.start(ct); o.stop(ct + 0.6);
            });
            sparkle(ct, 0.15, 0.1);
        }
        this._reactionNodes = { master, extras: [dly, dfb, dwet] };
    },
    playWrongJingle(long) {
        this.stopReactionJingle();
        const ctx = this.getCtx();
        this.resume();
        const master = ctx.createGain();
        master.gain.value = 0.28;
        master.connect(ctx.destination);

        const t0 = ctx.currentTime;

        // Helper: heavy impact noise
        const impact = (t, dur, vol) => {
            const n = ctx.sampleRate * dur;
            const buf = ctx.createBuffer(1, n, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / n * 3);
            const s = ctx.createBufferSource(); s.buffer = buf;
            const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 500;
            const sg = ctx.createGain(); sg.gain.value = vol;
            s.connect(lpf); lpf.connect(sg); sg.connect(master);
            s.start(t);
        };

        if (long) {
            // === DRAMATIC FAIL: dissonant crash + heavy descending + rumbling bass + tension ===

            // Opening crash/impact
            impact(t0, 0.5, 0.3);

            // Dissonant stinger chord (minor 2nd cluster)
            [233, 247, 311, 330].forEach(f => {
                const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.12, t0);
                g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
                o.connect(g); g.connect(master);
                o.start(t0); o.stop(t0 + 0.6);
            });

            // Heavy descending melody with dissonance
            const notes = [587, 523, 466, 415, 370, 330, 277, 233];
            const dur = 0.25;
            notes.forEach((f, i) => {
                const t = t0 + 0.3 + i * dur;
                // Dark sawtooth tone
                const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
                const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 800;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
                o.connect(lpf); lpf.connect(g); g.connect(master);
                o.start(t); o.stop(t + dur);
                // Detuned unison for thickness
                const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.015;
                const g2 = ctx.createGain();
                g2.gain.setValueAtTime(0.08, t);
                g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
                o2.connect(lpf); o2.start(t); o2.stop(t + dur);
                // Impact hit on every other note
                if (i % 2 === 0) impact(t, 0.15, 0.12);
            });

            // Deep rumbling bass throughout
            const bass = ctx.createOscillator(); bass.type = 'sawtooth';
            bass.frequency.setValueAtTime(55, t0);
            bass.frequency.exponentialRampToValueAtTime(30, t0 + 3);
            const bassLpf = ctx.createBiquadFilter(); bassLpf.type = 'lowpass'; bassLpf.frequency.value = 120;
            const bassG = ctx.createGain();
            bassG.gain.setValueAtTime(0.2, t0);
            bassG.gain.exponentialRampToValueAtTime(0.001, t0 + 3);
            bass.connect(bassLpf); bassLpf.connect(bassG); bassG.connect(master);
            bass.start(t0); bass.stop(t0 + 3);

            // Final doom chord
            const doomT = t0 + 0.3 + notes.length * dur;
            [65, 78, 98, 131, 156].forEach(f => {
                const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
                const lpf2 = ctx.createBiquadFilter(); lpf2.type = 'lowpass'; lpf2.frequency.value = 300;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.12, doomT);
                g.gain.exponentialRampToValueAtTime(0.001, doomT + 1.2);
                o.connect(lpf2); lpf2.connect(g); g.connect(master);
                o.start(doomT); o.stop(doomT + 1.2);
            });
            impact(doomT, 0.4, 0.25);

        } else {
            // === SHORT FAIL: quick crash + descending buzz + thud ===
            impact(t0, 0.3, 0.25);

            // Dissonant stab
            [330, 349, 233].forEach(f => {
                const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
                const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 600;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.15, t0);
                g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
                o.connect(lpf); lpf.connect(g); g.connect(master);
                o.start(t0); o.stop(t0 + 0.3);
            });

            // Fast descending buzz
            const buzz = ctx.createOscillator(); buzz.type = 'sawtooth';
            buzz.frequency.setValueAtTime(400, t0 + 0.1);
            buzz.frequency.exponentialRampToValueAtTime(60, t0 + 0.5);
            const bLpf = ctx.createBiquadFilter(); bLpf.type = 'lowpass'; bLpf.frequency.value = 500;
            const bg = ctx.createGain();
            bg.gain.setValueAtTime(0.2, t0 + 0.1);
            bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
            buzz.connect(bLpf); bLpf.connect(bg); bg.connect(master);
            buzz.start(t0 + 0.1); buzz.stop(t0 + 0.6);

            // Heavy thud
            const thud = ctx.createOscillator(); thud.type = 'sine';
            thud.frequency.setValueAtTime(80, t0 + 0.4);
            thud.frequency.exponentialRampToValueAtTime(25, t0 + 0.7);
            const tg = ctx.createGain();
            tg.gain.setValueAtTime(0.3, t0 + 0.4);
            tg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8);
            thud.connect(tg); tg.connect(master);
            thud.start(t0 + 0.4); thud.stop(t0 + 0.8);
            impact(t0 + 0.4, 0.2, 0.2);
        }
        this._reactionNodes = { master, extras: [] };
    },
    stopReactionJingle() {
        if (!this._reactionNodes) return;
        this._reactionNodes.master.disconnect();
        this._reactionNodes.extras.forEach(n => { try { n.disconnect(); } catch(e) {} });
        this._reactionNodes = null;
    },
    pauseBGM() {
        if (!this.bgmNodes) return;
        const ctx = this.getCtx();
        this.bgmNodes.master.gain.cancelScheduledValues(ctx.currentTime);
        this.bgmNodes.master.gain.setValueAtTime(this.bgmNodes.master.gain.value, ctx.currentTime);
        this.bgmNodes.master.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    },
    resumeBGM() {
        if (!this.bgmNodes) return;
        const ctx = this.getCtx();
        this.bgmNodes.master.gain.cancelScheduledValues(ctx.currentTime);
        this.bgmNodes.master.gain.setValueAtTime(this.bgmNodes.master.gain.value, ctx.currentTime);
        this.bgmNodes.master.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 0.5);
    },
    stopBGM() {
        if (!this.bgmNodes) return;
        if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
        this.bgmNodes.oscs.forEach(o => { try { o.stop(); } catch (e) {} });
        if (this.bgmNodes.extras) this.bgmNodes.extras.forEach(n => { try { n.disconnect(); } catch (e) {} });
        this.bgmNodes.master.disconnect();
        this.bgmNodes = null;
    },
    // Title screen BGM: cheerful ocean adventure theme
    titleBgmNodes: null,
    titleBgmTimer: null,
    startTitleBGM() {
        if (this.titleBgmNodes) return;
        const ctx = this.getCtx();
        this.resume();

        const master = ctx.createGain();
        master.gain.value = 0.18;
        master.connect(ctx.destination);

        // Bright reverb
        const delay = ctx.createDelay(); delay.delayTime.value = 0.18;
        const fb = ctx.createGain(); fb.gain.value = 0.3;
        const wet = ctx.createGain(); wet.gain.value = 0.35;
        delay.connect(fb); fb.connect(delay);
        delay.connect(wet); wet.connect(master);

        // Cheerful pad (C major: C3 E3 G3 C4)
        const padFreqs = [130.81, 164.81, 196, 261.63];
        const padOscs = padFreqs.map((freq, i) => {
            const o = ctx.createOscillator();
            o.type = 'sine'; o.frequency.value = freq;
            const g = ctx.createGain(); g.gain.value = 0.07;
            const lfo = ctx.createOscillator();
            lfo.type = 'sine'; lfo.frequency.value = 0.1 + i * 0.03;
            const lfoG = ctx.createGain(); lfoG.gain.value = 2.5;
            lfo.connect(lfoG); lfoG.connect(o.frequency);
            o.connect(g); g.connect(master); g.connect(delay);
            o.start(); lfo.start();
            return { osc: o, lfo };
        });

        // Sub bass bounce
        const bass = ctx.createOscillator();
        bass.type = 'sine'; bass.frequency.value = 65.41;
        const bassG = ctx.createGain(); bassG.gain.value = 0.1;
        const bassLfo = ctx.createOscillator();
        bassLfo.type = 'sine'; bassLfo.frequency.value = 0.5;
        const bassLfoG = ctx.createGain(); bassLfoG.gain.value = 0.05;
        bassLfo.connect(bassLfoG); bassLfoG.connect(bassG.gain);
        bass.connect(bassG); bassG.connect(master);
        bass.start(); bassLfo.start();

        // Cheerful melody: C major pentatonic, bouncy rhythm
        const phrases = [
            // Phrase A: exciting rise
            [523, 587, 659, 784, 880, 1047, 880, 784],
            // Phrase B: playful bounce
            [784, 659, 784, 880, 784, 659, 523, 659],
            // Phrase C: triumphant peak
            [880, 1047, 880, 784, 659, 784, 880, 1047],
            // Phrase D: happy resolve
            [784, 659, 523, 659, 784, 659, 523, 587],
        ];
        const noteDur = 0.28;
        const phraseLen = 8 * noteDur;
        let melodyStart = ctx.currentTime + 0.3;
        let phraseIdx = 0;

        // Sparkly arpeggio
        const arpNotes = [1047, 1319, 1568, 1319, 1047, 1319, 1568, 1760];
        const arpDur = 0.22;

        // Bouncy rhythm: kick + clap pattern
        const scheduleRhythm = (startTime) => {
            for (let i = 0; i < 8; i++) {
                const t = startTime + i * noteDur;
                // Kick on 0, 2, 4, 6
                if (i % 2 === 0) {
                    const kick = ctx.createOscillator();
                    kick.type = 'sine';
                    kick.frequency.setValueAtTime(100, t);
                    kick.frequency.exponentialRampToValueAtTime(40, t + 0.08);
                    const kg = ctx.createGain();
                    kg.gain.setValueAtTime(0.1, t);
                    kg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    kick.connect(kg); kg.connect(master);
                    kick.start(t); kick.stop(t + 0.12);
                }
                // Snappy hi-hat on off-beats
                if (i % 2 === 1) {
                    const bufLen = ctx.sampleRate * 0.035;
                    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
                    const d = buf.getChannelData(0);
                    for (let j = 0; j < bufLen; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / bufLen * 10);
                    const hat = ctx.createBufferSource(); hat.buffer = buf;
                    const hpf = ctx.createBiquadFilter();
                    hpf.type = 'highpass'; hpf.frequency.value = 8000;
                    const hg = ctx.createGain(); hg.gain.value = 0.05;
                    hat.connect(hpf); hpf.connect(hg); hg.connect(master);
                    hat.start(t);
                }
                // Clap on beat 3 and 7
                if (i === 3 || i === 7) {
                    const cLen = ctx.sampleRate * 0.06;
                    const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
                    const cd = cBuf.getChannelData(0);
                    for (let j = 0; j < cLen; j++) cd[j] = (Math.random() * 2 - 1) * Math.exp(-j / cLen * 6);
                    const clap = ctx.createBufferSource(); clap.buffer = cBuf;
                    const bpf = ctx.createBiquadFilter();
                    bpf.type = 'bandpass'; bpf.frequency.value = 2000; bpf.Q.value = 1.5;
                    const cg = ctx.createGain(); cg.gain.value = 0.06;
                    clap.connect(bpf); bpf.connect(cg); cg.connect(master);
                    clap.start(t);
                }
            }
        };

        const schedulePhrase = () => {
            const now = ctx.currentTime;
            const phrase = phrases[phraseIdx % phrases.length];
            phraseIdx++;

            // Melody (triangle wave for warmth)
            phrase.forEach((freq, i) => {
                const t = melodyStart + i * noteDur;
                if (t < now - 0.1) return;
                const o = ctx.createOscillator();
                o.type = 'triangle'; o.frequency.value = freq;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.18, t + 0.02);
                g.gain.setValueAtTime(0.18, t + noteDur * 0.3);
                g.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.85);
                o.connect(g); g.connect(master); g.connect(delay);
                o.start(t); o.stop(t + noteDur);

                // Octave sparkle on every other note
                if (i % 2 === 0) {
                    const o2 = ctx.createOscillator();
                    o2.type = 'sine'; o2.frequency.value = freq * 2;
                    const g2 = ctx.createGain();
                    g2.gain.setValueAtTime(0.04, t);
                    g2.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.5);
                    o2.connect(g2); g2.connect(master); g2.connect(delay);
                    o2.start(t); o2.stop(t + noteDur);
                }
            });

            // Arpeggio sparkle (higher, lighter)
            arpNotes.forEach((freq, i) => {
                const t = melodyStart + i * arpDur;
                if (t < now - 0.1) return;
                const o = ctx.createOscillator();
                o.type = 'sine'; o.frequency.value = freq;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.05, t + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, t + arpDur * 0.7);
                o.connect(g); g.connect(master); g.connect(delay);
                o.start(t); o.stop(t + arpDur);
            });

            // Rhythm
            scheduleRhythm(melodyStart);
            melodyStart += phraseLen;
        };

        schedulePhrase();
        this.titleBgmTimer = setInterval(() => {
            if (ctx.currentTime > melodyStart - 1.5) schedulePhrase();
        }, 300);

        const allOscs = padOscs.flatMap(p => [p.osc, p.lfo]).concat([bass, bassLfo]);
        this.titleBgmNodes = { master, oscs: allOscs, extras: [delay, fb, wet] };
    },
    stopTitleBGM() {
        if (!this.titleBgmNodes) return;
        if (this.titleBgmTimer) { clearInterval(this.titleBgmTimer); this.titleBgmTimer = null; }
        this.titleBgmNodes.oscs.forEach(o => { try { o.stop(); } catch (e) {} });
        this.titleBgmNodes.extras.forEach(n => { try { n.disconnect(); } catch (e) {} });
        this.titleBgmNodes.master.disconnect();
        this.titleBgmNodes = null;
    }
};

// ── Video Manager ──
const VideoManager = {
    videoA: null,
    videoB: null,
    activeVideo: 'a',
    cache: {},

    init() {
        this.videoA = document.getElementById('bg-video-a');
        this.videoB = document.getElementById('bg-video-b');
    },

    async preload(urls, onProgress) {
        let loaded = 0;
        const total = urls.length;
        const promises = urls.map(url =>
            fetch(url).then(r => r.blob()).then(blob => {
                this.cache[url] = URL.createObjectURL(blob);
                loaded++;
                if (onProgress) onProgress(loaded, total, url);
            }).catch(err => {
                console.warn('Video preload failed:', url, err);
                this.cache[url] = url;
                loaded++;
                if (onProgress) onProgress(loaded, total, url);
            })
        );
        await Promise.all(promises);
    },

    getActive() {
        return this.activeVideo === 'a' ? this.videoA : this.videoB;
    },

    getInactive() {
        return this.activeVideo === 'a' ? this.videoB : this.videoA;
    },

    // Play video with crossfade from current
    play(url, { loop = false, onEnded = null, crossfade = true } = {}) {
        const src = this.cache[url] || url;
        const next = this.getInactive();
        const curr = this.getActive();

        next.src = src;
        next.loop = loop;
        next.muted = true;
        next.playsInline = true;

        // Remove old ended handler
        next.onended = null;

        const startPlay = () => {
            next.play().then(() => {
                if (crossfade) {
                    next.style.opacity = '1';
                    curr.style.opacity = '0';
                } else {
                    next.style.opacity = '1';
                    curr.style.opacity = '0';
                }
                this.activeVideo = this.activeVideo === 'a' ? 'b' : 'a';

                if (onEnded) {
                    next.onended = () => onEnded();
                }
            }).catch(err => {
                console.warn('Video play failed:', err);
            });
        };

        if (next.readyState >= 2) {
            startPlay();
        } else {
            next.oncanplay = () => {
                next.oncanplay = null;
                startPlay();
            };
            next.load();
        }
    },

    // Pause active video on last frame
    freeze() {
        this.getActive().pause();
    },

    stop() {
        this.videoA.pause();
        this.videoB.pause();
        this.videoA.src = '';
        this.videoB.src = '';
    }
};

// ── UI Helpers ──
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function fitText(element, maxFontSize) {
    let size = maxFontSize;
    element.style.fontSize = size + 'px';
    while (size > 12 && (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)) {
        size -= 1;
        element.style.fontSize = size + 'px';
    }
}

// ── Game State ──
const Game = {
    state: 'LOADING', // LOADING, TITLE, QUIZ, REACTING, EXPLANATION, ENDING, RESULT
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    correctCount: 0,
    timeLeft: 0,
    timerInterval: null,
    answered: false,

    // Video paths (fixed videos + dynamic reaction videos)
    videos: {
        intro: 'assets/video/開頭影片.mp4',
        bgLoop: 'assets/video/十秒背景.mp4',
        timesup: 'assets/video/時間到.mp4',
        ending: 'assets/video/最終結束.mp4',
        correct7s: [],
        wrong7s: [],
        correct3s: [],
        wrong3s: [],
    },

    images: {
        titleBg: 'assets/video/開頭影片圖檔.png',
    },

    async loadVideoList() {
        try {
            const resp = await fetch('/api/videos');
            if (!resp.ok) throw new Error('API not available');
            const data = await resp.json();
            this.videos.correct7s = data.correct7s || [];
            this.videos.wrong7s = data.wrong7s || [];
            this.videos.correct3s = data.correct3s || [];
            this.videos.wrong3s = data.wrong3s || [];
            console.log(`影片掃描: 答對7秒×${this.videos.correct7s.length}, 答錯7秒×${this.videos.wrong7s.length}, 答對3秒×${this.videos.correct3s.length}, 答錯3秒×${this.videos.wrong3s.length}`);
        } catch (e) {
            // 靜態託管（如 GitHub Pages）沒有 API，用完整預設清單
            console.log('使用預設影片清單（靜態模式）');
            this.videos.correct7s = [
                'assets/video/7秒_答對1.mp4', 'assets/video/7秒_答對2.mp4',
                'assets/video/7秒_答對3.mp4', 'assets/video/7秒_答對4.mp4',
                'assets/video/7秒_答對5.mp4', 'assets/video/7秒_答對6.mp4',
            ];
            this.videos.wrong7s = [
                'assets/video/7秒_答錯1.mp4', 'assets/video/7秒_答錯2.mp4',
                'assets/video/7秒_答錯3.mp4', 'assets/video/7秒_答錯4.mp4',
                'assets/video/7秒_答錯5.mp4',
            ];
            this.videos.correct3s = ['assets/video/3秒_答對.mp4'];
            this.videos.wrong3s = ['assets/video/3秒_答錯.mp4'];
        }
    },

    getAllVideoUrls() {
        return [
            this.videos.intro,
            this.videos.bgLoop,
            this.videos.timesup,
            this.videos.ending,
            ...this.videos.correct7s,
            ...this.videos.wrong7s,
            ...this.videos.correct3s,
            ...this.videos.wrong3s,
        ];
    },

    async init() {
        VideoManager.init();
        this.bindEvents();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Load questions + scan video folder
        await this.loadQuestions();
        await this.loadVideoList();

        // 預載標題圖片後直接進入，不等影片下載
        const titleImg = new Image();
        titleImg.src = this.images.titleBg;
        await new Promise(r => { titleImg.onload = r; titleImg.onerror = r; });

        document.getElementById('progress-fill').style.width = '100%';
        document.getElementById('loading-text').textContent = '載入完成！';
        await new Promise(r => setTimeout(r, 300));
        this.goTitle();

        // 背景預載所有影片（不阻擋遊戲，邊玩邊載）
        const allVideos = this.getAllVideoUrls();
        VideoManager.preload(allVideos, () => {});
    },

    async loadQuestions() {
        try {
            if (window.EMBEDDED_QUESTIONS) {
                const data = window.EMBEDDED_QUESTIONS;
                this.questions = data.questions || [];
            } else {
                const resp = await fetch('questions.json');
                const data = await resp.json();
                this.questions = data.questions || [];
            }
        } catch (e) {
            console.error('Failed to load questions:', e);
            this.questions = [];
        }
    },

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            SoundGen.resume();
            SoundGen.play('select');
            this.showCategorySelect();
        });

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SoundGen.play('select');
                SoundGen.play('whoosh');
                this.startGame(btn.dataset.cat);
            });
        });

        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.answered || this.state !== 'QUIZ') return;
                const idx = parseInt(btn.dataset.idx);
                SoundGen.playClickSfx();
                this.submitAnswer(idx);
            });
        });

        document.getElementById('explanation-overlay').addEventListener('click', () => {
            if (this.state !== 'EXPLANATION') return;
            SoundGen.play('tap');
            this.nextQuestion();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            SoundGen.play('tap');
            this.showCategorySelect();
        });

        // Start title BGM on any user interaction (AudioContext requires gesture)
        const tryStartTitleBGM = () => {
            SoundGen.resume();
            if (this.state === 'TITLE' || this.state === 'CATEGORY') {
                SoundGen.startTitleBGM();
            }
        };
        // Listen on title screen and whole document for first interaction
        document.getElementById('title-screen').addEventListener('click', tryStartTitleBGM);
        document.getElementById('title-screen').addEventListener('touchstart', tryStartTitleBGM);
        document.addEventListener('click', () => SoundGen.resume(), { once: true });
        document.addEventListener('touchstart', () => SoundGen.resume(), { once: true });
    },

    handleResize() {
        const vp = document.getElementById('game-viewport');
        const scaleX = window.innerWidth / GAME_W;
        const scaleY = window.innerHeight / GAME_H;
        const scale = Math.min(scaleX, scaleY);
        vp.style.transform = `scale(${scale})`;
        vp.style.transformOrigin = 'top left';
        vp.style.position = 'absolute';
        vp.style.left = `${(window.innerWidth - GAME_W * scale) / 2}px`;
        vp.style.top = `${(window.innerHeight - GAME_H * scale) / 2}px`;
    },

    // ── State transitions ──
    goTitle() {
        this.state = 'TITLE';
        showScreen('title-screen');
        // Title BGM will start on first user click (AudioContext needs interaction)

        // Play intro video
        VideoManager.play(this.videos.intro, {
            loop: false,
            onEnded: () => {
                // Show static image when video ends
                const img = document.getElementById('title-bg-image');
                img.src = this.images.titleBg;
                img.style.display = 'block';
            }
        });
    },

    showCategorySelect() {
        this.state = 'CATEGORY';
        showScreen('category-screen');
        SoundGen.stopBGM();
        SoundGen.startTitleBGM();

        // Update question counts
        const cats = { restoration: 0, ecology: 0, aquaculture: 0 };
        this.questions.forEach(q => { if (cats[q.category] !== undefined) cats[q.category]++; });
        const total = cats.restoration + cats.ecology + cats.aquaculture;
        document.getElementById('count-restoration').textContent = cats.restoration + ' 題';
        document.getElementById('count-ecology').textContent = cats.ecology + ' 題';
        document.getElementById('count-aquaculture').textContent = cats.aquaculture + ' 題';
        document.getElementById('count-all').textContent = total + ' 題';
    },

    startGame(category) {
        this.score = 0;
        this.streak = 0;
        this.correctCount = 0;
        this.currentIndex = 0;

        // Filter by category
        let pool = this.questions;
        if (category && category !== 'all') {
            pool = this.questions.filter(q => q.category === category);
        }

        // Shuffle questions, pick 10, and randomize choice order
        this.shuffledQuestions = [...pool].sort(() => Math.random() - 0.5).slice(0, 10).map(q => {
            // Build index array [0,1,2,3], shuffle it
            const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
            return {
                ...q,
                choices: indices.map(i => q.choices[i]),
                answer: indices.indexOf(q.answer),
            };
        });

        SoundGen.stopTitleBGM();
        SoundGen.startBGM();
        this.showQuiz();
    },

    showQuiz() {
        if (this.currentIndex >= this.shuffledQuestions.length) {
            this.goEnding();
            return;
        }

        this.state = 'QUIZ';
        this.answered = false;
        SoundGen.resumeBGM();
        const q = this.shuffledQuestions[this.currentIndex];

        // Play background loop
        VideoManager.play(this.videos.bgLoop, { loop: true });

        // Update UI
        showScreen('quiz-screen');
        document.getElementById('score-text').textContent = this.score;

        // Set question text
        const qText = document.getElementById('question-text');
        qText.textContent = q.question;
        fitText(qText, 32);

        // Set answer texts with staggered animation
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach((btn, i) => {
            btn.className = 'answer-btn';
            btn.style.opacity = '0';
            const textEl = btn.querySelector('.answer-text');
            textEl.textContent = q.choices[i];
            fitText(textEl, 28);

            setTimeout(() => {
                btn.classList.add('answer-pop-in');
            }, i * 80);
        });

        // Start timer
        this.timeLeft = 10;
        this.updateTimerDisplay();
        this.startTimer();
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.timeLeft -= 1;
            this.updateTimerDisplay();

            if (this.timeLeft <= 3) {
                SoundGen.play('countdown');
            } else if (this.timeLeft <= 5) {
                SoundGen.play('tick');
            }

            if (this.timeLeft <= 0) {
                this.timesUp();
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const el = document.getElementById('timer-text');
        el.textContent = Math.max(0, this.timeLeft);
        if (this.timeLeft <= 3) {
            el.classList.add('warning');
        } else {
            el.classList.remove('warning');
        }
    },

    submitAnswer(idx) {
        if (this.answered) return;
        this.answered = true;
        clearInterval(this.timerInterval);

        const q = this.shuffledQuestions[this.currentIndex];
        const isCorrect = idx === q.answer;

        // Highlight answers
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach(btn => btn.classList.add('disabled'));
        answerBtns[q.answer].classList.add('correct');
        if (!isCorrect) {
            answerBtns[idx].classList.add('wrong');
        }

        // Update score
        if (isCorrect) {
            this.streak++;
            this.correctCount++;
            const baseScore = 100;
            const timeBonus = this.timeLeft * 5;
            const streakBonus = this.streak * 20;
            this.score += baseScore + timeBonus + streakBonus;
            SoundGen.play(this.streak >= 3 ? 'streak' : 'correct');
        } else {
            this.streak = 0;
            SoundGen.play('wrong');
        }

        document.getElementById('score-text').textContent = this.score;

        // Choose reaction video based on remaining time
        this.playReaction(isCorrect);
    },

    hideQuizUI() {
        document.getElementById('quiz-screen').classList.remove('active');
    },

    playReaction(isCorrect) {
        this.state = 'REACTING';
        SoundGen.pauseBGM();

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        const long = this.timeLeft >= 7;
        const videoUrl = long
            ? pick(isCorrect ? this.videos.correct7s : this.videos.wrong7s)
            : pick(isCorrect ? this.videos.correct3s : this.videos.wrong3s);

        // Play reaction jingle matching video length
        if (isCorrect) {
            SoundGen.playCorrectJingle(long);
        } else {
            SoundGen.playWrongJingle(long);
        }

        // Hide question/answer boxes so reaction video is fully visible
        this.hideQuizUI();
        VideoManager.play(videoUrl, {
            loop: false,
            onEnded: () => {
                SoundGen.stopReactionJingle();
                VideoManager.freeze();
                this.showExplanation(isCorrect);
            }
        });
    },

    timesUp() {
        if (this.answered) return;
        this.answered = true;
        clearInterval(this.timerInterval);

        this.streak = 0;
        SoundGen.pauseBGM();
        SoundGen.play('timesup');
        SoundGen.playWrongJingle(true);

        // Highlight correct answer
        const q = this.shuffledQuestions[this.currentIndex];
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach(btn => btn.classList.add('disabled'));
        answerBtns[q.answer].classList.add('correct');

        this.state = 'REACTING';
        // Hide question/answer boxes so timesup video is fully visible
        this.hideQuizUI();
        VideoManager.play(this.videos.timesup, {
            loop: false,
            onEnded: () => {
                SoundGen.stopReactionJingle();
                VideoManager.freeze();
                this.showExplanation(false);
            }
        });
    },

    showExplanation(isCorrect) {
        this.state = 'EXPLANATION';
        const q = this.shuffledQuestions[this.currentIndex];

        const resultEl = document.getElementById('explanation-result');
        resultEl.textContent = isCorrect ? '✓ 答對了！' : '✗ 答錯了';
        resultEl.className = isCorrect ? '' : 'wrong-result';

        const textEl = document.getElementById('explanation-text');
        textEl.textContent = q.explanation;
        fitText(textEl, 30);

        const funfactEl = document.getElementById('explanation-funfact');
        if (q.funFact) {
            funfactEl.textContent = '💡 ' + q.funFact;
            funfactEl.style.display = 'block';
            fitText(funfactEl, 25);
        } else {
            funfactEl.style.display = 'none';
        }

        showScreen('explanation-overlay');
    },

    nextQuestion() {
        this.currentIndex++;
        this.showQuiz();
    },

    goEnding() {
        this.state = 'ENDING';
        SoundGen.stopBGM();
        showScreen('quiz-screen'); // hide other screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        VideoManager.play(this.videos.ending, {
            loop: false,
            onEnded: () => {
                VideoManager.freeze();
                this.showResult();
            }
        });
    },

    showResult() {
        this.state = 'RESULT';
        SoundGen.play('fanfare');

        const total = this.shuffledQuestions.length;
        const pct = total > 0 ? (this.correctCount / total) * 100 : 0;

        let rank;
        if (pct >= 90) rank = '🏆 海洋守護者';
        else if (pct >= 70) rank = '🎓 海洋博士';
        else if (pct >= 50) rank = '📚 海洋學者';
        else rank = '🐟 海洋新手';

        document.getElementById('end-rank').textContent = rank;
        document.getElementById('end-score').textContent = this.score;
        document.getElementById('end-detail').textContent =
            `答對 ${this.correctCount} / ${total} 題（${Math.round(pct)}%）`;

        showScreen('end-screen');
    }
};

// ── Boot ──
window.addEventListener('DOMContentLoaded', () => {
    Game.init().catch(err => {
        console.error('Game init error:', err);
        document.getElementById('loading-text').textContent = '載入失敗，請重新整理';
    });
});
