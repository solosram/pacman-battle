# 🚀 DÉPLOIEMENT RAPIDE - 2 MINUTES

## Option 1: Glitch.com (RECOMMANDÉ - Gratuit & Instantané)

### Étape 1: Préparer le fichier ZIP
```
Tu dois zipper le dossier pacman-battle (sans node_modules)
```

### Étape 2: Déployer sur Glitch
1. Va sur https://glitch.com
2. Clique sur **"New Project"** (en haut à droite)
3. Sélectionne **"Import from GitHub"**
4. Si tu as uploadé sur GitHub, colle l'URL
5. OU clique sur **"Upload an Archive"** et upload le ZIP
6. Attends 10 secondes... C'est LIVE ! 🎉

### Étape 3: Obtenir l'URL
- L'URL est affichée en haut : `https://ton-projet.glitch.me`
- Partage cette URL avec tes collègues !

---

## Option 2: Repl.it (Gratuit)

1. Va sur https://repl.it
2. Clique **"Create"** → **"Import from GitHub"**
3. Upload le dossier pacman-battle
4. Clique **"Run"**
5. Partage le lien !

---

## Option 3: Heroku (Gratuit avec carte)

```bash
# Dans le dossier pacman-battle:
heroku create mon-pacman-battle
git push heroku master
```

---

## 🎮 COMMENT JOUER

1. **Ouvre l'URL** dans ton navigateur (Chrome/Safari/Firefox)
2. **Entre ton nom** de joueur
3. **Crée une room** (code auto-généré)
4. **Partage le code** avec tes collègues
5. **Jouez !** 2 minutes de battle intense

### Contrôles:
- 📱 **Mobile**: Tape où tu veux aller
- 💻 **Desktop**: WASD ou Flèches
- ↔️ **Swipe**: Pour virages rapides

---

## ⚙️ CONFIGURATION (Optionnel)

Crée un fichier `.env` dans Glitch:
```
PORT=3000
GAME_DURATION=120
MAX_PLAYERS=8
```

---

## 🔧 SI ÇA NE MARCHE PAS

### Problème: "Cannot find module"
**Solution**: Dans Glitch, ouvre la console et tape:
```bash
npm install
```

### Problème: Le jeu ne démarre pas
**Solution**: Vérifie que `server.js` est bien présent à la racine

### Problème: Impossible de rejoindre
**Solution**: Vérifie que le port 3000 est utilisé (Glitch le fait auto)

---

## 📱 JOUER SUR MOBILE

Le jeu est **mobile-first** :
- ✅ Responsive design
- ✅ Touch controls optimisés
- ✅ Pas de zoom
- ✅ Plein écran

---

## 🎉 C'EST PARTI !

Une fois déployé, tu as un lien permanent que tu peux partager.
Tes collègues ouvrent le lien, entrent un nom, et jouent instantanément !

**Amusez-vous bien !** ⚔️🟡🔵

---

*Questions ? Problèmes ? Retourne voir le README.md ou START.md*
