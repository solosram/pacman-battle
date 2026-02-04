# 🚀 Démarrage Rapide - Pacman Battle

## Option 1: Local (Développement)

```bash
# 1. Cloner le projet
git clone <repo-url>
cd pacman-battle

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur
npm start

# 4. Ouvrir le navigateur
http://localhost:3000
```

## Option 2: Glitch (Recommandé - Gratuit & Instantané)

1. Va sur [glitch.com](https://glitch.com)
2. Click **"New Project"** → **"Import from GitHub"**
3. Colle l'URL de ce repository
4. C'est live instantanément ! 🎉
5. Partage l'URL avec tes collègues

## Option 3: Repl.it

1. Va sur [repl.it](https://repl.it)
2. Importe le projet depuis GitHub
3. Click **"Run"**
4. Partage le lien !

## Option 4: Heroku

```bash
# 1. Installer Heroku CLI
# 2. Dans le dossier du projet:
heroku create
heroku git:remote -a <nom-de-ton-app>
git push heroku master
```

## 🎮 Comment Jouer

1. **Ouvre le lien** dans ton navigateur (mobile ou desktop)
2. **Entre ton nom** de joueur
3. **Crée ou rejoins** une room avec un code
4. **Partage le code** avec tes collègues
5. **Jouez !** 2 minutes de battle intense

## 📱 Contrôles

- **👆 TAP** sur l'écran pour te déplacer
- **⌨️ WASD** ou **Flèches** sur desktop
- **↔️ SWIPE** pour des virages rapides

## 🔧 Configuration Avancée

Crée un fichier `.env` :

```env
PORT=3000
GAME_DURATION=120
MAX_PLAYERS=8
```

## 🐛 Debug

Si le serveur ne démarre pas :

```bash
# Vérifier les dépendances
npm install

# Mode debug
npm run dev

# Vérifier le port
lsof -i :3000
```

## 🎉 C'est parti !

Lance le serveur et amuse-toi ! 🟡⚔️🔵
