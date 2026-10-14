/**
 * Sharing without depending on the clipboard alone:
 * 1. Web Share API when the browser offers it (phones), with the image when files can be shared;
 * 2. otherwise copy "text + link" to the clipboard;
 * 3. otherwise the caller keeps the link visible and selectable (never a dead end).
 * Saving the card: the artifact's downloads capability (viewer confirms), or a plain download link outside it.
 */
import { copyText } from './components/ui';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'manual';

export async function shareLink(o: { title: string; text: string; url: string; file?: File | null }): Promise<ShareOutcome> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav && typeof nav.share === 'function') {
    const data: ShareData = { title: o.title, text: o.text, url: o.url };
    try {
      if (o.file && typeof nav.canShare === 'function' && nav.canShare({ files: [o.file] })) data.files = [o.file];
    } catch { /* canShare may throw on some browsers */ }
    try {
      await nav.share(data);
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // NotAllowedError (framed page, no user gesture) and friends: fall back to the clipboard
    }
  }
  return (await copyText(`${o.text} ${o.url}`)) ? 'copied' : 'manual';
}

type Downloads = { save: (r: { filename: string; data: Blob | string }) => Promise<{ status: string }> };
type ClaudeHost = { use: (name: string) => Promise<unknown> };
let downloads: Promise<Downloads | null> | null = null;
const inArtifact = () => { try { return typeof (window as unknown as { claude?: ClaudeHost }).claude?.use === 'function'; } catch { return false; } };

function downloadsNs(): Promise<Downloads | null> {
  if (!downloads) {
    downloads = inArtifact()
      ? (window as unknown as { claude: ClaudeHost }).claude.use('downloads').then((x) => (x as Downloads) ?? null).catch(() => null)
      : Promise.resolve(null);
  }
  return downloads;
}

/** Whether "Save image" can work here: the downloads capability in the artifact, a download link elsewhere. */
export async function canSaveImage(): Promise<boolean> {
  if (!inArtifact()) return true;
  return (await downloadsNs()) !== null;
}

export async function saveImage(blob: Blob, filename: string): Promise<'saved' | 'declined' | 'unavailable'> {
  if (inArtifact()) {
    const ns = await downloadsNs();
    if (!ns) return 'unavailable';
    try { await ns.save({ filename, data: blob }); return 'saved'; } catch (e) {
      const code = (e as { code?: string })?.code;
      return code === 'declined' || code === 'rate_limited' ? 'declined' : 'unavailable';
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'saved';
  } catch { return 'unavailable'; }
}
