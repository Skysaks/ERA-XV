import { describe, expect, it } from 'vitest';
import { cleanDisplayName } from '../src/engine/challenge';
import { parsePresence } from '../src/ui/room/transport';

describe('untrusted names', () => {
  it('keeps ordinary names, accents included', () => {
    expect(cleanDisplayName('Florian')).toBe('Florian');
    expect(cleanDisplayName('Élodie O’Brien-Saint')).toBe('Élodie O’Brien-Saint');
  });

  it('drops control, zero-width and bidi-override characters', () => {
    expect(cleanDisplayName('Bad‮emaN')).toBe('BademaN');
    expect(cleanDisplayName('zero​width\u0000')).toBe('zerowidth');
    expect(cleanDisplayName('⁦Isolate⁩')).toBe('Isolate');
  });

  it('caps the length at 24 characters', () => {
    expect(cleanDisplayName('x'.repeat(200))).toHaveLength(24);
  });

  it('applies to live-room presence names', () => {
    const p = parsePresence({ app: 'eraxv', v: 1, room: 'dabcd', name: `Spoof‮${'y'.repeat(80)}`, phase: 'lobby' });
    expect(p?.name).toBe(`Spoof${'y'.repeat(19)}`);
  });

  it('rejects presence from another app or version', () => {
    expect(parsePresence({ app: 'other', v: 1 })).toBeNull();
    expect(parsePresence({ app: 'eraxv', v: 2 })).toBeNull();
  });
});
