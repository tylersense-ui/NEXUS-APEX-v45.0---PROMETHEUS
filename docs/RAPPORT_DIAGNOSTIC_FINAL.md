# 🔍 DIAGNOSTIC FINAL - NEXUS-APEX v45 PROMETHEUS

**Date:** 2026-03-01  
**Système:** PROMETHEUS v45.0  
**Problème:** 0$/seconde malgré 8.5 TB de RAM disponible

---

## ✅ CE QUE J'AI DÉCOUVERT

### Architecture du système (maintenant comprise) :

```
┌─────────────────────────────────────────────────────┐
│ orchestrator.js (PID 865)                           │
│   └─ Crée un objet Batcher (pas un processus)      │
│   └─ Boucle : appelle batcher.executeBatch()       │
│        └─ Le Batcher écrit des jobs JSON           │
│           dans le Port 4 (COMMANDS)                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Port 4 (COMMANDS)                                   │
│   • File FIFO pour la communication                 │
│   • Capacité : ~50 messages                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ controller.js (PID 866)                             │
│   └─ Lit le Port 4 en boucle                        │
│   └─ Exécute les workers sur les serveurs          │
│        └─ hack.js, grow.js, weaken.js               │
└─────────────────────────────────────────────────────┘
```

### ⚠️ POINT IMPORTANT :

**Le "Batcher" n'apparaît PAS dans `ps` car c'est un objet JavaScript qui vit DANS l'orchestrator !**

Quand le diagnostic dit "batcher.js → NON ACTIF", c'est **NORMAL**. Ce qui compte c'est que l'orchestrator soit actif.

---

## 🎯 LE VRAI PROBLÈME

Si vous avez **0$/seconde** alors que :
- ✅ Orchestrator actif (PID 865)
- ✅ Controller actif (PID 866)
- ✅ 75.60 GB RAM disponible sur home

**Le flux est cassé quelque part dans cette chaîne :**

1. **Orchestrator → Batcher.executeBatch()** ?
   - L'orchestrator appelle-t-il le Batcher ?
   - Le Batcher trouve-t-il des cibles valides ?

2. **Batcher → Port 4** ?
   - Le Batcher écrit-il des jobs dans le Port 4 ?
   - Les jobs sont-ils au bon format JSON ?

3. **Port 4 → Controller** ?
   - Le Controller lit-il le Port 4 ?
   - Le Controller comprend-il le format des jobs ?

4. **Controller → Workers** ?
   - Le Controller exécute-t-il les workers ?
   - Les serveurs nexus-node ont-ils de la RAM ?

---

## 🚀 UTILISATION DU DIAGNOSTIC

### Uploadez le fichier dans BitBurner :

1. Téléchargez `diagnostic-systeme-complet.js`
2. Dans BitBurner, glissez-déposez le fichier dans l'interface
3. Ou utilisez l'option "Upload" dans le menu

### Exécutez le diagnostic :

```bash
run diagnostic-systeme-complet.js
```

### Ce que le diagnostic va faire :

#### ✅ ÉTAPE 1 : Vérification des processus
- Confirme que orchestrator.js, controller.js sont actifs
- Affiche leurs PIDs

#### ✅ ÉTAPE 2 : Test du Port 4 (COMMANDS)
- Compte combien de messages sont dans le port
- Affiche un exemple de message s'il y en a
- **Verdict :**
  - Port PLEIN (>50 msgs) → Controller bloqué
  - Port VIDE → Batcher n'écrit pas OU Controller lit trop vite

#### ✅ ÉTAPE 3 : Cibles disponibles
- Scanne tous les serveurs
- Liste les cibles hackables
- Affiche le Top 5 par profit potentiel
- **Verdict :**
  - 0 cibles → Niveau de hacking trop bas
  - Cibles disponibles → Le problème est ailleurs

#### ✅ ÉTAPE 4 : Test d'écriture Port 4
- Écrit un message de test dans le port
- Vérifie que la communication fonctionne
- **Verdict :**
  - Écriture OK → Communication fonctionnelle
  - Écriture échoue → Port corrompu ou plein

#### ✅ ÉTAPE 5 : Serveurs de calcul (nexus-node)
- Compte les serveurs nexus-node-*
- Calcule l'utilisation de RAM
- **Verdict :**
  - 0 serveurs → Aucun serveur de calcul acheté
  - Utilisation <10% → Workers non exécutés
  - Utilisation >40% → Système fonctionne correctement

---

## 💡 SCÉNARIOS POSSIBLES

### Scénario A : Port 4 PLEIN de messages

**Symptôme :** Le diagnostic trouve >50 messages dans le port 4

**Diagnostic :**
- ✅ Le Batcher FONCTIONNE (écrit des jobs)
- ❌ Le Controller est BLOQUÉ (ne lit pas)

**Causes possibles :**
- Controller crashé silencieusement
- Erreur dans la boucle du Controller
- Controller attend un lock/ressource

**Solution :**
```bash
run global-kill.js
# Attendre 5 secondes
run boot.js
```

---

### Scénario B : Port 4 VIDE + Cibles disponibles

**Symptôme :** 
- Port 4 vide
- Le diagnostic trouve des cibles hackables
- Serveurs nexus-node existent mais sont VIDES (0% RAM utilisée)

**Diagnostic :**
- ❌ Le Batcher NE CRÉE PAS de batches
- Le Controller attend des jobs qui n'arrivent jamais

**Causes possibles :**

1. **Serveurs non préparés**
   - Security trop haute (>minDifficulty + 5)
   - Argent trop bas (<90% de moneyMax)
   - Le Batcher refuse de créer des batches

2. **Erreur dans le Batcher**
   - Bug dans `_calculateBatchJobs()`
   - Bug dans `_packJobs()` (FFD algorithm)
   - Erreur JavaScript non catchée

3. **Orchestrator ne boucle pas**
   - Erreur dans la boucle principale
   - Sleep infini
   - Crash silencieux

**Solution :**

```bash
# 1. Activer le mode DEBUG dans constants.js
# Éditez /lib/constants.js :
# DEBUG_MODE: true

# 2. Redémarrer avec logs verbeux
run global-kill.js
run boot.js

# 3. Surveiller les logs
tail core/orchestrator.js
tail hack/controller.js

# 4. Si rien n'apparaît, il y a un bug dans l'orchestrator
```

---

### Scénario C : Aucune cible hackable

**Symptôme :** Le diagnostic trouve 0 cibles valides

**Diagnostic :**
- Niveau de hacking trop bas
- Pas de port-openers (BruteSSH.exe, etc.)
- Aucun serveur rooté avec de l'argent

**Solution :**
```bash
# Augmenter le niveau de hacking
# ou acheter des port-openers
```

---

### Scénario D : Aucun serveur de calcul

**Symptôme :** 0 serveurs nexus-node trouvés

**Diagnostic :**
- Aucun serveur acheté
- Le système ne peut pas exécuter de workers

**Solution :**
```bash
# Acheter manuellement
purchaseServer("nexus-node-0", 64)
purchaseServer("nexus-node-1", 64)
# etc.

# Ou attendre que le server-manager les achète automatiquement
```

---

## 🎯 ACTIONS IMMÉDIATES

### 1. Exécutez le diagnostic complet

```bash
run diagnostic-systeme-complet.js
```

### 2. Lisez ATTENTIVEMENT la conclusion

Le diagnostic vous dira **EXACTEMENT** quel est le problème et quoi faire.

### 3. Appliquez la solution recommandée

Le diagnostic vous donne des commandes précises à exécuter.

### 4. Partagez les résultats avec moi

**Si le diagnostic ne résout pas le problème, partagez-moi :**

- La sortie COMPLÈTE du diagnostic
- Les logs de l'orchestrator : `tail core/orchestrator.js`
- Les logs du controller : `tail hack/controller.js`
- Le résultat de : `getServer("home").maxRam`

Avec ces infos, je pourrai identifier le bug exact et vous donner une solution précise.

---

## 📊 MÉTRIQUES ATTENDUES (si tout fonctionne)

Après résolution du problème, vous devriez voir :

### Dashboard :
```
💰 CAPITAL: 94.261m
📈 PROFIT: 50m/s à 500m/s  ← Revenus générés
✨ XP RATE: 10,000/s à 100,000/s  ← XP en cours
💾 RAM: 5TB / 8.5TB (60-80% utilisé)  ← Bonne utilisation
⚙️  THREADS: 10,000 à 50,000 actifs  ← Beaucoup de workers
```

### Serveurs nexus-node :
```
nexus-node-0: 90-95% RAM utilisée (workers actifs)
nexus-node-1: 90-95% RAM utilisée (workers actifs)
nexus-node-2: 90-95% RAM utilisée (workers actifs)
...
```

### Port 4 :
```
Port 4: VIDE ou 1-5 messages max
(Controller lit plus vite que le Batcher n'écrit = NORMAL)
```

---

## 🔧 OUTILS DE DÉPANNAGE SUPPLÉMENTAIRES

### Si vous voulez voir les logs en temps réel :

```bash
# Logs de l'orchestrator (boucle principale)
tail core/orchestrator.js

# Logs du controller (dispatch des workers)
tail hack/controller.js

# Processus actifs sur un serveur
ps nexus-node-0
```

### Si vous voulez vérifier le port 4 manuellement :

```bash
# Dans un nouveau script ou en console :
ns.readPort(4);  // Lit un message
ns.getPortHandle(4).empty();  // Vérifie si le port est vide
ns.clearPort(4);  // Vide le port
```

### Si vous voulez tester le Batcher manuellement :

**NOTE :** Le Batcher n'est PAS un script indépendant, il est intégré dans l'orchestrator. Vous ne pouvez pas le lancer directement.

---

## ✅ CHECKLIST DE RÉSOLUTION

- [ ] Exécuter `diagnostic-systeme-complet.js`
- [ ] Lire la conclusion du diagnostic
- [ ] Appliquer la solution recommandée
- [ ] Attendre 60 secondes après redémarrage
- [ ] Vérifier le dashboard : `PROFIT > 0/s` ?
- [ ] Si échec, partager les logs avec moi

---

**Créé par:** Claude (Anthropic)  
**Date:** 2026-03-01  
**Pour:** NEXUS-APEX v45 PROMETHEUS  
**Objectif:** Identifier précisément pourquoi le système génère 0$/s

---

**Bonne chance ! Le diagnostic devrait identifier le problème en <1 minute.** 🚀
