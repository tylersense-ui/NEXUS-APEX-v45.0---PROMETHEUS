/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      lib/capabilities
 * @description Système de détection automatique des APIs et capacités disponibles.
 *              Rend le code BitNode-agnostic en testant la disponibilité de chaque API.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Constructeur ultra-léger (tests coûteux différés)
 * ✓ Cache intelligent pour Singularity (évite tests répétés)
 * ✓ Try/catch robuste autour de tous les tests d'API
 * ✓ Documentation exhaustive de chaque capacité testée
 * ✓ Méthode update() optimisée (réutilise cache quand possible)
 * ✓ Support BitNode-agnostic complet
 * ✓ Logs icônés pour debugging (🔍✅❌)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   import { Capabilities } from "/lib/capabilities.js";
 *   const caps = new Capabilities(ns);
 *   
 *   if (caps.formulas) {
 *       // Utiliser ns.formulas pour calculs précis
 *   } else {
 *       // Fallback sur ns.hackAnalyze*, etc.
 *   }
 * 
 * @example
 *   // Détection des outils de crack
 *   const caps = new Capabilities(ns);
 *   const portsOuvrables = [caps.brutessh, caps.ftpcrack, caps.relaysmtp, 
 *                           caps.httpworm, caps.sqlinject].filter(Boolean).length;
 *   ns.tprint(`✅ ${portsOuvrables} ports peuvent être ouverts`);
 * 
 * @example
 *   // Utilisation conditionnelle de l'API Bourse
 *   if (caps.tix) {
 *       if (caps.has4S) {
 *           const forecast = ns.stock.getForecast("FSIG");
 *       } else {
 *           // Trading basique sans 4S Data
 *       }
 *   }
 * 
 * @example
 *   // Refresh périodique (ex: toutes les 60s)
 *   setInterval(() => caps.update(), 60000);
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📘 CLASSE CAPABILITIES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Détecte automatiquement quelles APIs et programmes sont disponibles.
 * 
 * Capacités testées :
 * - 🔓 Outils de crack (BruteSSH.exe, FTPCrack.exe, etc.)
 * - 💹 API Bourse (TIX + 4S Data)
 * - 📐 Formulas.exe (calculs précis)
 * - 🎭 Singularity API (automatisation avancée)
 * - 👥 Sleeve API (clones)
 * - 🏢 Corporation API
 * - 👊 Gang API
 * - ⚔️  Bladeburner API
 */
export class Capabilities {
    /**
     * Constructeur léger - Initialise les capacités de base uniquement
     * Les tests coûteux sont différés à update() pour éviter les lags au boot
     * 
     * @param {NS} ns - Namespace BitBurner
     * 
     * @example
     *   const caps = new Capabilities(ns);
     *   // Constructeur instantané, update() est appelé automatiquement
     */
    constructor(ns) {
        /** @type {NS} Référence au namespace BitBurner */
        this.ns = ns;
        
        /**
         * Cache pour la détection Singularity (null = non testé, true/false = résultat)
         * Évite de refaire le test coûteux à chaque update()
         * @private
         * @type {boolean|null}
         */
        this._singularityDetected = null;

        /**
         * Cache pour la détection Sleeve (null = non testé)
         * @private
         * @type {boolean|null}
         */
        this._sleeveDetected = null;

        /**
         * Cache pour la détection Corporation (null = non testé)
         * @private
         * @type {boolean|null}
         */
        this._corporationDetected = null;

        /**
         * Cache pour la détection Gang (null = non testé)
         * @private
         * @type {boolean|null}
         */
        this._gangDetected = null;

        /**
         * Cache pour la détection Bladeburner (null = non testé)
         * @private
         * @type {boolean|null}
         */
        this._bladeburnerDetected = null;
        
        // Initialisation immédiate des capacités (léger)
        this.update();
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔄 MÉTHODE UPDATE (Refresh des capacités)
     * ═══════════════════════════════════════════════════════════════════════════════
     * Met à jour toutes les capacités détectables.
     * Réutilise les caches quand possible pour éviter les tests répétés.
     * 
     * @public
     * @returns {void}
     * 
     * @example
     *   caps.update(); // Force la mise à jour de toutes les capacités
     */
    update() {
        const ns = this.ns;

        // ═══════════════════════════════════════════════════════════════════════════
        // 🔓 LOGICIELS DE CRACK (toujours légers à tester)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /** 
         * BruteSSH.exe - Ouvre le port SSH (22)
         * @type {boolean}
         */
        this.brutessh = ns.fileExists("BruteSSH.exe", "home");
        
        /** 
         * FTPCrack.exe - Ouvre le port FTP (21)
         * @type {boolean}
         */
        this.ftpcrack = ns.fileExists("FTPCrack.exe", "home");
        
        /** 
         * relaySMTP.exe - Ouvre le port SMTP (25)
         * @type {boolean}
         */
        this.relaysmtp = ns.fileExists("relaySMTP.exe", "home");
        
        /** 
         * HTTPWorm.exe - Ouvre le port HTTP (80)
         * @type {boolean}
         */
        this.httpworm = ns.fileExists("HTTPWorm.exe", "home");
        
        /** 
         * SQLInject.exe - Ouvre le port SQL (1433)
         * @type {boolean}
         */
        this.sqlinject = ns.fileExists("SQLInject.exe", "home");

        /**
         * Compteur de ports ouvrable (0 à 5)
         * Utile pour savoir combien de serveurs sont accessibles
         * @type {number}
         */
        this.portOpeners = [
            this.brutessh, 
            this.ftpcrack, 
            this.relaysmtp, 
            this.httpworm, 
            this.sqlinject
        ].filter(Boolean).length;

        // ═══════════════════════════════════════════════════════════════════════════
        // 💹 API BOURSE (TIX + 4S Data)
        // ═══════════════════════════════════════════════════════════════════════════
        
        this.tix = false;
        this.has4S = false;
        
        try {
            if (ns.stock) {
                /** 
                 * TIX API - Accès au marché boursier (achat/vente d'actions)
                 * Coût: $5b + $25b pour compte
                 * @type {boolean}
                 */
                this.tix = ns.stock.hasTIXAPIAccess();
                
                /** 
                 * 4S Data - Accès aux prévisions de marché (getForecast, etc.)
                 * Coût: $1b additionnel
                 * @type {boolean}
                 */
                this.has4S = ns.stock.has4SDataAPIAccess();
            }
        } catch (e) {
            // L'API stock n'existe pas dans certains BitNodes
            this.tix = false;
            this.has4S = false;
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 📐 FORMULAS.EXE (Calculs précis)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /** 
         * Formulas.exe - Donne accès à ns.formulas pour calculs précis
         * Permet de calculer exactement les threads, timing, chance sans approximations
         * Coût: $5b via Darkweb
         * @type {boolean}
         */
        this.formulas = ns.fileExists("Formulas.exe", "home");

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎭 SINGULARITY API (SF4)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /**
         * Singularity API - Automatisation complète du joueur
         * Disponible: SF4 (BitNode 4) ou après avoir terminé BN4
         * Permet: factions, augmentations, travail, crimes, voyages, etc.
         * @type {boolean}
         */
        if (this._singularityDetected === null) {
            // Premier test (coûteux, on le fait une seule fois)
            try {
                ns.singularity.getCurrentWork();
                this._singularityDetected = true;
            } catch (e) {
                this._singularityDetected = false;
            }
        }
        this.singularity = this._singularityDetected;

        // ═══════════════════════════════════════════════════════════════════════════
        // 👥 SLEEVE API (SF10)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /**
         * Sleeve API - Gestion des clones (duplicates)
         * Disponible: SF10 (BitNode 10) ou après avoir terminé BN10
         * Permet de contrôler jusqu'à 8 clones pour automatisation parallèle
         * @type {boolean}
         */
        if (this._sleeveDetected === null) {
            try {
                ns.sleeve.getNumSleeves();
                this._sleeveDetected = true;
            } catch (e) {
                this._sleeveDetected = false;
            }
        }
        this.sleeve = this._sleeveDetected;

        // ═══════════════════════════════════════════════════════════════════════════
        // 🏢 CORPORATION API (SF3)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /**
         * Corporation API - Création et gestion d'entreprise
         * Disponible: SF3 (BitNode 3) ou après avoir terminé BN3
         * @type {boolean}
         */
        if (this._corporationDetected === null) {
            try {
                ns.corporation.hasCorporation();
                this._corporationDetected = true;
            } catch (e) {
                this._corporationDetected = false;
            }
        }
        this.corporation = this._corporationDetected;

        // ═══════════════════════════════════════════════════════════════════════════
        // 👊 GANG API (SF2)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /**
         * Gang API - Création et gestion de gang criminel
         * Disponible: SF2 (BitNode 2) ou après avoir terminé BN2
         * Nécessite: -54,000 karma et rejoindre faction gang
         * @type {boolean}
         */
        if (this._gangDetected === null) {
            try {
                ns.gang.inGang();
                this._gangDetected = true;
            } catch (e) {
                this._gangDetected = false;
            }
        }
        this.gang = this._gangDetected;

        // ═══════════════════════════════════════════════════════════════════════════
        // ⚔️ BLADEBURNER API (SF6/SF7)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /**
         * Bladeburner API - Division secrète anti-synthoid
         * Disponible: SF6 (BitNode 6), SF7 (BitNode 7) ou après BN6/BN7
         * @type {boolean}
         */
        if (this._bladeburnerDetected === null) {
            try {
                ns.bladeburner.joinBladeburnerDivision();
                this._bladeburnerDetected = true;
            } catch (e) {
                this._bladeburnerDetected = false;
            }
        }
        this.bladeburner = this._bladeburnerDetected;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔍 MÉTHODES UTILITAIRES
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Force la réinitialisation de tous les caches
     * Utile si on change de BitNode ou après avoir acheté un programme
     * 
     * @public
     * @returns {void}
     * 
     * @example
     *   // Après avoir acheté Formulas.exe
     *   ns.singularity.purchaseProgram("Formulas.exe");
     *   caps.resetCache();
     *   caps.update();
     *   if (caps.formulas) { ... }
     */
    resetCache() {
        this._singularityDetected = null;
        this._sleeveDetected = null;
        this._corporationDetected = null;
        this._gangDetected = null;
        this._bladeburnerDetected = null;
        this.update();
    }

    /**
     * Retourne un résumé des capacités disponibles (pour debugging)
     * 
     * @public
     * @returns {Object} Objet contenant toutes les capacités
     * 
     * @example
     *   const summary = caps.getSummary();
     *   ns.tprint(JSON.stringify(summary, null, 2));
     */
    getSummary() {
        return {
            // Outils de crack
            crack: {
                brutessh: this.brutessh,
                ftpcrack: this.ftpcrack,
                relaysmtp: this.relaysmtp,
                httpworm: this.httpworm,
                sqlinject: this.sqlinject,
                total: this.portOpeners
            },
            // APIs spécialisées
            apis: {
                formulas: this.formulas,
                tix: this.tix,
                has4S: this.has4S,
                singularity: this.singularity,
                sleeve: this.sleeve,
                corporation: this.corporation,
                gang: this.gang,
                bladeburner: this.bladeburner
            }
        };
    }

    /**
     * Affiche un rapport détaillé des capacités dans les logs
     * 
     * @public
     * @param {boolean} [useTPrint=false] - Si true, utilise tprint au lieu de print
     * @returns {void}
     * 
     * @example
     *   caps.printReport();           // Dans tail uniquement
     *   caps.printReport(true);       // Dans terminal
     */
    printReport(useTPrint = false) {
        const print = useTPrint ? this.ns.tprint.bind(this.ns) : this.ns.print.bind(this.ns);
        
        print("═══════════════════════════════════════════════════════════");
        print("🔍 RAPPORT DE CAPACITÉS - NEXUS-APEX PROMETHEUS");
        print("═══════════════════════════════════════════════════════════");
        print("");
        print("🔓 OUTILS DE CRACK:");
        print(`   ${this.brutessh ? '✅' : '❌'} BruteSSH.exe`);
        print(`   ${this.ftpcrack ? '✅' : '❌'} FTPCrack.exe`);
        print(`   ${this.relaysmtp ? '✅' : '❌'} relaySMTP.exe`);
        print(`   ${this.httpworm ? '✅' : '❌'} HTTPWorm.exe`);
        print(`   ${this.sqlinject ? '✅' : '❌'} SQLInject.exe`);
        print(`   → Total: ${this.portOpeners}/5 ports ouvrable`);
        print("");
        print("📐 CALCULS:");
        print(`   ${this.formulas ? '✅' : '❌'} Formulas.exe`);
        print("");
        print("💹 BOURSE:");
        print(`   ${this.tix ? '✅' : '❌'} TIX API`);
        print(`   ${this.has4S ? '✅' : '❌'} 4S Data (Forecasts)`);
        print("");
        print("🎭 APIS AVANCÉES:");
        print(`   ${this.singularity ? '✅' : '❌'} Singularity (SF4)`);
        print(`   ${this.sleeve ? '✅' : '❌'} Sleeve (SF10)`);
        print(`   ${this.corporation ? '✅' : '❌'} Corporation (SF3)`);
        print(`   ${this.gang ? '✅' : '❌'} Gang (SF2)`);
        print(`   ${this.bladeburner ? '✅' : '❌'} Bladeburner (SF6/SF7)`);
        print("═══════════════════════════════════════════════════════════");
    }
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
    ns.tprint("                              v45.0 - \"Stealing Fire From The Gods\"");
    ns.tprint("\x1b[0m");
    ns.tprint("");
    
    // Démonstration complète des capacités
    const caps = new Capabilities(ns);
    
    ns.tprint("✅ Détection automatique des capacités BitNode-agnostic...");
    ns.tprint("");
    
    caps.printReport(true);
    
    ns.tprint("");
    ns.tprint("📊 JSON Summary:");
    ns.tprint(JSON.stringify(caps.getSummary(), null, 2));
}
