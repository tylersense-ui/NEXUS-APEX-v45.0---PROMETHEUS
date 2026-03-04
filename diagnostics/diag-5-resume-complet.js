/**
 * 🔍 DIAGNOSTIC 5 : RÉSUMÉ COMPLET & PLAN D'ACTION
 * 
 * Lance tous les diagnostics et synthétise les résultats.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.clearLog();
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 PROTOCOLE DE DÉBOGAGE COMPLET - NEXUS-APEX v46");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    ns.print("⏳ Exécution des diagnostics...");
    await ns.sleep(500);
    
    // Résultats des diagnostics
    const results = {
        sync: null,
        processes: null,
        targets: null,
        servers: null
    };
    
    // ═══════════════════════════════════════════════════════════════
    // DIAGNOSTIC 1: Synchronisation Batcher → Controller
    // ═══════════════════════════════════════════════════════════════
    
    ns.print("");
    ns.print("📡 DIAG 1 : Synchronisation Batcher → Controller");
    ns.print("─────────────────────────────────────────────────────────────");
    
    try {
        const { PortHandler } = await import("/core/port-handler.js");
        const ph = new PortHandler(ns);
        
        let jobCount = 0;
        const hostDist = new Map();
        
        while (!ph.isEmpty(4)) {
            const job = ph.readJSON(4);
            if (job) {
                jobCount++;
                const host = job.host || "UNKNOWN";
                hostDist.set(host, (hostDist.get(host) || 0) + 1);
            }
        }
        
        results.sync = {
            jobsInPort: jobCount,
            uniqueHosts: hostDist.size,
            distribution: hostDist
        };
        
        if (jobCount === 0) {
            ns.print("   ⚪ Port 4 vide (normal si traité)");
        } else if (hostDist.size === 1) {
            ns.print(`   🔴 PROBLÈME: Tous les jobs sur 1 seul serveur !`);
        } else {
            ns.print(`   ✅ Jobs distribués sur ${hostDist.size} serveurs`);
        }
        
    } catch (error) {
        ns.print(`   ❌ Erreur: ${error.message}`);
    }
    
    await ns.sleep(500);
    
    // ═══════════════════════════════════════════════════════════════
    // DIAGNOSTIC 2: Processus actifs
    // ═══════════════════════════════════════════════════════════════
    
    ns.print("");
    ns.print("⚙️  DIAG 2 : Processus actifs");
    ns.print("─────────────────────────────────────────────────────────────");
    
    try {
        const servers = [];
        function scan(host, depth = 0) {
            if (depth > 20 || servers.includes(host)) return;
            servers.push(host);
            for (const neighbor of ns.scan(host)) scan(neighbor, depth + 1);
        }
        scan("home");
        
        const stats = {
            hack: 0, grow: 0, weaken: 0, share: 0
        };
        
        for (const server of servers) {
            for (const proc of ns.ps(server)) {
                if (proc.filename.includes('/hack/workers/hack.js')) stats.hack += proc.threads;
                else if (proc.filename.includes('/hack/workers/grow.js')) stats.grow += proc.threads;
                else if (proc.filename.includes('/hack/workers/weaken.js')) stats.weaken += proc.threads;
                else if (proc.filename.includes('/hack/workers/share.js')) stats.share += proc.threads;
            }
        }
        
        results.processes = stats;
        const total = stats.hack + stats.grow + stats.weaken + stats.share;
        
        ns.print(`   💸 Hack: ${ns.formatNumber(stats.hack)}t | 💪 Grow: ${ns.formatNumber(stats.grow)}t`);
        ns.print(`   🛡️  Weaken: ${ns.formatNumber(stats.weaken)}t | 🤝 Share: ${ns.formatNumber(stats.share)}t`);
        
        if (total === 0) {
            ns.print(`   🔴 AUCUN worker actif !`);
        } else if (total < 10000) {
            ns.print(`   🟠 Très peu de threads (${ns.formatNumber(total)})`);
        } else {
            ns.print(`   ✅ ${ns.formatNumber(total)} threads actifs`);
        }
        
        // Vérifier ratio grow
        if (total > 0) {
            const growRatio = (stats.grow / total * 100);
            if (growRatio > 70) {
                ns.print(`   🔴 ANOMALIE: ${growRatio.toFixed(1)}% de grow (trop élevé)`);
            }
        }
        
    } catch (error) {
        ns.print(`   ❌ Erreur: ${error.message}`);
    }
    
    await ns.sleep(500);
    
    // ═══════════════════════════════════════════════════════════════
    // DIAGNOSTIC 3: État des cibles
    // ═══════════════════════════════════════════════════════════════
    
    ns.print("");
    ns.print("🎯 DIAG 3 : État des cibles");
    ns.print("─────────────────────────────────────────────────────────────");
    
    try {
        const targets = ["catalyst", "computek", "netlink", "omega-net", "rothman-uni",
                        "summit-uni", "the-hub", "johnson-ortho"];
        
        let readyCount = 0;
        
        for (const target of targets) {
            if (!ns.serverExists(target)) continue;
            
            const s = ns.getServer(target);
            const moneyPct = (s.moneyAvailable / (s.moneyMax || 1) * 100);
            const secDiff = s.hackDifficulty - s.minDifficulty;
            
            if (moneyPct >= 90 && secDiff <= 5) {
                readyCount++;
            }
        }
        
        results.targets = { ready: readyCount, total: targets.length };
        
        ns.print(`   ✅ Cibles prêtes: ${readyCount} / ${targets.length}`);
        
        if (readyCount === 0) {
            ns.print(`   🔴 AUCUNE cible prête → Que de la prep`);
        }
        
    } catch (error) {
        ns.print(`   ❌ Erreur: ${error.message}`);
    }
    
    await ns.sleep(500);
    
    // ═══════════════════════════════════════════════════════════════
    // DIAGNOSTIC 4: Serveurs disponibles
    // ═══════════════════════════════════════════════════════════════
    
    ns.print("");
    ns.print("💾 DIAG 4 : Serveurs disponibles");
    ns.print("─────────────────────────────────────────────────────────────");
    
    try {
        const servers = [];
        function scan(host, depth = 0) {
            if (depth > 20 || servers.includes(host)) return;
            servers.push(host);
            for (const neighbor of ns.scan(host)) scan(neighbor, depth + 1);
        }
        scan("home");
        
        const usable = [];
        for (const server of servers) {
            const s = ns.getServer(server);
            if (s.maxRam > 0 && s.hasAdminRights) {
                usable.push({
                    name: server,
                    maxRam: s.maxRam,
                    usage: (s.ramUsed / s.maxRam * 100)
                });
            }
        }
        
        const totalRam = usable.reduce((sum, s) => sum + s.maxRam, 0);
        const freeRam = usable.reduce((sum, s) => sum + s.maxRam * (1 - s.usage/100), 0);
        const avgUsage = usable.reduce((sum, s) => sum + s.usage, 0) / usable.length;
        
        results.servers = {
            count: usable.length,
            totalRam,
            avgUsage
        };
        
        ns.print(`   📊 Serveurs: ${usable.length} | RAM: ${ns.formatRam(totalRam)}`);
        ns.print(`   💾 Utilisé: ${avgUsage.toFixed(1)}% | Libre: ${ns.formatRam(freeRam)}`);
        
        if (avgUsage < 20) {
            ns.print(`   🔴 Utilisation très faible !`);
        }
        
        const emptyServers = usable.filter(s => s.usage < 1).length;
        if (emptyServers > 10) {
            ns.print(`   🔴 ${emptyServers} serveurs VIDES`);
        }
        
    } catch (error) {
        ns.print(`   ❌ Erreur: ${error.message}`);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SYNTHÈSE ET PLAN D'ACTION
    // ═══════════════════════════════════════════════════════════════
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🎯 SYNTHÈSE DES DIAGNOSTICS");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    const issues = [];
    
    if (results.sync?.uniqueHosts === 1) {
        issues.push("Jobs concentrés sur 1 serveur (Batcher/RAM Manager)");
    }
    
    if (results.processes && (results.processes.hack + results.processes.grow + results.processes.weaken) < 10000) {
        issues.push("Très peu de workers actifs");
    }
    
    if (results.processes) {
        const total = results.processes.hack + results.processes.grow + results.processes.weaken;
        if (total > 0 && (results.processes.grow / total > 0.7)) {
            issues.push("Trop de threads grow (>70%)");
        }
    }
    
    if (results.targets?.ready === 0) {
        issues.push("Aucune cible prête (système en prep perpétuelle)");
    }
    
    if (results.servers?.avgUsage < 20) {
        issues.push("RAM très sous-utilisée");
    }
    
    if (issues.length === 0) {
        ns.print("✅ Aucun problème majeur détecté");
        ns.print("");
        ns.print("💡 Le système devrait fonctionner normalement.");
        ns.print("   Si les revenus sont faibles:");
        ns.print("   • Vérifier les cibles (run diag-3)");
        ns.print("   • Attendre la convergence (5-10 min)");
    } else {
        ns.print("🔴 PROBLÈMES IDENTIFIÉS :");
        ns.print("");
        for (let i = 0; i < issues.length; i++) {
            ns.print(`   ${i+1}. ${issues[i]}`);
        }
        
        ns.print("");
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("📋 PLAN D'ACTION");
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("");
        
        if (issues.some(i => i.includes("1 serveur"))) {
            ns.print("🔧 PRIORITÉ 1: Vérifier le RAM Manager");
            ns.print("   → Vérifier que getRamPools() retourne tous les serveurs");
            ns.print("   → Logs du Batcher en mode DEBUG");
            ns.print("");
        }
        
        if (issues.some(i => i.includes("prête"))) {
            ns.print("🔧 PRIORITÉ 2: Prep des cibles");
            ns.print("   → Laisser tourner 10-15 minutes");
            ns.print("   → Vérifier grow/weaken threads corrects");
            ns.print("");
        }
        
        if (issues.some(i => i.includes("workers actifs"))) {
            ns.print("🔧 PRIORITÉ 3: Controller");
            ns.print("   → Vérifier que le Controller lit le port 4");
            ns.print("   → Vérifier logs du Controller");
            ns.print("");
        }
    }
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("✅ DIAGNOSTIC COMPLET TERMINÉ");
    ns.print("═══════════════════════════════════════════════════════════════");
}
