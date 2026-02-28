/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      boot
 * @description Boot Sequence - Point d'entrée principal de l'architecture Nexus.
 *              Séquence d'initialisation complète du système PROMETHEUS.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Utilisation de Network.js pour scan unifié (évite duplication de code)
 * ✓ Try/catch robuste sur ns.run() avec logs d'erreur détaillés
 * ✓ Détection intelligente des modules manquants avec suggestions
 * ✓ Messages de progression color-coded pour meilleure lisibilité
 * ✓ Protection contre l'auto-suicide pendant le nettoyage
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   run boot.js
 * 
 * @example
 *   // Redémarrage après un crash système
 *   run global-kill.js
 *   await ns.asleep(2000)
 *   run boot.js
 */

import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : AFFICHAGE DU BANNER DE DÉMARRAGE
    // ═══════════════════════════════════════════════════════════════════════════
    ns.tprint("╔══════════════════════════════════════════════════════════════════╗");
    ns.tprint("║                                                                  ║");
    ns.tprint("║   🔥 PROMETHEUS v45.0 - BOOT SEQUENCE INITIATED                  ║");
    ns.tprint("║   'Stealing Fire From The Gods'                                  ║");
    ns.tprint("║                                                                  ║");
    ns.tprint("╚══════════════════════════════════════════════════════════════════╝");
    ns.tprint("");

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : NETTOYAGE DES PORTS DE COMMUNICATION
    // ═══════════════════════════════════════════════════════════════════════════
    ns.tprint("[CLEAN] 🧹 Réinitialisation des ports de communication Nexus...");
    
    for (let i = 1; i <= 20; i++) {
        try {
            ns.clearPort(i);
        } catch (e) {
            ns.tprint(`  ⚠️  Avertissement : Impossible de nettoyer le port ${i}`);
        }
    }
    
    ns.tprint("  ✅ Ports 1-20 réinitialisés avec succès.");
    ns.tprint("");

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 3 : SCAN COMPLET DU RÉSEAU
    // ═══════════════════════════════════════════════════════════════════════════
    ns.tprint("[SCAN] 🔍 Cartographie du réseau en cours...");
    
    let allNodes = [];
    
    // 🔥 PROMETHEUS ENHANCEMENT : Utilisation de Network.js si disponible
    if (ns.fileExists("/lib/network.js") && ns.fileExists("/lib/capabilities.js")) {
        try {
            const caps = new Capabilities(ns);
            const net = new Network(ns, caps);
            allNodes = net.refresh();
            ns.tprint(`  ✅ Scan unifié (Network.js) : ${allNodes.length} nœuds détectés.`);
        } catch (e) {
            ns.tprint(`  ⚠️  Erreur lors de l'utilisation de Network.js : ${e}`);
            allNodes = fallbackScan(ns);
        }
    } else {
        // Fallback : Scan manuel si Network.js n'est pas disponible
        allNodes = fallbackScan(ns);
        ns.tprint(`  ⚠️  Network.js indisponible - Scan manuel : ${allNodes.length} nœuds détectés.`);
    }
    
    ns.tprint("");

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 4 : ARRÊT DE TOUS LES PROCESSUS RÉSEAU
    // ═══════════════════════════════════════════════════════════════════════════
    ns.tprint("[KILL] 🛑 Arrêt de tous les processus sur le réseau...");
    
    const currentScript = ns.getScriptName();
    let killedCount = 0;
    let errorCount = 0;

    for (const node of allNodes) {
        try {
            const processes = ns.ps(node);
            
            for (const p of processes) {
                // 🔥 PROTECTION : Ne jamais se suicider en plein vol
                if (node === "home" && p.filename === currentScript) {
                    continue;
                }
                
                // Tentative de kill propre avec gestion d'erreur
                try {
                    if (ns.kill(p.pid, node)) {
                        killedCount++;
                    }
                } catch (killError) {
                    errorCount++;
                }
            }
        } catch (e) {
            ns.tprint(`  ⚠️  Erreur lors du scan de ${node} : ${e}`);
            errorCount++;
        }
    }
    
    ns.tprint(`  ✅ ${killedCount} processus arrêtés avec succès.`);
    if (errorCount > 0) {
        ns.tprint(`  ⚠️  ${errorCount} erreurs détectées (non bloquant).`);
    }
    ns.tprint("");

    // Pause pour laisser le temps aux processus de se terminer proprement
    await ns.asleep(1000);

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 5 : LANCEMENT DU KERNEL ORCHESTRATOR
    // ═══════════════════════════════════════════════════════════════════════════
    ns.tprint("[BOOT] 🚀 Initialisation du Kernel Orchestrator...");
    
    const orchestratorPath = "/core/orchestrator.js";
    
    if (!ns.fileExists(orchestratorPath)) {
        ns.tprint("╔══════════════════════════════════════════════════════════════════╗");
        ns.tprint("║                                                                  ║");
        ns.tprint("║   ❌ ERREUR CRITIQUE : orchestrator.js INTROUVABLE               ║");
        ns.tprint("║                                                                  ║");
        ns.tprint("║   Le fichier /core/orchestrator.js est requis pour démarrer     ║");
        ns.tprint("║   le système PROMETHEUS.                                         ║");
        ns.tprint("║                                                                  ║");
        ns.tprint("║   🔧 SOLUTIONS POSSIBLES :                                       ║");
        ns.tprint("║   1. Vérifiez que tous les fichiers sont uploadés               ║");
        ns.tprint("║   2. Exécutez : run nexus-update.js --core                      ║");
        ns.tprint("║   3. Téléchargez manuellement depuis le dépôt GitHub            ║");
        ns.tprint("║                                                                  ║");
        ns.tprint("╚══════════════════════════════════════════════════════════════════╝");
        return;
    }

    // Tentative de lancement avec gestion d'erreur robuste
    try {
        const pid = ns.run(orchestratorPath, 1);
        
        if (pid === 0) {
            // Échec du lancement (RAM insuffisante ou autre erreur)
            ns.tprint("╔══════════════════════════════════════════════════════════════════╗");
            ns.tprint("║                                                                  ║");
            ns.tprint("║   ❌ ERREUR : Impossible de lancer orchestrator.js               ║");
            ns.tprint("║                                                                  ║");
            ns.tprint("║   Causes possibles :                                             ║");
            ns.tprint("║   • RAM insuffisante sur 'home'                                  ║");
            ns.tprint("║   • Fichier corrompu ou invalide                                 ║");
            ns.tprint("║   • Dépendances manquantes                                       ║");
            ns.tprint("║                                                                  ║");
            ns.tprint("║   🔧 Vérifiez ns.getServerMaxRam('home') et libérez de la RAM.  ║");
            ns.tprint("║                                                                  ║");
            ns.tprint("╚══════════════════════════════════════════════════════════════════╝");
            return;
        }
        
        // Succès du lancement
        ns.tprint("  ✅ Kernel Orchestrator lancé avec succès (PID: " + pid + ")");
        ns.tprint("");
        
    } catch (e) {
        ns.tprint("╔══════════════════════════════════════════════════════════════════╗");
        ns.tprint("║                                                                  ║");
        ns.tprint("║   ❌ EXCEPTION LORS DU LANCEMENT                                 ║");
        ns.tprint("║                                                                  ║");
        ns.tprint(`║   Erreur : ${String(e).substring(0, 50).padEnd(50)}║`);
        ns.tprint("║                                                                  ║");
        ns.tprint("╚══════════════════════════════════════════════════════════════════╝");
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 6 : CONFIRMATION DE SUCCÈS
    // ═══════════════════════════════════════════════════════════════════════════
    ns.tprint("╔══════════════════════════════════════════════════════════════════╗");
    ns.tprint("║                                                                  ║");
    ns.tprint("║   ✅ PROMETHEUS v45.0 - BOOT SEQUENCE COMPLETE                   ║");
    ns.tprint("║                                                                  ║");
    ns.tprint("║   Le Kernel Orchestrator est maintenant en ligne.                ║");
    ns.tprint("║   Tous les modules vont démarrer automatiquement.                ║");
    ns.tprint("║                                                                  ║");
    ns.tprint("║   🔥 Fire stolen. Gods enraged. System operational.              ║");
    ns.tprint("║                                                                  ║");
    ns.tprint("╚══════════════════════════════════════════════════════════════════╝");
}

/**
 * Fonction de scan manuel du réseau (fallback si Network.js indisponible)
 * Utilise un BFS (Breadth-First Search) pour explorer tout le réseau
 * 
 * @param {NS} ns - Namespace Netscript
 * @returns {string[]} Liste de tous les nœuds détectés
 */
function fallbackScan(ns) {
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const node = queue.shift();
        
        if (!visited.has(node)) {
            visited.add(node);
            
            try {
                const neighbors = ns.scan(node);
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            } catch (e) {
                // Nœud inaccessible, on continue
                continue;
            }
        }
    }
    
    return Array.from(visited);
}