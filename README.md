# 🟡 PACMAN BATTLE - Multiplayer Arena

**Le jeu de combat Pacman multijoueur le plus addictif pour les pauses au travail !**

## 🎮 Caractéristiques

### ⚡ Gameplay Intense
- **2-8 joueurs** en temps réel sur le même terrain
- **2 minutes** par partie (parfait pour les pauses)
- **Power-ups stratégiques** : Speed, Ghost, Killer, Magnet, Shield, Rare
- **Système de combo** : x2, x3, x5 multiplicateurs
- **Progression niveaux** 1-100 avec déblocages

### 🎯 Mécaniques d'Addiction
- ✅ **Feedback visuel immédiat** - Particules, glow, animations
- ✅ **Sons satisfaisants** - Générés en temps réel (ASMR eating)
- ✅ **Progression constante** - XP, niveaux, skins
- ✅ **Compétition sociale** - Classement live, achievements
- ✅ **Surprises** - Power-ups aléatoires, bonus variables
- ✅ **Maîtrise skill-based** - Combo, stratégie, réflexes

### 🏆 Power-ups
| Emoji | Nom | Effet | Durée |
|-------|-----|-------|-------|
| ⚡ | Speed | Vitesse x2 | 5s |
| 👻 | Ghost | Traverse les murs | 5s |
| 💀 | Killer | Mange les autres joueurs | 3s |
| 🧲 | Magnet | Auto-collecte les points | 5s |
| 🛡️ | Shield | Invincible | 3s |
| 💎 | Rare | +50 points instantanés | 0s |

## 🚀 Installation & Lancement

### Local (LAN)
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur
npm start

# 3. Ouvrir dans le navigateur
http://localhost:3000
```

### Online (Internet)
Déployer sur :
- [Glitch](https://glitch.com) - Gratuit, instantané
- [Repl.it](https://replit.com) - Gratuit
- [Heroku](https://heroku.com) - Gratuit (avec carte)
- [Railway](https://railway.app) - Gratuit

## 📱 Comment Jouer

1. **Entre ton nom** et un code de room (ou laisse vide pour créer)
2. **Partage le code** avec tes collègues
3. **Tous rejoignent** la même room
4. **La partie démarre** automatiquement
5. **Tape sur l'écran** pour te déplacer
6. **Mange les points**, attrape les power-ups, tue les autres !

## 🎨 Contrôles

- **👆 TAP** : Tape où tu veux aller
- **↔️ SWIPE** : Glisse pour virer rapidement
- **⌨️ CLAVIER** : Flèches ou WASD

## 🏅 Achievements à Débloquer

- 🩸 **First Blood** - Joue ta première partie
- 🔵 **Collector** - Mange 100 points
- 🔥 **Combo Master** - Atteins x5 combo
- 💀 **Killer** - Tue un autre joueur
- 🏆 **Champion** - Gagne une partie
- ⚡ **Speed Demon** - Utilise speed boost
- 👻 **Ghost** - Utilise ghost mode
- 💎 **Rich** - Score 500+ en une partie

## 🔧 Configuration

Modifier dans `server.js` :
```javascript
const GAME_DURATION = 120;  // Durée en secondes
const MAX_PLAYERS = 8;      // Joueurs max
const GRID_SIZE = 20;       // Taille du terrain
```

## 💡 Astuces Pro

1. **Combo = Points** - Mange vite pour les multiplicateurs
2. **Power-ups = Win** - Attrape-les tous stratégiquement
3. **Killer Mode** - Active 💀 quand tu es près d'ennemis
4. **Ghost Mode** - Utilise 👻 pour échapper aux pièges
5. **Magnet + Speed** = Combo machine !

## 🛠️ Technologies

- **Backend** : Node.js + Socket.io (temps réel)
- **Frontend** : HTML5 Canvas + Vanilla JS
- **Audio** : Web Audio API (synthèse temps réel)
- **Mobile** : Responsive, touch-optimisé

## 📊 Pourquoi c'est Addictif ?

✨ **Courtes sessions** (2 min) = pas de culpabilité  
✨ **Progression visible** = envie de continuer  
✨ **Compétition directe** = motivation sociale  
✨ **Surprises constantes** = dopamine régulière  
✨ **Skill-based** = satisfaction d'amélioration  

## 🎮 Développé avec ❤️ pour les pauses café

*"Une partie rapide ?" - Cette phrase qui détruit la productivité depuis 2024* ☕

---

## 🚀 Déploiement Rapide Glitch

1. Va sur [glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Colle l'URL de ce repo
4. C'est live instantanément !
5. Partage l'URL avec tes collègues

## 📝 TODO / Améliorations Futures

- [ ] Skins déblocables par niveau
- [ ] Mode spectateur
- [ ] Replays de parties
- [ ] Tournois automatiques
- [ ] Classement global hebdomadaire
- [ ] Mode équipe (2v2, 3v3)
- [ ] Bots IA pour jouer solo
- [ ] Mode battle royale (terrain qui rétrécit)

---

**Enjoy the battle !** 🟡⚔️🔵
