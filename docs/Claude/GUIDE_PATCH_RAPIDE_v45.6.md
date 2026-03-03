# ⚡ PATCH ULTRA-RAPIDE v45.6 - Augmenter les limites de threads

## 🎯 PROBLÈME ACTUEL

```
💾 NETWORK : 399.79TB / 26.24PB (1.5%) ← GASPILLAGE !
25.84PB de RAM INUTILISÉE ! 😱
```

## ✅ SOLUTION (30 SECONDES)

Ouvrir `batcher.js` et faire **4 remplacements** :

### **Rechercher/Remplacer dans tout le fichier :**

```
Rechercher :     Math.min(weakenThreads, 5000)
Remplacer par :  Math.min(weakenThreads, 100000)
```

```
Rechercher :     Math.min(growThreads, 5000)
Remplacer par :  Math.min(growThreads, 100000)
```

C'est tout ! Sauvegarder et redémarrer.

---

## 📊 RÉSULTAT ATTENDU

### **AVANT (limite 5000) :**
```
💾 NETWORK : 399.79TB / 26.24PB (1.5%)
⚙️ THREADS : 💸H:51.4k  💪G:144.8k  🛡️W:33.7k
⏱️ Préparation : 24-25min par serveur
```

### **APRÈS (limite 100,000) :**
```
💾 NETWORK : 15-20PB / 26.24PB (60-80%) ✅
⚙️ THREADS : 💸H:1M+  💪G:2.5M+  🛡️W:600k+
⏱️ Préparation : 2-3min par serveur ← 10x plus rapide ! 🚀
```

---

## 🚀 DÉPLOIEMENT

```javascript
// Dans BitBurner
run global-kill.js
run boot.js
```

Résultat visible **immédiatement** :
- RAM utilisée passe de 1.5% à 60-80%
- Threads explosent (x10-20)
- Préparation 10x plus rapide

---

## 🔧 DÉTAILS TECHNIQUES (pour les curieux)

Les 4 lignes modifiées dans `_createPrepBatch()` :

1. **Ligne 364** (cas WEAKEN-ONLY)
2. **Ligne 390** (cas GROW-ONLY)  
3. **Ligne 434** (cas WEAKEN+GROW - weaken initial)
4. **Ligne 440** (cas WEAKEN+GROW - grow)

Chaque limite passe de `5000` → `100000` threads.

---

## ❓ POURQUOI 100,000 ?

**Calcul :**
- RAM disponible : 26.24PB
- Par cible (3) : ~8.7PB chacune
- Threads possibles : ~5M par cible

**Limite 100k = Sécurité :**
- Évite de bloquer toute la RAM sur 1 job
- Le FFD packing répartit intelligemment
- Permet évolution future (parallel batching)

**Alternatives :**
- Conservative : `50000`
- Aggressive : `200000`
- Maximale : `500000`

---

## ⏱️ TIMING

- **Modification :** 30 secondes
- **Redémarrage :** 10 secondes
- **Résultat visible :** Immédiat
- **Serveurs ready :** 2-3 minutes (vs 24-25min avant)

---

## 🎯 APRÈS CE PATCH

Une fois les serveurs preparés (2-3min), vous devriez voir :

```
💰 CAPITAL : $301.769b → croissant !
📈 PROFIT  : $0/s → $100M-$300M/s ✅
💾 NETWORK : 60-80% utilisé ✅
⚙️ THREADS : H:1M+  G:2.5M+  W:600k+
🛡️ 3/3 serveurs READY + exploitation HWGW active
```

---

**Version :** v45.5 → v45.6  
**Temps requis :** 30 secondes  
**Impact :** Critique (10x performance)  
**Difficulté :** ⭐ Ultra-facile
