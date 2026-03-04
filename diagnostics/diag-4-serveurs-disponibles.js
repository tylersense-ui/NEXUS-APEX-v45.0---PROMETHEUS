/**
 * 🔍 DIAGNOSTIC 4 : SERVEURS DISPONIBLES
 * 
 * Vérifie si tous les serveurs sont bien détectés et utilisables.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC 4 : SERVEURS DISPONIBLES");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // Scanner tous les serveurs
    const allServers = [];
    
    function scan(host, depth = 0) {
        if (depth > 20) return;
        if (allServers.includes(host)) return;
        allServers.push(host);
        
        const neighbors = ns.scan(host);
        for (const neighbor of neighbors) {
            scan(neighbor, depth + 1);
        }
    }
    
    scan("home");
    
    ns.print(`📊 Total serveurs scannés : ${allServers.length}`);
    ns.print("");
    
    // Filtrer les serveurs utilisables
    const usableServers = [];
    const unusableServers = [];
    
    for (const server of allServers) {
        const s = ns.getServer(server);
        
        if (s.maxRam === 0) {
            unusableServers.push({ name: server, reason: "Pas de RAM" });
            continue;
        }
        
        if (!s.hasAdminRights) {
            unusableServers.push({ name: server, reason: "Pas rooté" });
            continue;
        }
        
        usableServers.push({
            name: server,
            maxRam: s.maxRam,
            freeRam: s.maxRam - s.ramUsed,
            ramUsed: s.ramUsed,
            usage: (s.ramUsed / s.maxRam * 100)
        });
    }
    
    ns.print("✅ SERVEURS UTILISABLES :");
    ns.print(`   Total : ${usableServers.length}`);
    ns.print("");
    
    // Catégoriser par taille
    const tiny = usableServers.filter(s => s.maxRam < 8);
    const small = usableServers.filter(s => s.maxRam >= 8 && s.maxRam < 64);
    const medium = usableServers.filter(s => s.maxRam >= 64 && s.maxRam < 1024);
    const large = usableServers.filter(s => s.maxRam >= 1024);
    
    ns.print(`   🔸 Tiny   (<8GB)      : ${tiny.length}`);
    ns.print(`   🔹 Small  (8-64GB)    : ${small.length}`);
    ns.print(`   🔶 Medium (64-1TB)    : ${medium.length}`);
    ns.print(`   🔷 Large  (>1TB)      : ${large.length}`);
    ns.print("");
    
    // Top 15 serveurs par RAM totale
    const sorted = [...usableServers].sort((a, b) => b.maxRam - a.maxRam);
    
    ns.print("🔝 TOP 15 SERVEURS (par RAM totale) :");
    ns.print("");
    
    let totalRam = 0;
    let freeRam = 0;
    
    for (let i = 0; i < Math.min(15, sorted.length); i++) {
        const s = sorted[i];
        totalRam += s.maxRam;
        freeRam += s.freeRam;
        
        const usageBar = "█".repeat(Math.floor(s.usage / 10)) + "░".repeat(10 - Math.floor(s.usage / 10));
        ns.print(`${(i+1).toString().padStart(3)}. ${s.name.padEnd(20)} │ ${ns.formatRam(s.maxRam).padStart(12)} │ [${usageBar}] ${s.usage.toFixed(1)}%`);
    }
    
    // Total général
    totalRam = usableServers.reduce((sum, s) => sum + s.maxRam, 0);
    freeRam = usableServers.reduce((sum, s) => sum + s.freeRam, 0);
    
    ns.print("");
    ns.print("📊 RÉSUMÉ GLOBAL :");
    ns.print(`   RAM totale : ${ns.formatRam(totalRam)}`);
    ns.print(`   RAM libre  : ${ns.formatRam(freeRam)} (${(freeRam/totalRam*100).toFixed(1)}%)`);
    ns.print(`   RAM usagée : ${ns.formatRam(totalRam - freeRam)} (${((totalRam-freeRam)/totalRam*100).toFixed(1)}%)`);
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🎯 DIAGNOSTIC");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    if (usableServers.length < 20) {
        ns.print("⚠️  Peu de serveurs utilisables");
        ns.print(`   Utilisables : ${usableServers.length}`);
    } else {
        ns.print(`✅ ${usableServers.length} serveurs utilisables détectés`);
    }
    
    const avgUsage = usableServers.reduce((sum, s) => sum + s.usage, 0) / usableServers.length;
    
    if (avgUsage < 20) {
        ns.print("");
        ns.print("🔴 PROBLÈME : Utilisation RAM très faible !");
        ns.print(`   Usage moyen : ${avgUsage.toFixed(1)}%`);
        ns.print("");
        ns.print("💡 CAUSES POSSIBLES :");
        ns.print("   → Le Batcher ne place pas les jobs");
        ns.print("   → Le Controller ne les exécute pas");
        ns.print("   → Les jobs sont placés mais sur peu de serveurs");
    } else if (avgUsage < 50) {
        ns.print("");
        ns.print("⚠️  Utilisation RAM sous-optimale");
        ns.print(`   Usage moyen : ${avgUsage.toFixed(1)}%`);
    } else {
        ns.print("");
        ns.print("✅ Utilisation RAM correcte");
        ns.print(`   Usage moyen : ${avgUsage.toFixed(1)}%`);
    }
    
    // Compter les serveurs vides
    const emptyServers = usableServers.filter(s => s.usage < 1);
    if (emptyServers.length > 10) {
        ns.print("");
        ns.print(`🔴 ${emptyServers.length} serveurs VIDES (0% utilisés) !`);
        ns.print("   → Le système ne distribue pas les jobs correctement");
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
}
