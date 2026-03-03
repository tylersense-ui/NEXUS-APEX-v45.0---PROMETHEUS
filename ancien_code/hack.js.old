/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      hack/workers/hack
 * @description Worker de hack - Vole de l'argent d'un serveur cible.
 *              Utilisé par le batcher pour les opérations HWGW (H = Hack).
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
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
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 VALIDATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Argument 1 : target (requis)
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint(`❌ [HACK] Argument invalide: target doit être un string (reçu: ${target})`);
        return 0;
    }

    // Vérifier que le serveur cible existe
    let serverExists = false;
    try {
        ns.getServer(target);
        serverExists = true;
    } catch (e) {
        ns.tprint(`❌ [HACK] Serveur cible introuvable: ${target}`);
        return 0;
    }

    // Argument 2 : delay (optionnel, défaut 0)
    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  [HACK] Délai invalide (${delay}), utilisation de 0`);
        delay = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ DÉLAI DE SYNCHRONISATION (si spécifié)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) {
        // Le délai est appliqué indépendamment de la disponibilité de Formulas.exe
        // Note: Le code original avait un bug (ns.getPlayer().has() n'existe pas)
        // et était inutile car les deux branches faisaient la même chose
        await ns.sleep(delay);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 💰 EXÉCUTION DU HACK
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const startTime = Date.now();
    let moneyStolen = 0;

    try {
        // ns.hack() retourne le montant volé (0 si échec)
        moneyStolen = await ns.hack(target);
        
        const duration = Date.now() - startTime;
        
        if (moneyStolen > 0) {
            // Succès
            ns.print(`✅ [HACK] ${target}: ${ns.formatNumber(moneyStolen)} volés (${duration}ms)`);
        } else {
            // Échec (chance ratée ou serveur vide)
            ns.print(`⚠️  [HACK] ${target}: Échec (0$ volé, ${duration}ms)`);
        }

    } catch (error) {
        // Erreur critique (serveur crashé, script killé, etc.)
        const duration = Date.now() - startTime;
        ns.tprint(`❌ [HACK] Erreur critique sur ${target}: ${error.message} (${duration}ms)`);
        return 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RETOUR DU RÉSULTAT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Le montant volé est retourné pour permettre au batcher de tracker les métriques
    return moneyStolen;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION TECHNIQUE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * OPÉRATION HACK :
 * ----------------
 * - Vole un pourcentage de l'argent disponible sur le serveur
 * - Pourcentage volé dépend de :
 *   • Niveau de hacking du joueur
 *   • Sécurité actuelle du serveur (plus haute = moins volé)
 *   • hackDifficulty du serveur
 * 
 * - Augmente la sécurité du serveur de 0.002 par thread
 * 
 * - Durée de l'opération :
 *   • Dépend du niveau de hacking et de la sécurité
 *   • Typiquement entre 1s et 5min
 *   • Calculable précisément avec ns.formulas.hacking.hackTime()
 * 
 * CHANCE DE SUCCÈS :
 * ------------------
 * - Dépend du niveau de hacking du joueur vs requiredHackingSkill du serveur
 * - Plus le niveau est élevé, plus la chance est grande
 * - Chance maximale : 100% (si niveau >> requis)
 * - Chance minimale : 0% (si niveau < requis)
 * - Calculable avec ns.formulas.hacking.hackChance()
 * 
 * UTILISATION DANS HWGW :
 * -----------------------
 * Le hack est la première opération du batch HWGW :
 * 1. HACK   - Vole l'argent (augmente sécurité)
 * 2. WEAKEN - Réduit sécurité
 * 3. GROW   - Augmente l'argent (augmente sécurité)
 * 4. WEAKEN - Réduit sécurité
 * 
 * Timing critique : Les 4 opérations doivent se terminer dans le bon ordre
 * avec un écart de ~200ms entre chaque pour éviter la désynchronisation.
 * 
 * ARGUMENTS DÉTAILLÉS :
 * ---------------------
 * target (string) :
 *   - Hostname du serveur à hack
 *   - Doit exister et être accessible
 *   - Le joueur doit avoir root access (vérifié par ns.hack)
 * 
 * delay (number, optionnel) :
 *   - Délai en millisecondes avant d'exécuter le hack
 *   - Utilisé pour synchroniser les batchs HWGW
 *   - Défaut : 0 (exécution immédiate)
 *   - Exemple : delay = 5000 → attend 5s avant de hacker
 * 
 * CODES DE RETOUR :
 * -----------------
 * > 0  : Montant volé en $ (succès)
 * = 0  : Échec du hack (chance ratée ou serveur vide)
 * 
 * En cas d'erreur critique (serveur introuvable, arguments invalides),
 * un message d'erreur est affiché et 0 est retourné.
 * 
 * EXEMPLES D'UTILISATION :
 * ------------------------
 * 
 * // Hack simple
 * ns.exec("/hack/workers/hack.js", "home", 1, "n00dles");
 * 
 * // Hack avec 100 threads
 * ns.exec("/hack/workers/hack.js", "pserv-0", 100, "joesguns");
 * 
 * // Hack synchronisé (HWGW batch)
 * const hackTime = ns.getHackTime("joesguns");
 * const weakenTime = ns.getWeakenTime("joesguns");
 * const hackDelay = weakenTime - hackTime - 200; // Termine 200ms avant weaken
 * ns.exec("/hack/workers/hack.js", "pserv-0", 50, "joesguns", hackDelay);
 * 
 * PERFORMANCES :
 * --------------
 * RAM : 1.70 GB par thread
 * CPU : Faible (l'opération est gérée par le jeu)
 * 
 * PROMETHEUS OPTIMISATIONS :
 * --------------------------
 * ✓ Validation stricte des arguments (évite crashs)
 * ✓ Try/catch autour de ns.hack() (gestion erreurs)
 * ✓ Logs détaillés pour debugging
 * ✓ Support du délai pour synchronisation HWGW
 * ✓ Retour du montant volé pour métriques du batcher
 */