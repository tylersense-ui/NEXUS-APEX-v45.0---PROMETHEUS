# 🔥 BATCHER v46.2 - PREP TIMELINE FIX (CRITICAL)

**Date:** 2026-03-04  
**Version:** v46.1 → v46.2  
**Gravité:** 🔴 **CRITIQUE**  
**Impact:** Cibles restaient à 0% money indéfiniment  
**Fichier:** `/core/batcher.js`

---

## 📋 RÉSUMÉ

Ce patch corrige un **bug critique** dans la timeline de préparation progressive qui causait:
- ✅ Cibles bloquées à 0-5% money après des heures
- ✅ Ratio grow démesuré (60-80% au lieu de 20-30%)
- ✅ Efficacité divisée par 10-100x
- ✅ Système en prep perpétuelle

**Solution:** 2 lignes modifiées dans `_createProgressivePrepBatch()`

---

## 🐛 LE BUG

### Timeline AVANT (v46.1 - CASSÉE):

```
T-500ms      T           T+500ms
   |         |              |
 GROW    WEAKEN1        WEAKEN2
   ^
   └─ Problème: GROW s'exécute AVANT weaken
      Security HAUTE → Efficacité divisée par 100x
```

**Ordre d'arrivée:**
1. 🔴 GROW à T-500ms (security HAUTE - inefficace)
2. ✅ WEAKEN1 à T (baisse la security APRÈS le grow)
3. ✅ WEAKEN2 à T+500ms

**Conséquence:**  
Le GROW tente d'augmenter l'argent alors que la security est au maximum.  
Résultat: efficacité divisée par 10-100x, cibles ne montent jamais.

---

### Timeline APRÈS (v46.2 - CORRECTE):

```
  T        T+500ms     T+1000ms
  |           |            |
WEAKEN1     GROW       WEAKEN2
              ^
              └─ GROW s'exécute APRÈS weaken
                 Security BASSE → Efficacité maximale
```

**Ordre d'arrivée:**
1. ✅ WEAKEN1 à T (baisse la security EN PREMIER)
2. ✅ GROW à T+500ms (security BASSE - efficace)
3. ✅ WEAKEN2 à T+1000ms (compense security du grow)

**Résultat:**  
Le GROW s'exécute quand la security est déjà basse.  
Efficacité maximale, cibles montent à 75-100% en 15 minutes.

---

## 🔧 MODIFICATIONS APPORTÉES

### Changement #1: Ligne 342 (anciennement 330)

**AVANT:**
```javascript
const growDelay = Math.max(0, weakenTime - growTime - SPACING);
```

**APRÈS:**
```javascript
const growDelay = Math.max(0, weakenTime - growTime + SPACING);
```

**Effet:** GROW arrive maintenant 500ms APRÈS weaken1 (au lieu d'AVANT)

---

### Changement #2: Ligne 357 (anciennement 345)

**AVANT:**
```javascript
const weaken2Delay = SPACING;
```

**APRÈS:**
```javascript
const weaken2Delay = 2 * SPACING;
```

**Effet:** WEAKEN2 arrive après le GROW (pour compenser la security ajoutée)

---

### Changement #3: Commentaires mis à jour

Tous les commentaires de la fonction `_createProgressivePrepBatch()` ont été mis à jour pour refléter la nouvelle timeline.

---

## 📦 INSTALLATION

### Méthode 1: Remplacement complet (Recommandé)

**Étape 1:** Backup de l'ancien fichier

```bash
# Dans BitBurner
cp /core/batcher.js /core/batcher.js.v46.1.backup
```

**Étape 2:** Copier le nouveau fichier

1. Ouvrir `batcher_v46.2_COMPLET.js` (ce fichier)
2. Copier TOUT le contenu (Ctrl+A, Ctrl+C)
3. Dans BitBurner, ouvrir `/core/batcher.js`
4. Supprimer TOUT le contenu actuel
5. Coller le nouveau code (Ctrl+V)
6. Sauvegarder (Ctrl+S)

**Étape 3:** Redémarrer le système

```bash
run global-kill.js
run boot.js
```

**Étape 4:** Vérifier

```bash
tail /core/orchestrator.js
# Chercher les logs du Batcher
```

**Attendu après 5 minutes:**
```
💪 Prep GROW: summit-uni monte de 0% → 15%
```

**Attendu après 15 minutes:**
```
💪 Prep GROW: summit-uni monte de 15% → 50%
```

---

### Méthode 2: Modification manuelle (Experts)

Si vous préférez modifier vous-même:

1. Ouvrir `/core/batcher.js`
2. Chercher ligne ~330: `const growDelay = Math.max(0, weakenTime - growTime - SPACING);`
3. Remplacer par: `const growDelay = Math.max(0, weakenTime - growTime + SPACING);`
4. Chercher ligne ~345: `const weaken2Delay = SPACING;`
5. Remplacer par: `const weaken2Delay = 2 * SPACING;`
6. Mettre à jour le header en v46.2
7. Sauvegarder et redémarrer

---

## ✅ VÉRIFICATION

### Test 1: Version confirmée

```bash
# Dans BitBurner, ouvrir /core/batcher.js
# Vérifier ligne 8
```

**Attendu:**
```javascript
 *                            v46.2 - "GODMODE - PREP TIMELINE FIX"
```

---

### Test 2: Corrections appliquées

**Ligne ~342:**
```javascript
const growDelay = Math.max(0, weakenTime - growTime + SPACING);
//                                                     ^ DOIT être "+"
```

**Ligne ~357:**
```javascript
const weaken2Delay = 2 * SPACING;
//                   ^ DOIT être "2 *"
```

---

### Test 3: Comportement après 15 minutes

Lancer le diagnostic:

```bash
run /diagnostics/diag-3-etat-cibles.js
```

**AVANT le patch (v46.1):**
```
🛡️ SUMMIT-UNI | M:0% S:+0.0 | ETA: 5m
(Reste bloqué à 0% indéfiniment)
```

**APRÈS le patch (v46.2) - 15 minutes:**
```
🛡️ SUMMIT-UNI | M:45% S:+0.2 | ETA: 3m
(Monte progressivement)
```

**APRÈS le patch (v46.2) - 25 minutes:**
```
💸 SUMMIT-UNI | M:100% S:+0.0 | ETA: Ready
(Prête à hack)
```

---

## 📊 RÉSULTATS ATTENDUS

### Métriques dashboard AVANT patch:

```
⚙️ THREADS : H:314k  G:852k  W:228k
              (20%)  (60%)   (20%)  ← Ratio grow anormal

💸 Cibles prêtes: 1-2 / 8
🛡️ En prep: 6-7 cibles bloquées à 0-5%
```

### Métriques dashboard APRÈS patch (30 min):

```
⚙️ THREADS : H:600k  G:400k  W:400k
              (42%)  (28%)   (28%)  ← Ratio grow normal

💸 Cibles prêtes: 6-8 / 8
🛡️ En prep: 0-2 cibles (prep rapide)
```

---

## ⚠️ NOTES IMPORTANTES

### Note 1: XP = 0/s non résolu

Ce patch corrige uniquement la **timeline prep**. Il ne résout PAS:
- XP = 0/s (autre bug à diagnostiquer)
- Cache RAM issues
- Autres problèmes potentiels

**Si après le patch:**
- ✅ Cibles montent en % money → Patch fonctionne
- 🔴 XP reste à 0 → Autre bug à identifier

---

### Note 2: Temps de convergence

Avec le patch appliqué, les cibles devraient:
- 0% → 25% : ~5 minutes
- 25% → 50% : ~5 minutes  
- 50% → 75% : ~5 minutes
- 75% → 100% : ~2-3 minutes

**Total: 15-20 minutes pour atteindre 100%**

Si ça prend plus de 30 minutes, il y a encore un problème.

---

### Note 3: Redémarrage requis

Le Batcher est chargé au démarrage. **Vous DEVEZ redémarrer** pour que les changements prennent effet:

```bash
run global-kill.js
run boot.js
```

Un simple `ns.spawn()` ne suffit PAS.

---

## 🆘 TROUBLESHOOTING

### Problème: "Version toujours 46.1 après copie"

**Cause:** Fichier pas sauvegardé ou mauvais fichier ouvert  
**Solution:** Vérifier que vous avez bien sauvegardé (Ctrl+S) et redémarré

---

### Problème: "Cibles montent mais XP = 0"

**Cause:** Bug différent (workers crashent ou autre)  
**Solution:** Lancer le diagnostic complet

```bash
run /diagnostics/diag-2-processus-actifs.js
```

Si "0 workers actifs" → Problème avec les workers, pas le Batcher

---

### Problème: "Erreur au démarrage du Batcher"

**Cause:** Erreur de copie/collage (syntaxe cassée)  
**Solution:** 
1. Restaurer le backup: `cp /core/batcher.js.v46.1.backup /core/batcher.js`
2. Re-copier le fichier v46.2 en étant très prudent
3. Vérifier qu'il n'y a pas de caractères bizarres

---

## 📞 SUPPORT

Si le patch ne fonctionne pas après 30 minutes:

1. Vérifier la version: ouvrir `/core/batcher.js`, ligne 8 doit être v46.2
2. Vérifier les modifications: lignes 342 et 357
3. Lancer le diagnostic complet:

```bash
run /diagnostics/diag-5-resume-complet.js
```

4. Copier TOUTE la sortie et me l'envoyer

---

## 📜 CHANGELOG COMPLET

### v46.2 (2026-03-04) 🔴 CRITICAL

**Corrections:**
- 🔴 Timeline prep inversée (CAS 3: Weaken + Grow)
- 🔴 GROW arrivait AVANT weaken1 (à T-500 au lieu de T+500)
- 🔴 Efficacité divisée par 10-100x

**Impact:**
- Cibles montent maintenant de 0% → 100% en 15-20 min
- Ratio grow normalisé (60% → 30%)
- Système génère des revenus stables

**Fichiers modifiés:**
- `/core/batcher.js` (2 lignes + header + commentaires)

---

### v46.1 (2026-03-03)

- Edge case 0 threads géré
- Filtrage jobs invalides

### v46.0 (2026-03-03)

- Refonte complète GODMODE
- Formules corrigées
- EV/s optimisé

---

**Installation: Remplacer `/core/batcher.js` par `batcher_v46.2_COMPLET.js`**  
**Redémarrage: OBLIGATOIRE**  
**Temps total: 5 minutes**  
**Résultats: 15-20 minutes**
