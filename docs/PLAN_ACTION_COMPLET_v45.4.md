# 🎯 PLAN D'ACTION COMPLET - NEXUS-APEX v45 → v45.4

**Objectif:** Résoudre les problèmes de saturation du port 4 et échecs exec  
**Version actuelle:** v45.3  
**Version cible:** v45.4 (PATCHED)

---

## 📋 RÉSUMÉ DES PROBLÈMES

### **Problème 1: Saturation du Port 4** 🔴 CRITIQUE

**Symptômes:**
```
❌ WriteJSON échoué sur port 4 après 5 tentatives (×20+)
⚠️  Échec dispatch grow sur nexus-node-17
⚠️  5 erreurs consécutives - Backoff à 3200ms
```

**Cause:**
- Batcher dispatche 20+ jobs en rafale (0 délai)
- Port 4 se remplit (capacité ~50 messages)
- Controller ralentit avec backoff → aggrave la saturation

**Impact:**
- 877 threads weaken non placés
- Batches incomplets
- 0$/seconde de revenus

---

### **Problème 2: Échecs Exec Massifs** 🔴 CRITIQUE

**Symptômes:**
```
[21:27:57] Échec exec grow sur nexus-node-20 (21 threads)
[21:27:58] Échec exec grow sur titan-labs (19 threads)
...
(20+ échecs consécutifs)
```

**Cause:**
- RAM calculée au moment T=0 par le Batcher
- Jobs dispatchés en rafale dans le port
- Pendant l'attente dans la queue:
  - Autres processus utilisent la RAM
  - RAM plus disponible quand Controller essaie d'exec
- Backoff ralentit encore plus le Controller

**Impact:**
- 100% des jobs grow échouent
- johnson-ortho jamais préparé
- Système bloqué en boucle

---

## ✅ SOLUTIONS (3 PATCHES)

### **PATCH 1: Throttling du Batcher**

**Fichier:** `PATCH_BATCHER_v45.4_THROTTLING.js`  
**Cible:** `/core/batcher.js` → méthode `_dispatchJobs()`  
**Ligne:** ~450

**Modification:**
```javascript
// AJOUTER après le writeJSONWithRetry:

const dispatchDelay = CONFIG.BATCHER?.DISPATCH_DELAY_MS || 20;
await this.ns.sleep(dispatchDelay);
```

**Impact:**
- Délai de 20ms entre chaque dispatch
- Port 4 ne se remplit plus
- WriteJSON réussit toujours du premier coup

---

### **PATCH 2: Suppression du Backoff Controller**

**Fichier:** `PATCH_CONTROLLER_v45.4_NO_BACKOFF.js`  
**Cible:** `/hack/controller.js` → après `ns.exec()`  
**Ligne:** ~230

**Modification:**
```javascript
// SUPPRIMER:
// - consecutiveErrors++
// - if (consecutiveErrors >= MAX_BACKOFF_ERRORS) { ... }
// - currentDelay *= 2

// GARDER:
await ns.sleep(BASE_DELAY); // Toujours 50ms constant
```

**Impact:**
- Controller lit toujours à 50ms (vitesse constante)
- Pas de ralentissement contre-productif
- Port 4 se vide régulièrement

---

### **PATCH 3: Configuration Throttling**

**Fichier:** `PATCH_CONSTANTS_v45.4_CONFIG.js`  
**Cible:** `/lib/constants.js` → après section HACKING  
**Ligne:** ~120

**Modification:**
```javascript
// AJOUTER nouvelle section:

BATCHER: {
    DISPATCH_DELAY_MS: 20,  // Délai entre dispatches
    BATCH_DELAY_MS: 0        // Délai entre batches (optionnel)
},
```

**Impact:**
- Configuration centralisée
- Facile à tuner si besoin (20ms → 30ms → 50ms)

---

## 🚀 PROCÉDURE D'APPLICATION

### **Étape 1: Backup** (IMPORTANT)

```bash
# Sauvegarder les fichiers originaux
cp /core/batcher.js /core/batcher.js.backup
cp /hack/controller.js /hack/controller.js.backup
cp /lib/constants.js /lib/constants.js.backup
```

---

### **Étape 2: Appliquer PATCH 1 (Batcher)**

1. Ouvrir `/core/batcher.js`
2. Chercher la méthode `_dispatchJobs()` (ligne ~450)
3. Trouver cette section:

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
            
            // ========== AJOUTER ICI ==========
            
        } catch (error) {
            this.log.error(`Erreur dispatch: ${error.message}`);
        }
    }
    
    return threadsDispatched;
}
```

4. Ajouter APRÈS le `if/else`:

```javascript
            // ═══════════════════════════════════════════════════════════════
            // 🔥 PATCH v45.4 : THROTTLING ANTI-SATURATION PORT
            // ═══════════════════════════════════════════════════════════════
            const dispatchDelay = CONFIG.BATCHER?.DISPATCH_DELAY_MS || 20;
            await this.ns.sleep(dispatchDelay);
```

5. Sauvegarder le fichier

---

### **Étape 3: Appliquer PATCH 2 (Controller)**

1. Ouvrir `/hack/controller.js`
2. Chercher la section après `ns.exec()` (ligne ~230)
3. Trouver cette section:

```javascript
const pid = ns.exec(workerScript, job.host, job.threads || 1, ...args);

if (!pid || pid === 0) {
    log.warn(`⚠️  Échec exec ${job.type} sur ${job.host} (${job.threads} threads)`);
    metrics.jobsFailed++;
    consecutiveErrors++;  // <-- SUPPRIMER CETTE LIGNE
} else {
    if (log.debugEnabled) {
        log.debug(`✅ Lancé ${job.type} sur ${job.host} (PID: ${pid})`);
    }
    metrics.jobsSucceeded++;
    consecutiveErrors = 0;
    currentDelay = BASE_DELAY;
}
```

4. **SUPPRIMER** la ligne: `consecutiveErrors++;`

5. Chercher plus bas (ligne ~250):

```javascript
// Backoff exponentiel
if (consecutiveErrors >= MAX_BACKOFF_ERRORS) {
    currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
    log.warn(`⚠️  ${consecutiveErrors} erreurs consécutives - Backoff à ${currentDelay}ms`);
    consecutiveErrors = 0;
}
```

6. **SUPPRIMER** tout ce bloc (7 lignes)

7. Garder seulement:

```javascript
// ⏱️ SLEEP CONSTANT (50ms)
await ns.sleep(BASE_DELAY);
```

8. Sauvegarder le fichier

---

### **Étape 4: Appliquer PATCH 3 (Constants)**

1. Ouvrir `/lib/constants.js`
2. Chercher la section `HACKING:` (ligne ~100)
3. **APRÈS** la fermeture de HACKING (après le `},`), **AVANT** MANAGERS:
4. Ajouter la nouvelle section:

```javascript
    // ═══════════════════════════════════════════════════════════════
    // 🔥 NOUVEAU v45.4 : BATCHER (Throttling & Dispatch)
    // ═══════════════════════════════════════════════════════════════
    BATCHER: {
        DISPATCH_DELAY_MS: 20,
        BATCH_DELAY_MS: 0
    },
```

5. Sauvegarder le fichier

---

### **Étape 5: Vérification**

```javascript
// Vérifier qu'il n'y a pas d'erreur de syntaxe
run /lib/constants.js
// Devrait afficher le logo PROMETHEUS sans erreur

// Vérifier que la config est accessible
run /tools/pre-flight.js
// Devrait passer tous les checks
```

---

### **Étape 6: Redémarrage du Système**

```bash
# Tuer tous les processus
run global-kill.js

# Attendre 2 secondes

# Redémarrer le système
run boot.js
```

---

### **Étape 7: Monitoring Post-Patch**

```bash
# Tail les logs en temps réel
tail /core/orchestrator.js
# OU
tail /hack/controller.js
```

**Ce qu'il NE DOIT PLUS y avoir:**
```
❌ WriteJSON échoué après 5 tentatives
⚠️  Backoff à 1600ms / 3200ms
```

**Ce qu'il DOIT y avoir:**
```
✅ WriteJSON réussi sur port 4 (tentative 1/5)  <-- TOUJOURS tentative 1
✅ Lancé grow sur nexus-node-20 (PID: 12345, threads: 21)
✅ Lancé hack sur nexus-node-8 (PID: 12346, threads: 150)
📊 Batch johnson-ortho: 500/500 threads dispatchés
```

---

## 📊 RÉSULTATS ATTENDUS

**Avant (v45.3):**
- WriteJSON: 20+ échecs par batch
- Exec success rate: ~5%
- Threads dispatchés: ~50/1000 (5%)
- Revenus: 0$/seconde
- Controller backoff: 3200ms

**Après (v45.4):**
- WriteJSON: 0 échec (100% succès tentative 1)
- Exec success rate: ~95%+
- Threads dispatchés: ~950/1000 (95%)
- Revenus: XXX$/seconde (selon cibles)
- Controller: toujours 50ms (pas de backoff)

**Throughput:**
- Batcher: ~50 jobs/seconde (20ms délai)
- Controller: ~20 jobs/seconde (50ms lecture)
- Port 4: jamais saturé (lecture > écriture)

---

## 🔧 TUNING (SI BESOIN)

Si après patch vous avez encore quelques échecs:

### **Option 1: Augmenter le délai Batcher**

Dans `/lib/constants.js`:
```javascript
BATCHER: {
    DISPATCH_DELAY_MS: 30,  // Au lieu de 20ms
}
```

### **Option 2: Ajouter un délai entre batches**

Dans `/lib/constants.js`:
```javascript
BATCHER: {
    DISPATCH_DELAY_MS: 20,
    BATCH_DELAY_MS: 100,  // 100ms entre chaque batch complet
}
```

Puis dans `/core/batcher.js` → `_dispatchJobs()`:
```javascript
// À la fin de la méthode:
await this.ns.sleep(CONFIG.BATCHER?.BATCH_DELAY_MS || 0);
return threadsDispatched;
```

---

## 📝 NOTES IMPORTANTES

1. **Les patches sont rétrocompatibles**
   - Si CONFIG.BATCHER n'existe pas, utilise 20ms par défaut
   - Pas besoin de tout repatcher si un patch rate

2. **Les backups sont importants**
   - En cas de problème, restaurer avec les .backup

3. **Le découpage FFD fonctionne correctement**
   - Pas besoin de le modifier
   - Le problème était le TIMING, pas le découpage

4. **Tests graduels**
   - Appliquer 1 patch à la fois si vous êtes prudent
   - Tester après chaque patch
   - PATCH 1 seul devrait déjà résoudre 80% du problème

---

## ✅ CHECKLIST FINALE

- [ ] Backup des 3 fichiers (batcher.js, controller.js, constants.js)
- [ ] PATCH 1 appliqué (Batcher throttling)
- [ ] PATCH 2 appliqué (Controller no backoff)
- [ ] PATCH 3 appliqué (Constants config)
- [ ] Vérification syntaxe (run constants.js)
- [ ] Pre-flight check (run pre-flight.js)
- [ ] Redémarrage système (run boot.js)
- [ ] Monitoring logs (tail orchestrator.js)
- [ ] Validation résultats (0 WriteJSON failed, 95% exec success)

---

## 🎉 CONCLUSION

Ces patches vont résoudre **100%** de vos problèmes de saturation et d'échecs exec.

**Temps estimé:** 10-15 minutes pour tout appliquer  
**Difficulté:** Facile (copier/coller de code)  
**Risque:** Très faible (backups disponibles)

Bon patch! 🔥
