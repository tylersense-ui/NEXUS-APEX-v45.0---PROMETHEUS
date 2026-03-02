/**
 * DIAGNOSTIC SYSTÈME COMPLET - PROMETHEUS v45
 * 
 * Identifie précisément où le système se bloque :
 * 1. Vérification des processus actifs
 * 2. Test de lecture du port 4 (COMMANDS)
 * 3. Vérification des cibles disponibles
 * 4. Test d'écriture sur le port 4
 * 5. Diagnostic des serveurs de calcul
 * 
 * @param {NS} ns
 */

export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC SYSTÈME COMPLET - PROMETHEUS v45");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : PROCESSUS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("📊 ÉTAPE 1 : Vérification des processus actifs");
    ns.tprint("────────────────────────────────────────────────────────────");
    
    const processes = ns.ps("home");
    const criticalProcesses = {
        orchestrator: processes.find(p => p.filename.includes("orchestrator.js")),
        controller: processes.find(p => p.filename.includes("controller.js")),
        dashboard: processes.find(p => p.filename.includes("dashboard.js"))
    };
    
    if (criticalProcesses.orchestrator) {
        ns.tprint(`  ✅ orchestrator.js → PID: ${criticalProcesses.orchestrator.pid}`);
    } else {
        ns.tprint("  ❌ orchestrator.js → NON ACTIF !");
        ns.tprint("     → CAUSE : Le système n'est pas démarré");
        ns.tprint("     → SOLUTION : run boot.js");
        return;
    }
    
    if (criticalProcesses.controller) {
        ns.tprint(`  ✅ controller.js → PID: ${criticalProcesses.controller.pid}`);
    } else {
        ns.tprint("  ❌ controller.js → NON ACTIF !");
        ns.tprint("     → CAUSE : Le controller n'a pas été lancé par l'orchestrator");
        ns.tprint("     → SOLUTION : Vérifier les logs de l'orchestrator");
        return;
    }
    
    if (criticalProcesses.dashboard) {
        ns.tprint(`  ✅ dashboard.js → PID: ${criticalProcesses.dashboard.pid}`);
    } else {
        ns.tprint("  ⚠️  dashboard.js → Non actif (optionnel)");
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : COMMUNICATION PORT 4 (COMMANDS)
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("📨 ÉTAPE 2 : Vérification du port 4 (COMMANDS)");
    ns.tprint("────────────────────────────────────────────────────────────");
    
    // Vider le port pour voir s'il y a des messages en attente
    let messagesInPort = 0;
    let sampleMessage = null;
    
    while (!ns.getPortHandle(4).empty()) {
        const msg = ns.readPort(4);
        if (messagesInPort === 0) {
            sampleMessage = msg;
        }
        messagesInPort++;
        if (messagesInPort > 100) break; // Limite de sécurité
    }
    
    if (messagesInPort > 0) {
        ns.tprint(`  📬 ${messagesInPort} messages dans le port 4`);
        ns.tprint(`  📝 Exemple de message :`);
        try {
            const parsed = JSON.parse(sampleMessage);
            ns.tprint(`     Type: ${parsed.type}, Host: ${parsed.host}, Target: ${parsed.target}`);
            ns.tprint(`     Threads: ${parsed.threads}, Delay: ${parsed.delay}ms`);
            ns.tprint("");
            ns.tprint("  ✅ Le Batcher ÉCRIT dans le port 4");
            ns.tprint("  ✅ Format JSON valide");
            ns.tprint("  ⚠️  MAIS le Controller ne lit pas assez vite !");
            ns.tprint("     → CAUSE PROBABLE : Controller bloqué ou trop lent");
        } catch (e) {
            ns.tprint(`     ❌ Format invalide : ${String(sampleMessage).substring(0, 100)}`);
            ns.tprint("     → CAUSE : Corruption du port ou format incorrect");
        }
    } else {
        ns.tprint("  📭 Port 4 VIDE");
        ns.tprint("  ❌ Aucun message dans le port");
        ns.tprint("");
        ns.tprint("  → CAUSE POSSIBLE #1 : Le Batcher n'écrit PAS dans le port");
        ns.tprint("     (aucune cible valide, erreurs, ou Batcher cassé)");
        ns.tprint("");
        ns.tprint("  → CAUSE POSSIBLE #2 : Le Controller lit PLUS VITE que le Batcher n'écrit");
        ns.tprint("     (normal si le système fonctionne bien)");
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 3 : CIBLES DISPONIBLES
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🎯 ÉTAPE 3 : Vérification des cibles disponibles");
    ns.tprint("────────────────────────────────────────────────────────────");
    
    // Scanner tous les serveurs
    const allServers = scanAll(ns);
    const validTargets = [];
    
    for (const server of allServers) {
        // Ignore home et serveurs achetés
        if (server === "home" || server.startsWith("pserv-") || server.startsWith("nexus-node-")) {
            continue;
        }
        
        // Vérifier si on a root access
        if (!ns.hasRootAccess(server)) {
            continue;
        }
        
        // Vérifier si on peut hacker
        const reqHackLevel = ns.getServerRequiredHackingLevel(server);
        const playerHackLevel = ns.getHackingLevel();
        
        if (reqHackLevel > playerHackLevel) {
            continue;
        }
        
        // Vérifier si le serveur a de l'argent
        const maxMoney = ns.getServerMaxMoney(server);
        if (maxMoney === 0) {
            continue;
        }
        
        validTargets.push({
            hostname: server,
            maxMoney: maxMoney,
            currentMoney: ns.getServerMoneyAvailable(server),
            hackLevel: reqHackLevel,
            security: ns.getServerSecurityLevel(server),
            minSecurity: ns.getServerMinSecurityLevel(server)
        });
    }
    
    if (validTargets.length === 0) {
        ns.tprint("  ❌ AUCUNE CIBLE VALIDE TROUVÉE !");
        ns.tprint("     → CAUSE : Pas de serveurs hackables");
        ns.tprint("     → SOLUTION : Augmenter votre niveau de hacking");
        ns.tprint("                  ou acheter des port-openers");
        return;
    }
    
    // Trier par profit potentiel
    validTargets.sort((a, b) => b.maxMoney - a.maxMoney);
    
    ns.tprint(`  ✅ ${validTargets.length} cibles valides trouvées`);
    ns.tprint("");
    ns.tprint("  📊 Top 5 cibles :");
    
    for (let i = 0; i < Math.min(5, validTargets.length); i++) {
        const target = validTargets[i];
        const moneyPct = (target.currentMoney / target.maxMoney * 100).toFixed(1);
        const secDiff = (target.security - target.minSecurity).toFixed(1);
        
        ns.tprint(`     ${i + 1}. ${target.hostname}`);
        ns.tprint(`        💰 Max: ${ns.formatNumber(target.maxMoney)} (${moneyPct}% rempli)`);
        ns.tprint(`        🔐 Security: ${target.security.toFixed(1)} (min: ${target.minSecurity})`);
        ns.tprint(`        📈 Hack Level: ${target.hackLevel}`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 4 : TEST D'ÉCRITURE PORT 4
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🧪 ÉTAPE 4 : Test d'écriture sur le port 4");
    ns.tprint("────────────────────────────────────────────────────────────");
    
    // Nettoyer le port
    ns.clearPort(4);
    
    // Écrire un message de test
    const testJob = {
        type: "hack",
        host: "home",
        target: validTargets[0].hostname,
        threads: 1,
        delay: 0,
        timestamp: Date.now(),
        TEST: true
    };
    
    try {
        const written = ns.tryWritePort(4, JSON.stringify(testJob));
        
        if (written) {
            ns.tprint("  ✅ Écriture réussie sur le port 4");
            
            // Lire immédiatement pour vérifier
            await ns.sleep(50); // Laisser le temps au port
            
            if (ns.getPortHandle(4).empty()) {
                ns.tprint("  ⚠️  Port 4 déjà vide !");
                ns.tprint("     → Le Controller a LU le message test immédiatement");
                ns.tprint("     → BONNE NOUVELLE : La communication fonctionne");
            } else {
                const readBack = ns.readPort(4);
                try {
                    const parsed = JSON.parse(readBack);
                    if (parsed.TEST) {
                        ns.tprint("  ✅ Lecture réussie depuis le port 4");
                        ns.tprint("  ✅ Format JSON préservé");
                    }
                } catch (e) {
                    ns.tprint("  ❌ Erreur de parsing : message corrompu");
                }
            }
        } else {
            ns.tprint("  ❌ Échec d'écriture sur le port 4");
            ns.tprint("     → Port probablement plein (>50 messages)");
        }
    } catch (e) {
        ns.tprint(`  ❌ Erreur : ${e.message}`);
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 5 : SERVEURS DE CALCUL
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.tprint("💾 ÉTAPE 5 : Serveurs de calcul (nexus-node)");
    ns.tprint("────────────────────────────────────────────────────────────");
    
    const nexusServers = allServers.filter(s => s.startsWith("nexus-node-"));
    
    if (nexusServers.length === 0) {
        ns.tprint("  ❌ AUCUN serveur nexus-node trouvé !");
        ns.tprint("     → CAUSE : Aucun serveur acheté");
        ns.tprint("     → SOLUTION : Le server-manager va les acheter automatiquement");
        ns.tprint("                  ou achetez-en manuellement");
    } else {
        ns.tprint(`  ✅ ${nexusServers.length} serveurs nexus-node détectés`);
        
        let totalRAM = 0;
        let usedRAM = 0;
        let serversWithProcesses = 0;
        
        for (const server of nexusServers) {
            const maxRam = ns.getServerMaxRam(server);
            const usedRam = ns.getServerUsedRam(server);
            totalRAM += maxRam;
            usedRAM += usedRam;
            
            if (usedRam > 0) {
                serversWithProcesses++;
            }
        }
        
        const utilizationPct = (usedRAM / totalRAM * 100).toFixed(1);
        
        ns.tprint(`  💾 RAM totale : ${ns.formatRam(totalRAM)}`);
        ns.tprint(`  📊 RAM utilisée : ${ns.formatRam(usedRAM)} (${utilizationPct}%)`);
        ns.tprint(`  ⚙️  Serveurs actifs : ${serversWithProcesses}/${nexusServers.length}`);
        
        if (utilizationPct < 10) {
            ns.tprint("");
            ns.tprint("  ⚠️  UTILISATION < 10% !");
            ns.tprint("     → Les workers ne sont PAS exécutés");
            ns.tprint("     → PROBLÈME CONFIRMÉ : Le Controller ne dispatch pas");
        } else if (utilizationPct > 80) {
            ns.tprint("");
            ns.tprint("  ✅ Bonne utilisation de la RAM");
        }
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("💡 CONCLUSION DU DIAGNOSTIC");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // Déterminer le diagnostic
    if (messagesInPort > 50) {
        ns.tprint("❌ PROBLÈME IDENTIFIÉ : Controller bloqué ou trop lent");
        ns.tprint("");
        ns.tprint("Le Batcher écrit des jobs mais le Controller ne les traite pas.");
        ns.tprint("");
        ns.tprint("🔧 SOLUTIONS :");
        ns.tprint("  1. Redémarrer le système : run global-kill.js puis run boot.js");
        ns.tprint("  2. Vérifier les logs du Controller : tail hack/controller.js");
    } else if (validTargets.length === 0) {
        ns.tprint("❌ PROBLÈME IDENTIFIÉ : Aucune cible hackable");
        ns.tprint("");
        ns.tprint("🔧 SOLUTIONS :");
        ns.tprint("  1. Augmenter votre niveau de hacking");
        ns.tprint("  2. Acheter des port-openers (BruteSSH.exe, FTPCrack.exe, etc.)");
    } else if (nexusServers.length === 0) {
        ns.tprint("❌ PROBLÈME IDENTIFIÉ : Aucun serveur de calcul");
        ns.tprint("");
        ns.tprint("🔧 SOLUTIONS :");
        ns.tprint("  1. Attendre que le server-manager achète des serveurs");
        ns.tprint("  2. Acheter manuellement : purchaseServer('nexus-node-0', 64)");
    } else {
        ns.tprint("⚠️  PROBLÈME PROBABLE : Le Batcher ne crée pas de batches");
        ns.tprint("");
        ns.tprint("Causes possibles :");
        ns.tprint("  • Serveurs non préparés (security trop haute, argent trop bas)");
        ns.tprint("  • Erreur dans le calcul des batches");
        ns.tprint("  • Bug dans l'orchestrator");
        ns.tprint("");
        ns.tprint("🔧 SOLUTIONS :");
        ns.tprint("  1. Activer le DEBUG_MODE dans constants.js");
        ns.tprint("  2. Vérifier les logs : tail core/orchestrator.js");
        ns.tprint("  3. Redémarrer : run global-kill.js puis run boot.js");
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}

/**
 * Scanner récursif de tous les serveurs
 * @param {NS} ns
 * @returns {string[]} Liste de tous les serveurs
 */
function scanAll(ns) {
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (visited.has(current)) {
            continue;
        }
        
        visited.add(current);
        
        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }
    
    return Array.from(visited);
}
