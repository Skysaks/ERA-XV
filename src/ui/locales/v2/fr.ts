/** Chaînes ERA XV 2.0 (refonte Modern Rugby Clubhouse). Fusionnées par-dessus le dictionnaire de base. */
const fr: Record<string, string> = {
  // unités et lignes de la feuille de match
  'units.aria': 'Ton XV par unité', 'units.itemAria': '{unit} : {n} sur {max}',
  'unit2.pack': 'Pack', 'unit2.halves': 'Charnière', 'unit2.centres': 'Centres', 'unit2.back3': 'Triangle',
  'unit2.pack.short': 'PK', 'unit2.halves.short': 'CH', 'unit2.centres.short': 'CE', 'unit2.back3.short': 'TR',
  'group.front': 'Première ligne', 'group.second': 'Deuxième ligne', 'group.backrow': 'Troisième ligne', 'group.halves': 'Charnière', 'group.centres': 'Centres', 'group.back3': 'Triangle arrière',
  'groupPoss.front': 'ta première ligne', 'groupPoss.second': 'ta deuxième ligne', 'groupPoss.backrow': 'ta troisième ligne', 'groupPoss.halves': 'ta charnière', 'groupPoss.centres': 'tes centres', 'groupPoss.back3': 'ton triangle arrière',
  'moment.front': 'Ta première ligne est complète', 'moment.backrow': 'Ta troisième ligne', 'moment.pack': 'Ton pack est complet', 'moment.halves': 'Ta charnière', 'moment.centres': 'Ta paire de centres', 'moment.back3': 'Ton triangle arrière',
  'moment.starsAria': '{n} sur 5',

  // accueil
  'home2.kicker': 'Rugby à XV · la Ligue ERA', 'home2.title1': 'Toutes les époques.', 'home2.title2': 'Un seul XV.',
  'home2.pitch': '15 choix. Des légendes de toutes les générations. Construis ton équipe. Choisis ton rugby. Affronte l’histoire.',
  'home2.sheetAria': 'Les quinze maillots : pack, charnière, centres, triangle arrière',
  'home2.counts': '{players} joueurs · {versions} versions · {teams} équipes-époques',
  'home2.play': 'Drafter mon XV', 'home2.challenge': 'Défier un ami', 'home2.clubhouse': 'Clubhouse',
  'mode.classic.short': 'Notes visibles', 'mode.iq.short': 'Notes cachées',

  // draft
'draft2.pick': 'Choix {n}/{max}', 'draft2.reroll': 'Relancer', 'draft2.draw': 'Tirage {n}',
  'draft.compatible': 'poste compatible',
  'insight.frontRow': 'Pas un première ligne : mêlées simulées', 'insight.oop': 'Hors poste en n°{slot}',
  'insight.complete.pack': 'Complète ton pack', 'insight.complete.halves': 'Complète ta charnière', 'insight.complete.back3': 'Complète ton triangle arrière',
  'insight.complete.centres': 'Complète ta paire de centres', 'insight.complete.front': 'Complète ta première ligne', 'insight.complete.backrow': 'Complète ta troisième ligne',
  'insight.fix.uncontested': 'Rend ta mêlée à nouveau disputée', 'insight.fix.noKicker': 'Te donne un buteur', 'insight.fix.noJackal': 'Corrige ton manque de gratteur',
  'insight.fix.noCaller': 'Donne un patron à ta touche', 'insight.fix.highBall': 'Sécurise tes ballons hauts', 'insight.fix.slowBack3': 'Accélère ton triangle arrière', 'insight.fix.sameChannel': 'Débloque ton couloir du milieu',
  'insight.boost.scrum': 'Renforce ta mêlée', 'insight.boost.lineout': 'Renforce fortement ta touche', 'insight.boost.breakdown': 'Renforce tes rucks', 'insight.boost.carry': 'Ajoute de l’avancée',
  'insight.boost.defence': 'Renforce ta défense', 'insight.boost.playmaking': 'Ajoute de l’animation', 'insight.boost.kicking': 'Améliore ton jeu au pied', 'insight.boost.strike': 'Ajoute de la finition',
  'insight.boost.pace': 'Ajoute de la vitesse', 'insight.boost.aerial': 'Renforce ton jeu aérien',
  'insight.still.scrum': 'Mêlée toujours faible', 'insight.still.lineout': 'Touche toujours faible', 'insight.still.breakdown': 'Rucks toujours faibles', 'insight.still.carry': 'Avancée toujours faible',
  'insight.still.defence': 'Défense toujours faible', 'insight.still.playmaking': 'Animation toujours faible', 'insight.still.kicking': 'Jeu au pied toujours faible', 'insight.still.strike': 'Finition toujours faible',
  'insight.still.pace': 'Toujours en manque de vitesse', 'insight.still.aerial': 'Jeu aérien toujours faible',
  'trait.captain': 'Capitaine', 'trait.poty': 'Joueur de l’année', 'trait.goalKicker': 'Buteur', 'trait.utility': 'Arrière polyvalent',
  'trait.jackal': 'Gratteur', 'trait.lineoutBoss': 'Patron de touche', 'trait.scrummager': 'Spécialiste de la mêlée', 'trait.ballCarrier': 'Porteur de balle', 'trait.finisher': 'Finisseur',
  'trait.highBall': 'Spécialiste des ballons hauts', 'trait.playmaker': 'Animateur', 'trait.distributor': 'Distributeur', 'trait.defensiveLeader': 'Leader défensif',

  // feuille de match
  'sheet.title': 'Feuille de match', 'sheet.cohesion': 'Cohésion', 'sheet.oop': 'Hors poste', 'sheet.compat': 'Compatible', 'sheet.rowAria': 'Numéro {n} : {name}',
  'sheet.view': 'Affichage', 'sheet.view.sheet': 'Feuille', 'sheet.view.pitch': 'Terrain',
  'sheet.next': 'Plan de match', 'sheet.nextGauntlet': 'Plan de match', 'sheet.nextHint': 'Plan actuel : {plan}. Confirme-le ou change-le à l’écran suivant.',
  'resp.title': 'Responsabilités', 'resp.captain': 'Capitaine', 'resp.captainHistoric': 'Capitaine de {team}', 'resp.captainNamed': 'Désigné sur la note',
  'resp.kicker': 'Buteur', 'resp.kickerSub': 'Meilleur pied du XV', 'resp.lineout': 'Patron de touche', 'resp.lineoutSub': 'Meilleur sauteur du pack',
  'resp.mark.captain': 'C', 'resp.mark.kicker': 'B', 'resp.mark.lineout': 'T',
  'diag.title': 'Diagnostic de composition', 'diag.count_one': '{n} joueur hors de sa zone idéale.', 'diag.count_other': '{n} joueurs hors de leur zone idéale.',
  'diag.allCompatible': 'Uniquement de la polyvalence normale : aucun vrai problème.', 'diag.none': 'Tout le monde joue à son poste naturel.',
  'diag.impact': 'Impact FIT', 'diag.impact.high': 'élevé', 'diag.impact.medium': 'moyen', 'diag.impact.low': 'faible',

  // plan de match
  'plan2.title': 'Ton plan de match', 'plan2.intro': 'Les mêmes quinze, d’autres priorités. Le plan change ce dont ton XV a besoin (seuils de FIT) et sa manière de jouer dans le modèle de saison.',
  'plan2.play': 'Jouer la saison · {plan}', 'plan2.favoured': 'Avantagés', 'plan2.reduced': 'Mis en retrait', 'plan2.none': 'Aucun', 'plan2.needs': 'Requis (ton XV / seuil)', 'plan2.philosophy': 'Philosophie',
  'plan2.limited': '{dim} à {v} pour {thr} requis : c’est ce qui limite ce plan.',
  'plan2.natural2': 'Avec {a} et {b}, ton XV est naturellement adapté à ce plan.', 'plan2.natural1': 'Avec {a}, ton XV est naturellement adapté à ce plan.',
  'plan2.natural0': 'Aucun secteur de ton XV sous son seuil : ce plan lui convient.', 'plan2.workable': 'Jouable avec un FIT de {fit} : rien ne bloque, rien ne le porte particulièrement.',

  'plan2.playShort': 'Jouer la saison',
  // saison
  'story.league': 'Ligue ERA · saison régulière', 'story.round': 'J{n}/{max}', 'story.board': 'Classement en direct', 'story.rank': 'Classement', 'story.pts': 'Pts',
  'story.top6': 'Les 6 premiers qualifiés', 'story.feed': 'Résultats', 'story.j': 'J{n}', 'story.res.W': 'Victoire', 'story.res.D': 'Nul', 'story.res.L': 'Défaite',
  'story.q.in': 'Qualifié', 'story.q.out': 'Hors course', 'story.q.inside': 'Dans le top 6', 'story.q.outside': 'Hors du top 6',
  'story.exploit': 'Exploit chez {opp}', 'story.statement': 'Victoire de prestige face à {opp}', 'story.tries': '{n} essais face à {opp}',
  'story.streak': '{n} victoires consécutives', 'story.losingRun': '{n} défaites de suite', 'story.firstDefeat': 'Première défaite après {n} matchs sans perdre',
  'story.intoTop6': 'Tu rentres dans le top 6 ({ord})', 'story.outOfTop6': 'Tu tombes à la {ord} place', 'story.leader': 'En tête de la Ligue ERA',
  'story.clinched': 'Qualification assurée', 'story.clinchedTop2': 'Top 2 assuré : direct en demi-finale', 'story.eliminated': 'Phases finales hors de portée',
  'story.decider': 'Dernière journée décisive', 'story.regular': 'Saison régulière', 'story.bye': 'Top 2 : direct en demi-finale',
  'story.noPlayoffs': 'Pas de phases finales cette saison', 'story.finalWon': '{team} remporte la finale du Bouclier ERA {score}.',
  'story.champion': 'Champion', 'story.toFinal': 'Qualifié pour la finale', 'story.toSemi': 'Qualifié en demi-finale', 'story.out': 'Éliminé', 'story.toResult': 'Voir le résultat →',

  // résultat
  'standing.champion': 'Champion de la Ligue ERA', 'standing.finalist': 'Finaliste', 'standing.semi': 'Demi-finaliste', 'standing.quarter': 'Éliminé en barrage',
  'standing.playoffs': 'Phases finales', 'standing.doorstep': 'Aux portes des barrages', 'standing.midtable': 'Hors des phases finales', 'standing.bottom': 'Bas de tableau',
  'result.seasonOver': 'Saison terminée · Ligue ERA', 'result.shield': 'Vainqueur du Bouclier ERA, saison régulière et phases finales.', 'result.qualified': 'Qualifié pour les phases finales', 'result.regularOf': 'Saison régulière · {n} équipes',
  'result.k.pts': 'Points', 'result.k.record': 'V-N-D', 'result.k.diff': 'Diff', 'result.k.bonus': 'Bonus',
  'result.eraScore': 'Note ERA {pts} / {max}', 'result.eraScoreLabel': 'C’est quoi, la note ERA ?',
  'result.debrief': 'Débrief du staff', 'result.challenge2': 'Défier un ami', 'result.sheet': 'Ta feuille de match', 'result.aria2': '{label}, {pts} points de championnat',
  'gauntlet.legendsN': '{n} légendes battues sur {max}',

  // défi
  'ch.title': 'Défi', 'ch.finished': '{who} a terminé', 'ch.ptsLine': '{pts} pts · {w}V {d}N {l}D', 'ch.same2': 'Mêmes 15 tirages. Même calendrier.', 'ch.beat2': 'À toi.',
  'ch.duelTitle': 'Défi · même tirage', 'ch.col.xv': 'XV', 'ch.col.rank': 'Clt', 'ch.col.pts': 'Pts',
  'ch.estimate': 'Estimation : le même XV avec ce seul choix changé, sur le même calendrier.',
  'shareText.challenge2': 'ERA XV : {where}, {pts} pts. Mêmes 15 tirages, même calendrier. Tu bats mon XV ?',
  'card.stats': '{pts} pts · {w}V {d}N {l}D · Diff {diff} · {bp} bonus',
  'share.challengeTitle2': 'Défier un ami', 'share.fair': 'Ton ami reçoit exactement les mêmes tirages, les mêmes offres et le même calendrier de Ligue ERA. Seuls les choix changent.',

  // débrief du staff
  'debrief.title': 'Débrief du staff', 'debrief.three': 'Ton XV en 3 points', 'debrief.noEdge': 'Aucun secteur nettement au-dessus de la ligue cette saison.',
  'debrief.why': 'Pourquoi ta saison s’est jouée là',
  'debrief.fit': 'Cohésion {n} : sous 90, ton XV perd en efficacité dans toutes les phases (voir le diagnostic de composition).', 'debrief.fitGood': 'Cohésion {n} : ton XV joue ensemble.',
  'debrief.estimates': 'estimations', 'debrief.yourPick': 'Ton choix', 'debrief.more': 'Aller plus loin', 'debrief.tactical': 'Analyse tactique complète', 'debrief.bonusTerm': 'Points de bonus',
  'debrief.vsLeagueUp': '+{n} sur la moyenne de la ligue', 'debrief.vsLeagueDown': '−{n} sous la moyenne de la ligue',
  'staff.setpiece.up': 'Conquête dominante', 'staff.setpiece.down': 'Conquête fragile', 'staff.setpiece.low': 'Conquête : ton secteur le moins fort',
  'staff.collision.up': 'Combat gagné', 'staff.collision.down': 'Combat perdu', 'staff.collision.low': 'Combat : ton secteur le moins fort',
  'staff.defence.up': 'Défense solide', 'staff.defence.down': 'Défense perméable', 'staff.defence.low': 'Défense : ton secteur le moins fort',
  'staff.attack.up': 'Attaque créative', 'staff.attack.down': 'Attaque stérile', 'staff.attack.low': 'Attaque : ton secteur le moins fort',
  'staff.territory.up': 'Contrôle territorial', 'staff.territory.down': 'Contrôle territorial insuffisant', 'staff.territory.low': 'Occupation : ton secteur le moins fort',
  'staff.pace.up': 'Vitesse supérieure', 'staff.pace.down': 'Manque de vitesse', 'staff.pace.low': 'Vitesse : ton secteur le moins fort',

  // fiche joueur
  'inspect.level2': 'Profil complet', 'inspect.level2sub': 'Pourquoi cette note, note par poste', 'inspect.level3': 'Données et histoire', 'inspect.level3sub': 'Attributs, palmarès, autres versions',

  // clubhouse
  'club.kicker': 'Multijoueur', 'club.title': 'Clubhouse', 'club.intro': 'Même seed, mêmes 15 tirages : c’est le draft qui départage.',
  'club.checking': 'Vérification des salons en direct…', 'club.liveOn': 'Salons en direct disponibles', 'club.liveOff': 'Salons en direct indisponibles ici : entraînement contre des bots',
  'club.duel.title': 'Duel XV', 'club.duel.l1': '2 joueurs, les mêmes 15 tirages', 'club.duel.l2': 'Choix validés en secret, révélés ensemble', 'club.duel.l3': 'Classement, puis points, puis vainqueur', 'club.duel.create': 'Créer un duel',
  'club.cup.title': 'Clubhouse Cup', 'club.cup.l1': 'De 2 à 8 joueurs, même draft, chacun à son rythme', 'club.cup.l2': 'Force par unité visible pendant le draft', 'club.cup.l3': 'Classement final à la fin', 'club.cup.create': 'Créer une Cup',
  'club.coop.title': 'Draft partagé', 'club.coop.l1': '2 joueurs construisent UN seul XV', 'club.coop.l2': 'Choix alternés sur le même tirage', 'club.coop.l3': 'Une saison, un résultat pour les deux', 'club.coop.create': 'Créer',
  'club.pool.title': 'Vivier commun', 'club.pool.l1': '1 contre 1, un seul vivier : ce que tu prends, ton rival le perd', 'club.pool.l2': 'Le premier choix alterne à chaque tour', 'club.pool.create': 'Créer',
  'club.practice': 'S’entraîner avec des bots', 'club.offNote': 'Les salons en direct demandent un visiteur connecté sur la page publiée. L’entraînement fonctionne partout.',
  'club.link.title': 'Défi par lien', 'club.link.line': 'Joue, puis envoie ton draft : ton ami rejoue exactement les mêmes tirages et vous comparez classement, points et choix.',
  'club.link.paste': 'Reçu un lien ou un code ? Colle-le', 'club.record': 'Duels {w}V {l}D · Cups gagnées {p}', 'club.modesLine': 'Duel XV, Clubhouse Cup, Draft partagé et défis par lien.',

  // salons
  'mode.shared.name': 'Vivier commun', 'room.tag.shared': 'Vivier commun',
  'mode.coop.name': 'Draft partagé', 'mode.coop.desc': 'Deux joueurs, un seul XV. Vous alternez les choix sur le même tirage, puis l’hôte fixe le plan et la saison vous appartient à tous les deux.',
  'room.tag.coop': 'Draft partagé', 'room.pitch2coop': 'Un seul XV.', 'room.pitch3coop': 'Construit à deux.',
  'coop.yourTurn': 'À toi de choisir', 'coop.yourTurnAfter': 'À toi · {name} a pris {player}', 'coop.theirTurn': '{name} choisit', 'coop.status': 'À DEUX · AVEC {name}',
  'coop.ourXV': 'Notre XV', 'coop.hostDecides': '{name} fixe la feuille de match et le plan de jeu, puis joue la saison pour vous deux.',
  'coop.split': 'Choix : toi {me}, {name} {them}', 'coop.ourSeason': 'Notre saison',
  'cup.progress': 'Clubhouse Cup · par unité', 'cup.player': 'Joueur', 'cup.note': 'Note moyenne à son poste, par unité. Les choix et les scores de saison restent cachés jusqu’à la fin.',
  'room.partnerLeftTitle': 'Salon interrompu', 'room.partnerLeft': '{name} a quitté le salon. Ce format se joue à deux : impossible de continuer.', 'room.continueBots': 'Jouer le même format contre un bot',
  'room.botMate': 'Coéquipier bot', 'room.botName': 'XV maison', 'room.botN': 'Bot {n}', 'room.stillDrafting': 'draft en cours',
  'room.yourSeasonHidden': 'Ta saison est jouée. Les résultats seront révélés ensemble quand vous aurez tous les deux fini.',
  'duel.bothDone': 'Les deux saisons sont jouées', 'duel.seasonsPlayed': 'Deux XV. Un seul tirage.', 'duel.suspense': 'Aucun de vous n’a encore vu le résultat. Révèle le classement, puis les points, puis le vainqueur face à {name}.',
  'duel.reveal': 'Révéler', 'duel.table': 'Résultat du duel',

  // glossaire (touche un terme souligné en pointillés)
  'gloss.fit': 'Le FIT mesure à quel point ton XV fonctionne ensemble : joueurs à leur poste, aucun secteur sous le seuil du plan, rôles complémentaires. Il part de 100 et perd des points à chaque problème.',
  'gloss.responsibilities': 'Attribuées automatiquement : le capitaine historique si ton XV en compte un (sinon le mieux noté), le meilleur buteur (celui qu’utilise le modèle de saison) et le meilleur sauteur du pack.',
  'gloss.plan': 'Le plan de jeu pondère les dix secteurs dans le modèle de match et fixe les seuils de FIT. Il ne change jamais les joueurs draftés.',
  'gloss.eraScore': 'Les points de championnat sur 26 journées (5 au maximum par match : 4 pour une victoire plus un bonus). C’est le score des records et des défis ; ton classement et les phases finales racontent la saison.',
  'gloss.staffAreas': 'Six secteurs (conquête, combat, défense, attaque, occupation, vitesse), chacun comparé à la moyenne des treize adversaires de la Ligue ERA de cette saison.',
  'gloss.bonus': 'Règles internationales : bonus offensif pour 4 essais, bonus défensif pour une défaite de 7 points ou moins. Règles du Top 14 : bonus offensif pour une victoire avec 3 essais d’écart, bonus défensif à 5 points ou moins.',
  'gloss.plan.balanced': 'Aucun levier : solide partout, dominant nulle part en particulier.',
  'gloss.plan.pack': 'Gagner les phases statiques et la ligne d’avantage, puis étouffer l’adversaire.',
  'gloss.plan.flair': 'Garder le ballon vivant et jouer large : accepter le risque pour marquer de partout.',
  'gloss.plan.territory': 'Accepter de rendre le ballon pour gagner du terrain : jeu au pied, chasse, pression.',
  'gloss.plan.blitz': 'Monter vite en défense et gratter les ballons dans les rucks.',
  'gloss.plan.tempo': 'Ballons rapides et un 9 vif : ne jamais laisser la défense se replacer.',
  'gloss.group.front': 'Piliers (1, 3) et talonneur (2) : la mêlée repose sur eux. Seuls des spécialistes peuvent y jouer.',
  'gloss.group.second': 'Deuxièmes lignes (4, 5) : sauteurs en touche et moteur de la mêlée et du maul.',
  'gloss.group.backrow': 'Flankers (6, 7) et numéro 8 : plaquages, portés de balle et combat pour le ballon dans les rucks.',
  'gloss.group.halves': 'Le 9 accélère le jeu, le 10 décide où l’envoyer.',
  'gloss.group.centres': '12 et 13 : percer la ligne de défense, ou la tenir.',
  'gloss.group.back3': 'Ailiers (11, 14) et arrière (15) : finition, ballons hauts et dernier rempart.',
};
export default fr;
