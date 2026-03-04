/**
 * 🔍 DIAGNOSTIC 1 : SYNCHRONISATION BATCHER → CONTROLLER
 * 
 * Vérifie si les jobs créés par le Batcher sont bien ceux exécutés par le Controller.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC 1 : SYNCHRONISATION BATCHER → CONTROLLER");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // Importer PortHandler
    const { PortHandler } = await import("/core/port-handler.js");
    const ph = new PortHandler(ns);
    
    ns.print("📡 ANALYSE DU PORT 4 (COMMANDS)");
    ns.print("─────────────────────────────────────────────────────────────");
    ns.print("");
    
    // Vider et compter le port 4
    let jobCount = 0;
    const jobs = [];
    const hostDistribution = new Map();
    
    while (!ph.isEmpty(4)) {
        const job = ph.readJSON(4);
        if (job) {
            jobCount++;
            jobs.push(job);
            
            const host = job.host || "UNKNOWN";
            hostDistribution.set(host, (hostDistribution.get(host) || 0) + 1);
        }
    }
    
    ns.print(`📊 JOBS DANS LE PORT 4 : ${jobCount}`);
    ns.print("");
    
    if (jobCount === 0) {
        ns.print("✅ Port 4 vide - Normal si le Controller a tout traité");
        ns.print("");
        ns.print("⚠️  Pour tester, attendez le prochain cycle du Batcher (30s)");
        ns.print("   puis relancez ce diagnostic immédiatement.");
        return;
    }
    
    ns.print("🎯 DISTRIBUTION PAR HOST :");
    ns.print("");
    
    const sortedHosts = [...hostDistribution.entries()]
        .sort((a, b) => b[1] - a[1]);
    
    for (const [host, count] of sortedHosts) {
        const percentage = (count / jobCount * 100).toFixed(1);
        ns.print(`   ${host.padEnd(20)} : ${count.toString().padStart(4)} jobs (${percentage}%)`);
    }
    
    ns.print("");
    ns.print("📦 DÉTAIL DES 10 PREMIERS JOBS :");
    ns.print("");
    
    for (let i = 0; i < Math.min(10, jobs.length); i++) {
        const j = jobs[i];
        ns.print(`   ${(i+1).toString().padStart(2)}. ${j.type.padEnd(6)} ${j.target?.padEnd(15) || 'N/A'.padEnd(15)} ${j.threads}t → ${j.host}`);
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🎯 DIAGNOSTIC");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    if (sortedHosts.length === 1) {
        ns.print("🔴 PROBLÈME : Tous les jobs vont sur UN SEUL serveur !");
        ns.print(`   Host unique : ${sortedHosts[0][0]}`);
        ns.print("");
        ns.print("💡 CAUSE PROBABLE :");
        ns.print("   → Le RAM Manager ne retourne qu'un seul serveur");
        ns.print("   → ou l'algorithme FFD ne distribue pas correctement");
    } else if (sortedHosts.length < 5) {
        ns.print("⚠️  WARNING : Jobs concentrés sur peu de serveurs");
        ns.print(`   Serveurs utilisés : ${sortedHosts.length} / ~25 attendus`);
    } else {
        ns.print("✅ Distribution semble correcte");
        ns.print(`   Jobs distribués sur ${sortedHosts.length} serveurs`);
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
}
