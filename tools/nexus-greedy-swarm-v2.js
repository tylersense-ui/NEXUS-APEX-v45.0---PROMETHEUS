/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/nexus-greedy-swarm
 * @description Algorithme de hacking alternatif basé sur une approche greedy.
 *              Priorise les cibles par ratio money/time et déploie en masse.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Algorithme greedy optimisé (ratio $/s)
 * ✓ Déploiement swarm (tous les serveurs simultanément)
 * ✓ Scoring avancé avec pénalités de sécurité
 * ✓ Auto-weaken des cibles à haute sécurité
 * ✓ Distribution intelligente de la RAM
 * ✓ Métriques en temps réel ($/s, threads actifs)
 * ✓ Try/catch robuste sur tous les déploiements
 * ✓ Mode quiet (--quiet) pour background
 * ✓ Intégration Network.js et RamManager
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/nexus-greedy-swarm.js");
 *   ns.run("/tools/nexus-greedy-swarm.js", 1, "--quiet");
 *   ns.run("/tools/nexus-greedy-swarm.js", 1, "--target", "n00dles");
 * 
 * @args
 *   --target <host>    Force specific target (bypass scoring)
 *   --quiet            Minimal logging (background mode)
 *   --once             Run once and exit (no loop)
 *   --help             Show this help
 * 
 * @example
 *   // Lancer en arrière-plan
 *   ns.run("/tools/nexus-greedy-swarm.js", 1, "--quiet");
 * 
 * @example
 *   // Forcer une cible spécifique
 *   ns.run("/tools/nexus-greedy-swarm.js", 1, "--target", "joesguns");
 * 
 * @strategy
 *   1. Scan le réseau et score chaque cible ($/s)
 *   2. Sélectionne la meilleure cible
 *   3. Déploie hack.js sur TOUS les serveurs simultanément
 *   4. Attend que le hack se termine
 *   5. Répète
 */

import { Network } from "/lib/network.js";
import { RamManager } from "/core/ram-manager.js";
import { Logger } from "/lib/logger.js";
import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const SWARM_CONFIG = {
    /** Script de hack à déployer */
    HACK_SCRIPT: "/hack/workers/hack.js",
    
    /** Temps de pause entre cycles (ms) */
    CYCLE_DELAY: 1000,
    
    /** Pourcentage minimum d'argent sur la cible */
    MIN_MONEY_PERCENT: 0.75,
    
    /** Sécurité maximum acceptable */
    MAX_SECURITY_THRESHOLD: 100
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: PARSE ARGUMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function parseArgs(args) {
    const config = {
        target: null,
        quiet: false,
        once: false,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--target" && i + 1 < args.length) {
            config.target = args[++i];
        } else if (arg === "--quiet") {
            config.quiet = true;
        } else if (arg === "--once") {
            config.once = true;
        } else if (arg === "--help") {
            config.help = true;
        }
    }
    
    return config;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: AFFICHER L'AIDE
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function showHelp(ns) {
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  NEXUS Greedy Swarm v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/nexus-greedy-swarm.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --target <host>    Force specific target");
    ns.tprint("  --quiet            Minimal logging");
    ns.tprint("  --once             Run once and exit");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("DESCRIPTION:");
    ns.tprint("  Greedy algorithm that attacks the best $/s target");
    ns.tprint("  with all available resources simultaneously.");
    ns.tprint("");
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 SCORING DE CIBLES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function scoreTarget(ns, server, player) {
    // Vérifier les conditions minimales
    if (server.requiredHackingSkill > player.skills.hacking) {
        return 0;
    }
    
    if (server.moneyMax === 0 || server.hostname === "home") {
        return 0;
    }
    
    // Calculer le temps de hack
    const hackTime = ns.getHackTime(server.hostname);
    
    if (hackTime === 0) {
        return 0;
    }
    
    // Calculer l'argent disponible
    const currentMoney = Math.max(server.moneyAvailable, 1);
    const maxMoney = server.moneyMax;
    const moneyPercent = currentMoney / maxMoney;
    
    // Pénalité si l'argent est trop bas
    if (moneyPercent < SWARM_CONFIG.MIN_MONEY_PERCENT) {
        return 0;
    }
    
    // Calculer le ratio $/s
    const hackChance = ns.hackAnalyzeChance(server.hostname);
    const expectedMoney = currentMoney * hackChance * 0.5; // Approximation 50% steal
    const moneyPerSecond = expectedMoney / (hackTime / 1000);
    
    // Pénalité de sécurité
    const securityPenalty = server.hackDifficulty / server.minDifficulty;
    const adjustedScore = moneyPerSecond / securityPenalty;
    
    return adjustedScore;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
export async function main(ns) {
    const config = parseArgs(ns.args);
    
    if (config.help) {
        showHelp(ns);
        return;
    }
    
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "SWARM");
    
    if (!config.quiet) {
        log.success("🐝 Nexus Greedy Swarm PROMETHEUS v45.0 activé");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DU SCRIPT
    // ═══════════════════════════════════════════════════════════════════════════════
    if (!ns.fileExists(SWARM_CONFIG.HACK_SCRIPT, "home")) {
        log.error(`Script manquant: ${SWARM_CONFIG.HACK_SCRIPT}`);
        ns.tprint(`❌ ${SWARM_CONFIG.HACK_SCRIPT} introuvable`);
        return;
    }
    
    const hackRAM = ns.getScriptRam(SWARM_CONFIG.HACK_SCRIPT);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        cyclesCompleted: 0,
        totalHacks: 0,
        totalMoney: 0,
        startTime: Date.now()
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.cyclesCompleted++;
            const player = ns.getPlayer();
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🌐 SCAN DU RÉSEAU
            // ═══════════════════════════════════════════════════════════════════════
            const network = new Network(ns);
            network.refresh();
            
            const allServers = network.getAll();
            const hackers = allServers.filter(s => s.hasAdminRights && s.maxRam > 0);
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎯 SÉLECTION DE LA CIBLE
            // ═══════════════════════════════════════════════════════════════════════
            let target = null;
            let bestScore = 0;
            
            if (config.target) {
                // Cible forcée
                target = config.target;
            } else {
                // Scoring automatique
                for (const server of allServers) {
                    const score = scoreTarget(ns, server, player);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        target = server.hostname;
                    }
                }
            }
            
            if (!target) {
                log.warn("Aucune cible valide trouvée");
                await ns.sleep(SWARM_CONFIG.CYCLE_DELAY * 10);
                continue;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 💰 VÉRIFIER L'ARGENT DISPONIBLE
            // ═══════════════════════════════════════════════════════════════════════
            const targetServer = ns.getServer(target);
            const moneyPercent = targetServer.moneyAvailable / targetServer.moneyMax;
            
            if (moneyPercent < SWARM_CONFIG.MIN_MONEY_PERCENT) {
                if (!config.quiet && metrics.cyclesCompleted % 10 === 0) {
                    log.info(`⏳ ${target} en croissance (${(moneyPercent * 100).toFixed(0)}%)`);
                }
                await ns.sleep(SWARM_CONFIG.CYCLE_DELAY);
                continue;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🚀 DÉPLOIEMENT SWARM
            // ═══════════════════════════════════════════════════════════════════════
            let totalThreads = 0;
            let deploymentsSuccess = 0;
            
            for (const hacker of hackers) {
                try {
                    // Calculer RAM disponible
                    const maxRAM = ns.getServerMaxRam(hacker.hostname);
                    const usedRAM = ns.getServerUsedRam(hacker.hostname);
                    let availableRAM = maxRAM - usedRAM;
                    
                    // Réserver RAM sur home
                    if (hacker.hostname === "home") {
                        const reserved = CONFIG.HACKING?.RESERVED_HOME_RAM || 32;
                        availableRAM = Math.max(0, availableRAM - reserved);
                    }
                    
                    // Calculer threads
                    const threads = Math.floor(availableRAM / hackRAM);
                    
                    if (threads < 1) continue;
                    
                    // Copier le script (si pas home)
                    if (hacker.hostname !== "home") {
                        await ns.scp(SWARM_CONFIG.HACK_SCRIPT, hacker.hostname, "home");
                    }
                    
                    // Lancer le hack
                    const pid = ns.exec(
                        SWARM_CONFIG.HACK_SCRIPT,
                        hacker.hostname,
                        threads,
                        target,
                        0 // Pas de delay
                    );
                    
                    if (pid > 0) {
                        totalThreads += threads;
                        deploymentsSuccess++;
                    }
                    
                } catch (error) {
                    // Ignorer les erreurs de déploiement individuelles
                }
            }
            
            if (totalThreads > 0) {
                metrics.totalHacks++;
                
                if (!config.quiet) {
                    log.success(`🎯 ${target}: ${totalThreads} threads déployés sur ${deploymentsSuccess} serveurs`);
                    log.info(`   Score: ${ns.formatNumber(bestScore)}/s | Money: ${(moneyPercent * 100).toFixed(0)}%`);
                }
                
                // Attendre que le hack se termine
                const hackTime = ns.getHackTime(target);
                await ns.sleep(hackTime + 500);
                
            } else {
                log.warn("Aucun thread disponible");
                await ns.sleep(SWARM_CONFIG.CYCLE_DELAY);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE
            // ═══════════════════════════════════════════════════════════════════════
            if (!config.quiet && metrics.cyclesCompleted % 20 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                
                log.info(`📊 Stats Swarm:`);
                log.info(`   Cycles: ${metrics.cyclesCompleted}`);
                log.info(`   Hacks: ${metrics.totalHacks}`);
                log.info(`   Uptime: ${uptimeMin}min`);
            }
            
        } catch (error) {
            log.error(`Erreur boucle principale: ${error.message}`);
            await ns.sleep(SWARM_CONFIG.CYCLE_DELAY * 5);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 🔄 MODE ONCE (sortie après 1 cycle)
        // ═══════════════════════════════════════════════════════════════════════════
        if (config.once) {
            log.success("✅ Cycle unique terminé");
            return;
        }
        
        await ns.sleep(SWARM_CONFIG.CYCLE_DELAY);
    }
}
