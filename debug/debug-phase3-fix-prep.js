/**
 * DIAGNOSTIC INDUSTRIEL - Phase 3: FIX PREP 0% MONEY
 * 
 * Corrige le bug: serveur à 0% money → prep boucle infiniment
 * 
 * BUG IDENTIFIÉ:
 * Si currentPercent = 0:
 *   targetPercent = 0 * MAX_GROWTH_MULT = 0
 *   growThreads vise 0% → ne fait rien
 *   Boucle infinie
 * 
 * FIX:
 * Si currentPercent < 0.01 (< 1%):
 *   targetPercent = min(0.05, 0.75) = 5% minimum
 *   Force grow vers au moins 5%
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🔧 FIX: PREP 0% MONEY BUG");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    ns.tprint("📋 BUG IDENTIFIÉ:");
    ns.tprint("   Si serveur à 0% money:");
    ns.tprint("   → currentPercent = 0");
    ns.tprint("   → targetPercent = 0 × 3 = 0");
    ns.tprint("   → growThreads vise 0% → ne fait RIEN");
    ns.tprint("   → Reste à 0% pour toujours");
    ns.tprint("");
    
    ns.tprint("🔧 CORRECTION À APPLIQUER:");
    ns.tprint("   Dans batcher.js, fonction _createProgressivePrepBatch()");
    ns.tprint("   Ligne ~479 (CAS 2)");
    ns.tprint("");
    ns.tprint("   AVANT:");
    ns.tprint("   const currentPercent = prepStatus.moneyPercent;");
    ns.tprint("   const targetPercent = Math.min(currentPercent * MAX_GROWTH_MULT, 0.75);");
    ns.tprint("");
    ns.tprint("   APRÈS:");
    ns.tprint("   const currentPercent = prepStatus.moneyPercent;");
    ns.tprint("   // ✅ v47.4 BUG #15: Si 0%, forcer au moins 5%");
    ns.tprint("   const MIN_TARGET = 0.05; // 5% minimum");
    ns.tprint("   let targetPercent;");
    ns.tprint("   if (currentPercent < 0.01) {");
    ns.tprint("       targetPercent = MIN_TARGET;");
    ns.tprint("   } else {");
    ns.tprint("       targetPercent = Math.min(currentPercent * MAX_GROWTH_MULT, 0.75);");
    ns.tprint("   }");
    ns.tprint("");
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("⚠️  DOIS-JE GÉNÉRER LE FICHIER CORRIGÉ?");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("Options:");
    ns.tprint("   A) OUI - Génère batcher.js v47.4 avec fix");
    ns.tprint("   B) NON - Je corrige manuellement");
    ns.tprint("");
    ns.tprint("Tape: run debug-phase3-fix-prep.js A");
    ns.tprint("  ou: run debug-phase3-fix-prep.js B");
    ns.tprint("");
    
    const choice = ns.args[0];
    
    if (choice === "A") {
        ns.tprint("✅ Génération v47.4...");
        ns.tprint("");
        ns.tprint("📦 FICHIER À TÉLÉCHARGER:");
        ns.tprint("   batcher.js.v47.4.COMPLETE.js");
        ns.tprint("");
        ns.tprint("📝 INSTALLATION:");
        ns.tprint("   cp batcher.js.v47.4.COMPLETE.js core/batcher.js");
        ns.tprint("   run global-kill.js");
        ns.tprint("   run boot.js");
        ns.tprint("");
        ns.tprint("⏳ Attendre 2-3 minutes...");
        ns.tprint("   Les cibles à 0% devraient monter à 5% → 15% → 45% → 75%");
        ns.tprint("");
    } else if (choice === "B") {
        ns.tprint("✅ OK, corrige manuellement.");
        ns.tprint("");
        ns.tprint("📝 ÉTAPES:");
        ns.tprint("   1. Ouvrir /core/batcher.js");
        ns.tprint("   2. Chercher 'CAS 2 : WEAKEN + GROW'");
        ns.tprint("   3. Trouver: const targetPercent = Math.min(");
        ns.tprint("   4. Remplacer par le code ci-dessus");
        ns.tprint("   5. Sauvegarder");
        ns.tprint("   6. run global-kill.js && run boot.js");
        ns.tprint("");
    } else {
        ns.tprint("❌ Choix invalide. Relance avec A ou B.");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
}
