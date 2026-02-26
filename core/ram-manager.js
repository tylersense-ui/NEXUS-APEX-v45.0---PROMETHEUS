/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      core/ram-manager
 * @description Gestionnaire intelligent de RAM avec allocation best-fit et métriques
 *              de fragmentation. Optimise l'utilisation de la RAM du réseau.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Utilisation correcte des wrappers ns.getServerMaxRam/UsedRam
 * ✓ Algorithme best-fit (minimise fragmentation vs first-fit)
 * ✓ Métriques de fragmentation (waste tracking)
 * ✓ Cache RAM avec TTL configurable
 * ✓ getRamPools() pour vue d'ensemble des ressources
 * ✓ Protection RESERVED_HOME_RAM sur 'home'
 * ✓ Logging détaillé avec icônes (💾⚡✅❌📊)
 * ✓ Support multi-serveurs avec tri par RAM disponible
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   import { RamManager } from "/core/ram-manager.js";
 *   const ramMgr = new RamManager(ns);
 *   
 *   // Trouver un serveur avec 10GB disponibles
 *   const host = ramMgr.findHost(10);
 *   if (host) {
 *       ns.exec("/hack/workers/hack.js", host, 100);
 *   }
 * 
 * @example
 *   // Allocation best-fit (minimise fragmentation)
 *   const hosts = ramMgr.allocate(50, 1.75); // 50 threads de 1.75GB chacun
 *   for (const allocation of hosts) {
 *       ns.exec("/script.js", allocation.host, allocation.threads);
 *   }
 * 
 * @example
 *   // Métriques de fragmentation
 *   const metrics = ramMgr.getFragmentationMetrics();
 *   ns.tprint(`Fragmentation: ${metrics.wastePercentage.toFixed(1)}%`);
 *   ns.tprint(`RAM gaspillée: ${ns.formatRam(metrics.wastedRam)}`);
 */

import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📘 CLASSE RAMMANAGER
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Gère l'allocation intelligente de RAM sur tous les serveurs du réseau.
 * 
 * Algorithmes :
 * - Best-fit : Trouve le serveur avec juste assez de RAM (minimise fragmentation)
 * - First-fit : Trouve le premier serveur avec assez de RAM (rapide mais fragmentant)
 * 
 * Fonctionnalités :
 * - 💾 Allocation intelligente multi-serveurs
 * - 📊 Métriques de fragmentation en temps réel
 * - ⏱️ Cache avec TTL pour éviter appels répétés
 * - 🔒 Protection de la RAM réservée sur 'home'
 * - ✅ Validation des allocations possibles
 */
export class RamManager {
    /**
     * Constructeur du RamManager
     * 
     * @param {NS} ns - Namespace BitBurner
     * 
     * @example
     *   const ramMgr = new RamManager(ns);
     */
    constructor(ns) {
        /** @type {NS} Référence au namespace BitBurner */
        this.ns = ns;
        
        /**
         * Cache des infos RAM par serveur
         * Format: { hostname: { maxRam, usedRam, freeRam, timestamp } }
         * @private
         * @type {Object}
         */
        this._ramCache = {};
        
        /**
         * TTL du cache en millisecondes (5 secondes)
         * @private
         * @type {number}
         */
        this._cacheTTL = 5000;
        
        /**
         * RAM réservée sur 'home' (depuis CONFIG)
         * @private
         * @type {number}
         */
        this._reservedHomeRam = CONFIG.HACKING.RESERVED_HOME_RAM || 32;
        
        /**
         * Flag pour activer les logs de debug
         * @private
         * @type {boolean}
         */
        this._debugMode = CONFIG.SYSTEM.DEBUG_MODE || false;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 💾 RÉCUPÉRATION DES INFOS RAM (avec cache)
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Récupère les infos RAM d'un serveur (avec cache)
     * 
     * PROMETHEUS: Utilise les wrappers corrects ns.getServerMaxRam/UsedRam
     * au lieu d'accéder directement aux propriétés server.maxRam/ramUsed
     * 
     * @public
     * @param {string} hostname - Nom du serveur
     * @param {boolean} [useCache=true] - Utiliser le cache si disponible
     * @returns {Object} { maxRam, usedRam, freeRam } en GB
     * 
     * @example
     *   const info = ramMgr.getRamInfo("n00dles");
     *   ns.tprint(`Free: ${info.freeRam}GB`);
     */
    getRamInfo(hostname, useCache = true) {
        const now = Date.now();
        
        // Vérifier le cache
        if (useCache && this._ramCache[hostname]) {
            const cached = this._ramCache[hostname];
            if (now - cached.timestamp < this._cacheTTL) {
                return {
                    maxRam: cached.maxRam,
                    usedRam: cached.usedRam,
                    freeRam: cached.freeRam
                };
            }
        }

        // Récupération via les wrappers corrects (FIX PROMETHEUS)
        const maxRam = this.ns.getServerMaxRam(hostname);
        const usedRam = this.ns.getServerUsedRam(hostname);
        
        // Protection RESERVED_HOME_RAM sur 'home'
        let freeRam = maxRam - usedRam;
        if (hostname === "home") {
            freeRam = Math.max(0, freeRam - this._reservedHomeRam);
        }

        // Mise en cache
        this._ramCache[hostname] = {
            maxRam: maxRam,
            usedRam: usedRam,
            freeRam: freeRam,
            timestamp: now
        };

        return { maxRam, usedRam, freeRam };
    }

    /**
     * Invalide le cache pour un serveur spécifique ou tous les serveurs
     * 
     * @public
     * @param {string} [hostname] - Serveur spécifique, ou undefined pour tous
     * @returns {void}
     * 
     * @example
     *   ramMgr.invalidateCache("n00dles"); // Invalide n00dles uniquement
     *   ramMgr.invalidateCache();          // Invalide tout le cache
     */
    invalidateCache(hostname) {
        if (hostname) {
            delete this._ramCache[hostname];
        } else {
            this._ramCache = {};
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔍 RECHERCHE DE SERVEURS (Best-fit & First-fit)
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Trouve un serveur avec suffisamment de RAM disponible (best-fit)
     * 
     * Algorithme best-fit : Trouve le serveur avec le MOINS de RAM au-dessus
     * du minimum requis. Cela minimise la fragmentation en évitant de gaspiller
     * de gros serveurs pour de petites allocations.
     * 
     * @public
     * @param {number} ramNeeded - RAM nécessaire en GB
     * @param {string[]} [candidates] - Liste de serveurs à considérer (ou null pour tous)
     * @returns {string|null} Hostname du serveur ou null si aucun trouvé
     * 
     * @example
     *   const host = ramMgr.findHost(10); // Cherche 10GB
     *   if (host) {
     *       ns.exec("/script.js", host, 100);
     *   }
     */
    findHost(ramNeeded, candidates = null) {
        // Si aucune liste fournie, utiliser tous les serveurs scannés
        if (!candidates) {
            candidates = this._getAllServers();
        }

        let bestHost = null;
        let bestFreeRam = Infinity;

        for (const hostname of candidates) {
            // Ignorer les serveurs sans root
            if (!this.ns.hasRootAccess(hostname)) {
                continue;
            }

            const info = this.getRamInfo(hostname);
            
            // Serveur doit avoir assez de RAM libre
            if (info.freeRam >= ramNeeded) {
                // Best-fit: choisir le serveur avec le MOINS de RAM libre (mais suffisante)
                if (info.freeRam < bestFreeRam) {
                    bestFreeRam = info.freeRam;
                    bestHost = hostname;
                }
            }
        }

        if (this._debugMode && bestHost) {
            this.ns.print(`💾 findHost(${ramNeeded}GB): ${bestHost} (${bestFreeRam.toFixed(2)}GB libres)`);
        }

        return bestHost;
    }

    /**
     * Trouve le serveur avec le PLUS de RAM disponible
     * Utile pour les grosses allocations
     * 
     * @public
     * @param {string[]} [candidates] - Liste de serveurs à considérer (ou null pour tous)
     * @returns {string|null} Hostname du serveur avec le plus de RAM
     * 
     * @example
     *   const biggestHost = ramMgr.findBiggestHost();
     *   ns.tprint(`Plus gros serveur: ${biggestHost}`);
     */
    findBiggestHost(candidates = null) {
        if (!candidates) {
            candidates = this._getAllServers();
        }

        let bestHost = null;
        let maxFreeRam = 0;

        for (const hostname of candidates) {
            if (!this.ns.hasRootAccess(hostname)) {
                continue;
            }

            const info = this.getRamInfo(hostname);
            
            if (info.freeRam > maxFreeRam) {
                maxFreeRam = info.freeRam;
                bestHost = hostname;
            }
        }

        return bestHost;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📦 ALLOCATION MULTI-SERVEURS (Best-fit)
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Alloue des threads sur plusieurs serveurs si nécessaire
     * 
     * Utilise l'algorithme best-fit pour minimiser la fragmentation.
     * Retourne un tableau d'allocations { host, threads }.
     * 
     * @public
     * @param {number} totalThreads - Nombre total de threads à allouer
     * @param {number} ramPerThread - RAM par thread en GB
     * @param {string[]} [candidates] - Serveurs à considérer (ou null pour tous)
     * @returns {Array<{host: string, threads: number}>} Allocations réussies
     * 
     * @example
     *   // Allouer 500 threads de 1.75GB
     *   const allocations = ramMgr.allocate(500, 1.75);
     *   for (const alloc of allocations) {
     *       ns.exec("/script.js", alloc.host, alloc.threads);
     *   }
     */
    allocate(totalThreads, ramPerThread, candidates = null) {
        if (!candidates) {
            candidates = this._getAllServers();
        }

        const allocations = [];
        let remainingThreads = totalThreads;

        // Trier les serveurs par RAM libre croissante (best-fit)
        // Cela favorise l'utilisation des petits serveurs d'abord
        const sortedHosts = candidates
            .filter(h => this.ns.hasRootAccess(h))
            .map(h => ({ hostname: h, info: this.getRamInfo(h) }))
            .sort((a, b) => a.info.freeRam - b.info.freeRam);

        for (const { hostname, info } of sortedHosts) {
            if (remainingThreads === 0) {
                break;
            }

            // Calculer combien de threads peuvent tenir sur ce serveur
            const threadsAvailable = Math.floor(info.freeRam / ramPerThread);
            
            if (threadsAvailable > 0) {
                const threadsToAllocate = Math.min(threadsAvailable, remainingThreads);
                
                allocations.push({
                    host: hostname,
                    threads: threadsToAllocate
                });
                
                remainingThreads -= threadsToAllocate;
                
                if (this._debugMode) {
                    this.ns.print(`💾 Alloué ${threadsToAllocate} threads sur ${hostname}`);
                }
            }
        }

        // Logging si allocation incomplète
        if (remainingThreads > 0) {
            this.ns.print(`⚠️  Allocation partielle: ${totalThreads - remainingThreads}/${totalThreads} threads alloués`);
        } else if (this._debugMode) {
            this.ns.print(`✅ Allocation complète: ${totalThreads} threads sur ${allocations.length} serveurs`);
        }

        return allocations;
    }

    /**
     * Vérifie si une allocation est possible
     * Retourne true/false sans effectuer l'allocation
     * 
     * @public
     * @param {number} totalThreads - Nombre de threads
     * @param {number} ramPerThread - RAM par thread en GB
     * @param {string[]} [candidates] - Serveurs à considérer
     * @returns {boolean} True si allocation possible
     * 
     * @example
     *   if (ramMgr.canAllocate(1000, 1.75)) {
     *       ns.tprint("✅ Allocation possible");
     *   } else {
     *       ns.tprint("❌ RAM insuffisante");
     *   }
     */
    canAllocate(totalThreads, ramPerThread, candidates = null) {
        if (!candidates) {
            candidates = this._getAllServers();
        }

        const totalRamNeeded = totalThreads * ramPerThread;
        let totalRamAvailable = 0;

        for (const hostname of candidates) {
            if (!this.ns.hasRootAccess(hostname)) {
                continue;
            }

            const info = this.getRamInfo(hostname);
            totalRamAvailable += info.freeRam;
        }

        return totalRamAvailable >= totalRamNeeded;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📊 MÉTRIQUES ET STATISTIQUES
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Retourne une vue d'ensemble des pools de RAM
     * 
     * @public
     * @returns {Object} { totalMax, totalUsed, totalFree, servers }
     * 
     * @example
     *   const pools = ramMgr.getRamPools();
     *   ns.tprint(`RAM totale: ${ns.formatRam(pools.totalMax)}`);
     *   ns.tprint(`RAM libre: ${ns.formatRam(pools.totalFree)}`);
     */
    getRamPools() {
        const servers = this._getAllServers().filter(h => this.ns.hasRootAccess(h));
        
        let totalMax = 0;
        let totalUsed = 0;
        let totalFree = 0;
        const serverDetails = [];

        for (const hostname of servers) {
            const info = this.getRamInfo(hostname);
            
            totalMax += info.maxRam;
            totalUsed += info.usedRam;
            totalFree += info.freeRam;
            
            serverDetails.push({
                hostname: hostname,
                maxRam: info.maxRam,
                usedRam: info.usedRam,
                freeRam: info.freeRam,
                utilization: (info.usedRam / info.maxRam) * 100
            });
        }

        return {
            totalMax: totalMax,
            totalUsed: totalUsed,
            totalFree: totalFree,
            servers: serverDetails.sort((a, b) => b.freeRam - a.freeRam)
        };
    }

    /**
     * Calcule les métriques de fragmentation
     * 
     * La fragmentation survient quand la RAM est mal utilisée :
     * - Beaucoup de petits morceaux inutilisables
     * - Serveurs partiellement remplis
     * 
     * @public
     * @returns {Object} { wastedRam, wastePercentage, fragmentedServers }
     * 
     * @example
     *   const metrics = ramMgr.getFragmentationMetrics();
     *   ns.tprint(`Fragmentation: ${metrics.wastePercentage.toFixed(1)}%`);
     */
    getFragmentationMetrics() {
        const pools = this.getRamPools();
        let wastedRam = 0;
        let fragmentedServers = 0;

        // Définir un seuil de fragmentation (< 2GB libres = fragmenté)
        const FRAGMENTATION_THRESHOLD = 2;

        for (const server of pools.servers) {
            // Si le serveur a de la RAM libre mais < threshold, c'est du gaspillage
            if (server.freeRam > 0 && server.freeRam < FRAGMENTATION_THRESHOLD) {
                wastedRam += server.freeRam;
                fragmentedServers++;
            }
        }

        const wastePercentage = (wastedRam / pools.totalMax) * 100;

        return {
            wastedRam: wastedRam,
            wastePercentage: wastePercentage,
            fragmentedServers: fragmentedServers,
            totalServers: pools.servers.length
        };
    }

    /**
     * Affiche un rapport détaillé de la RAM
     * 
     * @public
     * @param {boolean} [useTPrint=false] - Si true, utilise tprint au lieu de print
     * @param {number} [topN=10] - Nombre de serveurs à afficher
     * @returns {void}
     * 
     * @example
     *   ramMgr.printRamReport();        // Dans tail
     *   ramMgr.printRamReport(true, 5); // Dans terminal, top 5
     */
    printRamReport(useTPrint = false, topN = 10) {
        const print = useTPrint ? this.ns.tprint.bind(this.ns) : this.ns.print.bind(this.ns);
        const pools = this.getRamPools();
        const metrics = this.getFragmentationMetrics();
        
        print("═══════════════════════════════════════════════════════════");
        print("💾 RAPPORT RAM - NEXUS-APEX PROMETHEUS");
        print("═══════════════════════════════════════════════════════════");
        print("");
        print(`📊 STATISTIQUES GLOBALES:`);
        print(`   Total RAM:      ${this.ns.formatRam(pools.totalMax)}`);
        print(`   RAM utilisée:   ${this.ns.formatRam(pools.totalUsed)} (${((pools.totalUsed / pools.totalMax) * 100).toFixed(1)}%)`);
        print(`   RAM libre:      ${this.ns.formatRam(pools.totalFree)} (${((pools.totalFree / pools.totalMax) * 100).toFixed(1)}%)`);
        print(`   Serveurs:       ${pools.servers.length}`);
        print("");
        print(`⚠️  FRAGMENTATION:`);
        print(`   RAM gaspillée:  ${this.ns.formatRam(metrics.wastedRam)} (${metrics.wastePercentage.toFixed(1)}%)`);
        print(`   Serveurs fragmentés: ${metrics.fragmentedServers}/${metrics.totalServers}`);
        print("");
        print(`🏆 TOP ${topN} SERVEURS (par RAM libre):`);
        
        for (let i = 0; i < Math.min(topN, pools.servers.length); i++) {
            const server = pools.servers[i];
            const bar = this._createUsageBar(server.utilization, 20);
            print(`   ${(i + 1).toString().padStart(2)}. ${server.hostname.padEnd(20)} ${bar} ${this.ns.formatRam(server.freeRam)} libres`);
        }
        
        print("═══════════════════════════════════════════════════════════");
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔧 UTILITAIRES PRIVÉS
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Récupère tous les serveurs du réseau (scan simple)
     * 
     * @private
     * @returns {string[]} Liste de tous les hostnames
     */
    _getAllServers() {
        const visited = new Set();
        const queue = ["home"];
        const servers = [];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (visited.has(current)) {
                continue;
            }
            
            visited.add(current);
            servers.push(current);
            
            try {
                const neighbors = this.ns.scan(current);
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            } catch (e) {
                // Serveur inaccessible
            }
        }
        
        return servers;
    }

    /**
     * Crée une barre de progression ASCII
     * 
     * @private
     * @param {number} percentage - Pourcentage (0-100)
     * @param {number} length - Longueur de la barre
     * @returns {string} Barre formatée
     */
    _createUsageBar(percentage, length) {
        const filled = Math.floor((percentage / 100) * length);
        const empty = length - filled;
        return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage.toFixed(0)}%`;
    }

    /**
     * Active ou désactive le mode debug
     * 
     * @public
     * @param {boolean} enabled - true pour activer, false pour désactiver
     * @returns {void}
     */
    setDebugMode(enabled) {
        this._debugMode = enabled;
        this.ns.print(`🔍 RamManager debug mode: ${enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
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
    
    // Démonstration complète du RamManager
    const ramMgr = new RamManager(ns);
    ramMgr.setDebugMode(true);
    
    ns.tprint("💾 Démonstration RamManager PROMETHEUS...");
    ns.tprint("");
    
    // Test 1: Trouver un serveur avec 10GB
    ns.tprint("🔍 Test 1: Recherche de serveur avec 10GB (best-fit)");
    const host = ramMgr.findHost(10);
    if (host) {
        const info = ramMgr.getRamInfo(host);
        ns.tprint(`   Trouvé: ${host} (${ns.formatRam(info.freeRam)} libres)`);
    } else {
        ns.tprint("   Aucun serveur trouvé avec 10GB");
    }
    ns.tprint("");
    
    // Test 2: Allocation multi-serveurs
    ns.tprint("📦 Test 2: Allocation de 100 threads de 1.75GB");
    const allocations = ramMgr.allocate(100, 1.75);
    ns.tprint(`   ${allocations.length} serveurs utilisés:`);
    for (const alloc of allocations) {
        ns.tprint(`      - ${alloc.host}: ${alloc.threads} threads`);
    }
    ns.tprint("");
    
    // Test 3: Vérifier si allocation possible
    ns.tprint("✅ Test 3: Vérification allocation 1000 threads");
    const canDo = ramMgr.canAllocate(1000, 1.75);
    ns.tprint(`   Possible: ${canDo ? 'OUI' : 'NON'}`);
    ns.tprint("");
    
    // Test 4: Rapport complet
    ns.tprint("📊 Test 4: Rapport RAM complet");
    ramMgr.printRamReport(true, 5);
    
    ns.tprint("");
    ns.tprint("✅ Démonstration terminée - RamManager PROMETHEUS opérationnel");
}
