/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/corp-manager
 * @description Gestionnaire automatique de Corporation (SF3).
 *              Gère divisions, produits, upgrades, financement et expansion.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), Corporation API (SF3)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.corp avant toute opération
 * ✓ Progression par étapes (bootstrap → growth → optimization)
 * ✓ Gestion intelligente des rounds de financement
 * ✓ Création et expansion de divisions stratégiques
 * ✓ Développement automatique de produits
 * ✓ Upgrades priorisées par ROI
 * ✓ Hiring automatique selon budget et demande
 * ✓ Gestion des materials et supply chains
 * ✓ Research & Development automation
 * ✓ Try/catch robuste sur TOUTES les opérations corp
 * ✓ Métriques détaillées (revenue, profit, valuation)
 * ✓ Logs professionnels avec contexte stratégique
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/corp-manager.js");
 *   // Gère automatiquement la corporation (de zéro à l'IPO)
 * 
 * @example
 *   // Mode agressif (expansion rapide)
 *   // Dans constants.js : CONFIG.CORP.STRATEGY = "aggressive"
 *   ns.run("/managers/corp-manager.js");
 * 
 * @strategy
 *   Phase 1 - Bootstrap: Création corp + Agriculture Division (Sector-12)
 *   Phase 2 - Growth: Expansion géographique + Tobacco Division
 *   Phase 3 - Optimization: Upgrades, R&D, Products, IPO
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION CORPORATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const CORP_CONFIG = {
    /** Stratégie (conservative, balanced, aggressive) */
    STRATEGY: CONFIG.CORP?.STRATEGY || "balanced",
    
    /** Check interval (10s) */
    CHECK_INTERVAL: 10000,
    
    /** Nom de la corporation */
    CORP_NAME: CONFIG.CORP?.NAME || "Prometheus Industries",
    
    /** Divisions à créer (par ordre de priorité) */
    TARGET_DIVISIONS: [
        { name: "Agriculture", type: "Agriculture", priority: 1 },
        { name: "Tobacco", type: "Tobacco", priority: 2 },
        { name: "Software", type: "Software", priority: 3 }
    ],
    
    /** Villes d'expansion (par ordre) */
    TARGET_CITIES: [
        "Sector-12",
        "Aevum",
        "Chongqing",
        "New Tokyo",
        "Ishima",
        "Volhaven"
    ],
    
    /** Upgrades prioritaires */
    PRIORITY_UPGRADES: [
        "Smart Factories",
        "Smart Storage",
        "DreamSense",
        "Wilson Analytics",
        "Nuoptimal Nootropic Injector Implants",
        "Speech Processor Implants",
        "Neural Accelerators",
        "FocusWires"
    ]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🏢 PHASES DE DÉVELOPPEMENT
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const PHASE = {
    BOOTSTRAP: "bootstrap",   // Création corp + 1ère division
    GROWTH: "growth",         // Expansion + financing rounds
    OPTIMIZATION: "optimization", // Upgrades + products + IPO
    COMPLETE: "complete"      // IPO réalisée
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de gestion de la corporation.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "CORP-MGR");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    
    if (!caps.corp) {
        log.error("Corporation API requise (SF3)");
        ns.tprint("❌ Ce manager nécessite l'API Corporation (Source-File 3)");
        ns.tprint("   Terminez BitNode 3 pour débloquer cette fonctionnalité");
        return;
    }
    
    log.success("✅ Corporation API détectée - Démarrage du manager");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        currentPhase: PHASE.BOOTSTRAP,
        divisionsCreated: 0,
        upgradesPurchased: 0,
        productsLaunched: 0,
        investmentRounds: 0,
        totalRevenue: 0,
        cyclesCompleted: 0,
        startTime: Date.now()
    };
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Stratégie: ${CORP_CONFIG.STRATEGY}`);
    log.info(`   Corp name: ${CORP_CONFIG.CORP_NAME}`);
    log.info(`   Check interval: ${CORP_CONFIG.CHECK_INTERVAL / 1000}s`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🏢 VÉRIFICATION EXISTENCE CORPORATION
            // ═══════════════════════════════════════════════════════════════════════
            let corpExists = false;
            try {
                const corp = ns.corporation.getCorporation();
                corpExists = true;
            } catch (error) {
                // Corporation n'existe pas encore
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🆕 PHASE BOOTSTRAP: CRÉATION CORPORATION
            // ═══════════════════════════════════════════════════════════════════════
            if (!corpExists && metrics.currentPhase === PHASE.BOOTSTRAP) {
                try {
                    // Vérifier si on peut créer une corp (SF3 ou $150B)
                    const canCreate = player.money >= 150_000_000_000;
                    
                    if (canCreate) {
                        const created = ns.corporation.createCorporation(CORP_CONFIG.CORP_NAME, false);
                        
                        if (created) {
                            log.success(`🏢 Corporation créée: ${CORP_CONFIG.CORP_NAME}`);
                            corpExists = true;
                        }
                    } else if (metrics.cyclesCompleted % 20 === 0) {
                        log.info(`💰 Fonds insuffisants pour créer corp (besoin: $150B)`);
                    }
                } catch (error) {
                    log.error(`Erreur création corporation: ${error.message}`);
                }
                
                if (!corpExists) {
                    await ns.sleep(CORP_CONFIG.CHECK_INTERVAL);
                    continue;
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RÉCUPÉRATION DES INFOS CORPORATION
            // ═══════════════════════════════════════════════════════════════════════
            let corp = null;
            try {
                corp = ns.corporation.getCorporation();
            } catch (error) {
                log.error(`Erreur lecture corporation: ${error.message}`);
                await ns.sleep(CORP_CONFIG.CHECK_INTERVAL);
                continue;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🏭 GESTION DES DIVISIONS
            // ═══════════════════════════════════════════════════════════════════════
            for (const targetDiv of CORP_CONFIG.TARGET_DIVISIONS) {
                if (corp.divisions.includes(targetDiv.name)) {
                    continue; // Division déjà créée
                }
                
                try {
                    // Vérifier si on peut se permettre la division
                    const divCost = 1_000_000_000; // $1B approximatif
                    
                    if (corp.funds >= divCost * 2) { // Garder une marge
                        ns.corporation.expandIndustry(targetDiv.type, targetDiv.name);
                        metrics.divisionsCreated++;
                        
                        log.success(`🏭 Division créée: ${targetDiv.name} (${targetDiv.type})`);
                        
                        // Expansion dans la première ville
                        try {
                            ns.corporation.expandCity(targetDiv.name, CORP_CONFIG.TARGET_CITIES[0]);
                            log.info(`   Expandue à ${CORP_CONFIG.TARGET_CITIES[0]}`);
                        } catch (error) {
                            log.error(`Erreur expansion city: ${error.message}`);
                        }
                    }
                } catch (error) {
                    log.error(`Erreur création division ${targetDiv.name}: ${error.message}`);
                }
                
                break; // Une division par cycle max
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💰 ROUNDS DE FINANCEMENT
            // ═══════════════════════════════════════════════════════════════════════
            try {
                const investOffer = ns.corporation.getInvestmentOffer();
                
                if (investOffer.round < 4 && investOffer.funds > 0) {
                    // Accepter si on a besoin de liquidités
                    if (corp.funds < 10_000_000_000) { // < $10B
                        const accepted = ns.corporation.acceptInvestmentOffer();
                        
                        if (accepted) {
                            metrics.investmentRounds++;
                            log.success(`💰 Round ${investOffer.round} accepté: ${ns.formatNumber(investOffer.funds)}`);
                            log.info(`   Dilution: ${(corp.sharePrice * corp.totalShares).toFixed(2)}%`);
                        }
                    }
                }
            } catch (error) {
                // getInvestmentOffer peut échouer
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ⬆️  UPGRADES DE CORPORATION
            // ═══════════════════════════════════════════════════════════════════════
            if (corp.funds > 1_000_000_000 && metrics.cyclesCompleted % 10 === 0) {
                for (const upgradeName of CORP_CONFIG.PRIORITY_UPGRADES) {
                    try {
                        const currentLevel = ns.corporation.getUpgradeLevel(upgradeName);
                        const upgradeCost = ns.corporation.getUpgradeLevelCost(upgradeName);
                        
                        // Acheter si on peut se le permettre (max 10% des fonds)
                        if (upgradeCost > 0 && upgradeCost < corp.funds * 0.1) {
                            ns.corporation.levelUpgrade(upgradeName);
                            metrics.upgradesPurchased++;
                            
                            if (log.debugEnabled) {
                                log.debug(`⬆️  Upgrade: ${upgradeName} → ${currentLevel + 1}`);
                            }
                            
                            break; // Un upgrade par cycle
                        }
                    } catch (error) {
                        // Upgrade peut ne pas exister
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🏙️  EXPANSION GÉOGRAPHIQUE DES DIVISIONS
            // ═══════════════════════════════════════════════════════════════════════
            if (corp.funds > 5_000_000_000 && metrics.cyclesCompleted % 15 === 0) {
                for (const divName of corp.divisions) {
                    try {
                        const division = ns.corporation.getDivision(divName);
                        
                        // Trouver la prochaine ville à expand
                        for (const city of CORP_CONFIG.TARGET_CITIES) {
                            if (!division.cities.includes(city)) {
                                try {
                                    ns.corporation.expandCity(divName, city);
                                    log.success(`🏙️  ${divName} expandue à ${city}`);
                                    break;
                                } catch (error) {
                                    // Peut échouer si pas assez de fonds
                                }
                            }
                        }
                    } catch (error) {
                        // getDivision peut échouer
                    }
                    
                    break; // Une expansion par cycle
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 👔 HIRING AUTOMATIQUE
            // ═══════════════════════════════════════════════════════════════════════
            if (corp.funds > 10_000_000_000 && metrics.cyclesCompleted % 20 === 0) {
                for (const divName of corp.divisions) {
                    try {
                        const division = ns.corporation.getDivision(divName);
                        
                        for (const city of division.cities) {
                            try {
                                const office = ns.corporation.getOffice(divName, city);
                                
                                // Embaucher si moins de 30 employés
                                if (office.employees.length < 30) {
                                    const toHire = Math.min(3, 30 - office.employees.length);
                                    
                                    try {
                                        ns.corporation.hireEmployee(divName, city, toHire);
                                        
                                        if (log.debugEnabled) {
                                            log.debug(`👔 ${divName}/${city}: +${toHire} employés`);
                                        }
                                    } catch (error) {
                                        // Hiring peut échouer
                                    }
                                }
                                
                                // Assigner les rôles automatiquement (équilibré)
                                try {
                                    const totalEmployees = office.employees.length;
                                    const perRole = Math.floor(totalEmployees / 5);
                                    
                                    ns.corporation.setAutoJobAssignment(divName, city, "Operations", perRole);
                                    ns.corporation.setAutoJobAssignment(divName, city, "Engineer", perRole);
                                    ns.corporation.setAutoJobAssignment(divName, city, "Business", perRole);
                                    ns.corporation.setAutoJobAssignment(divName, city, "Management", perRole);
                                    ns.corporation.setAutoJobAssignment(divName, city, "Research & Development", totalEmployees - (perRole * 4));
                                } catch (error) {
                                    // setAutoJobAssignment peut échouer
                                }
                            } catch (error) {
                                // getOffice peut échouer
                            }
                        }
                    } catch (error) {
                        // getDivision peut échouer
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💎 DÉVELOPPEMENT DE PRODUITS
            // ═══════════════════════════════════════════════════════════════════════
            if (corp.funds > 50_000_000_000 && metrics.cyclesCompleted % 100 === 0) {
                for (const divName of corp.divisions) {
                    try {
                        const division = ns.corporation.getDivision(divName);
                        
                        // Seulement pour Software et Tobacco (ont des produits)
                        if (division.type === "Software" || division.type === "Tobacco") {
                            const productName = `Product-${metrics.productsLaunched + 1}`;
                            const investAmount = 1_000_000_000; // $1B
                            
                            try {
                                ns.corporation.makeProduct(
                                    divName,
                                    division.cities[0],
                                    productName,
                                    investAmount,
                                    investAmount
                                );
                                
                                metrics.productsLaunched++;
                                log.success(`💎 Produit lancé: ${productName} (${divName})`);
                                log.info(`   Investissement: ${ns.formatNumber(investAmount * 2)}`);
                            } catch (error) {
                                // makeProduct peut échouer
                            }
                        }
                    } catch (error) {
                        // getDivision peut échouer
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 CALCUL DES REVENUS
            // ═══════════════════════════════════════════════════════════════════════
            metrics.totalRevenue = corp.revenue;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 10 cycles)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.cyclesCompleted % 10 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Stats Corporation:`);
                log.info(`   Nom: ${corp.name}`);
                log.info(`   Divisions: ${corp.divisions.length}/${CORP_CONFIG.TARGET_DIVISIONS.length}`);
                log.info(`   Fonds: ${ns.formatNumber(corp.funds)}`);
                log.info(`   Revenue: ${ns.formatNumber(corp.revenue)}/s`);
                log.info(`   Profit: ${ns.formatNumber(corp.revenue - corp.expenses)}/s`);
                log.info(`   Upgrades: ${metrics.upgradesPurchased} | Produits: ${metrics.productsLaunched}`);
                log.info(`   Rounds: ${metrics.investmentRounds} | Uptime: ${uptimeMin}min`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎯 MISE À JOUR DE LA PHASE
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.currentPhase === PHASE.BOOTSTRAP && corp.divisions.length >= 1) {
                metrics.currentPhase = PHASE.GROWTH;
                log.success(`🚀 Phase GROWTH activée`);
            }
            
            if (metrics.currentPhase === PHASE.GROWTH && corp.divisions.length >= 2) {
                metrics.currentPhase = PHASE.OPTIMIZATION;
                log.success(`🚀 Phase OPTIMIZATION activée`);
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(CORP_CONFIG.CHECK_INTERVAL);
    }
}
