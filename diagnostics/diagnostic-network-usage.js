/**
 * 🔍 DIAGNOSTIC - Pourquoi le réseau complet n'est pas utilisé ?
 * 
 * Ce script analyse tous les serveurs disponibles et vérifie pourquoi
 * le Batcher n'utilise que 7 serveurs sur 96.
 * 
 * @usage run diagnostic-network-usage.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC - Utilisation du réseau");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🌐 SCAN COMPLET DU RÉSEAU
    // ═══════════════════════════════════════════════════════════════════════════════
    
    function scanNetwork(ns) {
        const queue = ["home"];
        const visited = new Set();
        const servers = [];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (visited.has(current)) continue;
            visited.add(current);
            servers.push(current);
            
            try {
                const neighbors = ns.scan(current);
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            } catch (error) {
                // Ignorer
            }
        }
        
        return servers;
    }
    
    const allServers = scanNetwork(ns);
    
    ns.tprint(`📊 Total serveurs détectés: ${allServers.length}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 CATÉGORISATION DES SERVEURS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const categories = {
        home: [],
        nexusNodes: [],
        hacknetNodes: [],
        gameServers: []
    };
    
    const serverStats = {
        withRoot: 0,
        withoutRoot: 0,
        withRam: 0,
        withoutRam: 0,
        withProcesses: 0,
        empty: 0
    };
    
    const ramStats = {
        total: 0,
        used: 0,
        free: 0
    };
    
    for (const server of allServers) {
        // Catégoriser
        if (server === "home") {
            categories.home.push(server);
        } else if (server.startsWith("nexus-node")) {
            categories.nexusNodes.push(server);
        } else if (server.startsWith("hacknet-node")) {
            categories.hacknetNodes.push(server);
        } else {
            categories.gameServers.push(server);
        }
        
        // Stats
        const hasRoot = ns.hasRootAccess(server);
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const processes = ns.ps(server);
        
        if (hasRoot) serverStats.withRoot++;
        else serverStats.withoutRoot++;
        
        if (maxRam > 0) {
            serverStats.withRam++;
            ramStats.total += maxRam;
            ramStats.used += usedRam;
            ramStats.free += (maxRam - usedRam);
        } else {
            serverStats.withoutRam++;
        }
        
        if (processes.length > 0) serverStats.withProcesses++;
        else serverStats.empty++;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 AFFICHAGE DES CATÉGORIES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("📁 CATÉGORIES DE SERVEURS:");
    ns.tprint("─".repeat(60));
    ns.tprint(`  🏠 Home: ${categories.home.length}`);
    ns.tprint(`  💻 Nexus-Nodes (achetés): ${categories.nexusNodes.length}`);
    ns.tprint(`  🔗 Hacknet-Nodes: ${categories.hacknetNodes.length}`);
    ns.tprint(`  🌐 Serveurs du jeu (hackés): ${categories.gameServers.length}`);
    ns.tprint("");
    
    ns.tprint("🔐 STATUTS:");
    ns.tprint("─".repeat(60));
    ns.tprint(`  ✅ Avec root access: ${serverStats.withRoot}`);
    ns.tprint(`  ❌ Sans root access: ${serverStats.withoutRoot}`);
    ns.tprint(`  💾 Avec RAM (> 0 GB): ${serverStats.withRam}`);
    ns.tprint(`  📭 Sans RAM (= 0 GB): ${serverStats.withoutRam}`);
    ns.tprint(`  ⚙️  Avec processus actifs: ${serverStats.withProcesses}`);
    ns.tprint(`  📪 Vides (sans processus): ${serverStats.empty}`);
    ns.tprint("");
    
    ns.tprint("💾 RAM GLOBALE:");
    ns.tprint("─".repeat(60));
    ns.tprint(`  📊 Total: ${ns.formatRam(ramStats.total)}`);
    ns.tprint(`  ⚙️  Utilisée: ${ns.formatRam(ramStats.used)} (${((ramStats.used/ramStats.total)*100).toFixed(1)}%)`);
    ns.tprint(`  💚 Libre: ${ns.formatRam(ramStats.free)} (${((ramStats.free/ramStats.total)*100).toFixed(1)}%)`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 ANALYSE DES SERVEURS UTILISABLES MAIS NON UTILISÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("🔍 SERVEURS UTILISABLES MAIS VIDES:");
    ns.tprint("─".repeat(60));
    
    const usableButEmpty = [];
    
    for (const server of allServers) {
        const hasRoot = ns.hasRootAccess(server);
        const maxRam = ns.getServerMaxRam(server);
        const processes = ns.ps(server);
        
        // Serveur utilisable = root + RAM > 0
        if (hasRoot && maxRam > 0 && processes.length === 0) {
            usableButEmpty.push({
                name: server,
                ram: maxRam
            });
        }
    }
    
    // Trier par RAM décroissante
    usableButEmpty.sort((a, b) => b.ram - a.ram);
    
    ns.tprint(`  📊 Total serveurs UTILISABLES mais VIDES: ${usableButEmpty.length}`);
    ns.tprint("");
    
    if (usableButEmpty.length > 0) {
        ns.tprint("  🎯 TOP 20 serveurs avec le plus de RAM libre:");
        const top20 = usableButEmpty.slice(0, 20);
        
        for (const server of top20) {
            const category = 
                server.name.startsWith("nexus-node") ? "💻 Acheté" :
                server.name.startsWith("hacknet-node") ? "🔗 Hacknet" :
                server.name === "home" ? "🏠 Home" :
                "🌐 Jeu";
            
            ns.tprint(`     ${category} | ${server.name.padEnd(20)} | ${ns.formatRam(server.ram)}`);
        }
    }
    
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💡 ANALYSE ET RECOMMANDATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("💡 ANALYSE ET RECOMMANDATIONS");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    const percentUsed = (serverStats.withProcesses / serverStats.withRam) * 100;
    
    if (percentUsed < 30) {
        ns.tprint("⚠️  PROBLÈME CRITIQUE DÉTECTÉ:");
        ns.tprint(`  Seulement ${percentUsed.toFixed(1)}% des serveurs avec RAM sont utilisés !`);
        ns.tprint("");
        ns.tprint("🔍 CAUSES POSSIBLES:");
        ns.tprint("  1. Le RamManager ne retourne que les serveurs nexus-node");
        ns.tprint("  2. Le Batcher filtre les serveurs (configuration)");
        ns.tprint("  3. Les serveurs du jeu ne sont pas dans la liste");
        ns.tprint("");
        ns.tprint("💡 SOLUTION:");
        ns.tprint("  Vérifiez la configuration dans lib/constants.js");
        ns.tprint("  Cherchez: USE_PURCHASED_SERVERS_ONLY ou similar");
        ns.tprint("  Le RamManager devrait utiliser TOUS les serveurs rootés avec RAM");
    } else if (percentUsed < 70) {
        ns.tprint("⚠️  Utilisation sous-optimale:");
        ns.tprint(`  ${percentUsed.toFixed(1)}% des serveurs sont utilisés`);
        ns.tprint(`  ${ramStats.free.toFixed(0)} GB de RAM gaspillée !`);
    } else {
        ns.tprint("✅ Utilisation correcte du réseau");
        ns.tprint(`  ${percentUsed.toFixed(1)}% des serveurs utilisés`);
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
