# 🚀 GUIDE D'INSTALLATION - PROMETHEUS v45.6 ULTIMATE PATCH

**Date:** 03 Mars 2026  
**Version:** v45.5 → v45.6 (DRAIN & SALT PATCH)  
**Temps estimé:** 5-10 minutes  
**Difficulté:** ⭐ Facile (copier-coller)

---

## 📋 RÉSUMÉ DES MODIFICATIONS

### Fichiers à remplacer : 5

1. **`/hack/controller.js`** ← Fichier COMPLET fourni
2. **`/hack/workers/hack.js`** ← Code COMPLET fourni  
3. **`/hack/workers/grow.js`** ← Code COMPLET fourni
4. **`/hack/workers/weaken.js`** ← Code COMPLET fourni
5. **`/hack/workers/share.js`** ← Code COMPLET fourni

### Fichiers inchangés (pas besoin de toucher) :

- ✅ `/lib/constants.js` (déjà OK)
- ✅ `/core/batcher.js` (pas de modification nécessaire)
- ✅ `/core/orchestrator.js` (pas de modification nécessaire)
- ✅ `/core/port-handler.js` (pas de modification nécessaire)
- ✅ Tous les autres fichiers

---

## ⚠️ ÉTAPE 0 : BACKUP (OBLIGATOIRE)

**Avant de commencer, sauvegardez vos fichiers actuels :**

```javascript
// Dans BitBurner, exécutez ces commandes :
run global-kill.js  // Arrête tous les processus

// Puis faites des backups manuels en copiant le contenu de chaque fichier
// dans un éditeur de texte externe (Notepad++, VS Code, etc.)
```

**Fichiers à sauvegarder :**
1. `/hack/controller.js` → `controller.js.backup.txt`
2. `/hack/workers/hack.js` → `hack.js.backup.txt`
3. `/hack/workers/grow.js` → `grow.js.backup.txt`
4. `/hack/workers/weaken.js` → `weaken.js.backup.txt`
5. `/hack/workers/share.js` → `share.js.backup.txt`

---

## 📝 ÉTAPE 1 : REMPLACER /hack/controller.js

### Instructions :

1. Ouvrez le fichier `controller_v45.6_COMPLET.js` fourni
2. **Copiez TOUT le contenu** (Ctrl+A, Ctrl+C)
3. Dans BitBurner, ouvrez `/hack/controller.js`
4. **Supprimez TOUT le contenu actuel**
5. **Collez le nouveau code** (Ctrl+V)
6. **Sauvegardez** (Ctrl+S)

### Vérification :

```javascript
// Le fichier doit commencer par :
/**
 * ██████╗ ██████╗  ██████╗...
 * v45.6 - "ULTIMATE - DRAIN & SALT PATCH"
```

---

## 📝 ÉTAPE 2 : REMPLACER LES 4 WORKERS

### Instructions pour CHAQUE worker :

Le fichier `WORKERS_v45.6_TOUS_COMPLETS.js` contient **4 sections** distinctes.

#### A. /hack/workers/hack.js

1. Ouvrez `WORKERS_v45.6_TOUS_COMPLETS.js`
2. **Copiez uniquement la SECTION 1** (de `// SECTION 1` jusqu'à la ligne avant `// SECTION 2`)
3. Dans BitBurner, ouvrez `/hack/workers/hack.js`
4. **Supprimez TOUT le contenu actuel**
5. **Collez le code de la SECTION 1**
6. **Sauvegardez** (Ctrl+S)

#### B. /hack/workers/grow.js

1. Dans `WORKERS_v45.6_TOUS_COMPLETS.js`, **copiez uniquement la SECTION 2**
2. Dans BitBurner, ouvrez `/hack/workers/grow.js`
3. **Supprimez TOUT le contenu actuel**
4. **Collez le code de la SECTION 2**
5. **Sauvegardez** (Ctrl+S)

#### C. /hack/workers/weaken.js

1. Dans `WORKERS_v45.6_TOUS_COMPLETS.js`, **copiez uniquement la SECTION 3**
2. Dans BitBurner, ouvrez `/hack/workers/weaken.js`
3. **Supprimez TOUT le contenu actuel**
4. **Collez le code de la SECTION 3**
5. **Sauvegardez** (Ctrl+S)

#### D. /hack/workers/share.js

1. Dans `WORKERS_v45.6_TOUS_COMPLETS.js`, **copiez uniquement la SECTION 4**
2. Dans BitBurner, ouvrez `/hack/workers/share.js`
3. **Supprimez TOUT le contenu actuel**
4. **Collez le code de la SECTION 4**
5. **Sauvegardez** (Ctrl+S)

### Vérification des workers :

Chaque worker doit contenir cette ligne critique :

```javascript
const uuid = ns.args[2] || "000";  // Pour hack, grow, weaken
// OU
const uuid = ns.args[1] || "000";  // Pour share uniquement
```

---

## 🚀 ÉTAPE 3 : REDÉMARRAGE DU SYSTÈME

### Séquence de démarrage :

```javascript
// 1. Tuer tous les anciens processus
run global-kill.js

// 2. Attendre 2 secondes (laisser le système se stabiliser)

// 3. Redémarrer le système complet
run boot.js
```

### Si vous n'avez pas boot.js :

```javascript
// Démarrer manuellement :
run /core/orchestrator.js
```

---

## ✅ ÉTAPE 4 : VÉRIFICATION

### Tests à effectuer :

#### 1. Vérifier que le controller est actif :

```javascript
ps()  // Dans le terminal
// Vous devez voir: controller.js (PID: XXXX)
```

#### 2. Vérifier les logs :

```javascript
tail /hack/controller.js
```

**Vous devez voir :**
```
🎮 Démarrage du Controller PROMETHEUS v45.6...
🔥 DRAIN & SALT PATCH activé
   → Drainage port instantané : ✅
   → UUID salt injection : ✅
✅ Controller initialisé - En attente de batches primaires...
```

#### 3. Monitorer le système :

```javascript
tail /core/orchestrator.js
```

**Après quelques secondes, vous devez voir :**
```
✅ Batch HWGW dispatché: 250 threads sur joesguns
📊 Jobs succeeded: 4/4 (100%)
💰 Rendement estimé: +1.5M$/batch
```

### Vérification réussie si :

- ✅ Controller v45.6 actif dans `ps()`
- ✅ Logs montrent "DRAIN & SALT PATCH activé"
- ✅ Batches HWGW dispatchés avec succès
- ✅ Aucun message d'erreur "Port 4 plein"
- ✅ Aucun message d'erreur "PID = 0"
- ✅ Revenus augmentent ($/seconde > 0)

---

## 🎯 RÉSULTATS ATTENDUS

### AVANT le patch (v45.5) :

```
💰 Revenus : 0$/seconde
📊 Jobs succeeded : 0/4 (0%)
⚠️  Port 4 saturé : OUI
❌ Batches HWGW : Désynchronisés
❌ Job splitting : Échoue (PID = 0)
```

### APRÈS le patch (v45.6) :

```
💰 Revenus : 5-50M$/seconde (selon progression)
📊 Jobs succeeded : 4/4 (100%)
✅ Port 4 saturé : NON
✅ Batches HWGW : Parfaitement synchronisés
✅ Job splitting : 100% des threads placés
```

---

## 🐛 DÉPANNAGE

### Problème 1 : "Syntax error in controller.js"

**Cause :** Copier-coller incomplet ou caractères corrompus

**Solution :**
1. Vérifiez que vous avez copié **TOUT** le fichier
2. Vérifiez qu'il n'y a pas de caractères bizarres (UTF-8 BOM, etc.)
3. Réessayez avec un éditeur différent

### Problème 2 : "Controller ne démarre pas"

**Cause :** RAM insuffisante sur home

**Solution :**
```javascript
// Vérifier la RAM disponible
ns.tprint(ns.getServer("home").maxRam - ns.getServer("home").ramUsed);

// Si < 10 GB, tuez des processus inutiles ou achetez plus de RAM home
```

### Problème 3 : "Toujours 0$/seconde après le patch"

**Causes possibles :**
1. Vérifiez que **TOUS** les 5 fichiers ont été modifiés
2. Vérifiez que le batcher est actif (via orchestrator)
3. Vérifiez qu'il y a des serveurs rootés disponibles

**Solution :**
```javascript
// Relancer le diagnostic complet
run /tools/pre-flight.js --verbose
```

### Problème 4 : "Workers introuvables"

**Cause :** Fichiers non sauvegardés ou chemin incorrect

**Solution :**
1. Vérifiez que les fichiers sont bien dans `/hack/workers/`
2. Vérifiez que les noms sont exacts : `hack.js`, `grow.js`, `weaken.js`, `share.js`
3. Pas de `.txt` à la fin !

---

## 📊 CHECKLIST FINALE

- [ ] Backups effectués (5 fichiers)
- [ ] `/hack/controller.js` remplacé par v45.6
- [ ] `/hack/workers/hack.js` modifié (UUID support)
- [ ] `/hack/workers/grow.js` modifié (UUID support)
- [ ] `/hack/workers/weaken.js` modifié (UUID support)
- [ ] `/hack/workers/share.js` modifié (UUID support)
- [ ] Système redémarré (`run boot.js`)
- [ ] Logs vérifiés (`tail /hack/controller.js`)
- [ ] Controller v45.6 confirmé dans les logs
- [ ] Revenus > 0$/seconde

---

## 🎉 FÉLICITATIONS !

Si tous les tests sont ✅, votre système PROMETHEUS v45.6 est maintenant **100% opérationnel** !

**Améliorations obtenues :**
- ✅ Batches HWGW parfaitement synchronisés (200ms spacing)
- ✅ Port 4 jamais saturé (drainage instantané)
- ✅ Job splitting fonctionnel (100% des threads placés)
- ✅ Rendement optimal (plusieurs millions $/seconde)

**Profitez de votre système optimisé ! 🚀💰**

---

## 📞 SUPPORT

En cas de problème persistant :

1. Vérifiez le rapport d'audit : `AUDIT_PROFESSIONNEL_PROMETHEUS_COMPLET.md`
2. Comparez votre code avec les fichiers fournis
3. Vérifiez les logs détaillés avec `tail -f /hack/controller.js`
4. Si nécessaire, restaurez les backups et réessayez

---

**FIN DU GUIDE D'INSTALLATION**
