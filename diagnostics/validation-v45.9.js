/** @param {NS} ns */
export async function main(ns) {
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🔍 VALIDATION CORRECTIONS v45.9 - PROGRESSIVE PREP");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");

    // Test 1: Vérifier présence des corrections
    ns.tprint("📝 Test 1: Vérifier présence des corrections dans batcher.js...");
    try {
        const batcherCode = ns.read("/core/batcher.js");
        
        const checks = {
            progressive: batcherCode.includes("_createProgressivePrepBatch"),
            maxGrowth: batcherCode.includes("MAX_GROWTH_MULT"),
            formula: batcherCode.includes("targetPercent = Math.min")
        };
        
        if (checks.progressive && checks.maxGrowth && checks.formula) {
            ns.tprint("  ✅ Toutes les corrections v45.9 sont présentes");
        } else {
            ns.tprint("  ❌ ATTENTION: Corrections manquantes!");
            ns.tprint(`     - Fonction progressive: ${checks.progressive ? "✅" : "❌"}`);
            ns.tprint(`     - MAX_GROWTH_MULT: ${checks.maxGrowth ? "✅" : "❌"}`);
            ns.tprint(`     - Formule corrigée: ${checks.formula ? "✅" : "❌"}`);
        }
    } catch (e) {
        ns.tprint("  ⚠️  Impossible de lire /core/batcher.js");
    }
    ns.tprint("");

    // Test 2: Simulation de croissance
    ns.tprint("📊 Test 2: Validation formule de croissance progressive...");
    const MAX_GROWTH_MULT = 5.0;
    const MONEY_TARGET = 0.75;
    
    const tests = [
        { from: 0.04, expected: 0.20 },
        { from: 0.20, expected: 0.75 },
        { from: 0.50, expected: 0.75 }
    ];
    
    for (const t of tests) {
        const result = Math.min(t.from * MAX_GROWTH_MULT, MONEY_TARGET);
        const mult = result / t.from;
        const ok = Math.abs(result - t.expected) < 0.01;
        ns.tprint(`  ${ok ? "✅" : "❌"} ${(t.from*100).toFixed(0)}% → ${(result*100).toFixed(0)}% (x${mult.toFixed(1)})`);
    }
    ns.tprint("");

    // Test 3: Analyse serveurs réels
    ns.tprint("🎯 Test 3: Estimation threads pour serveurs actuels...");
    const targets = ns.getPurchasedServerLimit() > 0 
        ? ["catalyst", "netlink", "computek", "rothman-uni"]
        : ns.scan("home").filter(h => ns.hasRootAccess(h) && ns.getServerMaxMoney(h) > 0).slice(0, 4);
    
    for (const target of targets) {
        if (!ns.serverExists(target)) continue;
        
        const money = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
        const security = ns.getServerSecurityLevel(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        
        if (maxMoney === 0) continue;
        
        const moneyPct = money / maxMoney;
        const secDelta = security - minSec;
        
        if (moneyPct >= 0.75 && secDelta <= 5) {
            ns.tprint(`  ✅ ${target}: READY`);
            continue;
        }
        
        // Nouvelle formule
        const targetPct = Math.min(moneyPct * MAX_GROWTH_MULT, MONEY_TARGET);
        const growth = targetPct / moneyPct;
        
        let gThreads = Math.ceil(ns.growthAnalyze(target, growth));
        gThreads = Math.min(gThreads, 50000);
        
        let wThreads = Math.ceil(secDelta / 0.05);
        wThreads = Math.min(wThreads, 50000);
        
        const wComp = Math.ceil((gThreads * 0.004) / 0.05);
        const totalW = wThreads + wComp;
        const ratio = totalW > 0 ? (gThreads / totalW).toFixed(1) : 0;
        
        ns.tprint(`  ${ratio <= 7 ? "✅" : "⚠️"} ${target}: W${wThreads}t + G${gThreads}t + W${wComp}t (ratio ${ratio}:1)`);
        ns.tprint(`     ${(moneyPct*100).toFixed(0)}% → ${(targetPct*100).toFixed(0)}%`);
    }
    ns.tprint("");

    // Test 4: Processus système
    ns.tprint("⚙️  Test 4: Vérifier processus système...");
    const procs = [
        { name: "core/orchestrator.js", critical: true },
        { name: "core/controller.js", critical: true },
        { name: "core/dashboard.js", critical: false }
    ];
    
    for (const p of procs) {
        const running = ns.isRunning(p.name, "home");
        const status = running ? "✅" : (p.critical ? "❌ CRITIQUE" : "⚠️  Optionnel");
        ns.tprint(`  ${status} ${p.name}`);
    }
    ns.tprint("");

    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("💡 PROCHAINES ÉTAPES:");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("Si tous les tests sont ✅:");
    ns.tprint("  • Le système utilise la v45.9");
    ns.tprint("  • Attendre 30-40 min pour convergence");
    ns.tprint("  • Surveiller: tail core/orchestrator.js");
    ns.tprint("");
    ns.tprint("Si certains tests sont ❌:");
    ns.tprint("  • Copier batcher.js v45.9 dans /core/");
    ns.tprint("  • run global-kill.js");
    ns.tprint("  • run boot.js");
    ns.tprint("  • Relancer ce diagnostic");
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════");
}
