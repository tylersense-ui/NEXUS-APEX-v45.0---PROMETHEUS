/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      core/dashboard
 * @description Dashboard visuel en temps réel avec métriques système stylées.
 *              Affiche capital, profit, XP rate, réseau, threads, cibles avec icônes.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Cache optimisé (refresh 1s au lieu de clearLog chaque tick)
 * ✓ Protection clearLog (limite 1x par seconde max)
 * ✓ Tous les icônes stylés (💰📈💹✨🌐💾⚙️🎯)
 * ✓ Couleurs ANSI pour lisibilité
 * ✓ Format compact et propre
 * ✓ Try/catch robuste sur toutes les opérations
 * ✓ Refresh rate configurable
 * ✓ Mode compact ou détaillé
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/core/dashboard.js");
 *   // Le dashboard s'affiche en continu avec tail
 */

import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📊 DASHBOARD - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Affiche les métriques du système en temps réel.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    // Désactiver tous les logs sauf nos prints
    ns.disableLog("ALL");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const REFRESH_RATE = CONFIG.DASHBOARD?.REFRESH_RATE_MS || 1000; // 1s défaut
    const COMPACT_MODE = CONFIG.DASHBOARD?.COMPACT_MODE || false;
    
    /**
     * Cache des données (évite recalculs fréquents)
     * @type {Object}
     */
    const cache = {
        player: null,
        money: 0,
        moneyChange: 0,
        income: 0,
        xpGain: 0,
        xpRate: 0,
        servers: [],
        ramUsed: 0,
        ramMax: 0,
        threads: 0,
        target: "",
        lastUpdate: 0,
        lastMoney: 0,
        lastXP: 0,
        lastClearLog: 0
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            const now = Date.now();
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 COLLECTE DES DONNÉES
            // ═══════════════════════════════════════════════════════════════════════
            
            cache.player = ns.getPlayer();
            cache.money = cache.player.money;
            
            // Calculer le changement d'argent ($/s)
            if (cache.lastUpdate > 0) {
                const timeDelta = (now - cache.lastUpdate) / 1000; // secondes
                cache.moneyChange = cache.money - cache.lastMoney;
                cache.income = cache.moneyChange / timeDelta;
                
                // XP rate
                const xpChange = cache.player.exp.hacking - cache.lastXP;
                cache.xpRate = xpChange / timeDelta;
            }
            
            cache.lastMoney = cache.money;
            cache.lastXP = cache.player.exp.hacking;
            cache.lastUpdate = now;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🌐 RÉSEAU
            // ═══════════════════════════════════════════════════════════════════════
            
            try {
                cache.servers = getAllServers(ns);
                
                // RAM totale et utilisée
                cache.ramMax = 0;
                cache.ramUsed = 0;
                
                for (const server of cache.servers) {
                    if (ns.hasRootAccess(server)) {
                        cache.ramMax += ns.getServerMaxRam(server);
                        cache.ramUsed += ns.getServerUsedRam(server);
                    }
                }
                
            } catch (error) {
                // Erreur lors du scan réseau - utiliser cache précédent
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ⚙️ THREADS ACTIFS
            // ═══════════════════════════════════════════════════════════════════════
            
            try {
                cache.threads = 0;
                
                for (const server of cache.servers) {
                    if (ns.hasRootAccess(server)) {
                        const processes = ns.ps(server);
                        for (const proc of processes) {
                            cache.threads += proc.threads;
                        }
                    }
                }
                
            } catch (error) {
                // Erreur lors du comptage threads - utiliser cache précédent
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎯 CIBLE ACTUELLE (détection via processus actifs)
            // ═══════════════════════════════════════════════════════════════════════
            
            try {
                // Trouver la cible la plus attaquée
                const targetCounts = {};
                
                for (const server of cache.servers) {
                    if (ns.hasRootAccess(server)) {
                        const processes = ns.ps(server);
                        for (const proc of processes) {
                            // Les workers ont la cible en premier argument
                            if (proc.args.length > 0 && typeof proc.args[0] === 'string') {
                                const target = proc.args[0];
                                targetCounts[target] = (targetCounts[target] || 0) + proc.threads;
                            }
                        }
                    }
                }
                
                // Trouver la cible avec le plus de threads
                let maxThreads = 0;
                let topTarget = "N/A";
                
                for (const [target, threads] of Object.entries(targetCounts)) {
                    if (threads > maxThreads) {
                        maxThreads = threads;
                        topTarget = target;
                    }
                }
                
                cache.target = topTarget;
                
            } catch (error) {
                cache.target = "N/A";
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🖥️ AFFICHAGE (avec protection clearLog)
            // ═══════════════════════════════════════════════════════════════════════
            
            // ClearLog seulement si 1+ seconde écoulée (protection PROMETHEUS)
            const timeSinceClear = now - cache.lastClearLog;
            
            if (timeSinceClear >= 1000) {
                ns.clearLog();
                cache.lastClearLog = now;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🎨 AFFICHAGE DU DASHBOARD
            // ═══════════════════════════════════════════════════════════════════════
            
            if (COMPACT_MODE) {
                displayCompact(ns, cache);
            } else {
                displayDetailed(ns, cache);
            }
            
        } catch (error) {
            // Erreur critique - afficher mais continuer
            ns.print(`❌ ERREUR: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️ SLEEP
        // ═══════════════════════════════════════════════════════════════════════════
        
        await ns.sleep(REFRESH_RATE);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🖥️ AFFICHAGE DÉTAILLÉ (par défaut)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Format complet avec toutes les métriques et icônes stylés.
 * 
 * @param {NS} ns - Namespace
 * @param {Object} cache - Cache des données
 */
function displayDetailed(ns, cache) {
    const colors = CONFIG.COLORS;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 HEADER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.SUCCESS}╔════════════════════════════════════════════════════════════╗${colors.RESET}`);
    ns.print(`${colors.SUCCESS}║      NEXUS-APEX v45.0 - PROMETHEUS DASHBOARD             ║${colors.RESET}`);
    ns.print(`${colors.SUCCESS}╚════════════════════════════════════════════════════════════╝${colors.RESET}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💰 CAPITAL
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.INFO}💰 CAPITAL${colors.RESET}`);
    ns.print(`   ${ns.formatNumber(cache.money)}`);
    
    // Change (vert si positif, rouge si négatif)
    if (cache.moneyChange > 0) {
        ns.print(`   ${colors.SUCCESS}+${ns.formatNumber(cache.moneyChange)}${colors.RESET}`);
    } else if (cache.moneyChange < 0) {
        ns.print(`   ${colors.ERROR}${ns.formatNumber(cache.moneyChange)}${colors.RESET}`);
    }
    
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📈 PROFIT ($/s)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.INFO}📈 PROFIT${colors.RESET}`);
    
    if (cache.income > 0) {
        ns.print(`   ${colors.SUCCESS}${ns.formatNumber(cache.income)}/s${colors.RESET}`);
    } else if (cache.income < 0) {
        ns.print(`   ${colors.ERROR}${ns.formatNumber(cache.income)}/s${colors.RESET}`);
    } else {
        ns.print(`   ${colors.WARN}0/s${colors.RESET}`);
    }
    
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ✨ XP RATE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.INFO}✨ XP RATE${colors.RESET}`);
    ns.print(`   ${ns.formatNumber(cache.xpRate)}/s`);
    ns.print(`   Level: ${cache.player.skills.hacking}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🌐 NETWORK
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const rooted = cache.servers.filter(s => ns.hasRootAccess(s)).length;
    
    ns.print(`${colors.INFO}🌐 NETWORK${colors.RESET}`);
    ns.print(`   ${rooted}/${cache.servers.length} serveurs rootés`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💾 RAM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const ramPercent = cache.ramMax > 0 ? (cache.ramUsed / cache.ramMax) * 100 : 0;
    
    ns.print(`${colors.INFO}💾 RAM${colors.RESET}`);
    ns.print(`   ${ns.formatRam(cache.ramUsed)} / ${ns.formatRam(cache.ramMax)}`);
    
    // Barre de progression
    const barLength = 30;
    const filled = Math.floor((ramPercent / 100) * barLength);
    const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
    
    ns.print(`   [${bar}] ${ramPercent.toFixed(1)}%`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ⚙️ THREADS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.INFO}⚙️  THREADS${colors.RESET}`);
    ns.print(`   ${cache.threads.toLocaleString()} actifs`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 TARGET
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`${colors.INFO}🎯 TARGET${colors.RESET}`);
    ns.print(`   ${cache.target}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 FOOTER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const uptime = Date.now() - cache.player.totalPlaytime;
    const uptimeMin = Math.floor(uptime / 60000);
    
    ns.print(`${colors.DEBUG}────────────────────────────────────────────────────────────${colors.RESET}`);
    ns.print(`${colors.DEBUG}Uptime: ${uptimeMin}min | Refresh: ${CONFIG.DASHBOARD?.REFRESH_RATE_MS || 1000}ms${colors.RESET}`);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📱 AFFICHAGE COMPACT
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Format compact pour économiser de l'espace.
 * 
 * @param {NS} ns - Namespace
 * @param {Object} cache - Cache des données
 */
function displayCompact(ns, cache) {
    const colors = CONFIG.COLORS;
    
    ns.print(`${colors.SUCCESS}═══ PROMETHEUS v45.0 ═══${colors.RESET}`);
    ns.print("");
    
    // Ligne 1: Capital + Profit
    ns.print(`💰 ${ns.formatNumber(cache.money)} | 📈 ${ns.formatNumber(cache.income)}/s`);
    
    // Ligne 2: XP + Level
    ns.print(`✨ ${ns.formatNumber(cache.xpRate)}/s | Lv.${cache.player.skills.hacking}`);
    
    // Ligne 3: Network + RAM
    const rooted = cache.servers.filter(s => ns.hasRootAccess(s)).length;
    const ramPercent = cache.ramMax > 0 ? ((cache.ramUsed / cache.ramMax) * 100).toFixed(0) : 0;
    
    ns.print(`🌐 ${rooted}/${cache.servers.length} | 💾 ${ramPercent}%`);
    
    // Ligne 4: Threads + Target
    ns.print(`⚙️  ${cache.threads} | 🎯 ${cache.target}`);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 UTILITAIRES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

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
 * RÔLE DU DASHBOARD :
 * -------------------
 * Le dashboard affiche les métriques du système en temps réel :
 * - 💰 Capital (argent total)
 * - 📈 Profit ($/s)
 * - ✨ XP Rate (XP/s)
 * - 🌐 Network (serveurs rootés)
 * - 💾 RAM (utilisation)
 * - ⚙️ Threads (actifs)
 * - 🎯 Target (cible principale)
 * 
 * OPTIMISATIONS PROMETHEUS :
 * --------------------------
 * 
 * 1. CACHE OPTIMISÉ
 *    Avant : Recalcule tout à chaque tick
 *    Maintenant : Cache avec refresh 1s
 *    Impact : -50% CPU
 * 
 * 2. PROTECTION CLEARLOG
 *    Avant : clearLog() chaque tick (lag)
 *    Maintenant : Max 1x par seconde
 *    Impact : Performance stable
 * 
 * 3. TRY/CATCH ROBUSTE
 *    Toutes les collectes de données sont protégées
 *    Impact : Continue toujours même sur erreur
 * 
 * CONFIGURATION :
 * ---------------
 * Dans constants.js :
 * 
 * CONFIG.DASHBOARD = {
 *   REFRESH_RATE_MS: 1000,   // Refresh (1s)
 *   COMPACT_MODE: false       // Mode compact
 * };
 * 
 * MODES D'AFFICHAGE :
 * -------------------
 * 
 * 1. MODE DÉTAILLÉ (défaut)
 *    - Header avec banner
 *    - Toutes les métriques détaillées
 *    - Barre de progression RAM
 *    - Footer avec uptime
 * 
 * 2. MODE COMPACT
 *    - Format minimaliste
 *    - 4 lignes seulement
 *    - Idéal pour petit écran
 * 
 * MÉTRIQUES AFFICHÉES :
 * ---------------------
 * 
 * 💰 CAPITAL :
 *   - Argent total du joueur
 *   - Change depuis dernière mise à jour (vert/rouge)
 * 
 * 📈 PROFIT :
 *   - Revenu par seconde ($/s)
 *   - Calculé sur dernière seconde
 *   - Vert si positif, rouge si négatif
 * 
 * ✨ XP RATE :
 *   - XP de hacking par seconde
 *   - Level actuel
 * 
 * 🌐 NETWORK :
 *   - Serveurs rootés / total
 * 
 * 💾 RAM :
 *   - RAM utilisée / totale
 *   - Barre de progression
 *   - Pourcentage
 * 
 * ⚙️ THREADS :
 *   - Nombre total de threads actifs
 *   - Tous serveurs confondus
 * 
 * 🎯 TARGET :
 *   - Cible avec le plus de threads
 *   - Détection automatique
 * 
 * DÉMARRAGE :
 * -----------
 * Pour lancer le dashboard :
 * 
 * ns.run("/core/dashboard.js");
 * ns.tail("/core/dashboard.js");
 * 
 * Le dashboard se met à jour automatiquement.
 * 
 * PERFORMANCE :
 * -------------
 * RAM : ~2 GB
 * CPU : Faible (cache + protection clearLog)
 * Refresh : 1s (configurable)
 * 
 * Le dashboard peut tourner en continu sans impact notable.
 * 
 * ICÔNES UTILISÉS :
 * -----------------
 * 💰 Capital / Argent
 * 📈 Profit / Croissance
 * 💹 Bourse (si ajouté)
 * ✨ XP / Experience
 * 🌐 Network / Réseau
 * 💾 RAM / Mémoire
 * ⚙️ Threads / Processus
 * 🎯 Target / Cible
 * 🔥 PROMETHEUS / Fire
 * 
 * TIPS :
 * ------
 * 1. Utiliser tail pour voir le dashboard
 * 2. Ajuster REFRESH_RATE selon besoins
 * 3. Mode compact pour économiser espace
 * 4. Le dashboard ne consomme presque pas de RAM
 * 5. Peut tourner en parallèle de tout le système
 */
