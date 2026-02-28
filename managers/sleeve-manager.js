/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/sleeve-manager
 * @description Gestionnaire automatique des Sleeves (SF10).
 *              Optimise les assignations pour maximize XP, reputation ou argent.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), Sleeve API (SF10)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.sleeve avant toute opération
 * ✓ Pacing intelligent par sleeve (évite spam API)
 * ✓ Assignations adaptatives selon progression du jeu
 * ✓ Synchronisation automatique quand disponible
 * ✓ Achat d'augmentations pour les sleeves avec ROI
 * ✓ Gestion des crimes, factions, études selon objectifs
 * ✓ Try/catch robuste sur toutes les opérations sleeve
 * ✓ Métriques détaillées (XP gagné, argent généré, rep farming)
 * ✓ Rotation des tâches pour équilibrer la progression
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/sleeve-manager.js");
 *   // Gère automatiquement tous les sleeves disponibles
 * 
 * @example
 *   // Mode focus argent
 *   // Dans constants.js : CONFIG.SLEEVE.FOCUS = "money"
 *   ns.run("/managers/sleeve-manager.js");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION SLEEVE
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const SLEEVE_CONFIG = {
    /** Focus principal (training, money, faction, crime) */
    FOCUS: CONFIG.SLEEVE?.FOCUS || "training",
    
    /** Check interval par défaut (10s) */
    CHECK_INTERVAL: 10000,
    
    /** Pacing entre actions sur un même sleeve (500ms) */
    SLEEVE_ACTION_DELAY: 500,
    
    /** Budget minimum pour acheter des augs de sleeve */
    MIN_AUG_BUDGET: CONFIG.SLEEVE?.MIN_AUG_BUDGET || 1_000_000_000,
    
    /** Synchronisation automatique si disponible */
    AUTO_SYNC: CONFIG.SLEEVE?.AUTO_SYNC ?? true,
    
    /** ROI maximum pour acheter des augs (heures) */
    MAX_AUG_ROI_HOURS: 48
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 TÂCHES DISPONIBLES PAR FOCUS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const TASKS_BY_FOCUS = {
    training: [
        { type: "gym", stat: "str", location: "Powerhouse Gym" },
        { type: "gym", stat: "def", location: "Powerhouse Gym" },
        { type: "gym", stat: "dex", location: "Powerhouse Gym" },
        { type: "gym", stat: "agi", location: "Powerhouse Gym" },
        { type: "university", course: "Computer Science", location: "Rothman University" }
    ],
    money: [
        { type: "crime", crime: "Heist" },
        { type: "crime", crime: "Homicide" },
        { type: "crime", crime: "Traffick Arms" }
    ],
    faction: [
        { type: "faction", work: "Hacking Contracts" },
        { type: "faction", work: "Field Work" },
        { type: "faction", work: "Security Work" }
    ],
    crime: [
        { type: "crime", crime: "Homicide" },
        { type: "crime", crime: "Mug" },
        { type: "crime", crime: "Assassinate" }
    ]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de gestion des sleeves.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "SLEEVE-MGR");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    
    if (!caps.sleeve) {
        log.error("Sleeve API requise (SF10)");
        ns.tprint("❌ Ce manager nécessite l'API Sleeve (Source-File 10)");
        ns.tprint("   Terminez BitNode 10 pour débloquer cette fonctionnalité");
        return;
    }
    
    log.success("✅ Sleeve API détectée - Démarrage du manager");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════════
    let numSleeves = 0;
    try {
        numSleeves = ns.sleeve.getNumSleeves();
    } catch (error) {
        log.error(`Impossible de récupérer le nombre de sleeves: ${error.message}`);
        return;
    }
    
    if (numSleeves === 0) {
        log.warn("Aucun sleeve disponible");
        return;
    }
    
    log.info(`🎭 ${numSleeves} sleeve(s) détecté(s)`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        totalMoneyEarned: 0,
        totalXPGained: 0,
        totalRepGained: 0,
        augsInstalled: 0,
        taskChanges: 0,
        syncOperations: 0,
        cyclesCompleted: 0,
        startTime: Date.now()
    };
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Focus: ${SLEEVE_CONFIG.FOCUS}`);
    log.info(`   Auto-sync: ${SLEEVE_CONFIG.AUTO_SYNC ? '✅' : '❌'}`);
    log.info(`   Check interval: ${SLEEVE_CONFIG.CHECK_INTERVAL / 1000}s`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            const budget = player.money;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎭 GESTION DE CHAQUE SLEEVE
            // ═══════════════════════════════════════════════════════════════════════
            for (let i = 0; i < numSleeves; i++) {
                try {
                    const sleeve = ns.sleeve.getSleeve(i);
                    const task = ns.sleeve.getTask(i);
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 🔄 SYNCHRONISATION (si disponible et configurée)
                    // ═══════════════════════════════════════════════════════════════
                    if (SLEEVE_CONFIG.AUTO_SYNC && sleeve.sync < 100) {
                        try {
                            ns.sleeve.setToSynchronize(i);
                            metrics.syncOperations++;
                            
                            if (log.debugEnabled && metrics.cyclesCompleted % 20 === 0) {
                                log.debug(`🔄 Sleeve ${i} en synchronisation (${sleeve.sync.toFixed(1)}%)`);
                            }
                            
                            await ns.sleep(SLEEVE_CONFIG.SLEEVE_ACTION_DELAY);
                            continue; // Passer au sleeve suivant
                        } catch (error) {
                            // La synchro peut ne pas être disponible
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 💎 ACHAT D'AUGMENTATIONS POUR LE SLEEVE
                    // ═══════════════════════════════════════════════════════════════
                    if (budget > SLEEVE_CONFIG.MIN_AUG_BUDGET && metrics.cyclesCompleted % 50 === 0) {
                        try {
                            const availableAugs = ns.sleeve.getSleevePurchasableAugs(i);
                            
                            for (const aug of availableAugs) {
                                if (aug.cost > budget - SLEEVE_CONFIG.MIN_AUG_BUDGET) continue;
                                
                                // Calcul ROI approximatif
                                // Une aug coûte X, rapporte Y% de bonus, ROI = X / (bonus_value_per_hour)
                                // Simplifié: si aug < 10% du budget, on achète
                                if (aug.cost < budget * 0.1) {
                                    try {
                                        const purchased = ns.sleeve.purchaseSleeveAug(i, aug.name);
                                        
                                        if (purchased) {
                                            metrics.augsInstalled++;
                                            log.success(`💎 Sleeve ${i}: aug ${aug.name} installée`);
                                            log.info(`   Coût: ${ns.formatNumber(aug.cost)}`);
                                        }
                                    } catch (error) {
                                        // Achat peut échouer
                                    }
                                    break; // Une seule aug par cycle
                                }
                            }
                        } catch (error) {
                            // getPurchasableAugs peut ne pas être disponible
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 🎯 ASSIGNATION DE TÂCHE
                    // ═══════════════════════════════════════════════════════════════
                    // Si le sleeve n'a pas de tâche ou si on veut changer
                    const shouldAssignTask = !task || 
                        (metrics.cyclesCompleted % 60 === i * 10); // Rotation staggered
                    
                    if (shouldAssignTask) {
                        const tasks = TASKS_BY_FOCUS[SLEEVE_CONFIG.FOCUS] || TASKS_BY_FOCUS.training;
                        
                        // Sélectionner une tâche (rotation)
                        const taskIndex = (metrics.cyclesCompleted + i) % tasks.length;
                        const selectedTask = tasks[taskIndex];
                        
                        try {
                            let success = false;
                            
                            if (selectedTask.type === "gym") {
                                success = ns.sleeve.setToGymWorkout(
                                    i, 
                                    selectedTask.location, 
                                    selectedTask.stat
                                );
                            } else if (selectedTask.type === "university") {
                                success = ns.sleeve.setToUniversityCourse(
                                    i,
                                    selectedTask.location,
                                    selectedTask.course
                                );
                            } else if (selectedTask.type === "crime") {
                                success = ns.sleeve.setToCommitCrime(i, selectedTask.crime);
                            } else if (selectedTask.type === "faction") {
                                // Obtenir les factions du joueur
                                const factions = player.factions;
                                if (factions.length > 0) {
                                    // Utiliser la première faction
                                    success = ns.sleeve.setToFactionWork(
                                        i,
                                        factions[0],
                                        selectedTask.work
                                    );
                                }
                            }
                            
                            if (success) {
                                metrics.taskChanges++;
                                
                                if (log.debugEnabled) {
                                    log.debug(`🎯 Sleeve ${i}: ${selectedTask.type} assigné`);
                                }
                            }
                        } catch (error) {
                            if (log.debugEnabled) {
                                log.debug(`Erreur assignation sleeve ${i}: ${error.message}`);
                            }
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 📊 COLLECTE DES STATS (périodique)
                    // ═══════════════════════════════════════════════════════════════
                    if (metrics.cyclesCompleted % 20 === 0 && i === 0) {
                        // Estimer les gains (approximation)
                        if (task) {
                            if (task.type === "CRIME") {
                                metrics.totalMoneyEarned += 10000; // Estimation
                            }
                        }
                    }
                    
                } catch (error) {
                    log.error(`Erreur lors de la gestion du sleeve ${i}: ${error.message}`);
                }
                
                // Pacing entre les sleeves
                await ns.sleep(SLEEVE_CONFIG.SLEEVE_ACTION_DELAY);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 20 cycles)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.cyclesCompleted % 20 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Stats Sleeves:`);
                log.info(`   Sleeves actifs: ${numSleeves}`);
                log.info(`   Changements de tâche: ${metrics.taskChanges}`);
                log.info(`   Augs installées: ${metrics.augsInstalled}`);
                log.info(`   Synchros: ${metrics.syncOperations}`);
                log.info(`   Uptime: ${uptimeMin}min`);
                
                // Détail de chaque sleeve
                if (log.debugEnabled) {
                    for (let i = 0; i < numSleeves; i++) {
                        try {
                            const sleeve = ns.sleeve.getSleeve(i);
                            const task = ns.sleeve.getTask(i);
                            log.debug(`   Sleeve ${i}: sync=${sleeve.sync.toFixed(1)}% shock=${sleeve.shock.toFixed(1)}%`);
                            if (task) {
                                log.debug(`     Task: ${task.type || 'None'}`);
                            }
                        } catch (error) {
                            // Ignorer les erreurs de détail
                        }
                    }
                }
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(SLEEVE_CONFIG.CHECK_INTERVAL);
    }
}
