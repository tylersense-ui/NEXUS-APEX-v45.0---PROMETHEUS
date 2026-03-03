# 🚀 GUIDE D'INSTALLATION - CORRECTIFS v45.7

## 📋 RÉSUMÉ

**Version** : NEXUS APEX v45.7 "CRITICAL FIX - Prep Loop"  
**Date** : 2026-03-03  
**Correctifs** : 2 fichiers modifiés  
**Temps d'installation** : ~2 minutes  
**Impact** : FIX CRITIQUE - Résout boucle infinie de préparation  

---

## 📦 FICHIERS FOURNIS

### Fichiers corrigés
1. ✅ `orchestrator_FIXED.js` → Remplace `core/orchestrator.js`
2. ✅ `batcher_FIXED.js` → Remplace `core/batcher.js`

### Fichiers de documentation
3. 📄 `DIAGNOSTIC_BUGS_CRITIQUES.md` → Analyse complète
4. 📄 `GUIDE_INSTALLATION_v45.7.md` → Ce fichier
5. 📄 `CHANGELOG_v45.7.md` → Liste des modifications

---

## ⚡ INSTALLATION RAPIDE (2 minutes)

### Étape 1 : Arrêter le système
```javascript
// Dans BitBurner, exécuter :
ns.kill("/core/orchestrator.js", "home");
ns.kill("/hack/controller.js", "home");
await ns.sleep(2000);
```

### Étape 2 : Sauvegarder les fichiers actuels
```javascript
// Optionnel mais recommandé
ns.write("/core/orchestrator.js.backup", 
         ns.read("/core/orchestrator.js"), "w");
ns.write("/core/batcher.js.backup", 
         ns.read("/core/batcher.js"), "w");
```

### Étape 3 : Copier les nouveaux fichiers
```javascript
// Copier orchestrator_FIXED.js → /core/orchestrator.js
// Copier batcher_FIXED.js → /core/batcher.js
```

### Étape 4 : Redémarrer le système
```javascript
ns.run("/core/orchestrator.js");
```

### Étape 5 : Vérifier
```javascript
ns.tail("/core/orchestrator.js");
// Vous devriez voir :
// - Banner "v45.7 - CRITICAL FIX - Prep Loop"
// - Logs de préparation (1 batch par target)
// - PLUS de répétitions infinies
```

---

## 🔍 MODIFICATIONS DÉTAILLÉES

### 1. orchestrator.js (3 changements)

#### Changement #1 : MAX_BATCHES réduit
**Ligne** : 273  
**Avant** :
```javascript
const MAX_BATCHES_PER_TARGET = 100;
```
**Après** :
```javascript
const MAX_BATCHES_PER_TARGET = 1;
```
**Raison** : Évite saturation immédiate

---

#### Changement #2 : Break après prep batch
**Ligne** : 303-310 (NOUVEAU)  
**Code ajouté** :
```javascript
// 🆕 v45.7 : STOP après batch de préparation
// Si le batch dispatché était un batch de PRÉPARATION (et non HWGW),
// on sort de la boucle pour éviter d'empiler 100 batchs identiques.
// Le serveur doit d'abord terminer la préparation avant next batches.
if (result.isPrep) {
    log.info(`🔧 Préparation de ${target} en cours - attente convergence`);
    break;
}
```
**Raison** : Stop la boucle si batch de préparation dispatché

---

#### Changement #3 : Version header
**Lignes** : 8, 77  
**Avant** : `v45.0 - "Stealing Fire From The Gods"`  
**Après** : `v45.7 - "CRITICAL FIX - Prep Loop"`  
**Raison** : Identification de version

---

### 2. batcher.js (3 changements)

#### Changement #1 : Retour prep avec flag
**Ligne** : 166  
**Avant** :
```javascript
return { success: dispatched > 0, jobs: packedJobs, threadsUsed: dispatched };
```
**Après** :
```javascript
return { success: dispatched > 0, isPrep: true, jobs: packedJobs, threadsUsed: dispatched };
```
**Raison** : Signale à l'orchestrator qu'un batch de prep a été créé

---

#### Changement #2 : Retour HWGW avec flag
**Ligne** : 211  
**Avant** :
```javascript
success: dispatched > 0,
```
**Après** :
```javascript
success: dispatched > 0,
isPrep: false,
```
**Raison** : Cohérence - marque explicitement les batches HWGW

---

#### Changement #3 : Version header
**Ligne** : 8  
**Avant** : `v45.5 - "PATCHED - Prep Timing Synchronized"`  
**Après** : `v45.7 - "CRITICAL FIX - Prep Loop Detection"`  
**Raison** : Identification de version

---

## ✅ VALIDATION

### Tests à effectuer après installation

1. **Vérifier les logs**
   ```
   Attendre 30 secondes → Observer les logs
   ✅ Pas de répétition infinie
   ✅ Message "Préparation de [target] en cours" visible
   ✅ 1 batch par target maximum
   ```

2. **Vérifier les métriques**
   ```javascript
   // Dans le dashboard ou tail
   ✅ Threads par target : ~13k (pas 1.3M)
   ✅ Batches par target : 1
   ✅ RAM utilisée : progression graduelle
   ```

3. **Vérifier la convergence**
   ```
   Attendre 20-30 minutes
   ✅ État "ready" atteint pour les cibles
   ✅ Profit commence à monter (> $0/s)
   ✅ Logs montrent batches HWGW (pas seulement prep)
   ```

---

## 🐛 ROLLBACK (en cas de problème)

Si les correctifs causent des problèmes :

```javascript
// 1. Arrêter le système
ns.kill("/core/orchestrator.js", "home");
ns.kill("/hack/controller.js", "home");

// 2. Restaurer backups
ns.write("/core/orchestrator.js", 
         ns.read("/core/orchestrator.js.backup"), "w");
ns.write("/core/batcher.js", 
         ns.read("/core/batcher.js.backup"), "w");

// 3. Redémarrer
ns.run("/core/orchestrator.js");
```

---

## 📊 RÉSULTATS ATTENDUS

### Avant (v45.5)
```
🔥 Prep FULL: W800t + G11708t + W937t (répété 100×)
💸H:1.8m  💪G:11.2m  🛡️W:1.8m threads
netlink: 100 batches, 1,344,500 threads
💰 PROFIT : $0/s
```

### Après (v45.7)
```
🔥 Prep FULL: W800t + G11708t + W937t (1× par cycle)
🔧 Préparation de netlink en cours - attente convergence
netlink: 1 batch, 13,445 threads
💰 PROFIT : $0/s → $2.088b/s (après 25min)
```

---

## 🔧 OPTIMISATIONS FUTURES (optionnel)

Une fois le système stable avec v45.7, vous pouvez :

1. **Augmenter MAX_BATCHES** (si RAM disponible)
   ```javascript
   // Dans orchestrator.js ligne 273
   const MAX_BATCHES_PER_TARGET = 5; // Ou 10 max
   ```

2. **Implémenter tracker de préparation** (voir DIAGNOSTIC_BUGS_CRITIQUES.md)
   - Empêche création de doublons même si orchestrator redémarre
   - Auto-nettoyage après timeout

---

## ❓ FAQ

**Q : Le système va-t-il gagner moins d'argent avec MAX_BATCHES=1 ?**  
R : Non. Avant, les 100 batches étaient identiques (doublons). Maintenant, 1 batch de prep unique fait le travail correctement.

**Q : Combien de temps avant de voir du profit ?**  
R : 20-30 minutes. Le temps que les serveurs convergent vers l'état "ready". C'est normal et attendu.

**Q : Puis-je augmenter MAX_BATCHES après ?**  
R : Oui, une fois que les serveurs sont "ready". Mais 1-5 batches suffisent généralement.

**Q : Que faire si les logs montrent encore des répétitions ?**  
R : Vérifier que :
  1. Les fichiers sont bien remplacés (pas juste copiés ailleurs)
  2. Le système a été redémarré
  3. Vous n'avez pas d'anciens controllers en cours

---

## 📞 SUPPORT

Si problèmes après installation :
1. Consulter `DIAGNOSTIC_BUGS_CRITIQUES.md`
2. Vérifier checklist de validation
3. Faire rollback si nécessaire

---

**Document créé le** : 2026-03-03  
**Auteur** : Claude (Anthropic)  
**Version système** : NEXUS APEX v45.7 PROMETHEUS
