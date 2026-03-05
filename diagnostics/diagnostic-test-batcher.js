/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v47.3 - "TEST BATCHER"
 * 
 * @module      diagnostic-test-batcher.js
 * @description Test si le Batcher génère correctement des jobs et les écrit dans le port 4
 * @author      Claude (Anthropic)
 * @version     47.3
 * @date        2026-03-05
 * @license     MIT
 * 
 * @usage
 * run diagnostic-test-batcher.js
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🧪 TEST BATCHER - Génération de jobs");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    try {
        // Nettoyer le port 4 d'abord
        ns.clearPort(4);
        ns.print("🧹 Port 4 nettoyé");
        ns.print("");
        
        // Compter les messages initiaux (devrait être 0)
        const port4 = ns.getPortHandle(4);
        const initialCount = port4.data.length;
        
        ns.print(`📊 Messages dans le port 4 avant test: ${initialCount}`);
        ns.print("");
        
        // Attendre 10 secondes et vérifier si des jobs apparaissent
        ns.print("⏳ Attente de 10 secondes pour observer...");
        await ns.sleep(10000);
        
        const afterCount = port4.data.length;
        ns.print("");
        ns.print(`📊 Messages dans le port 4 après 10s: ${afterCount}`);
        ns.print("");
        
        if (afterCount > initialCount) {
            ns.print("✅ LE BATCHER GÉNÈRE DES JOBS !");
            ns.print("");
            ns.print(`  💡 ${afterCount - initialCount} jobs créés en 10 secondes`);
            ns.print("");
            
            // Lire quelques jobs pour analyse
            ns.print("📝 Échantillon des jobs générés:");
            for (let i = 0; i < Math.min(5, afterCount - initialCount); i++) {
                const msg = ns.readPort(4);
                try {
                    const job = JSON.parse(msg);
                    ns.print(`  ${i+1}. ${job.type} → ${job.target} (${job.threads}t) sur ${job.host || 'NON ASSIGNÉ'} [delay: ${job.delay}ms]`);
                } catch (e) {
                    ns.print(`  ${i+1}. Message invalide: ${msg}`);
                }
            }
            ns.print("");
            
            ns.print("🔍 DIAGNOSTIC:");
            ns.print("  ✅ Le Batcher fonctionne correctement");
            ns.print("  ⚠️  MAIS le Controller ne consomme pas assez vite !");
            ns.print("");
            ns.print("💡 SOLUTION:");
            ns.print("  → Le Controller doit drainer le port plus rapidement");
            ns.print("  → Vérifier le code du controller (boucle while de drainage)");
            ns.print("");
            
        } else {
            ns.print("❌ LE BATCHER NE GÉNÈRE PAS DE JOBS !");
            ns.print("");
            ns.print("🔍 CAUSES POSSIBLES:");
            ns.print("");
            ns.print("  1️⃣  L'orchestrator n'appelle pas executeBatch()");
            ns.print("     → Vérifier les logs: tail /core/orchestrator.js");
            ns.print("");
            ns.print("  2️⃣  Aucune cible valide trouvée");
            ns.print("     → Les serveurs sont peut-être déjà hackés au maximum");
            ns.print("     → Ou aucun serveur n'a assez d'argent");
            ns.print("");
            ns.print("  3️⃣  Le Batcher rencontre une erreur");
            ns.print("     → Vérifier les logs de l'orchestrator");
            ns.print("     → Erreur possible dans le calcul EV/s");
            ns.print("");
            ns.print("💡 ACTIONS:");
            ns.print("  1. tail /core/orchestrator.js");
            ns.print("  2. Vérifier qu'il y a des serveurs avec $$ > 0");
            ns.print("  3. Redémarrer: run global-kill.js && run boot.js");
            ns.print("");
        }
        
    } catch (error) {
        ns.print("❌ ERREUR LORS DU TEST:");
        ns.print(`  ${error.message}`);
        ns.print("");
    }
    
    ns.print("═══════════════════════════════════════════════════════════════");
}
