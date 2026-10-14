# ERA XV — passe pré-lancement (2.1)

Ce document sépare ce qui fonctionne déjà sans serveur de ce qui demande une infrastructure, et fixe les contrats pour la brancher sans toucher au jeu.

## Ce qui tourne sans backend

| Fonction | Où | Garantie |
|---|---|---|
| Daily XV | `engine/featured.ts`, `ui/daily.ts` | Graine = f(date UTC) (`dailySeed`, nom public `ERA-XV-AAAA-MM-JJ`) : mêmes tirages, règles et calendrier pour tous. Une tentative officielle par jour et par appareil (verrouillée dès le premier choix, conservée si la page recharge), entraînements séparés et étiquetés, série non punitive (la meilleure série reste). |
| Défi hebdomadaire / événements | `engine/featured.ts`, `engine/themes.ts` | Modèle unique `FeaturedChallenge` (id, titre, dates, graine, filtres, règles, mode, officiel, `leaderboardEnabled`). Un événement = une entrée de données, pas un écran. |
| Défis asynchrones | `ui/challenges.ts`, `screens/Challenges.tsx` | Lien = tirage + choix + placement + plan + score. Tout résultat est recalculé depuis son lien avant d'être stocké ou comparé ; un lien retouché est refusé. |
| Historique versionné | `ui/store.ts` (`GameLog` v2), `ui/history.ts` | `versions {engine, data, rules, modes}`, `drawId`, `kind`, `challengeId`, position ; migration des parties 2.0 ; toute partie se rouvre depuis son lien. |
| Reprise | `ui/resume.ts` | Sauvegarde à chaque étape (draft, feuille, plan), refus propre si corrompue ou d'une autre version. |
| Profil, palmarès, collection, archives | `ui/profile.ts`, `ui/trophies.ts`, `screens/Profile.tsx`, `screens/Archives.tsx` | Dérivés uniquement de l'historique de l'appareil. |
| Rareté de rencontre | `scripts/encounters.ts` → `data/encounters.ts`, `engine/rarity.ts` | Mesurée sur 6 000 drafts réels ; étiquette seulement (voir plus bas). |
| Analytics locales | `ui/analytics.ts` | `trackEvent` / `track`, entonnoir, perfs, erreurs ; tampon local visible dans Réglages. |

## Ce qui demande une infrastructure

### 1. Classements (Daily, hebdo, amis, Clubhouse)

Aucun classement global n'existe dans cette build : `serverBoard` vaut `null` (`ui/leaderboard.ts`), et le Clubhouse n'affiche que « toi + les liens d'amis vérifiés sur cet appareil », étiqueté comme tel.

Contrat serveur (tout le calcul existe déjà, en TypeScript pur, exécutable dans Node) :

```
POST /entries { token, drawId }
  → officialEntry(token, drawSpec)           // engine/official.ts : rejoue la draft, vérifie le placement, recalcule la saison
  → refuse 'wrong_draw' | 'replay' | 'lineup' | 'score_mismatch' | version différente
  → une entrée par (joueur, drawId) : la première, jamais remplacée
GET /boards/:drawId?limit=50 → [{ name, points, position, fit }]
```

À ajouter côté serveur : une identité minimale (pseudonyme + identifiant anonyme, pas d'email), l'unicité par tirage, un filtre de pseudonymes, et le stockage. Le client n'envoie jamais un score seul ; la règle est testée dans `tests/launch.test.ts` (`acceptSubmission`).

Limite honnête sans serveur : l'unicité de la tentative officielle est tenue par l'appareil (vider le stockage du navigateur la réinitialise). Un classement compétitif doit donc attendre le serveur.

### 2. Profil multi-appareils

Tout est dans le `localStorage` de l'appareil (espace `era-xv:`), exportable depuis Réglages. Une synchronisation demandera un compte ou un lien de récupération ; les structures (`GameLog` v2, `DailyStore`, `ChallengeRec`, `Passport`) sont déjà sérialisables telles quelles.

### 3. Analytics distantes

`ERA_ANALYTICS_URL=https://… npm run build` branche un envoi par lots (`sendBeacon`, repli `fetch keepalive`) sans fournisseur imposé. Dans l'artefact, la page ne peut joindre aucun autre hôte : les événements restent locaux. Événements : `home_view`, `game_started`, `draft_round_viewed`, `player_selected`, `draft_abandoned`, `draft_resumed`, `draft_completed`, `game_plan_selected`, `simulation_started`, `simulation_skipped`, `season_completed`, `playoffs_reached`, `champion`, `analysis_opened`, `turning_point_replayed`, `replay_started`, `challenge_created|shared|opened|accepted|completed`, `challenge_link_error`, `daily_viewed|started|completed`, `share_clicked|completed`, `profile_opened`, `archives_opened`, `clubhouse_opened`, `mode_selected`, `onboarding_step|skipped`, `achievement_unlocked`, `perf`, `error`. Les clés `name|token|email|url|link|text|nick` sont supprimées avant tout envoi.

Entonnoir prêt (`funnel()`) : accueil → début → tour 5 → tour 10 → tour 15 → simulation → résultat → analyse / rejouer / défi → défi accepté ; Daily vu → Daily joué.

### 4. Temps réel

Les salons (Duel XV, Clubhouse Cup, Draft partagé, Vivier commun) reposent sur la capacité `room` de l'artefact : présence seule, rien de persistant. Hors artefact, il faudra un relais (WebSocket) implémentant la même interface que `ui/room/transport.ts`. Tant qu'il n'existe pas, le Clubhouse l'annonce et désactive la création.

## Partage

- Web Share API (téléphone) avec l'image quand le navigateur accepte les fichiers ; sinon copie « texte + lien » ; sinon le lien reste affiché et sélectionnable.
- Dans l'artefact, la page est cadrée : Web Share est refusé, la copie prend le relais. L'image se télécharge via la capacité `downloads` (confirmation du visiteur).
- Liens : `…#<jeton>` pour un défi, `…#r-<code>` pour un salon. Dans l'artefact, seul un fragment simple (lettres, chiffres, `-_.~`) atteint la page, ce que respectent les jetons (base64url).

## Rareté de rencontre

Mesure du directeur de draft réel (6 000 drafts classiques) : 5 % des versions les moins proposées sont « Rares », 1 % « Très rares ». Moyenne de note des versions rares : 84,6 contre 85,3 pour la base : rareté ≠ puissance. L'étiquette n'agit sur rien (tirages, notes, saisons) et n'apparaît que dans les modes à base complète, où la mesure est valable.

Non activé volontairement : une pondération des tirages par rareté. Elle changerait les tirages de chaque graine (nouvelle version du moteur, tous les liens de défi invalidés, calibration à refaire) sans gain d'équité. À envisager seulement comme un mode événementiel dédié, après lancement.

Après toute modification des données : `npx tsx scripts/encounters.ts` (un test échoue tant que la table n'est pas régénérée).

## Performance (build 2.1)

Mesure Playwright/Chromium (3 chargements par palier), fichier servi localement : page prête ≈ 0,25 s, premier tirage affiché ≈ 0,1 s après le clic ; processeur ralenti ×4 : ≈ 1,0 s et ≈ 0,3 s ; ×6 : ≈ 1,3 s et ≈ 0,35 s. Toutes les données tiennent dans un seul fichier de ≈ 0,8 Mo (0,9 Mo en version autonome), dont 157 Ko de polices. Les archives et l'historique ne se calculent qu'à l'ouverture de leur écran ; le rattrapage des anciennes parties se fait par lots de 6 pour ne pas bloquer l'interface.

## Droits et contenus à valider juridiquement

Aucune photo, aucun logo, aucun visuel de club ou de compétition n'est embarqué. À faire relire avant lancement public :

- Noms réels de joueurs, de clubs et de sélections, utilisés comme texte ; notes présentées comme des estimations éditoriales.
- Noms de compétitions et de distinctions cités comme faits : Coupe du monde, Tournoi des Six Nations / Grand Chelem, Coupe d'Europe, Super Rugby, Top 14, Premiership, URC, British & Irish Lions, joueur de l'année World Rugby.
- Couleurs d'équipe (simples codes hexadécimaux, pas de blason).
- Polices Archivo et IBM Plex Mono : licence SIL OFL, fichiers de licence inclus (`assets/fonts/`).

## Reste avant un lancement public

1. Test sur vrais téléphones (Safari iOS, Chrome Android) : la QA automatisée tourne sous Chromium avec émulation mobile, WebKit n'est pas disponible dans cet environnement.
2. Choix d'hébergement : l'artefact claude.ai sert de préversion ; un domaine propre est nécessaire pour les analytics distantes, les classements et un partage Web Share natif.
3. Revue juridique des éléments listés ci-dessus.
