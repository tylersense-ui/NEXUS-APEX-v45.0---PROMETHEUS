/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v47.5 - "HARDCORE GAMER - 4 CRITICAL FIXES"
 * 
 * @module      lib/constants
 * @description Configuration centralisée pour l'ensemble du système Nexus-Apex.
 *              Toutes les constantes sont documentées avec leurs unités et leur usage.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     47.5 - PROMETHEUS HARDCORE GAMER EDITION
 * @date        2026-03-05
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 CHANGELOG v47.5 - HARDCORE GAMER FIXES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * 🐛 BUG FIX #1: MAX_TARGET_DIFFICULTY restauré
 *    - Problème: Variable supprimée causant undefined dans network.js
 *    - Solution: MAX_TARGET_DIFFICULTY = 100 (permissif pour early game)
 *    - Impact: Évite filtrage prématuré des serveurs hackables
 * 
 * 🐛 BUG FIX #2: RESERVED_HOME_RAM réduit pour early game  
 *    - Problème: 32GB trop élevé pour début de jeu (home 8-16GB total)
 *    - Solution: Réduit de 32GB → 8GB  
 *    - Impact: Le système peut déployer dès le démarrage
 *    - Note: Valeur dynamique basée sur BitNode conseillée plus tard
 * 
 * ✅ Config adaptée pour progression Newbie → Hardcore:
 *    - Early game (8-64GB home): 8GB réservé
 *    - Mid game (128-512GB home): 16GB réservé  
 *    - Late game (1TB+ home): 32-64GB réservé
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   import { CONFIG } from "/lib/constants.js";
 *   const refreshRate = CONFIG.SYSTEM.REFRESH_RATE;
 *   const reservedRam = CONFIG.HACKING.RESERVED_HOME_RAM;
 * 
 * @example
 *   // Utilisation des ports
 *   const commandPort = CONFIG.PORTS.COMMANDS; // → 4
 *   ph.writeJSON(commandPort, { type: 'hack', target: 'n00dles' });
 * 
 * @example
 *   // Vérification du mode debug
 *   if (CONFIG.SYSTEM.DEBUG_MODE) {
 *       ns.print(`[DEBUG] hackPercent choisi: ${percent}`);
 *   }
 */

/** @param {NS} ns **/
export const CONFIG = {
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // VERSION & METADATA
    // ═══════════════════════════════════════════════════════════════════════════════
    VERSION: {
        MAJOR: 47,
        MINOR: 5,
        PATCH: 0,
        TAG: "HARDCORE-GAMER-EDITION",
        FULL: "v47.5.0-HARDCORE-GAMER-EDITION",
        DATE: "2026-03-05"
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // PORTS DE COMMUNICATION (Netscript Ports 1-20)
    // ═══════════════════════════════════════════════════════════════════════════════
    PORTS: {
        /** Port 1: Carte du réseau (liste des serveurs rootés) */
        NETWORK_MAP: 1,
        
        /** Port 2: File d'attente des cibles prioritaires */
        TARGET_QUEUE: 2,
        
        /** Port 3: Flux de logs centralisé */
        LOG_STREAM: 3,
        
        /** Port 4: Bus de commandes pour le Controller (CRITIQUE) */
        COMMANDS: 4,
        
        /** Port 5: Données boursières pour le Dashboard */
        STOCK_DATA: 5,
        
        /** Port 6: Configuration du ratio de partage */
        SHARE_RATIO: 6
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // HACKING (Paramètres de hacking) - v47.5 HARDCORE FIXES
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration centrale du système de hacking HWGW.
     * Optimisé pour progression Newbie → Hardcore Gamer.
     */
    HACKING: {
        /**
         * 🐛 BUG FIX #2: RAM réservée sur home (GB)
         * 
         * AVANT v47.5: 32GB (trop élevé pour early game)
         * APRÈS v47.5: 8GB (adapté pour home de 8-16GB)
         * 
         * Recommandations par stade:
         * - Newbie (home 8-16GB): 8GB  ← VALEUR ACTUELLE
         * - Mid (home 128-512GB): 16GB
         * - Late (home 1TB+): 32-64GB
         * 
         * @type {number}
         * @unit Gigabytes
         * @default 8
         */
        RESERVED_HOME_RAM: 8,
        
        /**
         * Argent minimum pour qu'une cible soit valide ($)
         * 
         * Filtre les cibles avec moneyMax < 1M (trop faible ROI).
         * 
         * @type {number}
         * @unit Dollars
         * @default 1_000_000
         */
        MIN_TARGET_MONEY: 1_000_000,
        
        /**
         * Buffer de sécurité au-dessus de minDifficulty
         * 
         * OPTIMISÉ v46.0 : 5 → 2 (prep plus rapide)
         * 
         * Définit la tolérance avant qu'un serveur soit considéré "ready".
         * Valeur plus basse = prep plus rapide mais moins de marge d'erreur.
         * 
         * @type {number}
         * @unit Security level
         * @default 2
         */
        SECURITY_BUFFER: 2,
        
        /**
         * Buffer temporel entre les opérations HWGW (ms)
         * 
         * Délai standard entre H→W→G→W dans un batch.
         * Valeurs typiques: 50-200ms selon performance machine.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 100
         */
        TIMING_BUFFER_MS: 100,
        
        /**
         * Intervalle de recalcul EV/s par cible (ms)
         * 
         * OPTIMISÉ v46.0 : 300s → 120s (refresh plus fréquent)
         * 
         * Fréquence de recalcul du hackPercent optimal.
         * Plus court = s'adapte plus vite aux changements de stats.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 120000 (2 minutes)
         */
        EV_RECALC_INTERVAL_MS: 120000,
        
        /**
         * Nombre minimum de threads par sous-job (job splitting)
         * 
         * Évite la création de micro-jobs qui fragmentent la RAM.
         * Jobs < ce seuil seront refusés.
         * 
         * @type {number}
         * @unit threads
         * @default 1
         */
        MIN_THREADS_PER_SUBJOB: 1,
        
        /**
         * Nombre maximum de threads pour un job grow
         * 
         * OPTIMISÉ v46.0 : 2000 → 10000 (limite plus haute)
         * 
         * Limite la taille des jobs grow pour éviter monopolisation RAM.
         * Sera limité dynamiquement par le batcher selon RAM disponible.
         * 
         * @type {number}
         * @unit threads
         * @default 10000
         */
        MAX_GROW_THREADS: 10000,
        
        /**
         * 🐛 BUG FIX #1: Difficulté maximale des cibles (RESTAURÉ)
         * 
         * PROBLÈME: Variable manquante causait undefined dans network.js
         * SOLUTION: Restauré avec valeur permissive pour early game
         * 
         * Filtre les serveurs avec minDifficulty > cette valeur.
         * Valeur élevée (100) permet d'attaquer même les serveurs difficiles.
         * Le batcher gérera la préparation automatiquement.
         * 
         * @type {number}
         * @unit Security level
         * @default 100
         */
        MAX_TARGET_DIFFICULTY: 100,
        
        /**
         * Candidats pour le calcul EV/s optimal
         * 
         * OPTIMISÉ v46.0 : 20 valeurs → 5 valeurs ciblées
         * Impact : -75% temps CPU sur sélection hackPercent
         * 
         * Le batcher teste chaque valeur et choisit celle maximisant $/s.
         * Valeurs focalisées sur 10-30% (optimal pour la plupart des serveurs).
         * 
         * @type {number[]}
         * @unit Percentage (0.0 to 1.0)
         */
        HACK_PERCENT_CANDIDATES: [
            0.10, 0.15, 0.20, 0.25, 0.30
        ]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // BATCHER (Throttling & Dispatch) - v46.0 GODMODE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration du Batcher pour éviter la saturation du port 4.
     * 
     * OPTIMISATIONS v46.0 :
     * - DISPATCH_DELAY_MS : 20ms → 10ms (débit x2)
     * - BATCH_DELAY_MS : 0 → 100ms (logs groupés, meilleure lisibilité)
     * 
     * Impact : +100% débit de dispatch, logs plus propres
     */
    BATCHER: {
        /**
         * Délai entre chaque dispatch de job (millisecondes)
         * 
         * OPTIMISÉ v46.0 : 20ms → 10ms
         * 
         * Nouveau débit:
         * - 10ms : ~100 jobs/seconde (vs 50 jobs/s avant)
         * - Batch HWGW (4 jobs) : 40ms au lieu de 80ms
         * 
         * Testé stable avec Controller à 20ms poll interval.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 10
         */
        DISPATCH_DELAY_MS: 10,
        
        /**
         * Délai supplémentaire entre batches complets
         * 
         * OPTIMISÉ v46.0 : 0 → 100ms
         * 
         * Après avoir dispatché un batch HWGW complet (4 jobs),
         * attendre ce délai avant le batch suivant.
         * 
         * Permet de grouper les jobs d'un même batch et de laisser
         * de l'espace entre les batches pour meilleure lisibilité des logs.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 100
         */
        BATCH_DELAY_MS: 100,
        
        /**
         * Nombre maximum de tentatives pour writeJSON
         * 
         * Si le port 4 est plein, réessayer ce nombre de fois.
         * Évite les pertes de jobs en cas de congestion temporaire.
         * 
         * @type {number}
         * @default 5
         */
        MAX_WRITE_RETRIES: 5,
        
        /**
         * Délai entre les retries writeJSON (ms)
         * 
         * Attente exponentielle : 10ms → 20ms → 40ms → 80ms...
         * 
         * @type {number}
         * @unit milliseconds
         * @default 10
         */
        WRITE_RETRY_DELAY_MS: 10
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // CONTROLLER (Job Dispatcher) - v47.3 GODMODE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration du Controller pour optimiser le dispatching des workers.
     * 
     * OPTIMISATIONS v47.3 :
     * - Drainage instantané du port 4 (while loop interne)
     * - Pas de backoff (vitesse constante 50ms)
     * - UUID salt injection (évite collisions process)
     */
    CONTROLLER: {
        /**
         * Intervalle de polling du port 4 (ms)
         * 
         * OPTIMISÉ v46.0 : 50ms → 20ms (x2.5 plus rapide)
         * 
         * Nouveau débit:
         * - 20ms : ~50 jobs/seconde (vs 20 jobs/s avant)
         * - Compatible avec Batcher à 10ms dispatch
         * 
         * @type {number}
         * @unit milliseconds
         * @default 20
         */
        POLL_INTERVAL_MS: 20,
        
        /**
         * Nombre max de jobs à lire par cycle
         * 
         * v47.3 : Drainage complet du port (while isEmpty)
         * Cette config est un safety net si jamais le port déborde.
         * 
         * @type {number}
         * @default 100
         */
        MAX_JOBS_PER_CYCLE: 100,
        
        /**
         * Activer UUID salt injection
         * 
         * Génère un identifiant unique pour chaque worker lancé.
         * Évite les collisions ns.exec() lors du job splitting.
         * 
         * @type {boolean}
         * @default true
         */
        USE_UUID_SALT: true
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR (Master Coordinator) - v46.0
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration de l'Orchestrator pour la coordination globale.
     * 
     * OPTIMISATIONS v46.0 :
     * - REFRESH_INTERVAL_MS : 120s → 60s (x2 plus réactif)
     * - MAX_TARGETS : 3 → 6 (meilleure utilisation RAM)
     */
    ORCHESTRATOR: {
        /**
         * Intervalle de refresh du réseau (ms)
         * 
         * OPTIMISÉ v46.0 : 120s → 60s
         * 
         * Fréquence de rescan du réseau et recalcul des cibles.
         * Plus court = détecte nouveaux serveurs plus vite.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 60000 (1 minute)
         */
        REFRESH_INTERVAL_MS: 60000,
        
        /**
         * Nombre maximum de cibles simultanées
         * 
         * OPTIMISÉ v46.0 : 3 → 6
         * 
         * Permet d'exploiter plus de serveurs en parallèle.
         * Attention : Plus de cibles = plus de complexité monitoring.
         * 
         * @type {number}
         * @default 6
         */
        MAX_TARGETS: 6,
        
        /**
         * Délai entre dispatch de batch (s)
         * 
         * Sleep entre chaque cycle orchestrator → batcher.
         * Contrôle la fréquence de création de nouveaux batchs.
         * 
         * @type {number}
         * @unit seconds
         * @default 5
         */
        CYCLE_DELAY_S: 5
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SYSTÈME (Global Settings)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration système globale affectant tous les modules.
     */
    SYSTEM: {
        /**
         * Activer les logs détaillés et l'instrumentation
         * 
         * Active: métriques EV/s, threads planifiés vs dispatchés, RAM gaspillée
         * 
         * ⚠️ WARNING: DEBUG_MODE ralentit le système de ~10-15%
         * Désactiver en production pour performance maximale.
         * 
         * @type {boolean}
         * @default false
         */
        DEBUG_MODE: false,
        
        /**
         * Intervalle de rafraîchissement du système de monitoring (ms)
         * 
         * Fréquence d'update du dashboard et des métriques.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 2000
         */
        REFRESH_RATE: 2000,
        
        /**
         * Activer les toasts notifications in-game
         * 
         * Affiche des popups pour événements critiques.
         * 
         * @type {boolean}
         * @default true
         */
        TOAST_NOTIFICATIONS: true,
        
        /**
         * TTL du cache réseau (ms)
         * 
         * Durée de validité du cache Network.refresh().
         * Évite scan répétés inutiles.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 30000 (30 secondes)
         */
        NETWORK_CACHE_TTL_MS: 30000
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // MANAGERS (Autonomous Agents) - Optional
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration des managers automatiques (optionnels).
     * Nécessitent des Source Files spécifiques.
     */
    MANAGERS: {
        /**
         * Activer le server manager (achat auto de serveurs)
         * 
         * @type {boolean}
         * @default true
         */
        AUTO_SERVER_PURCHASE: true,
        
        /**
         * Budget max pour achat de serveurs ($)
         * 
         * @type {number}
         * @unit Dollars
         * @default 100_000_000_000 (100B)
         */
        SERVER_BUDGET: 100_000_000_000,
        
        /**
         * Activer le hacknet manager
         * 
         * @type {boolean}
         * @default true
         */
        AUTO_HACKNET: true,
        
        /**
         * ROI maximum acceptable pour investissements (heures)
         * 
         * Limite les achats non-rentables.
         * 
         * @type {number}
         * @unit hours
         * @default 8
         */
        MAX_ROI_HOURS: 8
    }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: AFFICHER LA CONFIG ACTUELLE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Utilitaire pour debugging et validation de la configuration.
 * 
 * @param {NS} ns - Netscript API
 * @returns {void}
 * 
 * @example
 *   import { CONFIG, printConfig } from "/lib/constants.js";
 *   printConfig(ns);
 */
export function printConfig(ns) {
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔥 PROMETHEUS CONFIGURATION - v47.5 HARDCORE GAMER");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint(`📦 Version: ${CONFIG.VERSION.FULL}`);
    ns.tprint(`📅 Date: ${CONFIG.VERSION.DATE}`);
    ns.tprint(`🏷️  Tag: ${CONFIG.VERSION.TAG}`);
    ns.tprint("");
    ns.tprint("⚙️  HACKING CONFIG:");
    ns.tprint(`  • 💾 RESERVED_HOME_RAM: ${CONFIG.HACKING.RESERVED_HOME_RAM}GB (🐛 FIX #2)`);
    ns.tprint(`  • 🎯 MAX_TARGET_DIFFICULTY: ${CONFIG.HACKING.MAX_TARGET_DIFFICULTY} (🐛 FIX #1)`);
    ns.tprint(`  • 🛡️  SECURITY_BUFFER: ${CONFIG.HACKING.SECURITY_BUFFER}`);
    ns.tprint(`  • 📦 MAX_GROW_THREADS: ${CONFIG.HACKING.MAX_GROW_THREADS}`);
    ns.tprint(`  • 🔥 DISPATCH_DELAY_MS: ${CONFIG.BATCHER.DISPATCH_DELAY_MS}ms`);
    ns.tprint(`  • ⚡ POLL_INTERVAL_MS: ${CONFIG.CONTROLLER.POLL_INTERVAL_MS}ms`);
    ns.tprint(`  • 🔄 REFRESH_INTERVAL: ${CONFIG.ORCHESTRATOR.REFRESH_INTERVAL_MS / 1000}s`);
    ns.tprint(`  • 🎯 MAX_TARGETS: ${CONFIG.ORCHESTRATOR.MAX_TARGETS}`);
    ns.tprint(`  • 🐛 DEBUG_MODE: ${CONFIG.SYSTEM.DEBUG_MODE ? '\u001b[32mACTIVÉ\u001b[0m' : '\u001b[31mDÉSACTIVÉ\u001b[0m'}`);
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 NOTES DE MIGRATION v47.5
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * BREAKING CHANGES:
 * -----------------
 * 1. RESERVED_HOME_RAM: 32GB → 8GB
 *    Action: Aucune si vous êtes en early game.
 *    Si late game (home >1TB), augmenter manuellement à 32-64GB.
 * 
 * 2. MAX_TARGET_DIFFICULTY: undefined → 100
 *    Action: Aucune, fix automatique.
 *    Network.js peut maintenant filtrer correctement les cibles.
 * 
 * BACKWARD COMPATIBILITY:
 * -----------------------
 * ✅ Toutes les autres constantes sont rétrocompatibles v46.0
 * ✅ Les managers optionnels ne sont pas affectés
 * ✅ Les ports de communication sont inchangés
 * 
 * UPGRADE PATH:
 * -------------
 * 1. Remplacer /lib/constants.js par cette version
 * 2. run global-kill.js
 * 3. run boot.js
 * 4. Vérifier logs orchestrator (devrait déployer immédiatement)
 * 5. Ajuster RESERVED_HOME_RAM selon votre stade de jeu
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
