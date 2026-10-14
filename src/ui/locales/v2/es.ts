/** Textos de ERA XV 2.0 (rediseño Modern Rugby Clubhouse). Se fusionan sobre el diccionario base. */
const es: Record<string, string> = {
  // unidades y líneas de la hoja de partido
  'units.aria': 'Tu XV por unidades', 'units.itemAria': '{unit}: {n} de {max}',
  'unit2.pack': 'Pack', 'unit2.halves': 'Medios', 'unit2.centres': 'Centros', 'unit2.back3': 'Triángulo',
  'unit2.pack.short': 'PK', 'unit2.halves.short': 'ME', 'unit2.centres.short': 'CE', 'unit2.back3.short': 'TR',
  'group.front': 'Primera línea', 'group.second': 'Segunda línea', 'group.backrow': 'Tercera línea', 'group.halves': 'Medios', 'group.centres': 'Centros', 'group.back3': 'Triángulo trasero',
  'groupPoss.front': 'tu primera línea', 'groupPoss.second': 'tu segunda línea', 'groupPoss.backrow': 'tu tercera línea', 'groupPoss.halves': 'tus medios', 'groupPoss.centres': 'tus centros', 'groupPoss.back3': 'tu triángulo trasero',
  'moment.front': 'Tu primera línea está completa', 'moment.backrow': 'Tu tercera línea', 'moment.pack': 'Tu pack está completo', 'moment.halves': 'Tus medios', 'moment.centres': 'Tu pareja de centros', 'moment.back3': 'Tu triángulo trasero',
  'moment.starsAria': '{n} de 5',

  // inicio
  'home2.kicker': 'Rugby XV · la Liga ERA', 'home2.title1': 'Todas las épocas.', 'home2.title2': 'Un solo XV.',
  'home2.pitch': '15 elecciones. Leyendas de todas las generaciones. Arma tu equipo. Elige tu rugby. Desafía a la historia.',
  'home2.sheetAria': 'Los quince dorsales: pack, medios, centros, triángulo trasero',
  'home2.counts': '{players} jugadores · {versions} versiones · {teams} equipos-época',
  'home2.play': 'Draftear mi XV', 'home2.challenge': 'Retar a un amigo', 'home2.clubhouse': 'Clubhouse',
  'mode.classic.short': 'Valoraciones visibles', 'mode.iq.short': 'Valoraciones ocultas',

  // draft
'draft2.pick': 'Elección {n}/{max}', 'draft2.reroll': 'Cambiar', 'draft2.draw': 'Sorteo {n}',
  'draft.compatible': 'puesto compatible',
  'insight.frontRow': 'No es de primera línea: melés sin disputa', 'insight.oop': 'Fuera de puesto en el {slot}',
  'insight.complete.pack': 'Completa tu pack', 'insight.complete.halves': 'Completa tus medios', 'insight.complete.back3': 'Completa tu triángulo trasero',
  'insight.complete.centres': 'Completa tu pareja de centros', 'insight.complete.front': 'Completa tu primera línea', 'insight.complete.backrow': 'Completa tu tercera línea',
  'insight.fix.uncontested': 'Vuelve a disputar tu melé', 'insight.fix.noKicker': 'Te da un pateador', 'insight.fix.noJackal': 'Corrige tu falta de jackal',
  'insight.fix.noCaller': 'Da un jefe a tu touch', 'insight.fix.highBall': 'Asegura tus pelotas altas', 'insight.fix.slowBack3': 'Da velocidad a tu triángulo trasero', 'insight.fix.sameChannel': 'Desbloquea tu canal central',
  'insight.boost.scrum': 'Refuerza tu melé', 'insight.boost.lineout': 'Refuerza mucho tu touch', 'insight.boost.breakdown': 'Refuerza tu ruck', 'insight.boost.carry': 'Suma avance',
  'insight.boost.defence': 'Refuerza tu defensa', 'insight.boost.playmaking': 'Suma creación', 'insight.boost.kicking': 'Mejora tu juego al pie', 'insight.boost.strike': 'Suma definición',
  'insight.boost.pace': 'Suma velocidad', 'insight.boost.aerial': 'Refuerza tu juego aéreo',
  'insight.still.scrum': 'Melé todavía débil', 'insight.still.lineout': 'Touch todavía débil', 'insight.still.breakdown': 'Ruck todavía débil', 'insight.still.carry': 'Avance todavía débil',
  'insight.still.defence': 'Defensa todavía débil', 'insight.still.playmaking': 'Creación todavía débil', 'insight.still.kicking': 'Juego al pie todavía débil', 'insight.still.strike': 'Definición todavía débil',
  'insight.still.pace': 'Todavía falta velocidad', 'insight.still.aerial': 'Juego aéreo todavía débil',
  'trait.captain': 'Capitán', 'trait.poty': 'Jugador del año', 'trait.goalKicker': 'Pateador', 'trait.utility': 'Tres cuartos polivalente',
  'trait.jackal': 'Jackal', 'trait.lineoutBoss': 'Jefe del touch', 'trait.scrummager': 'Especialista de melé', 'trait.ballCarrier': 'Portador', 'trait.finisher': 'Finalizador',
  'trait.highBall': 'Especialista en pelotas altas', 'trait.playmaker': 'Creador', 'trait.distributor': 'Distribuidor', 'trait.defensiveLeader': 'Líder defensivo',

  // hoja de partido
  'sheet.title': 'Hoja de partido', 'sheet.cohesion': 'Cohesión', 'sheet.oop': 'Fuera de puesto', 'sheet.compat': 'Compatible', 'sheet.rowAria': 'Dorsal {n}: {name}',
  'sheet.view': 'Vista', 'sheet.view.sheet': 'Hoja', 'sheet.view.pitch': 'Campo',
  'sheet.next': 'Plan de partido', 'sheet.nextGauntlet': 'Plan de partido', 'sheet.nextHint': 'Plan actual: {plan}. Confírmalo o cámbialo en la siguiente pantalla.',
  'resp.title': 'Responsabilidades', 'resp.captain': 'Capitán', 'resp.captainHistoric': 'Capitán de {team}', 'resp.captainNamed': 'Designado por valoración',
  'resp.kicker': 'Pateador', 'resp.kickerSub': 'Mejor pie del XV', 'resp.lineout': 'Jefe del touch', 'resp.lineoutSub': 'Mejor saltador del pack',
  'resp.mark.captain': 'C', 'resp.mark.kicker': 'P', 'resp.mark.lineout': 'T',
  'diag.title': 'Diagnóstico de la alineación', 'diag.count_one': '{n} jugador fuera de su zona ideal.', 'diag.count_other': '{n} jugadores fuera de su zona ideal.',
  'diag.allCompatible': 'Solo polivalencia normal: ningún problema real.', 'diag.none': 'Todos juegan en su puesto natural.',
  'diag.impact': 'Impacto en el FIT', 'diag.impact.high': 'alto', 'diag.impact.medium': 'medio', 'diag.impact.low': 'bajo',

  // plan de partido
  'plan2.title': 'Tu plan de partido', 'plan2.intro': 'Los mismos quince, otras prioridades. El plan cambia lo que tu XV necesita (umbrales de FIT) y cómo juega en el modelo de temporada.',
  'plan2.play': 'Jugar la temporada · {plan}', 'plan2.favoured': 'Favorecidos', 'plan2.reduced': 'En segundo plano', 'plan2.none': 'Ninguno', 'plan2.needs': 'Requisitos (tu XV / umbral)', 'plan2.philosophy': 'Filosofía',
  'plan2.limited': '{dim} en {v} para {thr} requeridos: eso es lo que limita este plan.',
  'plan2.natural2': 'Con {a} y {b}, tu XV está naturalmente hecho para este plan.', 'plan2.natural1': 'Con {a}, tu XV está naturalmente hecho para este plan.',
  'plan2.natural0': 'Ninguna faceta de tu XV por debajo de su umbral: este plan le va bien.', 'plan2.workable': 'Jugable con un FIT de {fit}: nada lo bloquea, nada lo impulsa en particular.',

  'plan2.playShort': 'Jugar la temporada',
  // temporada
  'story.league': 'Liga ERA · fase regular', 'story.round': 'J{n}/{max}', 'story.board': 'Clasificación en directo', 'story.rank': 'Puesto', 'story.pts': 'Pts',
  'story.top6': 'Los 6 primeros se clasifican', 'story.feed': 'Resultados', 'story.j': 'J{n}', 'story.res.W': 'Victoria', 'story.res.D': 'Empate', 'story.res.L': 'Derrota',
  'story.q.in': 'Clasificado', 'story.q.out': 'Sin opciones', 'story.q.inside': 'En el top 6', 'story.q.outside': 'Fuera del top 6',
  'story.exploit': 'Hazaña en casa de {opp}', 'story.statement': 'Victoria de autoridad ante {opp}', 'story.tries': '{n} tries ante {opp}',
  'story.streak': '{n} victorias seguidas', 'story.losingRun': '{n} derrotas seguidas', 'story.firstDefeat': 'Primera derrota tras {n} partidos invicto',
  'story.intoTop6': 'Entras en el top 6 ({ord})', 'story.outOfTop6': 'Caes al puesto {ord}', 'story.leader': 'Líder de la Liga ERA',
  'story.clinched': 'Clasificación asegurada', 'story.clinchedTop2': 'Top 2 asegurado: directo a semifinales', 'story.eliminated': 'Eliminatorias fuera de alcance',
  'story.decider': 'Última jornada decisiva', 'story.regular': 'Fase regular', 'story.bye': 'Top 2: directo a semifinales',
  'story.noPlayoffs': 'Sin eliminatorias esta temporada', 'story.finalWon': '{team} gana la final del Escudo ERA {score}.',
  'story.champion': 'Campeones', 'story.toFinal': 'A la final', 'story.toSemi': 'A semifinales', 'story.out': 'Eliminados', 'story.toResult': 'Ver el resultado →',

  // resultado
  'standing.champion': 'Campeones de la Liga ERA', 'standing.finalist': 'Finalistas', 'standing.semi': 'Semifinalistas', 'standing.quarter': 'Eliminados en cuartos',
  'standing.playoffs': 'Eliminatorias', 'standing.doorstep': 'A las puertas de las eliminatorias', 'standing.midtable': 'Fuera de las eliminatorias', 'standing.bottom': 'Zona baja de la tabla',
  'result.seasonOver': 'Temporada terminada · Liga ERA', 'result.shield': 'Ganadores del Escudo ERA, fase regular y eliminatorias.', 'result.qualified': 'Clasificados para las eliminatorias', 'result.regularOf': 'Fase regular · {n} equipos',
  'result.k.pts': 'Puntos', 'result.k.record': 'G-E-P', 'result.k.diff': 'Dif', 'result.k.bonus': 'Bonus',
  'result.eraScore': 'Nota ERA {pts} / {max}', 'result.eraScoreLabel': '¿Qué es la nota ERA?',
  'result.debrief': 'Informe del staff', 'result.challenge2': 'Retar a un amigo', 'result.sheet': 'Tu hoja de partido', 'result.aria2': '{label}, {pts} puntos de liga',
  'gauntlet.legendsN': '{n} de {max} leyendas vencidas',

  // reto
  'ch.title': 'Reto', 'ch.finished': '{who} terminó', 'ch.ptsLine': '{pts} pts · {w}G {d}E {l}P', 'ch.same2': 'Los mismos 15 sorteos. El mismo calendario.', 'ch.beat2': 'Te toca.',
  'ch.duelTitle': 'Reto · mismo sorteo', 'ch.col.xv': 'XV', 'ch.col.rank': 'Pos', 'ch.col.pts': 'Pts',
  'ch.estimate': 'Estimación: el mismo XV con solo esa elección cambiada, en el mismo calendario.',
  'shareText.challenge2': 'ERA XV: {where}, {pts} pts. Los mismos 15 sorteos, el mismo calendario. ¿Le ganas a mi XV?',
  'card.stats': '{pts} pts · {w}G {d}E {l}P · Dif {diff} · {bp} bonus',
  'share.challengeTitle2': 'Retar a un amigo', 'share.fair': 'Tu amigo recibe exactamente los mismos sorteos, las mismas ofertas y el mismo calendario de la Liga ERA. Solo cambian las elecciones.',

  // informe del staff
  'debrief.title': 'Informe del staff', 'debrief.three': 'Tu XV en 3 puntos', 'debrief.noEdge': 'Ninguna faceta claramente por encima de la liga esta temporada.',
  'debrief.why': 'Por qué tu temporada se decidió así',
  'debrief.fit': 'Cohesión {n}: por debajo de 90, tu XV pierde eficacia en todas las fases (mira el diagnóstico de la alineación).', 'debrief.fitGood': 'Cohesión {n}: tu XV juega como un bloque.',
  'debrief.estimates': 'estimaciones', 'debrief.yourPick': 'Tu elección', 'debrief.more': 'Ir más allá', 'debrief.tactical': 'Análisis táctico completo', 'debrief.bonusTerm': 'Puntos bonus',
  'debrief.vsLeagueUp': '+{n} sobre la media de la liga', 'debrief.vsLeagueDown': '−{n} bajo la media de la liga',
  'staff.setpiece.up': 'Obtención dominante', 'staff.setpiece.down': 'Obtención frágil', 'staff.setpiece.low': 'Obtención: tu faceta menos fuerte',
  'staff.collision.up': 'Contacto ganado', 'staff.collision.down': 'Contacto perdido', 'staff.collision.low': 'Contacto: tu faceta menos fuerte',
  'staff.defence.up': 'Defensa sólida', 'staff.defence.down': 'Defensa permeable', 'staff.defence.low': 'Defensa: tu faceta menos fuerte',
  'staff.attack.up': 'Ataque creativo', 'staff.attack.down': 'Ataque estéril', 'staff.attack.low': 'Ataque: tu faceta menos fuerte',
  'staff.territory.up': 'Control territorial', 'staff.territory.down': 'Control territorial insuficiente', 'staff.territory.low': 'Territorio: tu faceta menos fuerte',
  'staff.pace.up': 'Velocidad superior', 'staff.pace.down': 'Falta de velocidad', 'staff.pace.low': 'Velocidad: tu faceta menos fuerte',

  // ficha
  'inspect.level2': 'Perfil completo', 'inspect.level2sub': 'Por qué esta valoración, valoración por puesto', 'inspect.level3': 'Datos e historia', 'inspect.level3sub': 'Atributos, palmarés, otras versiones',

  // clubhouse
  'club.kicker': 'Multijugador', 'club.title': 'Clubhouse', 'club.intro': 'La misma semilla, los mismos 15 sorteos: el draft decide.',
  'club.checking': 'Comprobando las salas en vivo…', 'club.liveOn': 'Salas en vivo disponibles', 'club.liveOff': 'Salas en vivo no disponibles aquí: práctica contra bots',
  'club.duel.title': 'Duelo XV', 'club.duel.l1': '2 jugadores, los mismos 15 sorteos', 'club.duel.l2': 'Elecciones confirmadas en secreto, reveladas juntas', 'club.duel.l3': 'Clasificación, luego puntos, luego el ganador', 'club.duel.create': 'Crear un duelo',
  'club.cup.title': 'Clubhouse Cup', 'club.cup.l1': 'De 2 a 8 jugadores, el mismo draft, cada uno a su ritmo', 'club.cup.l2': 'Fuerza por unidades visible durante el draft', 'club.cup.l3': 'Clasificación final al terminar', 'club.cup.create': 'Crear una Cup',
  'club.coop.title': 'Draft compartido', 'club.coop.l1': '2 jugadores arman UN solo XV', 'club.coop.l2': 'Elecciones alternas sobre el mismo sorteo', 'club.coop.l3': 'Una temporada, un resultado para los dos', 'club.coop.create': 'Crear',
  'club.pool.title': 'Grupo común', 'club.pool.l1': '1 contra 1, un solo grupo: lo que tú eliges, tu rival lo pierde', 'club.pool.l2': 'La primera elección se alterna cada ronda', 'club.pool.create': 'Crear',
  'club.practice': 'Practicar con bots', 'club.offNote': 'Las salas en vivo necesitan un visitante con sesión iniciada en la página publicada. La práctica funciona en todas partes.',
  'club.link.title': 'Reto por enlace', 'club.link.line': 'Juega y envía tu draft: tu amigo rejuega exactamente los mismos sorteos y comparáis clasificación, puntos y elecciones.',
  'club.link.paste': '¿Recibiste un enlace o un código? Pégalo', 'club.record': 'Duelos {w}G {l}P · Cups ganadas {p}', 'club.modesLine': 'Duelo XV, Clubhouse Cup, Draft compartido y retos por enlace.',

  // salas
  'mode.shared.name': 'Grupo común', 'room.tag.shared': 'Grupo común',
  'mode.coop.name': 'Draft compartido', 'mode.coop.desc': 'Dos jugadores, un solo XV. Alternáis las elecciones sobre el mismo sorteo, luego el anfitrión fija el plan y la temporada es de los dos.',
  'room.tag.coop': 'Draft compartido', 'room.pitch2coop': 'Un solo XV.', 'room.pitch3coop': 'Armado entre dos.',
  'coop.yourTurn': 'Te toca elegir', 'coop.yourTurnAfter': 'Te toca · {name} eligió a {player}', 'coop.theirTurn': '{name} está eligiendo', 'coop.status': 'EN EQUIPO · CON {name}',
  'coop.ourXV': 'Nuestro XV', 'coop.hostDecides': '{name} fija la hoja de partido y el plan de juego, y juega la temporada por los dos.',
  'coop.split': 'Elecciones: tú {me}, {name} {them}', 'coop.ourSeason': 'Nuestra temporada',
  'cup.progress': 'Clubhouse Cup · por unidades', 'cup.player': 'Jugador', 'cup.note': 'Valoración media en su puesto, por unidad. Las elecciones y las puntuaciones de temporada siguen ocultas hasta el final.',
  'room.partnerLeftTitle': 'Sala interrumpida', 'room.partnerLeft': '{name} ha salido de la sala. Este formato necesita a los dos jugadores: no puede continuar.', 'room.continueBots': 'Jugar el mismo formato contra un bot',
  'room.botMate': 'Compañero bot', 'room.botName': 'XV de la casa', 'room.botN': 'Bot {n}', 'room.stillDrafting': 'draft en curso',
  'room.yourSeasonHidden': 'Tu temporada está jugada. Los resultados se revelan juntos cuando los dos hayáis terminado.',
  'duel.bothDone': 'Las dos temporadas están jugadas', 'duel.seasonsPlayed': 'Dos XV. Un solo sorteo.', 'duel.suspense': 'Ninguno de los dos ha visto aún el resultado. Revela la clasificación, luego los puntos y después el ganador frente a {name}.',
  'duel.reveal': 'Revelar', 'duel.table': 'Resultado del duelo',

  // glosario
  'gloss.fit': 'El FIT mide lo bien que funciona tu XV en conjunto: jugadores en su puesto, ninguna faceta bajo el umbral del plan, roles complementarios. Empieza en 100 y pierde puntos con cada problema.',
  'gloss.responsibilities': 'Asignadas automáticamente: el capitán histórico si tu XV tiene uno (si no, el mejor valorado), el mejor pateador (el que usa el modelo de temporada) y el mejor saltador del pack.',
  'gloss.plan': 'El plan de juego pondera las diez facetas en el modelo de partido y fija los umbrales de FIT. Nunca cambia a quién elegiste.',
  'gloss.eraScore': 'Los puntos de liga en 26 jornadas (5 como máximo por partido: 4 por victoria más un bonus). Es la puntuación de los récords y los retos; tu puesto y las eliminatorias cuentan la temporada.',
  'gloss.staffAreas': 'Seis facetas (obtención, contacto, defensa, ataque, territorio, velocidad), cada una comparada con la media de los trece rivales de la Liga ERA de esta temporada.',
  'gloss.bonus': 'Reglas internacionales: bonus ofensivo por 4 tries, bonus defensivo por perder por 7 puntos o menos. Reglas del Top 14: bonus ofensivo por ganar con 3 tries de diferencia, bonus defensivo por perder por 5 o menos.',
  'gloss.plan.balanced': 'Sin palanca: sólido en todo, dominante en nada en particular.',
  'gloss.plan.pack': 'Ganar las fases estáticas y la línea de ventaja, y asfixiar al rival.',
  'gloss.plan.flair': 'Mantener la pelota viva y jugar ancho: aceptar el riesgo para anotar desde cualquier parte.',
  'gloss.plan.territory': 'Aceptar devolver la pelota para ganar terreno: patear, perseguir, presionar.',
  'gloss.plan.blitz': 'Subir rápido en defensa y robar pelotas en el ruck.',
  'gloss.plan.tempo': 'Pelotas rápidas y un 9 vivo: que la defensa nunca se reorganice.',
  'gloss.group.front': 'Pilares (1, 3) y hooker (2): la melé descansa sobre ellos. Solo especialistas pueden jugar ahí.',
  'gloss.group.second': 'Segundas líneas (4, 5): saltadores del touch y motor de la melé y el maul.',
  'gloss.group.backrow': 'Flankers (6, 7) y número 8: placaje, portes de pelota y lucha por la pelota en el ruck.',
  'gloss.group.halves': 'El 9 acelera el juego, el 10 decide adónde enviarlo.',
  'gloss.group.centres': '12 y 13: romper la línea defensiva, o sostenerla.',
  'gloss.group.back3': 'Alas (11, 14) y zaguero (15): definición, pelotas altas y última línea de defensa.',
};
export default es;
