/**
 * 🔍 DIAGNOSTIC - Port de communication Batcher → Controller
 * 
 * Version corrigée - vérifie la communication entre Batcher et Controller
 * 
 * @usage run diagnostic-port-fix.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC - Communication Batcher → Controller");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DU PORT 4 (COMMANDS)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const COMMANDS_PORT = 4;
    
    ns.tprint("📨 État du port 4 (COMMANDS):");
    ns.tprint("─".repeat(60));
    
    // Vérifier si le port est vide
    const portHandle = ns.getPortHandle(COMMANDS_PORT);
    const isEmpty = portHandle.empty();
    
    ns.tprint(`  📊 État du port: ${isEmpty ? "VIDE" : "Contient des jobs"}`);
    
    if (!isEmpty) {
        ns.tprint(`  ⚠️  Le port contient des jobs non traités !`);
        ns.tprint(`     Le Controller n'arrive pas à les lire assez vite.`);
        
        // Essayer de peek le premier job
        try {
            const firstJob = portHandle.peek();
            if (firstJob !== "NULL PORT DATA") {
                ns.tprint(`  📋 Premier job en attente:`);
                const job = JSON.parse(firstJob);
                ns.tprint(`     Type: ${job.type || "N/A"}`);
                ns.tprint(`     Target: ${job.target || "N/A"}`);
                ns.tprint(`     Host: ${job.host || "N/A"}`);
            }
        } catch (e) {
            ns.tprint(`  ⚠️  Impossible de lire le premier job: ${e.message}`);
        }
    } else {
        ns.tprint(`  ✅ Port vide (normal si système au repos)`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🧪 TEST D'ÉCRITURE/LECTURE SUR LE PORT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🧪 Test d'écriture/lecture sur le port 4:");
    ns.tprint("─".repeat(60));
    
    // Nettoyer le port d'abord
    ns.clearPort(COMMANDS_PORT);
    ns.tprint("  🧹 Port nettoyé");
    
    // Créer un job de test
    const testJob = {
        type: "weaken",
        host: "nexus-node-0",
        target: "n00dles",
        threads: 1,
        delay: 0
    };
    
    // Écrire sur le port
    try {
        await portHandle.write(JSON.stringify(testJob));
        ns.tprint("  ✅ Écriture réussie");
    } catch (error) {
        ns.tprint(`  ❌ Erreur lors de l'écriture: ${error.message}`);
    }
    
    // Attendre un peu
    await ns.sleep(100);
    
    // Vérifier si le port contient quelque chose
    if (!portHandle.empty()) {
        ns.tprint("  ✅ Port contient des données après écriture");
        
        // Lire depuis le port
        try {
            const data = portHandle.read();
            if (data !== "NULL PORT DATA") {
                const job = JSON.parse(data);
                ns.tprint("  ✅ Lecture réussie");
                ns.tprint(`     Type: ${job.type}`);
                ns.tprint(`     Host: ${job.host}`);
                ns.tprint(`     Target: ${job.target}`);
            }
        } catch (error) {
            ns.tprint(`  ❌ Erreur lors de la lecture: ${error.message}`);
        }
    } else {
        ns.tprint("  ⚠️  Port vide après écriture (anormal)");
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES PROCESSUS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("⚙️  Processus du système:");
    ns.tprint("─".repeat(60));
    
    const systemProcesses = [
        "boot.js",
        "orchestrator.js", 
        "controller.js",
        "batcher.js"
    ];
    
    const homeProcs = ns.ps("home");
    
    for (const procName of systemProcesses) {
        const found = homeProcs.find(p => 
            p.filename === procName || 
            p.filename === `/${procName}` ||
            p.filename.includes(procName)
        );
        
        if (found) {
            ns.tprint(`  ✅ ${procName.padEnd(25)} → PID: ${found.pid}`);
        } else {
            ns.tprint(`  ❌ ${procName.padEnd(25)} → NON ACTIF !`);
        }
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 STATISTIQUES DES PROCESSUS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("📊 Statistiques globales:");
    ns.tprint("─".repeat(60));
    
    // Compter tous les processus sur tous les serveurs
    let totalProcesses = 0;
    let totalServersWithProcesses = 0;
    
    // Scanner le réseau
    const allServers = scanNetwork(ns);
    
    for (const server of allServers) {
        try {
            const procs = ns.ps(server);
            if (procs.length > 0) {
                totalProcesses += procs.length;
                totalServersWithProcesses++;
            }
        } catch (e) {
            // Ignorer
        }
    }
    
    ns.tprint(`  📊 Total serveurs: ${allServers.length}`);
    ns.tprint(`  ⚙️  Serveurs avec processus: ${totalServersWithProcesses}`);
    ns.tprint(`  🔢 Total processus actifs: ${totalProcesses}`);
    
    if (totalProcesses < 100) {
        ns.tprint(`  ⚠️  TRÈS PEU de processus actifs !`);
        ns.tprint(`     Avec 8.5 TB de RAM, vous devriez avoir 10,000+ processus`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 ANALYSE ET RECOMMANDATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("💡 ANALYSE ET RECOMMANDATIONS");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    const controllerActive = homeProcs.some(p => p.filename.includes("controller"));
    const batcherActive = homeProcs.some(p => p.filename.includes("batcher"));
    const orchestratorActive = homeProcs.some(p => p.filename.includes("orchestrator"));
    
    if (!orchestratorActive) {
        ns.tprint("❌ CRITIQUE: Orchestrator n'est pas actif !");
        ns.tprint("   → C'est le cerveau du système");
        ns.tprint("   → Solution: run boot.js");
        ns.tprint("");
    } else if (!controllerActive) {
        ns.tprint("❌ CRITIQUE: Controller n'est pas actif !");
        ns.tprint("   → Le système ne peut pas exécuter de jobs");
        ns.tprint("   → Solution: run boot.js");
        ns.tprint("");
    } else if (!batcherActive) {
        ns.tprint("❌ CRITIQUE: Batcher n'est pas actif !");
        ns.tprint("   → Le système ne génère pas de jobs");
        ns.tprint("   → Solution: run boot.js");
        ns.tprint("");
    } else if (totalProcesses < 100) {
        ns.tprint("⚠️  PROBLÈME: Très peu de processus actifs");
        ns.tprint("");
        ns.tprint("   Le système tourne mais n'exécute presque rien.");
        ns.tprint("");
        ns.tprint("   Causes possibles:");
        ns.tprint("   1. Le Batcher n'arrive pas à calculer les jobs");
        ns.tprint("   2. Le Controller refuse tous les jobs (ns.exec retourne 0)");
        ns.tprint("   3. Les workers se terminent immédiatement (crash)");
        ns.tprint("   4. Le port de communication est saturé");
        ns.tprint("");
        ns.tprint("   🚀 SOLUTION RECOMMANDÉE:");
        ns.tprint("   ┌─────────────────────────────────────────────┐");
        ns.tprint("   │  run global-kill.js                         │");
        ns.tprint("   │  (attendre 5 secondes)                      │");
        ns.tprint("   │  run boot.js                                │");
        ns.tprint("   └─────────────────────────────────────────────┘");
        ns.tprint("");
        ns.tprint("   Cela va:");
        ns.tprint("   ✓ Tuer tous les processus zombies");
        ns.tprint("   ✓ Réinitialiser les ports");
        ns.tprint("   ✓ Recopier les workers partout");
        ns.tprint("   ✓ Redistribuer les jobs correctement");
        ns.tprint("");
    } else {
        ns.tprint("✅ Le système semble fonctionner");
        ns.tprint(`   ${totalProcesses} processus actifs`);
        ns.tprint("");
        ns.tprint("   Si vous avez toujours PROFIT = 0/s:");
        ns.tprint("   • Attendez 1-2 minutes (les premiers batches prennent du temps)");
        ns.tprint("   • Vérifiez les logs: tail hack/controller.js");
        ns.tprint("   • Vérifiez les cibles: tail hack/watcher.js (si disponible)");
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}

/**
 * Scan simple du réseau
 */
function scanNetwork(ns) {
    const queue = ["home"];
    const visited = new Set();
    const servers = [];
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (visited.has(current)) continue;
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
            // Ignorer
        }
    }
    
    return servers;
}
