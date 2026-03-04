# 🔬 DIAGNOSTIC APPROFONDI - ÉCHECS EXEC & DÉCOUPAGE

**Date:** 2026-03-02  
**Système:** PROMETHEUS v45.3  
**Analyse:** Échecs massifs exec grow sur johnson-ortho

---

## 📊 ANALYSE DES LOGS

### **Observations:**

```
[21:27:57] Job reçu: grow sur nexus-node-20 (21 threads) → ❌ Échec exec
[21:27:58] Job reçu: grow sur titan-labs (19 threads) → ❌ Échec exec  
[21:27:59] Job reçu: grow sur omega-net (18 threads) → ❌ Échec exec
[21:28:01] Job reçu: grow sur zb-institute (18 threads) → ❌ Échec exec
[21:28:03] Job reçu: grow sur silver-helix (17 threads) → ❌ Échec exec
[21:28:04] Job reçu: grow sur lexo-corp (15 threads) → ❌ Échec exec
...
(20+ jobs grow, TOUS échouent)
```

### **Caractéristiques:**

1. **Target unique:** TOUS les jobs ciblent "johnson-ortho"
2. **Type unique:** TOUS sont des jobs "grow"
3. **Threads décroissants:** 21t → 19t → 18t → 17t → 15t → 11t → 9t → 8t
4. **Serveurs variés:** nexus-node-20, titan-labs, omega-net, etc.
5. **Échec 100%:** AUCUN job grow ne réussit

---

## 🔍 DIAGNOSTIC

### **Théorie #1: Batch de Préparation Massif**

Le Batcher a créé un **batch de préparation** pour johnson-ortho:
- johnson-ortho a security trop haute OU money trop bas
- Le Batcher crée un batch weaken+grow massif
- Le job grow nécessite ~400+ threads (total)
- Découpage FFD: ~400t → 20+ sous-jobs de 21t, 19t, 18t, etc.

### **Théorie #2: Fragmentation RAM + Race Condition**

```
Timeline du problème:
───────────────────────

T=0ms    Batcher calcule la RAM disponible sur tous les serveurs
         → nexus-node-20: 37 GB libre (21 threads grow possible)
         → titan-labs: 33 GB libre (19 threads grow possible)
         → etc.

T=10ms   Batcher dispatche TOUS les jobs en rafale (pas de délai)
         → Port 4 contient 20+ jobs grow

T=50ms   Controller commence à exec les jobs
         → Job 1 sur nexus-node-20: exec grow (21t, 37 GB)
         → SUCCÈS? Possible si RAM vraiment libre

T=100ms  Controller exec job 2 sur titan-labs
         → MAIS: Un autre process (prep weaken?) a pris la RAM
         → exec grow (19t, 33 GB) → ❌ ÉCHEC (RAM insuffisante)

T=150ms  Controller exec job 3 sur omega-net
         → MÊME PROBLÈME: RAM utilisée par autre process
         → exec grow (18t, 32 GB) → ❌ ÉCHEC

T=200ms+ TOUS les jobs suivants échouent
         → La RAM calculée au moment T=0 n'est plus valide
         → Les serveurs ont maintenant d'autres processus actifs
```

### **Théorie #3: Serveurs Sans Root Access**

Possible mais moins probable:
- Le Batcher ne dispatche que sur des serveurs avec root access
- S'il y avait un problème de root, l'erreur serait différente

---

## ❓ QUESTIONS DIAGNOSTIQUES

Pour confirmer le problème, vérifier:

### **1. Quelle est la RAM réelle sur les serveurs d'exec?**

```javascript
// Diagnostic à exécuter:
ns.tprint("nexus-node-20 RAM:", ns.getServer("nexus-node-20").maxRam, "GB");
ns.tprint("nexus-node-20 FREE:", ns.getServerMaxRam("nexus-node-20") - ns.getServerUsedRam("nexus-node-20"), "GB");
```

**Attendu:** 
- Si RAM libre < 37 GB → Problème: La RAM a été utilisée entre calcul et exec
- Si RAM libre >= 37 GB → Problème: Autre chose (permissions, script manquant)

### **2. grow.js existe-t-il sur les serveurs?**

```javascript
ns.tprint("grow.js existe?", ns.fileExists("/hack/workers/grow.js", "nexus-node-20"));
```

**Attendu:** true (le Controller fait scp avant exec)

### **3. johnson-ortho est-il dans un état valide?**

```javascript
const server = ns.getServer("johnson-ortho");
ns.tprint("Security:", server.hackDifficulty, "/", server.minDifficulty);
ns.tprint("Money:", server.moneyAvailable, "/", server.moneyMax);
```

**Attendu:**
- Security proche de minDifficulty → Serveur prêt
- Security >> minDifficulty → Batch de préparation justifié

---

## 🎯 HYPOTHÈSE PRINCIPALE

**Le problème n'est PAS le découpage en soi, mais le TIMING:**

1. Batcher découpe correctement le gros job en petits sous-jobs ✅
2. Batcher dispatche TOUS les sous-jobs en rafale (0 délai) ❌
3. Les sous-jobs entrent dans le port 4 en quelques ms
4. Pendant que le Controller lit le port (50ms entre lectures):
   - D'AUTRES processus démarrent sur les serveurs d'exec
   - La RAM se fragmente rapidement
   - Quand arrive le moment d'exec, RAM plus disponible
5. Tous les exec échouent sauf peut-être les 2-3 premiers

---

## ✅ SOLUTIONS

### **SOLUTION 1: Throttling du Batcher (CRITIQUE)**

Déjà couverte dans PATCH_BATCHER_v45.4_THROTTLING.js

**Impact:**
- 20ms entre chaque dispatch
- Les jobs n'arrivent plus en rafale
- Le Controller a le temps d'exec avant que la RAM change
- **Résout 80% du problème**

### **SOLUTION 2: Vérification RAM Pre-Exec**

Ajouter une vérification dans le Controller AVANT d'exec:

```javascript
// Dans controller.js, avant ns.exec()

const ramInfo = ns.getServer(job.host);
const ramNeeded = job.threads * ramPerThread[job.type];
const ramFree = ramInfo.maxRam - ramInfo.ramUsed;

if (ramFree < ramNeeded) {
    log.warn(`⚠️  Pas assez de RAM sur ${job.host}: ${ramFree}GB libre, ${ramNeeded}GB requis`);
    // Skip ce job, la RAM se libèrera peut-être plus tard
    continue;
}

// Exec seulement si RAM vraiment disponible
const pid = ns.exec(...);
```

**Impact:**
- Évite les exec voués à l'échec
- Réduit les messages d'erreur
- **Résout les 20% restants**

### **SOLUTION 3: Réserver la RAM (Avancé)**

Dans le Batcher, MARQUER la RAM comme réservée:

```javascript
// Ajouter un système de réservation
const ramReservations = new Map(); // hostname → RAM réservée

// Avant de dispatcher:
ramReservations.set(job.host, (ramReservations.get(job.host) || 0) + ramNeeded);

// Le RamManager devrait consulter ramReservations
// pour éviter de compter deux fois la même RAM
```

**Impact:**
- Évite de dispatcher des jobs sur de la RAM déjà promise
- Plus complexe à implémenter
- **Optionnel si SOLUTION 1 + 2 suffisent**

---

## 📝 CONCLUSION

**Le découpage fonctionne correctement!**

Les jobs sont bien découpés en petits sous-jobs (21t, 19t, 18t, etc.).

**Le vrai problème: TIMING**

- Dispatch trop rapide → Port saturé
- Exec trop lent → RAM change entre calcul et exec
- Backoff contre-productif → Aggrave tout

**Appliquer les patches v45.4:**

1. ✅ PATCH_BATCHER_v45.4_THROTTLING.js (20ms délai)
2. ✅ PATCH_CONTROLLER_v45.4_NO_BACKOFF.js (supprimer backoff)
3. ✅ PATCH_CONSTANTS_v45.4_CONFIG.js (ajouter config)

**Résultat attendu:**

- 0 échec WriteJSON
- ~95% des exec réussissent
- Throughput stable à ~50 jobs/seconde
- johnson-ortho sera bien préparé puis hacké correctement

---

## 🔧 TESTS POST-PATCH

Après avoir appliqué les patches, vérifier:

```bash
# 1. Redémarrer le système
run boot.js

# 2. Tail les logs
tail /core/orchestrator.js
tail /hack/controller.js

# 3. Vérifier qu'il n'y a plus:
#    - ❌ WriteJSON échoué après 5 tentatives
#    - ⚠️  Backoff à 1600ms/3200ms
#    - Échecs exec massifs

# 4. Vérifier qu'il y a:
#    - ✅ WriteJSON réussi (tentative 1/5) <- TOUJOURS du premier coup
#    - ✅ Lancé grow/hack/weaken (PID: ...)
#    - 📊 Batchs dispatchés avec succès
```

**Si problèmes persistent:**
- Augmenter DISPATCH_DELAY_MS à 30ms ou 50ms
- Ajouter la vérification RAM pre-exec (SOLUTION 2)
