# 🔍 ANALYSE - Problème de déploiement des workers

**Date:** 2026-03-01  
**Système:** NEXUS-APEX v45.0 PROMETHEUS  
**Statut:** ⚠️ **SYSTÈME PARTIELLEMENT FONCTIONNEL**

---

## 📊 SITUATION ACTUELLE

Votre système PROMETHEUS démarre correctement, mais le Controller échoue à déployer les workers sur plusieurs serveurs :

### ✅ Serveurs qui fonctionnent:
- nexus-node-11
- nexus-node-12
- nexus-node-13
- nexus-node-19

### ❌ Serveurs qui échouent:
- nexus-node-14, 15, 16, 17, 18 (5 échecs consécutifs)
- nexus-node-20, 21, 22, 23

### Symptômes observés:
```
⚠️  Échec exec weaken sur nexus-node-14 (14 threads)
⚠️  Échec exec weaken sur nexus-node-15 (14 threads)
...
⚠️  5 erreurs consécutives - Backoff à 100ms
```

### Métriques du dashboard:
- **Profit:** 0/s ← ⚠️ AUCUN REVENU
- **XP Rate:** 0.000/s ← ⚠️ PAS D'XP
- **RAM:** 4.84TB / 8.54TB (56.6% utilisé)
- **Threads actifs:** 1,283

---

## 🔍 DIAGNOSTIC DU PROBLÈME

### Cause probable #1: RAM INSUFFISANTE

Quand `ns.exec()` retourne `pid = 0`, cela signifie que l'exécution a échoué.

**Les causes possibles sont:**
1. **RAM insuffisante sur le serveur cible** ← TRÈS PROBABLE
2. Script worker introuvable (mais le Controller copie les fichiers avec succès)
3. Serveur inexistant (mais certains serveurs de la même série fonctionnent)

**Calcul de RAM pour weaken avec 14 threads:**
- RAM par thread de weaken: ~1.75 GB
- RAM totale nécessaire: 14 × 1.75 = **24.5 GB**

Si vos serveurs nexus-node-14 à 23 ont moins de 24.5 GB de RAM libre, l'exécution échouera.

### Cause probable #2: SERVEURS NON EXISTANTS

Vous mentionnez : "je ne me deploie que sur 10 serveurs achetes les plus gros"

Si vous avez seulement 10 serveurs mais que le système essaie de déployer sur nexus-node-11 à 23 (13 serveurs), alors:
- Les serveurs nexus-node-11 à 20 existent (10 serveurs)
- Les serveurs nexus-node-21, 22, 23 n'existent PAS encore

Cela expliquerait pourquoi certains échouent systématiquement.

### Cause probable #3: TROP DE PROCESSUS ACTIFS

Avec 1,283 threads actifs mais 0/s de profit, il est possible que:
- Les serveurs sont saturés de processus en attente
- Les batches HWGW ne se terminent jamais correctement
- La RAM est fragmentée sur de nombreux petits processus

---

## 🛠️ SOLUTIONS PROPOSÉES

### Solution 1: DIAGNOSTIC IMMÉDIAT

Utilisez le script de diagnostic que j'ai créé :

```bash
# Uploadez le fichier diagnostic-deploy.js dans BitBurner
# Puis exécutez-le
run diagnostic-deploy.js
```

Ce script va :
- ✅ Vérifier si chaque serveur existe
- ✅ Afficher la RAM disponible sur chaque serveur
- ✅ Calculer combien de threads peuvent être exécutés
- ✅ Identifier les processus qui consomment la RAM
- ✅ Donner des recommandations précises

**⏱️ Temps d'exécution:** 5-10 secondes

---

### Solution 2: REDÉMARRAGE PROPRE

Si trop de processus sont en cours, faites un redémarrage complet :

```bash
# 1. Arrêt d'urgence
run global-kill.js

# 2. Attendre 2 secondes
# (laissez le temps aux processus de se terminer)

# 3. Redémarrage
run boot.js
```

**⚠️ Attention:** Cela tuera TOUS les processus, mais c'est souvent nécessaire pour nettoyer un système bloqué.

---

### Solution 3: UPGRADE DES SERVEURS

Si le diagnostic montre que vos serveurs manquent de RAM :

**Option A - Attendre l'auto-upgrade:**
Le `server-manager.js` va automatiquement upgrader vos serveurs quand vous aurez assez d'argent.

**Option B - Upgrade manuel:**
Vous pouvez upgrader manuellement les serveurs dans BitBurner :
1. Aller dans le terminal
2. `deleteServer("nexus-node-14")` (si besoin)
3. `purchaseServer("nexus-node-14", 64)` (64 GB)

**Recommandation RAM par serveur pour HWGW:**
- Minimum: **32 GB** (peut gérer batches basiques)
- Recommandé: **64-128 GB** (batches moyens)
- Optimal: **256+ GB** (batches complexes)

---

### Solution 4: RÉDUIRE LES THREADS PAR JOB

Si vous ne pouvez pas upgrader les serveurs immédiatement, vous pouvez réduire le nombre de threads utilisés par le Batcher.

**Où modifier:**
Dans `lib/constants.js`, cherchez la configuration du Batcher et réduisez les valeurs.

**Exemple:**
```javascript
// Au lieu de 14 threads
MAX_THREADS_PER_JOB: 14

// Réduire à
MAX_THREADS_PER_JOB: 8
```

Cela permettra au système de s'exécuter sur des serveurs avec moins de RAM, mais génèrera moins de revenus.

---

### Solution 5: VÉRIFIER LA LISTE DES SERVEURS

Affichez vos serveurs achetés :

```bash
# Dans le terminal BitBurner
getPurchasedServers()
```

Cela vous dira exactement quels serveurs existent.

**Si vous avez moins de 13 serveurs**, c'est normal que nexus-node-21, 22, 23 échouent.

**Solution:** Attendre que le `server-manager.js` achète plus de serveurs automatiquement.

---

## 📋 CHECKLIST DE RÉSOLUTION

Suivez ces étapes dans l'ordre :

- [ ] **ÉTAPE 1:** Exécutez `run diagnostic-deploy.js`
- [ ] **ÉTAPE 2:** Lisez attentivement le rapport généré
- [ ] **ÉTAPE 3:** Identifiez la cause (RAM, serveurs manquants, ou autre)
- [ ] **ÉTAPE 4:** Appliquez la solution appropriée :
  - Si RAM insuffisante → Solution 3 (upgrade) ou 4 (réduire threads)
  - Si serveurs manquants → Solution 5 (vérifier et attendre)
  - Si système bloqué → Solution 2 (redémarrage propre)
- [ ] **ÉTAPE 5:** Relancez le système avec `run boot.js`
- [ ] **ÉTAPE 6:** Vérifiez que Profit > 0/s dans le dashboard

---

## 🎯 RÉSULTAT ATTENDU

Après avoir résolu ce problème, vous devriez voir :

```
╔════════════════════════════════════════════════════════════╗
║      NEXUS-APEX v45.0 - PROMETHEUS DASHBOARD               ║
╚════════════════════════════════════════════════════════════╝
💰 CAPITAL
   94.261m
📈 PROFIT
   1.2m/s  ← ✅ REVENUS GÉNÉRÉS
✨ XP RATE
   450.5/s ← ✅ XP EN COURS
   Level: 244
🌐 NETWORK
   96/96 serveurs rootés
💾 RAM
   5.2TB / 8.54TB
   [████████████████████░░░░░░░░] 61%
⚙️  THREADS
   2,145 actifs ← Plus de threads actifs
🎯 TARGET
   omega-net
────────────────────────────────────────────────────────────
Uptime: 29538580min | Refresh: 1000ms
```

Et dans les logs du Controller, vous devriez voir :
```
✅ Lancé weaken sur nexus-node-14 (PID: 450, threads: 14)
✅ Lancé weaken sur nexus-node-15 (PID: 451, threads: 14)
✅ Lancé weaken sur nexus-node-16 (PID: 452, threads: 14)
...
```

Au lieu de :
```
⚠️  Échec exec weaken sur nexus-node-14 (14 threads)
```

---

## 🔗 PROCHAINES ÉTAPES

1. **Exécutez le diagnostic** pour identifier la cause exacte
2. **Partagez les résultats** avec moi si vous voulez de l'aide pour interpréter
3. **Appliquez la solution** recommandée
4. **Vérifiez les métriques** dans le dashboard

---

## 💡 NOTE IMPORTANTE

Le bug critique de `hack.js` que nous avons corrigé plus tôt concernait la **synchronisation temporelle** des batches HWGW (le système crashait quand il utilisait des délais).

Le problème actuel est **différent** : c'est un problème de **déploiement/ressources**, pas un bug de code.

Les deux problèmes sont maintenant :
- ✅ Bug hack.js : **CORRIGÉ**
- ⚠️ Problème de déploiement : **EN DIAGNOSTIC**

Une fois le problème de déploiement résolu, votre système devrait fonctionner à pleine capacité !

---

**Créé le:** 2026-03-01  
**Par:** Claude (Anthropic)  
**Priorité:** 🟡 MOYENNE (système fonctionne mais sous-optimal)
