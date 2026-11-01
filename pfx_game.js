// 像素特效回饋（pixelfx，MIT，vendor/pixelfx）：答對／答錯／結算
import { pfxOverlay } from "./pfx_canvas.js";

const vp = document.getElementById("game-viewport");
const pfx = await pfxOverlay(vp, { scale: 3, core: "./vendor/pixelfx/core/index.js", fx: "./vendor/pixelfx/fx" });
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const origSubmit = Game.submitAnswer.bind(Game);
Game.submitAnswer = function (idx) {
    if (this.answered) return origSubmit(idx);
    const q = this.shuffledQuestions[this.currentIndex];
    const ok = idx === q.answer, before = this.score;
    // 位置要在原函式之前量：挑戰模式答錯會立刻切解說頁，按鈕隱藏後量到 0
    const [bx, by] = pfx.centerOf(document.getElementById(`answer-${idx}`));
    origSubmit(idx);
    if (ok) {
        pfx.burst("pickups/collect-burst", bx, by + 40);
        pfx.burst("ui/coin-collect", bx, by + 30);
        // 得分數字放答案鈕右端、COMBO 放底部空白區：不壓題目與選項文字
        pfx.burst("ui/crit-number", 530, by - 10, { text: `+${this.score - before}`, label: "NICE" });
        if (this.streak >= 2) pfx.burst("ui/combo-counter", 360, 1150, { count: this.streak });
    } else {
        const t = document.getElementById("explanation-result");
        const [hx, hy] = t.getBoundingClientRect().width ? pfx.centerOf(t, 0, -110) : [bx, by];
        pfx.burst("ui/heart-lost", hx, hy);
        pfx.burst("impacts/hit-spark", hx, hy);
        if (!reduceMotion)
            document.getElementById("ui-layer").animate(
                [{ transform: "translate(0,0)" }, { transform: "translate(-12px,4px)" }, { transform: "translate(10px,-4px)" },
                 { transform: "translate(-6px,2px)" }, { transform: "translate(0,0)" }], { duration: 260 });
    }
};

const origResult = Game.showResult.bind(Game);
Game.showResult = function () {
    origResult();
    // 結算標題上方橫幅＋底部彩帶（quest-complete 的字只支援英數）
    const n = this.correctCount;
    pfx.burst("ui/quest-complete", 360, 300, { text: this.mode === "challenge" ? `${n} IN A ROW` : `${n} CORRECT` });
    pfx.burst("ui/confetti", 200, 1275, { seed: 3 });
    pfx.burst("ui/confetti", 520, 1265, { seed: 9 });
};
