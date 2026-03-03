# 🚨 DIAGNOSTIC BUGS CRITIQUES - NEXUS APEX v45

## 📋 RÉSUMÉ EXÉCUTIF

**Statut** : 🔴 CRITIQUE - Système en boucle infinie  
**Impact** : 1.3M threads sur netlink, profit bloqué à $0/s  
**Cause racine** : Boucle de préparation sans délai  
**Temps de correction** : ~10 minutes  

---

## 🔍 ANALYSE DES LOGS

### Symptômes observés
```
[09:54:35-39] Répétition de "Prep FULL: W800t + G11708t + W937t" 50+ fois
[ORCHESTRATOR] 💸H:1.8m 💪G:11.2m 🛡️W:1.8m threads
[ORCHESTRATOR] netlink: 100 batches, 1344500 threads
```

### Calcul de la saturation
- 1 batch prep = W800 + G11708 + W937 = **13,445 threads**
- 100 batches × 13,445 = **1,344,500 threads** ✓ (correspond aux logs)
- Jobs avec valeur 0 = serveurs saturés (pas de RAM)

---

## 🐛 BUG #1 : BOUCLE INFINIE DE PRÉPARATION

### Localisation
**Fichier** : `core/orchestrator.js`  
**Ligne** : 270-315 (boucle while)

### Code problématique
```javascript
// LIGNE 273-275
const MAX_BATCHES_PER_TARGET = 100;
while (batchCount < MAX_BATCHES_PER_TARGET) {
    const result = await batcher.executeBatch(target);
    // ❌ PROBLÈME : Pas de délai si batch de préparation !
}
```

### Séquence du bug

1. **Cycle 1** : `orchestrator` appelle `executeBatch("netlink")`
2. **Batcher** : Vérifie `_checkPrepStatus()` → `ready: false`
3. **Batcher** : Crée batch prep (W800 + G11708 + W937)
4. **Batcher** : Dispatche le batch (20ms entre jobs)
5. **Orchestrator** : `success: true` → batchCount++ 
6. **Orchestrator** : IMMÉDIATEMENT rappelle `executeBatch()` ❌
7. **Serveur netlink** : État INCHANGÉ (jobs pas encore exécutés)
8. **Répétition** : Steps 2-7 × 100 fois en ~3 secondes

### Résultat
- **100 batches identiques** empilés dans le port 4
- **1.35M threads** créés pour le même serveur
- **Saturation** : RAM, port, serveur

---

## 🐛 BUG #2 : PAS DE VÉRIFICATION DE PRÉPARATION EN COURS

### Localisation
**Fichier** : `core/batcher.js`  
**Ligne** : 147-167 (executeBatch)

### Code problématique
```javascript
// LIGNE 151
const prepStatus = this._checkPrepStatus(server);

// ❌ PROBLÈME : Pas de vérification si prep déjà en cours !
if (!prepStatus.ready) {
    const prepJobs = this._createPrepBatch(target, prepStatus);
    // Crée TOUJOURS un nouveau batch, même si 99 autres existent
}
```

### Pourquoi c'est un problème
- `_checkPrepStatus()` vérifie l'état ACTUEL du serveur
- Ne sait PAS si des jobs de prep sont déjà en cours
- Crée de nouveaux jobs à chaque appel

---

## 🐛 BUG #3 : SATURATION DU PORT 4

### Localisation
**Fichier** : `core/batcher.js`  
**Ligne** : 909-947 (_dispatchJobs)

### Code actuel
```javascript
// LIGNE 938
const dispatchDelay = CONFIG.BATCHER?.DISPATCH_DELAY_MS || 20;
await this.ns.sleep(dispatchDelay);
```

### Pourquoi insuffisant
- Délai de 20ms entre **jobs** ✓
- Mais pas de délai entre **batches**
- 100 batches = 100 × 13445 jobs = **1.35M messages** dans le port
- Même avec throttling, le port sature

---

## 💡 SOLUTIONS

### ✅ SOLUTION #1 : Stop après batch de préparation (IMMÉDIAT)

**Fichier** : `core/orchestrator.js`  
**Ligne** : Après 293

```javascript
const result = await batcher.executeBatch(target);

// 🆕 AJOUT : Si batch de préparation, STOP et attendre
if (result.success && result.isPrep) {
    log.info(`🔧 Préparation ${target} en cours - skip next batches`);
    break; // Sort de la boucle while
}
```

**Impact** :
- ✓ 1 seul batch de prep par cycle par target
- ✓ Converge vers état "ready" en 20-30min
- ✓ Simple à implémenter (2 lignes)

---

### ✅ SOLUTION #2 : Tracker des préparations (COMPLET)

**Fichier** : `core/batcher.js`  
**Nouveau** : Ajouter un tracker

```javascript
constructor(ns, network, ramMgr, portHandler, caps) {
    // ... code existant ...
    this._prepInProgress = new Set(); // 🆕 Tracker
}

executeBatch(target) {
    // 🆕 VÉRIFIER si prep déjà en cours
    if (this._prepInProgress.has(target)) {
        return { 
            success: false, 
            reason: "prep_in_progress",
            jobs: [], 
            threadsUsed: 0 
        };
    }
    
    const prepStatus = this._checkPrepStatus(server);
    
    if (!prepStatus.ready) {
        this._prepInProgress.add(target); // 🆕 Marquer
        
        const prepJobs = this._createPrepBatch(target, prepStatus);
        // ... dispatch ...
        
        // 🆕 Nettoyer après 30min (timeout)
        setTimeout(() => {
            this._prepInProgress.delete(target);
        }, 30 * 60 * 1000);
        
        return { success: true, isPrep: true, ... };
    }
}
```

**Impact** :
- ✓ Empêche création de doublons
- ✓ Auto-nettoyage après timeout
- ✓ Robuste contre crashes

---

### ✅ SOLUTION #3 : Réduire MAX_BATCHES (URGENCE)

**Fichier** : `core/orchestrator.js`  
**Ligne** : 273

```javascript
// AVANT
const MAX_BATCHES_PER_TARGET = 100;

// APRÈS (temporaire)
const MAX_BATCHES_PER_TARGET = 1; // ⚡ URGENCE : 1 batch par cycle
```

**Impact** :
- ✓ Limite immédiate
- ✓ Empêche saturation
- ⚠️  Sous-utilise la RAM (à combiner avec Solution #1)

---

## 📊 RÉSULTATS ATTENDUS

### Avant correction
```
[BATCHER] 🔥 Prep FULL × 100 (boucle infinie)
[ORCHESTRATOR] netlink: 100 batches, 1,344,500 threads
💰 PROFIT : $0/s
```

### Après correction
```
[BATCHER] 🔥 Prep FULL × 1 (par cycle)
[ORCHESTRATOR] netlink: 1 batch, 13,445 threads
⏳ ETA: 25min → état "ready"
💰 PROFIT : $0/s → $2.088b/s après prep
```

---

## 🚀 PLAN D'ACTION

### Phase 1 : URGENCE (2 min)
1. ✅ Modifier `MAX_BATCHES_PER_TARGET = 1` dans orchestrator.js
2. ✅ Redémarrer le système
3. ✅ Vérifier que logs ne boucle plus

### Phase 2 : FIX COMPLET (10 min)
1. ✅ Implémenter Solution #1 (break si isPrep)
2. ✅ Ajouter `isPrep: true` dans batcher.js return
3. ✅ Tester avec 1-2 targets

### Phase 3 : OPTIMISATION (optionnel)
1. ⚪ Implémenter Solution #2 (tracker)
2. ⚪ Remonter MAX_BATCHES à 5-10
3. ⚪ Monitorer performance

---

## 📝 CHECKLIST DE VALIDATION

Après correction, vérifier :
- [ ] Logs ne montrent plus de répétition
- [ ] Nombre de batches par target ≤ 1
- [ ] Threads par target ~13k (pas 1.3M)
- [ ] État "ready" atteint après 20-30min
- [ ] Profit démarre (> $0/s)

---

## 🔧 FICHIERS À MODIFIER

### Priorité 1 (CRITIQUE)
1. **core/orchestrator.js** 
   - Ligne 273 : MAX_BATCHES = 1
   - Ligne 293+ : break si isPrep

2. **core/batcher.js**
   - Ligne 166 : return { ..., isPrep: true }

### Priorité 2 (OPTIMAL)
3. **core/batcher.js**
   - Ajouter tracker _prepInProgress
   - Vérifier avant création

---

## 📚 DOCUMENTATION

### Pourquoi ce bug est passé inaperçu ?

1. **Tests unitaires** : Le batcher fonctionne correctement isolément
2. **Intégration** : Le bug apparaît SEULEMENT avec orchestrator en boucle
3. **Logs** : Les succès masquent le problème (jobs dispatchés = "succès")
4. **Monitoring** : Pas d'alerte sur nombre de batches/target

### Leçons apprises

1. ✅ Ajouter limite MAX_BATCHES par target
2. ✅ Tracker l'état des préparations
3. ✅ Logs doivent montrer batches/target (pas juste threads)
4. ✅ Dashboard doit alerter si > 10 batches/target

---

**Rapport généré le** : 2026-03-03  
**Analysé par** : Claude (Anthropic)  
**Version système** : NEXUS APEX v45.5 PROMETHEUS
