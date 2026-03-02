/**
 * DIAGNOSTIC RAM DÉTAILLÉ - BATCHER FFD ALGORITHM
 * 
 * Montre exactement comment le Batcher voit la RAM disponible
 * et pourquoi il skip les jobs
 * 
 * @param {NS} ns
 */

export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC RAM - ALGORITHME FFD DU BATCHER");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : SCANNER TOUS LES SERVEURS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const allServers = scanAll(ns);
    const computeServers = [];
    
    // Filtrer : serveurs avec root + RAM disponible
    for (const server of allServers) {
        if (!ns.hasRootAccess(server)) continue;
        
        const maxRam = ns.getServerMaxRam(server);
        if (maxRam === 0) continue;
        
        const usedRam = ns.getServerUsedRam(server);
        let freeRam = maxRam - usedRam;
        
        // Si c'est home, appliquer RESERVED_HOME_RAM
        if (server === "home") {
            const RESERVED_HOME_RAM = 128; // Depuis constants.js
            freeRam = Math.max(0, freeRam - RESERVED_HOME_RAM);
        }
        
        computeServers.push({
            hostname: server,
            maxRam: maxRam,
            usedRam: usedRam,
            freeRam: freeRam,
            utilizationPct: (usedRam / maxRam * 100).toFixed(1)
        });
    }
    
    // Trier par RAM libre décroissante (comme FFD)
    computeServers.sort((a, b) => b.freeRam - a.freeRam);
    
    ns.tprint("📊 SERVEURS DE CALCUL (triés par RAM libre décroissante)");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("");
    
    let totalMaxRam = 0;
    let totalUsedRam = 0;
    let totalFreeRam = 0;
    
    // Afficher le top 10
    const displayCount = Math.min(10, computeServers.length);
    
    for (let i = 0; i < displayCount; i++) {
        const server = computeServers[i];
        
        ns.tprint(`${i + 1}. ${server.hostname.padEnd(20)} │ ${ns.formatRam(server.freeRam).padEnd(12)} libre  │ ${server.utilizationPct.padStart(5)}% utilisé`);
        
        totalMaxRam += server.maxRam;
        totalUsedRam += server.usedRam;
        totalFreeRam += server.freeRam;
    }
    
    if (computeServers.length > displayCount) {
        ns.tprint(`... et ${computeServers.length - displayCount} autres serveurs`);
        
        // Ajouter les stats du reste
        for (let i = displayCount; i < computeServers.length; i++) {
            totalMaxRam += computeServers[i].maxRam;
            totalUsedRam += computeServers[i].usedRam;
            totalFreeRam += computeServers[i].freeRam;
        }
    }
    
    ns.tprint("");
    ns.tprint("📊 RÉSUMÉ TOTAL :");
    ns.tprint(`   Serveurs : ${computeServers.length}`);
    ns.tprint(`   RAM totale : ${ns.formatRam(totalMaxRam)}`);
    ns.tprint(`   RAM utilisée : ${ns.formatRam(totalUsedRam)} (${(totalUsedRam / totalMaxRam * 100).toFixed(1)}%)`);
    ns.tprint(`   RAM libre : ${ns.formatRam(totalFreeRam)}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : CALCULER LES COÛTS RAM DES WORKERS
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("💾 COÛT RAM DES WORKERS");
    ns.tprint("────────────────────────────────────────────────────────────");
    
    const workerRam = {
        hack: ns.getScriptRam("/hack/workers/hack.js", "home"),
        grow: ns.getScriptRam("/hack/workers/grow.js", "home"),
        weaken: ns.getScriptRam("/hack/workers/weaken.js", "home"),
        share: ns.getScriptRam("/hack/workers/share.js", "home")
    };
    
    ns.tprint(`   hack.js   : ${ns.formatRam(workerRam.hack)} par thread`);
    ns.tprint(`   grow.js   : ${ns.formatRam(workerRam.grow)} par thread`);
    ns.tprint(`   weaken.js : ${ns.formatRam(workerRam.weaken)} par thread`);
    ns.tprint(`   share.js  : ${ns.formatRam(workerRam.share)} par thread`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 3 : SIMULER UN BATCH HWGW (omega-net)
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🎯 SIMULATION BATCH HWGW (omega-net)");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("");
    
    // Threads typiques d'un batch (d'après les logs)
    const batchJobs = [
        { type: "grow", threads: 794, ramPerThread: workerRam.grow },
        { type: "hack", threads: 501, ramPerThread: workerRam.hack },
        { type: "weaken", threads: 64, ramPerThread: workerRam.weaken },
        { type: "weaken", threads: 21, ramPerThread: workerRam.weaken }
    ];
    
    // Trier par threads décroissants (FFD)
    batchJobs.sort((a, b) => b.threads - a.threads);
    
    ns.tprint("📦 JOBS DU BATCH (triés par taille décroissante) :");
    ns.tprint("");
    
    for (const job of batchJobs) {
        const ramNeeded = job.threads * job.ramPerThread;
        ns.tprint(`   ${job.type.padEnd(6)} : ${job.threads.toString().padStart(4)} threads × ${ns.formatRam(job.ramPerThread)} = ${ns.formatRam(ramNeeded)}`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 4 : SIMULER L'ALGORITHME FFD
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🔥 SIMULATION ALGORITHME FFD (First-Fit Decreasing)");
    ns.tprint("────────────────────────────────────────────────────────────");
    ns.tprint("");
    
    // Copier l'état des serveurs
    const serversState = computeServers.map(s => ({
        hostname: s.hostname,
        freeRam: s.freeRam
    }));
    
    let totalThreadsPlanned = 0;
    let totalThreadsPlaced = 0;
    
    for (const job of batchJobs) {
        const ramNeeded = job.threads * job.ramPerThread;
        totalThreadsPlanned += job.threads;
        
        ns.tprint(`📦 Tentative placement : ${job.type} (${job.threads}t, ${ns.formatRam(ramNeeded)})`);
        
        // Chercher le premier serveur avec assez de RAM (FFD)
        let placed = false;
        
        for (const server of serversState) {
            if (server.freeRam >= ramNeeded) {
                // Placement réussi
                server.freeRam -= ramNeeded;
                totalThreadsPlaced += job.threads;
                
                ns.tprint(`   ✅ Placé sur ${server.hostname} (${ns.formatRam(server.freeRam)} restants)`);
                placed = true;
                break;
            }
        }
        
        if (!placed) {
            ns.tprint(`   ❌ SKIPPÉ - Aucun serveur n'a ${ns.formatRam(ramNeeded)} libre`);
            ns.tprint(`      → Plus gros serveur disponible : ${ns.formatRam(serversState[0].freeRam)}`);
        }
        
        ns.tprint("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONCLUSION
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("💡 DIAGNOSTIC FINAL");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    const placementRate = (totalThreadsPlaced / totalThreadsPlanned * 100).toFixed(1);
    
    ns.tprint(`📊 Threads planifiés : ${totalThreadsPlanned}`);
    ns.tprint(`📊 Threads placés : ${totalThreadsPlaced} (${placementRate}%)`);
    ns.tprint("");
    
    if (placementRate < 50) {
        ns.tprint("❌ PROBLÈME CRITIQUE : <50% des threads placés !");
        ns.tprint("");
        ns.tprint("🔍 CAUSE IDENTIFIÉE :");
        ns.tprint("");
        
        // Analyser la fragmentation
        const biggestServer = computeServers[0];
        const biggestJobRam = batchJobs[0].threads * batchJobs[0].ramPerThread;
        
        if (biggestServer.freeRam < biggestJobRam) {
            ns.tprint("   🔴 FRAGMENTATION RAM EXCESSIVE");
            ns.tprint("");
            ns.tprint(`   Le plus gros job demande : ${ns.formatRam(biggestJobRam)}`);
            ns.tprint(`   Le plus gros serveur a : ${ns.formatRam(biggestServer.freeRam)} libre`);
            ns.tprint("");
            ns.tprint("   → Vos serveurs sont trop PETITS pour les gros jobs !");
            ns.tprint("");
            ns.tprint("🔧 SOLUTIONS :");
            ns.tprint("");
            ns.tprint("   OPTION 1 : Upgrader les serveurs nexus-node");
            ns.tprint("   ------------------------------------------");
            ns.tprint("   Actuellement : 128 GB par serveur");
            ns.tprint("   Recommandé : 256 GB ou 512 GB par serveur");
            ns.tprint("");
            ns.tprint("   Commandes :");
            ns.tprint("   ```");
            ns.tprint("   // Supprimer les petits serveurs");
            ns.tprint("   for (let i = 0; i < 25; i++) {");
            ns.tprint("       deleteServer('nexus-node-' + i);");
            ns.tprint("   }");
            ns.tprint("   // Acheter des plus gros");
            ns.tprint("   for (let i = 0; i < 15; i++) {");
            ns.tprint("       purchaseServer('nexus-node-' + i, 256); // 256 GB");
            ns.tprint("   }");
            ns.tprint("   ```");
            ns.tprint("");
            ns.tprint("   OPTION 2 : Réduire hackPercent (moins de threads par job)");
            ns.tprint("   ----------------------------------------------------------");
            ns.tprint("   Éditez /lib/constants.js :");
            ns.tprint("   HACK_PERCENT_CANDIDATES: [0.01, 0.02, 0.05, 0.10] // Au lieu de jusqu'à 0.50");
            ns.tprint("");
            ns.tprint("   Cela forcera le Batcher à créer des batches plus petits");
            ns.tprint("   qui rentrent dans vos serveurs 128 GB.");
            ns.tprint("");
            ns.tprint("   OPTION 3 : Attendre que les serveurs se vident");
            ns.tprint("   -----------------------------------------------");
            ns.tprint("   Les weaken en cours vont finir par se terminer");
            ns.tprint("   et libérer de la RAM.");
            ns.tprint("");
            ns.tprint("   Mais c'est lent (peut prendre 10-30 minutes).");
        } else {
            ns.tprint("   ⚠️  Cause inconnue - possible bug dans le Batcher");
            ns.tprint("   Partagez ce diagnostic avec le développeur.");
        }
        
    } else {
        ns.tprint("✅ Taux de placement acceptable (>50%)");
        ns.tprint("");
        ns.tprint("Le système devrait générer des revenus.");
        ns.tprint("Si vous voyez toujours 0$/s, vérifiez :");
        ns.tprint("  • Les workers sont bien exécutés : ps nexus-node-0");
        ns.tprint("  • Les cibles ont de l'argent : getServerMoneyAvailable('omega-net')");
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}

/**
 * Scanner récursif de tous les serveurs
 */
function scanAll(ns) {
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (visited.has(current)) continue;
        visited.add(current);
        
        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }
    
    return Array.from(visited);
}
