# MyBestSim · Dashboard catalogue eSIM

Dashboard React + TypeScript (Vite) qui lit automatiquement les CSV fournisseurs et affiche les statistiques clés du catalogue.

## Lancer

```bash
npm install
npm run dev      # développement
npm run build    # build statique dans dist/ (déployable sur Vercel, Netlify, GitHub Pages…)
npm test         # tests unitaires (Vitest)
```

## Tests

96 tests unitaires (Vitest), `npm test`. Toute la logique métier est dans `src/services/`, sans React, ce qui permet de la tester isolément : **97 % des services couverts** (lignes).

**Ce qui est testé**

- **Chargement des CSV** : lignes valides, rejets avec numéro de ligne et raison, colonnes manquantes, illimités, doublons de SKU (conservés dans le fichier dont ils portent le préfixe, quel que soit l'ordre des fichiers).
- **Statistiques** : seuil strict « > 100 € », exclusion des prix hors EUR, illimités hors data moyenne, « — » plutôt que 0 €, pays et zones séparés, indice à offre égale.
- **Contrôles qualité : chacun est testé dans son cas d'échec**, pas seulement « validé » sur les données d'origine : fichier sans colonnes attendues, deux fournisseurs dans un fichier, ligne en double sous deux SKU, nom produit incohérent, conflit code/nom de destination, prix aberrant (et zone non confondue avec un prix aberrant), devise étrangère imputée à son fichier, prix « 12,5 » non protégé qui décale les colonnes.
- **Gestion des fichiers** (`catalogSource.ts`) : ajout, mise à jour d'un fichier de même nom, remplacement, réactivation d'un fichier réimporté, retour à l'état d'origine.
- **Comparaison d'imports** (`catalogDiff.ts`) : ajouts, retraits, hausses et baisses de prix, autres modifications, changement de devise non compté comme une hausse, nouvelle version réaliste d'`airalo.csv`.
- **URL** (`urlState.ts`) : lecture, mise à jour, encodage des accents, compatibilité de l'ancien lien `#qualite`.
- **Destinations** : variantes d'écriture reconnues (Viêt Nam, Rép. dominicaine), pièges refusés (Europe ≠ Union européenne), zones détectées sans liste en dur.
- **Panneau de détail** : sélections (mêmes effectifs que les graphiques), tri sur chaque colonne, recherche, position d'un produit sur le marché, **export CSV réimportable à l'identique** (aller-retour).
- **Chiffres de la partie 1 verrouillés** sur le jeu MyBestSim : 5 056 cartes, 56 > 100 €, 5,36 € → 154,63 €, 29,30 € de moyenne, 14,5 Go, 50 pays + 4 zones.

**Ce que les tests ont fait corriger** : un SKU en double attribué selon l'ordre alphabétique des fichiers ; un message « prix invalide («  ») » pour un prix vide (devenu « prix manquant ») ; « Données d'origine » encore affiché après avoir tout réactivé.

**Ce qui n'est pas couvert par les tests unitaires**

- **Les composants React** (affichage, graphiques, panneau) : ils ne contiennent presque pas de logique. Ils ont été vérifiés par des parcours automatisés dans un navigateur (Playwright) pendant le développement, mais ces scripts ne sont pas intégrés au dépôt.
- **Le téléchargement du fichier exporté** (`downloadCsv`), qui dépend du navigateur ; le contenu exporté, lui, est testé.
- **Sensibilité à l'environnement** : les tests de reconnaissance des pays s'appuient sur les noms ISO fournis par Node (données CLDR) ; une mise à jour majeure de Node pourrait modifier un libellé attendu (ex. « Viêt Nam »).

## Architecture

```
src/
├── data/                 # CSV fournisseurs (chargés automatiquement)
├── types/catalog.ts      # Modèle métier : Product, CatalogStats…
├── services/
│   ├── catalogLoader.ts  # Lecture + normalisation + dédoublonnage des CSV
│   ├── catalogSource.ts  # Fichiers chargés / importés / désactivés et leurs transitions
│   ├── catalogDiff.ts    # Comparaison de deux états du catalogue (import)
│   ├── fileImport.ts     # Lecture locale des fichiers déposés (validation format/taille)
│   ├── catalogStats.ts   # Calcul pur des statistiques (sans React)
│   ├── dataQuality.ts    # Contrôles qualité des CSV (sans React)
│   ├── destinations.ts   # Reconnaissance des pays ISO 3166 (sans liste en dur)
│   ├── offerComparison.ts # Offres d'une destination et meilleure offre par volume
│   ├── selections.ts     # Sélections du panneau de détail, tri, recherche, position d'un produit
│   └── csvExport.ts      # Export CSV au format fournisseur
├── contexts/             # CatalogProvider (fichiers, activation, import) · ProductDetailProvider (panneau de détail)
├── hooks/
│   ├── useCatalog.ts           # Accès au contexte catalogue
│   ├── useCatalogDashboard.ts  # Filtre fournisseur + stats et rapport qualité mémoïsés
│   └── useWindowFileDrop.ts    # Glisser-déposer de fichiers sur toute la fenêtre
├── utils/format.ts       # Formatage fr-FR (€, nombres, %)
├── utils/urlState.ts     # Vue courante dans l'URL (lien partageable)
├── test/csv.ts           # Générateur de CSV pour les tests (fichiers *.test.ts à côté de chaque service)
├── constants/theme.ts    # Couleurs et styles partagés des graphiques
├── components/
│   ├── ui/               # Briques génériques : GlassCard, Panel, Icon, Switch, ProgressRing, RankingList…
│   ├── layout/           # Background, DashboardHeader, Footer
│   ├── filters/          # ProviderSelect, ActiveFilter
│   ├── import/           # DataSourceBar, DropOverlay, ImportNotice
│   ├── kpi/              # KpiCard, KpiGrid
│   ├── charts/           # ProviderChart, DestinationComparator, PriceIndexChart… · plots/ = tracés Recharts chargés à la demande
│   ├── insights/         # PricePerGbRanking, TopDestinations, CatalogFeatures, CatalogExtremes
│   ├── quality/          # QualitySummary, QualityCheckList, QualityCheckItem, FileQualityTable
│   ├── detail/           # ProductDrawer, SelectionSummary, ProductTable, ProductSheet
│   └── changes/          # ChangesSummary, tableaux des changements d'un import
├── pages/
│   ├── DashboardPage.tsx # En-tête + onglets
│   └── sections/         # StatisticsSection, DataQualitySection, ChangesSection
└── styles/global.css     # Reset, police, variables CSS
```

- **Séparation des responsabilités** : données (`services`) → état (`hooks`) → présentation (`components`). Les calculs sont des fonctions pures, testables sans navigateur.
- **CSS Modules** co-localisés avec chaque composant ; variables globales dans `styles/global.css`.
- **Alias `@/`** vers `src/` pour des imports lisibles.

## Performance

Mesures Lighthouse locales (mobile simulé, processeur ralenti ×4), médiane de 3 passages, sur le build de production :

| | Avant | Après |
|---|---|---|
| Score | 49 | **84** |
| Total Blocking Time | 2 880 ms | ~500 ms |
| First / Largest Contentful Paint | 3,4 s / 3,9 s | 2,0 s / 2,2 s |
| Cumulative Layout Shift | 0 | 0 |

- **Graphiques différés** (`LazyRender`) : chaque graphique réserve sa hauteur (aucun saut de mise en page) et n'est construit qu'à l'approche de l'écran.
- **Recharts chargé à la demande** : les tracés (`components/charts/plots/`) et la librairie (~110 Ko gzip) sont dans un fichier séparé, téléchargé au premier graphique visible. Le premier affichage n'attend que React, PapaParse, l'application et les données.
- **Fond animé sans `filter: blur()`** : dégradés radiaux, seule la transformation est animée (prise en charge par la carte graphique).
- **Police non bloquante** (`display=optional`) : pas d'attente ni de décalage du texte ; Inter s'applique dès qu'elle est en cache.
- **Calculs** : formateurs `Intl` mis en cache, exemples du rapport qualité construits seulement pour ceux affichés (contrôle qualité 100 → 45 ms).

Le score en ligne dépend aussi de l'hébergeur et varie d'une mesure à l'autre.

## Ajouter / mettre à jour des données

**Dans le navigateur (glisser-déposer)** : déposer des CSV n'importe où sur la page, ou bouton « Importer des CSV ». Tout est traité localement (aucun envoi serveur) ; statistiques et contrôles qualité sont recalculés instantanément.

- *Ajouter* (par défaut) : les fichiers s'ajoutent au catalogue, un fichier de même nom remplace l'ancien (mise à jour quotidienne d'un fournisseur).
- *Remplacer* : seuls les fichiers importés sont analysés.
- « Données d'origine » revient au jeu de départ. Les fichiers non CSV, vides ou > 10 Mo sont refusés et listés.

**Activer / désactiver des fichiers** : bouton « Gérer les fichiers » ou colonne « Inclus » du tableau *Détail par fichier* (onglet Qualité). Un fichier désactivé est exclu de toutes les statistiques et de tous les contrôles, sans être supprimé ; il reste listé pour être réactivé. Les contrôles relatifs (prix aberrants, indice à offre égale) sont recalculés sur les seuls fichiers actifs. Réimporter un fichier désactivé le réactive.

Les imports ne sont pas conservés après rechargement de la page (pas de back-end, choix assumé pour un dashboard statique).

**Jeu par défaut** : fichiers de `src/data/`, intégrés au build via `import.meta.glob`. Un nouveau fournisseur = un nouveau fichier, aucun code à modifier.

## Statistiques affichées

1. Nombre total de cartes eSIM
2. Produits à plus de 100 €
3. Fourchette de prix (min → max)
4. Data moyenne par carte (et médiane)
5. Prix moyen global (et médiane, prix moyen au Go)
6. Répartition par fournisseur (cliquer une barre filtre tout le dashboard)
7. Bonus : comparateur par destination (meilleure offre par volume, à durée égale), indice de prix à offre égale par fournisseur, distribution des prix, volumes de data, prix moyen au Go par fournisseur, destinations (pays et zones multi-pays séparés : 50 pays + 4 zones), part 5G / rechargeable / illimité, durées de validité, produits extrêmes

## Qualité des données

Onglet dédié (lien direct : `/?view=quality`, l'ancien `/#qualite` reste accepté). 13 contrôles automatiques, recalculés à chaque chargement de données (build ou import), classés en 4 statuts (validé, à savoir, à surveiller, erreur), avec exemples dépliables :

| Catégorie | Contrôles |
|---|---|
| Structure | colonnes attendues, lignes exploitables, un fichier = un fournisseur (préfixe SKU) |
| Unicité | SKU uniques, lignes identiques sous deux SKU, offres déclinées en variantes |
| Cohérence | prix en EUR, nom produit ↔ colonnes, code ↔ nom de destination, destinations non reconnues comme pays |
| Prix | prix aberrants (règle de Tukey par groupe comparable), surcoût des zones, illimités sans volume |

Les données ne sont **jamais modifiées** : les contrôles informent sur la lecture des statistiques. Seules les lignes inexploitables (prix ou volume manquant) seraient écartées, et elles sont alors listées.

Constats sur le jeu actuel :
- aucun doublon strict ; 620 offres existent en plusieurs variantes (prix / 4G-5G / recharge différents), comptées comme produits distincts ;
- 4 destinations non reconnues comme pays, détectées automatiquement : `WW` (Monde, code absent de la norme) et `EU`, `AS`, `NA`, qui désignent autre chose en ISO 3166 (Union européenne, Samoa américaines, Namibie). En pratique, des zones multi-pays, affichées à part des pays dans tout le dashboard ;
- les zones coûtent ~40 % de plus à offre égale : une détection d'outliers naïve les signalerait à tort (726 faux positifs), d'où la séparation pays / zones.

### Détection des zones, sans liste en dur

Chaque couple `country_code` / `country_name` est comparé au nom officiel ISO 3166 du code, fourni par le navigateur (`Intl.DisplayNames`, données CLDR). La comparaison tolère accents, ponctuation, petits mots et abréviations (« Vietnam » = « Viêt Nam », « Rép. dominicaine » = « République dominicaine »), mais pas « Europe » ≠ « Union européenne » ni « Guinée » ≠ « Guinée équatoriale ».

Limite assumée : une zone multi-pays et un nom non officiel (« USA ») ou mal orthographié tombent dans la même catégorie. Le contrôle affiche la raison pour chaque code afin qu'un humain tranche.

## Comparer deux imports

Chaque import est comparé au catalogue affiché juste avant, produit par produit (SKU). Un onglet **« Changements »** apparaît alors, avec un lien depuis le message d'import :

- **Résumé** : produits ajoutés, retirés, hausses et baisses de prix, variation moyenne, autres modifications (réseau, recharge, volume, durée, devise).
- **Par fournisseur**, puis le détail : variations de prix (plus fortes d'abord), produits ajoutés (ouvrables et exportables dans le panneau de détail), produits retirés, autres modifications « avant → après ».
- Un prix n'est comparé que dans la même devise : un passage de EUR à USD est une modification de devise, pas une hausse.
- Cas d'usage visé : on dépose l'export du jour d'un fournisseur (même nom de fichier) et on voit immédiatement ce qui a bougé.

Les changements vivent dans le navigateur, le temps de la session (pas de back-end) : ils ne sont pas inclus dans un lien partagé.

## Lien partageable

La vue courante est recopiée dans l'URL, sans créer d'entrée d'historique : onglet (`view=quality`), fournisseur filtré (`provider=Airalo`), destination et durée du comparateur (`destination=Japon&validity=15`). Un lien copié rouvre exactement la même vue. Les valeurs par défaut n'y figurent pas, et une valeur inconnue (fournisseur absent des données) est ignorée puis retirée de l'adresse.

## Détail des produits

Presque chaque élément du dashboard est cliquable et ouvre un **panneau latéral de détail** : cartes de statistiques, tranches de prix, volumes de data, destinations, caractéristiques (5G, recharge, illimités, durées), produits extrêmes, points et meilleures offres du comparateur, et « Voir ses produits » sur le filtre fournisseur.

- **Une sélection** = un titre + un filtre (`services/selections.ts`), appliqué aux données visibles (fournisseur filtré compris) : elle reste juste si les fichiers changent pendant qu'elle est ouverte. Les sélections reprennent exactement les règles des indicateurs (testé : mêmes effectifs).
- **Panneau** : mini-résumé (mêmes calculs que le dashboard), tableau triable avec recherche (sans accents) et pagination par 50, **export CSV** au format fournisseur, réimportable tel quel dans le dashboard (testé par aller-retour).
- **Fiche produit** : position sur le marché (écart à la médiane des offres comparables, rang pour la destination et toutes destinations confondues), puis liens vers les offres comparables, la destination ou le fournisseur.
- **Accessibilité** : dialogue modal, focus gardé dans le panneau, Échap pour fermer, focus rendu à l'élément d'origine ; plein écran sur mobile.

## Moyenne, médiane et indice à offre égale

- **Médiane** affichée à côté de la moyenne : les distributions sont asymétriques (prix moyen 29,30 € vs médian 20,70 € ; data 14,5 Go vs 5 Go), tirées par quelques forfaits illimités et 50 Go.
- **Prix moyen au Go** conservé, mais il mesure surtout la **composition** du catalogue : le €/Go baisse fortement avec le volume (6,71 €/Go à 1 Go, 1,18 €/Go à 50 Go), et le classement est corrélé à -0,84 avec la part de forfaits 20/50 Go.
- **Indice de prix à offre égale** : pour chaque produit, écart à la médiane des offres comparables (même volume, même durée, pays ou zone), moyenné par fournisseur. Résultat : tous les fournisseurs sont entre -0,9 % et +0,4 % - aucun écart tarifaire structurel ; les différences se jouent offre par offre, d'où le comparateur par destination.
- Le comparateur compare toujours **à durée égale** : mélanger 7 et 30 jours ferait passer un forfait court pour une bonne affaire.
- Couleurs des nouveaux graphiques validées (daltonisme, contraste) sur la surface sombre : paire divergente bleu/rouge pour l'indice, aqua/bleu + neutre pour le comparateur, avec étiquettes en encodage secondaire.

## Choix assumés

- **Forfaits illimités** (653 produits, `data_gb` vide) : exclus de la moyenne de data et du prix au Go, car ils n'ont pas de valeur en Go. Leur nombre est affiché à part.
- **« Plus de 100 € »** = strictement supérieur à 100 €.
- **Devise** : les indicateurs de prix (fourchette, prix moyen, > 100 €, prix au Go, distribution, extrêmes, prix aberrants) ne portent que sur les produits en EUR. Une ligne dans une autre devise n'est pas convertie (un taux de change serait une hypothèse à maintenir) : elle est exclue des calculs de prix mais reste comptée dans les volumes, et un bandeau le signale. Si aucun produit n'est en EUR, les indicateurs de prix affichent « - » plutôt qu'un faux 0 €.
- Parsing défensif : prix avec virgule acceptés, lignes sans prix valide ignorées, dédoublonnage par SKU.
