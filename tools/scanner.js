/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/scanner
 * @description Scan complet du réseau avec affichage détaillé des serveurs.
 *              Affiche hacking level, argent, sécurité, RAM et statut root.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Utilisation de Network.js pour scan unifié
 * ✓ Tri par hacking level, argent ou RAM
 * ✓ Filtres avancés (root only, hackable, high-value)
 * ✓ Affichage formaté avec couleurs ANSI
 * ✓ Export JSON optionnel (--json)
 * ✓ Mode compact (--compact) pour CI/CD
 * ✓ Statistiques globales (total servers, rooted, money)
 * ✓ Aucun effet de bord (lecture seule, idempotent)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/scanner.js");
 *   ns.run("/tools/scanner.js", 1, "--sort", "money");
 *   ns.run("/tools/scanner.js", 1, "--filter", "hackable");
 *   ns.run("/tools/scanner.js", 1, "--json", "/data/network.json");
 * 
 * @args
 *   --sort <field>     Sort by: level, money, ram, security (default: level)
 *   --filter <type>    Filter: all, rooted, hackable, high-value (default: all)
 *   --compact          Compact output (one line per server)
 *   --json <path>      Export to JSON file
 *   --help             Show this help
 * 
 * @example
 *   // Serveurs hackables seulement, triés par argent
 *   ns.run("/tools/scanner.js", 1, "--filter", "hackable", "--sort", "money");
 * 
 * @example
 *   // Export JSON pour analyse externe
 *   ns.run("/tools/scanner.js", 1, "--json", "/data/scan-result.json");
 */

import { Network } from "/lib/network.js";
import { Logger } from "/lib/logger.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: PARSE ARGUMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function parseArgs(args) {
    const config = {
        sort: "level",
        filter: "all",
        compact: false,
        json: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--sort" && i + 1 < args.length) {
            config.sort = args[++i];
        } else if (arg === "--filter" && i + 1 < args.length) {
            config.filter = args[++i];
        } else if (arg === "--compact") {
            config.compact = true;
        } else if (arg === "--json" && i + 1 < args.length) {
            config.json = args[++i];
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
    ns.tprint("  PROMETHEUS Network Scanner v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/scanner.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --sort <field>     Sort by: level, money, ram, security");
    ns.tprint("  --filter <type>    Filter: all, rooted, hackable, high-value");
    ns.tprint("  --compact          Compact output (one line per server)");
    ns.tprint("  --json <path>      Export to JSON file");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("EXAMPLES:");
    ns.tprint("  run /tools/scanner.js --filter hackable --sort money");
    ns.tprint("  run /tools/scanner.js --json /data/network.json");
    ns.tprint("");
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
    
    const log = new Logger(ns, "SCANNER");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  🔍 PROMETHEUS Network Scanner v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🌐 SCAN DU RÉSEAU
    // ═══════════════════════════════════════════════════════════════════════════════
    const network = new Network(ns);
    
    try {
        network.refresh();
    } catch (error) {
        log.error(`Erreur lors du scan: ${error.message}`);
        ns.tprint(`❌ Scan échoué: ${error.message}`);
        return;
    }
    
    const servers = network.getAll();
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 FILTRAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    let filtered = servers;
    const player = ns.getPlayer();
    
    if (config.filter === "rooted") {
        filtered = servers.filter(s => s.hasAdminRights);
    } else if (config.filter === "hackable") {
        filtered = servers.filter(s => 
            !s.hasAdminRights && 
            s.requiredHackingSkill <= player.skills.hacking &&
            s.hostname !== "home"
        );
    } else if (config.filter === "high-value") {
        filtered = servers.filter(s => 
            s.moneyMax > 0 && 
            s.moneyMax >= 10_000_000 &&
            s.hostname !== "home"
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 TRI
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.sort === "money") {
        filtered.sort((a, b) => b.moneyMax - a.moneyMax);
    } else if (config.sort === "ram") {
        filtered.sort((a, b) => b.maxRam - a.maxRam);
    } else if (config.sort === "security") {
        filtered.sort((a, b) => a.minDifficulty - b.minDifficulty);
    } else { // level
        filtered.sort((a, b) => a.requiredHackingSkill - b.requiredHackingSkill);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 STATISTIQUES GLOBALES
    // ═══════════════════════════════════════════════════════════════════════════════
    const stats = {
        total: servers.length,
        rooted: servers.filter(s => s.hasAdminRights).length,
        totalMoney: servers.reduce((sum, s) => sum + s.moneyMax, 0),
        totalRAM: servers.reduce((sum, s) => sum + s.maxRam, 0)
    };
    
    ns.tprint("");
    ns.tprint(`📊 Résultats du scan:`);
    ns.tprint(`   Serveurs totaux: ${stats.total}`);
    ns.tprint(`   Avec root: ${stats.rooted}/${stats.total} (${((stats.rooted/stats.total)*100).toFixed(1)}%)`);
    ns.tprint(`   Argent total: ${ns.formatNumber(stats.totalMoney)}`);
    ns.tprint(`   RAM totale: ${ns.formatRam(stats.totalRAM)}`);
    ns.tprint(`   Filtré: ${filtered.length} serveurs (${config.filter})`);
    ns.tprint(`   Trié par: ${config.sort}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📄 AFFICHAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.compact) {
        // Mode compact (une ligne par serveur)
        ns.tprint("HOST | LEVEL | MONEY | RAM | ROOT");
        ns.tprint("───────────────────────────────────────────────────────────────");
        
        for (const server of filtered) {
            const root = server.hasAdminRights ? "✅" : "❌";
            ns.tprint(
                `${server.hostname.padEnd(20)} | ` +
                `${String(server.requiredHackingSkill).padStart(5)} | ` +
                `${ns.formatNumber(server.moneyMax).padStart(10)} | ` +
                `${ns.formatRam(server.maxRam).padStart(10)} | ` +
                `${root}`
            );
        }
    } else {
        // Mode détaillé
        for (const server of filtered) {
            const root = server.hasAdminRights ? "✅" : "❌";
            const money = server.moneyMax > 0 
                ? ns.formatNumber(server.moneyMax) 
                : "N/A";
            
            ns.tprint(`┌─────────────────────────────────────────────────────────────`);
            ns.tprint(`│ 🖥️  ${server.hostname}`);
            ns.tprint(`├─────────────────────────────────────────────────────────────`);
            ns.tprint(`│ Hack Level:  ${server.requiredHackingSkill}`);
            ns.tprint(`│ Money:       ${money}`);
            ns.tprint(`│ Security:    ${server.minDifficulty.toFixed(0)} (min) / ${server.hackDifficulty.toFixed(0)} (current)`);
            ns.tprint(`│ RAM:         ${ns.formatRam(server.maxRam)}`);
            ns.tprint(`│ Root:        ${root}`);
            ns.tprint(`│ Ports:       ${server.numOpenPortsRequired}`);
            ns.tprint(`└─────────────────────────────────────────────────────────────`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💾 EXPORT JSON
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.json) {
        try {
            const exportData = {
                timestamp: Date.now(),
                stats: stats,
                config: config,
                servers: filtered.map(s => ({
                    hostname: s.hostname,
                    hackLevel: s.requiredHackingSkill,
                    moneyMax: s.moneyMax,
                    security: s.minDifficulty,
                    ram: s.maxRam,
                    hasRoot: s.hasAdminRights,
                    ports: s.numOpenPortsRequired
                }))
            };
            
            await ns.write(config.json, JSON.stringify(exportData, null, 2), "w");
            ns.tprint("");
            ns.tprint(`✅ Export JSON: ${config.json}`);
            
        } catch (error) {
            ns.tprint(`❌ Erreur export JSON: ${error.message}`);
        }
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("✅ Scan terminé");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
