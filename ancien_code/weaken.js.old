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
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 VALIDATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Argument 1 : target (requis)
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint(`❌ [WEAKEN] Argument invalide: target doit être un string (reçu: ${target})`);
        return 0;
    }

    // Vérifier que le serveur cible existe
    let serverExists = false;
    try {
        ns.getServer(target);
        serverExists = true;
    } catch (e) {
        ns.tprint(`❌ [WEAKEN] Serveur cible introuvable: ${target}`);
        return 0;
    }

    // Argument 2 : delay (optionnel, défaut 0)
    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  [WEAKEN] Délai invalide (${delay}), utilisation de 0`);
        delay = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ DÉLAI DE SYNCHRONISATION (si spécifié)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) {
        await ns.sleep(delay);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🛡️ EXÉCUTION DU WEAKEN
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const startTime = Date.now();
    let securityReduction = 0;

    try {
        // ns.weaken() retourne la réduction de sécurité (toujours 0.05 * threads)
        securityReduction = await ns.weaken(target);
        
        const duration = Date.now() - startTime;
        
        // Le weaken réussit toujours (pas de chance d'échec)
        ns.print(`✅ [WEAKEN] ${target}: -${securityReduction.toFixed(3)} sécurité (${duration}ms)`);

    } catch (error) {
        // Erreur critique (serveur crashé, script killé, etc.)
        const duration = Date.now() - startTime;
        ns.tprint(`❌ [WEAKEN] Erreur critique sur ${target}: ${error.message} (${duration}ms)`);
        return 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RETOUR DU RÉSULTAT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // La réduction de sécurité est retournée pour permettre au batcher de tracker les métriques
    return securityReduction;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION TECHNIQUE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * OPÉRATION WEAKEN :
 * ------------------
 * - Réduit la sécurité du serveur cible
 * - Réduction fixe : 0.05 par thread (indépendant du joueur)
 * - Ne peut jamais échouer (100% de réussite garantie)
 * - N'affecte pas l'argent disponible
 * 
 * - Durée de l'opération :
 *   • ~4x plus longue que hack
 *   • La plus longue des 4 opérations HWGW
 *   • Typiquement entre 4s et 20min
 *   • Calculable précisément avec ns.formulas.hacking.weakenTime()
 * 
 * CALCUL DE LA RÉDUCTION :
 * -------------------------
 * Réduction totale = 0.05 * nombre de threads
 * 
 * Exemples :
 * - 1 thread   → -0.05 sécurité
 * - 10 threads → -0.50 sécurité
 * - 50 threads → -2.50 sécurité
 * - 100 threads → -5.00 sécurité
 * 
 * Cette valeur est TOUJOURS exacte et prévisible (pas de variation).
 * 
 * SÉCURITÉ DES SERVEURS :
 * -----------------------
 * Chaque serveur a une sécurité qui fluctue :
 * - minDifficulty : Sécurité minimale du serveur (ne peut pas descendre en dessous)
 * - hackDifficulty : Sécurité actuelle
 * 
 * Effets de la sécurité :
 * - Plus haute → hack vole moins d'argent
 * - Plus haute → grow augmente moins l'argent
 * - Plus haute → hack/grow prennent plus de temps
 * 
 * Augmentation de sécurité :
 * - Hack : +0.002 par thread
 * - Grow : +0.004 par thread
 * 
 * Réduction de sécurité :
 * - Weaken : -0.05 par thread (25x plus efficace que hack augmente)
 * 
 * UTILISATION DANS HWGW :
 * -----------------------
 * Le weaken est utilisé DEUX FOIS dans chaque batch HWGW :
 * 1. HACK   - Vole l'argent (augmente sécurité +0.002/thread)
 * 2. WEAKEN - Réduit sécurité (-0.05/thread) ← WEAKEN 1
 * 3. GROW   - Augmente l'argent (augmente sécurité +0.004/thread)
 * 4. WEAKEN - Réduit sécurité (-0.05/thread) ← WEAKEN 2
 * 
 * Timing critique : Les 4 opérations doivent se terminer dans le bon ordre.
 * Le weaken étant le plus long (~4x hack), il dicte le timing de tout le batch.
 * 
 * Ordre de fin souhaité :
 * H finit à T
 * W finit à T + 200ms       ← WEAKEN 1 (compense le hack)
 * G finit à T + 400ms
 * W finit à T + 600ms       ← WEAKEN 2 (compense le grow)
 * 
 * CALCUL DES THREADS WEAKEN :
 * ----------------------------
 * Pour compenser l'augmentation de sécurité causée par hack/grow :
 * 
 * Weaken après hack :
 *   threadsNeeded = Math.ceil((hackThreads * 0.002) / 0.05)
 *   Exemple : 100 threads hack → 100 * 0.002 / 0.05 = 4 threads weaken
 * 
 * Weaken après grow :
 *   threadsNeeded = Math.ceil((growThreads * 0.004) / 0.05)
 *   Exemple : 500 threads grow → 500 * 0.004 / 0.05 = 40 threads weaken
 * 
 * Note : Grow nécessite 2x plus de weaken que hack car il augmente
 * la sécurité 2x plus (+0.004 vs +0.002).
 * 
 * RÉDUCTION VERS minDifficulty :
 * -------------------------------
 * Si le serveur n'est pas à minDifficulty, le weaken peut être utilisé
 * pour le ramener à son niveau minimal.
 * 
 * Threads nécessaires pour atteindre minDifficulty :
 *   currentSecurity = ns.getServerSecurityLevel(target)
 *   minSecurity = ns.getServerMinSecurityLevel(target)
 *   securityToReduce = currentSecurity - minSecurity
 *   threadsNeeded = Math.ceil(securityToReduce / 0.05)
 * 
 * Exemple : Si sécurité actuelle = 25 et minDifficulty = 10
 *   → 15 de sécurité à réduire
 *   → 15 / 0.05 = 300 threads weaken nécessaires
 * 
 * ARGUMENTS DÉTAILLÉS :
 * ---------------------
 * target (string) :
 *   - Hostname du serveur à weaken
 *   - Doit exister et être accessible
 *   - Le joueur doit avoir root access (vérifié par ns.weaken)
 * 
 * delay (number, optionnel) :
 *   - Délai en millisecondes avant d'exécuter le weaken
 *   - Utilisé pour synchroniser les batchs HWGW
 *   - Défaut : 0 (exécution immédiate)
 *   - Exemple : delay = 2000 → attend 2s avant de weaken
 * 
 * CODES DE RETOUR :
 * -----------------
 * > 0 : Réduction de sécurité (toujours 0.05 * threads)
 * = 0 : Erreur (serveur introuvable ou erreur critique)
 * 
 * Le weaken ne peut jamais "échouer" dans le sens où il ne réduit pas
 * la sécurité. Si le serveur est déjà à minDifficulty, il tentera
 * quand même l'opération et retournera 0.05 * threads, même si
 * la sécurité ne peut pas descendre davantage.
 * 
 * EXEMPLES D'UTILISATION :
 * ------------------------
 * 
 * // Weaken simple
 * ns.exec("/hack/workers/weaken.js", "home", 1, "n00dles");
 * 
 * // Ramener un serveur à minDifficulty
 * const currentSec = ns.getServerSecurityLevel("joesguns");
 * const minSec = ns.getServerMinSecurityLevel("joesguns");
 * const threadsNeeded = Math.ceil((currentSec - minSec) / 0.05);
 * ns.exec("/hack/workers/weaken.js", "pserv-0", threadsNeeded, "joesguns");
 * 
 * // Weaken synchronisé (HWGW batch) - Weaken après hack
 * const weakenTime = ns.getWeakenTime("joesguns");
 * const hackTime = ns.getHackTime("joesguns");
 * const weaken1Delay = 0; // Weaken est le plus long, pas de délai
 * ns.exec("/hack/workers/weaken.js", "pserv-0", 10, "joesguns", weaken1Delay);
 * 
 * // Weaken synchronisé (HWGW batch) - Weaken après grow
 * const weaken2Delay = 400; // Finit 400ms après le premier weaken
 * ns.exec("/hack/workers/weaken.js", "pserv-1", 40, "joesguns", weaken2Delay);
 * 
 * PERFORMANCES :
 * --------------
 * RAM : 1.75 GB par thread (même que grow)
 * CPU : Faible (l'opération est gérée par le jeu)
 * Durée : ~4x plus longue que hack (la plus longue des 4)
 * 
 * PROMETHEUS OPTIMISATIONS :
 * --------------------------
 * ✓ Validation stricte des arguments (évite crashs)
 * ✓ Try/catch autour de ns.weaken() (gestion erreurs)
 * ✓ Logs détaillés avec réduction de sécurité
 * ✓ Support du délai pour synchronisation HWGW
 * ✓ Retour de la réduction pour métriques du batcher
 * 
 * DIFFÉRENCES AVEC HACK/GROW :
 * -----------------------------
 * - Durée : ~4x plus longue que hack, ~1.25x plus que grow
 * - RAM : 1.75 GB (même que grow, légèrement plus que hack)
 * - Effet : Réduit sécurité (vs vole/augmente argent)
 * - Fiabilité : 100% de succès (vs chance pour hack)
 * - Réduction : Fixe 0.05/thread (vs variable pour hack/grow)
 * - Retour : Réduction de sécurité (toujours prévisible)
 * 
 * TIPS POUR LE BATCHER :
 * ----------------------
 * 1. Le weaken dicte le timing du batch (opération la plus longue)
 * 2. Toujours calculer les threads weaken en fonction de hack/grow
 * 3. Weaken après grow nécessite 2x plus de threads que weaken après hack
 * 4. Ne pas oublier les 2 weaken dans chaque batch HWGW
 * 5. Synchroniser avec précision : weaken1 finit 200ms après hack
 * 6. Le weaken peut être utilisé seul pour préparer une cible (ramener à minDifficulty)
 * 
 * RATIO THREADS HWGW TYPIQUE :
 * ----------------------------
 * Exemple pour un batch avec hackPercent = 0.10 (10%) :
 * - Hack : 50 threads
 * - Weaken1 : 4 threads (compense hack : 50 * 0.002 / 0.05)
 * - Grow : 500 threads (ramène argent à 100% : dépend de hackPercent)
 * - Weaken2 : 40 threads (compense grow : 500 * 0.004 / 0.05)
 * 
 * Total : ~594 threads
 * Weaken représente ~7% des threads (44/594)
 * 
 * Le grow est l'opération la plus coûteuse en threads (84% dans cet exemple).
 */
