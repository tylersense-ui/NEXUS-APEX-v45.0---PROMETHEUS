/**
 * 🔍 DIAGNOSTIC - Port de communication Batcher → Controller
 * 
 * Ce script vérifie si les jobs sont correctement formatés et transmis
 * entre le Batcher et le Controller via le port 4.
 * 
 * @usage run diagnostic-port-communication.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC - Communication Batcher → Controller");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DU PORT 4 (COMMANDS)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const COMMANDS_PORT = 4;
    
    ns.tprint("📨 État du port 4 (COMMANDS):");
    ns.tprint("─".repeat(60));
    
    // Vérifier si le port est vide ou contient des jobs en attente
    const portHandle = ns.getPortHandle(COMMANDS_PORT);
    
    ns.tprint(`  📊 Jobs en attente: ${!portHandle.empty() ? "Oui (port non vide)" : "Non (port vide)"}`);
    ns.tprint(`  📏 Taille du port: ${portHandle.data.length} messages`);
    
    if (!portHandle.empty()) {
        ns.tprint(`  ⚠️  Le port contient des jobs non traités !`);
        ns.tprint(`     Cela signifie que le Controller n'arrive pas à les lire.`);
    } else {
        ns.tprint(`  ✅ Port vide (normal si système au repos)`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🧪 TEST D'ÉCRITURE/LECTURE SUR LE PORT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🧪 Test d'écriture/lecture sur le port 4:");
    ns.tprint("─".repeat(60));
    
    // Nettoyer le port d'abord
    ns.clearPort(COMMANDS_PORT);
    ns.tprint("  🧹 Port nettoyé");
    
    // Créer un job de test
    const testJob = {
        type: "weaken",
        host: "nexus-node-0",
        target: "n00dles",
        threads: 1,
        delay: 0
    };
    
    // Écrire sur le port
    try {
        const writeSuccess = ns.writePort(COMMANDS_PORT, JSON.stringify(testJob));
        if (writeSuccess) {
            ns.tprint("  ✅ Écriture réussie");
        } else {
            ns.tprint("  ❌ Écriture échouée");
        }
    } catch (error) {
        ns.tprint(`  ❌ Erreur lors de l'écriture: ${error.message}`);
    }
    
    // Attendre un peu
    await ns.sleep(100);
    
    // Lire depuis le port
    try {
        const data = ns.readPort(COMMANDS_PORT);
        if (data !== "NULL PORT DATA") {
            const job = JSON.parse(data);
            ns.tprint("  ✅ Lecture réussie");
            ns.tprint(`     Type: ${job.type}`);
            ns.tprint(`     Host: ${job.host}`);
            ns.tprint(`     Target: ${job.target}`);
            ns.tprint(`     Threads: ${job.threads}`);
        } else {
            ns.tprint("  ⚠️  Port vide après écriture (anormal)");
        }
    } catch (error) {
        ns.tprint(`  ❌ Erreur lors de la lecture: ${error.message}`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES PROCESSUS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("⚙️  Processus du système:");
    ns.tprint("─".repeat(60));
    
    const systemProcesses = [
        { name: "boot.js", location: "home" },
        { name: "orchestrator.js", location: "home" },
        { name: "controller.js", location: "home" },
        { name: "batcher.js", location: "home" }
    ];
    
    for (const proc of systemProcesses) {
        const processes = ns.ps(proc.location);
        const found = processes.find(p => p.filename.includes(proc.name));
        
        if (found) {
            ns.tprint(`  ✅ ${proc.name.padEnd(20)} → PID: ${found.pid}`);
        } else {
            ns.tprint(`  ❌ ${proc.name.padEnd(20)} → NON ACTIF !`);
        }
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 ANALYSE DES LOGS DU CONTROLLER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("📋 Recommandations:");
    ns.tprint("─".repeat(60));
    
    const controllerActive = ns.ps("home").some(p => p.filename.includes("controller"));
    const batcherActive = ns.ps("home").some(p => p.filename.includes("batcher"));
    
    if (!controllerActive) {
        ns.tprint("  ❌ CRITIQUE: Controller n'est pas actif !");
        ns.tprint("     → Le système ne peut pas exécuter de jobs");
        ns.tprint("     → Solution: run boot.js");
    } else if (!batcherActive) {
        ns.tprint("  ❌ CRITIQUE: Batcher n'est pas actif !");
        ns.tprint("     → Le système ne génère pas de jobs");
        ns.tprint("     → Solution: run boot.js");
    } else {
        ns.tprint("  ✅ Controller et Batcher sont actifs");
        ns.tprint("");
        ns.tprint("  🔍 Analyse des échecs:");
        ns.tprint("     Si vous voyez dans les logs:");
        ns.tprint("     • ⚠️  Échec exec weaken sur nexus-node-XX");
        ns.tprint("");
        ns.tprint("     Causes possibles:");
        ns.tprint("     1. Threads trop élevés pour la RAM disponible");
        ns.tprint("     2. Worker script absent sur le serveur");
        ns.tprint("     3. Arguments incorrects passés au worker");
        ns.tprint("     4. Saturation du port (jobs envoyés trop vite)");
        ns.tprint("");
        ns.tprint("  💡 Solutions à tester:");
        ns.tprint("     A. Redémarrage complet:");
        ns.tprint("        run global-kill.js");
        ns.tprint("        await 2 secondes");
        ns.tprint("        run boot.js");
        ns.tprint("");
        ns.tprint("     B. Vérifier les logs en temps réel:");
        ns.tprint("        tail hack/controller.js");
        ns.tprint("        tail core/batcher.js");
        ns.tprint("");
        ns.tprint("     C. Activer le mode DEBUG:");
        ns.tprint("        Éditez lib/constants.js");
        ns.tprint("        Cherchez: DEBUG_MODE: false");
        ns.tprint("        Changez en: DEBUG_MODE: true");
        ns.tprint("        Puis: run boot.js");
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("💡 PROCHAINES ÉTAPES");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("1. Vérifiez les logs Controller:");
    ns.tprint("   tail hack/controller.js");
    ns.tprint("");
    ns.tprint("2. Si vous voyez beaucoup d'échecs exec:");
    ns.tprint("   → Faites un redémarrage propre (global-kill + boot)");
    ns.tprint("");
    ns.tprint("3. Partagez les logs avec Claude pour analyse approfondie");
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
