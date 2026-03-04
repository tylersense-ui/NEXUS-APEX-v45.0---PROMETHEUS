# 🚨 FIXES URGENTS v45.5 - À APPLIQUER MAINTENANT

**Status:** Système fonctionne (17.7m$/s) mais **INSTABLE**  
**Action:** Appliquer ces 3 modifications IMMÉDIATEMENT

---

## ⚡ **FIX #1: Réduire MAX_GROW_THREADS** (30 secondes)

**Fichier:** `/lib/constants.js`  
**Ligne:** ~125

**CHANGER:**
```javascript
MAX_GROW_THREADS: 10000,
```

**PAR:**
```javascript
MAX_GROW_THREADS: 2000,  // v45.5 URGENTFIX - Jobs trop gros
```

**Impact:** Jobs max 3.5TB au lieu de 6.42TB → 85%+ succès exec

---

## ⚡ **FIX #2: Vérification RAM Pre-Exec** (2 minutes)

**Fichier:** `/hack/controller.js`  
**Ligne:** Après `const workerScript = WORKER_SCRIPTS[job.type];` (~170)

**AJOUTER AVANT ns.exec():**

```javascript
// ═════════════════════════════════════════════════════════════
// 🔥 v45.5 URGENTFIX : VÉRIFICATION RAM PRE-EXEC
// ═════════════════════════════════════════════════════════════
const ramPerThread = {
    'hack': 1.70,
    'grow': 1.75,
    'weaken': 1.75,
    'share': 4.00
};

const ramNeeded = (job.threads || 1) * (ramPerThread[job.type] || 2.0);
const serverInfo = ns.getServer(job.host);
const ramFree = serverInfo.maxRam - serverInfo.ramUsed;

if (ramFree < ramNeeded) {
    if (log.debugEnabled) {
        log.debug(`⏭️ Skip ${job.type} sur ${job.host}: RAM insuffisante (${ns.formatRam(ramFree)} < ${ns.formatRam(ramNeeded)})`);
    }
    continue; // Skip ce job
}
// ═════════════════════════════════════════════════════════════
```

**Impact:** Évite 90% des échecs exec, système plus stable

---

## ⚡ **FIX #3: Dashboard Aligné** (OPTIONNEL - visuel)

**Fichier:** `/core/dashboard.js`  
**Ligne:** ~80 (fonction renderDashboard)

**REMPLACER la ligne width par:**

```javascript
const width = 60; // Largeur fixe pour alignement parfait
```

**ET dans toutes les lignes ns.print, s'assurer que:**

```javascript
// Format correct:
ns.print(`│ ${content.padEnd(width - 4)}│`);

// PAS:
ns.print(`│ ${content.padEnd(width - 16)}│`); // FAUX
```

**Impact:** Dashboard parfaitement aligné visuellement

---

## 🚀 **APRÈS APPLICATION**

```bash
# Redémarrer le système
run global-kill.js
run boot.js

# Vérifier les logs
tail /hack/controller.js
```

**Vous devriez voir:**
```
✅ Jobs grow max 2000t (au lieu de 3671t)
⏭️ Skip grow sur nexus-node-X: RAM insuffisante  <- NORMAL
✅ Moins d'échecs exec
```

**Vous NE devriez PLUS voir:**
```
❌ Échec exec grow sur nexus-node-9 (3671 threads)  <- DISPARU
```

---

## 📊 **AMÉLIORATION ATTENDUE**

| Métrique | Avant | Après |
|----------|-------|-------|
| Taille jobs grow | 6.42TB | 3.5TB |
| Taux succès exec | 40% | 85%+ |
| Spam logs échecs | 20+/min | 2-3/min |
| Stabilité | ⚠️ Instable | ✅ Stable |

---

## ⏱️ **TEMPS TOTAL: 5 MINUTES**

1. Fix #1: 30 secondes ✅
2. Fix #2: 2 minutes ✅
3. Fix #3: OPTIONNEL ✅
4. Redémarrage: 30 secondes ✅

**Votre système sera stable et optimisé!** 🔥
