/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/set-share
 * @description Configure le mode share power sur tous les serveurs du réseau.
 *              Lance des instances de share.js pour augmenter les revenus.
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
 * ✓ Validation de l'existence de share.js avant déploiement
 * ✓ Calcul intelligent des threads par serveur
 * ✓ Mode dry-run (--dry-run) pour preview
 * ✓ Respect de RESERVED_HOME_RAM
 * ✓ Try/catch robuste sur tous les déploiements
 * ✓ Rapport détaillé (serveurs touchés, threads totaux)
 * ✓ Protection contre les déploiements accidentels
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/set-share.js");
 *   ns.run("/tools/set-share.js", 1, "--dry-run");
 *   ns.run("/tools/set-share.js", 1, "--force");
 * 
 * @args
 *   --dry-run          Simulate deployment (no actual execution)
 *   --force            Skip confirmation prompt
 *   --reserved <GB>    RAM to reserve on home (default: 32GB)
 *   --help             Show this help
 * 
 * @example
 *   // Preview avant déploiement
 *   ns.run("/tools/set-share.js", 1, "--dry-run");
 * 
 * @example
 *   // Déploiement forcé avec réserve custom
 *   ns.run("/tools/set-share.js", 1, "--force", "--reserved", "64");
 */

import { Network } from "/lib/network.js";
import { Logger } from "/lib/logger.js";
import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: PARSE ARGUMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function parseArgs(args) {
    const config = {
        dryRun: false,
        force: false,
        reserved: CONFIG.HACKING?.RESERVED_HOME_RAM || 32,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--dry-run") {
            config.dryRun = true;
        } else if (arg === "--force") {
            config.force = true;
        } else if (arg === "--reserved" && i + 1 < args.length) {
            config.reserved = parseInt(args[++i]) || config.reserved;
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
    ns.tprint("  PROMETHEUS Share Power Deployer v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/set-share.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --dry-run          Simulate deployment (no execution)");
    ns.tprint("  --force            Skip confirmation prompt");
    ns.tprint("  --reserved <GB>    RAM to reserve on home (default: 32GB)");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("DESCRIPTION:");
    ns.tprint("  Deploy share.js across the network to increase income.");
    ns.tprint("  Calculates optimal thread count per server.");
    ns.tprint("");
    ns.tprint("EXAMPLES:");
    ns.tprint("  run /tools/set-share.js --dry-run");
    ns.tprint("  run /tools/set-share.js --force --reserved 64");
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
    
    const log = new Logger(ns, "SET-SHARE");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  🔄 PROMETHEUS Share Power Deployer v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    if (config.dryRun) {
        ns.tprint("");
        ns.tprint("⚠️  MODE DRY-RUN ACTIVÉ (simulation uniquement)");
        ns.tprint("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DE L'EXISTENCE DE SHARE.JS
    // ═══════════════════════════════════════════════════════════════════════════════
    const SHARE_SCRIPT = "/hack/workers/share.js";
    
    if (!ns.fileExists(SHARE_SCRIPT, "home")) {
        ns.tprint("");
        ns.tprint(`❌ Script manquant: ${SHARE_SCRIPT}`);
        ns.tprint("   Vérifiez que le fichier existe dans /hack/workers/");
        return;
    }
    
    const shareRAM = ns.getScriptRam(SHARE_SCRIPT);
    
    ns.tprint("");
    ns.tprint(`📊 Configuration:`);
    ns.tprint(`   Script: ${SHARE_SCRIPT}`);
    ns.tprint(`   RAM par thread: ${ns.formatRam(shareRAM)}`);
    ns.tprint(`   RAM réservée (home): ${ns.formatRam(config.reserved)}`);
    ns.tprint("");
    
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
    
    const servers = network.getAll().filter(s => 
        s.hasAdminRights && // Root requis
        s.maxRam > 0        // RAM disponible
    );
    
    ns.tprint(`🔍 Serveurs éligibles: ${servers.length}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 CALCUL DES THREADS PAR SERVEUR
    // ═══════════════════════════════════════════════════════════════════════════════
    const deploymentPlan = [];
    let totalThreads = 0;
    
    for (const server of servers) {
        const maxRAM = ns.getServerMaxRam(server.hostname);
        const usedRAM = ns.getServerUsedRam(server.hostname);
        let availableRAM = maxRAM - usedRAM;
        
        // Appliquer la réserve sur home
        if (server.hostname === "home") {
            availableRAM = Math.max(0, availableRAM - config.reserved);
        }
        
        // Calculer le nombre de threads possibles
        const threads = Math.floor(availableRAM / shareRAM);
        
        if (threads > 0) {
            deploymentPlan.push({
                hostname: server.hostname,
                threads: threads,
                ram: threads * shareRAM
            });
            
            totalThreads += threads;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 AFFICHAGE DU PLAN
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint(`📋 Plan de déploiement:`);
    ns.tprint(`   Serveurs: ${deploymentPlan.length}`);
    ns.tprint(`   Threads totaux: ${totalThreads}`);
    ns.tprint(`   RAM totale utilisée: ${ns.formatRam(totalThreads * shareRAM)}`);
    ns.tprint("");
    
    if (deploymentPlan.length === 0) {
        ns.tprint("⚠️  Aucun serveur avec RAM disponible");
        return;
    }
    
    // Afficher top 10 serveurs
    ns.tprint("📊 Top 10 serveurs (par threads):");
    const topServers = [...deploymentPlan]
        .sort((a, b) => b.threads - a.threads)
        .slice(0, 10);
    
    for (const item of topServers) {
        ns.tprint(`   ${item.hostname.padEnd(20)} | ${String(item.threads).padStart(5)} threads | ${ns.formatRam(item.ram)}`);
    }
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ⚠️  CONFIRMATION (si pas --force et pas --dry-run)
    // ═══════════════════════════════════════════════════════════════════════════════
    if (!config.force && !config.dryRun) {
        ns.tprint("⚠️  ATTENTION: Cette opération va lancer share.js sur tous les serveurs");
        ns.tprint("   Utilisez --dry-run pour simuler ou --force pour confirmer");
        ns.tprint("");
        ns.tprint("❌ Opération annulée (utilisez --force pour confirmer)");
        return;
    }
    
    if (config.dryRun) {
        ns.tprint("✅ Simulation terminée (aucune action effectuée)");
        ns.tprint("   Utilisez --force pour déployer réellement");
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🚀 DÉPLOIEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("🚀 Démarrage du déploiement...");
    ns.tprint("");
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of deploymentPlan) {
        try {
            // Copier le script sur le serveur (si pas home)
            if (item.hostname !== "home") {
                await ns.scp(SHARE_SCRIPT, item.hostname, "home");
            }
            
            // Lancer share.js avec le nombre de threads calculé
            const pid = ns.exec(SHARE_SCRIPT, item.hostname, item.threads);
            
            if (pid > 0) {
                successCount++;
                log.info(`✅ ${item.hostname}: ${item.threads} threads lancés`);
            } else {
                failCount++;
                log.warn(`❌ ${item.hostname}: échec du lancement`);
            }
            
        } catch (error) {
            failCount++;
            log.error(`❌ ${item.hostname}: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RAPPORT FINAL
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("📊 Résultat du déploiement:");
    ns.tprint(`   Succès: ${successCount}/${deploymentPlan.length}`);
    ns.tprint(`   Échecs: ${failCount}`);
    ns.tprint(`   Threads actifs: ${totalThreads}`);
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    if (successCount > 0) {
        ns.tprint("✅ Déploiement terminé avec succès");
    } else {
        ns.tprint("❌ Déploiement échoué");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
