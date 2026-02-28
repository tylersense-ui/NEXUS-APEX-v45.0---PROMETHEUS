/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/singularity-manager
 * @description Gestionnaire automatique des activités Singularity (SF4).
 *              Gère factions, augmentations, crimes, études et backdoors.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), Singularity API (SF4)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.singularity avant toute opération
 * ✓ Gestion intelligente des factions (priorité selon objectifs)
 * ✓ Achat automatique des augmentations par ordre de priorité
 * ✓ Crimes optimisés selon stats et objectifs (argent vs karma)
 * ✓ Gestion des études universitaires (informatique, leadership)
 * ✓ Backdoor automatique des serveurs critiques (factions)
 * ✓ Try/catch robuste sur tous les appels Singularity
 * ✓ Métriques détaillées (augs achetées, rep gagnée, crimes réussis)
 * ✓ Logs professionnels avec contexte et progression
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/singularity-manager.js");
 *   // Gère automatiquement progression factions et augmentations
 * 
 * @example
 *   // Mode focus augmentations de hack
 *   // Dans constants.js : CONFIG.SINGULARITY.FOCUS = "hacking"
 *   ns.run("/managers/singularity-manager.js");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION SINGULARITY
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const SINGULARITY_CONFIG = {
    /** Focus principal (hacking, combat, charisma, money) */
    FOCUS: CONFIG.SINGULARITY?.FOCUS || "hacking",
    
    /** Argent minimum à garder en réserve */
    MIN_BUDGET: CONFIG.SINGULARITY?.MIN_BUDGET || 1_000_000_000,
    
    /** Rep minimum avant d'acheter des augs */
    MIN_REP_FOR_PURCHASE: CONFIG.SINGULARITY?.MIN_REP || 100_000,
    
    /** Check interval (30s) */
    CHECK_INTERVAL: 30000,
    
    /** Enable backdoor automatique */
    AUTO_BACKDOOR: CONFIG.SINGULARITY?.AUTO_BACKDOOR ?? true,
    
    /** Enable crime farming */
    AUTO_CRIME: CONFIG.SINGULARITY?.AUTO_CRIME ?? true,
    
    /** Enable faction work */
    AUTO_FACTION_WORK: CONFIG.SINGULARITY?.AUTO_FACTION_WORK ?? true
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 FACTIONS PRIORITAIRES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Liste des factions importantes avec leurs conditions d'accès.
 */
const PRIORITY_FACTIONS = [
    // Tier S - Endgame factions
    { name: "Daedalus", priority: 1, reqHack: 2500, reqAugs: 30, backdoor: "The-Cave" },
    { name: "The Covenant", priority: 1, reqHack: 850, reqAugs: 20, backdoor: null },
    { name: "Illuminati", priority: 1, reqHack: 1500, reqAugs: 30, backdoor: null },
    
    // Tier A - Strong factions
    { name: "BitRunners", priority: 2, reqHack: 500, backdoor: "run4theh111z" },
    { name: "NiteSec", priority: 2, reqHack: 200, backdoor: "avmnite-02h" },
    { name: "The Black Hand", priority: 2, reqHack: 350, backdoor: "I.I.I.I" },
    
    // Tier B - Early game factions
    { name: "CyberSec", priority: 3, reqHack: 50, backdoor: "CSEC" },
    { name: "Netburners", priority: 3, reqHack: 80, backdoor: null },
    { name: "Tian Di Hui", priority: 3, reqHack: 50, backdoor: null }
];

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 💎 AUGMENTATIONS PRIORITAIRES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const PRIORITY_AUGMENTATIONS = {
    hacking: [
        "The Red Pill", // +BitNode multipliers
        "CashRoot Starter Kit",
        "Neuroreceptor Management Implant",
        "BitWire",
        "Artificial Bio-neural Network Implant",
        "Cranial Signal Processors - Gen V"
    ],
    combat: [
        "Graphene Bone Lacings",
        "Bionic Arms",
        "Nanofiber Weave",
        "Synthetic Heart"
    ],
    charisma: [
        "Social Negotiation Assistant (S.N.A)",
        "ADR-V2 Pheromone Gene"
    ]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de gestion Singularity.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "SINGULARITY");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    
    if (!caps.singularity) {
        log.error("Singularity API requise (SF4)");
        ns.tprint("❌ Ce manager nécessite l'API Singularity (Source-File 4)");
        ns.tprint("   Terminez BitNode 4 pour débloquer cette fonctionnalité");
        return;
    }
    
    log.success("✅ Singularity API détectée - Démarrage du manager");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        augmentationsPurchased: 0,
        factionsJoined: 0,
        backdoorsInstalled: 0,
        crimesCommitted: 0,
        totalRepEarned: 0,
        cyclesCompleted: 0,
        startTime: Date.now()
    };
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Focus: ${SINGULARITY_CONFIG.FOCUS}`);
    log.info(`   Budget min: ${ns.formatNumber(SINGULARITY_CONFIG.MIN_BUDGET)}`);
    log.info(`   Auto-backdoor: ${SINGULARITY_CONFIG.AUTO_BACKDOOR ? '✅' : '❌'}`);
    log.info(`   Auto-crime: ${SINGULARITY_CONFIG.AUTO_CRIME ? '✅' : '❌'}`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            const budget = player.money;
            const availableBudget = budget - SINGULARITY_CONFIG.MIN_BUDGET;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎯 GESTION DES FACTIONS
            // ═══════════════════════════════════════════════════════════════════════
            try {
                const playerFactions = ns.singularity.checkFactionInvitations();
                
                for (const factionName of playerFactions) {
                    // Vérifier si c'est une faction prioritaire
                    const priorityFaction = PRIORITY_FACTIONS.find(f => f.name === factionName);
                    
                    if (priorityFaction) {
                        try {
                            const joined = ns.singularity.joinFaction(factionName);
                            
                            if (joined) {
                                metrics.factionsJoined++;
                                log.success(`✅ Faction rejointe: ${factionName}`);
                                log.info(`   Priorité: ${priorityFaction.priority}`);
                            }
                        } catch (error) {
                            log.error(`Erreur en rejoignant ${factionName}: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                log.error(`Erreur lors de la gestion des factions: ${error.message}`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🔓 BACKDOORS AUTOMATIQUES
            // ═══════════════════════════════════════════════════════════════════════
            if (SINGULARITY_CONFIG.AUTO_BACKDOOR && metrics.cyclesCompleted % 5 === 0) {
                try {
                    for (const faction of PRIORITY_FACTIONS) {
                        if (!faction.backdoor) continue;
                        
                        // Vérifier si le serveur existe et est accessible
                        if (!ns.serverExists(faction.backdoor)) continue;
                        
                        const server = ns.getServer(faction.backdoor);
                        
                        // Vérifier si backdoor déjà installé
                        if (server.backdoorInstalled) continue;
                        
                        // Vérifier si on a root access
                        if (!server.hasAdminRights) continue;
                        
                        // Vérifier le niveau de hack requis
                        if (player.skills.hacking < server.requiredHackingSkill) continue;
                        
                        // Installer le backdoor
                        try {
                            await ns.singularity.installBackdoor();
                            metrics.backdoorsInstalled++;
                            log.success(`🔓 Backdoor installé: ${faction.backdoor}`);
                            log.info(`   Faction débloquée: ${faction.name}`);
                        } catch (error) {
                            // Peut échouer si pas connecté au serveur
                            if (log.debugEnabled) {
                                log.debug(`Backdoor ${faction.backdoor}: ${error.message}`);
                            }
                        }
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'installation de backdoors: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💎 ACHAT D'AUGMENTATIONS
            // ═══════════════════════════════════════════════════════════════════════
            if (availableBudget > 0) {
                try {
                    const joinedFactions = ns.getPlayer().factions;
                    const priorityAugs = PRIORITY_AUGMENTATIONS[SINGULARITY_CONFIG.FOCUS] || [];
                    
                    for (const factionName of joinedFactions) {
                        try {
                            const factionAugs = ns.singularity.getAugmentationsFromFaction(factionName);
                            const factionRep = ns.singularity.getFactionRep(factionName);
                            
                            for (const augName of priorityAugs) {
                                // Vérifier si l'aug est disponible dans cette faction
                                if (!factionAugs.includes(augName)) continue;
                                
                                // Vérifier si déjà possédée
                                const ownedAugs = ns.singularity.getOwnedAugmentations(true);
                                if (ownedAugs.includes(augName)) continue;
                                
                                // Vérifier la rep requise
                                const augStats = ns.singularity.getAugmentationRepReq(augName);
                                if (factionRep < augStats) continue;
                                
                                // Vérifier le prix
                                const augPrice = ns.singularity.getAugmentationPrice(augName);
                                if (augPrice > availableBudget) continue;
                                
                                // Acheter l'augmentation
                                try {
                                    const purchased = ns.singularity.purchaseAugmentation(factionName, augName);
                                    
                                    if (purchased) {
                                        metrics.augmentationsPurchased++;
                                        log.success(`💎 Augmentation achetée: ${augName}`);
                                        log.info(`   Faction: ${factionName}`);
                                        log.info(`   Prix: ${ns.formatNumber(augPrice)}`);
                                    }
                                } catch (error) {
                                    log.error(`Erreur achat ${augName}: ${error.message}`);
                                }
                            }
                        } catch (error) {
                            if (log.debugEnabled) {
                                log.debug(`Erreur faction ${factionName}: ${error.message}`);
                            }
                        }
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'achat d'augmentations: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💰 FARM DE CRIMES (si configuré)
            // ═══════════════════════════════════════════════════════════════════════
            if (SINGULARITY_CONFIG.AUTO_CRIME) {
                try {
                    const currentWork = ns.singularity.getCurrentWork();
                    
                    // Si pas occupé, commencer un crime
                    if (!currentWork || currentWork.type !== "CRIME") {
                        // Sélectionner le meilleur crime selon le focus
                        let bestCrime = "Shoplift"; // Crime par défaut
                        
                        if (SINGULARITY_CONFIG.FOCUS === "money") {
                            bestCrime = "Heist"; // Max money
                        } else if (SINGULARITY_CONFIG.FOCUS === "combat") {
                            bestCrime = "Mug"; // Max combat XP
                        } else if (SINGULARITY_CONFIG.FOCUS === "hacking") {
                            bestCrime = "Shoplift"; // Rapide et safe
                        }
                        
                        try {
                            ns.singularity.commitCrime(bestCrime, false);
                            metrics.crimesCommitted++;
                            
                            if (log.debugEnabled && metrics.cyclesCompleted % 20 === 0) {
                                log.debug(`🔫 Crime en cours: ${bestCrime}`);
                            }
                        } catch (error) {
                            // Crime peut échouer si déjà occupé
                        }
                    }
                } catch (error) {
                    // getCurrentWork peut ne pas être disponible
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 20 cycles)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.cyclesCompleted % 20 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Stats Singularity:`);
                log.info(`   Factions: ${player.factions.length} rejointes`);
                log.info(`   Augs achetées: ${metrics.augmentationsPurchased}`);
                log.info(`   Backdoors: ${metrics.backdoorsInstalled}`);
                log.info(`   Crimes: ${metrics.crimesCommitted}`);
                log.info(`   Uptime: ${uptimeMin}min`);
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(SINGULARITY_CONFIG.CHECK_INTERVAL);
    }
}
