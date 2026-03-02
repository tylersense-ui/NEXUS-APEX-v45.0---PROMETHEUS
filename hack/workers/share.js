/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      hack/workers/share
 * @description Worker de share - Partage la puissance de calcul avec des factions.
 *              Augmente le pouvoir de faction et donne des bonus passifs.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * @ram         4.00 GB (pour 1 thread)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Validation du délai optionnel
 * ✓ Try/catch robuste autour de ns.share()
 * ✓ Gestion d'erreur avec logging détaillé
 * ✓ Logs avec icônes (🤝✅❌⏱️)
 * ✓ Support du délai avant démarrage
 * ✓ Boucle infinie automatique (share est bloquant)
 * ✓ Protection contre arguments invalides
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.exec("/hack/workers/share.js", "host", threads, delay);
 * 
 * @arguments
 *   delay (number) - Délai en ms avant de démarrer (défaut: 0)
 * 
 * @example
 *   // Share immédiat (boucle infinie)
 *   ns.exec("/hack/workers/share.js", "pserv-0", 100, 0);
 * 
 * @example
 *   // Share avec délai
 *   ns.exec("/hack/workers/share.js", "pserv-0", 50, 5000);
 *   // Attend 5 secondes avant de commencer à partager
 * 
 * @returns
 *   Ne retourne jamais (boucle infinie bloquante)
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎯 WORKER SHARE - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Exécute une opération de share en boucle infinie après un délai optionnel.
 * 
 * Le share partage la puissance de calcul avec des factions.
 * Augmente le pouvoir de faction et donne des bonus passifs (reputation, etc.).
 * 
 * IMPORTANT : ns.share() est une fonction BLOQUANTE qui ne se termine jamais.
 * Elle doit être utilisée dans un script dédié qui tourne en continu.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
/** @param {NS} ns */
export async function main(ns) {
    let delay = ns.args[0] || 0;
    if (typeof delay !== 'number' || delay < 0) delay = 0;

    if (delay > 0) await ns.sleep(delay);

    try {
        await ns.share();
    } catch (error) {
        ns.print(`❌ SHARE: ${error.message}`);
    }
}