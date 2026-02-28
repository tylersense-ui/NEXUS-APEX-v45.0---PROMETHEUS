/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/gang-manager
 * @description Gestionnaire automatique des Gangs (SF2).
 *              Recrute, équipe, assigne et ascensionne les membres du gang.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), Gang API (SF2)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.gang avant toute opération
 * ✓ Recrutement automatique jusqu'à la limite (12 membres)
 * ✓ Équipement intelligent par budget et ROI
 * ✓ Ascension automatique avec seuil de multiplicateur
 * ✓ Assignation de tâches selon le focus (money, respect, wanted)
 * ✓ Gestion du territoire et des guerres de gangs
 * ✓ Rate limiting sur équipement et ascension
 * ✓ Try/catch robuste sur TOUTES les opérations gang
 * ✓ Métriques détaillées (respect, argent, wanted, territoire)
 * ✓ Logs professionnels avec contexte et progression
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/gang-manager.js");
 *   // Gère automatiquement le gang (recrutement, équipement, tâches)
 * 
 * @example
 *   // Mode focus respect (pour débloquer des actions)
 *   // Dans constants.js : CONFIG.GANG.FOCUS = "respect"
 *   ns.run("/managers/gang-manager.js");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION GANG
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const GANG_CONFIG = {
    /** Focus principal (money, respect, wanted_reduction, territory) */
    FOCUS: CONFIG.GANG?.FOCUS || "money",
    
    /** Check interval (5s) */
    CHECK_INTERVAL: 5000,
    
    /** Budget minimum pour acheter de l'équipement */
    MIN_EQUIPMENT_BUDGET: CONFIG.GANG?.MIN_EQUIPMENT_BUDGET || 100_000_000,
    
    /** Seuil de multiplicateur pour ascension (1.5 = +50% de stats) */
    ASCENSION_THRESHOLD: CONFIG.GANG?.ASCENSION_THRESHOLD || 1.5,
    
    /** Enable territoire warfare */
    ENABLE_WARFARE: CONFIG.GANG?.ENABLE_WARFARE ?? true,
    
    /** Territoire minimum avant d'activer warfare (%) */
    MIN_TERRITORY_FOR_WAR: 0.10, // 10%
    
    /** Rate limit: équipement (1 achat toutes les 10 cycles) */
    EQUIPMENT_RATE_LIMIT: 10,
    
    /** Rate limit: ascension (1 tentative toutes les 100 cycles) */
    ASCENSION_RATE_LIMIT: 100
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 TÂCHES PAR FOCUS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const TASKS_BY_FOCUS = {
    money: "Human Trafficking", // Max money
    respect: "Terrorism", // Max respect
    wanted_reduction: "Vigilante Justice", // Réduit wanted level
    territory: "Territory Warfare", // Conquête de territoire
    training: "Train Combat" // Entraînement
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de gestion du gang.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "GANG-MGR");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    
    if (!caps.gang) {
        log.error("Gang API requise (SF2 + gang créé)");
        ns.tprint("❌ Ce manager nécessite l'API Gang (Source-File 2)");
        ns.tprint("   1. Terminez BitNode 2 pour débloquer l'API");
        ns.tprint("   2. Créez un gang via Singularity ou manuellement");
        return;
    }
    
    log.success("✅ Gang API détectée - Démarrage du manager");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        membersRecruited: 0,
        equipmentPurchased: 0,
        ascensionsPerformed: 0,
        taskChanges: 0,
        totalRespectGained: 0,
        totalMoneyGained: 0,
        cyclesCompleted: 0,
        startTime: Date.now()
    };
    
    // Rate limiting
    let lastEquipmentCycle = 0;
    let lastAscensionCycle = 0;
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Focus: ${GANG_CONFIG.FOCUS}`);
    log.info(`   Ascension threshold: ${GANG_CONFIG.ASCENSION_THRESHOLD}x`);
    log.info(`   Warfare: ${GANG_CONFIG.ENABLE_WARFARE ? '✅' : '❌'}`);
    log.info(`   Check interval: ${GANG_CONFIG.CHECK_INTERVAL / 1000}s`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            const budget = player.money;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 INFORMATIONS DU GANG
            // ═══════════════════════════════════════════════════════════════════════
            let gangInfo = null;
            let members = [];
            
            try {
                gangInfo = ns.gang.getGangInformation();
                members = ns.gang.getMemberNames();
            } catch (error) {
                log.error(`Erreur lecture info gang: ${error.message}`);
                await ns.sleep(GANG_CONFIG.CHECK_INTERVAL);
                continue;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 👥 RECRUTEMENT DE NOUVEAUX MEMBRES
            // ═══════════════════════════════════════════════════════════════════════
            try {
                const canRecruit = ns.gang.canRecruitMember();
                
                if (canRecruit && members.length < 12) {
                    const newName = `Member-${members.length + 1}`;
                    const recruited = ns.gang.recruitMember(newName);
                    
                    if (recruited) {
                        metrics.membersRecruited++;
                        log.success(`👥 Nouveau membre recruté: ${newName}`);
                        log.info(`   Total membres: ${members.length + 1}/12`);
                    }
                }
            } catch (error) {
                log.error(`Erreur recrutement: ${error.message}`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎯 GESTION DE CHAQUE MEMBRE
            // ═══════════════════════════════════════════════════════════════════════
            for (const memberName of members) {
                try {
                    const memberInfo = ns.gang.getMemberInformation(memberName);
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 💪 ASCENSION (avec rate limiting)
                    // ═══════════════════════════════════════════════════════════════
                    if (metrics.cyclesCompleted - lastAscensionCycle >= GANG_CONFIG.ASCENSION_RATE_LIMIT) {
                        try {
                            const ascensionResult = ns.gang.getAscensionResult(memberName);
                            
                            if (ascensionResult) {
                                // Vérifier si l'ascension est rentable
                                const avgMultiplier = (
                                    ascensionResult.str + 
                                    ascensionResult.def + 
                                    ascensionResult.dex + 
                                    ascensionResult.agi
                                ) / 4;
                                
                                if (avgMultiplier >= GANG_CONFIG.ASCENSION_THRESHOLD) {
                                    const ascended = ns.gang.ascendMember(memberName);
                                    
                                    if (ascended) {
                                        metrics.ascensionsPerformed++;
                                        lastAscensionCycle = metrics.cyclesCompleted;
                                        
                                        log.success(`💪 ${memberName} ascensionné`);
                                        log.info(`   Multiplicateur: ${avgMultiplier.toFixed(2)}x`);
                                    }
                                }
                            }
                        } catch (error) {
                            // getAscensionResult peut retourner null
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 🛡️  ÉQUIPEMENT (avec rate limiting)
                    // ═══════════════════════════════════════════════════════════════
                    if (budget > GANG_CONFIG.MIN_EQUIPMENT_BUDGET && 
                        metrics.cyclesCompleted - lastEquipmentCycle >= GANG_CONFIG.EQUIPMENT_RATE_LIMIT) {
                        
                        try {
                            const equipment = ns.gang.getEquipmentNames();
                            
                            for (const equipName of equipment) {
                                // Vérifier si le membre a déjà cet équipement
                                if (memberInfo.upgrades.includes(equipName) || 
                                    memberInfo.augmentations.includes(equipName)) {
                                    continue;
                                }
                                
                                const equipCost = ns.gang.getEquipmentCost(equipName);
                                
                                // Acheter si abordable (max 5% du budget)
                                if (equipCost > 0 && equipCost < budget * 0.05) {
                                    try {
                                        const purchased = ns.gang.purchaseEquipment(memberName, equipName);
                                        
                                        if (purchased) {
                                            metrics.equipmentPurchased++;
                                            lastEquipmentCycle = metrics.cyclesCompleted;
                                            
                                            if (log.debugEnabled) {
                                                log.debug(`🛡️  ${memberName}: ${equipName} acheté (${ns.formatNumber(equipCost)})`);
                                            }
                                            
                                            break; // Un seul équipement par cycle par membre
                                        }
                                    } catch (error) {
                                        // Achat peut échouer
                                    }
                                }
                            }
                        } catch (error) {
                            log.error(`Erreur achat équipement: ${error.message}`);
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 🎯 ASSIGNATION DE TÂCHE
                    // ═══════════════════════════════════════════════════════════════
                    const currentTask = memberInfo.task;
                    let desiredTask = TASKS_BY_FOCUS[GANG_CONFIG.FOCUS] || "Human Trafficking";
                    
                    // Override: si wanted level trop élevé, réduire
                    if (gangInfo.wantedLevel > 1000) {
                        desiredTask = "Vigilante Justice";
                    }
                    
                    // Override: si membres faibles, entraîner
                    if (memberInfo.str < 100 || memberInfo.def < 100) {
                        desiredTask = "Train Combat";
                    }
                    
                    if (currentTask !== desiredTask) {
                        try {
                            const assigned = ns.gang.setMemberTask(memberName, desiredTask);
                            
                            if (assigned) {
                                metrics.taskChanges++;
                                
                                if (log.debugEnabled) {
                                    log.debug(`🎯 ${memberName}: ${currentTask} → ${desiredTask}`);
                                }
                            }
                        } catch (error) {
                            log.error(`Erreur assignation tâche ${memberName}: ${error.message}`);
                        }
                    }
                    
                } catch (error) {
                    log.error(`Erreur gestion membre ${memberName}: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🗺️  GESTION DU TERRITOIRE
            // ═══════════════════════════════════════════════════════════════════════
            if (GANG_CONFIG.ENABLE_WARFARE) {
                try {
                    const territory = gangInfo.territory;
                    const power = gangInfo.power;
                    
                    // Activer warfare si on a assez de territoire et de puissance
                    if (territory >= GANG_CONFIG.MIN_TERRITORY_FOR_WAR && power > 100) {
                        const currentWarfare = gangInfo.territoryWarfareEngaged;
                        
                        if (!currentWarfare) {
                            ns.gang.setTerritoryWarfare(true);
                            log.info(`🗺️  Guerre de territoire activée (${(territory * 100).toFixed(1)}%)`);
                        }
                    } else {
                        // Désactiver si on est trop faible
                        if (gangInfo.territoryWarfareEngaged && power < 50) {
                            ns.gang.setTerritoryWarfare(false);
                            log.warn(`⚠️  Guerre de territoire désactivée (puissance trop faible)`);
                        }
                    }
                } catch (error) {
                    log.error(`Erreur gestion territoire: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 20 cycles)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.cyclesCompleted % 20 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Stats Gang:`);
                log.info(`   Faction: ${gangInfo.faction}`);
                log.info(`   Membres: ${members.length}/12`);
                log.info(`   Respect: ${ns.formatNumber(gangInfo.respect)}`);
                log.info(`   Wanted: ${ns.formatNumber(gangInfo.wantedLevel)}`);
                log.info(`   Territoire: ${(gangInfo.territory * 100).toFixed(1)}%`);
                log.info(`   Puissance: ${ns.formatNumber(gangInfo.power)}`);
                log.info(`   Recrues: ${metrics.membersRecruited} | Équipement: ${metrics.equipmentPurchased}`);
                log.info(`   Ascensions: ${metrics.ascensionsPerformed} | Uptime: ${uptimeMin}min`);
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(GANG_CONFIG.CHECK_INTERVAL);
    }
}
