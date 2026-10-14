/** ERA XV 2.0 strings (Modern Rugby Clubhouse redesign). Merged over the base dictionary. */
const en: Record<string, string> = {
  // units and match-sheet groups
  'units.aria': 'Your XV by unit', 'units.itemAria': '{unit}: {n} of {max}',
  'unit2.pack': 'Pack', 'unit2.halves': 'Half-backs', 'unit2.centres': 'Centres', 'unit2.back3': 'Back three',
  'unit2.pack.short': 'PK', 'unit2.halves.short': 'HB', 'unit2.centres.short': 'CE', 'unit2.back3.short': 'B3',
  'group.front': 'Front row', 'group.second': 'Second row', 'group.backrow': 'Back row', 'group.halves': 'Half-backs', 'group.centres': 'Centres', 'group.back3': 'Back three',
  'groupPoss.front': 'your front row', 'groupPoss.second': 'your second row', 'groupPoss.backrow': 'your back row', 'groupPoss.halves': 'your half-backs', 'groupPoss.centres': 'your centres', 'groupPoss.back3': 'your back three',
  'moment.front': 'Your front row is complete', 'moment.backrow': 'Your back row', 'moment.pack': 'Your pack is complete', 'moment.halves': 'Your half-backs', 'moment.centres': 'Your centre pairing', 'moment.back3': 'Your back three',
  'moment.starsAria': '{n} out of 5',

  // home
  'home2.kicker': 'Rugby union · the ERA League', 'home2.title1': 'Every era.', 'home2.title2': 'One XV.',
  'home2.pitch': '15 picks. Legends from every generation. Build your team. Choose your rugby. Take on history.',
  'home2.sheetAria': 'The fifteen shirts: pack, half-backs, centres, back three',
  'home2.counts': '{players} players · {versions} versions · {teams} team-eras',
  'home2.play': 'Draft my XV', 'home2.challenge': 'Challenge a friend', 'home2.clubhouse': 'Clubhouse',
  'mode.classic.short': 'Ratings visible', 'mode.iq.short': 'Ratings hidden',

  // draft
'draft2.pick': 'Pick {n}/{max}', 'draft2.reroll': 'Redraw', 'draft2.draw': 'Draw {n}',
  'draft.compatible': 'compatible position',
  'insight.frontRow': 'Not a front-rower: uncontested scrums', 'insight.oop': 'Out of position at {slot}',
  'insight.complete.pack': 'Completes your pack', 'insight.complete.halves': 'Completes your half-backs', 'insight.complete.back3': 'Completes your back three',
  'insight.complete.centres': 'Completes your centres', 'insight.complete.front': 'Completes your front row', 'insight.complete.backrow': 'Completes your back row',
  'insight.fix.uncontested': 'Makes your scrum contested again', 'insight.fix.noKicker': 'Gives you a goal-kicker', 'insight.fix.noJackal': 'Fixes your lack of a jackal',
  'insight.fix.noCaller': 'Gives your lineout a caller', 'insight.fix.highBall': 'Secures your high balls', 'insight.fix.slowBack3': 'Adds pace to your back three', 'insight.fix.sameChannel': 'Unblocks your midfield channel',
  'insight.boost.scrum': 'Strengthens your scrum', 'insight.boost.lineout': 'Strengthens your lineout', 'insight.boost.breakdown': 'Strengthens your breakdown', 'insight.boost.carry': 'Adds go-forward',
  'insight.boost.defence': 'Strengthens your defence', 'insight.boost.playmaking': 'Adds playmaking', 'insight.boost.kicking': 'Improves your kicking game', 'insight.boost.strike': 'Adds finishing',
  'insight.boost.pace': 'Adds pace', 'insight.boost.aerial': 'Strengthens your aerial game',
  'insight.still.scrum': 'Scrum still weak', 'insight.still.lineout': 'Lineout still weak', 'insight.still.breakdown': 'Breakdown still weak', 'insight.still.carry': 'Go-forward still weak',
  'insight.still.defence': 'Defence still weak', 'insight.still.playmaking': 'Playmaking still weak', 'insight.still.kicking': 'Kicking game still weak', 'insight.still.strike': 'Finishing still weak',
  'insight.still.pace': 'Pace still lacking', 'insight.still.aerial': 'Aerial game still weak',
  'trait.captain': 'Captain', 'trait.poty': 'Player of the Year', 'trait.goalKicker': 'Goal-kicker', 'trait.utility': 'Utility back',
  'trait.jackal': 'Jackal', 'trait.lineoutBoss': 'Lineout boss', 'trait.scrummager': 'Scrummager', 'trait.ballCarrier': 'Ball carrier', 'trait.finisher': 'Finisher',
  'trait.highBall': 'High-ball specialist', 'trait.playmaker': 'Playmaker', 'trait.distributor': 'Distributor', 'trait.defensiveLeader': 'Defensive leader',

  // match sheet
  'sheet.title': 'Match sheet', 'sheet.cohesion': 'Cohesion', 'sheet.oop': 'Out of position', 'sheet.compat': 'Compatible', 'sheet.rowAria': 'Number {n}: {name}',
  'sheet.view': 'View', 'sheet.view.sheet': 'Team sheet', 'sheet.view.pitch': 'Pitch',
  'sheet.next': 'Game plan', 'sheet.nextGauntlet': 'Game plan', 'sheet.nextHint': 'Current plan: {plan}. Confirm or change it on the next screen.',
  'resp.title': 'Responsibilities', 'resp.captain': 'Captain', 'resp.captainHistoric': 'Captain of {team}', 'resp.captainNamed': 'Named on rating',
  'resp.kicker': 'Goal-kicker', 'resp.kickerSub': 'Best boot in the XV', 'resp.lineout': 'Lineout caller', 'resp.lineoutSub': 'Best lineout forward',
  'resp.mark.captain': 'C', 'resp.mark.kicker': 'K', 'resp.mark.lineout': 'L',
  'diag.title': 'Composition check', 'diag.count_one': '{n} player outside his ideal zone.', 'diag.count_other': '{n} players outside their ideal zone.',
  'diag.allCompatible': 'Normal versatility only: no real problem.', 'diag.none': 'Everyone is in his natural position.',
  'diag.impact': 'FIT impact', 'diag.impact.high': 'high', 'diag.impact.medium': 'medium', 'diag.impact.low': 'low',

  // game plan
  'plan2.title': 'Your game plan', 'plan2.intro': 'Same fifteen, different priorities. The plan changes what your XV needs (FIT thresholds) and how it plays in the season model.',
  'plan2.play': 'Play the season · {plan}', 'plan2.favoured': 'Favoured', 'plan2.reduced': 'Toned down', 'plan2.none': 'None', 'plan2.needs': 'Required (your XV / needed)', 'plan2.philosophy': 'Philosophy',
  'plan2.limited': '{dim} at {v} for {thr} required: that is what limits this plan.',
  'plan2.natural2': 'With {a} and {b}, your XV is naturally suited to this plan.', 'plan2.natural1': 'With {a}, your XV is naturally suited to this plan.',
  'plan2.natural0': 'No area of your XV below its threshold: this plan suits it.', 'plan2.workable': 'Workable at FIT {fit}: nothing blocks it, nothing carries it either.',

  'plan2.playShort': 'Play the season',
  // season broadcast
  'story.league': 'ERA League · regular season', 'story.round': 'Round {n}/{max}', 'story.board': 'Live table', 'story.rank': 'Position', 'story.pts': 'Pts',
  'story.top6': 'Top 6 qualify', 'story.feed': 'Results', 'story.j': 'R{n}', 'story.res.W': 'Win', 'story.res.D': 'Draw', 'story.res.L': 'Defeat',
  'story.q.in': 'Qualified', 'story.q.out': 'Out of contention', 'story.q.inside': 'In the top 6', 'story.q.outside': 'Outside the top 6',
  'story.exploit': 'Big win away at {opp}', 'story.statement': 'Statement win over {opp}', 'story.tries': '{n} tries against {opp}',
  'story.streak': '{n} wins in a row', 'story.losingRun': '{n} defeats in a row', 'story.firstDefeat': 'First defeat after {n} unbeaten',
  'story.intoTop6': 'Into the top 6 ({ord})', 'story.outOfTop6': 'Down to {ord}', 'story.leader': 'Top of the ERA League',
  'story.clinched': 'Play-off place secured', 'story.clinchedTop2': 'Top 2 secured: straight to the semi-finals', 'story.eliminated': 'Play-offs out of reach',
  'story.decider': 'Last round: everything to play for', 'story.regular': 'Regular season', 'story.bye': 'Top 2: straight to the semi-finals',
  'story.noPlayoffs': 'No play-offs this season', 'story.finalWon': '{team} won the ERA Shield final {score}.',
  'story.champion': 'Champions', 'story.toFinal': 'Into the final', 'story.toSemi': 'Into the semi-finals', 'story.out': 'Knocked out', 'story.toResult': 'See the result →',

  // result
  'standing.champion': 'Champions of the ERA League', 'standing.finalist': 'Finalists', 'standing.semi': 'Semi-finalists', 'standing.quarter': 'Out in the play-off round',
  'standing.playoffs': 'Play-offs', 'standing.doorstep': 'One place off the play-offs', 'standing.midtable': 'Outside the play-offs', 'standing.bottom': 'Bottom of the table',
  'result.seasonOver': 'Season over · ERA League', 'result.shield': 'ERA Shield winners, regular season and knockouts.', 'result.qualified': 'Qualified for the play-offs', 'result.regularOf': 'Regular season · {n} teams',
  'result.k.pts': 'Points', 'result.k.record': 'W-D-L', 'result.k.diff': 'Diff', 'result.k.bonus': 'Bonus',
  'result.eraScore': 'ERA rating {pts} / {max}', 'result.eraScoreLabel': 'What is the ERA rating?',
  'result.debrief': 'Staff debrief', 'result.challenge2': 'Challenge a friend', 'result.sheet': 'Your match sheet', 'result.aria2': '{label}, {pts} league points',
  'gauntlet.legendsN': '{n} of {max} legends beaten',

  // challenge
  'ch.title': 'Challenge', 'ch.finished': '{who} finished', 'ch.ptsLine': '{pts} pts · {w}W {d}D {l}L', 'ch.same2': 'Same 15 draws. Same fixtures.', 'ch.beat2': 'Your turn.',
  'ch.duelTitle': 'Challenge · same draw', 'ch.col.xv': 'XV', 'ch.col.rank': 'Pos', 'ch.col.pts': 'Pts',
  'ch.estimate': 'Estimate: the same XV with that one pick changed, on the same fixtures.',
  'shareText.challenge2': 'ERA XV: {where}, {pts} pts. Same 15 draws, same fixtures. Can you beat my XV?',
  'card.stats': '{pts} pts · {w}W {d}D {l}L · Diff {diff} · {bp} bonus',
  'share.challengeTitle2': 'Challenge a friend', 'share.fair': 'Your friend gets exactly the same draws, offers and ERA League fixtures. Only the choices change.',

  // staff debrief
  'debrief.title': 'Staff debrief', 'debrief.three': 'Your XV in three points', 'debrief.noEdge': 'No area clearly above this season’s league.',
  'debrief.why': 'Why your season went that way',
  'debrief.fit': 'Cohesion {n}: under 90, your XV loses efficiency in every phase (see the composition check).', 'debrief.fitGood': 'Cohesion {n}: your XV plays as one.',
  'debrief.estimates': 'estimates', 'debrief.yourPick': 'Your pick', 'debrief.more': 'Go further', 'debrief.tactical': 'Full tactical analysis', 'debrief.bonusTerm': 'Bonus points',
  'debrief.vsLeagueUp': '+{n} on the league average', 'debrief.vsLeagueDown': '−{n} under the league average',
  'staff.setpiece.up': 'Dominant set piece', 'staff.setpiece.down': 'Fragile set piece', 'staff.setpiece.low': 'Set piece: your least strong area',
  'staff.collision.up': 'Winning the collisions', 'staff.collision.down': 'Losing the collisions', 'staff.collision.low': 'Collisions: your least strong area',
  'staff.defence.up': 'Solid defence', 'staff.defence.down': 'Leaky defence', 'staff.defence.low': 'Defence: your least strong area',
  'staff.attack.up': 'Creative attack', 'staff.attack.down': 'Blunt attack', 'staff.attack.low': 'Attack: your least strong area',
  'staff.territory.up': 'Territorial control', 'staff.territory.down': 'Not enough territorial control', 'staff.territory.low': 'Territory: your least strong area',
  'staff.pace.up': 'Pace to burn', 'staff.pace.down': 'Lacking pace', 'staff.pace.low': 'Pace: your least strong area',

  // player sheet
  'inspect.level2': 'Full profile', 'inspect.level2sub': 'Why this rating, rating by position', 'inspect.level3': 'Data and history', 'inspect.level3sub': 'Attributes, honours, other versions',

  // clubhouse
  'club.kicker': 'Multiplayer', 'club.title': 'Clubhouse', 'club.intro': 'Same seed, same 15 draws: the draft decides.',
  'club.checking': 'Checking live rooms…', 'club.liveOn': 'Live rooms available', 'club.liveOff': 'Live rooms unavailable in this view: practice against bots',
  'club.duel.title': 'XV Duel', 'club.duel.l1': '2 players, the same 15 draws', 'club.duel.l2': 'Picks locked in secret, revealed together', 'club.duel.l3': 'Standings, then points, then the winner', 'club.duel.create': 'Create a duel',
  'club.cup.title': 'Clubhouse Cup', 'club.cup.l1': '2 to 8 players, same draft, own pace', 'club.cup.l2': 'Unit strength visible while drafting', 'club.cup.l3': 'Final table at the end', 'club.cup.create': 'Create a Cup',
  'club.coop.title': 'Draft Together', 'club.coop.l1': '2 players build ONE XV', 'club.coop.l2': 'Alternate picks on the same draw', 'club.coop.l3': 'One season, one result for both', 'club.coop.create': 'Create',
  'club.pool.title': 'Common Pool', 'club.pool.l1': '1 v 1, one pool: what you take, your rival loses', 'club.pool.l2': 'First pick alternates every round', 'club.pool.create': 'Create',
  'club.practice': 'Practice with bots', 'club.offNote': 'Live rooms need a signed-in viewer on the published page. Practice works everywhere.',
  'club.link.title': 'Challenge by link', 'club.link.line': 'Play, then send your draft: your friend replays exactly the same draws and you compare standings, points and choices.',
  'club.link.paste': 'Received a link or code? Paste it', 'club.record': 'Duels {w}W {l}L · Cups won {p}', 'club.modesLine': 'XV Duel, Clubhouse Cup, Draft Together and challenges by link.',

  // live rooms
  'mode.shared.name': 'Common Pool', 'room.tag.shared': 'Common Pool',
  'mode.coop.name': 'Draft Together', 'mode.coop.desc': 'Two players, one XV. You alternate picks on the same draw, then the host sets the plan and the season belongs to both of you.',
  'room.tag.coop': 'Draft Together', 'room.pitch2coop': 'One XV.', 'room.pitch3coop': 'Built together.',
  'coop.yourTurn': 'Your pick', 'coop.yourTurnAfter': 'Your pick · {name} took {player}', 'coop.theirTurn': '{name} is picking', 'coop.status': 'TOGETHER · WITH {name}',
  'coop.ourXV': 'Our XV', 'coop.hostDecides': '{name} sets the match sheet and the game plan, then plays the season for both of you.',
  'coop.split': 'Picks: you {me}, {name} {them}', 'coop.ourSeason': 'Our season',
  'cup.progress': 'Clubhouse Cup · by unit', 'cup.player': 'Player', 'cup.note': 'Average rating in position per unit. Picks and season scores stay hidden until the end.',
  'room.partnerLeftTitle': 'Room stopped', 'room.partnerLeft': '{name} left the room. This format needs both players, so it cannot go on.', 'room.continueBots': 'Play the same format against a bot',
  'room.botMate': 'Bot team-mate', 'room.botName': 'House XV', 'room.botN': 'Bot {n}', 'room.stillDrafting': 'still drafting',
  'room.yourSeasonHidden': 'Your season is played. Results are revealed together once both of you have finished.',
  'duel.bothDone': 'Both seasons are in', 'duel.seasonsPlayed': 'Two XVs. One draw.', 'duel.suspense': 'Neither of you has seen the result yet. Reveal the standings, then the points, then the winner against {name}.',
  'duel.reveal': 'Reveal', 'duel.table': 'Duel result',

  // glossary (tap a dotted term)
  'gloss.fit': 'FIT measures how well your XV works together: players in position, no area under the plan’s threshold, roles that complement each other. It starts at 100 and loses points for each problem.',
  'gloss.responsibilities': 'Assigned automatically: the historical captain if your XV has one (otherwise the best-rated player), the best goal-kicker (the one the season model uses) and the best lineout forward.',
  'gloss.plan': 'The game plan weights the ten areas in the match model and sets the FIT thresholds. It never changes who you drafted.',
  'gloss.eraScore': 'League points over the 26 rounds (5 a game at most: 4 for a win plus a bonus point). It is the score used for records and challenges; your position and the play-offs tell the story of the season.',
  'gloss.staffAreas': 'Six areas (set piece, collisions, defence, attack, territory, pace), each compared with the average of this season’s thirteen ERA League opponents.',
  'gloss.bonus': 'International rules: an attacking bonus point for 4 tries, a losing bonus point for a defeat by 7 or less. Top 14 rules: attacking bonus for winning by 3 tries, losing bonus within 5 points.',
  'gloss.plan.balanced': 'No lever: solid everywhere, dominant nowhere in particular.',
  'gloss.plan.pack': 'Win the set piece and the gain line, then squeeze the opposition.',
  'gloss.plan.flair': 'Keep the ball alive and play wide: accept the risk to score from anywhere.',
  'gloss.plan.territory': 'Give the ball back to gain ground: kick, chase and pressure.',
  'gloss.plan.blitz': 'Rush up in defence and steal ball at the breakdown.',
  'gloss.plan.tempo': 'Quick ball and a lively 9: never let the defence reset.',
  'gloss.group.front': 'Props (1, 3) and hooker (2): the scrum rests on them. Only specialists can play there.',
  'gloss.group.second': 'Locks (4, 5): lineout jumpers and the engine of the scrum and maul.',
  'gloss.group.backrow': 'Flankers (6, 7) and number 8: tackling, carrying and fighting for the ball at the breakdown.',
  'gloss.group.halves': 'The 9 speeds the game up, the 10 decides where it goes.',
  'gloss.group.centres': '12 and 13: break the defensive line, or hold it.',
  'gloss.group.back3': 'Wings (11, 14) and full-back (15): finishing, high balls and the last line of defence.',
};
export default en;
