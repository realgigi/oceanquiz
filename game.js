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
            case 'correct': this._melody(ctx, [523, 659, 784], 0.12, 'sine', 0.25); break;
            case 'wrong': this._tone(ctx, 200, 0.3, 'sawtooth', 0.15); break;
            case 'tick': this._tone(ctx, 800, 0.05, 'sine', 0.1); break;
            case 'streak': this._melody(ctx, [523, 659, 784, 1047], 0.1, 'sine', 0.2); break;
            case 'fanfare': this._melody(ctx, [523, 659, 784, 659, 784, 1047], 0.15, 'sine', 0.3); break;
            case 'splash': this._noise(ctx, 0.2, 0.15); break;
            case 'timesup': this._melody(ctx, [400, 300, 200], 0.2, 'sawtooth', 0.2); break;
            default: break;
        }
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
    // BGM: light ocean melody loop
    bgmTimer: null,
    startBGM() {
        if (this.bgmNodes) return;
        const ctx = this.getCtx();
        this.resume();

        const master = ctx.createGain();
        master.gain.value = 0.12;
        master.connect(ctx.destination);

        // Ambient pad (warm background)
        const pad = ctx.createOscillator();
        pad.type = 'sine'; pad.frequency.value = 130.81; // C3
        const padGain = ctx.createGain(); padGain.gain.value = 0.15;
        const padLfo = ctx.createOscillator();
        padLfo.type = 'sine'; padLfo.frequency.value = 0.15;
        const padLfoGain = ctx.createGain(); padLfoGain.gain.value = 8;
        padLfo.connect(padLfoGain); padLfoGain.connect(pad.frequency);
        pad.connect(padGain); padGain.connect(master);

        const pad2 = ctx.createOscillator();
        pad2.type = 'sine'; pad2.frequency.value = 196; // G3
        const pad2Gain = ctx.createGain(); pad2Gain.gain.value = 0.1;
        pad2.connect(pad2Gain); pad2Gain.connect(master);

        [pad, padLfo, pad2].forEach(o => o.start());

        // Melody loop: cute, relaxed ocean feel
        // C major pentatonic melody in higher register
        const melodyNotes = [
            523, 587, 659, 784, 880,  // C5 D5 E5 G5 A5
            784, 659, 523, 587, 659,  // G5 E5 C5 D5 E5
            880, 784, 659, 784, 523,  // A5 G5 E5 G5 C5
            587, 523, 440, 523, 587,  // D5 C5 A4 C5 D5
        ];
        const noteDur = 0.35;
        const loopLen = melodyNotes.length * noteDur;
        let melodyStart = ctx.currentTime + 0.5;

        const scheduleLoop = () => {
            const now = ctx.currentTime;
            melodyNotes.forEach((freq, i) => {
                const t = melodyStart + i * noteDur;
                if (t < now - 0.1) return; // skip past notes
                const o = ctx.createOscillator();
                o.type = 'triangle';
                o.frequency.value = freq;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.18, t + 0.03);
                g.gain.setValueAtTime(0.18, t + noteDur * 0.5);
                g.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.95);
                o.connect(g); g.connect(master);
                o.start(t); o.stop(t + noteDur);
            });
            melodyStart += loopLen;
        };

        scheduleLoop();
        this.bgmTimer = setInterval(() => {
            if (ctx.currentTime > melodyStart - 1) scheduleLoop();
        }, 500);

        this.bgmNodes = { master, oscs: [pad, padLfo, pad2] };
    },
    stopBGM() {
        if (!this.bgmNodes) return;
        if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
        this.bgmNodes.oscs.forEach(o => { try { o.stop(); } catch (e) {} });
        this.bgmNodes.master.disconnect();
        this.bgmNodes = null;
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
        const bustCache = url => url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        const promises = urls.map(url =>
            fetch(bustCache(url), { cache: 'no-store' }).then(r => r.blob()).then(blob => {
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

        // Preload videos
        const allVideos = this.getAllVideoUrls();
        const totalAssets = allVideos.length + 1; // +1 for title bg image
        let loadedCount = 0;

        const updateProgress = (loaded, total, name) => {
            loadedCount++;
            const pct = Math.round((loadedCount / totalAssets) * 100);
            document.getElementById('progress-fill').style.width = pct + '%';
            const shortName = name ? name.split('/').pop() : '';
            document.getElementById('loading-text').textContent = `載入中... ${shortName} (${pct}%)`;
        };

        // Preload title image (cache bust)
        const titleImg = new Image();
        titleImg.src = this.images.titleBg + '?t=' + Date.now();
        titleImg.onload = () => updateProgress(1, 1, this.images.titleBg);
        titleImg.onerror = () => updateProgress(1, 1, this.images.titleBg);

        await VideoManager.preload(allVideos, updateProgress);

        // Wait a moment for image
        await new Promise(r => setTimeout(r, 300));

        document.getElementById('progress-fill').style.width = '100%';
        document.getElementById('loading-text').textContent = '載入完成！';

        await new Promise(r => setTimeout(r, 500));
        this.goTitle();
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
            SoundGen.play('tap');
            this.startGame();
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
            this.startGame();
        });

        // Resume audio context on first user interaction
        document.addEventListener('click', () => SoundGen.resume(), { once: true });
        document.addEventListener('touchstart', () => SoundGen.resume(), { once: true });
    },

    handleResize() {
        const vp = document.getElementById('game-viewport');
        const scaleX = window.innerWidth / GAME_W;
        const scaleY = window.innerHeight / GAME_H;
        const scale = Math.min(scaleX, scaleY);
        vp.style.transform = `scale(${scale})`;
        vp.style.transformOrigin = 'top center';
        // Center vertically
        const top = Math.max(0, (window.innerHeight - GAME_H * scale) / 2);
        vp.style.position = 'absolute';
        vp.style.left = `${(window.innerWidth - GAME_W * scale) / 2}px`;
        vp.style.top = `${top}px`;
    },

    // ── State transitions ──
    goTitle() {
        this.state = 'TITLE';
        showScreen('title-screen');

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

    startGame() {
        this.score = 0;
        this.streak = 0;
        this.correctCount = 0;
        this.currentIndex = 0;

        // Shuffle questions
        this.shuffledQuestions = [...this.questions].sort(() => Math.random() - 0.5);

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
        let videoUrl;

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        if (this.timeLeft >= 7) {
            videoUrl = pick(isCorrect ? this.videos.correct7s : this.videos.wrong7s);
        } else {
            videoUrl = pick(isCorrect ? this.videos.correct3s : this.videos.wrong3s);
        }

        // Hide question/answer boxes so reaction video is fully visible
        this.hideQuizUI();
        VideoManager.play(videoUrl, {
            loop: false,
            onEnded: () => {
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
        SoundGen.play('timesup');

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
