// 網頁遊戲／互動頁用 pixelfx：一張像素畫布蓋在容器上，即時播（requestAnimationFrame）。
//
//   import { pfxOverlay } from "./pfx_canvas.js";
//   const pfx = await pfxOverlay(document.getElementById("game"), { scale: 3, core: "./pixelfx/core/index.js", fx: "./pixelfx/fx" });
//   pfx.burst("ui/coin-collect", x, y);                      // x,y＝容器 CSS 座標（自動換算像素格）
//   pfx.burstAt("pickups/collect-burst", someElement, { dy: 40 });
//
// 容器要 position: relative；畫布 pointer-events: none、z-index 50。容器本身被 CSS transform 縮放也能算對位置
// （座標以容器的 offsetWidth 為準）。遊戲要把 src/core 與用到的 src/fx 複製進專案（MIT，附 LICENSE）。
// ⛔ GitHub Pages：網站根目錄要有空檔 .nojekyll，不然 Jekyll 略過 fx/*/_lib.js → 線上特效全掛、本機測不出來（oceanquiz 11-01）。
// ⚠ 會切畫面的動作（答錯→換頁）要在切換「之前」量元素位置，切完元素隱藏會量到 0（oceanquiz 11-01 坑）。
// ⚠ 手機效能（oceanquiz 11-01「加了特效變很卡」）：畫布蓋在背景影片上時，不用 mix-blend-mode（逼影片每格重新混色合成），
//   只用一張畫布、光層由引擎 composite(…, null) 轉成 alpha；沒有效果在播時畫布 display:none、逐格迴圈停掉。

export async function pfxOverlay(container, { scale = 3, core = "./pixelfx/core/index.js", fx = "./pixelfx/fx", z = 50 } = {}) {
  const { createFrame, clearFrame, createFx, composite } = await import(core);
  const CW = container.offsetWidth, CH = container.offsetHeight;
  const W = Math.ceil(CW / scale), H = Math.ceil(CH / scale);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  Object.assign(c.style, { position: "absolute", left: "0", top: "0", width: `${W * scale}px`, height: `${H * scale}px`,
    imageRendering: "pixelated", pointerEvents: "none", zIndex: String(z), display: "none" });
  container.appendChild(c);
  const ctx = c.getContext("2d");
  const frame = createFrame(W, H), img = new ImageData(W, H);
  const live = [], mods = {};
  let running = false, last = 0;

  async function burst(id, x, y, opts = {}) {
    mods[id] ??= await import(`${fx}/${id}.js`);
    const inst = createFx(mods[id], { x: x / scale, y: y / scale, ...opts });
    live.push(inst);
    if (!running) { running = true; last = performance.now(); c.style.display = ""; requestAnimationFrame(tick); }
    return inst;   // 循環效果要自己 inst.stop()
  }
  /** 元素中心（加 dx, dy）→ 容器座標 */
  function centerOf(el, dx = 0, dy = 0) {
    const v = container.getBoundingClientRect(), r = el.getBoundingClientRect(), k = CW / v.width;
    return [(r.left + r.width / 2 - v.left) * k + dx, (r.top + r.height / 2 - v.top) * k + dy];
  }
  const burstAt = (id, el, { dx = 0, dy = 0, ...opts } = {}) => { const [x, y] = centerOf(el, dx, dy); return burst(id, x, y, opts); };

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clearFrame(frame);
    for (let i = live.length - 1; i >= 0; i--) {
      const f = live[i];
      f.update(dt);
      if (f.done()) { live.splice(i, 1); continue; }
      f.draw(frame, "back");
      f.draw(frame, "front");
    }
    // 沒有效果在播：清掉、藏起畫布、停迴圈（不佔合成、手機省電）
    if (!live.length) { ctx.clearRect(0, 0, W, H); c.style.display = "none"; running = false; return; }
    composite(frame, img.data, null);
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(tick);
  }
  return { burst, burstAt, centerOf, get count() { return live.length; } };
}
