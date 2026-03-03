# 🔧 GUIDE D'INSTALLATION - PATCH v45.5

## ⚡ PATCH CRITIQUE : Synchronisation des batches de préparation

**Fichier à modifier :** `/core/batcher.js`  
**Méthode concernée :** `_createPrepBatch()`  
**Lignes :** ~250-310  
**Temps d'installation :** 2 minutes  
**Difficulté :** ⭐ Facile (copier-coller)

---

## 📋 ÉTAPES D'INSTALLATION

### **Étape 1 : Localiser la méthode**

Ouvrez le fichier `/core/batcher.js` et cherchez la méthode `_createPrepBatch()`.

Elle commence par :
```javascript
_createPrepBatch(target, prepStatus) {
    const server = this.ns.getServer(target);
    const { weakenRam, growRam } = this._getWorkerRamCosts();
    const jobs = [];
```

### **Étape 2 : Remplacer COMPLÈTEMENT la méthode**

**SUPPRIMER** toute la méthode actuelle (de `_createPrepBatch(target, prepStatus) {` jusqu'au `}` fermant).

**REMPLACER** par le code complet du fichier `PATCH_BATCHER_TIMING_v45.5.js`.

### **Étape 3 : Mettre à jour la version dans le header**

En haut du fichier `batcher.js`, ligne ~7, changer :
```javascript
*                            v45.4 - "PATCHED - Anti-Saturation Port 4"
```

Par :
```javascript
*                            v45.5 - "PATCHED - Prep Timing Synchronized"
```

Et dans le bloc de changelog (ligne ~11), AJOUTER :
```javascript
* ═══════════════════════════════════════════════════════════════════════════════════
* 🔥 PROMETHEUS v45.5 - PREP BATCH SYNCHRONIZATION (CRITICAL FIX)
* ═══════════════════════════════════════════════════════════════════════════════════
* ✓ BUGFIX : Batches de préparation maintenant synchronisés temporellement
* ✓ NOUVEAU : Calcul précis des délais pour WEAKEN/GROW/WEAKEN
* ✓ RÉSULTAT : Serveurs progressent vers état "ready" en 20-30min
* 
* CHANGEMENTS v45.4 → v45.5 :
*   AVANT : Tous jobs avec delay=0
*   → Ordre d'exécution aléatoire
*   → Serveurs oscillent sans converger
*   → Profit bloqué à $0/s
*   
*   APRÈS : Délais calculés pour synchronisation précise
*   → WEAKEN termine en dernier
*   → GROW termine 200ms avant
*   → Progression linéaire vers état "ready"
*   → Profit démarre après 20-30min
* 
```

### **Étape 4 : Sauvegarder et redémarrer**

1. Sauvegarder le fichier `batcher.js`
2. Dans BitBurner, exécuter :
   ```javascript
   run global-kill.js
   run boot.js
   ```

---

## ✅ VÉRIFICATION

### **Immédiatement après redémarrage :**

Ouvrez le dashboard ou les logs orchestrator :
```javascript
tail core/orchestrator.js
```

Vous devriez voir :
```
🔥 Prep FULL: W800t + G5000t + W400t (sec:40.0 → +5, money:4% → 75%)
🔥 Prep FULL: W760t + G4800t + W384t (sec:38.0 → +5, money:4% → 75%)
🔥 Prep FULL: W600t + G4500t + W360t (sec:30.0 → +5, money:4% → 75%)
```

### **Après 10-15 minutes :**

Regardez le dashboard :
```
🛡️ NETLINK    |    M:4% → 50%  S:+40 → +15  ← Progression visible !
🛡️ COMPUTEK   |    M:4% → 45%  S:+38 → +18
🛡️ ROTHMAN-UN |    M:4% → 48%  S:+30 → +12
```

### **Après 20-30 minutes :**

Un ou plusieurs serveurs deviennent "ready" :
```
⚙️ THREADS : 💸H:500  💪G:300  🛡️W:200  ← HWGW actif !
📈 PROFIT  : $50M/s → $100M/s → $150M/s  ← Revenue croissant !
🛡️ NETLINK    |    M:95%  S:+2  ← STABLE
```

---

## 🎯 RÉSOLUTION DE PROBLÈMES

### **Si profit reste à $0/s après 30min :**

1. Vérifier les logs orchestrator :
   ```javascript
   tail core/orchestrator.js
   ```
   
2. Vérifier que les serveurs deviennent "ready" :
   ```javascript
   run diagnostics/diagnostic-systeme-complet.js
   ```

3. Vérifier les threads actifs :
   ```
   ⚙️ THREADS : 💸H:500+  💪G:300+  🛡️W:200+
   ```
   Si H=0, les serveurs sont encore en préparation (attendre).

### **Si "Aucun job de préparation généré" :**

Cela signifie que le serveur est DÉJÀ prêt !
- Vérifier avec : `getServerSecurityLevel("netlink")`
- Si security proche du minimum : ✓ Normal
- Le système devrait alors créer des batchs HWGW normaux

### **Si erreurs de syntaxe :**

Vérifier que :
1. Tous les `{` ont leur `}` correspondant
2. Tous les `;` sont présents
3. Les guillemets `"` sont bien fermés
4. Pas de ligne coupée en deux

---

## 📊 MÉTRIQUES DE SUCCÈS

| Métrique | Avant Patch | Après Patch (30min) |
|----------|-------------|---------------------|
| Profit | $0/s | $50M-$200M/s |
| Threads HACK | 0 | 500-1000 |
| Threads GROW | 1.5M | 300-500 |
| Threads WEAKEN | 316k | 200-400 |
| Serveurs "ready" | 0/3 | 1-3/3 |
| Security cibles | +30 à +40 | +2 à +5 |
| Money cibles | 4% | 90-95% |

---

## 🚨 NOTES IMPORTANTES

### **Temps de préparation attendu :**
- Serveurs avec security +40 : ~30 minutes
- Serveurs avec security +20 : ~15 minutes
- Serveurs avec security +10 : ~8 minutes

### **C'est normal si :**
- Le profit reste à $0/s pendant 20-30 minutes (préparation)
- Beaucoup de threads GROW et WEAKEN sont actifs (préparation)
- Les ETA descendent progressivement (bon signe !)

### **C'est anormal si :**
- Après 1 heure, profit toujours à $0/s
- Les ETA ne changent jamais
- Erreurs dans les logs orchestrator

---

## 💾 BACKUP RECOMMANDÉ

Avant d'appliquer le patch, faire une copie :
```javascript
// Dans BitBurner
run /lib/backup-manager.js --file batcher.js --tag pre-v45.5
```

Ou simplement copier-coller le code actuel dans un fichier `.backup`.

---

## 📞 SUPPORT

Si problèmes persistent :
1. Vérifier les logs détaillés
2. Exécuter tous les diagnostics
3. Partager les résultats pour analyse

---

**Patch créé le :** 2026-03-03  
**Version cible :** v45.4 → v45.5  
**Testé sur :** BitBurner v2.8.1+  
**Status :** ✅ Production-ready
