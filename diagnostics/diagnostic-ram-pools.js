/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC RAM POOLS");
    ns.print("═══════════════════════════════════════════");
    ns.print("");
    
    // Importer RAM Manager
    let ramMgr;
    try {
        const { RAMManager } = await import("/core/ram-manager.js");
        const { Logger } = await import("/lib/logger.js");
        const log = new Logger(ns, "DIAG");
        ramMgr = new RAMManager(ns, log);
        ns.print("✅ RAM Manager importé");
    } catch (error) {
        ns.print(`❌ Erreur import: ${error.message}`);
        return;
    }
    
    ns.print("");
    ns.print("📊 ANALYSE getRamPools() :");
    ns.print("─────────────────────────────────────────");
    
    const pools = ramMgr.getRamPools();
    
    ns.print(`pools.total: ${ns.formatRam(pools.total)}`);
    ns.print(`pools.free: ${ns.formatRam(pools.free)}`);
    ns.print(`pools.reserved: ${ns.formatRam(pools.reserved)}`);
    ns.print("");
    
    if (!pools.servers) {
        ns.print("🔴 PROBLÈME: pools.servers est undefined !");
        ns.print("");
        ns.print("Contenu de pools:");
        ns.print(JSON.stringify(pools, null, 2));
        return;
    }
    
    ns.print(`pools.servers.length: ${pools.servers.length}`);
    ns.print("");
    
    if (pools.servers.length === 0) {
        ns.print("🔴 PROBLÈME: pools.servers est VIDE !");
        return;
    }
    
    ns.print("✅ pools.servers existe et contient des serveurs");
    ns.print("");
    
    // Top 10
    ns.print("🔝 TOP 10 SERVEURS (RAM libre) :");
    ns.print("");
    
    const sorted = [...pools.servers].sort((a, b) => b.freeRam - a.freeRam);
    
    for (let i = 0; i < Math.min(10, sorted.length); i++) {
        const s = sorted[i];
        const weakenThreads = Math.floor(s.freeRam / 1.75);
        ns.print(`${(i+1).toString().padStart(3)}. ${s.hostname.padEnd(20)} : ${ns.formatRam(s.freeRam).padStart(12)} (${weakenThreads}t weaken)`);
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════");
    ns.print("✅ DIAGNOSTIC TERMINÉ");
    ns.print("═══════════════════════════════════════════");
}
