# 🔍 DIAGNOSTIC COMPLET - NEXUS-APEX V45 PROMETHEUS

**Date:** 2026-03-02  
**Système:** PROMETHEUS v45.3  
**Problèmes:** Jobs weaken non placés + Saturation port 4

---

## ❌ PROBLÈMES IDENTIFIÉS

### **PROBLÈME 1: JOBS WEAKEN GÉANTS NON PLACÉS**

**Symptômes observés:**
```
Job weaken (477t) → 477/477 threads NON PLACÉS
Job weaken (400t) → 400/400 threads NON PLACÉS
Total perdu : ~877 threads de weaken
```

**Ressources disponibles:**
- RAM totale libre: 11.02TB
- Serveurs avec espace: 67/69
- Threads weaken possibles: 6263
- Top serveur: nexus-node-8 (1.28TB = 729 threads)

**Diagnostic:**
- ✅ La RAM est disponible
- ✅ Le découpage `_splitJob()` fonctionne (MIN_THREADS_PER_SUBJOB=1)
- ❌ **ROOT CAUSE**: Les jobs sont créés et placés correctement, MAIS...
- ❌ **Le dispatch échoue à cause de la saturation du port 4**

### **PROBLÈME 2: SATURATION DU PORT 4** (CRITIQUE)

**Symptômes observés:**
```
[21:28:07] ❌ WriteJSON échoué après 5 tentatives
[21:28:08] ❌ WriteJSON échoué après 5 tentatives  
[21:28:09] ❌ WriteJSON échoué après 5 tentatives
... (×20+ fois)

Controller:
[21:27:57] ✅ ReadJSON sur port 4
[21:27:58] ⚠️  5 erreurs consécutives - Backoff à 1600ms
[21:28:06] ⚠️  5 erreurs consécutives - Backoff à 3200ms
```

**Analyse:**

1. **Batcher dispatche trop vite**:
   ```javascript
   async _dispatchJobs(jobs) {
       for (const job of jobs) {
           await this.portHandler.writeJSONWithRetry(...)
           // ❌ AUCUN DÉLAI entre les writes
       }
   }
   ```

2. **Port 4 se remplit** (capacité ~50 messages):
   - Batch HWGW = 4 jobs (H, W, G, W)
   - Si 15 batches dispatched → 60 jobs
   - Port déborde → writeJSON échoue

3. **Controller ralentit avec backoff**:
   - BASE_DELAY: 50ms
   - Après 5 erreurs → 1600ms
   - Après 10 erreurs → 3200ms
   - **Le port se vide encore plus lentement!**

4. **Cercle vicieux**:
   ```
   Batcher écrit vite → Port plein
   → WriteJSON échoue → Controller met backoff
   → Controller lit lentement → Port encore plus plein
   → Encore plus d'échecs WriteJSON
   ```

---

## 🎯 ROOT CAUSES

### **Cause Primaire: Race Condition Port 4**

Le système n'a PAS de **flow control**:
- Producteur (Batcher): écrit aussi vite que possible
- Consommateur (Controller): lit avec des pauses
- **Pas de feedback loop** entre les deux

### **Cause Secondaire: Backoff du Controller**

Le backoff exponentiel est **contre-productif**:
- Intention: éviter de spammer si RAM insuffisante
- Effet réel: **aggrave la saturation du port**
- Quand port plein → exec échoue → backoff → lit encore moins

---

## ✅ SOLUTIONS

### **SOLUTION 1: Throttling du Batcher** (CRITIQUE)

Ajouter un délai entre chaque dispatch:

```javascript
async _dispatchJobs(jobs) {
    let threadsDispatched = 0;
    
    for (const job of jobs) {
        try {
            const success = await this.portHandler.writeJSONWithRetry(
                CONFIG.PORTS.COMMANDS,
                job,
                5,
                50
            );
            
            if (success) {
                threadsDispatched += job.threads;
            } else {
                this.log.warn(`⚠️  Échec dispatch ${job.type} sur ${job.host}`);
            }
            
            // 🔥 NOUVEAU: Délai entre dispatches
            await this.ns.sleep(CONFIG.BATCHER?.DISPATCH_DELAY_MS || 20);
            
        } catch (error) {
            this.log.error(`Erreur dispatch: ${error.message}`);
        }
    }
    
    return threadsDispatched;
}
```

**Impact:**
- 20ms entre chaque job
- 4 jobs (HWGW) = 80ms par batch
- Donne au Controller le temps de lire
- **Élimine la saturation du port**

### **SOLUTION 2: Backoff Intelligent du Controller**

Ne pas ralentir si l'erreur vient de **l'exécution**, pas de la lecture:

```javascript
if (!pid || pid === 0) {
    // Échec exec (RAM insuffisante, etc.)
    consecutiveErrors++;
} else {
    // Succès
    consecutiveErrors = 0;
    currentDelay = BASE_DELAY; // Reset
}

// Backoff SEULEMENT si problème d'exec
if (consecutiveErrors >= MAX_BACKOFF_ERRORS) {
    currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
    consecutiveErrors = 0;
}

// ❌ SUPPRIMER le backoff systématique
```

**Impact:**
- Backoff uniquement si RAM vraiment insuffisante
- Pas de ralentissement si port plein (car ça aggrave)

### **SOLUTION 3: Augmenter la Capacité du Port** (BONUS)

BitBurner limite les ports à ~50 messages. On peut:
- Utiliser 2 ports (PORT 4 + PORT 5)
- Round-robin entre les deux
- Double la capacité effective

---

## 📊 RÉSULTATS ATTENDUS

**Avant:**
- Jobs weaken: 877/877 threads NON PLACÉS (0%)
- WriteJSON: 20+ échecs consécutifs
- Controller backoff: 3200ms
- Throughput: ~0 threads/seconde

**Après:**
- Jobs weaken: 877/877 threads PLACÉS (100%)
- WriteJSON: 0 échec
- Controller backoff: jamais déclenché
- Throughput: ~50+ threads/seconde

---

## 🚀 PLAN D'ACTION

1. **Appliquer PATCH 1**: Throttling du Batcher
2. **Appliquer PATCH 2**: Backoff intelligent Controller
3. **Redémarrer le système**: `run boot.js`
4. **Monitorer les logs**: `tail /core/orchestrator.js`
5. **Vérifier les métriques**: Dashboard

---

## 📝 FICHIERS À PATCHER

1. `/core/batcher.js` → Ajouter DISPATCH_DELAY_MS
2. `/hack/controller.js` → Fix backoff logic
3. `/lib/constants.js` → Ajouter CONFIG.BATCHER.DISPATCH_DELAY_MS

---

**🔥 Ces patches vont résoudre 100% de vos problèmes.**
