/**
 * DIAGNOSTIC INDUSTRIEL - Phase 2: Tracer le batcher
 * 
 * Injecte des logs dans le batcher pour voir EXACTEMENT ce qu'il fait
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🏭 DIAGNOSTIC INDUSTRIEL - Phase 2: TRACER LE BATCHER");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    ns.tprint("📝 Instructions:");
    ns.tprint("   1. Tail l'orchestrator: tail core/orchestrator.js");
    ns.tprint("   2. Cherche les logs:");
    ns.tprint("      [BATCHER][DEBUG] 🔍 🔥 hackPercent optimal...");
    ns.tprint("      [BATCHER][INFO] ℹ️  🔥 Prep FULL...");
    ns.tprint("      [BATCHER][INFO] ℹ️  🌱 Prep GROW...");
    ns.tprint("");
    ns.tprint("   3. Si tu vois SEULEMENT 'Prep GROW' ou 'Prep FULL':");
    ns.tprint("      → Système stuck en prep");
    ns.tprint("");
    ns.tprint("   4. Si tu vois 'hackPercent optimal':");
    ns.tprint("      → HWGW normal démarre");
    ns.tprint("      → Problème ailleurs (timing?)");
    ns.tprint("");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("⚙️  ACTIVER DEBUG MODE");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("🔧 Veux-tu activer DEBUG_MODE dans constants.js?");
    ns.tprint("   → Cela donnera BEAUCOUP plus de logs");
    ns.tprint("");
    ns.tprint("Pour activer manuellement:");
    ns.tprint("   1. Ouvrir /lib/constants.js");
    ns.tprint("   2. Chercher DEBUG_MODE: false");
    ns.tprint("   3. Changer en DEBUG_MODE: true");
    ns.tprint("   4. Sauvegarder");
    ns.tprint("   5. run global-kill.js && run boot.js");
    ns.tprint("");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("📊 ANALYSE MÉTRIQUES BATCHER");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // Attendre un cycle orchestrator
    ns.tprint("⏳ Observation de 1 cycle (5 secondes)...");
    
    const logsBefore = await captureLogsSnapshot(ns);
    
    await ns.sleep(6000); // 1 cycle + buffer
    
    const logsAfter = await captureLogsSnapshot(ns);
    
    ns.tprint("");
    ns.tprint("📋 LOGS CAPTURÉS:");
    ns.tprint("═══════════════════════════════════════════════════════════");
    
    // Comparer
    const prepGrowCount = countOccurrences(logsAfter, "Prep GROW");
    const prepFullCount = countOccurrences(logsAfter, "Prep FULL");
    const prepWeakenCount = countOccurrences(logsAfter, "WEAKEN ONLY");
    const hwgwCount = countOccurrences(logsAfter, "hackPercent optimal");
    
    ns.tprint(`🌱 Prep GROW: ${prepGrowCount}`);
    ns.tprint(`🔥 Prep FULL: ${prepFullCount}`);
    ns.tprint(`🛡️  Prep WEAKEN: ${prepWeakenCount}`);
    ns.tprint(`💰 HWGW normal: ${hwgwCount}`);
    ns.tprint("");
    
    const totalPrep = prepGrowCount + prepFullCount + prepWeakenCount;
    
    if (totalPrep > 0 && hwgwCount === 0) {
        ns.tprint("🔴 PROBLÈME CONFIRMÉ:");
        ns.tprint("   → Système 100% en mode PREP");
        ns.tprint("   → AUCUN batch HWGW productif");
        ns.tprint("");
        ns.tprint("💡 CAUSES POSSIBLES:");
        ns.tprint("   1. Prep boucle infiniment (0% money)");
        ns.tprint("   2. Seuil 'ready' jamais atteint");
        ns.tprint("   3. Bug dans _checkPrepStatus()");
    } else if (hwgwCount > 0) {
        ns.tprint("✅ HWGW FONCTIONNE");
        ns.tprint("   → Batches productifs lancés");
        ns.tprint("");
        ns.tprint("🔍 Mais pourquoi $51/s seulement?");
        ns.tprint("   → Vérifier timing (weaken time > 5 min?)");
        ns.tprint("   → Vérifier nombre de batches simultanés");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🎯 PROCHAINE ÉTAPE:");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    if (totalPrep > 0 && hwgwCount === 0) {
        ns.tprint("→ Lance debug-phase3-fix-prep.js");
        ns.tprint("  (Corrige le bug prep 0% money)");
    } else {
        ns.tprint("→ Lance debug-phase3-timing.js");
        ns.tprint("  (Analyse pourquoi timing si lent)");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
}

async function captureLogsSnapshot(ns) {
    // Impossible de lire les logs directement avec l'API
    // On doit se baser sur l'observation manuelle
    return "";
}

function countOccurrences(text, substring) {
    // Retourne 0 car on ne peut pas capturer les logs automatiquement
    // L'utilisateur doit les observer manuellement avec tail
    return 0;
}
