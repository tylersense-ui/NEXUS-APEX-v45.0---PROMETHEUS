# 🚀 GUIDE RAPIDE - Résolution du problème de déploiement

## ⚡ Action immédiate (2 minutes)

### ÉTAPE 1: Uploadez le diagnostic

1. Téléchargez le fichier `diagnostic-deploy.js` que je vous ai fourni
2. Dans BitBurner, faites glisser-déposer le fichier dans l'interface
3. Ou utilisez l'option "Upload" dans le menu

### ÉTAPE 2: Exécutez le diagnostic

Dans le terminal BitBurner :
```bash
run diagnostic-deploy.js
```

### ÉTAPE 3: Lisez les résultats

Le script va afficher pour chaque serveur :
- ✅ ou ❌ Si le serveur existe
- 📊 La RAM disponible
- 💾 Les processus en cours
- 🎯 Si le déploiement est possible

**Exemple de sortie attendue :**
```
🖥️  Serveur: nexus-node-14
────────────────────────────────────────────────────────────
  ✅ Serveur existe
  📊 RAM: 18.2 GB / 32 GB (56.9% utilisé)
  💾 RAM libre: 13.8 GB
  ✅ Worker /hack/workers/weaken.js présent
  📏 RAM par thread: 1.75 GB
  🎯 RAM nécessaire (14 threads): 24.5 GB
  ❌ NE PEUT PAS exécuter 14 threads
  ⚠️  Maximum possible: 7 threads seulement
  💡 Manque: 10.7 GB
```

---

## 🎯 Solutions selon les résultats

### CAS A: "Serveur N'EXISTE PAS"

**Problème:** Le serveur n'a pas encore été acheté.

**Solution:** C'est normal ! Attendez que le `server-manager.js` achète plus de serveurs.

**Ou achetez manuellement:**
```bash
# Vérifiez votre argent
getServerMoneyAvailable("home")

# Achetez un serveur 64GB (coûte ~5-10m)
purchaseServer("nexus-node-14", 64)
```

---

### CAS B: "NE PEUT PAS exécuter X threads - RAM insuffisante"

**Problème:** Le serveur existe mais n'a pas assez de RAM libre.

**Solution 1 - Redémarrage propre (RECOMMANDÉ):**
```bash
run global-kill.js
# Attendez 2 secondes
run boot.js
```

Cela va :
- ✅ Tuer tous les processus bloqués
- ✅ Libérer toute la RAM
- ✅ Redémarrer proprement le système

**Solution 2 - Upgrade du serveur:**
```bash
# Vérifiez la RAM actuelle
getServer("nexus-node-14").maxRam

# Si < 64 GB, upgradez (nécessite de delete puis racheter)
deleteServer("nexus-node-14")
purchaseServer("nexus-node-14", 128)  # 128 GB
```

**Solution 3 - Attendre l'auto-upgrade:**
Le système va automatiquement upgrader les serveurs quand il aura assez d'argent.

---

### CAS C: "Worker ABSENT"

**Problème:** Le fichier worker n'a pas été copié sur ce serveur.

**Solution:**
```bash
# Redémarrage complet pour forcer la copie
run global-kill.js
run boot.js
```

Le Controller va automatiquement copier les workers sur tous les serveurs au démarrage.

---

## 📊 Commandes utiles pour diagnostic

### Voir vos serveurs achetés :
```bash
getPurchasedServers()
```

### Voir la RAM d'un serveur :
```bash
getServer("nexus-node-14").maxRam
```

### Voir vos processus actifs :
```bash
ps("nexus-node-14")
```

### Voir votre argent :
```bash
getServerMoneyAvailable("home")
```

### Tuer tous les processus sur un serveur :
```bash
killall("nexus-node-14")
```

---

## ⚠️ Si le problème persiste

Après avoir essayé les solutions ci-dessus, si vous voyez toujours:
```
⚠️  Échec exec weaken sur nexus-node-XX
```

Alors **partagez avec moi** :
1. La sortie complète de `diagnostic-deploy.js`
2. La sortie de `getPurchasedServers()`
3. Votre capital actuel
4. Les dernières lignes du `tail hack/controller.js`

Je pourrai alors vous donner une solution plus précise !

---

## ✅ Vérification finale

Après avoir appliqué la solution, vérifiez que tout fonctionne :

1. **Dashboard montre des revenus :**
   ```
   📈 PROFIT
      1.2m/s  ← Doit être > 0
   ```

2. **Controller ne montre plus d'erreurs :**
   ```bash
   tail hack/controller.js
   # Vous devriez voir:
   # ✅ Lancé weaken sur nexus-node-XX (PID: XXX, threads: XX)
   # Au lieu de:
   # ⚠️  Échec exec weaken sur nexus-node-XX
   ```

3. **Les processus tournent :**
   ```bash
   ps("nexus-node-14")  # Doit montrer des processus actifs
   ```

---

## 🎯 Résumé en 3 actions

Si vous êtes pressé, faites simplement ça :

```bash
# 1. Diagnostic
run diagnostic-deploy.js

# 2. Nettoyage
run global-kill.js

# 3. Redémarrage
run boot.js
```

Puis vérifiez le dashboard pour confirmer que `PROFIT > 0/s`.

**Si ça ne fonctionne toujours pas**, partagez la sortie du diagnostic avec moi ! 🔍

---

**Durée totale estimée:** 5-10 minutes  
**Difficulté:** ⭐⭐☆☆☆ (Facile)  
**Créé par:** Claude (Anthropic)
