# 🚀 Pacman Battle - Improvement Plan

## 🎯 Goal
Make the game **easier to run, play, and share**, satisfying the request for an Android APK and a simple "Online" version without complex installations.

## 1. Core Architecture Change: "Offline/Standalone Mode"
Currently, the game **requires** a Node.js server to run. This makes creating an APK or hosting it online difficult/expensive.
**Proposal:** Port the server-side game logic (physics, bots, scoring) directly into the browser client.
*   **Benefits:** 
    *   Runs instantly on **GitHub Pages** (Free, Online).
    *   Runs as a standalone **Android APK** (Offline, Fast).
    *   Zero latency (smoother gameplay).
*   **Trade-off:** "Multiplayer" will be **You vs Bots** (Single Player) on the standalone version. (We will keep the original server code for true multiplayer if needed later).

## 2. 📱 Android APK (Mobile First)
*   **Wrapper:** Use **Capacitor** to wrap the standalone web game into a native Android APK.
*   **Controls:** Optimize Swipe and Tap controls specifically for touchscreens (sensitivity tuning).
*   **Fullscreen:** Ensure immersive mode (no status bars) on Android.

## 3. 🤖 Enhanced Single Player Experience
Since we are focusing on the standalone version:
*   **Smarter Bots:** Tune the existing AI to have "Personalities" (Aggressive, Camper, Speedster).
*   **Progression:** Ensure XP, Levels, and Unlocks are saved locally on the device (LocalStorage).
*   **Pause Feature:** Essential for mobile/single-player (currently missing).

## 4. 🎨 Visual & Quality of Life
*   **Skin Selector:** Add a simple UI to actually select the unlocked skins (currently logic exists but UI is hidden).
*   **Performance:** Optimize particle effects for mobile devices to prevent battery drain.

## 📅 Execution Steps
1.  **Refactor:** Extract `GameRoom` and `Bot` logic from `server.js` into a client-side `game-engine.js`.
2.  **Integrate:** Connect `index.html` to this local engine (bypassing Socket.io).
3.  **Deploy Web:** Push to GitHub and enable **GitHub Pages**. -> *Solves "I want it to be online".*
4.  **Build APK:** Configure Capacitor and generate the APK file. -> *Solves "I wish it could be an apk".*

**Validation:** Do you approve this transition to a "Standalone/Offline-First" architecture to enable the APK and simple hosting?