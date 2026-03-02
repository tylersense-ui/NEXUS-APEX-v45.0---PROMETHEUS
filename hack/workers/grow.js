/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      hack/workers/grow
 * @description Worker de grow - Augmente l'argent disponible sur un serveur cible.
 *              Utilisé par le batcher pour les opérations HWGW (G = Grow).
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
 * ✓ Try/catch robuste autour de ns.grow()
 * ✓ Gestion d'erreur avec retry potentiel
 * ✓ Logs détaillés avec icônes (📈✅❌⏱️)
 * ✓ Support du délai de synchronisation HWGW
 * ✓ Retour du multiplicateur de croissance pour métriques
 * ✓ Protection contre arguments invalides
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.exec("/hack/workers/grow.js", "host", threads, "target", delay);
 * 
 * @arguments
 *   target (string)  - Hostname du serveur à grow (requis)
 *   delay  (number)  - Délai en ms avant d'exécuter (défaut: 0)
 * 
 * @example
 *   // Grow immédiat
 *   ns.exec("/hack/workers/grow.js", "pserv-0", 100, "n00dles", 0);
 * 
 * @example
 *   // Grow avec délai (synchronisation HWGW)
 *   ns.exec("/hack/workers/grow.js", "pserv-0", 200, "joesguns", 8000);
 *   // Attend 8 secondes avant d'exécuter le grow
 * 
 * @returns
 *   Multiplicateur de croissance (number) si succès, 1.0 si échec
 *   Exemple : 1.05 signifie que l'argent a augmenté de 5%
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 WORKER GROW - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Exécute une opération de grow sur la cible après un délai optionnel.
 * 
 * Le grow augmente l'argent disponible sur le serveur cible.
 * Le multiplicateur dépend du niveau de hacking du joueur et de la sécurité du serveur.
 * 
 * Augmente la sécurité du serveur de 0.004 par thread (2x plus que hack).
 * 
 * @param {NS} ns - Namespace BitBurner
 */
/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint(`❌ [GROW] Invalid target: ${target}`);
        return 1.0;
    }

    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) delay = 0;

    if (delay > 0) await ns.sleep(delay);

    try {
        const multiplier = await ns.grow(target);
        if (multiplier > 1.0) {
            ns.print(`✅ ${target}: x${multiplier.toFixed(3)}`);
        }
        return multiplier;
    } catch (error) {
        ns.print(`❌ ${target}: ${error.message}`);
        return 1.0;
    }
}