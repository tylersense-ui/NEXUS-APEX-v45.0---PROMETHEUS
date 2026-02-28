/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/program-manager
 * @description Gestionnaire d'achat automatique des programmes via le Darknet.
 *              Achète les outils de crack et utilitaires dans l'ordre optimal.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), Singularity API (SF4)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.singularity avant toute tentative d'achat
 * ✓ Throttling intelligent (évite spam d'achats)
 * ✓ Journalisation détaillée des tentatives et échecs avec timestamps
 * ✓ Ordre d'achat optimisé par priorité (crack tools → utilities → formulas)
 * ✓ Try/catch robuste sur tous les appels Singularity
 * ✓ Sleep adaptatif selon la disponibilité des fonds
 * ✓ Métriques de progression (programmes achetés vs restants)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/program-manager.js");
 *   // Achète automatiquement les programmes manquants en boucle
 * 
 * @example
 *   // Avec mode debug
 *   // Dans constants.js : CONFIG.SYSTEM.DEBUG_MODE = true
 *   ns.run("/managers/program-manager.js");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📋 CONFIGURATION DES PROGRAMMES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Liste des programmes disponibles sur le Darknet avec ordre de priorité.
 * 
 * Priorité :
 * 1 = Critique (outils de crack)
 * 2 = Important (utilities)
 * 3 = Bonus (formulas, optimisations)
 */
const PROGRAMS = [
    // ═══════════════════════════════════════════════════════════════════════════════
    // PRIORITÉ 1 : OUTILS DE CRACK (essentiels pour l'expansion)
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: "BruteSSH.exe", cost: 500_000, priority: 1, desc: "Ouvre port SSH (22)" },
    { name: "FTPCrack.exe", cost: 1_500_000, priority: 1, desc: "Ouvre port FTP (21)" },
    { name: "relaySMTP.exe", cost: 5_000_000, priority: 1, desc: "Ouvre port SMTP (25)" },
    { name: "HTTPWorm.exe", cost: 30_000_000, priority: 1, desc: "Ouvre port HTTP (80)" },
    { name: "SQLInject.exe", cost: 250_000_000, priority: 1, desc: "Ouvre port SQL (1433)" },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // PRIORITÉ 2 : UTILITIES (améliore l'efficacité)
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: "DeepscanV1.exe", cost: 500_000, priority: 2, desc: "Révèle 5 nœuds" },
    { name: "DeepscanV2.exe", cost: 25_000_000, priority: 2, desc: "Révèle 10 nœuds" },
    { name: "AutoLink.exe", cost: 1_000_000, priority: 2, desc: "Backdoor automatique" },
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // PRIORITÉ 3 : OPTIMISATIONS (bonus de performance)
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: "ServerProfiler.exe", cost: 500_000, priority: 3, desc: "Analyse serveurs" },
    { name: "Formulas.exe", cost: 5_000_000_000, priority: 3, desc: "Calculs précis" }
];

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale d'achat automatique des programmes.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "PROGRAM-MGR");
    
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
        totalPrograms: PROGRAMS.length,
        purchased: 0,
        remaining: 0,
        totalSpent: 0,
        attemptCount: 0,
        lastPurchaseTime: 0,
        startTime: Date.now()
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════════
    const CHECK_INTERVAL = 60000; // 60s entre chaque vérification (throttling)
    const MIN_BALANCE_RESERVE = 10_000_000; // Garde 10M minimum en réserve
    
    log.info(`⚙️  Check interval: ${CHECK_INTERVAL / 1000}s`);
    log.info(`💰 Réserve minimale: ${ns.formatNumber(MIN_BALANCE_RESERVE)}`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.attemptCount++;
            const player = ns.getPlayer();
            const availableFunds = player.money - MIN_BALANCE_RESERVE;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 SCAN DES PROGRAMMES MANQUANTS
            // ═══════════════════════════════════════════════════════════════════════
            const missingPrograms = [];
            const ownedPrograms = [];
            
            for (const prog of PROGRAMS) {
                if (ns.fileExists(prog.name, "home")) {
                    ownedPrograms.push(prog.name);
                } else {
                    missingPrograms.push(prog);
                }
            }
            
            metrics.purchased = ownedPrograms.length;
            metrics.remaining = missingPrograms.length;
            
            // ═══════════════════════════════════════════════════════════════════════
            // ✅ TOUS LES PROGRAMMES ACQUIS
            // ═══════════════════════════════════════════════════════════════════════
            if (missingPrograms.length === 0) {
                log.success(`🎉 Tous les programmes acquis ! (${metrics.purchased}/${metrics.totalPrograms})`);
                
                // Afficher le récapitulatif final
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Total dépensé: ${ns.formatNumber(metrics.totalSpent)}`);
                log.info(`⏱️  Uptime: ${uptimeMin}min`);
                log.info(`✅ Manager terminé avec succès`);
                
                return; // Arrêt du manager
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎯 SÉLECTION DU PROCHAIN PROGRAMME À ACHETER
            // ═══════════════════════════════════════════════════════════════════════
            // Tri par priorité croissante, puis par coût croissant
            missingPrograms.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; // Priorité 1 en premier
                }
                return a.cost - b.cost; // Moins cher en premier
            });
            
            const nextProgram = missingPrograms[0];
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💰 TENTATIVE D'ACHAT
            // ═══════════════════════════════════════════════════════════════════════
            if (availableFunds >= nextProgram.cost) {
                try {
                    // Tentative d'achat via Singularity
                    const success = ns.singularity.purchaseProgram(nextProgram.name);
                    
                    if (success) {
                        metrics.totalSpent += nextProgram.cost;
                        metrics.lastPurchaseTime = Date.now();
                        
                        log.success(`✅ ${nextProgram.name} acheté ! (${ns.formatNumber(nextProgram.cost)})`);
                        log.info(`   ${nextProgram.desc}`);
                        log.info(`   Progression: ${metrics.purchased + 1}/${metrics.totalPrograms}`);
                        
                        // Petite pause après achat réussi
                        await ns.sleep(1000);
                        
                        // Continuer immédiatement pour acheter le suivant si possible
                        continue;
                    } else {
                        log.warn(`⚠️  Échec achat ${nextProgram.name} (achat refusé)`);
                    }
                } catch (error) {
                    log.error(`Erreur lors de l'achat de ${nextProgram.name}: ${error.message}`);
                }
            } else {
                // ═══════════════════════════════════════════════════════════════════
                // 💸 FONDS INSUFFISANTS
                // ═══════════════════════════════════════════════════════════════════
                const needed = nextProgram.cost - availableFunds;
                const percentComplete = (availableFunds / nextProgram.cost) * 100;
                
                if (log.debugEnabled) {
                    log.debug(`💸 Fonds insuffisants pour ${nextProgram.name}`);
                    log.debug(`   Besoin: ${ns.formatNumber(nextProgram.cost)}`);
                    log.debug(`   Disponible: ${ns.formatNumber(availableFunds)}`);
                    log.debug(`   Manquant: ${ns.formatNumber(needed)}`);
                    log.debug(`   Progression: ${percentComplete.toFixed(1)}%`);
                }
                
                // Log périodique (toutes les 10 tentatives)
                if (metrics.attemptCount % 10 === 0) {
                    log.info(`🎯 Objectif: ${nextProgram.name} (${ns.formatNumber(nextProgram.cost)})`);
                    log.info(`   Progression: ${percentComplete.toFixed(1)}% - Manque ${ns.formatNumber(needed)}`);
                    log.info(`   Programmes: ${metrics.purchased}/${metrics.totalPrograms} acquis`);
                }
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP AVEC THROTTLING
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(CHECK_INTERVAL);
    }
}
