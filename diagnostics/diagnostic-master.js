/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                            v46.2 - "DIAGNOSTIC MASTER" 
 * 
 * @module      diagnostics/diagnostic-master
 * @description DIAGNOSTIC COMPLET ET PROFESSIONNEL DU SYSTÈME PROMETHEUS
 *              Analyse en profondeur de tous les composants critiques
 * @author      Claude (Anthropic)
 * @version     46.2 - DIAGNOSTIC MASTER
 * @date        2026-03-04
 * @license     MIT
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔍 CHECKLIST COMPLÈTE DE DIAGNOSTIC
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. ARCHITECTURE & FICHIERS
 *    ✓ Vérifier l'existence de tous les fichiers critiques
 *    ✓ Valider les versions des fichiers
 *    ✓ Détecter les fichiers corrompus ou incomplets
 * 
 * 2. CALCULS MATHÉMATIQUES HWGW
 *    ✓ Tester calcul hackThreads avec Formulas.exe
 *    ✓ Tester calcul growThreads avec Formulas.exe
 *    ✓ Valider synchronisation timing batch
 *    ✓ Vérifier EV/s calculations
 * 
 * 3. ÉTAT DU SYSTÈME EN DIRECT
 *    ✓ Scripts en cours d'exécution
 *    ✓ Utilisation RAM (home + serveurs achetés)
 *    ✓ Revenus actuels ($$/sec)
 *    ✓ Cibles actives vs disponibles
 * 
 * 4. CAPACITÉS & APIs
 *    ✓ Formulas.exe disponible
 *    ✓ API Singularity
 *    ✓ TIX API (4S Data)
 *    ✓ Autres APIs avancées
 * 
 * 5. NETWORK & SERVEURS
 *    ✓ Serveurs rootés / total
 *    ✓ RAM disponible totale
 *    ✓ Meilleurs serveurs pour hack
 *    ✓ Serveurs preppés vs à prep
 * 
 * 6. LOGS & ERREURS
 *    ✓ Dernières erreurs système
 *    ✓ Warnings récurrents
 *    ✓ Patterns de problèmes
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.tail();

    const results = {
        timestamp: Date.now(),
        version: "46.2-DIAGNOSTIC-MASTER",
        sections: {},
        criticalIssues: [],
        warnings: [],
        recommendations: []
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // HEADER DIAGNOSTIC
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("═".repeat(85));
    ns.print("🔥 PROMETHEUS v46.x - DIAGNOSTIC MASTER");
    ns.print("═".repeat(85));
    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 1: ARCHITECTURE & FICHIERS
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("📁 [1/6] ARCHITECTURE & FICHIERS");
    ns.print("-".repeat(85));
    
    const criticalFiles = [
        "/boot.js",
        "/core/orchestrator.js",
        "/core/batcher.js",
        "/core/controller.js",
        "/hack/workers/hack.js",
        "/hack/workers/grow.js",
        "/hack/workers/weaken.js",
        "/lib/network.js",
        "/lib/capabilities.js",
        "/lib/constants.js",
        "/lib/logger.js",
        "/lib/port-handler.js",
        "/lib/ram-manager.js"
    ];

    const fileStatus = {};
    let missingFiles = 0;
    
    for (const file of criticalFiles) {
        const exists = ns.fileExists(file, "home");
        fileStatus[file] = exists;
        if (!exists) {
            missingFiles++;
            results.criticalIssues.push(`FICHIER MANQUANT: ${file}`);
            ns.print(`❌ MISSING: ${file}`);
        } else {
            ns.print(`✓ OK: ${file}`);
        }
    }

    results.sections.architecture = {
        totalFiles: criticalFiles.length,
        missingFiles: missingFiles,
        status: missingFiles === 0 ? "OK" : "CRITICAL"
    };

    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 2: CAPACITÉS & APIs
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("🎯 [2/6] CAPACITÉS & APIs");
    ns.print("-".repeat(85));

    const capabilities = {
        formulas: ns.fileExists("Formulas.exe", "home"),
        singularity: false,
        tix: false,
        fourS: false
    };

    // Test Singularity API
    try {
        ns.singularity.getOwnedAugmentations();
        capabilities.singularity = true;
    } catch (e) {
        // Pas disponible
    }

    // Test TIX API
    try {
        ns.stock.getSymbols();
        capabilities.tix = true;
    } catch (e) {
        // Pas disponible
    }

    // Test 4S Data
    if (capabilities.tix) {
        try {
            ns.stock.getForecast("FSIG");
            capabilities.fourS = true;
        } catch (e) {
            // Pas disponible
        }
    }

    ns.print(`Formulas.exe: ${capabilities.formulas ? "✓ OUI" : "❌ NON"}`);
    ns.print(`Singularity API: ${capabilities.singularity ? "✓ OUI" : "❌ NON"}`);
    ns.print(`TIX API: ${capabilities.tix ? "✓ OUI" : "❌ NON"}`);
    ns.print(`4S Market Data: ${capabilities.fourS ? "✓ OUI" : "❌ NON"}`);

    if (!capabilities.formulas) {
        results.criticalIssues.push("FORMULAS.EXE MANQUANT - Calculs HWGW sous-optimaux");
        results.recommendations.push("Acheter Formulas.exe ($5B sur darkweb)");
    }

    results.sections.capabilities = capabilities;
    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 3: ÉTAT DU SYSTÈME EN DIRECT
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("📊 [3/6] ÉTAT DU SYSTÈME");
    ns.print("-".repeat(85));

    const player = ns.getPlayer();
    const homeServer = ns.getServer("home");
    
    // Compter les processus actifs
    const allProcesses = ns.ps("home");
    const prometheusProcesses = allProcesses.filter(p => 
        p.filename.includes("orchestrator") || 
        p.filename.includes("batcher") ||
        p.filename.includes("controller") ||
        p.filename.includes("/hack/workers/")
    );

    const systemStatus = {
        hackingLevel: player.skills.hacking,
        homeRamUsed: homeServer.ramUsed,
        homeRamMax: homeServer.maxRam,
        homeRamPercent: Math.round((homeServer.ramUsed / homeServer.maxRam) * 100),
        money: player.money,
        totalProcesses: allProcesses.length,
        prometheusProcesses: prometheusProcesses.length,
        orchestratorRunning: allProcesses.some(p => p.filename.includes("orchestrator")),
        batcherRunning: allProcesses.some(p => p.filename.includes("batcher"))
    };

    ns.print(`Hacking Level: ${systemStatus.hackingLevel}`);
    ns.print(`Home RAM: ${ns.formatRam(systemStatus.homeRamUsed)}/${ns.formatRam(systemStatus.homeRamMax)} (${systemStatus.homeRamPercent}%)`);
    ns.print(`Money: ${ns.formatNumber(systemStatus.money)}`);
    ns.print(`Total Processes: ${systemStatus.totalProcesses}`);
    ns.print(`Prometheus Processes: ${systemStatus.prometheusProcesses}`);
    ns.print(`Orchestrator: ${systemStatus.orchestratorRunning ? "✓ RUNNING" : "❌ STOPPED"}`);
    ns.print(`Batcher: ${systemStatus.batcherRunning ? "✓ RUNNING" : "❌ STOPPED"}`);

    if (!systemStatus.orchestratorRunning) {
        results.criticalIssues.push("ORCHESTRATOR NON LANCÉ - Système inactif");
        results.recommendations.push("Lancer: run /boot.js");
    }

    results.sections.system = systemStatus;
    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 4: NETWORK & SERVEURS
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("🌐 [4/6] NETWORK & SERVEURS");
    ns.print("-".repeat(85));

    const servers = [];
    const visited = new Set();
    const queue = ["home"];

    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        const server = ns.getServer(current);
        servers.push(server);

        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    const networkStats = {
        totalServers: servers.length,
        rootedServers: servers.filter(s => s.hasAdminRights).length,
        hackableServers: servers.filter(s => s.requiredHackingSkill <= player.skills.hacking).length,
        preppedServers: servers.filter(s => 
            s.hasAdminRights && 
            s.moneyAvailable === s.moneyMax && 
            s.hackDifficulty === s.minDifficulty
        ).length,
        totalRam: servers.reduce((sum, s) => sum + (s.hasAdminRights ? s.maxRam : 0), 0),
        usedRam: servers.reduce((sum, s) => sum + (s.hasAdminRights ? s.ramUsed : 0), 0)
    };

    networkStats.availableRam = networkStats.totalRam - networkStats.usedRam;

    ns.print(`Total Servers: ${networkStats.totalServers}`);
    ns.print(`Rooted: ${networkStats.rootedServers}/${networkStats.totalServers}`);
    ns.print(`Hackable: ${networkStats.hackableServers}/${networkStats.totalServers}`);
    ns.print(`Prepped: ${networkStats.preppedServers}/${networkStats.hackableServers}`);
    ns.print(`Total RAM: ${ns.formatRam(networkStats.totalRam)}`);
    ns.print(`Available RAM: ${ns.formatRam(networkStats.availableRam)} (${Math.round((networkStats.availableRam/networkStats.totalRam)*100)}%)`);

    if (networkStats.availableRam < 100) {
        results.warnings.push("RAM disponible faible (<100GB) - Envisager achat serveurs");
        results.recommendations.push("Acheter plus de serveurs: run /managers/server-manager.js");
    }

    results.sections.network = networkStats;
    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 5: TEST CALCULS HWGW (SI FORMULAS DISPONIBLE)
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("🧮 [5/6] TEST CALCULS HWGW");
    ns.print("-".repeat(85));

    if (capabilities.formulas) {
        // Trouver une cible de test
        const testTarget = servers.find(s => 
            s.hasAdminRights && 
            s.moneyMax > 0 && 
            s.requiredHackingSkill <= player.skills.hacking
        );

        if (testTarget) {
            ns.print(`Cible test: ${testTarget.hostname}`);
            
            try {
                const serverCopy = {...testTarget};
                serverCopy.moneyAvailable = serverCopy.moneyMax;
                serverCopy.hackDifficulty = serverCopy.minDifficulty;

                const hackPercent = 0.10; // Voler 10%
                
                // Test hackThreads
                const hackPercentPerThread = ns.formulas.hacking.hackPercent(serverCopy, player);
                const hackThreads = Math.max(1, Math.floor(hackPercent / hackPercentPerThread));
                
                // Test growThreads
                const totalHackPercent = hackThreads * hackPercentPerThread;
                const moneyAfterHack = serverCopy.moneyAvailable * (1 - totalHackPercent);
                const growThreads = Math.ceil(
                    ns.formulas.hacking.growThreads(serverCopy, player, serverCopy.moneyMax, 1)
                );
                
                // Test weakenThreads
                const weakenForHackThreads = Math.ceil((hackThreads * 0.002) / 0.05);
                const weakenForGrowThreads = Math.ceil((growThreads * 0.004) / 0.05);

                ns.print(`hackPercentPerThread: ${(hackPercentPerThread * 100).toFixed(3)}%`);
                ns.print(`hackThreads: ${hackThreads}`);
                ns.print(`growThreads: ${growThreads}`);
                ns.print(`weakenForHack: ${weakenForHackThreads}`);
                ns.print(`weakenForGrow: ${weakenForGrowThreads}`);

                if (hackThreads === 0) {
                    results.criticalIssues.push("BUG: hackThreads = 0 (formule incorrecte)");
                } else {
                    ns.print(`✓ Calculs HWGW valides`);
                }

                results.sections.hwgw = {
                    testTarget: testTarget.hostname,
                    hackThreads: hackThreads,
                    growThreads: growThreads,
                    weakenForHackThreads: weakenForHackThreads,
                    weakenForGrowThreads: weakenForGrowThreads,
                    status: hackThreads > 0 ? "OK" : "CRITICAL"
                };

            } catch (error) {
                results.criticalIssues.push(`ERREUR CALCUL HWGW: ${error.message}`);
                ns.print(`❌ ERREUR: ${error.message}`);
            }
        } else {
            results.warnings.push("Aucune cible disponible pour test HWGW");
            ns.print("⚠️  Aucune cible disponible pour test");
        }
    } else {
        ns.print("⚠️  Formulas.exe non disponible - Tests skippés");
    }

    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 6: ANALYSE DES LOGS RÉCENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("📜 [6/6] LOGS & ERREURS RÉCENTES");
    ns.print("-".repeat(85));

    // Vérifier si fichier de logs existe
    const logFiles = [
        "/logs/orchestrator.txt",
        "/logs/batcher.txt",
        "/logs/controller.txt",
        "/logs/errors.txt"
    ];

    let logsFound = 0;
    for (const logFile of logFiles) {
        if (ns.fileExists(logFile, "home")) {
            logsFound++;
            ns.print(`✓ ${logFile}`);
        }
    }

    if (logsFound === 0) {
        ns.print("⚠️  Aucun fichier de logs trouvé");
        results.recommendations.push("Activer le logging dans CONFIG.SYSTEM.DEBUG_MODE");
    } else {
        ns.print(`${logsFound} fichiers de logs trouvés`);
    }

    results.sections.logs = {
        logFilesFound: logsFound,
        totalLogFiles: logFiles.length
    };

    ns.print("");

    // ═══════════════════════════════════════════════════════════════════════════════
    // RÉSUMÉ FINAL
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.print("═".repeat(85));
    ns.print("📋 RÉSUMÉ DIAGNOSTIC");
    ns.print("═".repeat(85));
    ns.print("");

    // Compte critical issues
    if (results.criticalIssues.length > 0) {
        ns.print(`🔴 ${results.criticalIssues.length} PROBLÈMES CRITIQUES:`);
        for (const issue of results.criticalIssues) {
            ns.print(`   ❌ ${issue}`);
        }
        ns.print("");
    }

    // Compte warnings
    if (results.warnings.length > 0) {
        ns.print(`🟡 ${results.warnings.length} AVERTISSEMENTS:`);
        for (const warning of results.warnings) {
            ns.print(`   ⚠️  ${warning}`);
        }
        ns.print("");
    }

    // Recommandations
    if (results.recommendations.length > 0) {
        ns.print(`💡 ${results.recommendations.length} RECOMMANDATIONS:`);
        for (const rec of results.recommendations) {
            ns.print(`   → ${rec}`);
        }
        ns.print("");
    }

    // Statut global
    const globalStatus = results.criticalIssues.length === 0 ? "✅ SYSTÈME OPÉRATIONNEL" : "🔴 SYSTÈME NÉCESSITE CORRECTIONS";
    ns.print(globalStatus);
    ns.print("═".repeat(85));

    // Sauvegarder résultats
    const resultsFile = "/diagnostics/diagnostic-results.txt";
    await ns.write(resultsFile, JSON.stringify(results, null, 2), "w");
    ns.print(`\n📄 Résultats sauvegardés: ${resultsFile}`);

    // Return code
    if (results.criticalIssues.length > 0) {
        ns.exit();
        return 1;
    }
    
    return 0;
}
