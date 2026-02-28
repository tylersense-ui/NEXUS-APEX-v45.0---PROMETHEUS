/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/hacknet-manager
 * @description Gestionnaire automatique des Hacknet Nodes.
 *              Optimise les investissements avec calcul ROI et upgrades intelligentes.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Cache des stats de nœuds (réduit appels API répétitifs)
 * ✓ Logique d'achat avec seuil de budget minimum
 * ✓ Sleep adaptatif (augmente quand rien à faire, diminue si opportunité)
 * ✓ Calcul ROI (Return On Investment) pour prioriser les upgrades
 * ✓ Try/catch robuste sur toutes les opérations Hacknet
 * ✓ Métriques détaillées (revenus totaux, investissement, profit net)
 * ✓ Mode économique (désactive upgrades coûteuses si budget serré)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/hacknet-manager.js");
 *   // Gère automatiquement les Hacknet Nodes en optimisant le ROI
 * 
 * @example
 *   // Avec budget minimum personnalisé
 *   // Dans constants.js : CONFIG.HACKNET = { MIN_BUDGET: 100_000_000 }
 *   ns.run("/managers/hacknet-manager.js");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION HACKNET
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const HACKNET_CONFIG = {
    /** Budget minimum avant d'acheter un nœud ou upgrade (évite bankruptcy) */
    MIN_BUDGET: CONFIG.HACKNET?.MIN_BUDGET || 10_000_000,
    
    /** Nombre maximum de nœuds (limite du jeu) */
    MAX_NODES: CONFIG.HACKNET?.MAX_NODES || 30,
    
    /** ROI maximum acceptable en heures (si > 24h, pas rentable court terme) */
    MAX_ROI_HOURS: CONFIG.HACKNET?.MAX_ROI_HOURS || 24,
    
    /** Check interval par défaut (2s) */
    BASE_CHECK_INTERVAL: 2000,
    
    /** Check interval en mode idle (60s - quand rien à faire) */
    IDLE_CHECK_INTERVAL: 60000,
    
    /** Pourcentage maximum du budget à dépenser par cycle (sécurité) */
    MAX_SPEND_PERCENT: 0.3 // 30% max
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de gestion des Hacknet Nodes.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "HACKNET-MGR");
    
    log.success("✅ Démarrage du Hacknet Manager PROMETHEUS");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        totalInvested: 0,
        totalRevenue: 0,
        nodesCreated: 0,
        upgradesPerformed: 0,
        cyclesCompleted: 0,
        startTime: Date.now(),
        lastActionTime: 0
    };
    
    /**
     * Cache des stats de nœuds (évite appels répétés)
     * @type {Object|null}
     */
    let nodeCache = null;
    let cacheTimestamp = 0;
    const CACHE_TTL = 5000; // 5s de cache
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Budget min: ${ns.formatNumber(HACKNET_CONFIG.MIN_BUDGET)}`);
    log.info(`   Max nodes: ${HACKNET_CONFIG.MAX_NODES}`);
    log.info(`   Max ROI: ${HACKNET_CONFIG.MAX_ROI_HOURS}h`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    let currentInterval = HACKNET_CONFIG.BASE_CHECK_INTERVAL;
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            const budget = player.money;
            const availableBudget = budget - HACKNET_CONFIG.MIN_BUDGET;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RÉCUPÉRATION DES STATS (avec cache)
            // ═══════════════════════════════════════════════════════════════════════
            const now = Date.now();
            
            if (!nodeCache || (now - cacheTimestamp) > CACHE_TTL) {
                try {
                    const numNodes = ns.hacknet.numNodes();
                    const nodeStats = [];
                    
                    for (let i = 0; i < numNodes; i++) {
                        nodeStats.push({
                            level: ns.hacknet.getNodeStats(i).level,
                            ram: ns.hacknet.getNodeStats(i).ram,
                            cores: ns.hacknet.getNodeStats(i).cores,
                            production: ns.hacknet.getNodeStats(i).production,
                            totalProduction: ns.hacknet.getNodeStats(i).totalProduction
                        });
                        
                        // Accumuler les revenus totaux
                        metrics.totalRevenue = Math.max(
                            metrics.totalRevenue,
                            ns.hacknet.getNodeStats(i).totalProduction
                        );
                    }
                    
                    nodeCache = {
                        numNodes: numNodes,
                        nodes: nodeStats,
                        timestamp: now
                    };
                    cacheTimestamp = now;
                    
                } catch (error) {
                    log.error(`Erreur lors de la récupération des stats: ${error.message}`);
                    await ns.sleep(5000);
                    continue;
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💰 VÉRIFICATION BUDGET
            // ═══════════════════════════════════════════════════════════════════════
            if (availableBudget < 0) {
                // Budget insuffisant - mode idle
                if (log.debugEnabled) {
                    log.debug(`💸 Budget insuffisant (${ns.formatNumber(budget)})`);
                }
                
                currentInterval = HACKNET_CONFIG.IDLE_CHECK_INTERVAL;
                await ns.sleep(currentInterval);
                continue;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🆕 ACHAT DE NOUVEAU NŒUD
            // ═══════════════════════════════════════════════════════════════════════
            if (nodeCache.numNodes < HACKNET_CONFIG.MAX_NODES) {
                try {
                    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
                    
                    if (newNodeCost <= availableBudget && 
                        newNodeCost <= (availableBudget * HACKNET_CONFIG.MAX_SPEND_PERCENT)) {
                        
                        const nodeIndex = ns.hacknet.purchaseNode();
                        
                        if (nodeIndex !== -1) {
                            metrics.totalInvested += newNodeCost;
                            metrics.nodesCreated++;
                            metrics.lastActionTime = now;
                            
                            log.success(`✅ Nouveau nœud acheté (#${nodeIndex}) - ${ns.formatNumber(newNodeCost)}`);
                            log.info(`   Total nodes: ${nodeCache.numNodes + 1}/${HACKNET_CONFIG.MAX_NODES}`);
                            
                            // Invalider le cache
                            nodeCache = null;
                            
                            // Réduire l'intervalle (plus d'opportunités possibles)
                            currentInterval = HACKNET_CONFIG.BASE_CHECK_INTERVAL;
                            await ns.sleep(1000);
                            continue;
                        }
                    } else if (log.debugEnabled && metrics.cyclesCompleted % 20 === 0) {
                        log.debug(`🎯 Prochain nœud: ${ns.formatNumber(newNodeCost)} (en attente)`);
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'achat de nœud: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ⬆️  UPGRADES DES NŒUDS EXISTANTS
            // ═══════════════════════════════════════════════════════════════════════
            let bestUpgrade = null;
            let bestROI = Infinity;
            
            for (let i = 0; i < nodeCache.numNodes; i++) {
                try {
                    // Coûts des upgrades possibles
                    const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
                    const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
                    const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
                    
                    // Évaluer chaque type d'upgrade
                    const upgrades = [
                        { type: 'level', cost: levelCost, func: () => ns.hacknet.upgradeLevel(i, 1) },
                        { type: 'ram', cost: ramCost, func: () => ns.hacknet.upgradeRam(i, 1) },
                        { type: 'core', cost: coreCost, func: () => ns.hacknet.upgradeCore(i, 1) }
                    ];
                    
                    for (const upgrade of upgrades) {
                        if (upgrade.cost > availableBudget) continue;
                        if (upgrade.cost > (availableBudget * HACKNET_CONFIG.MAX_SPEND_PERCENT)) continue;
                        if (upgrade.cost === Infinity) continue;
                        
                        // Calcul ROI approximatif (heures pour récupérer l'investissement)
                        const currentProduction = nodeCache.nodes[i].production; // $/s
                        const productionPerHour = currentProduction * 3600;
                        const roi = productionPerHour > 0 ? upgrade.cost / productionPerHour : Infinity;
                        
                        if (roi < bestROI && roi < HACKNET_CONFIG.MAX_ROI_HOURS) {
                            bestROI = roi;
                            bestUpgrade = { nodeIndex: i, ...upgrade };
                        }
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'évaluation du nœud ${i}: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💎 EXÉCUTION DE LA MEILLEURE UPGRADE
            // ═══════════════════════════════════════════════════════════════════════
            if (bestUpgrade) {
                try {
                    const success = bestUpgrade.func();
                    
                    if (success) {
                        metrics.totalInvested += bestUpgrade.cost;
                        metrics.upgradesPerformed++;
                        metrics.lastActionTime = now;
                        
                        log.success(`⬆️  Node #${bestUpgrade.nodeIndex} ${bestUpgrade.type} upgraded`);
                        log.info(`   Coût: ${ns.formatNumber(bestUpgrade.cost)} | ROI: ${bestROI.toFixed(1)}h`);
                        
                        // Invalider le cache
                        nodeCache = null;
                        
                        // Réduire l'intervalle
                        currentInterval = HACKNET_CONFIG.BASE_CHECK_INTERVAL;
                        await ns.sleep(500);
                        continue;
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'upgrade: ${error.message}`);
                }
            } else {
                // Aucune upgrade rentable trouvée - mode idle
                if (log.debugEnabled && metrics.cyclesCompleted % 30 === 0) {
                    log.debug(`⏸️  Aucune upgrade rentable détectée (ROI > ${HACKNET_CONFIG.MAX_ROI_HOURS}h)`);
                }
                
                currentInterval = HACKNET_CONFIG.IDLE_CHECK_INTERVAL;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 50 cycles)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.cyclesCompleted % 50 === 0) {
                const uptime = now - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                const profit = metrics.totalRevenue - metrics.totalInvested;
                const profitPercent = metrics.totalInvested > 0 
                    ? (profit / metrics.totalInvested) * 100 
                    : 0;
                
                log.info(`📊 Stats Hacknet:`);
                log.info(`   Nodes: ${nodeCache.numNodes}/${HACKNET_CONFIG.MAX_NODES}`);
                log.info(`   Investissement: ${ns.formatNumber(metrics.totalInvested)}`);
                log.info(`   Revenus: ${ns.formatNumber(metrics.totalRevenue)}`);
                log.info(`   Profit: ${ns.formatNumber(profit)} (${profitPercent > 0 ? '+' : ''}${profitPercent.toFixed(1)}%)`);
                log.info(`   Upgrades: ${metrics.upgradesPerformed} | Uptime: ${uptimeMin}min`);
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
            currentInterval = HACKNET_CONFIG.IDLE_CHECK_INTERVAL;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP ADAPTATIF
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(currentInterval);
    }
}
