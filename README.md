# ✨ SmartWealth

Tableau de bord financier personnel en JavaScript : rechercher une action, voir l'évolution de son prix, suivre un portefeuille avec ses gains et pertes, et comparer plusieurs titres.

**🔗 Démo en ligne : [marwahoumayed22.github.io/SmartWealth](https://marwahoumayed22.github.io/SmartWealth/)**

> Aucune configuration nécessaire. Si la limite quotidienne de l'API est atteinte, l'appli passe automatiquement en **mode démo** avec des données d'exemple ([forcer le mode démo](https://marwahoumayed22.github.io/SmartWealth/?demo)).

![Portefeuille avec résumé, positions et répartition](docs/portefeuille.png)

## Fonctionnalités

- **Recherche d'actions** : prix, variation du jour, haut/bas, volume, et graphique des 30 derniers jours (Chart.js).
- **Portefeuille** : ajout de positions (quantité et prix d'achat), **prix moyen pondéré** quand on rachète une même action, gain/perte en $ et en %, variation du jour, et graphique de répartition.
- **Comparaison** de jusqu'à 3 actions côte à côte.
- **Actualités** liées à l'action, avec le sentiment (positif, neutre, négatif).
- **Calculateur** pour simuler un achat.
- **Mode démo automatique** : quand l'API n'est plus disponible, l'appli continue de fonctionner avec des données d'exemple, signalées par un bandeau.
- **Mode sombre** mémorisé et interface **responsive** (mobile, tablette, ordinateur).

| Recherche | Mobile | Mode sombre |
|---|---|---|
| ![Recherche](docs/recherche.png) | ![Mobile](docs/mobile_portefeuille.png) | ![Mode sombre](docs/portefeuille_sombre.png) |

*Les captures utilisent des données de démonstration.*

## Technologies

- HTML, CSS (Grid, Flexbox, media queries) et JavaScript (ES2020+, sans framework)
- [Chart.js](https://www.chartjs.org/) pour les graphiques
- API REST [Alpha Vantage](https://www.alphavantage.co/) (`fetch`, `async`/`await`)
- `localStorage` pour le portefeuille, le thème et un cache des prix
- Tests unitaires avec `node:test` (inclus dans Node.js, aucune dépendance)

## Choix techniques

- **Logique séparée de l'affichage** : les calculs du portefeuille sont dans `portfolio.js`, sous forme de fonctions pures. Elles ne touchent ni à la page ni à l'API, ce qui permet de les tester.
- **Économie de requêtes** : la clé gratuite permet 25 requêtes par jour. Les prix sont mis en cache 10 minutes.
- **Mode démo** : si l'API répond que la limite est atteinte (ou est injoignable), `apiFetch` renvoie des données d'exemple au même format que l'API. Le reste du code n'a pas à savoir d'où viennent les données. Les prix d'exemple ne sont jamais mis en cache.
- **Sécurité** : tout texte venant de l'API est échappé avant d'être affiché (protection XSS), seuls les liens `http(s)` sont acceptés, et les symboles sont validés.
- **Délégation d'événements** : un seul écouteur gère tous les boutons générés dynamiquement (attributs `data-action`), au lieu de `onclick` dans le HTML.

## Lancer le projet

Cloner le dépôt, puis ouvrir `index.html` dans un navigateur. Ajouter `?demo` à l'adresse pour tester le mode démo.

## Tests

```bash
npm test
```

13 tests couvrent le prix moyen pondéré, les gains et pertes, la répartition, la validation du formulaire et la conversion des anciennes données.

## Structure

```
index.html            Structure de la page
styles.css            Styles, mode sombre, responsive
app.js                Interface et appels à l'API
portfolio.js          Calculs du portefeuille (fonctions pures)
demo-data.js          Données d'exemple du mode démo
tests/                Tests unitaires
docs/                 Captures d'écran
```

## Auteure

**Marwa Houmayed** — finissante au baccalauréat en informatique, Université de Montréal
[à compléter — LinkedIn]

*Projet personnel à but éducatif. Ce n'est pas un conseil financier.*
