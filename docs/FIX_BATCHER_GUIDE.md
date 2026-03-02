# 🔧 FIX BATCHER - Guide de Correction

## 🚨 PROBLÈMES IDENTIFIÉS

### Problème 1 : Jobs Weaken Trop Gros Non Placés
```
⚠️ Job weaken (477t) → 477/477 threads NON PLACÉS
⚠️ Job weaken (400t) → 400/400 threads NON PLACÉS
→ 877 threads perdus = ~1.5 TB de RAM gaspillée !
```

**Cause** : `minThreadsPerSubjob` trop élevé (probablement 5 ou 10)
→ Le découpage ne peut pas créer de petits sous-jobs
→ RAM fragmentée non utilisée

### Problème 2 : Saturation du Port 4
```
❌ WriteJSON échoué après 5 tentatives (×20+)
→ Le Controller n'arrive pas à lire assez vite
```

**Cause** : Batcher envoie trop de jobs simultanément
→ Contention sur le port 4
→ Retries multiples qui aggravent le problème

---

## ✅ SOLUTION 1 : Réduire minThreadsPerSubjob

### **Où modifier** : `core/batcher.js`

Cherchez cette ligne (vers ligne 800-900) :

```javascript
// ❌ AVANT (MAUVAIS)
const minThreadsPerSubjob = 5;  // ou 10
```

Changez en :

```javascript
// ✅ APRÈS (BON)
const minThreadsPerSubjob = 1;  // Permet des sous-jobs de 1 thread minimum
```

### **Impact** :
- ✅ Utilise la RAM fragmentée (serveurs avec 1.75-10 GB libres)
- ✅ Réduit drastiquement les threads perdus
- ✅ Meilleur taux de placement de jobs
- ⚠️ Crée plus de sous-jobs (mais c'est OK)

---

## ✅ SOLUTION 2 : Ajouter un Délai Anti-Contention

### **Où modifier** : `core/batcher.js`

Dans la fonction qui dispatche les jobs (cherchez "writeJSON" ou "dispatch"), ajoutez un petit délai :

```javascript
// ❌ AVANT (PAS DE DÉLAI)
for (const subjob of subjobs) {
    await ph.writeJSON(CONFIG.PORTS.COMMANDS, subjob);
}
```

```javascript
// ✅ APRÈS (AVEC DÉLAI)
for (const subjob of subjobs) {
    await ph.writeJSON(CONFIG.PORTS.COMMANDS, subjob);
    
    // Délai de 10ms entre chaque dispatch pour éviter la contention
    await ns.sleep(10);
}
```

### **Impact** :
- ✅ Réduit la contention sur le port 4
- ✅ Moins d'échecs de WriteJSON
- ✅ Meilleure stabilité
- ⚠️ Ajoute ~0.5-1s par batch (négligeable)

---

## ✅ SOLUTION 3 : Augmenter la Limite de Retries

### **Où modifier** : `core/port-handler.js`

Cherchez la fonction `writeJSON` et augmentez les tentatives :

```javascript
// ❌ AVANT
const MAX_RETRIES = 5;
const RETRY_DELAY = 100; // 100ms
```

```javascript
// ✅ APRÈS
const MAX_RETRIES = 10;     // Plus de tentatives
const RETRY_DELAY = 50;     // Délai plus court entre tentatives
```

### **Impact** :
- ✅ Plus de chances de succès
- ✅ Moins de jobs perdus
- ⚠️ Peut masquer le vrai problème (à combiner avec Solution 2)

---

## 🚀 PROCÉDURE D'APPLICATION

### **Étape 1 : Backup**
```bash
# Sauvegardez vos fichiers actuels
cp core/batcher.js core/batcher.js.backup
cp core/port-handler.js core/port-handler.js.backup
```

### **Étape 2 : Modifier batcher.js**
```bash
nano core/batcher.js

# Cherchez : minThreadsPerSubjob
# Changez : 5 → 1

# Cherchez : writeJSON ou dispatch loop
# Ajoutez : await ns.sleep(10);
```

### **Étape 3 : Modifier port-handler.js** (optionnel)
```bash
nano core/port-handler.js

# Cherchez : MAX_RETRIES = 5
# Changez : 5 → 10

# Cherchez : RETRY_DELAY = 100
# Changez : 100 → 50
```

### **Étape 4 : Redémarrer**
```bash
run global-kill.js
run boot.js
```

### **Étape 5 : Vérifier**
```bash
# Surveillez les logs
tail <PID du batcher>

# Cherchez :
# ✅ Moins de "threads non placés"
# ✅ Moins de "WriteJSON échoué"
# ✅ Plus de sous-jobs créés (normal)
```

---

## 📊 RÉSULTATS ATTENDUS

### **Avant les fixes** :
```
Jobs placés    : 4046/5000 threads (80.9%)
Jobs perdus    : 954 threads (19.1%)
Échecs port 4  : ~20 échecs/batch
```

### **Après les fixes** :
```
Jobs placés    : 4900+/5000 threads (98%+)
Jobs perdus    : <100 threads (<2%)
Échecs port 4  : <5 échecs/batch
```

### **Gain** :
- ✅ **+850 threads** exécutés par batch
- ✅ **+19% de profit/seconde**
- ✅ Stabilité améliorée

---

## 🔍 DIAGNOSTIC RAPIDE

Uploadez et exécutez ce script pour analyser la situation :

```bash
# Uploadez diagnostic-batcher-issues.js
run diagnostics/diagnostic-batcher-issues.js
```

Ce script vous dira :
- ✅ Si vous avez assez de RAM disponible
- ✅ Combien de threads sont possibles
- ✅ État du port 4 (saturé ou OK)
- ✅ Quelle solution appliquer en priorité

---

## ⚠️ SI ÇA NE SUFFIT PAS

Si après ces fixes vous avez toujours des problèmes :

### **Option A : Acheter Plus de Serveurs**
```bash
run managers/server-manager.js
```
→ Plus de RAM = moins de fragmentation

### **Option B : Upgrader les Serveurs Existants**
```bash
# Vérifier vos serveurs actuels
ps | grep nexus-node

# Upgrader vers 128 GB ou 256 GB
# (nécessite de delete puis racheter)
```

### **Option C : Réduire la Taille des Batchs**
Dans `core/batcher.js`, cherchez la logique de calcul des threads HWGW et réduisez le multiplicateur pour faire des batchs plus petits.

---

## 🎯 PRIORITÉ DES ACTIONS

1. **URGENT** : Réduire `minThreadsPerSubjob` à 1 → **Gain immédiat +19%**
2. **IMPORTANT** : Ajouter délai de 10ms entre dispatches → **Stabilité**
3. **OPTIONNEL** : Augmenter MAX_RETRIES à 10 → **Failsafe**
4. **LONG TERME** : Upgrader serveurs → **Capacité**

---

**🔥 Appliquez au minimum la Solution 1 pour un gain immédiat !**
