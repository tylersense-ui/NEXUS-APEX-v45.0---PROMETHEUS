/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      core/orchestrator
 * @description Coordinateur général du système PROMETHEUS - Initialise et orchestre
 *              tous les composants (Network, Batcher, Controller, etc.).
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Refresh interval configurable (CONFIG.ORCHESTRATOR.REFRESH_INTERVAL_MS)
 * ✓ Try/catch robuste sur toutes les opérations
 * ✓ Gestion gracieuse des erreurs (continue toujours)
 * ✓ Support multi-cibles avec rotation
 * ✓ Métriques globales du système
 * ✓ Crack automatique des nouveaux serveurs
 * ✓ Logs détaillés avec icônes (🎼✅❌⚠️📊)
 * ✓ Banner ASCII au démarrage
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/core/orchestrator.js");
 *   // L'orchestrator démarre automatiquement tout le système
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";
import { Network } from "/lib/network.js";
import { PortHandler } from "/core/port-handler.js";
import { RamManager } from "/core/ram-manager.js";
import { Batcher } from "/core/batcher.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎼 ORCHESTRATOR - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Point d'entrée principal du système PROMETHEUS.
 * 
 * Workflow :
 * 1. Initialise tous les composants
 * 2. Démarre le controller (dispatcher)
 * 3. Entre dans la boucle principale
 * 4. Refresh réseau périodiquement
 * 5. Sélectionne les meilleures cibles
 * 6. Dispatch des batchs via le Batcher
 * 7. Répète indéfiniment
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    // Désactiver les logs par défaut
    ns.disableLog("ALL");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎨 BANNER PROMETHEUS
    // ═══════════════════════════════════════════════════════════════════════════════
    
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
    ns.tprint("🔥 Initialisation du système PROMETHEUS...");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔧 INITIALISATION DES COMPOSANTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const log = new Logger(ns, "ORCHESTRATOR");
    
    try {
        // Capabilities
        log.info("📋 Initialisation des Capabilities...");
        const caps = new Capabilities(ns);
        caps.printReport(true);
        ns.tprint("");
        
        // Network
        log.info("🌐 Initialisation du Network Scanner...");
        const network = new Network(ns, caps);
        const servers = network.refresh();
        ns.tprint(`✅ ${servers.length} serveurs détectés`);
        ns.tprint("");
        
        // Crack automatique
        log.info("🔓 Crack automatique des serveurs...");
        let cracked = 0;
        for (const server of servers) {
            if (!ns.hasRootAccess(server)) {
                if (network.crack(server)) {
                    cracked++;
                }
            }
        }
        ns.tprint(`✅ ${cracked} serveurs crackés`);
        ns.tprint("");
        
        // PortHandler
        log.info("📨 Initialisation du PortHandler...");
        const portHandler = new PortHandler(ns);
        portHandler.clear(CONFIG.PORTS.COMMANDS); // Clear port au démarrage
        ns.tprint("✅ PortHandler initialisé");
        ns.tprint("");
        
        // RamManager
        log.info("💾 Initialisation du RamManager...");
        const ramMgr = new RamManager(ns);
        const pools = ramMgr.getRamPools();
        ns.tprint(`✅ ${ns.formatRam(pools.totalFree)} RAM disponible`);
        ns.tprint("");
        
        // Batcher
        log.info("🔥 Initialisation du Batcher PROMETHEUS...");
        const batcher = new Batcher(ns, network, ramMgr, portHandler, caps);
        ns.tprint("✅ Batcher PROMETHEUS initialisé");
        ns.tprint("");
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 🚀 DÉMARRAGE DU CONTROLLER
        // ═══════════════════════════════════════════════════════════════════════════
        
        log.info("🎮 Démarrage du Controller...");
        
        // Vérifier si le controller existe
        if (!ns.fileExists("/hack/controller.js", "home")) {
            log.error("Controller introuvable: /hack/controller.js");
            ns.tprint("❌ ERREUR: Controller introuvable");
            return;
        }
        
        // Lancer le controller
        const controllerPID = ns.run("/hack/controller.js");
        
        if (controllerPID === 0) {
            log.error("Échec du démarrage du controller");
            ns.tprint("❌ ERREUR: Impossible de démarrer le controller");
            return;
        }
        
        ns.tprint(`✅ Controller démarré (PID: ${controllerPID})`);
        ns.tprint("");
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 📊 MÉTRIQUES INITIALES
        // ═══════════════════════════════════════════════════════════════════════════
        
        const metrics = {
            startTime: Date.now(),
            cyclesCompleted: 0,
            batchesDispatched: 0,
            totalErrors: 0,
            lastRefreshTime: 0
        };
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 🔄 CONFIGURATION
        // ═══════════════════════════════════════════════════════════════════════════
        
        const REFRESH_INTERVAL = CONFIG.ORCHESTRATOR?.REFRESH_INTERVAL_MS || 60000; // 60s défaut
        const MAX_TARGETS = CONFIG.ORCHESTRATOR?.MAX_TARGETS || 3;
        
        log.success("✅ Système PROMETHEUS opérationnel !");
        log.info(`⏱️  Refresh interval: ${REFRESH_INTERVAL / 1000}s`);
        log.info(`🎯 Max targets: ${MAX_TARGETS}`);
        ns.tprint("");
        ns.tprint("═══════════════════════════════════════════════════════════");
        ns.tprint("🔥 PROMETHEUS v45.0 - DÉMARRAGE COMPLET");
        ns.tprint("═══════════════════════════════════════════════════════════");
        ns.tprint("");
        
        await ns.sleep(2000); // Pause dramatique
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ♾️ BOUCLE PRINCIPALE (INFINIE)
        // ═══════════════════════════════════════════════════════════════════════════
        
        while (true) {
            try {
                metrics.cyclesCompleted++;
                const cycleStart = Date.now();
                
                if (log.debugEnabled) {
                    log.debug(`🔄 Cycle ${metrics.cyclesCompleted} démarré`);
                }
                
                // ═══════════════════════════════════════════════════════════════════
                // 🌐 REFRESH RÉSEAU (si nécessaire)
                // ═══════════════════════════════════════════════════════════════════
                
                const timeSinceRefresh = Date.now() - metrics.lastRefreshTime;
                
                if (timeSinceRefresh > REFRESH_INTERVAL) {
                    try {
                        log.info("🌐 Refresh du réseau...");
                        network.refresh(true); // Force refresh
                        
                        // Crack nouveaux serveurs
                        const allServers = network.refresh();
                        let newCracked = 0;
                        
                        for (const server of allServers) {
                            if (!ns.hasRootAccess(server)) {
                                if (network.crack(server)) {
                                    newCracked++;
                                    log.success(`🔓 Root obtenu: ${server}`);
                                }
                            }
                        }
                        
                        if (newCracked > 0) {
                            log.success(`✅ ${newCracked} nouveaux serveurs crackés`);
                        }
                        
                        metrics.lastRefreshTime = Date.now();
                        
                    } catch (error) {
                        log.error(`Erreur lors du refresh: ${error.message}`);
                        metrics.totalErrors++;
                    }
                }
                
                // ═══════════════════════════════════════════════════════════════════
                // 🎯 SÉLECTION DES CIBLES
                // ═══════════════════════════════════════════════════════════════════
                
                let targets = [];
                
                try {
                    targets = network.getTopTargets(MAX_TARGETS);
                    
                    if (targets.length === 0) {
                        log.warn("⚠️  Aucune cible disponible");
                        await ns.sleep(10000); // Attendre 10s
                        continue;
                    }
                    
                    if (log.debugEnabled) {
                        log.debug(`🎯 Cibles sélectionnées: ${targets.join(", ")}`);
                    }
                    
                } catch (error) {
                    log.error(`Erreur lors de la sélection des cibles: ${error.message}`);
                    metrics.totalErrors++;
                    await ns.sleep(10000);
                    continue;
                }
                
                // ═════════════════════════════════════════════════════════════
                // 🔥 DISPATCH DES BATCHS (v45.6 - SATURATION RAM 100%)
                // ═════════════════════════════════════════════════════════════

                for (const target of targets) {
                let batchCount = 0;
                let totalThreads = 0;
                const MAX_BATCHES_PER_TARGET = 100;
    
                while (batchCount < MAX_BATCHES_PER_TARGET) {
                try {
                // ✅ MÉTHODE CORRIGÉE
                const ramPools = ramMgr.getRamPools();
                const freeRAM = ramPools.totalFree;
            
                // Stop si moins de 10GB libre (viser 95-100% RAM)
                if (freeRAM < 10) {
                if (batchCount === 0) {
                    log.warn(`⚠️  RAM insuffisante pour ${target} (${freeRAM.toFixed(0)}GB libre)`);
                }
                break;
                }
            
                if (log.debugEnabled && batchCount === 0) {
                log.debug(`🔥 Dispatching batches vers ${target}...`);
                }
            
                const result = await batcher.executeBatch(target);
            
                if (result.success && result.threadsUsed > 0) {
                metrics.batchesDispatched++;
                batchCount++;
                totalThreads += result.threadsUsed;
                
                if (log.debugEnabled) {
                    log.debug(`✅ Batch #${batchCount} ${target}: ${result.threadsUsed} threads`);
                }
                } else {
                if (batchCount === 0) {
                    log.warn(`⚠️  Batch ${target} échoué (aucun thread placé)`);
                }
                break;
                }
            
                } catch (error) {
                log.error(`❌ Erreur batch ${target} #${batchCount + 1}: ${error.message}`);
                metrics.totalErrors++;
                break;
                }
        }
    
                if (batchCount > 0) {
                log.info(`🎯 ${target}: ${batchCount} batches, ${totalThreads} threads`);
                }
        }
    
                              
                // ═══════════════════════════════════════════════════════════════════
                // 📊 MÉTRIQUES PÉRIODIQUES (toutes les 10 cycles)
                // ═══════════════════════════════════════════════════════════════════
                
                if (metrics.cyclesCompleted % 10 === 0) {
                    const uptime = Date.now() - metrics.startTime;
                    const uptimeMin = Math.floor(uptime / 60000);
                    
                    log.info(`📊 Cycles: ${metrics.cyclesCompleted}, Batchs: ${metrics.batchesDispatched}, Uptime: ${uptimeMin}min`);
                }
                
                // ═══════════════════════════════════════════════════════════════════
                // ⏱️ SLEEP ENTRE CYCLES
                // ═══════════════════════════════════════════════════════════════════
                
                const cycleDuration = Date.now() - cycleStart;
                const sleepTime = Math.max(1000, 5000 - cycleDuration); // Min 1s, cible 5s par cycle
                
                await ns.sleep(sleepTime);
                
            } catch (error) {
                // Erreur critique dans la boucle principale
                log.error(`ERREUR CRITIQUE dans la boucle: ${error.message}`);
                metrics.totalErrors++;
                
                // Attendre avant de retry
                await ns.sleep(10000);
            }
        }
        
    } catch (error) {
        // Erreur lors de l'initialisation
        log.error(`ERREUR FATALE lors de l'initialisation: ${error.message}`);
        ns.tprint(`❌ ERREUR FATALE: ${error.message}`);
        ns.tprint("Le système PROMETHEUS n'a pas pu démarrer.");
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION TECHNIQUE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * RÔLE DE L'ORCHESTRATOR :
 * -------------------------
 * L'orchestrator est le point d'entrée principal du système PROMETHEUS.
 * Il coordonne tous les composants et gère le cycle de vie complet.
 * 
 * COMPOSANTS GÉRÉS :
 * ------------------
 * 1. Capabilities - Détection des APIs disponibles
 * 2. Network - Scanner et cracker du réseau
 * 3. PortHandler - Communication inter-scripts
 * 4. RamManager - Gestion de la RAM
 * 5. Batcher - Calcul et dispatch des batchs HWGW
 * 6. Controller - Exécution des workers (lancé par orchestrator)
 * 
 * WORKFLOW :
 * ----------
 * Initialisation :
 *   → Charge tous les modules
 *   → Scan le réseau
 *   → Crack les serveurs
 *   → Lance le controller
 *   → Entre dans la boucle principale
 * 
 * Boucle principale :
 *   → Refresh réseau (toutes les 60s par défaut)
 *   → Crack nouveaux serveurs
 *   → Sélectionne top N cibles (3 par défaut)
 *   → Dispatch batch sur chaque cible via Batcher
 *   → Sleep entre cycles (5s cible)
 *   → Répète
 * 
 * OPTIMISATIONS PROMETHEUS :
 * --------------------------
 * 
 * 1. REFRESH CONFIGURABLE
 *    Avant : Refresh hardcodé
 *    Maintenant : CONFIG.ORCHESTRATOR.REFRESH_INTERVAL_MS
 *    Impact : Personnalisable selon les besoins
 * 
 * 2. TRY/CATCH ROBUSTE
 *    Avant : Crash sur erreur
 *    Maintenant : Continue toujours, log les erreurs
 *    Impact : Système stable même en cas d'erreurs
 * 
 * 3. MULTI-CIBLES
 *    Avant : Une seule cible
 *    Maintenant : Top N cibles (configurable)
 *    Impact : Meilleure utilisation de la RAM
 * 
 * 4. CRACK AUTOMATIQUE
 *    Détecte et crack automatiquement les nouveaux serveurs
 *    Impact : Toujours à jour
 * 
 * CONFIGURATION :
 * ---------------
 * Dans constants.js, ajouter :
 * 
 * CONFIG.ORCHESTRATOR = {
 *   REFRESH_INTERVAL_MS: 60000,  // Refresh réseau (60s)
 *   MAX_TARGETS: 3                // Nombre de cibles simultanées
 * };
 * 
 * MÉTRIQUES :
 * -----------
 * L'orchestrator track :
 * - cyclesCompleted : Nombre de cycles de la boucle principale
 * - batchesDispatched : Nombre total de batchs dispatchés
 * - totalErrors : Nombre d'erreurs rencontrées
 * - uptime : Temps écoulé depuis le démarrage
 * 
 * DÉMARRAGE :
 * -----------
 * Pour démarrer le système complet :
 * 
 * ns.run("/core/orchestrator.js");
 * 
 * L'orchestrator :
 * 1. Affiche le banner PROMETHEUS
 * 2. Initialise tous les composants
 * 3. Lance le controller
 * 4. Entre dans la boucle principale
 * 
 * MONITORING :
 * ------------
 * Pour monitorer l'orchestrator :
 * 
 * ns.tail("/core/orchestrator.js");
 * 
 * Les logs affichent :
 * - Initialisation des composants
 * - Refresh réseau périodiques
 * - Nouveaux serveurs crackés
 * - Batchs dispatchés
 * - Métriques (tous les 10 cycles)
 * - Erreurs
 * 
 * ARRÊT :
 * -------
 * Pour arrêter proprement le système :
 * 
 * ns.kill("/core/orchestrator.js", "home");
 * ns.kill("/hack/controller.js", "home");
 * 
 * L'orchestrator s'arrêtera et le controller aussi.
 * Les workers en cours continueront jusqu'à leur fin.
 * 
 * DEBUGGING :
 * -----------
 * Pour activer les logs détaillés :
 * 
 * // Dans constants.js
 * CONFIG.SYSTEM.DEBUG_MODE = true;
 * 
 * Cela affichera :
 * - Chaque cycle
 * - Chaque cible sélectionnée
 * - Chaque batch dispatché
 * - Threads utilisés par batch
 * 
 * GESTION DES ERREURS :
 * ---------------------
 * L'orchestrator est conçu pour ne jamais crasher.
 * Toutes les erreurs sont catchées et loggées.
 * Le système continue toujours de fonctionner.
 * 
 * Types d'erreurs gérées :
 * - Erreur d'initialisation → Stop
 * - Erreur de refresh → Log + continue
 * - Erreur de sélection cibles → Log + continue
 * - Erreur de batch → Log + continue
 * - Erreur dans boucle principale → Log + retry
 * 
 * INTÉGRATION :
 * -------------
 * L'orchestrator s'intègre avec :
 * - Dashboard : Affiche les métriques
 * - Watcher : Monitore les cibles
 * - Tous les composants via imports
 * 
 * TIPS :
 * ------
 * 1. Lancer l'orchestrator en premier (boot du système)
 * 2. Ajuster REFRESH_INTERVAL selon besoins (60s par défaut)
 * 3. Ajuster MAX_TARGETS selon RAM disponible (3 par défaut)
 * 4. Monitorer les logs pour détecter problèmes
 * 5. Le controller DOIT être présent avant de lancer l'orchestrator
 * 
 * PERFORMANCE :
 * -------------
 * RAM : ~5 GB (orchestrator + tous les modules)
 * CPU : Faible (sleep entre cycles)
 * Cycle duration : ~5s (ajusté dynamiquement)
 * 
 * L'orchestrator peut gérer des centaines de serveurs et des dizaines
 * de batchs par minute sans problème de performance.
 */
