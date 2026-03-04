# 🔧 FIX : getTopTargets() - Forcer sélection des gros serveurs

## ❌ PROBLÈME ACTUEL

`calculateScore()` ligne 282 utilise `hackChance` :

```javascript
chance = ns.formulas.hacking.hackChance(server, player);
score = (server.moneyMax * chance) / (time / 1000);
```

**Résultat** : Serveurs avec security +40 ont score ≈ 0 → PAS sélectionnés → JAMAIS préparés

---

## ✅ SOLUTION

Modifier `calculateScore()` pour scorer sur `moneyMax` SEULEMENT (ignorer security/chance).

### **Modification dans `/lib/network.js` ligne 272-290**

**REMPLACER** :

```javascript
// Si Formulas.exe est disponible, utiliser calculs précis
if (this.caps.formulas) {
    try {
        time = ns.formulas.hacking.weakenTime(server, player);
        chance = ns.formulas.hacking.hackChance(server, player);
        
        // Score = argent par seconde pondéré par la chance
        score = (server.moneyMax * chance) / (time / 1000);
    } catch (e) {
        // Fallback
        score = server.moneyMax / server.minDifficulty;
        time = 0;
        chance = 0;
    }
} else {
    // Approximation simple sans formulas
    score = server.moneyMax / server.minDifficulty;
    
    try {
        chance = ns.hackAnalyzeChance(hostname);
    } catch (e) {
        chance = 0;
    }
}
```

**PAR** :

```javascript
// 🆕 v45.5 : Score basé sur POTENTIEL (moneyMax) uniquement
// On ignore security/chance pour que les gros serveurs soient sélectionnés
// même s'ils ne sont pas prêts → Le Batcher les préparera automatiquement

if (this.caps.formulas) {
    try {
        time = ns.formulas.hacking.weakenTime(server, player);
        chance = ns.formulas.hacking.hackChance(server, player);
        
        // Score = potentiel MAX (ignorer état actuel)
        score = server.moneyMax / server.minDifficulty;
    } catch (e) {
        score = server.moneyMax / server.minDifficulty;
        time = 0;
        chance = 0;
    }
} else {
    // Score basé sur potentiel MAX
    score = server.moneyMax / server.minDifficulty;
    
    try {
        chance = ns.hackAnalyzeChance(hostname);
    } catch (e) {
        chance = 0;
    }
}
```

---

## 📊 RÉSULTAT ATTENDU

**AVANT** :
```
Top 3 cibles : silver-helix, max-hardware, sigma-cosmetics
(serveurs prêts avec hackChance élevé)
```

**APRÈS** :
```
Top 3 cibles : NETLINK, COMPUTEK, ROTHMAN-UN
(serveurs avec plus gros moneyMax, même si pas prêts)
```

Le Batcher détectera qu'ils ne sont pas prêts et créera des batches de préparation !

---

## 🚀 DÉPLOIEMENT

1. Modifiez `/lib/network.js` ligne 272-290
2. `run global-kill.js`
3. `run boot.js`
4. Attendez 5-10 minutes

**Vous verrez** :
- Dashboard : NETLINK, COMPUTEK, ROTHMAN-UN sélectionnés
- Threads : W:8000+ (préparation massive)
- Security descend progressivement
- Après 20-30min : Serveurs prêts → PROFIT !

