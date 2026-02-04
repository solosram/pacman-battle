# PACMAN BATTLE - Plan de développement

## OBJECTIF
Jeu multijoueur Pacman compétitif, addictif, sessions 2 minutes, 2-8 joueurs

## CORE LOOPS D'ADDICTION

### 1. Progression Immédiate
- Niveaux 1-100 visibles
- XP par partie (gagne +50, perd +10)
- Barre de progression toujours visible
- Déblocage tous les 5 niveaux (skins, couleurs, effets)

### 2. Récompenses Variables
- Bonus aléatoires : x2, x3, x5 points
- Power-ups surprise
- Coffres à ouvrir (loot box style)
- Streak bonus (3 victoires = récompense)

### 3. Compétition Sociale
- Classement temps réel dans la partie
- Classement global amis/entreprise
- "Tu as battu [Nom collègue]!"
- Notifications de dépassement

### 4. Feedback Dopamine
- Sons satisfaisants (ASMR eating)
- Particules explosions
- Écran qui pulse quand combo
- Vibration téléphone sur gros points
- Animation "LEVEL UP" épique

## GAMEPLAY MECHANICS

### Base
- 4 Pacmans (couleurs différentes)
- Terrain 20x20 avec murs
- Points à manger (1pt chacun)
- Gros points (5pts, effet visuel)
- 2 minutes par partie

### Power-ups (spawn aléatoire)
1. ⚡ SPEED (5s) - Vitesse x2
2. 👻 GHOST (5s) - Traverse les murs
3. 💀 KILLER (3s) - Mange les autres Pacmans
4. 🧲 MAGNET (5s) - Points attirés
5. 🛡️ SHIELD (3s) - Invincible
6. 💎 RARE (instant) - +50 pts

### Système de Combo
- Manger 5 points = Combo x2
- Manger 10 points = Combo x3
- Manger 20 points = Combo x5
- Perdre combo = son décevant (motivation)

### Pièges & Risques
- Fantômes IA qui ralentissent
- Zones qui disparaissent (lave)
- Power-ups pièges (inverser contrôles)

## TECH STACK
- Frontend: HTML5 Canvas + WebSocket
- Backend: Node.js + Socket.io
- Hébergement: Local pour LAN, ou glitch/repl.it pour online
- Mobile-first responsive

## PHASES DE DÉVELOPPEMENT

### Phase 1: Core (1h)
- Setup projet
- Moteur de jeu basique
- Mouvement Pacman
- Points à manger
- Timer 2 minutes

### Phase 2: Multijoueur (1h)
- WebSocket serveur
- Rooms de jeu
- Synchro positions
- Classement temps réel

### Phase 3: Addictif (1h)
- Power-ups
- Combo system
- Sons & particules
- Progression niveaux
- Skins

### Phase 4: Polish (1h)
- Mobile responsive
- UI/UX épique
- Test & équilibrage
- Optimisation

## MÉTRIQUES D'ADDICTION À VÉRIFIER
- [ ] Envie de rejouer immédiatement
- [ ] Progression visible et gratifiante
- [ ] Compétition palpable
- [ ] Surprises régulières
- [ ] Maîtrise skill-based
- [ ] Courtes sessions (2min)
