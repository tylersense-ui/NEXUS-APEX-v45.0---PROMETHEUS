/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v47.3 - "ULTIMATE DEPLOYMENT FIX"
 * 
 * @module      hack/workers/weaken
 * @description Worker ultra-minimaliste pour opération WEAKEN avec UUID salt
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     47.3 - CRITICAL FIX
 * @date        2026-03-05
 * @license     MIT
 * @requires    BitBurner v2.8.1+
 * @ram         1.75 GB (1.60 base + 0.15 weaken)
 * 
 * @changelog
 * v47.3 - 2026-03-05 - CRITICAL FIX
 * - 🔥 UUID SALT: Accepte ns.args[2] (UUID unique)
 * - ✅ Permet job splitting sans collision de processus
 * - ✅ BitBurner accepte maintenant plusieurs instances identiques
 * 
 * v45.0 - 2025-01-XX
 * - Version initiale PROMETHEUS
 * - Worker minimaliste pour weaken
 * 
 * @description
 * Worker ultra-simple qui:
 * 1. Récupère target et delay depuis arguments
 * 2. Attend le moment exact (delay)
 * 3. Exécute ns.weaken()
 * 4. Retourne la réduction de sécurité
 * 
 * Le 3ème argument (UUID) est CRITIQUE pour éviter les collisions.
 * BitBurner refuse de lancer 2× le même script avec les mêmes args.
 * L'UUID rend chaque processus unique même si target + delay identiques.
 * 
 * Philosophie "Dumb Worker":
 * - Le Controller fait TOUS les calculs
 * - Le Worker reçoit des ordres absolus
 * - Aucune logique métier ici
 * - RAM minimale (1.75 GB)
 * 
 * @param {NS} ns - Netscript API
 * @param {string} ns.args[0] - Target server (ex: "n00dles")
 * @param {number} ns.args[1] - Delay avant weaken en ms (ex: 0)
 * @param {string} ns.args[2] - UUID salt pour unicité (ex: "a3f8d9e2-...")
 * 
 * @returns {Promise<number>} Réduction de sécurité
 * 
 * @example
 * // Lancé par le Controller
 * ns.exec("/hack/workers/weaken.js", "nexus-node-0", 400, "n00dles", 0, "uuid-789");
 * 
 * @see /hack/controller.js - Dispatcher qui lance ce worker
 * @see /core/batcher.js - Calcule target et delay
 */

/**
 * Point d'entrée principal du worker
 * @param {NS} ns - Netscript API
 * @returns {Promise<number>} Réduction de sécurité
 */
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════
    // RÉCUPÉRATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const target = ns.args[0];
    const delay = ns.args[1] || 0;
    const uuid = ns.args[2] || "000";  // 🔥 v47.3 FIX: UUID salt
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ATTENTE (si delay > 0)
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) {
        await ns.sleep(delay);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EXÉCUTION WEAKEN
    // ═══════════════════════════════════════════════════════════════════════════
    
    return await ns.weaken(target);
}
