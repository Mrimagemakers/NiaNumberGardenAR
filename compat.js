// Small fixes so the book also runs on older iPads (iPadOS 15 and 16)
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', { configurable: true, writable: true, value: function (n) { n = Math.trunc(n) || 0; if (n < 0) n += this.length; return n < 0 || n >= this.length ? undefined : this[n]; } });
}
if (!String.prototype.at) {
  Object.defineProperty(String.prototype, 'at', { configurable: true, writable: true, value: function (n) { n = Math.trunc(n) || 0; if (n < 0) n += this.length; return n < 0 || n >= this.length ? undefined : this[n]; } });
}
// Canvas roundRect arrived in Safari 16; every label and button in the book uses it
const C2D = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
if (C2D && !C2D.roundRect) {
  C2D.roundRect = function (x, y, w, h, r = 0) {
    const rr = Array.isArray(r) ? (r[0] ?? 0) : r; const k = Math.max(0, Math.min(typeof rr === 'number' ? rr : (rr.x || 0), Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + k, y); this.arcTo(x + w, y, x + w, y + h, k); this.arcTo(x + w, y + h, x, y + h, k); this.arcTo(x, y + h, x, y, k); this.arcTo(x, y, x + w, y, k); this.closePath(); return this;
  };
}
if (window.OffscreenCanvasRenderingContext2D && !OffscreenCanvasRenderingContext2D.prototype.roundRect && C2D) {
  OffscreenCanvasRenderingContext2D.prototype.roundRect = C2D.roundRect;
}
// iPad Safari says it is a Mac; touch points give it away
export const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
