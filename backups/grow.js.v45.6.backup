/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.6 - "ULTIMATE - DRAIN & SALT PATCH"
 * 
 * @module      hack/workers/grow
 * @description Worker de grow avec UUID salt support et logging détaillé
 * @version     45.6 - PROMETHEUS ULTIMATE
 * @ram         1.75 GB (pour 1 thread)
 */

/** @param {NS} ns */
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📥 VALIDATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.print("❌ GROW ERROR: Target invalide ou manquant");
        ns.print(`   → Reçu: ${JSON.stringify(target)}`);
        return 1.0;
    }

    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  GROW WARNING: Délai invalide (${delay}), utilisation de 0ms`);
        delay = 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔥 CORRECTIF BUG 3 : ACCEPTATION DE L'UUID (SALT)
    // ═══════════════════════════════════════════════════════════════════════════════
    // L'UUID empêche les collisions lors du job splitting
    const uuid = ns.args[2] || "000";

    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ DÉLAI DE SYNCHRONISATION HWGW
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) await ns.sleep(delay);

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📈 EXÉCUTION DU GROW
    // ═══════════════════════════════════════════════════════════════════════════════
    
    try {
        const multiplier = await ns.grow(target);
        
        if (multiplier > 1.0) {
            const growthPercent = ((multiplier - 1.0) * 100).toFixed(2);
            ns.print(`✅ GROW: +${growthPercent}% d'argent sur ${target} (x${multiplier.toFixed(3)})`);
        } else {
            ns.print(`⚠️  GROW: Aucune croissance sur ${target} (déjà au max ou erreur)`);
        }
        
        return multiplier;
        
    } catch (error) {
        ns.print(`❌ GROW ERROR: ${error.message}`);
        ns.print(`   → Target: ${target}`);
        ns.print(`   → Delay: ${delay}ms`);
        ns.print(`   → UUID: ${uuid.substring(0, 8)}...`);
        return 1.0;
    }
}
