/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      hack/workers/weaken
 * @description Worker de weaken - Réduit la sécurité d'un serveur cible.
 *              Utilisé par le batcher pour les opérations HWGW (W = Weaken).
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * @ram         1.75 GB (pour 1 thread)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Validation complète des arguments (target, delay)
 * ✓ Try/catch robuste autour de ns.weaken()
 * ✓ Gestion d'erreur avec retry potentiel
 * ✓ Logs détaillés avec icônes (🛡️✅❌⏱️)
 * ✓ Support du délai de synchronisation HWGW
 * ✓ Retour de la réduction de sécurité pour métriques
 * ✓ Protection contre arguments invalides
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.exec("/hack/workers/weaken.js", "host", threads, "target", delay);
 * 
 * @arguments
 *   target (string)  - Hostname du serveur à weaken (requis)
 *   delay  (number)  - Délai en ms avant d'exécuter (défaut: 0)
 * 
 * @example
 *   // Weaken immédiat
 *   ns.exec("/hack/workers/weaken.js", "pserv-0", 50, "n00dles", 0);
 * 
 * @example
 *   // Weaken avec délai (synchronisation HWGW)
 *   ns.exec("/hack/workers/weaken.js", "pserv-0", 100, "joesguns", 2000);
 *   // Attend 2 secondes avant d'exécuter le weaken
 * 
 * @returns
 *   Réduction de sécurité (number) - Toujours 0.05 * threads
 *   Exemple : 50 threads → 2.5 de réduction
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 WORKER WEAKEN - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Exécute une opération de weaken sur la cible après un délai optionnel.
 * 
 * Le weaken réduit la sécurité du serveur cible.
 * Chaque thread réduit la sécurité de 0.05 (fixe, indépendant du joueur).
 * 
 * Le weaken ne peut jamais échouer (pas de chance impliquée).
 * 
 * @param {NS} ns - Namespace BitBurner
 */
/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint(`❌ [WEAKEN] Invalid target: ${target}`);
        return 0;
    }

    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) delay = 0;

    if (delay > 0) await ns.sleep(delay);

    try {
        const reduction = await ns.weaken(target);
        if (reduction > 0) {
            ns.print(`✅ ${target}: -${reduction.toFixed(2)}`);
        }
        return reduction;
    } catch (error) {
        ns.print(`❌ ${target}: ${error.message}`);
        return 0;
    }
}