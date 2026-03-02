/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔████████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████║
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.4 - "PATCHED - Throttling Configuration"
 * 
 * @module      lib/constants
 * @description Configuration centralisée pour l'ensemble du système Nexus-Apex.
 *              Toutes les constantes sont documentées avec leurs unités et leur usage.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.4 - PROMETHEUS PATCHED
 * @date        2026-03-02
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.4 - PATCH : BATCHER THROTTLING CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ NOUVEAU : CONFIG.BATCHER.DISPATCH_DELAY_MS
 * ✓ NOUVEAU : CONFIG.BATCHER.BATCH_DELAY_MS  
 * ✓ Ces constantes contrôlent le throttling du dispatch pour éviter saturation port 4
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.1 - PATCH : JOB SPLITTING CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ NOUVEAU : MIN_THREADS_PER_SUBJOB - Évite les micro-jobs
 * ✓ NOUVEAU : MAX_GROW_THREADS - Limite la taille des jobs grow
 * ✓ Ces constantes permettent de contrôler le découpage des jobs
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

/** @param {NS} ns **/
export const CONFIG = {
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // PORTS DE COMMUNICATION (Netscript Ports 1-20)
    // ═══════════════════════════════════════════════════════════════════════════════
    PORTS: {
        /** Port des commandes pour le controller (dispatcher) */
        COMMANDS: 4,
        
        /** Port des données boursières (stock trading) */
        STOCK_DATA: 2,
        
        /** Port du statut des batches (monitoring) */
        BATCH_STATUS: 3
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SYSTÈME (Paramètres globaux)
    // ═══════════════════════════════════════════════════════════════════════════════
    SYSTEM: {
        /** Mode debug (logs détaillés) */
        DEBUG_MODE: false,
        
        /** Intervalle de rafraîchissement orchestrator (ms) */
        REFRESH_RATE: 60000,
        
        /** Durée de vie du cache réseau (ms) */
        NETWORK_CACHE_TTL_MS: 30000,
        
        /** Afficher les notifications toast in-game */
        TOAST_NOTIFICATIONS: true
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // HACKING (Paramètres de hacking)
    // ═══════════════════════════════════════════════════════════════════════════════
    HACKING: {
        /** RAM réservée sur home (GB) */
        RESERVED_HOME_RAM: 32,
        
        /** Argent minimum pour qu'une cible soit valide ($) */
        MIN_TARGET_MONEY: 1_000_000,
        
        /** Buffer de sécurité au-dessus de minDifficulty */
        SECURITY_BUFFER: 5,
        
        /** Buffer temporel entre les opérations HWGW (ms) */
        TIMING_BUFFER_MS: 100,
        
        /** Intervalle de recalcul EV/s par cible (ms) */
        EV_RECALC_INTERVAL_MS: 300000,
        
        /** Nombre minimum de threads par sous-job (job splitting) */
        MIN_THREADS_PER_SUBJOB: 1,
        
        /** Nombre maximum de threads pour un job grow */
        MAX_GROW_THREADS: 10000,
        
        /** Candidats pour le calcul EV/s optimal */
        HACK_PERCENT_CANDIDATES: [
            0.01, 0.02, 0.03, 0.04, 0.05,
            0.06, 0.07, 0.08, 0.09, 0.10,
            0.12, 0.14, 0.16, 0.18, 0.20,
            0.22, 0.24, 0.26, 0.28, 0.30
        ]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 NOUVEAU v45.4 : BATCHER (Throttling & Dispatch)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration du Batcher pour éviter la saturation du port 4.
     * 
     * PROBLÈME RÉSOLU:
     * - Le Batcher dispatchait tous les jobs en rafale
     * - Le port 4 se remplissait (capacité ~50 messages)
     * - WriteJSON échouait après 5 tentatives
     * - Le Controller ralentissait avec backoff (contre-productif)
     * 
     * SOLUTION:
     * - Délai entre chaque dispatch de job
     * - Permet au Controller de lire et vider le port
     * - Élimine les échecs WriteJSON
     */
    BATCHER: {
        /**
         * Délai entre chaque dispatch de job (millisecondes)
         * 
         * Valeurs recommandées:
         * - 20ms : Débit ~50 jobs/seconde (RECOMMANDÉ)
         * - 30ms : Débit ~33 jobs/seconde (si encore des échecs)
         * - 50ms : Débit ~20 jobs/seconde (ultra-safe)
         * 
         * Note: Le Controller lit à 50ms/job, donc:
         * - DISPATCH_DELAY_MS < 50ms → Port se remplit lentement
         * - DISPATCH_DELAY_MS = 50ms → Port stable
         * - DISPATCH_DELAY_MS > 50ms → Port se vide
         * 
         * @type {number}
         * @unit milliseconds
         * @default 20
         */
        DISPATCH_DELAY_MS: 20,
        
        /**
         * Délai supplémentaire entre batches complets
         * 
         * Après avoir dispatché un batch HWGW complet (4 jobs),
         * attendre ce délai avant le batch suivant.
         * 
         * Permet de grouper les jobs d'un même batch et de laisser
         * de l'espace entre les batches.
         * 
         * @type {number}
         * @unit milliseconds
         * @default 0 (désactivé)
         */
        BATCH_DELAY_MS: 0
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // CONTROLLER (Paramètres du dispatcher)
    // ═══════════════════════════════════════════════════════════════════════════════
    CONTROLLER: {
        /** Intervalle de lecture du port (ms) - CONSTANT dans v45.4 */
        POLL_INTERVAL_MS: 50
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR (Paramètres de l'orchestrateur)
    // ═══════════════════════════════════════════════════════════════════════════════
    ORCHESTRATOR: {
        /** Intervalle de rafraîchissement (ms) */
        REFRESH_INTERVAL_MS: 60000,
        
        /** Nombre maximum de cibles simultanées */
        MAX_TARGETS: 3
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // MANAGERS (Configurations spécifiques)
    // ═══════════════════════════════════════════════════════════════════════════════
    MANAGERS: {
        /** Préfixe des serveurs achetés (purchased servers) */
        SERVER_PREFIX: "nexus-node",
        
        /** RAM cible par serveur acheté (GB) */
        TARGET_SERVER_RAM: 1024,
        
        /** Nombre maximum de serveurs achetés */
        MAX_PURCHASED_SERVERS: 25
    },
    
    STOCK: {
        /** Forecast > 55% → long */
        LONG_THRESHOLD: 0.55,
        
        /** Forecast < 45% → short */
        SHORT_THRESHOLD: 0.45,
        
        /** Stop-loss à -5% */
        STOP_LOSS_PERCENT: 0.05,
        
        /** Take-profit à +15% */
        TAKE_PROFIT_PERCENT: 0.15
    },
    
    GANG: {
        /** Focus : money, respect, training */
        FOCUS: "money",
        
        /** Seuil pour ascension (1.5x multiplicateur) */
        ASCENSION_THRESHOLD: 1.5,
        
        /** Activer la guerre de territoire */
        ENABLE_WARFARE: true
    },
    
    CORP: {
        /** Stratégie : conservative, balanced, aggressive */
        STRATEGY: "balanced",
        
        /** Nom de la corporation */
        NAME: "Prometheus Industries"
    },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // LOGGING (Codes couleurs ANSI)
    // ═══════════════════════════════════════════════════════════════════════════════
    COLORS: {
        /** Code ANSI pour texte rouge (erreur) */
        ERROR: "\u001b[31m",
        
        /** Code ANSI pour texte jaune (warning) */
        WARN: "\u001b[33m",
        
        /** Code ANSI pour texte vert (succès) */
        SUCCESS: "\u001b[32m",
        
        /** Code ANSI pour texte blanc (info) */
        INFO: "\u001b[37m",
        
        /** Code ANSI pour texte cyan (debug) */
        DEBUG: "\u001b[36m",
        
        /** Code ANSI pour réinitialiser la couleur */
        RESET: "\u001b[0m"
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // MÉTADONNÉES DE VERSION
    // ═══════════════════════════════════════════════════════════════════════════════
    VERSION: {
        /** Numéro de version majeur */
        MAJOR: 45,
        
        /** Numéro de version mineur (PATCHED v45.4) */
        MINOR: 4,
        
        /** Nom de code de la version */
        CODENAME: "PROMETHEUS",
        
        /** Tagline de la version */
        TAGLINE: "Stealing Efficiency From The Gods",
        
        /** Version complète formatée */
        FULL: "v45.4 - PROMETHEUS PATCHED (Anti-Saturation)",
        
        /** Date de release (format ISO) */
        RELEASE_DATE: "2026-03-02",
        
        /** Version minimale requise de BitBurner */
        MIN_BITBURNER_VERSION: "2.8.1"
    }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 VALIDATION HELPER
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Fonction de validation des constantes au démarrage
 * Vérifie la cohérence des valeurs et alerte sur les configurations dangereuses
 * 
 * @param {NS} ns - Namespace BitBurner
 * @returns {boolean} True si la configuration est valide
 */
export function validateConfig(ns) {
    // Vérification que RESERVED_HOME_RAM n'est pas trop élevé
    const homeRam = ns.getServerMaxRam("home");
    if (CONFIG.HACKING.RESERVED_HOME_RAM > homeRam * 0.5) {
        ns.tprint(`[WARN] RESERVED_HOME_RAM (${CONFIG.HACKING.RESERVED_HOME_RAM}GB) > 50% de la RAM de home (${homeRam}GB)`);
    }

    // Vérification MIN_THREADS_PER_SUBJOB
    if (CONFIG.HACKING.MIN_THREADS_PER_SUBJOB < 1) {
        ns.tprint(`[ERROR] MIN_THREADS_PER_SUBJOB doit être ≥ 1`);
        return false;
    }

    // Vérification MAX_GROW_THREADS
    if (CONFIG.HACKING.MAX_GROW_THREADS < 100) {
        ns.tprint(`[WARN] MAX_GROW_THREADS (${CONFIG.HACKING.MAX_GROW_THREADS}) très faible - les batches seront limités`);
    }
    
    // NOUVEAU v45.4: Vérification DISPATCH_DELAY_MS
    if (CONFIG.BATCHER.DISPATCH_DELAY_MS < 10) {
        ns.tprint(`[WARN] DISPATCH_DELAY_MS (${CONFIG.BATCHER.DISPATCH_DELAY_MS}ms) très faible - risque de saturation port 4`);
    }
    
    if (CONFIG.BATCHER.DISPATCH_DELAY_MS > 100) {
        ns.tprint(`[WARN] DISPATCH_DELAY_MS (${CONFIG.BATCHER.DISPATCH_DELAY_MS}ms) élevé - throughput réduit`);
    }

    return true;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS SIGNATURE
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
/** @param {NS} ns */
export async function main(ns) {
    ns.tprint("\u001b[38;5;196m");
    ns.tprint("    ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗");
    ns.tprint("    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝");
    ns.tprint("    ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗");
    ns.tprint("    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║");
    ns.tprint("    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║");
    ns.tprint("    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝");
    ns.tprint("                              v45.4 - \"PATCHED - Anti-Saturation Port 4\"");
    ns.tprint("\u001b[0m");
    ns.tprint("");
    ns.tprint("\u001b[32m✅ Configuration PROMETHEUS v45.4 PATCHED chargée et validée.\u001b[0m");
    ns.tprint("\u001b[33m📋 Vérification de la cohérence...\u001b[0m");
    
    if (validateConfig(ns)) {
        ns.tprint("\u001b[32m✅ Configuration valide - Prêt pour le déploiement.\u001b[0m");
    } else {
        ns.tprint("\u001b[31m❌ Configuration invalide - Vérifier les warnings ci-dessus.\u001b[0m");
    }
    
    ns.tprint("");
    ns.tprint("\u001b[36m📊 Configuration système:\u001b[0m");
    ns.tprint(`  • DEBUG_MODE: ${CONFIG.SYSTEM.DEBUG_MODE ? '\u001b[32mACTIVÉ\u001b[0m' : '\u001b[31mDÉSACTIVÉ\u001b[0m'}`);
    ns.tprint(`  • 💾 RESERVED_HOME_RAM: ${CONFIG.HACKING.RESERVED_HOME_RAM}GB`);
    ns.tprint(`  • ⏱️  NETWORK_CACHE_TTL: ${CONFIG.SYSTEM.NETWORK_CACHE_TTL_MS / 1000}s`);
    ns.tprint(`  • 🎯 EV/s Candidates: ${CONFIG.HACKING.HACK_PERCENT_CANDIDATES.length} valeurs`);
    ns.tprint(`  • ✂️ MIN_THREADS_PER_SUBJOB: ${CONFIG.HACKING.MIN_THREADS_PER_SUBJOB}`);
    ns.tprint(`  • 📦 MAX_GROW_THREADS: ${CONFIG.HACKING.MAX_GROW_THREADS}`);
    ns.tprint(`  • 🔥 DISPATCH_DELAY_MS: ${CONFIG.BATCHER.DISPATCH_DELAY_MS}ms (NOUVEAU v45.4)`);
    ns.tprint(`  • 🔥 Version: ${CONFIG.VERSION.FULL}`);
}
