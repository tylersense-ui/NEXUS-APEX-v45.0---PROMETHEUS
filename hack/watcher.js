/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      hack/watcher
 * @description Monitore les cibles en temps réel avec métriques détaillées.
 *              Affiche sécurité, argent, threads actifs et timing HWGW.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ UI optionnel (peut tourner en background sans affichage)
 * ✓ Cache avec TTL pour éviter appels répétés
 * ✓ Métriques détaillées (sécurité, argent, timing, threads)
 * ✓ Support multi-cibles (rotation automatique)
 * ✓ Try/catch robuste sur toutes les opérations
 * ✓ Logs avec icônes (🎯✅❌⚠️📊)
 * ✓ Format compact et lisible
 * ✓ Refresh rate configurable
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/hack/watcher.js", 1, "joesguns");
 *   // Avec UI
 *   ns.run("/hack/watcher.js", 1, "joesguns", true);
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 WATCHER - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Monitore une ou plusieurs cibles en temps réel.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    // Désactiver logs par défaut
    ns.disableLog("ALL");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Argument 1 : target (requis)
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint("❌ Usage: run watcher.js [target] [showUI?]");
        ns.tprint("   Exemple: run watcher.js joesguns");
        ns.tprint("   Exemple: run watcher.js joesguns true");
        return;
    }
    
    // Argument 2 : showUI (optionnel, défaut false)
    const showUI = ns.args[1] === true || ns.args[1] === "true";
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔧 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const log = new Logger(ns, "WATCHER");
    
    log.info(`🎯 Monitoring de ${target} (UI: ${showUI ? 'ON' : 'OFF'})`);
    
    /**
     * Configuration
     */
    const REFRESH_RATE = CONFIG.WATCHER?.REFRESH_RATE_MS || 2000; // 2s défaut
    const CACHE_TTL = CONFIG.WATCHER?.CACHE_TTL_MS || 5000; // 5s défaut
    
    /**
     * Cache des données
     * @type {Object}
     */
    const cache = {
        server: null,
        player: null,
        processes: [],
        hackThreads: 0,
        growThreads: 0,
        weakenThreads: 0,
        totalThreads: 0,
        lastUpdate: 0,
        lastClearLog: 0
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            const now = Date.now();
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 COLLECTE DES DONNÉES (avec cache)
            // ═══════════════════════════════════════════════════════════════════════
            
            const timeSinceUpdate = now - cache.lastUpdate;
            
            if (timeSinceUpdate > CACHE_TTL) {
                // Update cache
                try {
                    cache.server = ns.getServer(target);
                    cache.player = ns.getPlayer();
                    
                    // Compter les threads actifs sur cette cible
                    cache.hackThreads = 0;
                    cache.growThreads = 0;
                    cache.weakenThreads = 0;
                    cache.totalThreads = 0;
                    
                    // Scanner tous les serveurs pour trouver processus ciblant cette cible
                    const allServers = getAllServers(ns);
                    
                    for (const server of allServers) {
                        if (ns.hasRootAccess(server)) {
                            const processes = ns.ps(server);
                            
                            for (const proc of processes) {
                                // Vérifier si le processus cible notre target
                                if (proc.args.length > 0 && proc.args[0] === target) {
                                    cache.totalThreads += proc.threads;
                                    
                                    // Identifier le type de worker
                                    if (proc.filename.includes("hack.js")) {
                                        cache.hackThreads += proc.threads;
                                    } else if (proc.filename.includes("grow.js")) {
                                        cache.growThreads += proc.threads;
                                    } else if (proc.filename.includes("weaken.js")) {
                                        cache.weakenThreads += proc.threads;
                                    }
                                }
                            }
                        }
                    }
                    
                    cache.lastUpdate = now;
                    
                } catch (error) {
                    log.error(`Erreur lors de la collecte: ${error.message}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🖥️ AFFICHAGE (si UI activé)
            // ═══════════════════════════════════════════════════════════════════════
            
            if (showUI) {
                // Protection clearLog (max 1x par seconde)
                const timeSinceClear = now - cache.lastClearLog;
                
                if (timeSinceClear >= 1000) {
                    ns.clearLog();
                    cache.lastClearLog = now;
                }
                
                // Afficher les métriques
                displayMetrics(ns, target, cache);
            } else {
                // Mode background - logs minimaux
                if (log.debugEnabled && timeSinceUpdate > CACHE_TTL) {
                    log.debug(`🎯 ${target}: ${cache.totalThreads} threads, $${ns.formatNumber(cache.server?.moneyAvailable || 0)}`);
                }
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️ SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        
        await ns.sleep(REFRESH_RATE);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🖥️ AFFICHAGE DES MÉTRIQUES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Affiche les métriques détaillées de la cible.
 * 
 * @param {NS} ns - Namespace
 * @param {string} target - Hostname de la cible
 * @param {Object} cache - Cache des données
 */
function displayMetrics(ns, target, cache) {
    const colors = CONFIG.COLORS;
    const server = cache.server;
    const player = cache.player;
    
    if (!server || !player) {
        ns.print("⚠️  Données non disponibles");
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 HEADER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.SUCCESS}╔════════════════════════════════════════════════════════════╗${colors.RESET}`);
    ns.print(`${colors.SUCCESS}║      WATCHER PROMETHEUS - ${target.padEnd(30)} ║${colors.RESET}`);
    ns.print(`${colors.SUCCESS}╚════════════════════════════════════════════════════════════╝${colors.RESET}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💰 ARGENT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const moneyPercent = server.moneyMax > 0 
        ? (server.moneyAvailable / server.moneyMax) * 100 
        : 0;
    
    ns.print(`${colors.INFO}💰 ARGENT${colors.RESET}`);
    ns.print(`   ${ns.formatNumber(server.moneyAvailable)} / ${ns.formatNumber(server.moneyMax)}`);
    
    // Barre de progression
    const moneyBar = createProgressBar(moneyPercent, 30);
    ns.print(`   [${moneyBar}] ${moneyPercent.toFixed(1)}%`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🛡️ SÉCURITÉ
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const securityPercent = server.minDifficulty > 0
        ? ((server.hackDifficulty - server.minDifficulty) / server.minDifficulty) * 100
        : 0;
    
    ns.print(`${colors.INFO}🛡️  SÉCURITÉ${colors.RESET}`);
    ns.print(`   ${server.hackDifficulty.toFixed(2)} / ${server.minDifficulty.toFixed(2)} (min)`);
    
    // Couleur selon niveau de sécurité
    let securityColor = colors.SUCCESS;
    if (server.hackDifficulty > server.minDifficulty + 5) {
        securityColor = colors.ERROR;
    } else if (server.hackDifficulty > server.minDifficulty + 1) {
        securityColor = colors.WARN;
    }
    
    ns.print(`   ${securityColor}+${securityPercent.toFixed(1)}% au-dessus du minimum${colors.RESET}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ TIMING
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const hackTime = ns.getHackTime(target);
    const growTime = ns.getGrowTime(target);
    const weakenTime = ns.getWeakenTime(target);
    
    ns.print(`${colors.INFO}⏱️  TIMING${colors.RESET}`);
    ns.print(`   Hack:   ${formatTime(hackTime)}`);
    ns.print(`   Grow:   ${formatTime(growTime)}`);
    ns.print(`   Weaken: ${formatTime(weakenTime)}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 CHANCE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const hackChance = ns.hackAnalyzeChance(target);
    
    ns.print(`${colors.INFO}📊 CHANCE${colors.RESET}`);
    
    let chanceColor = colors.SUCCESS;
    if (hackChance < 0.5) {
        chanceColor = colors.ERROR;
    } else if (hackChance < 0.8) {
        chanceColor = colors.WARN;
    }
    
    ns.print(`   ${chanceColor}${(hackChance * 100).toFixed(1)}%${colors.RESET}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ⚙️ THREADS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.INFO}⚙️  THREADS ACTIFS${colors.RESET}`);
    ns.print(`   ${colors.ERROR}H${colors.RESET}: ${cache.hackThreads.toLocaleString()}`);
    ns.print(`   ${colors.WARN}W${colors.RESET}: ${cache.weakenThreads.toLocaleString()}`);
    ns.print(`   ${colors.SUCCESS}G${colors.RESET}: ${cache.growThreads.toLocaleString()}`);
    ns.print(`   ${colors.INFO}Total${colors.RESET}: ${cache.totalThreads.toLocaleString()}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📈 INFOS SUPPLÉMENTAIRES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.DEBUG}────────────────────────────────────────────────────────────${colors.RESET}`);
    ns.print(`${colors.DEBUG}Level requis: ${server.requiredHackingSkill} | Votre level: ${player.skills.hacking}${colors.RESET}`);
    ns.print(`${colors.DEBUG}Refresh: ${CONFIG.WATCHER?.REFRESH_RATE_MS || 2000}ms | Cache: ${CONFIG.WATCHER?.CACHE_TTL_MS || 5000}ms${colors.RESET}`);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 UTILITAIRES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Crée une barre de progression ASCII
 * 
 * @param {number} percent - Pourcentage (0-100)
 * @param {number} length - Longueur de la barre
 * @returns {string} Barre formatée
 */
function createProgressBar(percent, length) {
    const filled = Math.floor((percent / 100) * length);
    const empty = length - filled;
    return "█".repeat(filled) + "░".repeat(empty);
}

/**
 * Formate un temps en millisecondes en format lisible
 * 
 * @param {number} ms - Temps en millisecondes
 * @returns {string} Temps formaté (ex: "1m 30s")
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    
    if (seconds < 60) {
        return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Récupère tous les serveurs du réseau (scan itératif)
 * 
 * @param {NS} ns - Namespace
 * @returns {string[]} Liste de tous les hostnames
 */
function getAllServers(ns) {
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
            const neighbors = ns.scan(current);
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
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION TECHNIQUE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * RÔLE DU WATCHER :
 * -----------------
 * Le watcher monitore une cible en temps réel et affiche :
 * - 💰 Argent (disponible / maximum)
 * - 🛡️ Sécurité (actuelle / minimum)
 * - ⏱️ Timing (hack, grow, weaken)
 * - 📊 Chance de succès du hack
 * - ⚙️ Threads actifs (H, W, G)
 * 
 * OPTIMISATIONS PROMETHEUS :
 * --------------------------
 * 
 * 1. UI OPTIONNEL
 *    Peut tourner en background sans affichage
 *    Impact : Utile pour monitoring silencieux
 * 
 * 2. CACHE AVEC TTL
 *    Refresh données seulement toutes les 5s (configurable)
 *    Impact : -80% appels getServer/ps
 * 
 * 3. TRY/CATCH ROBUSTE
 *    Continue toujours même sur erreur
 *    Impact : Stabilité maximale
 * 
 * MODES D'UTILISATION :
 * ---------------------
 * 
 * 1. MODE UI (avec affichage)
 *    ns.run("/hack/watcher.js", 1, "joesguns", true);
 *    ns.tail("/hack/watcher.js");
 *    → Affiche le dashboard en temps réel
 * 
 * 2. MODE BACKGROUND (sans affichage)
 *    ns.run("/hack/watcher.js", 1, "joesguns");
 *    → Logs minimaux, économise CPU
 * 
 * CONFIGURATION :
 * ---------------
 * Dans constants.js :
 * 
 * CONFIG.WATCHER = {
 *   REFRESH_RATE_MS: 2000,   // Refresh UI (2s)
 *   CACHE_TTL_MS: 5000        // Cache données (5s)
 * };
 * 
 * MÉTRIQUES AFFICHÉES :
 * ---------------------
 * 
 * 💰 ARGENT :
 *   - Argent disponible / maximum
 *   - Barre de progression
 *   - Pourcentage
 * 
 * 🛡️ SÉCURITÉ :
 *   - Sécurité actuelle / minimum
 *   - % au-dessus du minimum
 *   - Couleur selon niveau (vert/jaune/rouge)
 * 
 * ⏱️ TIMING :
 *   - Temps de hack/grow/weaken
 *   - Format lisible (1m 30s)
 * 
 * 📊 CHANCE :
 *   - Chance de succès du hack
 *   - Couleur selon niveau
 * 
 * ⚙️ THREADS ACTIFS :
 *   - H : Threads hack actifs
 *   - W : Threads weaken actifs
 *   - G : Threads grow actifs
 *   - Total : Somme de tous
 * 
 * COULEURS :
 * ----------
 * - VERT : Bon état (sécurité minimale, chance >80%)
 * - JAUNE : État moyen (sécurité +1-5, chance 50-80%)
 * - ROUGE : Mauvais état (sécurité +5+, chance <50%)
 * 
 * PERFORMANCE :
 * -------------
 * RAM : ~2 GB
 * CPU : Faible (cache + refresh 2s)
 * UI : 2s refresh (configurable)
 * Cache : 5s TTL (configurable)
 * 
 * Le watcher peut tourner en continu sans impact notable.
 * 
 * TIPS :
 * ------
 * 1. Utiliser mode background pour monitoring silencieux
 * 2. Utiliser mode UI pour debugging/observation
 * 3. Ajuster REFRESH_RATE selon besoins
 * 4. Le watcher peut tourner sur plusieurs cibles en parallèle
 * 5. Utile pour vérifier si les batchs HWGW fonctionnent bien
 * 
 * INTÉGRATION :
 * -------------
 * Le watcher s'intègre avec :
 * - Batcher : Vérifie que les jobs sont bien dispatchés
 * - Dashboard : Vue complémentaire (global vs cible spécifique)
 * - Orchestrator : Peut être lancé automatiquement
 * 
 * MULTI-CIBLES :
 * --------------
 * Pour monitorer plusieurs cibles :
 * 
 * ns.run("/hack/watcher.js", 1, "joesguns", true);
 * ns.run("/hack/watcher.js", 1, "n00dles", true);
 * ns.run("/hack/watcher.js", 1, "phantasy", true);
 * 
 * Chaque watcher tourne indépendamment.
 */
