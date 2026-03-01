# PROMETHEUS v45.0 - "Stealing Fire From The Gods"

```
██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
                          v45.0 - "Stealing Fire From The Gods"
```

**Nexus-Automation Refork Professionnel**  
**Auteurs:** Claude (Anthropic) + tylersense-ui  
**Version:** 45.0 - PROMETHEUS  
**Date:** 2025-01-XX  
**License:** MIT  
**Target:** BitBurner v2.8.1+ (Steam)

---

## 📋 Table des Matières

- [À Propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Démarrage Rapide](#démarrage-rapide)
- [Configuration](#configuration)
- [Modules](#modules)
- [Tools](#tools)
- [Troubleshooting](#troubleshooting)
- [Développement](#développement)
- [Changelog](#changelog)

---

## 🎯 À Propos

**PROMETHEUS v45.0** est un refork professionnel et optimisé de Nexus-Automation pour BitBurner 2.8.1+. Cette version améliore drastiquement la qualité du code, les performances et la maintenabilité tout en conservant la philosophie originale du projet.

### Pourquoi PROMETHEUS ?

- ✅ **Code Production-Ready:** Try/catch robuste, validation systématique, logs professionnels
- ✅ **Performances Optimisées:** Cache TTL, FFD packing, calculs EV/s, sleep adaptatif
- ✅ **Documentation Exhaustive:** JSDoc complet, exemples, diagrammes d'architecture
- ✅ **Headers Unifiés:** ASCII art standardisé sur tous les fichiers
- ✅ **Corrections Audit:** Tous les points du rapport d'audit implémentés
- ✅ **Extensible:** Architecture modulaire, configuration centralisée

---

## ⚡ Fonctionnalités

### 🎯 Core Engine

- **Batcher HWGW Optimisé:** Calcul EV/s, FFD packing, formulas integration
- **Orchestrator Intelligent:** Auto-crack, target selection, resource allocation
- **Dashboard Temps Réel:** Métriques complètes, tail UI
- **Port Handler Robuste:** JSON messaging, retry logic
- **RAM Manager:** Reservation home, distribution optimale

### 💼 Managers Automatiques

| Manager | Description | Requires |
|---------|-------------|----------|
| **program-manager** | Achat auto programmes Darknet | SF4 (Singularity) |
| **hacknet-manager** | Gestion Hacknet Nodes avec ROI | - |
| **server-manager** | Purchased servers avec upgrades | - |
| **singularity-manager** | Factions, augs, backdoors, crimes | SF4 (Singularity) |
| **sleeve-manager** | Gestion sleeves avec rotation | SF10 (Sleeves) |
| **stock-manager** | Trading avec momentum + stop-loss | TIX + 4S Data |
| **gang-manager** | Gang avec ascension et warfare | SF2 (Gang) |
| **corp-manager** | Corporation multi-phases | SF3 (Corporation) |

### 🛠️ Tools Utilitaires

| Tool | Description | Usage |
|------|-------------|-------|
| **scanner** | Scan réseau avec filtres avancés | `run /tools/scanner.js` |
| **check-rep** | Réputation factions + augs | `run /tools/check-rep.js` |
| **set-share** | Déploiement share power | `run /tools/set-share.js --dry-run` |
| **pre-flight** | Validation pré-démarrage | `run /tools/pre-flight.js` |
| **shop** | Catalogue achats disponibles | `run /tools/shop.js --affordable` |
| **liquidate** | Vente assets (stocks + servers) | `run /tools/liquidate.js --dry-run` |
| **importer** | Import scripts externes | `run /tools/importer.js --help` |
| **nexus-greedy-swarm** | Algorithme greedy alternatif | `run /tools/nexus-greedy-swarm.js` |

---

## 🏗️ Architecture

```
/
├── boot.js                    # 🚀 Point d'entrée principal
├── global-kill.js             # 🛑 Arrêt d'urgence
│
├── core/                      # 🎯 Moteur principal
│   ├── orchestrator.js        # Chef d'orchestre
│   ├── batcher.js             # HWGW batch scheduler
│   ├── dashboard.js           # Métriques temps réel
│   ├── port-handler.js        # Communication inter-scripts
│   └── ram-manager.js         # Allocation RAM
│
├── hack/                      # 💰 Système de hacking
│   ├── controller.js          # Dispatcher de jobs
│   ├── watcher.js             # Monitoring targets
│   └── workers/               # Scripts d'exécution
│       ├── hack.js
│       ├── grow.js
│       ├── weaken.js
│       └── share.js
│
├── lib/                       # 📚 Bibliothèques
│   ├── capabilities.js        # Détection APIs
│   ├── constants.js           # Configuration centrale
│   ├── logger.js              # Logs professionnels
│   └── network.js             # Scan & scoring
│
├── managers/                  # 🤖 Managers automatiques
│   ├── program-manager.js
│   ├── hacknet-manager.js
│   ├── server-manager.js
│   ├── singularity-manager.js
│   ├── sleeve-manager.js
│   ├── stock-manager.js
│   ├── gang-manager.js
│   └── corp-manager.js
│
├── tools/                     # 🛠️ Utilitaires
│   ├── scanner.js
│   ├── check-rep.js
│   ├── set-share.js
│   ├── pre-flight.js
│   ├── shop.js
│   ├── liquidate.js
│   ├── importer.js
│   └── nexus-greedy-swarm.js
│
└── docs/                      # 📖 Documentation
    ├── architecture.txt
    └── timeline.txt
```

---

## 📦 Installation

### Méthode 1 : Manuelle (Recommandée)

1. **Télécharger le repository**
   ```bash
   git clone https://github.com/user/nexus-automation-prometheus
   ```

2. **Copier dans BitBurner**
   - Ouvrir l'éditeur in-game
   - Créer l'arborescence de dossiers
   - Copier/coller chaque fichier

3. **Vérifier l'installation**
   ```javascript
   run /tools/pre-flight.js
   ```

### Méthode 2 : VSCode Extension

1. Installer [BitBurner VSCode Extension](https://github.com/bitburner-official/bitburner-vscode)
2. Configurer le remote file sync
3. Synchroniser le projet

---

## 🚀 Démarrage Rapide

### 1. Vérification Pré-Vol

```javascript
run /tools/pre-flight.js
```

**Exit Codes:**
- `0` = ✅ Tout est OK
- `1` = ⚠️ Warnings (non-bloquant)
- `2` = ❌ Blockers (critical)

### 2. Configuration

Éditer `/lib/constants.js` selon vos besoins:

```javascript
export const CONFIG = {
    SYSTEM: {
        DEBUG_MODE: false,        // Logs détaillés
        REFRESH_RATE: 60000       // 60s entre cycles
    },
    HACKING: {
        RESERVED_HOME_RAM: 32,    // RAM réservée sur home
        MIN_TARGET_MONEY: 1000000 // Seuil min cibles
    },
    // ... voir constants.js pour toutes les options
};
```

### 3. Lancement

```javascript
run /boot.js
```

**Boot sequence:**
1. ✅ Scan du réseau
2. ✅ Crack des serveurs accessibles
3. ✅ Nettoyage des anciens scripts
4. ✅ Réinitialisation des ports
5. 🚀 Lancement de l'orchestrator

### 4. Monitoring

```javascript
tail /core/orchestrator.js
tail /core/dashboard.js
```

---

## ⚙️ Configuration

### Configuration Principale (`/lib/constants.js`)

```javascript
export const CONFIG = {
    // ═══════════════════════════════════════════════════════════════
    // SYSTÈME
    // ═══════════════════════════════════════════════════════════════
    SYSTEM: {
        DEBUG_MODE: false,           // Activer logs debug
        REFRESH_RATE: 60000,         // Cycle orchestrator (ms)
        TOAST_NOTIFICATIONS: true    // Notifications in-game
    },
    
    // ═══════════════════════════════════════════════════════════════
    // HACKING
    // ═══════════════════════════════════════════════════════════════
    HACKING: {
        RESERVED_HOME_RAM: 32,       // RAM réservée (GB)
        MIN_TARGET_MONEY: 1_000_000, // Seuil min cibles
        HACK_PERCENT: 0.10,          // % à voler par batch (10%)
        SECURITY_BUFFER: 5           // Buffer sécurité
    },
    
    // ═══════════════════════════════════════════════════════════════
    // PORTS (Communication)
    // ═══════════════════════════════════════════════════════════════
    PORTS: {
        COMMANDS: 1,                 // Commandes orchestrator
        STOCK_DATA: 2,               // Données boursières
        BATCH_STATUS: 3              // Statut batches
    },
    
    // ═══════════════════════════════════════════════════════════════
    // MANAGERS (Configurations spécifiques)
    // ═══════════════════════════════════════════════════════════════
    STOCK: {
        LONG_THRESHOLD: 0.55,        // Forecast > 55% → long
        SHORT_THRESHOLD: 0.45,       // Forecast < 45% → short
        STOP_LOSS_PERCENT: 0.05,     // Stop-loss à -5%
        TAKE_PROFIT_PERCENT: 0.15    // Take-profit à +15%
    },
    
    GANG: {
        FOCUS: "money",              // money, respect, training
        ASCENSION_THRESHOLD: 1.5,    // 1.5x multiplicateur
        ENABLE_WARFARE: true         // Guerre de territoire
    },
    
    CORP: {
        STRATEGY: "balanced",        // conservative, balanced, aggressive
        NAME: "Prometheus Industries"
    }
};
```

### Variables d'Environnement

Surcharger via arguments de lancement:

```javascript
// Lancer avec debug activé
run /boot.js --debug

// Forcer un target spécifique
run /core/orchestrator.js --target n00dles
```

---

## 📦 Modules

### Core Modules

#### Orchestrator

**Rôle:** Chef d'orchestre, coordonne tous les composants

**Features:**
- Auto-crack des serveurs
- Sélection intelligente des cibles
- Lancement des batches HWGW
- Gestion des erreurs avec retry

**Commandes:**
```javascript
run /core/orchestrator.js
tail /core/orchestrator.js
```

#### Batcher

**Rôle:** Planification et exécution des batches HWGW

**Améliorations PROMETHEUS:**
- ✅ Calcul EV/s pour hackPercent optimal
- ✅ FFD packing (First-Fit Decreasing)
- ✅ Formulas integration (si SF5)
- ✅ Métriques détaillées (threads planifiés vs dispatchés)

**Algorithme:**
```
1. Calculer hackPercent optimal par EV/s
2. Déterminer threads nécessaires (H/W/G/W)
3. Calculer offsets temporels précis (ms)
4. Packer threads avec FFD algorithm
5. Dispatcher sur le réseau
```

#### Dashboard

**Rôle:** Métriques en temps réel

**Affichage:**
- 💰 Argent total et $/s
- 🎯 Cibles actives
- 🖥️ RAM utilisée (total/home)
- 📈 Stocks (si TIX)
- 🤖 Statut managers

---

## 🛠️ Tools

### Pre-Flight Check

Validation complète avant démarrage:

```javascript
run /tools/pre-flight.js --verbose
```

**Vérifications:**
- ✅ Fichiers requis présents
- ✅ constants.js valide
- ✅ Capacités disponibles
- ✅ RAM disponible
- ✅ Ports fonctionnels

### Scanner

Scan avancé du réseau:

```javascript
// Tous les serveurs
run /tools/scanner.js

// Serveurs hackables uniquement
run /tools/scanner.js --filter hackable --sort money

// Export JSON
run /tools/scanner.js --json /data/network.json
```

### Liquidate

Conversion rapide assets → cash:

```javascript
// Preview (dry-run)
run /tools/liquidate.js --dry-run

// Liquider tout
run /tools/liquidate.js --force

// Seulement les stocks
run /tools/liquidate.js --stocks --force
```

**⚠️ ATTENTION:** Opération irréversible !

---

## 🐛 Troubleshooting

### Problèmes Courants

#### 1. "Script not found: /core/orchestrator.js"

**Solution:**
```javascript
// Vérifier les fichiers
run /tools/pre-flight.js

// Vérifier l'arborescence
ls /core/
```

#### 2. "RAM insuffisante sur home"

**Solution:**
```javascript
// Augmenter RESERVED_HOME_RAM
// Dans constants.js:
RESERVED_HOME_RAM: 64  // Au lieu de 32

// Ou acheter plus de RAM home
```

#### 3. "Port handler errors"

**Solution:**
```javascript
// Réinitialiser les ports
run /global-kill.js

// Relancer
run /boot.js
```

#### 4. "Batch failures répétés"

**Causes possibles:**
- Cibles trop difficiles
- RAM fragmentée
- Threads insuffisants

**Solution:**
```javascript
// Mode debug
// Dans constants.js:
DEBUG_MODE: true

// Vérifier les logs
tail /core/batcher.js
```

### Logs & Debug

**Activer debug mode:**
```javascript
// constants.js
DEBUG_MODE: true
```

**Logs importants:**
- `/core/orchestrator.js` - Cycle principal
- `/core/batcher.js` - Batches HWGW
- `/hack/controller.js` - Dispatch jobs
- `/managers/stock-manager.js` - Trading

---

## 👨‍💻 Développement

### Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code

**Headers:**
- ✅ ASCII art PROMETHEUS uniforme
- ✅ JSDoc complet avec exemples
- ✅ Version 45.0 sur tous les fichiers
- ✅ License MIT

**Code Quality:**
- ✅ Try/catch sur toutes les opérations I/O
- ✅ Validation des arguments
- ✅ Logs professionnels avec contexte
- ✅ Pas de valeurs hardcodées (utiliser CONFIG)
- ✅ Tests de régression

### Ajouter un Manager

1. Créer `/managers/new-manager.js`
2. Utiliser le template header PROMETHEUS
3. Implémenter la boucle principale
4. Ajouter la config dans `constants.js`
5. Documenter dans README.md

---

## 📝 Changelog

### v45.0 - PROMETHEUS (2025-01-XX)

**🔥 Refork Complet**

**Core:**
- ✅ Batcher: EV/s calculation, FFD packing, formulas integration
- ✅ Orchestrator: Enhanced error handling, retry logic
- ✅ Dashboard: Real-time metrics, improved layout
- ✅ Port Handler: Robust JSON messaging
- ✅ RAM Manager: Systematic reservation

**Hack:**
- ✅ Controller: Throttling, backoff exponential
- ✅ Workers: Argument validation, try/catch

**Lib:**
- ✅ Network: Cache TTL, iterative refresh
- ✅ Capabilities: Async update, better detection
- ✅ Logger: Professional formatting, debug mode
- ✅ Constants: Comprehensive configuration

**Managers:**
- ✅ program-manager: Priority order, throttling
- ✅ hacknet-manager: ROI calculation, adaptive sleep
- ✅ server-manager: ROI-based upgrades
- ✅ singularity-manager: Factions, augs, backdoors
- ✅ sleeve-manager: Pacing, rotation, sync
- ✅ stock-manager: Momentum strategy, stop-loss/take-profit
- ✅ gang-manager: Rate limiting, warfare
- ✅ corp-manager: Phase system, auto-expansion

**Tools:**
- ✅ scanner: Advanced filters, JSON export
- ✅ check-rep: Faction reputation, buyable augs
- ✅ set-share: Dry-run, deployment plan
- ✅ pre-flight: Complete validation, exit codes
- ✅ shop: Multi-catalog, affordable filter
- ✅ liquidate: Stocks + servers, confirmation
- ✅ importer: Manifest support, validation
- ✅ nexus-greedy-swarm: Greedy algorithm, swarm deploy

**Documentation:**
- ✅ README.md: Complete guide
- ✅ Architecture: System diagrams
- ✅ All files: Standardized headers

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Crédits

- **Original Project:** Nexus-Automation by tylersense-ui
- **PROMETHEUS Refork:** Claude (Anthropic)
- **Game:** BitBurner by Hydroflame

---

## 📞 Support

- **Issues:** GitHub Issues
- **Discord:** BitBurner Official Discord
- **Documentation:** `/docs/architecture.txt`

---

**🔥 PROMETHEUS v45.0 - "Stealing Fire From The Gods"**

*"We didn't steal fire from the gods. We optimized it."*
