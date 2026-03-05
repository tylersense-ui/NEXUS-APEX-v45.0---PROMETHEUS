/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.6 - "ULTIMATE - DRAIN & SALT PATCH"
 * 
 * @module      hack/workers/weaken
 * @description Worker de weaken avec UUID salt support et logging détaillé
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
        ns.print("❌ WEAKEN ERROR: Target invalide ou manquant");
        ns.print(`   → Reçu: ${JSON.stringify(target)}`);
        return 0;
    }

    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  WEAKEN WARNING: Délai invalide (${delay}), utilisation de 0ms`);
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
    // 🛡️ EXÉCUTION DU WEAKEN
    // ═══════════════════════════════════════════════════════════════════════════════
    
    try {
        const securityReduction = await ns.weaken(target);
        
        if (securityReduction > 0) {
            ns.print(`✅ WEAKEN: -${securityReduction.toFixed(3)} sécurité sur ${target}`);
        } else {
            ns.print(`⚠️  WEAKEN: Aucune réduction de sécurité sur ${target} (déjà au min)`);
        }
        
        return securityReduction;
        
    } catch (error) {
        ns.print(`❌ WEAKEN ERROR: ${error.message}`);
        ns.print(`   → Target: ${target}`);
        ns.print(`   → Delay: ${delay}ms`);
        ns.print(`   → UUID: ${uuid.substring(0, 8)}...`);
        return 0;
    }
}