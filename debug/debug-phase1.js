/**
 * DIAGNOSTIC INDUSTRIEL - Phase 1: État RÉEL des cibles
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🏭 DIAGNOSTIC INDUSTRIEL - ÉTAT RÉEL DES CIBLES");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // Cibles du dashboard
    const targets = ["catalyst", "netlink", "millenium-fitness", "rothman-uni", "the-hub", "summit-uni"];
    
    for (const target of targets) {
        try {
            const server = ns.getServer(target);
            
            const moneyPercent = (server.moneyAvailable / server.moneyMax * 100).toFixed(1);
            const secDelta = (server.hackDifficulty - server.minDifficulty).toFixed(1);
            
            const hackTime = ns.getHackTime(target);
            const weakenTime = ns.getWeakenTime(target);
            
            const isReady = (server.hackDifficulty <= server.minDifficulty + 2) && 
                           (server.moneyAvailable >= server.moneyMax * 0.75);
            
            ns.tprint(`📊 ${target}:`);
            ns.tprint(`   💰 Money: ${moneyPercent}% (${ns.formatNumber(server.moneyAvailable)}/${ns.formatNumber(server.moneyMax)})`);
            ns.tprint(`   🛡️  Security: ${server.hackDifficulty.toFixed(2)} (min: ${server.minDifficulty}, Δ: ${secDelta})`);
            ns.tprint(`   ⏱️  Hack time: ${(hackTime/1000).toFixed(1)}s`);
            ns.tprint(`   ⏱️  Weaken time: ${(weakenTime/1000).toFixed(1)}s`);
            ns.tprint(`   ${isReady ? '✅ READY' : '❌ NEEDS PREP'}`);
            
            // Vérifier si stuck à 0%
            if (server.moneyAvailable === 0) {
                ns.tprint(`   🔴 STUCK À 0$ DEPUIS 8H!`);
            }
            
            ns.tprint("");
            
        } catch (e) {
            ns.tprint(`❌ Erreur ${target}: ${e.message}`);
        }
    }
    
    // Comptage processus
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("⚙️  PROCESSUS ACTIFS:");
    ns.tprint("═══════════════════════════════════════════════════════════");
    
    const allProcesses = [];
    const allServers = scanAll(ns);
    
    for (const server of allServers) {
        try {
            const procs = ns.ps(server);
            allProcesses.push(...procs);
        } catch (e) {}
    }
    
    const hackProcs = allProcesses.filter(p => p.filename.includes("hack.js"));
    const growProcs = allProcesses.filter(p => p.filename.includes("grow.js"));
    const weakenProcs = allProcesses.filter(p => p.filename.includes("weaken.js"));
    
    ns.tprint(`💸 Hack: ${hackProcs.length} processus`);
    ns.tprint(`💪 Grow: ${growProcs.length} processus`);
    ns.tprint(`🛡️  Weaken: ${weakenProcs.length} processus`);
    ns.tprint("");
    
    // Analyser les cibles des processus
    const targetCounts = {};
    for (const p of [...hackProcs, ...growProcs, ...weakenProcs]) {
        const target = p.args[0];
        if (target) {
            targetCounts[target] = (targetCounts[target] || 0) + 1;
        }
    }
    
    ns.tprint("🎯 Processus par cible:");
    for (const [target, count] of Object.entries(targetCounts).sort((a,b) => b[1] - a[1])) {
        ns.tprint(`   ${target}: ${count} processus`);
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("📋 ANALYSE:");
    ns.tprint("═══════════════════════════════════════════════════════════");
    
    const stuck0 = targets.filter(t => {
        try {
            return ns.getServer(t).moneyAvailable === 0;
        } catch { return false; }
    });
    
    if (stuck0.length > 0) {
        ns.tprint(`🔴 ${stuck0.length} cibles STUCK à 0$:`);
        for (const t of stuck0) {
            ns.tprint(`   - ${t}`);
        }
        ns.tprint("");
        ns.tprint("💡 HYPOTHÈSE: Bug prep progressive avec 0% money");
        ns.tprint("   → currentPercent = 0");
        ns.tprint("   → targetPercent = 0 * 3 = 0");
        ns.tprint("   → growThreads vise 0% → ne fait rien");
        ns.tprint("   → Boucle infinie");
    }
    
    if (growProcs.length > hackProcs.length * 5) {
        ns.tprint("🔴 RATIO ANORMAL: Trop de grow vs hack");
        ns.tprint(`   → Grow: ${growProcs.length}, Hack: ${hackProcs.length}`);
        ns.tprint("   → Système en mode PREP permanent");
    }
    
    const readyTargets = targets.filter(t => {
        try {
            const s = ns.getServer(t);
            return (s.hackDifficulty <= s.minDifficulty + 2) && (s.moneyAvailable >= s.moneyMax * 0.75);
        } catch { return false; }
    });
    
    if (readyTargets.length > 0 && hackProcs.length === 0) {
        ns.tprint("🔴 CIBLES READY MAIS AUCUN HACK!");
        ns.tprint(`   → ${readyTargets.length} cibles prêtes`);
        ns.tprint("   → 0 processus hack actifs");
        ns.tprint("");
        ns.tprint("💡 HYPOTHÈSE: Batcher ne passe jamais en mode HWGW");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
}

function scanAll(ns) {
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        
        try {
            const neighbors = ns.scan(current);
            for (const n of neighbors) {
                if (!visited.has(n)) queue.push(n);
            }
        } catch {}
    }
    
    return Array.from(visited);
}
