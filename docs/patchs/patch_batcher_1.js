🔧 MODIFICATIONS À FAIRE (v45.3)
1. Ajouter ces méthodes APRÈS _calculateOptimalHackPercent() (ligne ~228): 

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🆕 v45.3 : VÉRIFIER STATUT DE PRÉPARATION
 * ═══════════════════════════════════════════════════════════════════════════════
 */
_checkPrepStatus(server) {
    const securityMargin = 5;  // Max +5 au-dessus de minDifficulty
    const moneyThreshold = 0.75;  // Min 75% de moneyMax
    
    const securityDelta = server.hackDifficulty - server.minDifficulty;
    const moneyPercent = server.moneyAvailable / server.moneyMax;
    
    const securityOK = securityDelta <= securityMargin;
    const moneyOK = moneyPercent >= moneyThreshold;
    
    if (securityOK && moneyOK) {
        return {
            ready: true,
            needsWeaken: false,
            needsGrow: false
        };
    }
    
    return {
        ready: false,
        needsWeaken: !securityOK,
        needsGrow: !moneyOK,
        securityDelta: securityDelta,
        moneyPercent: moneyPercent
    };
}

/**
 * 🆕 v45.3 : CRÉER BATCH DE PRÉPARATION
 */
_createPrepBatch(target, prepStatus) {
    const server = this.ns.getServer(target);
    const { weakenRam, growRam } = this._getWorkerRamCosts();
    const jobs = [];
    
    // WEAKEN si security trop haute
    if (prepStatus.needsWeaken) {
        const securityToReduce = prepStatus.securityDelta;
        let weakenThreads = Math.ceil(securityToReduce / 0.05);
        weakenThreads = Math.min(weakenThreads, 5000);  // Max 5000 threads
        
        if (weakenThreads > 0) {
            jobs.push({
                type: 'weaken',
                target: target,
                threads: weakenThreads,
                delay: 0,
                ramPerThread: weakenRam
            });
        }
    }
    
    // GROW si money trop bas
    if (prepStatus.needsGrow) {
        const currentMoney = Math.max(1, server.moneyAvailable);
        const targetMoney = server.moneyMax;
        const growMultiplier = targetMoney / currentMoney;
        
        let growThreads = Math.ceil(this.ns.growthAnalyze(target, growMultiplier));
        growThreads = Math.min(growThreads, 5000);  // Max 5000 threads
        
        if (growThreads > 0) {
            jobs.push({
                type: 'grow',
                target: target,
                threads: growThreads,
                delay: 0,
                ramPerThread: growRam
            });
            
            // Weaken compensatoire
            const compensateWeakenThreads = Math.ceil((growThreads * 0.004) / 0.05);
            jobs.push({
                type: 'weaken',
                target: target,
                threads: compensateWeakenThreads,
                delay: 0,
                ramPerThread: weakenRam
            });
        }
    }
    
    return jobs;
}

2. Modifier executeBatch() AU DÉBUT (ligne ~119)
REMPLACER de ligne 119 à 127 :
// 1. Préparer le serveur (weaken si nécessaire)
const prepared = await this._prepareTarget(target);
if (!prepared) {
    this.log.warn(`⚠️  Préparation échouée pour ${target}`);
    return { success: false, jobs: [], threadsUsed: 0 };
}
PAR :
// 1. Vérifier si le serveur nécessite préparation
const server = this.ns.getServer(target);
const prepStatus = this._checkPrepStatus(server);

if (!prepStatus.ready) {
    // Serveur pas prêt → Créer batch de préparation
    const prepJobs = this._createPrepBatch(target, prepStatus);
    
    if (!prepJobs || prepJobs.length === 0) {
        return { success: false, jobs: [], threadsUsed: 0 };
    }
    
    const packedJobs = this._packJobs(prepJobs);
    const dispatched = await this._dispatchJobs(packedJobs);
    
    this._metrics.batchesCreated++;
    
    return { success: dispatched > 0, jobs: packedJobs, threadsUsed: dispatched };
}

// Serveur prêt → Continuer avec batch HWGW normal
```

---

### **3. Supprimer `_prepareTarget()` (ligne ~658)**

**SUPPRIMER** complètement la méthode `_prepareTarget()` (elle ne fait plus rien d'utile).

---

## 🎯 **RÉSUMÉ DES CHANGEMENTS**

| Fichier | Action | Ligne |
|---------|--------|-------|
| `batcher.js` | Ajouter `_checkPrepStatus()` | Après ligne 228 |
| `batcher.js` | Ajouter `_createPrepBatch()` | Après `_checkPrepStatus()` |
| `batcher.js` | Modifier `executeBatch()` début | Ligne 119-127 |
| `batcher.js` | Supprimer `_prepareTarget()` | Ligne ~658 |

---

## ✅ **RÉSULTAT ATTENDU**

**AVANT** :
```
⚙️ THREADS : 💸H:12.8k  💪G:0  🛡️W:0  ← QUE DES HACKS
🛡️ OMEGA-NET  |   M:92%  S:+87.8  ← Security trop haute
```

**APRÈS** :
```
⚙️ THREADS : 💸H:0  💪G:2k  🛡️W:3k  ← PRÉPARATION !
🛡️ OMEGA-NET  |   M:92%  S:+87.8 → S:+5  ← Security descend
```

Puis une fois security OK :
```
⚙️ THREADS : 💸H:500  💪G:300  🛡️W:200  ← HWGW équilibré
🛡️ OMEGA-NET  |   M:95%  S:+2  ← Serveur préparé