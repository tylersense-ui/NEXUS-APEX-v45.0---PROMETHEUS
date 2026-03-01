/**
 * 🔍 DIAGNOSTIC - Problème de déploiement des workers
 * 
 * Ce script analyse pourquoi certains serveurs acceptent les workers et d'autres non.
 * 
 * @usage run diagnostic-deploy.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 LISTE DES SERVEURS À VÉRIFIER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const serversToCheck = [
        "nexus-node-11", // ✅ Fonctionne
        "nexus-node-12", // ✅ Fonctionne
        "nexus-node-13", // ✅ Fonctionne
        "nexus-node-14", // ❌ Échoue
        "nexus-node-15", // ❌ Échoue
        "nexus-node-16", // ❌ Échoue
        "nexus-node-17", // ❌ Échoue
        "nexus-node-18", // ❌ Échoue
        "nexus-node-19", // ✅ Fonctionne
        "nexus-node-20", // ❌ Échoue
        "nexus-node-21", // ❌ Échoue
        "nexus-node-22", // ❌ Échoue
        "nexus-node-23", // ❌ Échoue
    ];
    
    const workerScript = "/hack/workers/weaken.js";
    const threadsNeeded = 14; // Nombre de threads qui échouent selon les logs
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC - Analyse des échecs de déploiement");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 ANALYSE DE CHAQUE SERVEUR
    // ═══════════════════════════════════════════════════════════════════════════════
    
    for (const host of serversToCheck) {
        ns.tprint(`\n🖥️  Serveur: ${host}`);
        ns.tprint("─".repeat(60));
        
        // ✅ 1. Vérifier que le serveur existe
        let serverExists = false;
        try {
            ns.getServer(host);
            serverExists = true;
            ns.tprint("  ✅ Serveur existe");
        } catch (e) {
            ns.tprint(`  ❌ Serveur N'EXISTE PAS: ${e.message}`);
            continue; // Passer au suivant
        }
        
        // ✅ 2. Vérifier les informations RAM
        const maxRam = ns.getServerMaxRam(host);
        const usedRam = ns.getServerUsedRam(host);
        const freeRam = maxRam - usedRam;
        const ramPercent = ((usedRam / maxRam) * 100).toFixed(1);
        
        ns.tprint(`  📊 RAM: ${ns.formatRam(usedRam)} / ${ns.formatRam(maxRam)} (${ramPercent}% utilisé)`);
        ns.tprint(`  💾 RAM libre: ${ns.formatRam(freeRam)}`);
        
        // ✅ 3. Vérifier que le worker existe sur ce serveur
        const workerExists = ns.fileExists(workerScript, host);
        if (workerExists) {
            ns.tprint(`  ✅ Worker ${workerScript} présent`);
        } else {
            ns.tprint(`  ❌ Worker ${workerScript} ABSENT`);
        }
        
        // ✅ 4. Calculer la RAM nécessaire pour le worker
        const workerRam = ns.getScriptRam(workerScript, host);
        const ramNeeded = workerRam * threadsNeeded;
        
        ns.tprint(`  📏 RAM par thread: ${ns.formatRam(workerRam)}`);
        ns.tprint(`  🎯 RAM nécessaire (${threadsNeeded} threads): ${ns.formatRam(ramNeeded)}`);
        
        // ✅ 5. Déterminer si le déploiement est possible
        if (freeRam >= ramNeeded) {
            ns.tprint(`  ✅ PEUT exécuter ${threadsNeeded} threads (${ns.formatRam(freeRam - ramNeeded)} reste)`);
        } else {
            const maxThreads = Math.floor(freeRam / workerRam);
            ns.tprint(`  ❌ NE PEUT PAS exécuter ${threadsNeeded} threads`);
            ns.tprint(`  ⚠️  Maximum possible: ${maxThreads} threads seulement`);
            ns.tprint(`  💡 Manque: ${ns.formatRam(ramNeeded - freeRam)}`);
        }
        
        // ✅ 6. Lister les processus en cours
        const processes = ns.ps(host);
        if (processes.length > 0) {
            ns.tprint(`  🔧 Processus actifs: ${processes.length}`);
            
            // Afficher les 3 plus gros consommateurs
            const sorted = processes
                .map(p => ({
                    filename: p.filename,
                    threads: p.threads,
                    ram: ns.getScriptRam(p.filename, host) * p.threads
                }))
                .sort((a, b) => b.ram - a.ram)
                .slice(0, 3);
            
            for (const proc of sorted) {
                ns.tprint(`     • ${proc.filename} (${proc.threads}t) = ${ns.formatRam(proc.ram)}`);
            }
        } else {
            ns.tprint("  📭 Aucun processus actif");
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 RÉSUMÉ ET RECOMMANDATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("\n═══════════════════════════════════════════════════════════════");
    ns.tprint("📋 RÉSUMÉ ET RECOMMANDATIONS");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    ns.tprint("\n🔍 CAUSES POSSIBLES DES ÉCHECS:");
    ns.tprint("  1️⃣  RAM insuffisante sur les serveurs");
    ns.tprint("  2️⃣  Serveurs n'existent pas encore (pas tous achetés)");
    ns.tprint("  3️⃣  Workers pas copiés sur tous les serveurs");
    ns.tprint("  4️⃣  Trop de processus déjà en cours");
    
    ns.tprint("\n💡 SOLUTIONS:");
    ns.tprint("  • Si RAM insuffisante: Upgrader les serveurs OU réduire threads");
    ns.tprint("  • Si serveurs manquants: Attendre que server-manager les achète");
    ns.tprint("  • Si workers absents: Relancer boot.js pour forcer la copie");
    ns.tprint("  • Si trop de processus: Utiliser global-kill.js puis boot.js");
    
    ns.tprint("\n═══════════════════════════════════════════════════════════════");
}
