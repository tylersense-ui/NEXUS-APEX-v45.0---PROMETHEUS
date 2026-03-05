/**
 * TEST BUG #9: Batches Incomplets (grow skippé)
 * 
 * HYPOTHÈSE:
 * Le batcher calcule growThreads AVANT le hack, donc si serveur optimal,
 * growThreads = 0, et le job est skippé. Mais APRÈS le hack, il faut un grow !
 * 
 * TEST:
 * 1. Prendre un serveur à 100% money
 * 2. Simuler calcul batch
 * 3. Vérifier si grow/weaken sont présents
 * 
 * ATTENDU:
 * Batch COMPLET avec 4 jobs: hack, weaken, grow, weaken
 * 
 * RÉSULTAT ACTUEL:
 * Batch INCOMPLET avec 2 jobs: hack, weaken (grow/weaken skippés)
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═".repeat(70));
    ns.print("🔍 TEST BUG #9: Batches Incomplets");
    ns.print("═".repeat(70));
    ns.print("");
    
    // Test sur millenium-fitness (observé dans les logs)
    const target = "millenium-fitness";
    const server = ns.getServer(target);
    const player = ns.getPlayer();
    
    ns.print(`🎯 Cible: ${target}`);
    ns.print(`💰 Money: ${ns.formatNumber(server.moneyAvailable)}/${ns.formatNumber(server.moneyMax)} (${((server.moneyAvailable/server.moneyMax)*100).toFixed(1)}%)`);
    ns.print(`🛡️  Security: ${server.hackDifficulty.toFixed(2)} (min: ${server.minDifficulty.toFixed(2)})`);
    ns.print("");
    
    // Simuler calcul batcher actuel
    const hackPercent = 0.30; // 30% comme observé
    
    if (ns.fileExists("Formulas.exe", "home")) {
        const serverCopy = {...server};
        
        // Calcul hackThreads
        const hackPercentPerThread = ns.formulas.hacking.hackPercent(serverCopy, player);
        const hackThreads = Math.max(1, Math.floor(hackPercent / hackPercentPerThread));
        
        // Calcul growThreads (AVANT hack)
        const totalHackPercent = hackThreads * hackPercentPerThread;
        const moneyAfterHack = serverCopy.moneyAvailable * (1 - totalHackPercent);
        
        // VOICI LE BUG: Si moneyAvailable = moneyMax, alors après hack:
        // moneyAfterHack = moneyMax * (1 - 0.30) = moneyMax * 0.70
        // growthNeeded = moneyMax / (moneyMax * 0.70) = 1 / 0.70 = 1.43
        // Donc il FAUT un grow !
        
        const growthNeeded = serverCopy.moneyMax / Math.max(1, moneyAfterHack);
        
        let growThreads = 0;
        if (moneyAfterHack < serverCopy.moneyMax) {
            // Il faut un grow pour restaurer
            growThreads = Math.ceil(
                ns.formulas.hacking.growThreads(serverCopy, player, serverCopy.moneyMax, 1)
            );
        }
        
        const weakenForHack = Math.ceil((hackThreads * 0.002) / 0.05);
        const weakenForGrow = Math.ceil((growThreads * 0.004) / 0.05);
        
        ns.print("📊 CALCUL BATCH:");
        ns.print(`   hackThreads: ${hackThreads}`);
        ns.print(`   weakenForHack: ${weakenForHack}`);
        ns.print(`   moneyAfterHack: ${ns.formatNumber(moneyAfterHack)} (${((moneyAfterHack/serverCopy.moneyMax)*100).toFixed(1)}%)`);
        ns.print(`   growthNeeded: ${growthNeeded.toFixed(2)}x`);
        ns.print(`   growThreads: ${growThreads}`);
        ns.print(`   weakenForGrow: ${weakenForGrow}`);
        ns.print("");
        
        // VÉRIFICATION
        ns.print("═".repeat(70));
        ns.print("🎯 RÉSULTAT:");
        ns.print("═".repeat(70));
        
        if (growThreads === 0) {
            ns.print("❌ BUG CONFIRMÉ: growThreads = 0");
            ns.print("");
            ns.print("🔴 PROBLÈME:");
            ns.print("   Le serveur est à 100% money AVANT le hack");
            ns.print("   Mais APRÈS le hack, il sera à 70% money");
            ns.print("   Il FAUT un grow pour restaurer à 100%");
            ns.print("   MAIS le batcher calcule growThreads = 0 et skip le job !");
            ns.print("");
            ns.print("📉 CONSÉQUENCE:");
            ns.print("   Batch incomplet: hack + weaken seulement");
            ns.print("   Serveur se vide: 100% → 70% → 49% → 34% → ...");
            ns.print("   Après quelques cycles: plus rien à voler");
            ns.print("   Revenus: $0/s");
            ns.print("");
            ns.print("✅ SOLUTION:");
            ns.print("   Toujours calculer growThreads pour APRÈS le hack");
            ns.print("   Ne JAMAIS skipper grow si hackThreads > 0");
            
        } else {
            ns.print("✅ Batch complet: 4 jobs présents");
            ns.print(`   hack(${hackThreads}) + weaken(${weakenForHack}) + grow(${growThreads}) + weaken(${weakenForGrow})`);
        }
        
    } else {
        ns.print("⚠️  Formulas.exe non disponible - Test impossible");
    }
    
    ns.print("═".repeat(70));
}
