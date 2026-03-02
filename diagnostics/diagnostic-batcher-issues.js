/**
 * 🔍 DIAGNOSTIC - Problèmes Batcher & Port
 * 
 * Analyse les problèmes de placement de jobs et de contention sur le port 4
 * 
 * @usage run diagnostics/diagnostic-batcher-issues.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC - PROBLÈMES BATCHER & CONTROLLER");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════
    // PROBLÈME 1 : JOBS WEAKEN TROP GROS
    // ═══════════════════════════════════════════════════════════════════════
    
    ns.tprint("❌ PROBLÈME 1 : JOBS WEAKEN GÉANTS NON PLACÉS");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("");
    ns.tprint("Symptômes observés :");
    ns.tprint("  • Job weaken (477t) → 477/477 threads NON PLACÉS");
    ns.tprint("  • Job weaken (400t) → 400/400 threads NON PLACÉS");
    ns.tprint("  • Total perdu : ~877 threads de weaken");
    ns.tprint("");
    ns.tprint("Cause probable :");
    ns.tprint("  → minThreadsPerSubjob trop élevé (probablement 5 ou 10)");
    ns.tprint("  → Le découpage ne peut pas créer de sous-jobs assez petits");
    ns.tprint("  → RAM fragmentée mais non utilisable");
    ns.tprint("");
    
    // Calculer la RAM disponible
    const servers = [];
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        
        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) queue.push(neighbor);
        }
        
        if (ns.hasRootAccess(current)) {
            const maxRam = ns.getServerMaxRam(current);
            const usedRam = ns.getServerUsedRam(current);
            const freeRam = maxRam - usedRam;
            
            if (maxRam > 0) {
                servers.push({
                    hostname: current,
                    maxRam,
                    usedRam,
                    freeRam
                });
            }
        }
    }
    
    // Trier par RAM libre (décroissant)
    servers.sort((a, b) => b.freeRam - a.freeRam);
    
    const weakenRam = 1.75;
    
    ns.tprint("📊 ANALYSE RAM DISPONIBLE :");
    ns.tprint("");
    
    let totalFreeRam = 0;
    let serversWithSpace = 0;
    let totalWeakenThreadsPossible = 0;
    
    for (const server of servers) {
        totalFreeRam += server.freeRam;
        if (server.freeRam >= weakenRam) {
            serversWithSpace++;
            totalWeakenThreadsPossible += Math.floor(server.freeRam / weakenRam);
        }
    }
    
    ns.tprint(`  RAM totale libre : ${ns.formatRam(totalFreeRam)}`);
    ns.tprint(`  Serveurs avec espace : ${serversWithSpace}/${servers.length}`);
    ns.tprint(`  Threads weaken possibles : ${totalWeakenThreadsPossible}`);
    ns.tprint("");
    
    // Top 10 serveurs avec le plus de RAM libre
    ns.tprint("🔝 TOP 10 SERVEURS (RAM libre) :");
    ns.tprint("");
    for (let i = 0; i < Math.min(10, servers.length); i++) {
        const s = servers[i];
        const threadsWeaken = Math.floor(s.freeRam / weakenRam);
        ns.tprint(`  ${(i+1).toString().padStart(2)}. ${s.hostname.padEnd(20)} : ${ns.formatRam(s.freeRam).padStart(10)} (${threadsWeaken}t weaken)`);
    }
    ns.tprint("");
    
    // Serveurs avec RAM fragmentée (entre 1.75 et 10 GB)
    const fragmentedServers = servers.filter(s => s.freeRam >= weakenRam && s.freeRam < 10);
    ns.tprint(`💔 SERVEURS AVEC RAM FRAGMENTÉE (${weakenRam} - 10 GB) :`);
    ns.tprint(`  Count : ${fragmentedServers.length}`);
    ns.tprint(`  RAM totale : ${ns.formatRam(fragmentedServers.reduce((sum, s) => sum + s.freeRam, 0))}`);
    ns.tprint(`  Threads possibles : ${fragmentedServers.reduce((sum, s) => sum + Math.floor(s.freeRam / weakenRam), 0)}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════
    // PROBLÈME 2 : SATURATION PORT 4
    // ═══════════════════════════════════════════════════════════════════════
    
    ns.tprint("❌ PROBLÈME 2 : SATURATION DU PORT 4");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("");
    ns.tprint("Symptômes observés :");
    ns.tprint("  • ❌ WriteJSON échoué après 5 tentatives (×20+)");
    ns.tprint("  • ✅ WriteJSON réussi seulement après 2-5 tentatives");
    ns.tprint("  • Dispatch de grow échoue fréquemment");
    ns.tprint("");
    ns.tprint("Cause probable :");
    ns.tprint("  → Batcher envoie trop de jobs simultanément");
    ns.tprint("  → Controller ne lit pas assez vite le port");
    ns.tprint("  → Contention : plusieurs writes en même temps");
    ns.tprint("");
    
    // Vérifier le port 4
    const port4 = ns.getPortHandle(4);
    ns.tprint("📡 ÉTAT DU PORT 4 :");
    ns.tprint(`  Données en attente : ${port4.data.length}`);
    ns.tprint(`  Port plein ? ${port4.full() ? '⚠️ OUI' : '✅ NON'}`);
    ns.tprint(`  Port vide ? ${port4.empty() ? '✅ OUI' : '⚠️ NON'}`);
    ns.tprint("");
    
    // Vérifier le Controller
    const controllerRunning = ns.ps("home").some(p => p.filename === "hack/controller.js");
    ns.tprint("🎮 CONTROLLER :");
    ns.tprint(`  Status : ${controllerRunning ? '✅ RUNNING' : '❌ STOPPED'}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════
    // SOLUTIONS RECOMMANDÉES
    // ═══════════════════════════════════════════════════════════════════════
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("💡 SOLUTIONS RECOMMANDÉES");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    ns.tprint("🔧 SOLUTION 1 : Réduire minThreadsPerSubjob");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("  Fichier : core/batcher.js");
    ns.tprint("  Ligne : Cherchez 'const minThreadsPerSubjob'");
    ns.tprint("  Changement : minThreadsPerSubjob = 5 → 1");
    ns.tprint("");
    ns.tprint("  Impact :");
    ns.tprint("    ✅ Permet de placer des jobs de 1 thread minimum");
    ns.tprint("    ✅ Utilise la RAM fragmentée");
    ns.tprint("    ✅ Réduit les threads perdus");
    ns.tprint("");
    
    ns.tprint("🔧 SOLUTION 2 : Ralentir le Batcher");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("  Fichier : core/batcher.js");
    ns.tprint("  Ligne : Cherchez 'BATCH_INTERVAL' ou cycle delay");
    ns.tprint("  Changement : Augmenter le délai entre batchs");
    ns.tprint("");
    ns.tprint("  Impact :");
    ns.tprint("    ✅ Réduit la contention sur le port 4");
    ns.tprint("    ✅ Donne plus de temps au Controller");
    ns.tprint("    ⚠️  Réduit légèrement le profit/seconde");
    ns.tprint("");
    
    ns.tprint("🔧 SOLUTION 3 : Augmenter la RAM des serveurs");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("  Action : Acheter plus de serveurs ou upgrader");
    ns.tprint("  Commande : run managers/server-manager.js");
    ns.tprint("");
    ns.tprint("  Impact :");
    ns.tprint("    ✅ Plus de RAM = moins de fragmentation");
    ns.tprint("    ✅ Jobs plus gros peuvent rentrer");
    ns.tprint("    ✅ Moins de découpage nécessaire");
    ns.tprint("");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("📋 RÉSUMÉ");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    if (totalWeakenThreadsPossible >= 877) {
        ns.tprint("✅ RAM suffisante pour placer les 877 threads weaken perdus");
        ns.tprint("   → Le problème est minThreadsPerSubjob trop élevé");
        ns.tprint("   → SOLUTION : Réduire à 1 dans batcher.js");
    } else {
        ns.tprint("⚠️  RAM INSUFFISANTE pour placer 877 threads weaken");
        ns.tprint(`   → Possible : ${totalWeakenThreadsPossible} threads`);
        ns.tprint(`   → Manque : ${877 - totalWeakenThreadsPossible} threads`);
        ns.tprint("   → SOLUTION : Acheter plus de serveurs RAM");
    }
    ns.tprint("");
    
    if (port4.data.length > 50) {
        ns.tprint("⚠️  Port 4 saturé (>50 messages en attente)");
        ns.tprint("   → SOLUTION : Ralentir le Batcher ou accélérer le Controller");
    } else {
        ns.tprint("✅ Port 4 OK (peu de messages en attente)");
    }
    ns.tprint("");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
