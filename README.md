# 📈 Mon Application Portefeuille Actions - Guide Complet

Bienvenue ! Ce guide va t'expliquer **pas à pas** comment utiliser ton application.

## 🎯 Ce que fait ton application

Cette application te permet de :
- ✅ Rechercher des actions par leur symbole (ex: AAPL pour Apple)
- ✅ Voir le prix actuel et les variations
- ✅ Créer ton portefeuille virtuel
- ✅ Comparer jusqu'à 3 actions côte à côte

## 📋 Étape 1 : Installation (SUPER FACILE)

### Option A : Lancer directement (le plus simple)

1. **Télécharge tous les fichiers** que je viens de créer sur ton ordinateur dans un même dossier
2. **Double-clique** sur le fichier `index.html`
3. Ton navigateur va s'ouvrir avec l'application - c'est tout ! 🎉

### Option B : Utiliser un éditeur de code (recommandé pour apprendre)

1. **Télécharge Visual Studio Code** (gratuit) : https://code.visualstudio.com/
2. **Installe-le** sur ton ordinateur
3. **Ouvre VS Code** et clique sur "Fichier" > "Ouvrir le dossier"
4. **Sélectionne** le dossier contenant tes fichiers
5. **Installe l'extension "Live Server"** :
   - Clique sur l'icône Extensions (carré à gauche)
   - Cherche "Live Server"
   - Clique sur "Install"
6. **Lance l'app** : Fais clic droit sur `index.html` > "Open with Live Server"

## 🔑 Étape 2 : Obtenir ta clé API (GRATUIT)

L'application utilise une API gratuite pour récupérer les données boursières.

1. **Va sur** : https://www.alphavantage.co/support/#api-key
2. **Remplis le formulaire** avec ton email
3. **Tu recevras ta clé API** par email (ça ressemble à : `ABC123XYZ456`)
4. **Ouvre le fichier `app.js`** avec VS Code ou Notepad
5. **Trouve la ligne 3** qui dit : `const API_KEY = 'demo';`
6. **Remplace** `'demo'` par ta clé (garde les guillemets) :
   ```javascript
   const API_KEY = 'TA_CLE_ICI';
   ```
7. **Sauvegarde** le fichier (Ctrl+S ou Cmd+S)

⚠️ **IMPORTANT** : La clé 'demo' marche mais est limitée. Avec ta propre clé, tu auras 25 requêtes par jour (largement suffisant pour commencer).

## 🚀 Étape 3 : Utiliser l'application

### Rechercher une action

1. Dans la barre de recherche, tape un symbole d'action (exemples ci-dessous)
2. Clique sur "Rechercher" ou appuie sur Entrée
3. Tu verras apparaître une carte avec toutes les infos !

**Symboles populaires à essayer :**
- `AAPL` - Apple
- `MSFT` - Microsoft
- `GOOGL` - Google
- `TSLA` - Tesla
- `AMZN` - Amazon
- `META` - Meta (Facebook)
- `NVDA` - Nvidia
- `DIS` - Disney

### Créer ton portefeuille

1. Après avoir recherché une action, clique sur "➕ Ajouter au portefeuille"
2. L'action s'ajoute dans la section "Mon Portefeuille" en bas
3. Tes actions sont **sauvegardées automatiquement** (même si tu fermes le navigateur)
4. Tu peux retirer une action avec le bouton "❌ Retirer"

### Comparer des actions

1. Clique sur "🔍 Comparer" sur n'importe quelle action
2. Tu peux comparer jusqu'à 3 actions en même temps
3. Elles s'affichent côte à côte dans la section "Comparer des actions"

## 🎨 Structure des fichiers

Voici ce que contient chaque fichier :

```
stock-portfolio-app/
├── index.html      ← Structure de la page (le squelette)
├── styles.css      ← Tout le design et les couleurs
├── app.js          ← Toute la logique (recherche, API, etc.)
└── README.md       ← Ce guide !
```

## 🛠️ Personnalisation

Tu peux facilement modifier l'apparence :

### Changer les couleurs

Ouvre `styles.css` et modifie ces lignes :

```css
/* Ligne 8-9 : Couleur de fond */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Ligne 28 : Couleur principale */
color: #667eea;
```

Essaye ces couleurs :
- Bleu/Vert : `#667eea` → `#11998e`
- Rouge/Orange : `#ee0979` → `#ff6a00`
- Violet/Rose : `#a8edea` → `#fed6e3`

### Ajouter plus de symboles favoris

Dans `app.js`, tu peux créer une liste de favoris pré-remplis.

## ❓ Problèmes fréquents

### "Action non trouvée"
- Vérifie que le symbole est correct (MAJUSCULES)
- Les symboles sont ceux du marché américain (NYSE, NASDAQ)

### "Erreur API"
- Tu as peut-être dépassé les 25 requêtes/jour
- Vérifie que ta clé API est bien configurée
- Attends 24h ou crée une nouvelle clé

### L'application ne se lance pas
- Vérifie que tous les fichiers sont dans le même dossier
- Utilise un navigateur récent (Chrome, Firefox, Edge)

## 📚 Pour aller plus loin

### Fonctionnalités à ajouter (projets futurs)

1. **Graphiques** : Ajouter des courbes d'évolution des prix
2. **Alertes** : Recevoir une notification si le prix change beaucoup
3. **Calculs** : Calculer les gains/pertes si tu avais acheté X actions
4. **Historique** : Voir l'évolution sur 1 semaine, 1 mois, 1 an
5. **News** : Afficher les actualités liées à chaque action

### Ressources pour apprendre

- **HTML/CSS** : https://www.w3schools.com/
- **JavaScript** : https://javascript.info/
- **APIs** : https://www.alphavantage.co/documentation/

## 💡 Conseils

- **Sauvegarde régulièrement** ton code
- **Teste chaque nouvelle fonctionnalité** avant d'en ajouter une autre
- **N'aie pas peur de faire des erreurs** - c'est comme ça qu'on apprend !
- **Utilise la console du navigateur** (F12) pour voir les erreurs

## 🎓 Comprendre le code

### HTML (`index.html`)
C'est la structure de ta page, comme les murs d'une maison.

### CSS (`styles.css`)
C'est la décoration : couleurs, tailles, positions.

### JavaScript (`app.js`)
C'est le cerveau : il gère les clics, appelle l'API, affiche les données.

## 📞 Besoin d'aide ?

Si tu es bloquée sur quelque chose :
1. Regarde la console du navigateur (F12) pour voir les erreurs
2. Vérifie que tous les fichiers sont au bon endroit
3. Compare ton code avec les fichiers originaux

## 🎉 Félicitations !

Tu as maintenant une vraie application fintech fonctionnelle ! 

Continue à expérimenter, ajoute des fonctionnalités, personnalise-la. C'est **ton** projet !

---

**Version** : 1.0
**Date** : Novembre 2024
**Prochaines étapes** : Voir la section "Pour aller plus loin"
