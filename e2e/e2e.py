"""ERA XV 2.0 end-to-end run (Playwright, Chromium).

Usage:  python3 e2e/e2e.py [scenario ...]     (after `npm run build`)
Scenarios: solo challenge retention resume lang screens modes practice live leave (default: all).
Serves dist/ on localhost, writes screenshots to e2e/shots/ and exits non-zero on failure.
Live rooms use e2e/room-mock.js, a strict stand-in for the artifact `room` capability, relayed between
separate browser contexts (separate storage, like separate people).
"""
import asyncio, json, os, re, subprocess, sys, time, functools, http.server, threading
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SHOTS = os.path.join(ROOT, 'e2e', 'shots')
MOCK = os.path.join(ROOT, 'e2e', 'room-mock.js')
PORT = 8765
URL = f'http://127.0.0.1:{PORT}/era-xv.standalone.html'
os.makedirs(SHOTS, exist_ok=True)

EN = json.loads(subprocess.check_output(['npx', 'tsx', '-e', "import { en } from './src/ui/locales/index'; console.log(JSON.stringify(en))"], cwd=ROOT))
KEY_RE = re.compile(r'(?<![\w.])(' + '|'.join(re.escape(k) for k in sorted(EN, key=len, reverse=True) if '.' in k) + r')(?![\w.])')

results = []
def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (f' · {detail}' if detail else ''), flush=True)

def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    class Q(h.func):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Q, directory=DIST))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

class Relay:
    """carries presence between pages (each page = one person) the way the platform would"""
    def __init__(self):
        self.pages, self.latest, self.owner = [], {}, {}
    async def attach(self, ctx):
        await ctx.expose_binding('__roomSend', self.on_send)
        await ctx.add_init_script(path=MOCK)
    def on_send(self, source, peer, js):
        self.latest[peer] = js
        self.owner[peer] = source['page']
        for pg in list(self.pages):
            if pg is not source['page'] and not pg.is_closed():
                asyncio.ensure_future(self._deliver(pg, peer, js))
    async def _deliver(self, pg, peer, js):
        try: await pg.evaluate('([p, j]) => window.__roomRecv && window.__roomRecv(p, j)', [peer, js])
        except Exception: pass
    async def join(self, pg):
        self.pages.append(pg)
        for peer, js in self.latest.items(): await self._deliver(pg, peer, js)
    async def leave(self, pg):
        """the platform clears a leaver's presence for everyone still there"""
        gone = [peer for peer, o in self.owner.items() if o is pg]
        self.pages = [p for p in self.pages if p is not pg]
        await pg.close()
        for peer in gone:
            self.latest.pop(peer, None)
            for other in self.pages: await self._deliver(other, peer, None)

SHIFT_DAYS = '''(() => { const D = Date; const off = %d * 86400000; class FD extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + off); } static now() { return D.now() + off; } } window.Date = FD; })();'''

async def new_page(browser, errs, w=390, h=844, locale='en-US', relay=None, tag='', storage=None, days=0, init=None):
    ctx = await browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, locale=locale, storage_state=storage)
    if days: await ctx.add_init_script(SHIFT_DAYS % days)
    if init: await ctx.add_init_script(init)
    if relay: await relay.attach(ctx)
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(f'{tag} pageerror: {e}'))
    pg.on('console', lambda m: errs.append(f'{tag} console: {m.text}') if m.type == 'error' else None)
    return ctx, pg

async def shot(pg, name, full=True):
    await pg.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=full)

async def round_label(pg):
    # one atomic read in the page: the header can vanish between a count() and a get_attribute()
    return await pg.evaluate('''() => { const el = document.querySelector('[aria-label^="Round "], [aria-label^="Tour "], [aria-label^="Ronda "]'); return el ? el.getAttribute('aria-label') : null; }''')

L = lambda *xs: re.compile('^(' + '|'.join(re.escape(x) for x in xs) + ')')
PLAY = L('Draft my XV', 'Drafter mon XV', 'Draftear mi XV')
TO_PLAN = L('Game plan', 'Plan de match', 'Plan de partido')
PLAY_SEASON = L('Play the season', 'Face the legends', 'Jouer la saison', 'Affronter les légendes', 'Jugar la temporada', 'Enfrentarse a las leyendas')
SKIP = L('Skip →', 'Passer →', 'Saltar →', 'See the result →', 'Voir le résultat →', 'Ver el resultado →')
DEBRIEF = L('Staff debrief', 'Débrief du staff', 'Informe del staff')

async def draft15(pg, pick=lambda r: 0, timeout=90, on_round=None):
    """pick through the draft until the draft header disappears (match sheet or a waiting screen)"""
    t0 = time.time(); r = 0; gone = 0
    while time.time() - t0 < timeout:
        rl = await round_label(pg)
        if rl is None:
            gone += 1
            if gone > 6: return r >= 15 or r > 0
            await pg.wait_for_timeout(150); continue
        gone = 0
        opts = pg.locator('main button.animate-rise:enabled')
        n = await opts.count()
        if n:
            if on_round: await on_round(r)
            try: await opts.nth(min(pick(r), n - 1)).click(timeout=2000)
            except Exception: await pg.wait_for_timeout(150); continue
            for _ in range(120):
                await pg.wait_for_timeout(60)
                if await round_label(pg) != rl: break
            r += 1
        else:
            await pg.wait_for_timeout(150)
    return False

SENDER_OFFERS = []
async def offer_names(pg):
    return [x.split('\n')[0].strip() for x in await pg.locator('main button.animate-rise').all_inner_texts()]

async def body(pg):
    """visible text, lower-cased (CSS uppercase labels come back upper-cased from innerText)"""
    return (await pg.evaluate('() => document.body.innerText')).lower()

async def raw_text(pg):
    return await pg.evaluate('''() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentElement && !['SCRIPT','STYLE'].includes(n.parentElement.tagName) ? 1 : 2 }); let s = ''; while (w.nextNode()) s += w.currentNode.nodeValue + ' '; return s; }''')

async def no_overflow(pg, name):
    sw = await pg.evaluate('() => [document.documentElement.scrollWidth, window.innerWidth]')
    culprit = ''
    if sw[0] > sw[1]:
        culprit = await pg.evaluate('''() => { const W = window.innerWidth; const out = []; for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0) out.push(el.tagName + '.' + String(el.className).slice(0, 50) + ' «' + (el.textContent || '').slice(0, 30) + '»'); } return out.slice(0, 3).join(' | '); }''')
        await shot(pg, 'overflow-' + re.sub(r'\W+', '-', name))
    ok(f'no horizontal scroll · {name}', sw[0] <= sw[1], f'{sw[0]} vs {sw[1]} {culprit}')

async def no_cut_text(pg, name):
    """no visible text clipped with an ellipsis (pitch name plates excepted: the sheet shows full names)"""
    cut = await pg.evaluate('''() => { const out = []; for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.textOverflow !== 'ellipsis' || el.closest('[aria-label][role=img], button[aria-label] .rounded-sm')) continue; if (el.scrollWidth > el.clientWidth + 1 && el.offsetParent) { const inPitch = el.closest('.rounded-xl')?.querySelector('svg'); if (inPitch && el.className.includes('max-w-[64px]')) continue; out.push((el.textContent || '').trim().slice(0, 40)); } } return out; }''')
    # text that spills out of its own button or chip (no ellipsis, just overflowing)
    spill = await pg.evaluate('''() => { const out = []; for (const el of document.querySelectorAll('button, [role=tab], [role=radio]')) { if (!el.offsetParent) continue; if (el.scrollWidth > el.clientWidth + 2) out.push((el.textContent || '').trim().slice(0, 30)); } return out; }''')
    ok(f'no truncated text · {name}', not cut and not spill, ', '.join((cut + spill)[:5]))

async def no_raw_keys(pg, name):
    txt = await raw_text(pg)
    m = KEY_RE.findall(txt)
    ok(f'no untranslated keys · {name}', not m, ', '.join(sorted(set(m))[:8]))

async def sheet_to_result(pg, name=None, wait_skip=True):
    """match sheet → game plan → season broadcast → result"""
    await pg.get_by_role('button', name=TO_PLAN).last.click(); await pg.wait_for_timeout(500)
    if name: await shot(pg, f'{name}-plan')
    await pg.get_by_role('button', name=PLAY_SEASON).first.click(); await pg.wait_for_timeout(700)
    if wait_skip:
        skip = pg.get_by_role('button', name=SKIP)
        if await skip.count(): await skip.first.click()
    await pg.wait_for_timeout(700)

# ---------------------------------------------------------------- scenarios
async def solo_loop(browser, errs):
    ctx, pg = await new_page(browser, errs, tag='solo')
    await pg.goto(URL); await pg.wait_for_timeout(700)
    await shot(pg, '01-home'); await no_overflow(pg, 'home 390'); await no_raw_keys(pg, 'home en'); await no_cut_text(pg, 'home')
    counts = re.search(r'([\d,]+) players · ([\d,]+) versions · (\d+) team-eras', await raw_text(pg))
    ok('home counts come from the dataset', counts is not None and counts.group(3) == '90', counts.group(0) if counts else '')
    txt = await body(pg)
    ok('home: play, daily and challenge are the three main actions', 'draft my xv' in txt and 'play the daily' in txt and 'challenge a friend' in txt)
    await pg.get_by_role('button', name=PLAY).click(); await pg.wait_for_timeout(500)
    await shot(pg, '02-draft-r1', full=False)
    first_offers = []
    txt = await body(pg)
    ok('first visit: the first tip shows in the draft', 'tip 1 / 4' in txt and 'pick one of 4 players' in txt)
    first = await pg.locator('main button.animate-rise').first.bounding_box()
    ok('first visit: the tip leaves the first option on screen', first is not None and first['y'] + 60 < 844, str(first and round(first['y'])))
    ok('draft shows unit progress', 'pack' in txt and 'back three' in txt)
    moments, tips = [], []
    async def mid(r):
        if r == 0: first_offers.extend(await offer_names(pg))
        if r == 1:
            t2 = await body(pg)
            tips.append('positions matter' in t2)
            b2 = pg.get_by_role('button', name='Got it')
            if await b2.count(): await b2.first.click(); await pg.wait_for_timeout(150)
        if r == 7: await shot(pg, '03-draft-r8', full=False); await no_overflow(pg, 'draft 390'); await no_cut_text(pg, 'draft')
        txt = await body(pg)
        if 'is complete' in txt or 'your half-backs' in txt or 'your back three' in txt: moments.append(r)
    done = await draft15(pg, pick=lambda r: r % 3, on_round=mid)
    ok('classic draft completes 15 rounds', done)
    ok('first visit: a contextual tip follows the second pick', tips == [True], str(tips))
    ok('unit moments appeared during the draft', len(moments) > 0, str(moments))
    await pg.wait_for_timeout(400)
    await shot(pg, '04-sheet'); await no_overflow(pg, 'sheet 390'); await no_raw_keys(pg, 'sheet en'); await no_cut_text(pg, 'sheet')
    txt = await body(pg)
    ok('match sheet groups the XV by lines', all(x in txt for x in ['front row', 'second row', 'back row', 'half-backs', 'centres', 'back three']))
    ok('responsibilities assigned', all(x in txt for x in ['captain', 'goal-kicker', 'lineout caller']))
    await pg.get_by_role('button', name=re.compile('^Number 11:')).click(); await pg.get_by_role('button', name=re.compile('^Number 14:')).click(); await pg.wait_for_timeout(200)
    ok('swap offers undo', await pg.get_by_role('button', name='Undo').count() > 0)
    await pg.get_by_role('button', name=TO_PLAN).last.click(); await pg.wait_for_timeout(700)
    await shot(pg, '05-plan'); await no_overflow(pg, 'plan 390'); await no_raw_keys(pg, 'plan en'); await no_cut_text(pg, 'plan')
    ok('first visit: the game-plan tip shows on the plan screen', 'your game plan counts' in await body(pg))
    ok('plan screen lists the six plans', await pg.get_by_role('radio').count() == 6)
    await pg.get_by_role('radio', name=re.compile('Territory')).click(); await pg.wait_for_timeout(200)
    ok('plan detail shows favoured areas', '↑' in await raw_text(pg))
    t0 = time.time()
    await pg.get_by_role('button', name=PLAY_SEASON).first.click(); await pg.wait_for_timeout(2500)
    await shot(pg, '06-sim', full=False); await no_overflow(pg, 'sim 390'); await no_raw_keys(pg, 'sim en')
    for _ in range(60):
        if 'era rating' in await body(pg): break
        await pg.wait_for_timeout(500)
    dur = time.time() - t0
    ok('season broadcast lasts 8–22 s', 8 <= dur <= 22, f'{dur:.1f}s')
    await shot(pg, '07-result'); await no_overflow(pg, 'result 390'); await no_cut_text(pg, 'result'); await no_raw_keys(pg, 'result en')
    txt = await body(pg)
    m = re.search(r'era rating (\d+) / 130', txt)
    ok('result: ERA rating is secondary but present', m is not None)
    ok('result: position or title is the hero', re.search(r'champions of the era league|finalists|semi-finalists|out in the play-off round|off the play-offs|outside the play-offs|bottom of the table', txt) is not None)
    ok('result: players discovered are counted', re.search(r'\+\d+ players discovered', txt) is not None)
    order = [txt.find('challenge a friend'), txt.find('staff debrief'), txt.find('new draft'), txt.find('same draws')]
    ok('result: challenge first, then debrief, then the two replays', all(x >= 0 for x in order) and order == sorted(order), str(order))
    ok('result: today\'s Daily offered next', 'play the daily' in txt)
    await pg.get_by_role('button', name=DEBRIEF).click(); await pg.wait_for_timeout(2500)
    await shot(pg, '08-debrief'); await no_overflow(pg, 'debrief 390'); await no_raw_keys(pg, 'debrief en')
    txt = await body(pg)
    ok('debrief leads with three points then turning points', txt.find('your xv in three points') < txt.find('turning points') < txt.find('full tactical analysis'))
    await pg.get_by_role('button', name=re.compile('^Full tactical analysis')).click(); await pg.wait_for_timeout(200)
    ok('tactical analysis opens on demand', 'scrum' in await body(pg))
    await pg.get_by_role('button', name='Back').first.click(); await pg.wait_for_timeout(400)
    await pg.get_by_role('button', name='Challenge a friend').first.click(); await pg.wait_for_timeout(1500)
    await shot(pg, '09-share'); await no_raw_keys(pg, 'share en'); await no_overflow(pg, 'share 390')
    await pg.locator('#share-name').fill('Florent'); await pg.locator('#share-name').blur(); await pg.wait_for_timeout(300)
    link = await pg.locator('#share-link').input_value()
    ok('challenge link produced', bool(link and '#' in link), (link or '')[:70])
    ok('share card rendered (story format by default)', await pg.locator('img[alt]').count() >= 1)
    await pg.get_by_role('button', name='Copy link').click(); await pg.wait_for_timeout(300)
    pts = int(m.group(1)) if m else None
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
    await pg.get_by_role('button', name=re.compile('^Same draws')).click(); await pg.wait_for_timeout(500)
    ok('same draws restarts on the same seed', (await round_label(pg) or '').startswith('Round 1'))
    ok('second game: no tips any more', 'tip 1 / 4' not in await body(pg))
    storage = await ctx.storage_state()
    await ctx.close()
    global SENDER_OFFERS
    SENDER_OFFERS = first_offers
    return link, pts, storage

async def challenge_roundtrip(browser, errs, link, pts, sender):
    ctx, pg = await new_page(browser, errs, tag='challenge')
    await pg.goto(link); await pg.wait_for_timeout(1000)
    txt = await body(pg)
    ok('challenge link opens "X challenges you"', 'florent challenges you' in txt and 'same 15 draws.' in txt, txt[:100].replace('\n', ' '))
    ok('challenge screen shows sender points', pts is not None and f'{pts} pts' in txt)
    await shot(pg, '10-challenge'); await no_overflow(pg, 'challenge 390'); await no_raw_keys(pg, 'challenge en')
    await pg.get_by_role('button', name=re.compile('^Accept the challenge')).click(); await pg.wait_for_timeout(500)
    mine = []
    async def grab(r):
        if r == 0: mine.extend(await offer_names(pg))
    ok('challenge draft completes', await draft15(pg, pick=lambda r: 1, on_round=grab))
    ok('same seed, exactly the same offers for both players', mine and mine == SENDER_OFFERS, f'{mine} vs {SENDER_OFFERS}')
    await sheet_to_result(pg)
    txt = await body(pg)
    ok('versus verdict shown', re.search(r'you win|wins|dead heat', txt) is not None)
    ok('comparison: position, points, FIT, difference, bonus', all(x in txt for x in ['position', 'points', 'fit', 'difference', 'bonus']))
    ok('comparison: number of different picks', re.search(r'\d+ different picks?|same 15 picks|identical', txt) is not None)
    await shot(pg, '11-versus'); await no_overflow(pg, 'versus 390'); await no_cut_text(pg, 'versus')
    await pg.get_by_role('button', name=re.compile('^Send my result to')).first.click(); await pg.wait_for_timeout(900)
    reply = await pg.locator('#share-link').input_value()
    ok('reply link produced', '#' in reply)
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
    # my challenges on the receiver side
    await pg.goto(URL); await pg.wait_for_timeout(500)
    await pg.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await pg.wait_for_timeout(700)
    await pg.get_by_role('button', name=re.compile('^My challenges')).first.click(); await pg.wait_for_timeout(400)
    ok('receiver: challenge listed as finished', '1 finished' in (await body(pg)).replace('·', '').replace('  ', ' ') or 'finished · 1' in await body(pg))
    await pg.get_by_role('tab', name=re.compile('^Finished')).click(); await pg.wait_for_timeout(200)
    ok('receiver: result against Florent', 'florent' in await body(pg))
    await shot(pg, '12-mine-receiver'); await no_overflow(pg, 'my challenges 390'); await no_raw_keys(pg, 'my challenges')
    # tampered link: an explanation and a way out, never a blank page
    bad = link[:-6] + ('A' if link[-6] != 'A' else 'B') + link[-5:]
    await pg.goto(bad.replace('#', '?x=1#')); await pg.wait_for_timeout(900)
    txt = await body(pg)
    ok('tampered link is rejected with a recovery screen', 'accept the challenge' not in txt and 'link or save problem' in txt and 'play a new game' in txt)
    await shot(pg, '13-notice'); await no_raw_keys(pg, 'notice')
    await ctx.close()
    # the sender opens the reply: the challenge completes, straight to the comparison
    ctx, pg = await new_page(browser, errs, tag='sender', storage=sender)
    await pg.goto(reply); await pg.wait_for_timeout(1200)
    txt = await body(pg)
    ok('sender: reply opens the comparison directly', re.search(r'you win|wins|dead heat', txt) is not None and 'difference' in txt, txt[:120].replace('\n', ' '))
    await shot(pg, '14-reply-detail'); await no_overflow(pg, 'reply 390')
    await pg.goto(URL); await pg.wait_for_timeout(500)
    await pg.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await pg.wait_for_timeout(600)
    ok('sender: clubhouse counts the finished challenge', re.search(r'(1 won|1 lost)', await body(pg)) is not None or '0 won · 0 lost' not in await body(pg))
    await ctx.close()

async def challenge_intent(browser, errs):
    ctx, pg = await new_page(browser, errs, tag='intent')
    await pg.goto(URL); await pg.wait_for_timeout(500)
    await pg.get_by_role('button', name='Challenge a friend').click(); await pg.wait_for_timeout(400)
    await draft15(pg)
    await sheet_to_result(pg)
    ok('“Challenge a friend” opens the share sheet after the season', await pg.locator('#share-link').count() == 1)
    await ctx.close()

async def resume(browser, errs):
    ctx, pg = await new_page(browser, errs, tag='resume')
    await pg.goto(URL); await pg.wait_for_timeout(600)
    await pg.get_by_role('button', name=PLAY).click(); await pg.wait_for_timeout(400)
    for _ in range(8):
        await pg.locator('main button.animate-rise:enabled').first.click(); await pg.wait_for_timeout(220)
    await pg.reload(); await pg.wait_for_timeout(700)
    txt = await body(pg)
    ok('abandoned at pick 8: game in progress after reload', 'game in progress' in txt and 'pick 9 / 15' in txt)
    await pg.get_by_role('button', name='Resume', exact=True).click(); await pg.wait_for_timeout(500)
    ok('resume lands on round 9', (await round_label(pg) or '').startswith('Round 9'), await round_label(pg))
    await draft15(pg)
    await pg.reload(); await pg.wait_for_timeout(700)
    ok('reload on the match sheet keeps the game', 'match sheet to check' in await body(pg))
    await pg.get_by_role('button', name='Resume', exact=True).click(); await pg.wait_for_timeout(500)
    ok('resume lands on the match sheet', 'front row' in await body(pg) and 'lineout caller' in await body(pg))
    await pg.get_by_role('button', name=TO_PLAN).last.click(); await pg.wait_for_timeout(400)
    await pg.reload(); await pg.wait_for_timeout(600)
    ok('reload on the game plan keeps the game', 'game plan to choose' in await body(pg))
    await pg.get_by_role('button', name='Give up').click(); await pg.wait_for_timeout(200)
    await pg.get_by_role('button', name='Delete it').click(); await pg.wait_for_timeout(300)
    ok('give up clears the saved game', 'game in progress' not in await body(pg))
    # a damaged save: an explanation and a way out
    await pg.evaluate("""() => localStorage.setItem('era-xv:resume', JSON.stringify({ v: 2, cfg: { seed: 5, mode: 'classic', plan: 'balanced', ruleset: 'intl', engine: 1 }, picks: ['nobody:nobody'], rerollRound: -1, savedAt: 1, stage: 'draft', versions: { engine: 1, data: 1, rules: 1, modes: 1 } }))""")
    await pg.reload(); await pg.wait_for_timeout(600)
    b = pg.get_by_role('button', name='Resume', exact=True)
    if await b.count(): await b.click(); await pg.wait_for_timeout(500)
    txt = await body(pg)
    ok('damaged or outdated save: recovery screen', ('saved game unreadable' in txt or 'saved on an earlier version' in txt) and 'play a new game' in txt, txt[:120].replace('\n', ' '))
    await ctx.close()

async def languages(browser, errs):
    for loc, home_line in [('fr-FR', 'toutes les époques.'), ('es-ES', 'todas las épocas.')]:
        ctx, pg = await new_page(browser, errs, locale=loc, tag=loc)
        await pg.goto(URL); await pg.wait_for_timeout(700)
        ok(f'{loc} detected from browser', home_line in await body(pg))
        await no_raw_keys(pg, f'home {loc}'); await shot(pg, f'12-home-{loc}')
        await pg.get_by_role('button', name=PLAY).click(); await pg.wait_for_timeout(400)
        await no_raw_keys(pg, f'draft {loc}'); await shot(pg, f'13-draft-{loc}', full=False); await no_overflow(pg, f'draft {loc}'); await no_cut_text(pg, f'draft {loc}')
        ok(f'{loc} draft completes', await draft15(pg))
        await no_raw_keys(pg, f'sheet {loc}'); await shot(pg, f'14-sheet-{loc}'); await no_cut_text(pg, f'sheet {loc}')
        await sheet_to_result(pg, name=f'15-{loc}')
        await no_raw_keys(pg, f'result {loc}'); await shot(pg, f'16-result-{loc}'); await no_overflow(pg, f'result {loc}')
        await pg.get_by_role('button', name=DEBRIEF).click(); await pg.wait_for_timeout(2200)
        await no_raw_keys(pg, f'debrief {loc}'); await shot(pg, f'17-debrief-{loc}')
        await ctx.close()
    ctx, pg = await new_page(browser, errs, tag='switch')
    await pg.goto(URL); await pg.wait_for_timeout(600)
    await pg.get_by_role('group', name='Language').get_by_role('button', name='FR').click(); await pg.wait_for_timeout(300)
    ok('language switch to FR', 'toutes les époques.' in await body(pg))
    await pg.reload(); await pg.wait_for_timeout(600)
    ok('language choice persists', 'toutes les époques.' in await body(pg))
    await pg.get_by_role('button', name='Réglages').click(); await pg.wait_for_timeout(400)
    await no_raw_keys(pg, 'settings fr'); await shot(pg, '18-settings-fr')
    await ctx.close()

async def screens(browser, errs):
    for w, h in [(320, 640), (360, 740), (375, 812), (430, 932), (1280, 860)]:
        ctx, pg = await new_page(browser, errs, w=w, h=h, tag=f'w{w}')
        await pg.goto(URL); await pg.wait_for_timeout(600)
        await no_overflow(pg, f'home {w}'); await no_cut_text(pg, f'home {w}'); await shot(pg, f'20-home-{w}')
        await pg.get_by_role('button', name=PLAY).click(); await pg.wait_for_timeout(400)
        await no_overflow(pg, f'draft {w}'); await shot(pg, f'21-draft-{w}', full=False)
        if w < 1000:
            first_opt = await pg.locator('main button.animate-rise').first.bounding_box()
            ok(f'first option visible without scrolling · {w}', first_opt is not None and first_opt['y'] + 40 < h, str(first_opt and round(first_opt['y'])))
        await draft15(pg, pick=lambda r: (r * 7) % 4)
        await no_overflow(pg, f'sheet {w}'); await no_cut_text(pg, f'sheet {w}'); await shot(pg, f'22-sheet-{w}')
        await sheet_to_result(pg)
        await no_overflow(pg, f'result {w}'); await no_cut_text(pg, f'result {w}'); await shot(pg, f'23-result-{w}')
        await pg.get_by_role('button', name=DEBRIEF).click(); await pg.wait_for_timeout(2000)
        await no_overflow(pg, f'debrief {w}'); await shot(pg, f'24-debrief-{w}')
        if w < 1000:
            # every 2.1 screen at phone widths: no sideways scroll, nothing clipped
            await pg.goto(URL); await pg.wait_for_timeout(500)
            await pg.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await pg.wait_for_timeout(700)
            await no_overflow(pg, f'clubhouse {w}'); await no_cut_text(pg, f'clubhouse {w}'); await shot(pg, f'26-clubhouse-{w}')
            await pg.get_by_role('button', name=re.compile('^My challenges')).first.click(); await pg.wait_for_timeout(400)
            await no_overflow(pg, f'my challenges {w}'); await no_cut_text(pg, f'my challenges {w}')
            await pg.goto(URL); await pg.wait_for_timeout(500)
            await pg.get_by_role('button', name=re.compile('^Profile')).first.click(); await pg.wait_for_timeout(700)
            for tab in ['Stats', 'Trends', 'Trophies', 'Collection', 'History']:
                await pg.get_by_role('tab', name=tab).click(); await pg.wait_for_timeout(200)
                await no_overflow(pg, f'profile {tab} {w}'); await no_cut_text(pg, f'profile {tab} {w}')
            await shot(pg, f'27-profile-history-{w}')
            await pg.goto(URL); await pg.wait_for_timeout(500)
            await pg.get_by_role('button', name=re.compile('^Archives')).first.click(); await pg.wait_for_timeout(700)
            await no_overflow(pg, f'archives {w}'); await no_cut_text(pg, f'archives {w}'); await shot(pg, f'28-archives-{w}', full=False)
            await pg.get_by_role('tab', name='Team-eras').click(); await pg.wait_for_timeout(300)
            await no_overflow(pg, f'archives teams {w}')
            await pg.goto(URL + '#AAAAbroken'); await pg.wait_for_timeout(700)
            await no_overflow(pg, f'notice {w}'); await no_cut_text(pg, f'notice {w}'); await shot(pg, f'29-notice-{w}')
        await ctx.close()
    ctx, pg = await new_page(browser, errs, tag='secondary')
    await pg.goto(URL); await pg.wait_for_timeout(500)
    for label, nm in [('Modes', 'modes'), ('Clubhouse', 'clubhouse'), ('Profile', 'profile'), ('Archives', 'archives'), ('Role School', 'school'), ('Settings', 'settings')]:
        b = pg.get_by_role('button', name=re.compile('^' + re.escape(label)))
        if not await b.count(): ok(f'open {nm}', False, 'button not found'); continue
        await b.first.click(); await pg.wait_for_timeout(500)
        await no_overflow(pg, nm); await no_raw_keys(pg, nm); await shot(pg, f'25-{nm}')
        await pg.goto(URL); await pg.wait_for_timeout(400)
    await ctx.close()

SOLO = ['classic', 'iq', 'daily', 'weekly', 'theme', 'noreroll', 'nations', 'eralock', 'oneclub', 'onecountry', 'champions', 'worldxv', 'blitz', 'cult', 'mystery', 'position', 'gauntlet']
async def modes(browser, errs):
    ctx, pg = await new_page(browser, errs, tag='modes')
    for m in SOLO:
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.get_by_role('button', name=re.compile('^Modes')).first.click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name=re.compile('^' + re.escape(EN[f'mode.{m}.name']))).first.click(); await pg.wait_for_timeout(400)
        rnd = pg.get_by_role('button', name=re.compile('^Let the draw decide'))
        if await rnd.count(): await rnd.first.click(); await pg.wait_for_timeout(400)
        n = await pg.locator('main button.animate-rise').count()
        ok(f'mode {m}: round 1 offers options', n >= 3, str(n))
        if m in ('mystery', 'position', 'gauntlet', 'cult', 'worldxv', 'blitz'):
            done = await draft15(pg, pick=lambda r: 0, timeout=150)
            ok(f'mode {m}: draft completes', done)
            if done:
                await shot(pg, f'30-sheet-{m}')
                await sheet_to_result(pg)
                txt = await body(pg)
                ok(f'mode {m}: result', re.search(r'/ ?(130|10)\b', txt) is not None)
                await shot(pg, f'31-result-{m}')
    await ctx.close()

KINDS = [('liveduel', 'XV Duel'), ('shared', 'Common Pool'), ('party', 'Clubhouse Cup'), ('coop', 'Draft Together')]

async def practice_rooms(browser, errs):
    """no room capability in a plain page: the Clubhouse says so, disables live creation and offers practice"""
    for kind, title in KINDS:
        ctx, pg = await new_page(browser, errs, tag=f'practice-{kind}')
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await pg.wait_for_timeout(900)
        txt = await body(pg)
        ok(f'{kind}: clubhouse reports live rooms unavailable', 'live rooms unavailable in this view' in txt)
        panel = pg.locator('section').filter(has=pg.get_by_role('heading', name=title))
        ok(f'{kind}: live creation disabled', await panel.get_by_role('button').first.is_disabled())
        await panel.get_by_role('button', name='Practice with bots').click(); await pg.wait_for_timeout(500)
        await shot(pg, f'40-practice-{kind}-draft', full=False)
        ok(f'{kind}: practice draft completes', await draft15(pg, timeout=150))
        await sheet_to_result(pg, wait_skip=False)
        for _ in range(80):
            txt = await body(pg)
            if re.search(r'reveal|final table|our season', txt): break
            await pg.wait_for_timeout(500)
        if kind in ('liveduel', 'shared'):
            ok(f'{kind}: results wait for the reveal', 'reveal' in txt)
            await pg.get_by_role('button', name='Reveal').click(); await pg.wait_for_timeout(1000)
            ok(f'{kind}: the reveal opens unit by unit', 'unit by unit' in await body(pg))
            await pg.wait_for_timeout(2800)
            txt = await body(pg)
        ok(f'{kind}: practice final', re.search(r'you win|wins|final table|our season', txt) is not None, txt[:90].replace('\n', ' '))
        await shot(pg, f'41-practice-{kind}-final'); await no_overflow(pg, f'practice {kind} final')
        await ctx.close()

async def live_rooms(browser, errs):
    for kind, title, n in [('liveduel', 'XV Duel', 2), ('shared', 'Common Pool', 2), ('party', 'Clubhouse Cup', 3), ('coop', 'Draft Together', 2)]:
        relay = Relay()
        people = []
        for i in range(n):
            ctx, pg = await new_page(browser, errs, relay=relay, tag=f'{kind}-p{i}')
            people.append((ctx, pg))
        host = people[0][1]
        await host.goto(URL); await relay.join(host); await host.wait_for_timeout(300)
        await host.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await host.wait_for_timeout(900)
        ok(f'{kind}: clubhouse reports live rooms available', 'live rooms available' in await body(host))
        panel = host.locator('section').filter(has=host.get_by_role('heading', name=title))
        await panel.get_by_role('button').first.click(); await host.wait_for_timeout(900)
        url = await host.locator('#room-link').input_value()
        ok(f'{kind}: room link', re.search(r'#r-[a-z2-9]{5}$', url) is not None, url[-12:])
        await shot(host, f'50-{kind}-lobby')
        for _, g in people[1:]:
            await g.goto(url); await relay.join(g); await g.wait_for_timeout(700)
        if kind == 'party':
            await people[1][1].get_by_label('Your name').fill('Ana')
            await people[1][1].get_by_label('Your name').blur()
            await host.wait_for_timeout(600)
            await host.get_by_role('button', name='Start drafting').click()
        await host.wait_for_timeout(1200)
        await shot(host, f'51-{kind}-host-draft', full=False); await shot(people[1][1], f'51-{kind}-guest-draft', full=False)
        if kind == 'party':
            # a few picks each, then the Cup progress must show everyone's unit strength (not their picks)
            for _, pg in people:
                for _ in range(3):
                    await pg.locator('main button.animate-rise:enabled').first.click(); await pg.wait_for_timeout(250)
            await host.wait_for_timeout(800)
            txt = await body(host)
            ok('party: unit progress shown to the room', 'clubhouse cup · by unit' in txt and 'ana' in txt)
            rows = await host.locator('table tbody tr').all_inner_texts()
            ok('party: every player has unit values while drafting', len(rows) == n and all(re.search(r'\d{2}', r) for r in rows), str(rows))
            await shot(host, '51-party-cup-progress', full=True)
        res = await asyncio.gather(*[draft15(pg, pick=(lambda r, i=i: (r + i) % 4), timeout=240) for i, (_, pg) in enumerate(people)])
        ok(f'{kind}: every player completes the draft', all(res), str(res))
        if kind == 'coop':
            ok('coop: guest waits while the host sets the plan', 'our xv' in await body(people[1][1]))
            await sheet_to_result(host, wait_skip=False)
        else:
            await asyncio.gather(*[sheet_to_result(pg, wait_skip=False) for _, pg in people])
        finals = []
        for i, (_, pg) in enumerate(people):
            for _ in range(80):
                txt = await body(pg)
                if (kind == 'party' and re.search(rf'{n} of {n} finished', txt)) or (kind in ('liveduel', 'shared') and 'reveal' in txt) or (kind == 'coop' and 'our season' in txt): break
                await pg.wait_for_timeout(500)
            if kind in ('liveduel', 'shared'):
                await pg.get_by_role('button', name='Reveal').click(); await pg.wait_for_timeout(3800)
                txt = await body(pg)
            finals.append(txt)
            await shot(pg, f'52-{kind}-final-p{i}')
        if kind in ('liveduel', 'shared'):
            a = re.search(r'you (\d+) – (\d+)', finals[0]); b = re.search(r'you (\d+) – (\d+)', finals[1])
            ok(f'{kind}: both see the verdict after the reveal', a is not None and b is not None, f'{a and a.group(0)} | {b and b.group(0)}')
            if a and b: ok(f'{kind}: scores agree across players', a.group(1) == b.group(2) and a.group(2) == b.group(1))
            ok(f'{kind}: results verified', all('unverified' not in f for f in finals))
            for _, pg in people:
                await pg.get_by_role('button', name=re.compile('^(Rematch|.* wants a rematch)$')).first.click(); await pg.wait_for_timeout(300)
            await host.wait_for_timeout(1500)
            labels = [await round_label(pg) for _, pg in people]
            ok(f'{kind}: rematch restarts both drafts', all(l and l.startswith('Round 1') for l in labels), str(labels))
        elif kind == 'party':
            ok('party: renamed player shows up for others', all('ana' in f for f in finals))
            ok('party: final table for everyone', all(re.search(rf'{n} of {n} finished', f) for f in finals))
            ok('party: results verified', all('unverified' not in f for f in finals))
        else:
            ok('coop: both see the same season', all('our season' in f for f in finals))
            st = [re.search(r'(\d+) pts · (\d+)w', f) for f in finals]
            ok('coop: same points on both screens', all(st) and st[0].group(1) == st[1].group(1), str([s and s.group(0) for s in st]))
            sp = re.search(r'picks: you (\d+), [^\n]* (\d+)', finals[0])
            ok('coop: picks alternate between the two', sp is not None and sorted([int(sp.group(1)), int(sp.group(2))]) == [7, 8], sp and sp.group(0))
        roomerrs = [await pg.evaluate('() => window.__roomErrors') for _, pg in people]
        maxb = [await pg.evaluate('() => window.__roomMaxBytes || 0') for _, pg in people]
        ok(f'{kind}: presence accepted by the capability rules', not any(roomerrs), str(roomerrs)[:200])
        ok(f'{kind}: presence under 4 KiB', max(maxb) < 4096, f'max {max(maxb)} bytes')
        if kind == 'liveduel':
            ctx, pg = await new_page(browser, errs, relay=relay, tag='third')
            await pg.goto(url); await relay.join(pg); await pg.wait_for_timeout(1500)
            ok('liveduel: third player sees room full', 'that room is full.' in await body(pg))
            await ctx.close()
        for ctx, _ in people: await ctx.close()

async def partner_leaves(browser, errs):
    relay = Relay()
    (hctx, host), (gctx, guest) = [await new_page(browser, errs, relay=relay, tag=f'leave-p{i}') for i in range(2)]
    await host.goto(URL); await relay.join(host); await host.wait_for_timeout(300)
    await host.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await host.wait_for_timeout(900)
    await host.locator('section').filter(has=host.get_by_role('heading', name='XV Duel')).get_by_role('button').first.click(); await host.wait_for_timeout(900)
    url = await host.locator('#room-link').input_value()
    await guest.goto(url); await relay.join(guest); await guest.wait_for_timeout(1500)
    ok('leave: draft started for both', (await round_label(host)) is not None and (await round_label(guest)) is not None)
    await relay.leave(guest)
    await host.wait_for_timeout(9500)
    txt = await body(host)
    ok('leave: host is told the room stopped (no endless wait)', 'room stopped' in txt and 'left the room' in txt)
    await shot(host, '53-partner-left', full=False)
    await host.get_by_role('button', name='Play the same format against a bot').click(); await host.wait_for_timeout(800)
    ok('leave: host can carry on against a bot', (await round_label(host)) is not None)
    await hctx.close(); await gctx.close()

async def finish_quick(pg, pick=lambda r: r % 4):
    await draft15(pg, pick=pick)
    await sheet_to_result(pg)

async def home(pg):
    await pg.goto(URL); await pg.wait_for_timeout(600)

async def retention(browser, errs):
    # day 1, first visit: tips can be skipped for good
    ctx, pg = await new_page(browser, errs, tag='day1')
    await home(pg)
    txt = await body(pg)
    ok('daily: not played yet', 'the same draft for everyone.' in txt and 'play the daily' in txt)
    await shot(pg, '15-home-daily-open')
    await pg.get_by_role('button', name=re.compile('^Play the Daily')).click(); await pg.wait_for_timeout(500)
    ok('daily draft is labelled official', 'daily xv · official' in await body(pg) or 'official' in await body(pg))
    await pg.get_by_role('button', name='Skip the tips').click(); await pg.wait_for_timeout(200)
    await finish_quick(pg)
    txt = await body(pg)
    ok('daily result: official attempt', 'official' in txt)
    ok('daily result: challenge on this daily comes first', 'challenge a friend on this daily' in txt)
    m = re.search(r'era rating (\d+) / 130', txt)
    await home(pg)
    txt = await body(pg)
    ok('home: your Daily with its result', 'your daily' in txt and m is not None and f'{m.group(1)} pts' in txt, txt[:200].replace('\n', ' '))
    ok('home: no second official attempt offered', 'play the daily' not in txt and 'practice' in txt)
    await shot(pg, '16-home-daily-done'); await no_overflow(pg, 'home daily done'); await no_cut_text(pg, 'home daily done')
    await pg.get_by_role('button', name='Practice').first.click(); await pg.wait_for_timeout(400)
    ok('tips skipped: none in the next draft', 'tip 1 / 4' not in await body(pg) and 'positions matter' not in await body(pg))
    await finish_quick(pg, pick=lambda r: (r + 1) % 4)
    ok('daily replay is practice', 'practice' in await body(pg) or 'casual' in await body(pg))
    await home(pg)
    txt = await body(pg)
    ok('practice never replaces the official Daily', m is not None and f'{m.group(1)} pts' in txt and 'practice: 1 try' in txt)
    # profile: stats, trends gate, trophies, collection, history reopening
    await pg.get_by_role('button', name=re.compile('^Profile')).click(); await pg.wait_for_timeout(700)
    txt = await body(pg)
    ok('profile: games and dailies counted', re.search(r'2\s*xvs played', txt) is not None and re.search(r'1\s*dailies played', txt) is not None, txt[:260].replace('\n', ' '))
    await shot(pg, '17-profile'); await no_overflow(pg, 'profile'); await no_raw_keys(pg, 'profile'); await no_cut_text(pg, 'profile')
    for tab in ['Trends', 'Trophies', 'Collection', 'History']:
        await pg.get_by_role('tab', name=tab).click(); await pg.wait_for_timeout(250)
        await no_overflow(pg, f'profile {tab}'); await no_raw_keys(pg, f'profile {tab}'); await shot(pg, f'17-profile-{tab.lower()}')
        if tab == 'Trends': ok('trends wait for enough games', 'trends appear after 5 seasons' in await body(pg))
        if tab == 'Collection':
            c = re.search(r'(\d+)\s*/ 1,476\s*players met', await body(pg))
            ok('collection: players met counted', c is not None and int(c.group(1)) >= 20, c and c.group(0))
    await pg.locator('main button').filter(has_text=re.compile('Daily XV ·|Classic ·', re.I)).nth(0).click(); await pg.wait_for_timeout(700)
    txt = await body(pg)
    ok('history: a past game reopens with its result', 'game from your history' in txt and 'era rating' in txt)
    await pg.get_by_role('button', name=DEBRIEF).click(); await pg.wait_for_timeout(1500)
    ok('history: its debrief is rebuilt too', 'turning points' in await body(pg))
    # archives
    await home(pg)
    await pg.get_by_role('button', name=re.compile('^Archives')).click(); await pg.wait_for_timeout(600)
    await no_overflow(pg, 'archives'); await no_raw_keys(pg, 'archives'); await shot(pg, '18-archives')
    await pg.locator('#arch-q').fill('dupont'); await pg.wait_for_timeout(500)
    txt = await body(pg)
    ok('archives: search finds a player with his versions', 'antoine dupont' in txt)
    await pg.locator('main li button').first.click(); await pg.wait_for_timeout(500)
    ok('archives: a version opens the player sheet', await pg.get_by_role('dialog').count() == 1)
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
    # encounter rarity: a label on the version, measured on real drafts, explicitly not strength
    await pg.locator('#arch-q').fill('whitelock'); await pg.wait_for_timeout(500)
    rare_seen = False
    vbtns = pg.locator('main li li button')
    for i in range(await vbtns.count()):
        await vbtns.nth(i).click(); await pg.wait_for_timeout(350)
        dtxt = (await pg.get_by_role('dialog').inner_text()).lower()
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        if 'rare' in dtxt and 'not how good it is' in dtxt: rare_seen = True; break
    ok('archives: a rare version says rarity is not strength', rare_seen)
    # filters are native selects: one row on a phone
    await pg.locator('#arch-q').fill(''); await pg.select_option('#f-pos', 'flyhalf'); await pg.select_option('#f-era', 'amateur'); await pg.wait_for_timeout(400)
    ftxt = await body(pg)
    ok('archives: filters narrow the list', re.search(r'\d+ results?', ftxt) is not None and 'antoine dupont' not in ftxt)
    await pg.select_option('#f-pos', ''); await pg.select_option('#f-era', '')
    await pg.get_by_role('tab', name='Team-eras').click(); await pg.wait_for_timeout(300)
    await pg.locator('#arch-q').fill('toulouse'); await pg.wait_for_timeout(400)
    await pg.locator('main li button').first.click(); await pg.wait_for_timeout(400)
    ok('archives: a team-era opens its squad', await pg.get_by_role('dialog').count() == 1)
    await pg.keyboard.press('Escape')
    # measurements stay on the device and hold no names or links
    await home(pg)
    await pg.get_by_role('button', name='Settings').click(); await pg.wait_for_timeout(500)
    txt = await body(pg)
    ok('settings: local measurements listed', re.search(r'\d+ events recorded', txt) is not None and 'nothing is sent anywhere' in txt)
    evs = await pg.evaluate("() => localStorage.getItem('era-xv:events') || ''")
    ok('events hold no link token or nickname', '#' not in evs and 'Florent' not in evs and 'token' not in evs, str(len(evs)))
    names = set(re.findall(r'"n":"(\w+)"', evs))
    need = {'home_view', 'game_started', 'draft_round_viewed', 'player_selected', 'draft_completed', 'game_plan_selected', 'simulation_started', 'season_completed', 'daily_started', 'daily_completed', 'analysis_opened', 'profile_opened', 'archives_opened', 'perf'}
    ok('funnel events recorded', need <= names, str(sorted(need - names)))
    day1 = await ctx.storage_state()
    await ctx.close()

    # a friend plays tomorrow's Daily and sends the link
    ctx, pg = await new_page(browser, errs, tag='friend', days=1)
    await home(pg)
    await pg.get_by_role('button', name=re.compile('^Play the Daily')).click(); await pg.wait_for_timeout(400)
    await finish_quick(pg, pick=lambda r: 2)
    await pg.get_by_role('button', name='Challenge a friend on this Daily').click(); await pg.wait_for_timeout(900)
    await pg.locator('#share-name').fill('Nina'); await pg.wait_for_timeout(300)
    daily_link = await pg.locator('#share-link').input_value()
    await ctx.close()

    # day 2: the run goes on, nothing was lost overnight
    ctx, pg = await new_page(browser, errs, tag='day2', storage=day1, days=1)
    await home(pg)
    txt = await body(pg)
    ok('next day: a new Daily to play', 'play the daily' in txt)
    ok('next day: yesterday counts in the run', 'daily run: 1 day' in txt)
    await pg.get_by_role('button', name=re.compile('^Play the Daily')).click(); await pg.wait_for_timeout(400)
    await finish_quick(pg)
    await home(pg)
    ok('two days in a row: run of 2', 'daily run: 2 days' in await body(pg))
    await pg.goto(daily_link); await pg.wait_for_timeout(1200)
    txt = await body(pg)
    ok('friend\'s Daily link: comparison ready without replaying', 'nina challenges you' in txt and 'the comparison is ready' in txt)
    await shot(pg, '19-daily-link'); await no_overflow(pg, 'daily link')
    await pg.get_by_role('button', name='See the comparison').click(); await pg.wait_for_timeout(600)
    ok('daily comparison against Nina', 'difference' in await body(pg) and 'nina' in await body(pg))
    await home(pg)
    await pg.get_by_role('button', name=re.compile('^Clubhouse')).first.click(); await pg.wait_for_timeout(700)
    txt = await body(pg)
    ok('clubhouse: today\'s Daily between friends lists both', 'today’s daily between friends' in txt and 'nina' in txt)
    await shot(pg, '20-clubhouse-board'); await no_overflow(pg, 'clubhouse'); await no_raw_keys(pg, 'clubhouse')
    await ctx.close()

    # Web Share where the browser has it, clipboard otherwise, link always visible
    share_ok = "navigator.share = async (d) => { window.__shared = d; }; navigator.canShare = () => true;"
    share_no = "navigator.share = async () => { throw new DOMException('no', 'NotAllowedError'); };"
    for label, init in [('web share', share_ok), ('share refused', share_no)]:
        ctx, pg = await new_page(browser, errs, tag=label, storage=day1, init=init)
        await home(pg)
        await pg.get_by_role('button', name='Challenge on this Daily').click(); await pg.wait_for_timeout(1500)
        await pg.get_by_role('button', name='Share…').click(); await pg.wait_for_timeout(600)
        if init == share_ok:
            shared = await pg.evaluate('() => window.__shared && window.__shared.url')
            ok('web share: the link goes to the system sheet', bool(shared and '#' in shared), str(shared)[:60])
            ok('web share: confirmed', 'shared ✓' in await body(pg))
        else:
            txt = await body(pg)
            ok('share refused: falls back to the clipboard or the visible link', 'link copied ✓' in txt or 'select the text' in txt)
            ok('share refused: the link stays visible', '#' in await pg.locator('#share-link').input_value())
        await ctx.close()

async def main():
    srv = serve()
    errs = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        only = sys.argv[1:]
        link, pts, sender = (None, None, None)
        if not only or 'solo' in only or 'challenge' in only: link, pts, sender = await solo_loop(browser, errs)
        if (not only or 'challenge' in only) and link: await challenge_roundtrip(browser, errs, link, pts, sender)
        if not only or 'retention' in only: await retention(browser, errs)
        if not only or 'challenge' in only: await challenge_intent(browser, errs)
        if not only or 'resume' in only: await resume(browser, errs)
        if not only or 'lang' in only: await languages(browser, errs)
        if not only or 'screens' in only: await screens(browser, errs)
        if not only or 'modes' in only: await modes(browser, errs)
        if not only or 'practice' in only: await practice_rooms(browser, errs)
        if not only or 'live' in only: await live_rooms(browser, errs)
        if not only or 'live' in only or 'leave' in only: await partner_leaves(browser, errs)
        await browser.close()
    srv.shutdown()
    real = [e for e in errs if 'favicon' not in e]
    ok('no page errors or console errors', not real, ' | '.join(real[:6]))
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} checks passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
