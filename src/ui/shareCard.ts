import type { Lineup } from '../engine/index';
import { P } from './game';

/** Share cards: a 9:16 story (Stories, WhatsApp, iMessage status) and a 4:5 post. Same palette as the app, text only. */
const C = { ink: '#07110e', ink2: '#101915', line: '#24322b', chalk: '#f1ebdd', ash: '#bdb8a8', ash2: '#8e948b', brass: '#c8a45d', win: '#9fd36b', loss: '#e86961' };

export type CardFormat = 'story' | 'post';
export interface CardData {
  format?: CardFormat;
  /** the finish: "3rd · Play-offs" / "Champions of the ERA League" */
  headline: string;
  /** big figure: ordinal position (story), e.g. "3rd"; empty for gauntlet */
  big?: string;
  /** whose XV / who beat whom */
  kicker: string;
  gold: boolean;
  /** "71 pts · 17W 1D 8L · Diff +121 · 9 bonus" */
  stats: string;
  /** "Rugby champagne · FIT 87" */
  sub: string;
  lineup: Lineup;
  hideRatings: boolean;
  sheetTitle: string;
  /** "Can you beat my XV?" */
  tagline: string;
  /** "Same 15 draws · link in the message" */
  footer: string;
  mode: string;
}

const disp = (w: number, px: number) => `${w} ${px}px "Archivo", "Arial Narrow", sans-serif`;
const mono = (w: number, px: number) => `${w} ${px}px "IBM Plex Mono", ui-monospace, monospace`;
const ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 11, 14, 15];

export interface RenderedCard { url: string; blob: Blob | null }

export async function renderCard(d: CardData): Promise<RenderedCard> {
  const story = d.format === 'story';
  const W = 1080, H = story ? 1920 : 1350;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  try { await Promise.all([document.fonts.load('800 80px "Archivo"'), document.fonts.load('500 30px "IBM Plex Mono"')]); } catch { /* fallback fonts */ }
  const stretch = (v: string) => { try { (g as unknown as { fontStretch: string }).fontStretch = v; } catch { /* older canvas */ } };
  g.fillStyle = C.ink; g.fillRect(0, 0, W, H);
  // touchlines and the 22
  g.strokeStyle = 'rgba(241,235,221,0.06)'; g.lineWidth = 2;
  for (const y of story ? [420, 700, 980] : [300, 560, 820]) { g.setLineDash(y === (story ? 700 : 560) ? [] : [10, 12]); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.setLineDash([]);
  // posts
  g.strokeStyle = 'rgba(200,164,93,0.55)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(W - 150, 50); g.lineTo(W - 150, 200); g.moveTo(W - 90, 50); g.lineTo(W - 90, 200); g.moveTo(W - 150, 138); g.lineTo(W - 90, 138); g.stroke();

  // brand
  stretch('condensed');
  g.textBaseline = 'alphabetic';
  g.font = disp(800, 96); g.fillStyle = C.chalk; g.fillText('ERA', 72, 150);
  const wEra = g.measureText('ERA ').width;
  g.fillStyle = C.brass; g.fillText('XV', 72 + wEra, 150);
  stretch('normal'); g.font = mono(500, 26); g.fillStyle = C.ash; g.fillText(d.mode.toUpperCase(), 76, 198);

  // hero
  stretch('condensed');
  let y = story ? 330 : 280;
  g.font = disp(700, 42); g.fillStyle = C.ash; g.fillText(clip(g, d.kicker.toUpperCase(), W - 144), 72, y);
  if (story && d.big) {
    g.font = disp(900, 300); g.fillStyle = d.gold ? C.brass : C.chalk; g.fillText(d.big, 60, y + 290);
    y += 290;
    g.font = disp(900, 84); g.fillStyle = d.gold ? C.brass : C.chalk;
    y = wrap(g, d.headline.toUpperCase(), 72, y + 110, W - 144, 84);
  } else {
    g.font = disp(900, story ? 120 : 104); g.fillStyle = d.gold ? C.brass : C.chalk;
    y = wrap(g, d.headline.toUpperCase(), 72, y + 110, W - 144, story ? 116 : 100);
  }
  stretch('normal');
  g.font = mono(500, 32); g.fillStyle = C.chalk; y += 72; g.fillText(clip(g, d.stats, W - 144), 74, y);
  g.font = mono(500, 28); g.fillStyle = C.ash2; y += 48; g.fillText(clip(g, d.sub, W - 144), 74, y);

  // team sheet
  const footerH = story ? 230 : 150;
  const top = Math.max(y + 56, story ? 1000 : 640);
  const boxH = H - top - footerH;
  g.fillStyle = C.ink2; roundRect(g, 60, top, W - 120, boxH, 16); g.fill();
  g.strokeStyle = C.line; g.lineWidth = 2; roundRect(g, 60, top, W - 120, boxH, 16); g.stroke();
  g.font = mono(600, 22); g.fillStyle = C.brass; g.fillText(d.sheetTitle.toUpperCase(), 90, top + 46);
  const cols = story ? 2 : 2;
  const perCol = Math.ceil(ORDER.length / cols);
  const colW = (W - 180) / cols;
  const rowH = Math.min(story ? 96 : 52, (boxH - 86) / perCol);
  ORDER.forEach((n, i) => {
    const ci = Math.floor(i / perCol), ri = i % perCol;
    const x = 90 + ci * colW, yy = top + 96 + ri * rowH;
    const k = d.lineup[n];
    g.fillStyle = C.chalk; roundRect(g, x, yy - 31, 44, 40, 6); g.fill();
    stretch('condensed');
    g.font = disp(800, 28); g.fillStyle = C.ink; g.textAlign = 'center'; g.fillText(String(n), x + 22, yy - 2); g.textAlign = 'left';
    if (k) {
      const p = P(k);
      g.font = disp(700, story ? 34 : 32); g.fillStyle = C.chalk;
      const nameW = colW - (d.hideRatings ? 80 : 130);
      g.fillText(clip(g, p.short.toUpperCase(), nameW), x + 60, yy);
      if (!d.hideRatings) { stretch('normal'); g.font = mono(500, 24); g.fillStyle = C.ash2; g.textAlign = 'right'; g.fillText(String(p.rating), x + colW - 24, yy - 2); g.textAlign = 'left'; }
    }
    stretch('normal');
  });

  // call to action
  stretch('condensed');
  g.font = disp(900, story ? 76 : 54); g.fillStyle = C.brass;
  wrap(g, d.tagline.toUpperCase(), 72, H - footerH + (story ? 100 : 72), W - 144, story ? 76 : 54);
  stretch('normal');
  g.font = mono(500, 24); g.fillStyle = C.ash2; g.fillText(clip(g, d.footer, W - 144), 74, H - (story ? 50 : 34));

  const url = cv.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch { res(null); } });
  return { url, blob };
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function clip(g: CanvasRenderingContext2D, s: string, w: number): string {
  if (g.measureText(s).width <= w) return s;
  let t = s;
  while (t.length > 2 && g.measureText(t + '…').width > w) t = t.slice(0, -1);
  return t + '…';
}
/** returns the baseline of the last line */
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, lh: number): number {
  const words = text.split(/\s+/);
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > w && line) { g.fillText(line, x, y); y += lh; line = word; } else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y;
}
