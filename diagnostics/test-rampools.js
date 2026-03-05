/**
 * TEST: Combien de serveurs getRamPools() retourne?
 * 
 * @param {NS} ns
 */
import { RamManager } from "/core/ram-manager.js";

export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🔍 TEST: getRamPools() vs Réalité");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    const ramMgr = new RamManager(ns);
    const pools = ramMgr.getRamPools();
    
    ns.tprint(`📊 getRamPools() retourne: ${pools.servers.length} serveurs`);
    ns.tprint(`💾 RAM totale: ${ns.formatRam(pools.totalMax)}`);
    ns.tprint(`💚 RAM libre: ${ns.formatRam(pools.totalFree)}`);
    ns.tprint("");
    
    // Compter par catégorie
    const nexusNodes = pools.servers.filter(s => s.hostname.startsWith("nexus-node-"));
    const home = pools.servers.filter(s => s.hostname === "home");
    const gameServers = pools.servers.filter(s => 
        !s.hostname.startsWith("nexus-node-") && 
        s.hostname !== "home" &&
        !s.hostname.startsWith("hacknet-node-")
    );
    
    ns.tprint("📁 CATÉGORIES:");
    ns.tprint(`   🏠 Home: ${home.length}`);
    ns.tprint(`   💻 Nexus-Nodes: ${nexusNodes.length}`);
    ns.tprint(`   🌐 Serveurs du jeu: ${gameServers.length}`);
    ns.tprint("");
    
    if (gameServers.length === 0) {
        ns.tprint("🔴 PROBLÈME TROUVÉ !");
        ns.tprint("   getRamPools() ne retourne AUCUN serveur du jeu !");
        ns.tprint("");
        ns.tprint("   Cause probable:");
        ns.tprint("   - getRamPools() filtre les serveurs avec maxRam = 0");
        ns.tprint("   - OU getRamPools() filtre autre chose");
    } else if (gameServers.length < 40) {
        ns.tprint("⚠️  PROBLÈME PARTIEL !");
        ns.tprint(`   Seulement ${gameServers.length} serveurs du jeu retournés`);
        ns.tprint("   Il devrait y en avoir ~70");
        ns.tprint("");
        ns.tprint("   Top 10 serveurs du jeu:");
        for (let i = 0; i < Math.min(10, gameServers.length); i++) {
            const s = gameServers[i];
            ns.tprint(`      ${s.hostname}: ${ns.formatRam(s.maxRam)}`);
        }
    } else {
        ns.tprint("✅ getRamPools() retourne tous les serveurs !");
        ns.tprint("");
        ns.tprint("   Le problème est AILLEURS (controller? packing?)");
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════");
}
