/**
 * TEST WORKERS - Vérifie si hack/grow/weaken fonctionnent
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const target = ns.args[0] || "n00dles"; // Cible facile
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🧪 TEST WORKERS - Vérification Hack/Grow/Weaken");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint(`🎯 Cible: ${target}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════
    // AVANT TEST
    // ═══════════════════════════════════════════════════════════════
    
    const moneyBefore = ns.getServerMoneyAvailable(target);
    const securityBefore = ns.getServerSecurityLevel(target);
    const playerMoneyBefore = ns.getPlayer().money;
    
    ns.tprint("📊 ÉTAT INITIAL:");
    ns.tprint(`   💰 Argent serveur: ${ns.formatNumber(moneyBefore)}`);
    ns.tprint(`   🛡️  Sécurité: ${securityBefore.toFixed(2)}`);
    ns.tprint(`   💵 Argent joueur: ${ns.formatNumber(playerMoneyBefore)}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════
    // TEST 1: HACK MANUEL
    // ═══════════════════════════════════════════════════════════════
    
    ns.tprint("🧪 TEST 1: Hack manuel (pas de worker)");
    
    const moneyStolen = await ns.hack(target);
    
    await ns.sleep(100); // Laisser le temps au jeu de mettre à jour
    
    const moneyAfterHack = ns.getServerMoneyAvailable(target);
    const playerMoneyAfterHack = ns.getPlayer().money;
    
    ns.tprint(`   💰 Volé: ${ns.formatNumber(moneyStolen)}`);
    ns.tprint(`   💰 Serveur après: ${ns.formatNumber(moneyAfterHack)}`);
    ns.tprint(`   💵 Joueur après: ${ns.formatNumber(playerMoneyAfterHack)}`);
    
    const playerGain = playerMoneyAfterHack - playerMoneyBefore;
    ns.tprint(`   📈 Gain joueur: ${ns.formatNumber(playerGain)}`);
    
    if (playerGain > 0) {
        ns.tprint("   ✅ HACK FONCTIONNE - Argent reçu!");
    } else {
        ns.tprint("   ❌ HACK NE FONCTIONNE PAS - Aucun gain!");
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════
    // TEST 2: WORKER HACK
    // ═══════════════════════════════════════════════════════════════
    
    ns.tprint("🧪 TEST 2: Worker hack.js (via ns.exec)");
    
    const moneyBeforeWorker = ns.getPlayer().money;
    
    // Copier le worker
    await ns.scp("/hack/workers/hack.js", "home");
    
    // Lancer le worker
    const pid = ns.exec("/hack/workers/hack.js", "home", 1, target, 0, "test-uuid");
    
    if (pid === 0) {
        ns.tprint("   ❌ ERREUR: Impossible de lancer le worker!");
        return;
    }
    
    ns.tprint(`   ⚙️  Worker lancé (PID: ${pid})`);
    
    // Attendre que le hack se termine
    const hackTime = ns.getHackTime(target);
    ns.tprint(`   ⏳ Attente ${(hackTime / 1000).toFixed(1)}s...`);
    
    await ns.sleep(hackTime + 500);
    
    const moneyAfterWorker = ns.getPlayer().money;
    const workerGain = moneyAfterWorker - moneyBeforeWorker;
    
    ns.tprint(`   💵 Argent avant: ${ns.formatNumber(moneyBeforeWorker)}`);
    ns.tprint(`   💵 Argent après: ${ns.formatNumber(moneyAfterWorker)}`);
    ns.tprint(`   📈 Gain worker: ${ns.formatNumber(workerGain)}`);
    
    if (workerGain > 0) {
        ns.tprint("   ✅ WORKER FONCTIONNE - Argent reçu!");
    } else {
        ns.tprint("   ❌ WORKER NE FONCTIONNE PAS - Aucun gain!");
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════
    // TEST 3: BATCH HWGW TIMING
    // ═══════════════════════════════════════════════════════════════
    
    ns.tprint("🧪 TEST 3: Vérifier timing HWGW actuel");
    
    const processes = ns.ps();
    const hwgwProcesses = processes.filter(p => 
        p.filename.includes("hack.js") || 
        p.filename.includes("grow.js") || 
        p.filename.includes("weaken.js")
    );
    
    ns.tprint(`   ⚙️  Processus HWGW actifs: ${hwgwProcesses.length}`);
    
    if (hwgwProcesses.length > 0) {
        // Vérifier les args pour voir les delays
        const sampleHack = hwgwProcesses.find(p => p.filename.includes("hack.js"));
        const sampleGrow = hwgwProcesses.find(p => p.filename.includes("grow.js"));
        
        if (sampleHack && sampleHack.args.length > 1) {
            const hackDelay = sampleHack.args[1];
            ns.tprint(`   ⏱️  Delay hack: ${hackDelay}ms`);
        }
        
        if (sampleGrow && sampleGrow.args.length > 1) {
            const growDelay = sampleGrow.args[1];
            ns.tprint(`   ⏱️  Delay grow: ${growDelay}ms`);
        }
        
        // Vérifier le weaken time de la cible principale
        const mainTarget = sampleHack?.args[0] || target;
        const wTime = ns.getWeakenTime(mainTarget);
        const hTime = ns.getHackTime(mainTarget);
        const gTime = ns.getGrowTime(mainTarget);
        
        ns.tprint("");
        ns.tprint(`   📊 Timing pour ${mainTarget}:`);
        ns.tprint(`      Hack:   ${(hTime / 1000).toFixed(1)}s`);
        ns.tprint(`      Grow:   ${(gTime / 1000).toFixed(1)}s`);
        ns.tprint(`      Weaken: ${(wTime / 1000).toFixed(1)}s`);
        
        if (wTime > 60000) {
            ns.tprint("");
            ns.tprint("   ⚠️  WARNING: Weaken time > 1 minute!");
            ns.tprint("   → Les batches prennent TRÈS longtemps");
            ns.tprint("   → Normal de ne pas voir de profit immédiat");
        }
    } else {
        ns.tprint("   ❌ Aucun processus HWGW actif!");
        ns.tprint("   → Le batcher ne lance rien");
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("📋 CONCLUSION");
    ns.tprint("═══════════════════════════════════════════════════════════");
    
    if (playerGain > 0 && workerGain > 0) {
        ns.tprint("✅ Les workers FONCTIONNENT correctement");
        ns.tprint("");
        ns.tprint("🔍 Problème probable: TIMING ou CIBLE");
        ns.tprint("   → Les batches prennent trop de temps");
        ns.tprint("   → Ou les cibles sont déjà vidées");
        ns.tprint("   → Ou grow restaure trop vite après hack");
    } else {
        ns.tprint("❌ Les workers NE FONCTIONNENT PAS");
        ns.tprint("");
        ns.tprint("🔧 Solutions:");
        ns.tprint("   1. Vérifier /hack/workers/hack.js");
        ns.tprint("   2. Vérifier permissions d'exécution");
        ns.tprint("   3. Vérifier RAM disponible");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
}
