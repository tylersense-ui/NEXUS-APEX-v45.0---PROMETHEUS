/**
 * 🔍 DIAGNOSTIC 2 : PROCESSUS ACTIFS
 * 
 * Vérifie quels workers tournent réellement et sur quels serveurs.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC 2 : PROCESSUS ACTIFS (WORKERS)");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // Scanner tous les serveurs
    const servers = [];
    
    function scan(host, depth = 0) {
        if (depth > 20) return;
        if (servers.includes(host)) return;
        servers.push(host);
        
        const neighbors = ns.scan(host);
        for (const neighbor of neighbors) {
            scan(neighbor, depth + 1);
        }
    }
    
    scan("home");
    
    ns.print(`📊 Scan de ${servers.length} serveurs...`);
    ns.print("");
    
    // Compter les workers actifs
    const workerStats = {
        hack: { count: 0, threads: 0, servers: new Set() },
        grow: { count: 0, threads: 0, servers: new Set() },
        weaken: { count: 0, threads: 0, servers: new Set() },
        share: { count: 0, threads: 0, servers: new Set() }
    };
    
    let totalProcesses = 0;
    const serverProcesses = new Map();
    
    for (const server of servers) {
        const processes = ns.ps(server);
        
        for (const proc of processes) {
            // Détecter les workers
            if (proc.filename.includes('/hack/workers/hack.js')) {
                workerStats.hack.count++;
                workerStats.hack.threads += proc.threads;
                workerStats.hack.servers.add(server);
                totalProcesses++;
            } else if (proc.filename.includes('/hack/workers/grow.js')) {
                workerStats.grow.count++;
                workerStats.grow.threads += proc.threads;
                workerStats.grow.servers.add(server);
                totalProcesses++;
            } else if (proc.filename.includes('/hack/workers/weaken.js')) {
                workerStats.weaken.count++;
                workerStats.weaken.threads += proc.threads;
                workerStats.weaken.servers.add(server);
                totalProcesses++;
            } else if (proc.filename.includes('/hack/workers/share.js')) {
                workerStats.share.count++;
                workerStats.share.threads += proc.threads;
                workerStats.share.servers.add(server);
                totalProcesses++;
            }
            
            // Compter par serveur
            if (!serverProcesses.has(server)) {
                serverProcesses.set(server, []);
            }
            serverProcesses.get(server).push(proc);
        }
    }
    
    ns.print("⚙️  WORKERS ACTIFS :");
    ns.print("─────────────────────────────────────────────────────────────");
    ns.print("");
    
    ns.print(`   💸 HACK   : ${workerStats.hack.count.toString().padStart(6)} processus, ${ns.formatNumber(workerStats.hack.threads).padStart(8)} threads sur ${workerStats.hack.servers.size} serveurs`);
    ns.print(`   💪 GROW   : ${workerStats.grow.count.toString().padStart(6)} processus, ${ns.formatNumber(workerStats.grow.threads).padStart(8)} threads sur ${workerStats.grow.servers.size} serveurs`);
    ns.print(`   🛡️  WEAKEN : ${workerStats.weaken.count.toString().padStart(6)} processus, ${ns.formatNumber(workerStats.weaken.threads).padStart(8)} threads sur ${workerStats.weaken.servers.size} serveurs`);
    ns.print(`   🤝 SHARE  : ${workerStats.share.count.toString().padStart(6)} processus, ${ns.formatNumber(workerStats.share.threads).padStart(8)} threads sur ${workerStats.share.servers.size} serveurs`);
    ns.print("");
    ns.print(`   📊 TOTAL  : ${totalProcesses} processus workers actifs`);
    
    ns.print("");
    ns.print("🔝 TOP 10 SERVEURS (par nombre de processus) :");
    ns.print("");
    
    const sortedServers = [...serverProcesses.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);
    
    for (const [server, procs] of sortedServers) {
        const ramUsed = procs.reduce((sum, p) => sum + ns.getScriptRam(p.filename) * p.threads, 0);
        ns.print(`   ${server.padEnd(20)} : ${procs.length.toString().padStart(5)} processus (${ns.formatRam(ramUsed)})`);
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🎯 DIAGNOSTIC");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    const totalThreads = workerStats.hack.threads + workerStats.grow.threads + workerStats.weaken.threads + workerStats.share.threads;
    
    if (totalProcesses === 0) {
        ns.print("🔴 PROBLÈME MAJEUR : AUCUN worker actif !");
        ns.print("");
        ns.print("💡 CAUSES POSSIBLES :");
        ns.print("   → Le Controller ne s'exécute pas");
        ns.print("   → Le Port 4 est vide");
        ns.print("   → Les workers crashent immédiatement");
    } else if (totalThreads < 10000) {
        ns.print("⚠️  WARNING : Très peu de threads actifs");
        ns.print(`   Threads actifs : ${ns.formatNumber(totalThreads)}`);
        ns.print(`   Attendu : 1M+ threads avec 26PB de RAM`);
    } else {
        ns.print("✅ Workers actifs détectés");
        ns.print(`   Total threads : ${ns.formatNumber(totalThreads)}`);
    }
    
    // Vérifier le ratio grow
    const totalNonShare = workerStats.hack.threads + workerStats.grow.threads + workerStats.weaken.threads;
    if (totalNonShare > 0) {
        const growRatio = (workerStats.grow.threads / totalNonShare * 100).toFixed(1);
        ns.print("");
        ns.print(`📊 Ratio GROW : ${growRatio}%`);
        
        if (growRatio > 70) {
            ns.print("🔴 ANOMALIE : Trop de threads grow !");
            ns.print("   → Problème de calcul dans le Batcher");
            ns.print("   → Les cibles ne sont jamais à 100% money ?");
        }
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
}
