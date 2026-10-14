# ERA XI → ERA XV : ce qui a été repris, ce qui a changé

ERA XV reprend la boucle, l'identité visuelle et l'architecture d'ERA XI V1.7 (moteur pur TS + UI React, jeu déterministe par graine, liens de défi rejouables, salons en direct). Tout ce qui dépendait du football a été réécrit pour le rugby à XV ; rien du football ne subsiste dans le code, les données ou les textes.

## Repris tel quel (mécanique)

- Boucle en une minute : 15 tirages équipe + époque, 4 options par tirage, 1 relance (0 en Sans relance, Duel en direct et Draft partagée).
- Directeur de draft : option vedette + 2 options standard + option « sur mesure » (à partir du tour 5 ou dès qu'il le faut) qui garantit qu'un XV complet à son poste reste possible ; amortissement des versions multiples d'un même joueur.
- Déterminisme : même graine → mêmes offres, même calendrier, même chance (nombres aléatoires communs, Poisson par CDF inverse) ; c'est ce qui rend les défis équitables.
- Jetons de défi binaires en base64url (version moteur, version données, mode, plan, règles, graine, relance, 15 choix, placement, points, nom, somme de contrôle), validés par rejeu de la draft et recalcul de la saison.
- Salons en direct sur la capacité `room` (présence seule), regroupés en 2.0 dans le **Clubhouse** : Duel XV à choix cachés (engagement puis révélation), Vivier commun (ex-« draft partagée » : un joueur pris n'est plus disponible pour l'autre), Clubhouse Cup (jusqu'à 8, progression par unités), Draft partagé (nouveau : un seul XV construit à deux, choix alternés) ; bots d'entraînement quand la capacité est absente.
- Écrans : accueil, modes, draft, feuille de match, plan de match, saison, résultat, débrief du staff, fiche joueur, records (records, passeport, ADN de draft, succès), galerie, école, réglages, défi, Clubhouse, salon. EN / FR / ES. Refonte 2.0 : `docs/DESIGN.md`.
- Les 19 modes, avec leur équivalent rugby : Un seul championnat → **Un seul pays** (XV nationaux + clubs du pays), XI mondial → **XV Mondial**, Draft par poste → **Draft par numéro**.

## Transposé

| ERA XI (football) | ERA XV (rugby à XV) | Pourquoi |
|---|---|---|
| Formations (4-3-3, 4-4-2…) | 15 numéros fixes | Au rugby, la structure est fixe ; la variable stratégique est le plan de jeu |
| Style tactique | 6 plans de jeu : Équilibré, Puissance du pack, Rugby champagne, Occupation, Défense montée, Tempo | Chaque plan pondère les 10 secteurs dans le moteur de match et fixe ses seuils de FIT |
| Gardien obligatoire | Sécurité de la première ligne : un non-spécialiste en 1, 2 ou 3 → mêlées simulées (facteur 0,45, pénalité FIT la plus lourde) | Règle réelle : sans première ligne qualifiée, mêlées sans contestation |
| Tireur de penalty implicite | Buteur : le meilleur pied du XV tente transformations et pénalités, quel que soit son numéro | Au rugby, le buteur pèse directement sur le score |
| Rôles de foot | 27 rôles (pilier de mêlée, talonneur mobile, patron de touche, gratteur, n°8 perforateur, neuf tempo, ouvreur stratège, deuxième ouvreur…) | Rôles réels du jeu, avec forces, besoins et risques affichés dans l'École des rôles |
| Axes (attaque, milieu, défense…) | 10 secteurs : mêlée, touche, rucks, avancée, défense, animation, jeu au pied, finition, vitesse, jeu aérien | Les phases réelles d'un match de rugby |
| Buts marqués / encaissés | Essais (5), transformations (2), pénalités et drops (3) ; barème moderne appliqué à toutes les époques | Comparabilité entre époques |
| 3 pts victoire / 1 nul | Victoire 4, nul 2 + bonus. Règles **International** (4 essais ; défaite ≤ 7) ou **Top 14** (victoire avec 3 essais d'écart ; défaite ≤ 5) | Les deux barèmes de bonus en vigueur ; 5 pts max par match → 130 pts sur 26 matchs |
| 38 journées | Ligue ERA : 14 équipes, aller-retour, 26 journées, puis phases finales à 6 (barrages 3-6 et 4-5, demies, finale) | Format des championnats de rugby (Top 14, Premiership, URC) |
| Tirs au but en élimination | Prolongation puis séance de tirs au but | Règle des phases finales de Coupe du monde |
| Synergies de foot | 14 liaisons lisibles : charnière tempo, paire de centres perforateur + créateur, salle des machines, troisième ligne équilibrée, pied-pression… et leurs contraires (pas de gratteur, pas de buteur, pas d'annonceur en touche, même couloir, triangle arrière lent ou exposé) | Chaque point de FIT est expliqué à l'écran |
| Familiarité de poste | 8 niveaux, du naturel (1,00) au hors poste (0,55) et première ligne (0,45), avec des proximités propres au rugby (flanker ↔ n°8, ouvreur → centre/arrière, ailier ↔ arrière, pilier gauche → droit) | Les reconversions réelles, pas une grille générique |
| Données de clubs et sélections de foot | 90 équipes-époques de rugby, de l'ère amateur (≤ 1995) à aujourd'hui (2018–2025), palmarès structuré (Coupes du monde, Grands Chelems, Coupe d'Europe, Super Rugby, tournées des Lions, titres nationaux, joueurs de l'année World Rugby) | Toute la culture affichée provient de ces données structurées |

## Moteur de match (résumé)

Chaque XV est réduit à 5 composantes pondérées par son plan : conquête (mêlée, touche), combat (avancée, rucks, défense), attaque (animation, finition, vitesse), jeu au pied (pied, aérien), défense. Le FIT ajoute de la cohésion partout. La domination territoriale (sigmoïde des écarts de conquête, de combat et de jeu au pied, avantage du terrain) module les essais attendus (Poisson) et les pénalités tentées ; la réussite au pied dépend du buteur ; l'ouvreur apporte des drops. Les écarts sont adoucis au-delà de ±10 (tanh) pour qu'un XV bancal gagne encore quelques matchs.

## Calibration (400 drafts par profil, règles International)

| Profil | Points moyens / 130 | Victoires / 26 | FIT médian |
|---|---|---|---|
| Compétent (reste à son poste, équilibre) | 90,6 (p10 76 · p90 105 · max 116) | 18,8 | 100 |
| Chasseur de stars (toujours la meilleure note) | 39,2 | 7,4 | 30 |
| Aléatoire | 20,2 | 3,6 | 31 |

Même XV, 300 saisons sur le même calendrier : moyenne 92,5, fourchette à 80 % 83–102. Détail : `docs/CALIBRATION.md`.

Conséquence voulue : la meilleure note n'est pas le meilleur choix. Un XV de stars mal placées perd lourdement ; c'est la leçon centrale du jeu, comme dans ERA XI.

## Non repris

- Invite d'installation PWA et service worker : impossibles dans un artefact.
- Emplacement sponsor et règles personnalisées ERA+ : couche commerciale d'ERA XI, hors périmètre de cette version.
- Classements globaux et classement du XV du jour : demanderaient un stockage partagé (capacité `db`).
