/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      core/port-handler
 * @description Bus de communication inter-scripts sécurisé avec normalisation des retours,
 *              retry automatique et validation des schémas JSON.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Normalisation des retours : null pour absence de données (plus de -1/"NULL PORT DATA")
 * ✓ writeJSONWithRetry : retry automatique avec backoff exponentiel
 * ✓ tryReadJSON : lecture non-bloquante pour polling
 * ✓ Validation des schémas JSON (COMMANDS, STOCK_DATA)
 * ✓ Logging robuste des erreurs de parsing JSON
 * ✓ Try/catch autour de toutes les opérations
 * ✓ Documentation exhaustive des formats de messages
 * ✓ Icônes dans les logs (📨📥📤❌✅)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   import { PortHandler } from "/core/port-handler.js";
 *   const ph = new PortHandler(ns);
 *   
 *   // Écrire un objet
 *   ph.writeJSON(4, { type: 'hack', target: 'n00dles', threads: 10 });
 *   
 *   // Lire un objet
 *   const job = ph.readJSON(4);
 *   if (job) {
 *       ns.tprint(`Job reçu: ${job.type} sur ${job.target}`);
 *   }
 * 
 * @example
 *   // Écriture avec retry automatique
 *   const success = await ph.writeJSONWithRetry(4, { type: 'grow', target: 'joesguns' }, 5, 100);
 *   if (!success) {
 *       ns.tprint("❌ Port 4 bloqué après 5 tentatives");
 *   }
 * 
 * @example
 *   // Lecture non-bloquante (peek)
 *   const data = ph.tryReadJSON(5);
 *   if (data) {
 *       ns.tprint(`📊 Données boursières: ${data.value}`);
 *   } else {
 *       ns.tprint("Port 5 vide");
 *   }
 * 
 * @example
 *   // Validation de schéma
 *   const job = { type: 'hack', target: 'n00dles', threads: 10 };
 *   if (ph.validateCommandSchema(job)) {
 *       ph.writeJSON(4, job);
 *   }
 */

import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📘 CLASSE PORTHANDLER
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Encapsulation des opérations sur les ports Netscript avec sécurité et normalisation.
 * 
 * Les ports Netscript (1-20) sont des files FIFO pour la communication inter-scripts.
 * Chaque port peut stocker ~50 messages avant de bloquer les écritures.
 * 
 * Schémas JSON supportés :
 * - COMMANDS (Port 4) : { type, host, target?, threads?, delay? }
 * - STOCK_DATA (Port 5) : { value, active }
 * - SHARE_RATIO (Port 6) : { shareRatio }
 */
export class PortHandler {
    /**
     * Constructeur du PortHandler
     * 
     * @param {NS} ns - Namespace BitBurner
     * 
     * @example
     *   const ph = new PortHandler(ns);
     */
    constructor(ns) {
        /** @type {NS} Référence au namespace BitBurner */
        this.ns = ns;
        
        /**
         * Flag pour activer les logs de debug
         * Désactivé par défaut pour éviter le spam
         * @type {boolean}
         */
        this.debugMode = CONFIG.SYSTEM.DEBUG_MODE || false;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📨 OPÉRATIONS DE BASE (Normalisées)
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * 👀 Peek (lecture sans consommer)
     * Regarde le prochain message sans le retirer du port.
     * 
     * PROMETHEUS: Normalise "NULL PORT DATA" en null
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @returns {string|null} Contenu du port ou null si vide
     * 
     * @example
     *   const nextMsg = ph.peek(4);
     *   if (nextMsg) {
     *       ns.tprint("Message en attente");
     *   }
     */
    peek(portId) {
        try {
            const data = this.ns.peek(portId);
            // Normalisation: "NULL PORT DATA" → null
            return (data === "NULL PORT DATA") ? null : data;
        } catch (e) {
            if (this.debugMode) {
                this.ns.print(`❌ Erreur peek sur port ${portId}: ${e.message}`);
            }
            return null;
        }
    }

    /**
     * 📥 Read (lecture avec consommation)
     * Lit et retire le prochain message du port.
     * 
     * PROMETHEUS: Normalise -1 et "NULL PORT DATA" en null
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @returns {string|null} Contenu du port ou null si vide
     * 
     * @example
     *   const msg = ph.read(4);
     *   if (msg) {
     *       // Traiter le message
     *   }
     */
    read(portId) {
        try {
            const data = this.ns.readPort(portId);
            // Normalisation: -1 et "NULL PORT DATA" → null
            if (data === -1 || data === "NULL PORT DATA") {
                return null;
            }
            return data;
        } catch (e) {
            if (this.debugMode) {
                this.ns.print(`❌ Erreur read sur port ${portId}: ${e.message}`);
            }
            return null;
        }
    }

    /**
     * 📤 Write (écriture basique)
     * Écrit un message sur le port.
     * Utilise tryWritePort pour éviter les blocages si le port est plein.
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @param {any} data - Données à écrire
     * @returns {boolean} True si succès, false si port plein
     * 
     * @example
     *   const success = ph.write(4, "Hello");
     *   if (!success) {
     *       ns.tprint("❌ Port 4 plein");
     *   }
     */
    write(portId, data) {
        try {
            return this.ns.tryWritePort(portId, data);
        } catch (e) {
            if (this.debugMode) {
                this.ns.print(`❌ Erreur write sur port ${portId}: ${e.message}`);
            }
            return false;
        }
    }

    /**
     * 🗑️ Clear (vider le port)
     * Retire tous les messages du port.
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @returns {void}
     * 
     * @example
     *   ph.clear(4); // Vide complètement le port 4
     */
    clear(portId) {
        try {
            this.ns.clearPort(portId);
        } catch (e) {
            if (this.debugMode) {
                this.ns.print(`❌ Erreur clear sur port ${portId}: ${e.message}`);
            }
        }
    }

    /**
     * ❓ IsEmpty (vérifier si vide)
     * Vérifie si le port est vide.
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @returns {boolean} True si vide, false sinon
     * 
     * @example
     *   if (ph.isEmpty(4)) {
     *       ns.tprint("Port 4 vide");
     *   }
     */
    isEmpty(portId) {
        return this.peek(portId) === null;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📦 OPÉRATIONS JSON (Sécurisées)
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * 📤 WriteJSON (écriture d'objet)
     * Sérialise un objet en JSON et l'écrit sur le port.
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @param {Object} obj - Objet à écrire
     * @returns {boolean} True si succès, false si échec
     * 
     * @example
     *   const success = ph.writeJSON(4, { type: 'hack', target: 'n00dles', threads: 10 });
     *   if (!success) {
     *       ns.tprint("❌ Échec d'écriture sur port 4");
     *   }
     */
    writeJSON(portId, obj) {
        try {
            const jsonStr = JSON.stringify(obj);
            const success = this.write(portId, jsonStr);
            
            if (this.debugMode && success) {
                this.ns.print(`✅ WriteJSON sur port ${portId}: ${jsonStr.substring(0, 50)}...`);
            }
            
            return success;
        } catch (e) {
            this.ns.print(`❌ Erreur writeJSON sur port ${portId}: ${e.message}`);
            return false;
        }
    }

    /**
     * 📥 ReadJSON (lecture d'objet avec consommation)
     * Lit et parse un objet JSON du port.
     * 
     * PROMETHEUS: Log les erreurs de parsing et retourne null proprement
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @returns {Object|null} Objet parsé ou null si erreur/vide
     * 
     * @example
     *   const job = ph.readJSON(4);
     *   if (job) {
     *       ns.tprint(`Type: ${job.type}, Target: ${job.target}`);
     *   }
     */
    readJSON(portId) {
        const data = this.read(portId);
        
        if (data === null) {
            return null;
        }

        try {
            const parsed = JSON.parse(data);
            
            if (this.debugMode) {
                this.ns.print(`✅ ReadJSON sur port ${portId}: ${data.substring(0, 50)}...`);
            }
            
            return parsed;
        } catch (e) {
            // Log l'erreur de parsing (données corrompues)
            this.ns.print(`❌ JSON invalide sur port ${portId}: ${data.substring(0, 100)}`);
            this.ns.print(`   Erreur: ${e.message}`);
            return null;
        }
    }

    /**
     * 👀 TryReadJSON (lecture non-bloquante sans consommer)
     * Peek et parse un objet JSON sans le retirer du port.
     * Utile pour vérifier le contenu sans consommer.
     * 
     * PROMETHEUS: Nouvelle méthode pour polling non-bloquant
     * 
     * @public
     * @param {number} portId - Numéro du port (1-20)
     * @returns {Object|null} Objet parsé ou null si erreur/vide
     * 
     * @example
     *   const stockData = ph.tryReadJSON(5);
     *   if (stockData) {
     *       ns.tprint(`Valeur bourse: ${stockData.value}`);
     *   }
     */
    tryReadJSON(portId) {
        const data = this.peek(portId);
        
        if (data === null) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (e) {
            if (this.debugMode) {
                this.ns.print(`❌ JSON invalide (peek) sur port ${portId}: ${e.message}`);
            }
            return null;
        }
    }

    /**
     * 🔄 WriteJSONWithRetry (écriture avec retry)
     * Tente d'écrire un objet JSON avec retry automatique et backoff exponentiel.
     * 
     * PROMETHEUS: Nouvelle méthode pour fiabilité maximale
     * 
     * @public
     * @async
     * @param {number} portId - Numéro du port (1-20)
     * @param {Object} obj - Objet à écrire
     * @param {number} [maxRetries=5] - Nombre maximum de tentatives
     * @param {number} [baseDelay=50] - Délai de base en ms (doublé à chaque échec)
     * @returns {Promise<boolean>} True si succès, false après épuisement des retries
     * 
     * @example
     *   const success = await ph.writeJSONWithRetry(4, { type: 'grow' }, 5, 100);
     *   if (!success) {
     *       ns.tprint("❌ Port 4 définitivement bloqué");
     *   }
     */
    async writeJSONWithRetry(portId, obj, maxRetries = 5, baseDelay = 50) {
        let delay = baseDelay;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const success = this.writeJSON(portId, obj);
            
            if (success) {
                if (this.debugMode && attempt > 0) {
                    this.ns.print(`✅ WriteJSON réussi sur port ${portId} (tentative ${attempt + 1}/${maxRetries})`);
                }
                return true;
            }
            
            // Attendre avant de retry (backoff exponentiel)
            if (attempt < maxRetries - 1) {
                await this.ns.sleep(delay);
                delay *= 2; // Double le délai à chaque échec
            }
        }
        
        // Échec après toutes les tentatives
        this.ns.print(`❌ WriteJSON échoué sur port ${portId} après ${maxRetries} tentatives`);
        return false;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * ✅ VALIDATION DE SCHÉMAS
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Valide un objet de commande (Port 4)
     * 
     * Schéma COMMANDS:
     * {
     *   type: string (requis) - "hack", "grow", "weaken", "share"
     *   host: string (requis) - Serveur d'exécution
     *   target?: string (optionnel) - Serveur cible (pour hack/grow/weaken)
     *   threads?: number (optionnel) - Nombre de threads
     *   delay?: number (optionnel) - Délai en ms
     * }
     * 
     * @public
     * @param {Object} obj - Objet à valider
     * @returns {boolean} True si valide, false sinon
     * 
     * @example
     *   const job = { type: 'hack', host: 'home', target: 'n00dles', threads: 10 };
     *   if (ph.validateCommandSchema(job)) {
     *       ph.writeJSON(4, job);
     *   }
     */
    validateCommandSchema(obj) {
        if (!obj || typeof obj !== 'object') {
            if (this.debugMode) {
                this.ns.print("❌ Schéma COMMANDS invalide: pas un objet");
            }
            return false;
        }

        // Champs requis
        if (!obj.type || typeof obj.type !== 'string') {
            if (this.debugMode) {
                this.ns.print("❌ Schéma COMMANDS invalide: 'type' manquant ou invalide");
            }
            return false;
        }

        if (!obj.host || typeof obj.host !== 'string') {
            if (this.debugMode) {
                this.ns.print("❌ Schéma COMMANDS invalide: 'host' manquant ou invalide");
            }
            return false;
        }

        // Types valides
        const validTypes = ['hack', 'grow', 'weaken', 'share'];
        if (!validTypes.includes(obj.type)) {
            if (this.debugMode) {
                this.ns.print(`❌ Schéma COMMANDS invalide: type '${obj.type}' non reconnu`);
            }
            return false;
        }

        // Validation des champs optionnels
        if (obj.threads !== undefined && (typeof obj.threads !== 'number' || obj.threads <= 0)) {
            if (this.debugMode) {
                this.ns.print("❌ Schéma COMMANDS invalide: 'threads' doit être un nombre > 0");
            }
            return false;
        }

        if (obj.delay !== undefined && (typeof obj.delay !== 'number' || obj.delay < 0)) {
            if (this.debugMode) {
                this.ns.print("❌ Schéma COMMANDS invalide: 'delay' doit être un nombre >= 0");
            }
            return false;
        }

        return true;
    }

    /**
     * Valide un objet de données boursières (Port 5)
     * 
     * Schéma STOCK_DATA:
     * {
     *   value: number (requis) - Valeur du portefeuille
     *   active: number (requis) - Nombre de positions actives
     * }
     * 
     * @public
     * @param {Object} obj - Objet à valider
     * @returns {boolean} True si valide, false sinon
     * 
     * @example
     *   const stockData = { value: 1000000, active: 5 };
     *   if (ph.validateStockDataSchema(stockData)) {
     *       ph.writeJSON(5, stockData);
     *   }
     */
    validateStockDataSchema(obj) {
        if (!obj || typeof obj !== 'object') {
            if (this.debugMode) {
                this.ns.print("❌ Schéma STOCK_DATA invalide: pas un objet");
            }
            return false;
        }

        if (typeof obj.value !== 'number' || obj.value < 0) {
            if (this.debugMode) {
                this.ns.print("❌ Schéma STOCK_DATA invalide: 'value' manquant ou invalide");
            }
            return false;
        }

        if (typeof obj.active !== 'number' || obj.active < 0) {
            if (this.debugMode) {
                this.ns.print("❌ Schéma STOCK_DATA invalide: 'active' manquant ou invalide");
            }
            return false;
        }

        return true;
    }

    /**
     * Valide un objet de ratio de partage (Port 6)
     * 
     * Schéma SHARE_RATIO:
     * {
     *   shareRatio: number (requis) - Ratio entre 0.0 et 1.0
     * }
     * 
     * @public
     * @param {Object} obj - Objet à valider
     * @returns {boolean} True si valide, false sinon
     * 
     * @example
     *   const shareConfig = { shareRatio: 0.5 };
     *   if (ph.validateShareRatioSchema(shareConfig)) {
     *       ph.writeJSON(6, shareConfig);
     *   }
     */
    validateShareRatioSchema(obj) {
        if (!obj || typeof obj !== 'object') {
            if (this.debugMode) {
                this.ns.print("❌ Schéma SHARE_RATIO invalide: pas un objet");
            }
            return false;
        }

        if (typeof obj.shareRatio !== 'number' || obj.shareRatio < 0 || obj.shareRatio > 1) {
            if (this.debugMode) {
                this.ns.print("❌ Schéma SHARE_RATIO invalide: 'shareRatio' doit être entre 0 et 1");
            }
            return false;
        }

        return true;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔧 UTILITAIRES
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Active ou désactive le mode debug
     * 
     * @public
     * @param {boolean} enabled - true pour activer, false pour désactiver
     * @returns {void}
     * 
     * @example
     *   ph.setDebugMode(true);  // Active logs détaillés
     *   ph.setDebugMode(false); // Désactive logs
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.ns.print(`🔍 PortHandler debug mode: ${enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    }

    /**
     * Affiche l'état de tous les ports configurés
     * 
     * @public
     * @param {boolean} [useTPrint=false] - Si true, utilise tprint au lieu de print
     * @returns {void}
     * 
     * @example
     *   ph.printPortStatus();        // Dans tail
     *   ph.printPortStatus(true);    // Dans terminal
     */
    printPortStatus(useTPrint = false) {
        const print = useTPrint ? this.ns.tprint.bind(this.ns) : this.ns.print.bind(this.ns);
        
        print("═══════════════════════════════════════════════════════════");
        print("📨 ÉTAT DES PORTS - NEXUS-APEX PROMETHEUS");
        print("═══════════════════════════════════════════════════════════");
        
        for (const [name, portId] of Object.entries(CONFIG.PORTS)) {
            const isEmpty = this.isEmpty(portId);
            const status = isEmpty ? "🟢 VIDE" : "🔴 DONNÉES";
            
            print(`Port ${portId} (${name.padEnd(15)}): ${status}`);
            
            if (!isEmpty) {
                const data = this.peek(portId);
                const preview = String(data).substring(0, 50);
                print(`   Preview: ${preview}...`);
            }
        }
        
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
    
    // Démonstration complète du PortHandler
    const ph = new PortHandler(ns);
    ph.setDebugMode(true);
    
    ns.tprint("📨 Démonstration PortHandler PROMETHEUS...");
    ns.tprint("");
    
    // Test 1: Écriture/Lecture simple
    ns.tprint("📤 Test 1: Écriture/Lecture JSON basique");
    const testObj = { type: 'hack', target: 'n00dles', threads: 10, delay: 0 };
    ph.writeJSON(4, testObj);
    const readObj = ph.readJSON(4);
    ns.tprint(`   Écrit: ${JSON.stringify(testObj)}`);
    ns.tprint(`   Lu: ${JSON.stringify(readObj)}`);
    ns.tprint("");
    
    // Test 2: Validation de schéma
    ns.tprint("✅ Test 2: Validation de schéma COMMANDS");
    const validJob = { type: 'grow', host: 'home', target: 'joesguns', threads: 50 };
    const invalidJob = { type: 'invalid', host: 123 }; // Invalide
    ns.tprint(`   Job valide: ${ph.validateCommandSchema(validJob)}`);
    ns.tprint(`   Job invalide: ${ph.validateCommandSchema(invalidJob)}`);
    ns.tprint("");
    
    // Test 3: WriteJSONWithRetry
    ns.tprint("🔄 Test 3: Écriture avec retry");
    const success = await ph.writeJSONWithRetry(5, { value: 1000000, active: 3 }, 3, 50);
    ns.tprint(`   Succès après retry: ${success}`);
    ns.tprint("");
    
    // Test 4: État des ports
    ns.tprint("📊 Test 4: État de tous les ports");
    ph.printPortStatus(true);
    
    ns.tprint("");
    ns.tprint("✅ Démonstration terminée - PortHandler PROMETHEUS opérationnel");
}
