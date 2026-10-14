# ERA XV 2.1

**Toutes les époques. Un seul XV.**

> © 2026 Florian Iglesias — Tous droits réservés. Ce dépôt est public à titre de portfolio uniquement.
> Aucune licence n'est concédée : copie, modification, distribution ou exploitation interdites sans accord écrit. Voir [LICENSE](LICENSE). Jeu de draft de rugby à XV : 15 choix, un XV, une saison, puis comparer, défier, revenir demain.

15 tirages « équipe + époque », un joueur par tirage, placement automatique sur les 15 numéros, plan de match, saison simulée de 26 matchs dans la Ligue ERA (14 équipes historiques, barème à bonus, phases finales à 6). Dérivé du moteur ERA XI (football), entièrement séparé de lui.

- **2.0** : refonte UX/UI « Modern Rugby Clubhouse » (`docs/DESIGN.md`).
- **2.1** : passe pré-lancement — Daily XV officiel, défis asynchrones, partage, profil, palmarès, collection, archives, onboarding, historique versionné, analytics, validateur et import de données (`docs/LAUNCH.md`).

Aucune des deux versions ne change le calcul : la calibration N=400 reste identique octet pour octet à `docs/CALIBRATION.md`.

## Contenu

| Chemin | Rôle |
|---|---|
| `src/engine/` | Moteur pur TypeScript (aucune dépendance au navigateur). Cœur : postes, placement, match, saison, draft, modes, défis, bots. 2.0 : récit de saison, informations de draft, unités, rapports, traits. **2.1** : `official.ts` (validation d'un résultat par recalcul, versions), `featured.ts` (Daily, hebdo, événements : un seul modèle), `themes.ts` (filtres de pool réutilisables), `rarity.ts` |
| `src/data/` | 90 équipes-époques, 2 118 versions, 1 476 joueurs ; `validate.ts`, `captains.ts`, `encounters.ts` (généré) ; règles d'extension : `src/data/README.md` |
| `src/ui/` | React 18 + Tailwind v4. **2.1** : `daily.ts`, `challenges.ts`, `history.ts`, `resume.ts`, `profile.ts`, `trophies.ts`, `leaderboard.ts`, `share.ts`, `analytics.ts` ; écrans Profil, Archives, Mes défis, Partage, Notice (états d'erreur) ; `components/Coach.tsx` (onboarding), `components/compare.tsx` |
| `tests/` | 83 tests : moteur, refonte 2.0, garanties de lancement (graines, Daily, défis, reprise, versions, filtres, validateur, score officiel, rareté, classements, rétention) |
| `e2e/e2e.py` | Parcours complets dans Chromium à 320 / 360 / 375 / 390 / 430 / 1280 px, dont rétention (première visite, lendemain, abandon au tour 8), défis, salons en direct sur `e2e/room-mock.js` |
| `scripts/` | Build, polices, calibration, audit et import de données, rareté de rencontre, contrôle i18n |
| `docs/` | `LAUNCH.md` (pré-lancement, backend, droits), `DESIGN.md`, `RUGBY.md`, `CALIBRATION.md`, `data-quality.md`, `data-import-sample.csv` |
| `dist/` | Généré par `npm run build`, non versionné : `era-xv.html` (artefact, React depuis cdnjs avec contrôle d'intégrité SRI) et `era-xv.standalone.html` (autonome, hors ligne, CSP stricte) |

## Commandes

```bash
npm ci
npm run build          # dist/era-xv.html + dist/era-xv.standalone.html ; ERA_ANALYTICS_URL=… pour un envoi d'analytics
npm run check          # typecheck + tests + i18n + audit des données
npm run calibrate      # N=400 ; --write pour régénérer CALIBRATION.md
npm run encounters     # après toute modification des données
npm run import:data -- check fichier.csv
npm run e2e            # python3 + playwright (Chromium) ; captures dans e2e/shots/
```

## Publication en artefact

`dist/era-xv.html`, capacités `{ "room": {}, "downloads": true }` : salons en direct (présence seule) et enregistrement de la carte de partage (le visiteur confirme). Tout le reste (Daily, défis, profil, historique) vit dans le stockage local de l'appareil ; aucun classement global n'est affiché tant qu'aucun serveur ne vérifie les résultats.

## Limites connues

- Unicité de la tentative officielle du Daily tenue par l'appareil ; classements compétitifs et profil multi-appareils : backend requis (`docs/LAUNCH.md`).
- QA automatisée sous Chromium avec émulation mobile ; test sur Safari iOS et Chrome Android réels à faire.
- Salons en direct testés contre une maquette stricte du contrat `room`.
- Notes = estimations éditoriales (`docs/data-quality.md`).

## Sécurité

- Les liens de défi et les présences des salons en direct sont des données non fiables : formes validées, scores recalculés à partir des choix, noms nettoyés (caractères de contrôle, invisibles et d'inversion bidirectionnelle retirés, 24 caractères max).
- `dist/era-xv.html` charge React depuis cdnjs avec empreinte SRI : un fichier altéré sur le CDN est refusé par le navigateur.
- `dist/era-xv.standalone.html` porte une Content-Security-Policy qui interdit toute connexion réseau (seul l'éventuel endpoint d'analytics configuré au build est autorisé).
- Aucune donnée personnelle n'est envoyée : analytics locales par défaut, identifiants et textes libres filtrés.
- Signalement d'une faille : [SECURITY.md](SECURITY.md).

## Mentions légales

© 2026 Florian Iglesias. Tous droits réservés — voir [LICENSE](LICENSE). Les contributions de code ne sont pas acceptées ([CONTRIBUTING.md](CONTRIBUTING.md)).

ERA XV est un projet indépendant. Il n'est affilié à aucun club, fédération, ligue (dont World Rugby, la FFR et la LNR) ni joueur, et n'est approuvé par aucun d'eux. Les noms d'équipes, de compétitions et de joueurs sont cités à titre descriptif, comme faits historiques, et restent la propriété de leurs titulaires. Aucun logo, maillot ni photographie n'est utilisé. Polices Archivo et IBM Plex Mono sous SIL Open Font License (`assets/fonts/`).
