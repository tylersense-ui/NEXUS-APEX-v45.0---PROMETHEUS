/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      lib/logger
 * @description Système de logging centralisé avec support des couleurs ANSI,
 *              toasts optionnels, icônes stylés et niveaux de log configurables.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Toasts optionnels via CONFIG.SYSTEM.TOASTS_ENABLED
 * ✓ Logs DEBUG conditionnels (respecte DEBUG_MODE)
 * ✓ Méthode success() ajoutée pour événements critiques positifs
 * ✓ tprint() réservé uniquement aux erreurs critiques
 * ✓ Durées de toast configurables par niveau
 * ✓ Timestamp avec format 24h pour meilleure lisibilité
 * ✓ Méthode raw() pour logs sans formatage
 * ✓ TOUS LES ICÔNES REMIS (✅⚠️❌🔍💡📊)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   import { Logger } from "/lib/logger.js";
 *   const log = new Logger(ns, "BATCHER");
 *   log.info("Batch lancé sur n00dles");
 *   log.warn("RAM fragmentée détectée");
 *   log.error("Échec critique du dispatch");
 * 
 * @example
 *   // Logger avec module name
 *   const log = new Logger(ns, "ORCHESTRATOR");
 *   log.info("Kernel initialisé");  // → [12:34:56][ORCHESTRATOR][INFO] ℹ️ Kernel initialisé
 * 
 * @example
 *   // Debug logs (affichés seulement si DEBUG_MODE = true)
 *   if (log.debugEnabled) {
 *       log.debug(`EV/s calculé: ${evPerSec}`);  // → 🔍 EV/s calculé: 1234.56
 *   }
 * 
 * @example
 *   // Success (événements critiques positifs)
 *   log.success("Root obtenu sur joesguns !");  // → ✅ Root obtenu sur joesguns !
 */

import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📘 CLASSE LOGGER
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Classe principale de gestion des logs avec support multi-niveaux et icônes stylés.
 * 
 * Niveaux de log disponibles :
 * - SUCCESS : ✅ Événements positifs critiques (root, achats, milestones)
 * - INFO    : ℹ️  Informations générales (démarrage, progression normale)
 * - WARN    : ⚠️  Avertissements non bloquants (fragmentation RAM, retries)
 * - ERROR   : ❌ Erreurs critiques nécessitant attention (crash, échec fatal)
 * - DEBUG   : 🔍 Logs de développement (conditionnel, verbose)
 */
export class Logger {
    /**
     * Constructeur du Logger
     * 
     * @param {NS} ns - Namespace BitBurner
     * @param {string} moduleName - Nom du module (ex: "BATCHER", "CONTROLLER")
     * 
     * @example
     *   const log = new Logger(ns, "STOCK-MASTER");
     */
    constructor(ns, moduleName) {
        /** @type {NS} Référence au namespace BitBurner */
        this.ns = ns;
        
        /** @type {string} Nom du module en MAJUSCULES */
        this.module = moduleName.toUpperCase();
        
        /** @type {Object} Table des codes couleur ANSI */
        this.colors = CONFIG.COLORS;
        
        /** @type {boolean} Flag de debug (depuis CONFIG) */
        this.debugEnabled = CONFIG.SYSTEM.DEBUG_MODE;
        
        /** @type {boolean} Flag d'activation des toasts */
        this.toastsEnabled = CONFIG.SYSTEM.TOASTS_ENABLED;
        
        /** @type {number} Durée des toasts INFO/SUCCESS/WARN (ms) */
        this.toastDurationInfo = CONFIG.SYSTEM.TOAST_DURATION_INFO_MS || 3000;
        
        /** @type {number} Durée des toasts ERROR (ms) */
        this.toastDurationError = CONFIG.SYSTEM.TOAST_DURATION_ERROR_MS || 5000;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🎯 MÉTHODES PUBLIQUES DE LOGGING
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * ✅ Log de succès (événements positifs critiques)
     * Couleur: MAGENTA | Toast: OUI (si activé)
     * 
     * Usage: Root obtenu, achat réussi, milestone atteint
     * 
     * @param {string} msg - Message à logger
     * 
     * @example
     *   log.success("Root obtenu sur joesguns");
     *   log.success("1000 threads déployés avec succès");
     */
    success(msg) {
        this._print("SUCCESS", this.colors.SUCCESS, `✅ ${msg}`);
        if (this.toastsEnabled) {
            this.ns.toast(`[${this.module}] ${msg}`, "success", this.toastDurationInfo);
        }
    }

    /**
     * ℹ️ Log d'information (opérations normales)
     * Couleur: VERT | Toast: NON
     * 
     * Usage: Démarrage de module, progression normale, état
     * 
     * @param {string} msg - Message à logger
     * 
     * @example
     *   log.info("Kernel initialisé");
     *   log.info("Scan réseau terminé : 150 serveurs détectés");
     */
    info(msg) {
        this._print("INFO", this.colors.INFO, `ℹ️  ${msg}`);
    }

    /**
     * ⚠️ Log d'avertissement (non bloquant)
     * Couleur: JAUNE | Toast: NON
     * 
     * Usage: Fragmentation RAM, retry, configuration sub-optimale
     * 
     * @param {string} msg - Message à logger
     * 
     * @example
     *   log.warn("Fragmentation RAM détectée: 15% de waste");
     *   log.warn("Tentative 3/5 pour exec sur pserv-0");
     */
    warn(msg) {
        this._print("WARN", this.colors.WARN, `⚠️  ${msg}`);
    }

    /**
     * ❌ Log d'erreur (critique)
     * Couleur: ROUGE | Toast: OUI (si activé) | tprint: OUI
     * 
     * Usage: Crash, échec fatal, données corrompues
     * 
     * @param {string} msg - Message à logger
     * 
     * @example
     *   log.error("Port 4 bloqué - impossible d'écrire la commande");
     *   log.error("Fichier data/todo.json corrompu");
     */
    error(msg) {
        this._print("ERROR", this.colors.ERROR, `❌ ${msg}`);
        
        // Toast d'erreur (durée plus longue)
        if (this.toastsEnabled) {
            this.ns.toast(`[${this.module}] ERROR: ${msg}`, "error", this.toastDurationError);
        }
        
        // tprint pour visibilité maximale sur les erreurs critiques
        this.ns.tprint(`${this.colors.ERROR}[${this.module}][ERROR] ❌ ${msg}${this.colors.RESET}`);
    }

    /**
     * 🔍 Log de debug (conditionnel)
     * Couleur: CYAN | Toast: NON
     * Affiché uniquement si CONFIG.SYSTEM.DEBUG_MODE = true
     * 
     * Usage: Métriques détaillées, valeurs intermédiaires, diagnostics
     * 
     * @param {string} msg - Message à logger
     * 
     * @example
     *   log.debug(`hackPercent choisi: ${percent} (EV/s: ${evs})`);
     *   log.debug(`Threads planifiés: ${planned}, dispatchés: ${actual}`);
     */
    debug(msg) {
        if (this.debugEnabled) {
            this._print("DEBUG", this.colors.DEBUG, `🔍 ${msg}`);
        }
    }

    /**
     * 📘 Log brut sans formatage (couleur uniquement)
     * Utile pour les bannières ASCII ou logs personnalisés
     * 
     * @param {string} msg - Message à logger
     * @param {string} [color] - Code couleur ANSI optionnel
     * 
     * @example
     *   log.raw("═══════════════════════════════════", log.colors.INFO);
     *   log.raw("     NEXUS-APEX PROMETHEUS", log.colors.SUCCESS);
     */
    raw(msg, color = "") {
        const output = color ? `${color}${msg}${this.colors.RESET}` : msg;
        this.ns.print(output);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔒 MÉTHODES PRIVÉES (INTERNES)
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Méthode interne de formatage et d'affichage des logs
     * 
     * Format: [HH:MM:SS][MODULE][LEVEL] Message
     * 
     * @private
     * @param {string} level - Niveau de log (INFO, WARN, ERROR, DEBUG, SUCCESS)
     * @param {string} color - Code couleur ANSI
     * @param {string} msg - Message à afficher
     */
    _print(level, color, msg) {
        // Timestamp au format 24h (HH:MM:SS)
        const timestamp = new Date().toLocaleTimeString("fr-FR", { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Construction du message formaté
        const output = `${color}[${timestamp}][${this.module}][${level}] ${msg}${this.colors.RESET}`;
        
        // Affichage via ns.print (visible dans tail uniquement)
        this.ns.print(output);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔧 UTILITAIRES PUBLICS
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Active ou désactive les logs debug à la volée
     * Utile pour diagnostics temporaires sans redémarrer le script
     * 
     * @param {boolean} enabled - true pour activer, false pour désactiver
     * 
     * @example
     *   log.setDebugMode(true);  // Active debug
     *   // ... diagnostics ...
     *   log.setDebugMode(false); // Désactive debug
     */
    setDebugMode(enabled) {
        this.debugEnabled = enabled;
        this.info(`Mode DEBUG ${enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    }

    /**
     * Active ou désactive les toasts à la volée
     * Utile si les toasts spamment trop l'UI
     * 
     * @param {boolean} enabled - true pour activer, false pour désactiver
     * 
     * @example
     *   log.setToastsEnabled(false); // Désactive toasts
     */
    setToastsEnabled(enabled) {
        this.toastsEnabled = enabled;
        this.info(`Toasts ${enabled ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    }

    /**
     * 🎨 Affiche une bannière formatée (utile pour les démarrages)
     * 
     * @param {string} title - Titre de la bannière
     * @param {string[]} [lines] - Lignes additionnelles optionnelles
     * 
     * @example
     *   log.banner("NEXUS-APEX PROMETHEUS", [
     *       "Version 45.0",
     *       "Stealing Fire From The Gods"
     *   ]);
     */
    banner(title, lines = []) {
        const width = 80;
        const border = "═".repeat(width);
        
        this.raw(`╔${border}╗`, this.colors.SUCCESS);
        this.raw(`║ ${title.padEnd(width - 2)} ║`, this.colors.SUCCESS);
        
        for (const line of lines) {
            this.raw(`║ ${line.padEnd(width - 2)} ║`, this.colors.INFO);
        }
        
        this.raw(`╚${border}╝`, this.colors.SUCCESS);
    }

    /**
     * 📊 Affiche une barre de progression simple dans les logs
     * 
     * @param {number} current - Valeur actuelle
     * @param {number} total - Valeur maximale
     * @param {number} [barLength=40] - Longueur de la barre en caractères
     * 
     * @example
     *   log.progressBar(750, 1000); // [████████████████████░░░░░░░░░░░░░░░░░░░░] 75%
     */
    progressBar(current, total, barLength = 40) {
        const percentage = (current / total) * 100;
        const filledLength = Math.floor((current / total) * barLength);
        const emptyLength = barLength - filledLength;
        
        const bar = `[${"█".repeat(filledLength)}${"░".repeat(emptyLength)}] ${percentage.toFixed(1)}%`;
        this.info(bar);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS SIGNATURE
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
/** @param {NS} ns */
export async function main(ns) {
    // Démonstration des capacités du Logger
    const log = new Logger(ns, "DEMO-LOGGER");
    
    ns.tprint("\x1b[38;5;196m");
    ns.tprint("    ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗");
    ns.tprint("    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝");
    ns.tprint("    ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗");
    ns.tprint("    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║");
    ns.tprint("    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║");
    ns.tprint("    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝");
    ns.tprint("                              v45.0 - \"Stealing Fire From The Gods\"");
    ns.tprint("\x1b[0m");
    ns.tprint("");
    
    log.banner("LOGGER PROMETHEUS - DÉMONSTRATION", [
        "Tous les icônes sont de retour !",
        "Stealing Fire From The Gods"
    ]);
    
    ns.print(""); // Ligne vide
    
    log.info("Démonstration des niveaux de log...");
    await ns.sleep(500);
    
    log.success("Opération critique réussie ! 🎉");
    await ns.sleep(500);
    
    log.warn("Ceci est un avertissement non bloquant");
    await ns.sleep(500);
    
    log.error("Ceci est une erreur critique (avec toast et tprint)");
    await ns.sleep(500);
    
    log.debug("Ceci est un log de debug (visible si DEBUG_MODE = true)");
    await ns.sleep(500);
    
    ns.print(""); // Ligne vide
    log.info("Démonstration de la barre de progression...");
    for (let i = 0; i <= 100; i += 25) {
        log.progressBar(i, 100, 40);
        await ns.sleep(500);
    }
    
    ns.print(""); // Ligne vide
    log.raw("═".repeat(80), log.colors.INFO);
    log.raw("🔥 Démonstration terminée - Logger PROMETHEUS opérationnel", log.colors.SUCCESS);
    log.raw("═".repeat(80), log.colors.INFO);
}
