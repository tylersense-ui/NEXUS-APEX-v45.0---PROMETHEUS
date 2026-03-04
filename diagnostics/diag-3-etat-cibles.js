/**
 * 🔍 DIAGNOSTIC 3 : ÉTAT DES CIBLES
 * 
 * Vérifie si les cibles sont bien préparées (100% money, min security).
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC 3 : ÉTAT DES CIBLES");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // Targets habituelles
    const targets = [
        "catalyst", "computek", "netlink", "omega-net", "rothman-uni",
        "summit-uni", "the-hub", "johnson-ortho", "zb-def", "zb-institute"
    ];
    
    ns.print("🎯 ANALYSE DES CIBLES PRINCIPALES :");
    ns.print("─────────────────────────────────────────────────────────────");
    ns.print("");
    
    const targetStats = [];
    
    for (const target of targets) {
        if (!ns.serverExists(target)) continue;
        
        const server = ns.getServer(target);
        const maxMoney = server.moneyMax || 1;
        const currentMoney = server.moneyAvailable || 0;
        const moneyPct = (currentMoney / maxMoney * 100);
        
        const minSec = server.minDifficulty;
        const currentSec = server.hackDifficulty;
        const secDiff = currentSec - minSec;
        
        targetStats.push({
            name: target,
            moneyPct,
            secDiff,
            maxMoney,
            currentMoney,
            ready: moneyPct >= 90 && secDiff <= 5
        });
    }
    
    // Trier par priorité (ready first, puis par max money)
    targetStats.sort((a, b) => {
        if (a.ready && !b.ready) return -1;
        if (!a.ready && b.ready) return 1;
        return b.maxMoney - a.maxMoney;
    });
    
    for (const stat of targetStats) {
        const readyIcon = stat.ready ? "✅" : "🔧";
        const moneyBar = "█".repeat(Math.floor(stat.moneyPct / 10)) + "░".repeat(10 - Math.floor(stat.moneyPct / 10));
        
        ns.print(`${readyIcon} ${stat.name.padEnd(15)} │ M:${stat.moneyPct.toFixed(1).padStart(5)}% [${moneyBar}] │ S:+${stat.secDiff.toFixed(1).padStart(4)}`);
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🎯 DIAGNOSTIC");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    const readyTargets = targetStats.filter(t => t.ready);
    const prepTargets = targetStats.filter(t => !t.ready);
    
    ns.print(`✅ Cibles READY : ${readyTargets.length} / ${targetStats.length}`);
    ns.print(`🔧 Cibles en PREP : ${prepTargets.length}`);
    ns.print("");
    
    if (readyTargets.length === 0) {
        ns.print("🔴 PROBLÈME : AUCUNE cible prête !");
        ns.print("");
        ns.print("💡 CONSÉQUENCE :");
        ns.print("   → Le système fait que de la préparation (grow/weaken)");
        ns.print("   → Pas de hack → Pas de revenus");
        ns.print("   → Threads grow massifs expliqués");
    } else if (readyTargets.length < 3) {
        ns.print("⚠️  Peu de cibles prêtes");
        ns.print(`   Prêtes : ${readyTargets.map(t => t.name).join(", ")}`);
    } else {
        ns.print("✅ Cibles prêtes disponibles");
    }
    
    // Analyser les cibles en prep
    if (prepTargets.length > 0) {
        ns.print("");
        ns.print("🔧 CIBLES EN PRÉPARATION :");
        ns.print("");
        
        for (const target of prepTargets) {
            const moneyNeeded = target.maxMoney - target.currentMoney;
            ns.print(`   ${target.name.padEnd(15)} : M:${target.moneyPct.toFixed(1)}% → besoin ${ns.formatNumber(moneyNeeded)}$ | S:+${target.secDiff.toFixed(1)}`);
        }
        
        // Vérifier si les cibles restent bloquées
        ns.print("");
        ns.print("⚠️  Si ces cibles restent en prep après 5-10 minutes:");
        ns.print("   → Problème de calcul grow threads (trop faible)");
        ns.print("   → ou batches incomplets (weaken manquants)");
    }
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
}
