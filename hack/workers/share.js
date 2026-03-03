/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.6 - "ULTIMATE - DRAIN & SALT PATCH"
 * 
 * @module      hack/workers/share
 * @description Worker de share avec UUID salt support et logging détaillé
 * @version     45.6 - PROMETHEUS ULTIMATE
 * @ram         4.00 GB (pour 1 thread)
 */

/** @param {NS} ns */
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📥 VALIDATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    let delay = ns.args[0] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  SHARE WARNING: Délai invalide (${delay}), utilisation de 0ms`);
        delay = 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 CORRECTIF BUG 3 : ACCEPTATION DE L'UUID (SALT)
    // ═══════════════════════════════════════════════════════════════════════════════
    // L'UUID empêche les collisions lors du job splitting
    // NOTE: Pour share, UUID est en args[1] (pas de target)
    const uuid = ns.args[1] || "000";

    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ DÉLAI AVANT DÉMARRAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) {
        ns.print(`⏱️  SHARE: Attente de ${delay}ms avant démarrage...`);
        await ns.sleep(delay);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🤝 EXÉCUTION DU SHARE (BOUCLE INFINIE)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    try {
        ns.print(`✅ SHARE: Démarrage du partage de puissance (UUID: ${uuid.substring(0, 8)}...)`);
        ns.print(`🤝 SHARE: Boucle infinie activée - Contribution aux factions`);
        
        // ns.share() est bloquant et ne se termine jamais
        await ns.share();
        
    } catch (error) {
        ns.print(`❌ SHARE ERROR: ${error.message}`);
        ns.print(`   → Delay: ${delay}ms`);
        ns.print(`   → UUID: ${uuid.substring(0, 8)}...`);
    }
}