/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/server-manager
 * @description Gestionnaire automatique des serveurs achetés (purchased servers).
 *              Achète et upgrade les serveurs selon ROI et budget disponible.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Calcul ROI intelligent (heures pour rentabiliser l'investissement)
 * ✓ Upgrade progressif (double la RAM quand rentable)
 * ✓ Protection budget avec réserve minimum configurable
 * ✓ Try/catch robuste sur toutes les opérations serveur
 * ✓ Métriques détaillées (total investi, RAM totale, profit)
 * ✓ Préfixe serveur configurable (CONFIG.MANAGERS.PSERV_PREFIX)
 * ✓ Logs détaillés avec progression et ROI calculé
 * ✓ Sleep adaptatif selon disponibilité budget
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/server-manager.js");
 *   // Achète et upgrade automatiquement les serveurs
 * 
 * @example
 *   // Avec ROI maximum personnalisé
 *   // Dans constants.js : CONFIG.MANAGERS.MAX_SERVER_UPGRADE_ROI_HOURS = 12
 *   ns.run("/managers/server-manager.js");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION SERVEUR
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const SERVER_CONFIG = {
    /** Préfixe des serveurs achetés */
    PREFIX: CONFIG.MANAGERS?.PSERV_PREFIX || "pserv-",
    
    /** Limite de serveurs achetables (limite du jeu) */
    MAX_SERVERS: 25,
    
    /** RAM initiale lors de l'achat (2^n GB) */
    INITIAL_RAM: 8, // 8 GB
    
    /** RAM maximale par serveur (2^20 = 1 PB) */
    MAX_RAM: Math.pow(2, 20),
    
    /** Budget minimum à garder en réserve */
    MIN_BUDGET: CONFIG.MANAGERS?.MIN_SERVER_BUDGET || 100_000_000,
    
    /** ROI maximum acceptable en heures */
    MAX_ROI_HOURS: CONFIG.MANAGERS?.MAX_SERVER_UPGRADE_ROI_HOURS || 8,
    
    /** Pourcentage maximum du budget utilisable par action */
    MAX_SPEND_PERCENT: 0.4, // 40%
    
    /** Check interval (60s) */
    CHECK_INTERVAL: 60000
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de gestion des serveurs achetés.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "SERVER-MGR");
    
    log.success("✅ Démarrage du Server Manager PROMETHEUS");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        totalInvested: 0,
        serversPurchased: 0,
        upgradesPerformed: 0,
        totalRAM: 0,
        cyclesCompleted: 0,
        startTime: Date.now(),
        lastActionTime: 0
    };
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Préfixe: ${SERVER_CONFIG.PREFIX}`);
    log.info(`   Max serveurs: ${SERVER_CONFIG.MAX_SERVERS}`);
    log.info(`   RAM initiale: ${SERVER_CONFIG.INITIAL_RAM}GB`);
    log.info(`   Budget min: ${ns.formatNumber(SERVER_CONFIG.MIN_BUDGET)}`);
    log.info(`   Max ROI: ${SERVER_CONFIG.MAX_ROI_HOURS}h`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            const budget = player.money;
            const availableBudget = budget - SERVER_CONFIG.MIN_BUDGET;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 SCAN DES SERVEURS EXISTANTS
            // ═══════════════════════════════════════════════════════════════════════
            const ownedServers = ns.getPurchasedServers();
            let totalRAM = 0;
            
            for (const server of ownedServers) {
                totalRAM += ns.getServerMaxRam(server);
            }
            
            metrics.totalRAM = totalRAM;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💰 VÉRIFICATION BUDGET
            // ═══════════════════════════════════════════════════════════════════════
            if (availableBudget < 0) {
                if (log.debugEnabled && metrics.cyclesCompleted % 10 === 0) {
                    log.debug(`💸 Budget insuffisant (${ns.formatNumber(budget)})`);
                }
                await ns.sleep(SERVER_CONFIG.CHECK_INTERVAL);
                continue;
            }
            
            const maxSpendable = Math.min(
                availableBudget,
                availableBudget * SERVER_CONFIG.MAX_SPEND_PERCENT
            );
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🆕 ACHAT DE NOUVEAU SERVEUR
            // ═══════════════════════════════════════════════════════════════════════
            if (ownedServers.length < SERVER_CONFIG.MAX_SERVERS) {
                try {
                    const newServerCost = ns.getPurchasedServerCost(SERVER_CONFIG.INITIAL_RAM);
                    
                    if (newServerCost <= maxSpendable) {
                        const serverName = `${SERVER_CONFIG.PREFIX}${ownedServers.length}`;
                        const hostname = ns.purchaseServer(serverName, SERVER_CONFIG.INITIAL_RAM);
                        
                        if (hostname) {
                            metrics.totalInvested += newServerCost;
                            metrics.serversPurchased++;
                            metrics.lastActionTime = Date.now();
                            
                            log.success(`✅ Nouveau serveur acheté: ${hostname}`);
                            log.info(`   RAM: ${SERVER_CONFIG.INITIAL_RAM}GB | Coût: ${ns.formatNumber(newServerCost)}`);
                            log.info(`   Total: ${ownedServers.length + 1}/${SERVER_CONFIG.MAX_SERVERS} serveurs`);
                            
                            await ns.sleep(1000);
                            continue;
                        }
                    } else if (log.debugEnabled && metrics.cyclesCompleted % 20 === 0) {
                        log.debug(`🎯 Prochain serveur: ${ns.formatNumber(newServerCost)} (en attente)`);
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'achat de serveur: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ⬆️  UPGRADE DES SERVEURS EXISTANTS
            // ═══════════════════════════════════════════════════════════════════════
            let bestUpgrade = null;
            let bestROI = Infinity;
            
            for (const server of ownedServers) {
                try {
                    const currentRAM = ns.getServerMaxRam(server);
                    
                    // Vérifier si déjà au max
                    if (currentRAM >= SERVER_CONFIG.MAX_RAM) {
                        continue;
                    }
                    
                    // Calculer la prochaine upgrade (doubler la RAM)
                    const newRAM = currentRAM * 2;
                    
                    // Vérifier que newRAM ne dépasse pas la limite
                    if (newRAM > SERVER_CONFIG.MAX_RAM) {
                        continue;
                    }
                    
                    const upgradeCost = ns.getPurchasedServerUpgradeCost(server, newRAM);
                    
                    if (upgradeCost === Infinity || upgradeCost <= 0) {
                        continue;
                    }
                    
                    if (upgradeCost > maxSpendable) {
                        continue;
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 💎 CALCUL ROI
                    // ═══════════════════════════════════════════════════════════════
                    // Estimation: 1 GB de RAM peut générer ~$200k/h en batchs HWGW
                    // (valeur approximative, varie selon les cibles et le niveau)
                    const ramGain = newRAM - currentRAM;
                    const estimatedRevenuePerHour = ramGain * 200_000; // $200k par GB par heure
                    const roi = estimatedRevenuePerHour > 0 
                        ? upgradeCost / estimatedRevenuePerHour 
                        : Infinity;
                    
                    if (roi < bestROI && roi <= SERVER_CONFIG.MAX_ROI_HOURS) {
                        bestROI = roi;
                        bestUpgrade = {
                            server: server,
                            currentRAM: currentRAM,
                            newRAM: newRAM,
                            cost: upgradeCost,
                            roi: roi
                        };
                    }
                    
                } catch (error) {
                    log.error(`Erreur lors de l'évaluation de ${server}: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💎 EXÉCUTION DE LA MEILLEURE UPGRADE
            // ═══════════════════════════════════════════════════════════════════════
            if (bestUpgrade) {
                try {
                    const success = ns.upgradePurchasedServer(
                        bestUpgrade.server, 
                        bestUpgrade.newRAM
                    );
                    
                    if (success) {
                        metrics.totalInvested += bestUpgrade.cost;
                        metrics.upgradesPerformed++;
                        metrics.lastActionTime = Date.now();
                        
                        log.success(`⬆️  ${bestUpgrade.server} upgraded`);
                        log.info(`   RAM: ${bestUpgrade.currentRAM}GB → ${bestUpgrade.newRAM}GB`);
                        log.info(`   Coût: ${ns.formatNumber(bestUpgrade.cost)} | ROI: ${bestUpgrade.roi.toFixed(1)}h`);
                        
                        await ns.sleep(1000);
                        continue;
                    } else {
                        log.warn(`⚠️  Échec upgrade de ${bestUpgrade.server}`);
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'upgrade: ${error.message}`);
                }
            } else if (log.debugEnabled && metrics.cyclesCompleted % 30 === 0) {
                log.debug(`⏸️  Aucune upgrade rentable (ROI > ${SERVER_CONFIG.MAX_ROI_HOURS}h)`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 10 cycles)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.cyclesCompleted % 10 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Stats Serveurs:`);
                log.info(`   Serveurs: ${ownedServers.length}/${SERVER_CONFIG.MAX_SERVERS}`);
                log.info(`   RAM totale: ${ns.formatRam(metrics.totalRAM)}`);
                log.info(`   Investissement: ${ns.formatNumber(metrics.totalInvested)}`);
                log.info(`   Achats: ${metrics.serversPurchased} | Upgrades: ${metrics.upgradesPerformed}`);
                log.info(`   Uptime: ${uptimeMin}min`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ✅ TOUS LES SERVEURS AU MAX
            // ═══════════════════════════════════════════════════════════════════════
            if (ownedServers.length === SERVER_CONFIG.MAX_SERVERS) {
                let allMaxed = true;
                
                for (const server of ownedServers) {
                    if (ns.getServerMaxRam(server) < SERVER_CONFIG.MAX_RAM) {
                        allMaxed = false;
                        break;
                    }
                }
                
                if (allMaxed) {
                    log.success(`🎉 Tous les serveurs sont au maximum !`);
                    log.info(`   ${SERVER_CONFIG.MAX_SERVERS} serveurs × ${ns.formatRam(SERVER_CONFIG.MAX_RAM)}`);
                    log.info(`   Total: ${ns.formatRam(metrics.totalRAM)}`);
                    log.info(`   Investissement total: ${ns.formatNumber(metrics.totalInvested)}`);
                    log.success(`✅ Manager terminé avec succès`);
                    return;
                }
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(SERVER_CONFIG.CHECK_INTERVAL);
    }
}
