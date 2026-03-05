/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v47.3 - "DIAGNOSTIC ULTRA-COMPLET"
 * 
 * @module      diagnostic-ultra-complet.js
 * @description Diagnostic complet du système PROMETHEUS pour identifier les problèmes de déploiement
 * @author      Claude (Anthropic)
 * @version     47.3 - DIAGNOSTIC ULTIMATE
 * @date        2026-03-05
 * @license     MIT
 * @requires    BitBurner v2.8.1+
 * 
 * @changelog
 * v47.3 - 2026-03-05
 * - Diagnostic ultra-complet pour identifier problèmes de déploiement
 * - Vérification flux complet: Orchestrator → Batcher → Port 4 → Controller → Workers
 * - Analyse détaillée de la RAM disponible vs utilisée
 * - Identification des serveurs vides et pourquoi ils ne sont pas utilisés
 * 
 * @usage
 * run diagnostic-ultra-complet.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC ULTRA-COMPLET - NEXUS-APEX PROMETHEUS v47.3");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : VÉRIFICATION DES PROCESSUS CRITIQUES
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.print("📊 ÉTAPE 1 : Processus critiques");
    ns.print("────────────────────────────────────────────────────────────");
    
    const processes = ns.ps("home");
    const orchestrator = processes.find(p => p.filename.includes("orchestrator"));
    const controller = processes.find(p => p.filename.includes("controller"));
    const dashboard = processes.find(p => p.filename.includes("dashboard"));
    
    let systemStatus = "✅ OK";
    
    if (!orchestrator) {
        ns.print("  ❌ orchestrator.js → NON ACTIF !");
        ns.print("     → CAUSE : Le système n'est pas démarré");
        ns.print("     → SOLUTION : run boot.js ou run /core/orchestrator.js");
        systemStatus = "🔴 CRITIQUE";
        ns.print("");
        ns.print("═══════════════════════════════════════════════════════════════");
        return;
    } else {
        ns.print(`  ✅ orchestrator.js → PID: ${orchestrator.pid}`);
    }
    
    if (!controller) {
        ns.print("  ❌ controller.js → NON ACTIF !");
        ns.print("     → CAUSE : Le controller n'a pas été lancé par l'orchestrator");
        ns.print("     → SOLUTION : Vérifier les logs de l'orchestrator");
        systemStatus = "🔴 CRITIQUE";
    } else {
        ns.print(`  ✅ controller.js → PID: ${controller.pid}`);
    }
    
    if (dashboard) {
        ns.print(`  ✅ dashboard.js → PID: ${dashboard.pid}`);
    } else {
        ns.print("  ⚠️  dashboard.js → Non actif (optionnel)");
    }
    
    ns.print("");
    
    if (systemStatus !== "✅ OK") {
        ns.print("═══════════════════════════════════════════════════════════════");
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : ANALYSE DU PORT 4 (COMMANDS)
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.print("📨 ÉTAPE 2 : État du port 4 (COMMANDS)");
    ns.print("────────────────────────────────────────────────────────────");
    
    const port4 = ns.getPortHandle(4);
    let messagesCount = 0;
    const jobs = [];
    
    // Lire tous les messages sans vider le port (pour analyse)
    while (!port4.empty()) {
        const msg = ns.readPort(4);
        messagesCount++;
        try {
            const job = JSON.parse(msg);
            jobs.push(job);
        } catch (e) {
            ns.print(`  ⚠️  Message invalide dans le port: ${msg}`);
        }
    }
    
    ns.print(`  📬 Messages dans le port 4: ${messagesCount}`);
    
    if (messagesCount === 0) {
        ns.print("  ✅ Port vide - Normal si le Controller traite les jobs rapidement");
        ns.print("  💡 Ou... le Batcher ne génère PAS de jobs !");
        ns.print("");
    } else {
        ns.print(`  ⚠️  ${messagesCount} jobs en attente - Le Controller ne traite pas assez vite !`);
        ns.print("");
        ns.print("  📝 Échantillon des jobs:");
        for (let i = 0; i < Math.min(5, jobs.length); i++) {
            const j = jobs[i];
            ns.print(`     ${i+1}. ${j.type} → ${j.target} (${j.threads}t) sur ${j.host || 'N/A'}`);
        }
        ns.print("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 3 : ANALYSE DU RÉSEAU ET DE LA RAM
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.print("💾 ÉTAPE 3 : Analyse du réseau et de la RAM");
    ns.print("────────────────────────────────────────────────────────────");
    
    // Scanner tout le réseau
    const allServers = [];
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        allServers.push(current);
        
        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }
    
    let totalRAM = 0;
    let usedRAM = 0;
    let freeRAM = 0;
    let serversWithRAM = 0;
    let serversWithProcesses = 0;
    let emptyServers = 0;
    
    const ramByServer = [];
    
    for (const server of allServers) {
        const maxRam = ns.getServerMaxRam(server);
        const used = ns.getServerUsedRam(server);
        const free = maxRam - used;
        
        if (maxRam > 0) {
            totalRAM += maxRam;
            usedRAM += used;
            freeRAM += free;
            serversWithRAM++;
            
            const procs = ns.ps(server);
            if (procs.length > 0) {
                serversWithProcesses++;
            } else if (ns.hasRootAccess(server)) {
                emptyServers++;
                ramByServer.push({ server, maxRam, free });
            }
        }
    }
    
    ns.print(`  📊 Serveurs totaux: ${allServers.length}`);
    ns.print(`  💾 Serveurs avec RAM: ${serversWithRAM}`);
    ns.print(`  ⚙️  Serveurs avec processus actifs: ${serversWithProcesses}`);
    ns.print(`  📪 Serveurs vides (utilisables): ${emptyServers}`);
    ns.print("");
    ns.print(`  💾 RAM Totale: ${formatRAM(totalRAM)}`);
    ns.print(`  ⚙️  RAM Utilisée: ${formatRAM(usedRAM)} (${(usedRAM/totalRAM*100).toFixed(1)}%)`);
    ns.print(`  💚 RAM Libre: ${formatRAM(freeRAM)} (${(freeRAM/totalRAM*100).toFixed(1)}%)`);
    ns.print("");
    
    // Top 20 serveurs vides avec le plus de RAM
    ramByServer.sort((a, b) => b.free - a.free);
    ns.print("  🎯 TOP 20 serveurs vides avec RAM libre:");
    for (let i = 0; i < Math.min(20, ramByServer.length); i++) {
        const s = ramByServer[i];
        ns.print(`     ${(i+1).toString().padStart(2)}. ${s.server.padEnd(20)} : ${formatRAM(s.free).padStart(10)}`);
    }
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 4 : ANALYSE DES WORKERS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.print("🤖 ÉTAPE 4 : Analyse des workers actifs");
    ns.print("────────────────────────────────────────────────────────────");
    
    const workerStats = {
        hack: 0,
        grow: 0,
        weaken: 0,
        share: 0,
        total: 0
    };
    
    for (const server of allServers) {
        const procs = ns.ps(server);
        for (const proc of procs) {
            if (proc.filename.includes("hack.js")) workerStats.hack++;
            else if (proc.filename.includes("grow.js")) workerStats.grow++;
            else if (proc.filename.includes("weaken.js")) workerStats.weaken++;
            else if (proc.filename.includes("share.js")) workerStats.share++;
        }
    }
    
    workerStats.total = workerStats.hack + workerStats.grow + workerStats.weaken + workerStats.share;
    
    ns.print(`  💸 Workers hack.js: ${workerStats.hack}`);
    ns.print(`  💪 Workers grow.js: ${workerStats.grow}`);
    ns.print(`  🛡️  Workers weaken.js: ${workerStats.weaken}`);
    ns.print(`  🤝 Workers share.js: ${workerStats.share}`);
    ns.print(`  📊 Total workers: ${workerStats.total}`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 5 : DIAGNOSTIC ET RECOMMANDATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("💡 DIAGNOSTIC ET RECOMMANDATIONS");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // Analyse du problème
    const percentUsed = (usedRAM / totalRAM * 100);
    const percentServersUsed = (serversWithProcesses / serversWithRAM * 100);
    
    if (percentUsed < 10 && emptyServers > 40) {
        ns.print("🔴 PROBLÈME CRITIQUE IDENTIFIÉ:");
        ns.print("");
        ns.print("  ❌ Utilisation RAM très faible: " + percentUsed.toFixed(1) + "%");
        ns.print("  ❌ " + emptyServers + " serveurs utilisables sont vides");
        ns.print("  ❌ " + formatRAM(freeRAM) + " de RAM gaspillée !");
        ns.print("");
        ns.print("🔍 CAUSES POSSIBLES:");
        ns.print("");
        
        if (messagesCount === 0 && workerStats.total < 100) {
            ns.print("  1️⃣  LE BATCHER NE GÉNÈRE PAS DE JOBS");
            ns.print("     → Vérifier que l'orchestrator appelle bien executeBatch()");
            ns.print("     → Vérifier les logs: tail /core/orchestrator.js");
            ns.print("     → Vérifier que des cibles sont trouvées");
            ns.print("");
        }
        
        if (messagesCount > 10) {
            ns.print("  2️⃣  LE CONTROLLER NE LIT PAS LE PORT 4");
            ns.print("     → Le port contient " + messagesCount + " jobs non traités");
            ns.print("     → Vérifier les logs: tail /hack/controller.js");
            ns.print("     → Le controller est peut-être bloqué ou en erreur");
            ns.print("");
        }
        
        if (workerStats.total < 100 && emptyServers > 40) {
            ns.print("  3️⃣  LE CONTROLLER NE DÉPLOIE PAS LES WORKERS");
            ns.print("     → Seulement " + workerStats.total + " workers actifs");
            ns.print("     → " + emptyServers + " serveurs vides disponibles");
            ns.print("     → Problème possible dans l'algorithme FFD de dispatch");
            ns.print("     → Ou ns.exec() échoue silencieusement");
            ns.print("");
        }
        
        ns.print("🔧 ACTIONS RECOMMANDÉES:");
        ns.print("");
        ns.print("  1. Vérifier les logs de l'orchestrator:");
        ns.print("     tail /core/orchestrator.js");
        ns.print("");
        ns.print("  2. Vérifier les logs du controller:");
        ns.print("     tail /hack/controller.js");
        ns.print("");
        ns.print("  3. Tester manuellement le batcher:");
        ns.print("     → Vérifier si des targets sont trouvées");
        ns.print("     → Vérifier si executeBatch() génère des jobs");
        ns.print("");
        ns.print("  4. Vérifier les fichiers workers:");
        ns.print("     ls /hack/workers/");
        ns.print("     → hack.js, grow.js, weaken.js doivent exister");
        ns.print("");
        ns.print("  5. Redémarrer le système:");
        ns.print("     run global-kill.js && run boot.js");
        ns.print("");
        
    } else if (percentUsed > 80) {
        ns.print("✅ SYSTÈME OPÉRATIONNEL:");
        ns.print("");
        ns.print("  ✅ Utilisation RAM: " + percentUsed.toFixed(1) + "%");
        ns.print("  ✅ " + serversWithProcesses + " serveurs actifs");
        ns.print("  ✅ " + workerStats.total + " workers déployés");
        ns.print("");
        ns.print("💡 Le système fonctionne correctement !");
        ns.print("");
    } else {
        ns.print("⚠️  UTILISATION SOUS-OPTIMALE:");
        ns.print("");
        ns.print("  ⚠️  Utilisation RAM: " + percentUsed.toFixed(1) + "%");
        ns.print("  ⚠️  " + percentServersUsed.toFixed(1) + "% des serveurs utilisés");
        ns.print("  ⚠️  " + formatRAM(freeRAM) + " de RAM disponible non utilisée");
        ns.print("");
        ns.print("💡 Le système pourrait être optimisé pour utiliser plus de ressources");
        ns.print("");
    }
    
    ns.print("═══════════════════════════════════════════════════════════════");
}

/**
 * Formate la RAM en unités lisibles (GB, TB, PB)
 * @param {number} ram - RAM en GB
 * @returns {string} RAM formatée
 */
function formatRAM(ram) {
    if (ram >= 1024 * 1024) {
        return (ram / (1024 * 1024)).toFixed(2) + "PB";
    } else if (ram >= 1024) {
        return (ram / 1024).toFixed(2) + "TB";
    } else {
        return ram.toFixed(2) + "GB";
    }
}
