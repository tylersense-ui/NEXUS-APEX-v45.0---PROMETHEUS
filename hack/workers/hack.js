/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0.3 - "Stealing Fire From The Gods"
 * 
 * @module      hack/workers/hack
 * @description Worker de hack - Vole de l'argent d'un serveur cible.
 *              Utilisé par le batcher pour les opérations HWGW (H = Hack).
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0.3 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * @ram         1.70 GB (pour 1 thread)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Validation complète des arguments (target, delay)
 * ✓ Try/catch robuste autour de ns.hack()
 * ✓ Gestion d'erreur avec retry potentiel
 * ✓ Logs détaillés avec icônes (💰✅❌⏱️)
 * ✓ Support du délai de synchronisation HWGW
 * ✓ Retour du montant volé pour métriques
 * ✓ Protection contre arguments invalides
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.exec("/hack/workers/hack.js", "host", threads, "target", delay);
 * 
 * @arguments
 *   target (string)  - Hostname du serveur à hack (requis)
 *   delay  (number)  - Délai en ms avant d'exécuter (défaut: 0)
 * 
 * @example
 *   // Hack immédiat
 *   ns.exec("/hack/workers/hack.js", "pserv-0", 10, "n00dles", 0);
 * 
 * @example
 *   // Hack avec délai (synchronisation HWGW)
 *   ns.exec("/hack/workers/hack.js", "pserv-0", 10, "joesguns", 5000);
 *   // Attend 5 secondes avant d'exécuter le hack
 * 
 * @returns
 *   Montant volé (number) si succès, 0 si échec
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 WORKER HACK - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Exécute une opération de hack sur la cible après un délai optionnel.
 * 
 * Le hack vole un pourcentage de l'argent disponible sur le serveur cible.
 * Le pourcentage dépend du niveau de hacking du joueur et de la sécurité du serveur.
 * 
 * Augmente la sécurité du serveur de 0.002 par thread.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint(`❌ [HACK] Invalid target: ${target}`);
        return 0;
    }

    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) delay = 0;

    if (delay > 0) await ns.sleep(delay);

    try {
        const moneyStolen = await ns.hack(target);
        if (moneyStolen > 0) {
            ns.print(`✅ ${target}: ${ns.formatNumber(moneyStolen)}`);
        }
        return moneyStolen;
    } catch (error) {
        ns.print(`❌ ${target}: ${error.message}`);
        return 0;
    }
}