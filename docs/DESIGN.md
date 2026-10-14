# ERA XV 2.0 / 2.1 — refonte « Modern Rugby Clubhouse » et boucle produit

## Identité

| Jeton | Valeur | Usage |
|---|---|---|
| `ink` / `ink-2` / `ink-3` / `ink-4` | #07110E / #101915 / #141E19 / #1A2620 | fond, panneaux, cartes, survol |
| `line` / `line-2` | #24322B / #34463D | filets, bordures |
| `chalk` | #F1EBDD | texte principal, plaques de numéro |
| `ash` / `ash-2` | #8E948B / #BDB8A8 | texte secondaire |
| `brass` / `brass-2` | #C8A45D / #E0C48C | accent unique : CTA principal, titre, capitaine |
| `win` / `loss` | #9FD36B / #E86961 | positif / problème réel — toujours doublés d'un signe (▲ ▼ ! ✓) |

- Typo : Archivo variable (titres en largeur 74 %, capitales) + IBM Plex Mono (libellés, chiffres, feuille de match). Polices embarquées (licences OFL dans `assets/fonts/`).
- Rayons 3–14 px, panneaux à filet plutôt que cartes flottantes, plaques de numéro, poteaux en H, ligne des 22 m (`.rule-22`), lignes de touche (`.touchlines`).
- Animations 150–350 ms (`rise`, `pop`, `fade`, `sheet`, `moment`), coupées par `prefers-reduced-motion` ou le réglage Mouvement réduit.

## Parcours

Accueil → Draft (15 choix, par unités) → **Feuille de match** → **Ton plan de match** → Saison (10–15 s, passable) → Résultat → **Débrief du staff** → Analyse complète (repliée) → Rejouer depuis un tour / mêmes tirages / défi.

| Écran | Fichier | Rôle |
|---|---|---|
| Accueil | `screens/Home.tsx` | « Toutes les époques. Un seul XV. », 3 CTA (Drafter mon XV, Défier un ami, Clubhouse), compteurs calculés depuis les données |
| Draft | `screens/Draft.tsx`, `components/rugby.tsx` | rail PACK / CHARNIÈRE / CENTRES / TRIANGLE ; cartes QUI / OÙ / APPORT (2 forces, variation de FIT, 2 notes max) ; moment « unité complète » de 2,6 s non bloquant |
| Feuille de match | `screens/XV.tsx` | XV par lignes, responsabilités (capitaine, buteur, annonceur), contrôle du XV (rouge = problème réel seulement), échanges + annuler |
| Plan de match | `screens/Plan.tsx` | 6 plans : FIT, points estimés, secteurs favorisés / en retrait, besoins ✓/✗, phrase de verdict calculée |
| Saison | `screens/Sim.tsx` | tableau d'affichage, rang, pastilles des 26 matchs, événements dérivés du classement réel (`engine/timeline.ts`), phases finales match par match |
| Résultat | `screens/Result.tsx` | position / qualification / titre d'abord ; note ERA /130 en second |
| Débrief du staff | `screens/Analysis.tsx` | 3 points → pourquoi → tournants (estimations étiquetées, rejouer depuis le tour) → analyse complète repliée |
| Clubhouse | `screens/Clubhouse.tsx`, `screens/Room.tsx` | Duel XV, Clubhouse Cup, Draft partagé, Vivier commun, défi par lien ; état réel des salons affiché |

## 2.1 — boucle produit (détail et backend : `docs/LAUNCH.md`)

Je drafte → je découvre mon XV → je simule → je comprends → je compare → je défie → quelqu'un joue → je reviens.

| Moment | Écran | Choix de conception |
|---|---|---|
| Accueil | `Home.tsx` | Trois actions : Drafter mon XV, Daily XV (état non joué / en cours / joué avec position et points / abandonné), Défier un ami ; puis Clubhouse, Archives, Profil ; reprise de partie en tête quand elle existe (Reprendre / Abandonner avec confirmation). |
| Draft | `Draft.tsx`, `Coach.tsx` | Un toucher = un choix. Onboarding de 4 conseils contextuels, première partie seulement, jamais bloquant, « Passer le tutoriel » définitif. Étiquette « Rare » mesurée, jamais un poids. |
| Après-match | `Result.tsx`, `Share.tsx` | Une action principale selon le contexte (défier ; répondre à X ; défier sur ce Daily), puis débrief, partage, Nouveau draft / Mêmes tirages, puis le Daily s'il reste à jouer. |
| Partage | `Share.tsx`, `shareCard.ts`, `share.ts` | Carte story 9:16 ou post 4:5, Web Share → copie → lien sélectionnable, enregistrement de l'image. |
| Défi reçu | `Challenges.tsx` | « X te défie · Mêmes 15 tirages. Mêmes conditions. Fais mieux. » ; comparaison position / points / FIT / différence / bonus / choix différents / choix décisif. |
| Rétention | `Profile.tsx`, `Archives.tsx` | Stats, tendances (à partir de 5 saisons), palmarès court (12), collection (joueurs, versions, équipes, raretés), historique rouvrable ; archives en listes filtrées par sélecteurs natifs. |
| Erreurs | `Notice.tsx`, `ErrorBoundary` | Chaque impasse dit ce qui s'est passé en une phrase et propose une sortie (nouvelle partie, accueil, effacer la partie en cours). |

## Moteur : ce qui a été ajouté (sans toucher au calcul)

- `engine/timeline.ts` : classement après chaque journée, événements (qualification mathématiquement acquise / perdue, prise de tête, série, match décisif), statut final.
- `engine/insights.ts` : informations de carte (poste de destination, variation de FIT, synergies complétées ou cassées, secteur renforcé) — informatives, jamais prescriptives.
- `engine/units.ts`, `engine/report.ts`, `engine/traits.ts` : progression par unités, responsabilités, rapport de plan, points du staff, diagnostic de composition, traits.
- Calibration N=400 régénérée : sortie identique octet pour octet à `docs/CALIBRATION.md`.

## Limites assumées

- Pas d'événement minute par minute : le moteur calcule des scores de match, pas une chronologie. La saison n'affiche que des faits tirés des résultats et du classement.
- Tournants = estimations (même XV avec un seul choix changé, placé au mieux, même calendrier), étiquetées comme telles.
- Capitaine historique renseigné pour 58 équipes-époques ; ailleurs, capitaine « choisi sur la note », affiché comme tel.
- Salons testés contre une maquette stricte du contrat `room`, pas contre la plateforme réelle.
- Le Draft partagé repose sur l'hôte : si l'hôte quitte, le salon s'arrête (pas de persistance, par construction de la capacité `room`).

## Améliorations futures — à ne PAS développer maintenant

- Variante EXPERT : banc de 8, répartitions 5–3 / 6–2, Bomb Squad.
- Météo, blessures, arbitres, cartons, fatigue, coaching en match, minute par minute, gestion de club (finances, contrats, transferts).
- Instantanés de données versionnés pour garder les anciens liens de défi jouables après une extension de la base.
- Classements globaux / XV du jour partagé (capacité `db`).
- Extension à 150–180 équipes-époques selon `src/data/README.md`.
