// 網頁遊戲／互動頁用 pixelfx：一張像素畫布蓋在容器上，即時播（requestAnimationFrame）。
//
//   import { pfxOverlay } from "./pfx_canvas.js";
//   const pfx = await pfxOverlay(document.getElementById("game"), { scale: 3, core: "./pixelfx/core/index.js", fx: "./pixelfx/fx" });
//   pfx.burst("ui/coin-collect", x, y);                      // x,y＝容器 CSS 座標（自動換算像素格）
//   pfx.burstAt("pickups/collect-burst", someElement, { dy: 40 });
//
// 容器要 position: relative；畫布 pointer-events: none、z-index 50。容器本身被 CSS transform 縮放也能算對位置
// （座標以容器的 offsetWidth 為準）。遊戲要把 src/core 與用到的 src/fx 複製進專案（MIT，附 LICENSE）。
// ⚠ 會切畫面的動作（答錯→換頁）要在切換「之前」量元素位置，切完元素隱藏會量到 0（oceanquiz 11-01 坑）。

export async function pfxOverlay(container, { scale = 3, core = "./pixelfx/core/index.js", fx = "./pixelfx/fx", z = 50 } = {}) {
  const { createFrame, clearFrame, createFx } = await import(core);
  const CW = container.offsetWidth, CH = container.offsetHeight;
  const W = Math.ceil(CW / scale), H = Math.ceil(CH / scale);
  const mk = (blend) => {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    Object.assign(c.style, { position: "absolute", left: "0", top: "0", width: `${W * scale}px`, height: `${H * scale}px`,
      imageRendering: "pixelated", pointerEvents: "none", zIndex: String(z), mixBlendMode: blend });
    container.appendChild(c);
    return c.getContext("2d");
  };
  const colorCtx = mk("normal"), lightCtx = mk("plus-lighter");
  const frame = createFrame(W, H), colorImg = new ImageData(W, H), lightImg = new ImageData(W, H);
  const live = [], mods = {};

  async function burst(id, x, y, opts = {}) {
    mods[id] ??= await import(`${fx}/${id}.js`);
    const inst = createFx(mods[id], { x: x / scale, y: y / scale, ...opts });
    live.push(inst);
    return inst;   // 循環效果要自己 inst.stop()
  }
  /** 元素中心（加 dx, dy）→ 容器座標 */
  function centerOf(el, dx = 0, dy = 0) {
    const v = container.getBoundingClientRect(), r = el.getBoundingClientRect(), k = CW / v.width;
    return [(r.left + r.width / 2 - v.left) * k + dx, (r.top + r.height / 2 - v.top) * k + dy];
  }
  const burstAt = (id, el, { dx = 0, dy = 0, ...opts } = {}) => { const [x, y] = centerOf(el, dx, dy); return burst(id, x, y, opts); };

  let last = performance.now(), idle = false;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // 沒有效果在播：清一次畫布後就不再逐格合成（手機省電）
    if (!live.length) {
      if (!idle) { colorCtx.clearRect(0, 0, W, H); lightCtx.clearRect(0, 0, W, H); idle = true; }
      requestAnimationFrame(tick);
      return;
    }
    idle = false;
    clearFrame(frame);
    for (let i = live.length - 1; i >= 0; i--) {
      const f = live[i];
      f.update(dt);
      if (f.done()) { live.splice(i, 1); continue; }
      f.draw(frame, "back");
      f.draw(frame, "front");
    }
    const C = frame.color, L = frame.light, cd = colorImg.data, ld = lightImg.data;
    for (let i = 0; i < W * H; i++) {
      const c = C[i], l = L[i], j = i * 4;
      cd[j] = c & 255; cd[j + 1] = (c >>> 8) & 255; cd[j + 2] = (c >>> 16) & 255; cd[j + 3] = c >>> 24;
      ld[j] = l & 255; ld[j + 1] = (l >>> 8) & 255; ld[j + 2] = (l >>> 16) & 255; ld[j + 3] = l & 0xffffff ? 255 : 0;
    }
    colorCtx.putImageData(colorImg, 0, 0);
    lightCtx.putImageData(lightImg, 0, 0);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return { burst, burstAt, centerOf, get count() { return live.length; } };
}
