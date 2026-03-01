/**
 * 🧪 TEST MANUEL - Reproduction du problème du Controller
 * 
 * Ce script tente d'exécuter EXACTEMENT la même commande que le Controller
 * pour identifier pourquoi ns.exec() retourne 0.
 * 
 * @usage run test-exec.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🧪 TEST MANUEL - Reproduction exec Controller");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 PARAMÈTRES DE TEST (basés sur vos logs)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const testsToRun = [
        // Tests qui FONCTIONNENT (selon vos logs)
        {
            host: "nexus-node-11",
            script: "/hack/workers/weaken.js",
            threads: 22,
            target: "omega-net",
            delay: 0,
            expectedResult: "✅ SUCCÈS"
        },
        {
            host: "nexus-node-13",
            script: "/hack/workers/weaken.js",
            threads: 9,
            target: "phantasy",
            delay: 0,
            expectedResult: "✅ SUCCÈS"
        },
        // Tests qui ÉCHOUENT (selon vos logs)
        {
            host: "nexus-node-14",
            script: "/hack/workers/weaken.js",
            threads: 14,
            target: "silver-helix",
            delay: 0,
            expectedResult: "❌ ÉCHEC"
        },
        {
            host: "nexus-node-15",
            script: "/hack/workers/weaken.js",
            threads: 14,
            target: "silver-helix",
            delay: 0,
            expectedResult: "❌ ÉCHEC"
        }
    ];
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🧪 EXÉCUTION DES TESTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    for (const test of testsToRun) {
        ns.tprint(`\n🧪 Test: ${test.script} sur ${test.host}`);
        ns.tprint(`   Target: ${test.target}, Threads: ${test.threads}`);
        ns.tprint(`   Attendu: ${test.expectedResult}`);
        ns.tprint("─".repeat(60));
        
        // ✅ 1. Vérifier que le host existe
        try {
            ns.getServer(test.host);
            ns.tprint("  ✅ Host existe");
        } catch (e) {
            ns.tprint(`  ❌ Host N'EXISTE PAS: ${e.message}`);
            continue;
        }
        
        // ✅ 2. Vérifier la RAM disponible
        const maxRam = ns.getServerMaxRam(test.host);
        const usedRam = ns.getServerUsedRam(test.host);
        const freeRam = maxRam - usedRam;
        const ramNeeded = ns.getScriptRam(test.script, test.host) * test.threads;
        
        ns.tprint(`  📊 RAM libre: ${ns.formatRam(freeRam)}`);
        ns.tprint(`  📏 RAM nécessaire: ${ns.formatRam(ramNeeded)}`);
        
        if (freeRam < ramNeeded) {
            ns.tprint(`  ❌ RAM INSUFFISANTE (manque ${ns.formatRam(ramNeeded - freeRam)})`);
            continue;
        } else {
            ns.tprint(`  ✅ RAM suffisante`);
        }
        
        // ✅ 3. Vérifier que le script existe sur le host
        const scriptExists = ns.fileExists(test.script, test.host);
        if (scriptExists) {
            ns.tprint(`  ✅ Script présent sur ${test.host}`);
        } else {
            ns.tprint(`  ❌ Script ABSENT sur ${test.host}`);
            
            // Essayer de copier le script
            ns.tprint(`  📦 Tentative de copie...`);
            const scpSuccess = await ns.scp(test.script, test.host);
            if (scpSuccess) {
                ns.tprint(`  ✅ Copie réussie`);
            } else {
                ns.tprint(`  ❌ Copie échouée`);
                continue;
            }
        }
        
        // ✅ 4. Vérifier que la CIBLE existe
        try {
            ns.getServer(test.target);
            ns.tprint(`  ✅ Target "${test.target}" existe`);
        } catch (e) {
            ns.tprint(`  ⚠️  Target "${test.target}" N'EXISTE PAS`);
            ns.tprint(`     → Cela ne devrait pas empêcher exec, mais le worker crashera`);
        }
        
        // ✅ 5. Vérifier si on a root access sur la cible
        const hasRoot = ns.hasRootAccess(test.target);
        if (hasRoot) {
            ns.tprint(`  ✅ Root access sur target "${test.target}"`);
        } else {
            ns.tprint(`  ⚠️  PAS de root access sur target "${test.target}"`);
            ns.tprint(`     → Le worker ne pourra pas weaken la cible`);
        }
        
        // 🚀 6. TENTATIVE D'EXÉCUTION (le moment de vérité)
        ns.tprint("\n  🚀 Tentative d'exécution...");
        
        try {
            const pid = ns.exec(
                test.script,
                test.host,
                test.threads,
                test.target,
                test.delay
            );
            
            if (pid === 0) {
                ns.tprint(`  ❌ ÉCHEC: ns.exec() a retourné 0`);
                ns.tprint(`     → BitBurner a REFUSÉ de lancer le script`);
                ns.tprint(`     → Raison inconnue (pas de message d'erreur)`);
            } else {
                ns.tprint(`  ✅ SUCCÈS: Script lancé (PID: ${pid})`);
                ns.tprint(`     → Attendez ~${ns.getWeakenTime(test.target)/1000}s pour voir le résultat`);
                
                // Attendre 2 secondes puis vérifier si le processus tourne toujours
                await ns.sleep(2000);
                const processes = ns.ps(test.host);
                const stillRunning = processes.some(p => p.pid === pid);
                
                if (stillRunning) {
                    ns.tprint(`     ✅ Le processus tourne toujours`);
                } else {
                    ns.tprint(`     ⚠️  Le processus s'est terminé rapidement (normal ou crash?)`);
                }
            }
        } catch (error) {
            ns.tprint(`  ❌ EXCEPTION: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 CONCLUSION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("\n═══════════════════════════════════════════════════════════════");
    ns.tprint("📋 ANALYSE FINALE");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("Si les tests 'SUCCÈS attendu' ont réussi mais les tests");
    ns.tprint("'ÉCHEC attendu' ont échoué avec la même configuration,");
    ns.tprint("alors le problème est lié à la TARGET, pas au HOST.");
    ns.tprint("");
    ns.tprint("Vérifiez si 'silver-helix' a un statut particulier :");
    ns.tprint("  • Est-il rooté ? (hasRootAccess)");
    ns.tprint("  • Existe-t-il vraiment ?");
    ns.tprint("  • Y a-t-il des restrictions particulières ?");
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
