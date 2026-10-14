# Données ERA XV — format et règles d'extension

Objectif de montée en charge : 150–180 équipes-époques et 3 000–4 000 versions de joueurs, **sans aucune statistique inventée**. Tout ce que le jeu affiche comme « fait » (palmarès, capitaine, joueur de l'année, buteur) vient d'un champ structuré de ce dossier ; tout le reste est explicitement une estimation (notes, attributs de profil).

## Organisation

| Fichier | Contenu |
|---|---|
| `schema.ts` | Types (`TeamMeta`, `PlayerEra`, `TeamEra`), parseur de lignes, génération des attributs, seaux d'époque |
| `teams/*.ts` | Une liste d'équipes-époques par fichier (sélections du Sud, du Nord, reste du monde, clubs FR / EN / Sud). Ajouter un fichier = l'importer dans `index.ts` |
| `index.ts` | Agrégation (`TEAMS`, `ALL_PLAYERS`, `VERSIONS`), faits structurés (joueurs de l'année World Rugby, finales de Coupe du monde, titres majeurs) |
| `captains.ts` | Capitaine historique par équipe-époque, **uniquement** quand un capitaine définit clairement l'époque |
| `validate.ts` | Validateur pur (erreurs / avertissements), partagé par l'audit, l'import et les tests |
| `encounters.ts` | Table générée de rareté de rencontre (`npm run encounters`), ne pas éditer |

## Une équipe-époque

```ts
team({ id: 'bath-1994', team: 'bath', name: 'Bath', era: '1989–98', years: [1989, 1998], kind: 'club',
       country: 'ENG', comp: 'prem', color: '#4e88d9', titles: ['euro:1998'], plan: 'balanced', conf: 'medium' }, `
Jonathan Webb | FB | 84 | FS | ENG gk=86
Jeremy Guscott | OC | 91 | 13B | ENG
`)
```

- `id` unique `<équipe>-<année repère>` ; `team` = clé stable du club ou de la nation (sert aux modes Un seul club / Un seul pays).
- `titles` : `rwc:`, `gs:` (Grand Chelem), `euro:`, `super:`, `lions:`, `top14:`, `prem:`, `urc:` + année, **dans les bornes `years`**. Ce sont les seuls palmarès affichés.
- `plan` : plan de jeu de l'équipe quand elle vous affronte en Ligue ERA (choix éditorial assumé, pas une statistique).
- `conf` : confiance par défaut des notes de l'équipe (`high` / `medium` / `low`), surchargeable par joueur.

## Une ligne joueur

`Nom | postes | note | rôle | NAT clé=valeur…`

- Postes : `LHP HK THP LK BF OF N8 SH FH IC OC WG FB`, séparés par `/`, poste naturel en premier.
- Note 50–99 : estimation éditoriale au pic de l'époque (voir `docs/data-quality.md`).
- Rôle : un des 27 rôles de `engine/rugby.ts` (`PS`, `HD`, `LE`, `9T`, `10G`, `13B`, `FS`…) ; il fixe le profil d'attributs.
- Nationalité : code à 3 lettres, obligatoire pour les clubs et les Lions.
- Clés optionnelles : `id=` (identité quand deux personnes ont le même nom), `short=` (nom court imposé), `conf=`, et surcharges d'attributs `sc lo bd cr df pm kk st pc ae gk`.
- `gk=` ≥ 80 fait du joueur un **buteur désigné** (trait « Buteur » affiché). Ne le renseigner que pour un buteur attitré de l'époque ; sinon le moteur estime le pied depuis le rôle, sans trait affiché.

## Traits (architecture extensible)

`engine/traits.ts` dérive les traits de données existantes, jamais d'une supposition :

| Trait | Source |
|---|---|
| Capitaine | `captains.ts` |
| Joueur de l'année | `PLAYER_OF_THE_YEAR` (index.ts), année comprise dans l'époque |
| Buteur | `gk=` ≥ 80 dans la ligne |
| Polyvalent | ≥ 3 postes de trois-quarts listés |
| Traits de rôle | le rôle lui-même |

Ajouter un trait = une source structurée ici + une entrée dans `traits.ts` + ses libellés `trait.*` dans les trois langues. Pas de source fiable → pas de trait.

## Import en masse

Format : un CSV, une ligne par version de joueur (colonnes équipe puis joueur ; modèle : `docs/data-import-sample.csv`).

```bash
npm run import:data -- export bath-1994,nzl-2015 > modele.csv   # exporter des équipes existantes comme gabarit
npm run import:data -- check nouvelles.csv                        # valider sans rien écrire
npm run import:data -- import nouvelles.csv clubs-urc             # valider puis écrire src/data/teams/clubs-urc.ts
```

L'import valide le lot **avec** la base existante (doublons d'identité, homonymes, carrières incohérentes) avant d'écrire quoi que ce soit ; rien n'est deviné, une valeur absente reste absente et le validateur la signale. Ajouter ensuite le module dans `index.ts`, puis `npm run check` et `npm run encounters`.

## Validateur

`src/data/validate.ts` (pur, partagé par l'audit, l'import et les tests) distingue :

- **erreurs** (build refusé) : identifiants d'équipe ou de version absents, mal formés ou dupliqués, équipe sans nom ni clé, période absente, inversée ou hors bornes, pays / type / compétition / couleur / confiance invalides, titre hors période ou d'un type inconnu, joueur sans nom, poste ou rôle invalide, note hors 50–99, nationalité manquante, attribut hors bornes, effectif trop court ou poste non couvert, même personne orthographiée de deux façons, capitaine ou joueur de l'année incohérent avec les données ;
- **avertissements** (revue éditoriale) : époques très longues, carrières trop étalées (deux personnes sous un même id ?), plusieurs pays en sélection, pas de buteur désigné, postes couverts seulement en second choix.

Rapport lisible : `docs/data-quality.md`, régénéré par `npm run audit:data` (inclus dans `npm run check`).

## Limites de montée en charge (mesurées)

- Jetons de défi : index de version sur 16 bits → 65 535 versions maximum (objectif 3 000–4 000 : large marge).
- Poids : ≈ 44 octets de source par version (94 Ko pour 2 118) ; 4 000 versions ≈ 180 Ko avant compression, sans découpage nécessaire.
- Démarrage : l'analyse des données est linéaire ; ≈ 0,25 s prêt aujourd'hui sur ordinateur, ≈ 1,0 s avec un processeur ralenti ×4 (voir `docs/LAUNCH.md`).
- `DATA_VERSION` (16 bits) change à chaque modification : les liens de défi antérieurs sont refusés proprement. Garder les anciens liens jouables demandera des instantanés de données versionnés.

## Rareté de rencontre

`npm run encounters` mesure, sur 6 000 drafts réels, la fréquence à laquelle chaque version est proposée et écrit `src/data/encounters.ts` (5 % de versions « rares », 1 % « très rares »). C'est une étiquette, jamais un poids : tirages, notes et saisons l'ignorent. Un test échoue tant que la table ne correspond pas aux données livrées.

## Garde-fous

- `npm run check` échoue à la moindre erreur du validateur (`scripts/audit-data.ts`), si les tests de cohérence (traits, capitaines, buteurs) cassent, ou si la table de rareté ne correspond plus aux données.
- `docs/data-quality.md` est régénéré à chaque audit : volume, distribution des notes, confiance, remarques éditoriales.

## Conséquence sur les défis

`DATA_VERSION` (engine/challenge.ts) est une empreinte de toutes les versions et de leurs notes / postes. Toute modification des données change les tirages d'une même graine : les liens de défi créés avant la mise à jour sont alors refusés avec le message « créé sur une autre version » (jamais rejoués faux). Pour garder les anciens liens jouables après une extension, il faudra conserver des instantanés de données versionnés (voir `docs/LAUNCH.md`).
