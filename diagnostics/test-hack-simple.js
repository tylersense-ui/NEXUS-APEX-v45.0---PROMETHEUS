/**
 * TEST ULTRA SIMPLE - 1 hack manuel, voir si $$$ arrive
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const target = "n00dles"; // Cible la plus facile
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("💰 TEST HACK MANUEL ULTRA SIMPLE");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    const before = ns.getPlayer().money;
    ns.tprint(`💵 Argent AVANT: ${ns.formatNumber(before)}`);
    ns.tprint(`🎯 Cible: ${target}`);
    ns.tprint("");
    ns.tprint("⏳ Hack en cours...");
    
    const stolen = await ns.hack(target);
    
    await ns.sleep(500); // Laisser le jeu mettre à jour
    
    const after = ns.getPlayer().money;
    const gain = after - before;
    
    ns.tprint("");
    ns.tprint(`💰 Volé: ${ns.formatNumber(stolen)}`);
    ns.tprint(`💵 Argent APRÈS: ${ns.formatNumber(after)}`);
    ns.tprint(`📈 GAIN NET: ${ns.formatNumber(gain)}`);
    ns.tprint("");
    
    if (gain > 0) {
        ns.tprint("✅ ÇA MARCHE ! Hack fonctionne, argent reçu.");
        ns.tprint("");
        ns.tprint("🔍 Donc le problème n'est PAS les workers.");
        ns.tprint("   → Problème = TIMING ou BATCHES");
        ns.tprint("   → Les batches HWGW se compensent mutuellement");
        ns.tprint("   → Ou les delays sont trop longs");
    } else {
        ns.tprint("❌ PROBLÈME ! Hack ne donne rien.");
        ns.tprint("");
        ns.tprint("🔧 Causes possibles:");
        ns.tprint("   1. Niveau hacking trop bas");
        ns.tprint("   2. Serveur vide (0$ disponible)");
        ns.tprint("   3. Bug du jeu");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
}
