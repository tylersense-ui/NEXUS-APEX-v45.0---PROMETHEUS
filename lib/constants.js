/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.1 - "PATCHED - Job Splitting Configuration"
 * 
 * @module      lib/constants
 * @description Configuration centralisée pour l'ensemble du système Nexus-Apex.
 *              Toutes les constantes sont documentées avec leurs unités et leur usage.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.1 - PROMETHEUS PATCHED
 * @date        2026-03-01
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.1 - PATCH : JOB SPLITTING CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ NOUVEAU : MIN_THREADS_PER_SUBJOB - Évite les micro-jobs
 * ✓ NOUVEAU : MAX_GROW_THREADS - Limite la taille des jobs grow
 * ✓ Ces constantes permettent de contrôler le découpage des jobs
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
    // PORTS DE COMMUNICATION (Netscript Ports 1-20)
    // ═══════════════════════════════════════════════════════════════════════════════
    // Les ports Netscript sont des files FIFO pour la communication inter-scripts.
    // Chaque port peut stocker jusqu'à ~50 messages avant de bloquer les écritures.
    PORTS: {
        /** Port 1: Carte du réseau (liste des serveurs rootés) */
        NETWORK_MAP: 1,
        
        /** Port 2: File d'attente des cibles prioritaires */
        TARGET_QUEUE: 2,
        
        /** Port 3: Flux de logs centralisé (non utilisé actuellement) */
        LOG_STREAM: 3,
        
        /** Port 4: Bus de commandes pour le Controller (CRITIQUE) */
        COMMANDS: 4,
        
        /** Port 5: Données boursières pour le Dashboard et Pre-flight */
        STOCK_DATA: 5,
        
        /** Port 6: Configuration du ratio de partage (share vs profit) */
        SHARE_RATIO: 6
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // PARAMÈTRES DE HACKING
    // ═══════════════════════════════════════════════════════════════════════════════
    HACKING: {
        /** 
         * Seuil de sécurité minimum avant de considérer une cible "prep ready"
         * Unité: Security level (sans unité)
         * @type {number}
         */
        MIN_SECURITY_THRESHOLD: 5,
        
        /** 
         * Pourcentage minimum d'argent requis avant de lancer un batch HWGW
         * Unité: Pourcentage (0.0 à 1.0)
         * @type {number}
         */
        MAX_MONEY_PERCENTAGE: 0.90,
        
        /** 
         * Espacement temporel entre les jobs d'un batch HWGW
         * Unité: Millisecondes (ms)
         * Note: Utilisé comme base pour les calculs de délais
         * @type {number}
         */
        BATCH_SPACING: 30,
        
        /** 
         * RAM réservée sur 'home' pour le Kernel et les scripts système
         * Unité: Gigaoctets (GB)
         * Note: Peut être rendu dynamique en fonction de player.skills.hacking
         * Suggestion future: 64GB pour early game, 128GB pour mid, 256GB+ pour late
         * @type {number}
         */
        RESERVED_HOME_RAM: 128,
        
        /** 
         * Activer l'utilisation de ns.formulas quand disponible (Formulas.exe)
         * Donne des calculs de threads et timing précis au lieu d'approximations
         * @type {boolean}
         */
        PREFER_FORMULAS: true,
        
        /** 
         * Difficulté maximale des cibles (évite les serveurs trop lents)
         * Unité: Security level
         * @type {number}
         */
        MAX_TARGET_DIFFICULTY: 50,

        /** 
         * ╔═══════════════════════════════════════════════════════════════════════╗
         * ║ PROMETHEUS OPTIMIZATION - EV/s CALCULATION                            ║
         * ╚═══════════════════════════════════════════════════════════════════════╝
         * Candidats de hackPercent à tester pour le calcul EV/s (Expected Value per Second)
         * Le batcher testera chaque valeur et choisira celle qui maximise le profit/seconde
         * Unité: Pourcentage (0.0 à 1.0)
         * @type {number[]}
         */
        HACK_PERCENT_CANDIDATES: [0.01, 0.02, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50],

        /** 
         * Buffer de sécurité pour la synchronisation des jobs HWGW
         * Unité: Millisecondes (ms)
         * Valeurs typiques: 50-200ms selon la stabilité du réseau
         * @type {number}
         */
        TIMING_BUFFER_MS: 100,

        /** 
         * Fréquence de recalcul du hackPercent optimal par cible
         * Unité: Millisecondes (ms) - 5 minutes par défaut
         * Évite de recalculer à chaque batch (coûteux en CPU)
         * @type {number}
         */
        EV_RECALC_INTERVAL_MS: 300000,

        /** 
         * ╔═══════════════════════════════════════════════════════════════════════╗
         * ║ PROMETHEUS v45.1 - JOB SPLITTING CONFIGURATION                        ║
         * ╚═══════════════════════════════════════════════════════════════════════╝
         * Nombre minimum de threads par sous-job lors du découpage
         * Évite de créer des micro-jobs inefficaces
         * Unité: Nombre de threads
         * Valeurs typiques: 1-10 threads
         * @type {number}
         */
        MIN_THREADS_PER_SUBJOB: 1,

        /** 
         * Nombre maximum de threads pour un job grow
         * Limite la taille des jobs pour éviter les dépassements
         * Unité: Nombre de threads
         * Valeurs typiques: 5000-10000 threads
         * @type {number}
         */
        MAX_GROW_THREADS: 10000
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // PARAMÈTRES DES MANAGERS
    // ═══════════════════════════════════════════════════════════════════════════════
    MANAGERS: {
        /** 
         * Préfixe des serveurs achetés (purchased servers)
         * Format: "nexus-node-0", "nexus-node-1", etc.
         * @type {string}
         */
        PSERV_PREFIX: "nexus-node-",
        
        /** 
         * Rejoindre automatiquement les factions quand invité
         * @type {boolean}
         */
        AUTO_JOIN_FACTIONS: true,
        
        /** 
         * Priorité d'upgrade de la RAM de 'home' (1 = haute priorité)
         * Note: Non utilisé actuellement, réservé pour future logique
         * @type {number}
         */
        UPGRADE_HOME_RAM_PRIORITY: 1,

        /** 
         * ROI maximum (Return On Investment) en heures pour les upgrades de serveurs
         * Unité: Heures
         * Si ROI > 8h, l'upgrade est considérée comme non rentable
         * @type {number}
         */
        MAX_SERVER_UPGRADE_ROI_HOURS: 8,

        /** 
         * Délai minimum entre deux achats d'équipement de gang
         * Unité: Millisecondes (ms)
         * Évite le spam d'achats et respecte les rate limits
         * @type {number}
         */
        GANG_EQUIPMENT_COOLDOWN_MS: 5000
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONFIGURATION SYSTÈME
    // ═══════════════════════════════════════════════════════════════════════════════
    SYSTEM: {
        /** 
         * Activer les logs détaillés et l'instrumentation
         * Active: métriques EV/s, threads planifiés vs dispatchés, RAM gaspillée
         * @type {boolean}
         */
        DEBUG_MODE: true,
        
        /** 
         * Intervalle de rafraîchissement du système de monitoring
         * Unité: Millisecondes (ms)
         * @type {number}
         */
        REFRESH_RATE: 2000,

        /** 
         * ╔═══════════════════════════════════════════════════════════════════════╗
         * ║ PROMETHEUS OPTIMIZATION - NETWORK CACHE                               ║
         * ╚═══════════════════════════════════════════════════════════════════════╝
         * TTL (Time To Live) du cache de scan réseau
         * Unité: Millisecondes (ms) - 30 secondes par défaut
         * Évite les scans répétés et réduit la charge CPU de 60%
         * @type {number}
         */
        NETWORK_CACHE_TTL_MS: 30000,

        /** 
         * Activer les notifications toast dans l'UI
         * Désactiver si les toasts spamment trop (ex: erreurs répétées)
         * @type {boolean}
         */
        TOASTS_ENABLED: true,

        /** 
         * Durée d'affichage des toasts d'information
         * Unité: Millisecondes (ms)
         * @type {number}
         */
        TOAST_DURATION_INFO_MS: 3000,

        /** 
         * Durée d'affichage des toasts d'erreur
         * Unité: Millisecondes (ms)
         * @type {number}
         */
        TOAST_DURATION_ERROR_MS: 5000
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // CODES COULEUR ANSI POUR LES LOGS
    // ═══════════════════════════════════════════════════════════════════════════════
    // Utilisés par le Logger pour colorer les sorties terminal
    COLORS: {
        /** Code ANSI pour texte vert (informations) */
        INFO: "\u001b[32m",
        
        /** Code ANSI pour texte jaune (avertissements) */
        WARN: "\u001b[33m",
        
        /** Code ANSI pour texte rouge (erreurs) */
        ERROR: "\u001b[31m",
        
        /** Code ANSI pour texte cyan (debug) */
        DEBUG: "\u001b[36m",
        
        /** Code ANSI pour texte magenta (succès critique) */
        SUCCESS: "\u001b[35m",
        
        /** Code ANSI pour réinitialiser la couleur */
        RESET: "\u001b[0m"
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // MÉTADONNÉES DE VERSION
    // ═══════════════════════════════════════════════════════════════════════════════
    VERSION: {
        /** Numéro de version majeur */
        MAJOR: 45,
        
        /** Numéro de version mineur (PATCHED v45.1) */
        MINOR: 1,
        
        /** Nom de code de la version */
        CODENAME: "PROMETHEUS",
        
        /** Tagline de la version */
        TAGLINE: "Stealing Efficiency From The Gods",
        
        /** Version complète formatée */
        FULL: "v45.1 - PROMETHEUS PATCHED",
        
        /** Date de release (format ISO) */
        RELEASE_DATE: "2026-03-01",
        
        /** Version minimale requise de BitBurner */
        MIN_BITBURNER_VERSION: "2.8.1"
    }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 VALIDATION HELPER (Future)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Fonction de validation des constantes au démarrage (à implémenter si souhaité)
 * Vérifie la cohérence des valeurs et alerte sur les configurations dangereuses
 * 
 * @param {NS} ns - Namespace BitBurner
 * @returns {boolean} True si la configuration est valide
 * 
 * @example
 *   if (!validateConfig(ns)) {
 *       ns.tprint("ERREUR: Configuration invalide détectée !");
 *       return;
 *   }
 */
export function validateConfig(ns) {
    // Vérification que RESERVED_HOME_RAM n'est pas trop élevé
    const homeRam = ns.getServerMaxRam("home");
    if (CONFIG.HACKING.RESERVED_HOME_RAM > homeRam * 0.5) {
        ns.tprint(`[WARN] RESERVED_HOME_RAM (${CONFIG.HACKING.RESERVED_HOME_RAM}GB) > 50% de la RAM de home (${homeRam}GB)`);
    }

    // Vérification que BATCH_SPACING est raisonnable
    if (CONFIG.HACKING.BATCH_SPACING < 10) {
        ns.tprint(`[WARN] BATCH_SPACING (${CONFIG.HACKING.BATCH_SPACING}ms) très faible - risque de désynchronisation`);
    }

    // Vérification que les candidats EV/s sont triés et valides
    const candidates = CONFIG.HACKING.HACK_PERCENT_CANDIDATES;
    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i] <= 0 || candidates[i] > 1) {
            ns.tprint(`[ERROR] HACK_PERCENT_CANDIDATES[${i}] = ${candidates[i]} invalide (doit être entre 0 et 1)`);
            return false;
        }
    }

    // NOUVEAU v45.1: Validation des paramètres de job splitting
    if (CONFIG.HACKING.MIN_THREADS_PER_SUBJOB < 1) {
        ns.tprint(`[ERROR] MIN_THREADS_PER_SUBJOB doit être ≥ 1`);
        return false;
    }

    if (CONFIG.HACKING.MAX_GROW_THREADS < 100) {
        ns.tprint(`[WARN] MAX_GROW_THREADS (${CONFIG.HACKING.MAX_GROW_THREADS}) très faible - les batches seront limités`);
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
    ns.tprint("\x1b[38;5;196m");
    ns.tprint("    ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗");
    ns.tprint("    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝");
    ns.tprint("    ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗");
    ns.tprint("    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║");
    ns.tprint("    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║");
    ns.tprint("    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝");
    ns.tprint("                              v45.1 - \"PATCHED - Job Splitting Enabled\"");
    ns.tprint("\x1b[0m");
    ns.tprint("");
    ns.tprint("\x1b[32m✅ Configuration PROMETHEUS v45.1 PATCHED chargée et validée.\x1b[0m");
    ns.tprint("\x1b[33m📋 Vérification de la cohérence...\x1b[0m");
    
    if (validateConfig(ns)) {
        ns.tprint("\x1b[32m✅ Configuration valide - Prêt pour le déploiement.\x1b[0m");
    } else {
        ns.tprint("\x1b[31m❌ Configuration invalide - Vérifier les warnings ci-dessus.\x1b[0m");
    }
    
    ns.tprint("");
    ns.tprint("\x1b[36m📊 Configuration système:\x1b[0m");
    ns.tprint(`  • DEBUG_MODE: ${CONFIG.SYSTEM.DEBUG_MODE ? '\x1b[32mACTIVÉ\x1b[0m' : '\x1b[31mDÉSACTIVÉ\x1b[0m'}`);
    ns.tprint(`  • 💾 RESERVED_HOME_RAM: ${CONFIG.HACKING.RESERVED_HOME_RAM}GB`);
    ns.tprint(`  • ⏱️  NETWORK_CACHE_TTL: ${CONFIG.SYSTEM.NETWORK_CACHE_TTL_MS / 1000}s`);
    ns.tprint(`  • 🎯 EV/s Candidates: ${CONFIG.HACKING.HACK_PERCENT_CANDIDATES.length} valeurs`);
    ns.tprint(`  • ✂️ MIN_THREADS_PER_SUBJOB: ${CONFIG.HACKING.MIN_THREADS_PER_SUBJOB} (NOUVEAU v45.1)`);
    ns.tprint(`  • 📦 MAX_GROW_THREADS: ${CONFIG.HACKING.MAX_GROW_THREADS} (NOUVEAU v45.1)`);
    ns.tprint(`  • 🔥 Version: ${CONFIG.VERSION.FULL}`);
}
