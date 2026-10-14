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

49 tests unitaires (Vitest) sur toute la logique métier, qui est sans React : chargement des CSV, statistiques, contrôles qualité, reconnaissance des destinations, comparateur, import de fichiers, formatage.

- **Cas réels rencontrés pendant le développement** : ligne en USD imputée à son fichier, prix vide, SKU en double entre deux fichiers, « Rép. dominicaine » / « Viêt Nam » reconnus comme pays, zone inédite (`AF` = Afghanistan en ISO), catalogue sans aucun prix en EUR, désactivation puis réactivation de fichiers.
- **Chiffres de référence de la partie 1** verrouillés sur le jeu MyBestSim : 5 056 cartes, 56 > 100 €, 5,36 € → 154,63 €, 29,30 € de moyenne, 14,5 Go de data moyenne, 18 fichiers validés.
- **Ce que les tests ont fait corriger** : un message « prix invalide («  ») » pour un prix vide (devenu « prix manquant »), et un SKU en double attribué selon l'ordre alphabétique des fichiers (désormais conservé dans le fichier dont il porte le préfixe).

## Architecture

```
src/
├── data/                 # CSV fournisseurs (chargés automatiquement)
├── types/catalog.ts      # Modèle métier : Product, CatalogStats…
├── services/
│   ├── catalogLoader.ts  # Lecture + normalisation + dédoublonnage des CSV
│   ├── fileImport.ts     # Lecture locale des fichiers déposés (validation format/taille)
│   ├── catalogStats.ts   # Calcul pur des statistiques (sans React)
│   ├── dataQuality.ts    # Contrôles qualité des CSV (sans React)
│   ├── destinations.ts   # Reconnaissance des pays ISO 3166 (sans liste en dur)
│   └── offerComparison.ts # Offres d'une destination et meilleure offre par volume
├── contexts/             # CatalogProvider : fichiers chargés, activation, import, réinitialisation
├── hooks/
│   ├── useCatalog.ts           # Accès au contexte catalogue
│   ├── useCatalogDashboard.ts  # Filtre fournisseur + stats et rapport qualité mémoïsés
│   └── useWindowFileDrop.ts    # Glisser-déposer de fichiers sur toute la fenêtre
├── utils/format.ts       # Formatage fr-FR (€, nombres, %)
├── test/csv.ts           # Générateur de CSV pour les tests (fichiers *.test.ts à côté de chaque service)
├── constants/theme.ts    # Couleurs et styles partagés des graphiques
├── components/
│   ├── ui/               # Briques génériques : GlassCard, Panel, Icon, Switch, ProgressRing, RankingList…
│   ├── layout/           # Background, DashboardHeader, Footer
│   ├── filters/          # ProviderSelect, ActiveFilter
│   ├── import/           # DataSourceBar, DropOverlay, ImportNotice
│   ├── kpi/              # KpiCard, KpiGrid
│   ├── charts/           # ProviderChart, DestinationComparator, PriceIndexChart, PriceDistributionChart, DataTiersChart, ColumnChart
│   ├── insights/         # PricePerGbRanking, TopDestinations, CatalogFeatures, CatalogExtremes
│   └── quality/          # QualitySummary, QualityCheckList, QualityCheckItem, FileQualityTable
├── pages/
│   ├── DashboardPage.tsx # En-tête + onglets
│   └── sections/         # StatisticsSection, DataQualitySection
└── styles/global.css     # Reset, police, variables CSS
```

- **Séparation des responsabilités** : données (`services`) → état (`hooks`) → présentation (`components`). Les calculs sont des fonctions pures, testables sans navigateur.
- **CSS Modules** co-localisés avec chaque composant ; variables globales dans `styles/global.css`.
- **Alias `@/`** vers `src/` pour des imports lisibles.

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
7. Bonus : comparateur par destination (meilleure offre par volume, à durée égale), indice de prix à offre égale par fournisseur, distribution des prix, volumes de data, prix moyen au Go par fournisseur, top destinations, part 5G / rechargeable / illimité, durées de validité, produits extrêmes

## Qualité des données

Onglet dédié (lien direct : `/#qualite`). 13 contrôles automatiques, recalculés à chaque chargement de données (build ou import), classés en 4 statuts (validé, à savoir, à surveiller, erreur), avec exemples dépliables :

| Catégorie | Contrôles |
|---|---|
| Structure | colonnes attendues, lignes exploitables, un fichier = un fournisseur (préfixe SKU) |
| Unicité | SKU uniques, lignes identiques sous deux SKU, offres déclinées en variantes |
| Cohérence | prix en EUR, nom produit ↔ colonnes, code ↔ nom de destination, destinations non reconnues comme pays |
| Prix | prix aberrants (règle de Tukey par groupe comparable), surcoût des zones, illimités sans volume |

Les données ne sont **jamais modifiées** : les contrôles informent sur la lecture des statistiques. Seules les lignes inexploitables (prix ou volume manquant) seraient écartées, et elles sont alors listées.

Constats sur le jeu actuel :
- aucun doublon strict ; 620 offres existent en plusieurs variantes (prix / 4G-5G / recharge différents), comptées comme produits distincts ;
- 4 destinations non reconnues comme pays, détectées automatiquement : `WW` (Monde, code absent de la norme) et `EU`, `AS`, `NA`, qui désignent autre chose en ISO 3166 (Union européenne, Samoa américaines, Namibie). En pratique, des zones multi-pays ;
- les zones coûtent ~40 % de plus à offre égale : une détection d'outliers naïve les signalerait à tort (726 faux positifs), d'où la séparation pays / zones.

### Détection des zones, sans liste en dur

Chaque couple `country_code` / `country_name` est comparé au nom officiel ISO 3166 du code, fourni par le navigateur (`Intl.DisplayNames`, données CLDR). La comparaison tolère accents, ponctuation, petits mots et abréviations (« Vietnam » = « Viêt Nam », « Rép. dominicaine » = « République dominicaine »), mais pas « Europe » ≠ « Union européenne » ni « Guinée » ≠ « Guinée équatoriale ».

Limite assumée : une zone multi-pays et un nom non officiel (« USA ») ou mal orthographié tombent dans la même catégorie. Le contrôle affiche la raison pour chaque code afin qu'un humain tranche.

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
