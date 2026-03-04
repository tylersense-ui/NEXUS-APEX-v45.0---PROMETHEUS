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
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 VALIDATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Argument 1 : target (requis)
    const target = ns.args[0];
    if (!target || typeof target !== 'string') {
        ns.tprint(`❌ [GROW] Argument invalide: target doit être un string (reçu: ${target})`);
        return 1.0;
    }

    // Vérifier que le serveur cible existe
    let serverExists = false;
    try {
        ns.getServer(target);
        serverExists = true;
    } catch (e) {
        ns.tprint(`❌ [GROW] Serveur cible introuvable: ${target}`);
        return 1.0;
    }

    // Argument 2 : delay (optionnel, défaut 0)
    let delay = ns.args[1] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  [GROW] Délai invalide (${delay}), utilisation de 0`);
        delay = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ DÉLAI DE SYNCHRONISATION (si spécifié)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) {
        await ns.sleep(delay);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📈 EXÉCUTION DU GROW
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const startTime = Date.now();
    let growthMultiplier = 1.0;

    try {
        // ns.grow() retourne le multiplicateur de croissance
        // Exemple : 1.05 = l'argent a augmenté de 5%
        growthMultiplier = await ns.grow(target);
        
        const duration = Date.now() - startTime;
        
        if (growthMultiplier > 1.0) {
            // Succès - L'argent a augmenté
            const percentGrowth = ((growthMultiplier - 1.0) * 100).toFixed(2);
            ns.print(`✅ [GROW] ${target}: +${percentGrowth}% (x${growthMultiplier.toFixed(3)}, ${duration}ms)`);
        } else {
            // Pas de croissance (serveur déjà au maximum ou erreur)
            ns.print(`⚠️  [GROW] ${target}: Aucune croissance (x${growthMultiplier.toFixed(3)}, ${duration}ms)`);
        }

    } catch (error) {
        // Erreur critique (serveur crashé, script killé, etc.)
        const duration = Date.now() - startTime;
        ns.tprint(`❌ [GROW] Erreur critique sur ${target}: ${error.message} (${duration}ms)`);
        return 1.0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RETOUR DU RÉSULTAT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Le multiplicateur est retourné pour permettre au batcher de tracker les métriques
    return growthMultiplier;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION TECHNIQUE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * OPÉRATION GROW :
 * ----------------
 * - Augmente l'argent disponible sur le serveur
 * - Le multiplicateur dépend de :
 *   • Niveau de hacking du joueur
 *   • Sécurité actuelle du serveur (plus haute = moins efficace)
 *   • Nombre de threads utilisés
 *   • Argent actuel vs argent maximum du serveur
 * 
 * - Augmente la sécurité du serveur de 0.004 par thread
 *   (2x plus que hack, d'où le besoin de 2x plus de weaken après grow)
 * 
 * - Durée de l'opération :
 *   • ~3.2x plus longue que hack
 *   • Typiquement entre 3s et 15min
 *   • Calculable précisément avec ns.formulas.hacking.growTime()
 * 
 * MULTIPLICATEUR DE CROISSANCE :
 * -------------------------------
 * - Valeur retournée par ns.grow()
 * - Exemple : 1.05 signifie +5% d'argent
 * - Exemple : 2.0 signifie doublement de l'argent
 * 
 * - Plus le serveur est proche de moneyMax, plus le multiplicateur est faible
 * - À moneyMax, grow ne fait rien (multiplicateur = 1.0)
 * 
 * - Calculable à l'avance avec ns.formulas.hacking.growPercent()
 * 
 * EFFICACITÉ DU GROW :
 * --------------------
 * L'efficacité diminue quand le serveur est proche de moneyMax.
 * 
 * Exemple avec n00dles (moneyMax = $1.75m) :
 * - À $0       : 1 thread grow → ~1.5x argent (très efficace)
 * - À $500k    : 1 thread grow → ~1.1x argent (efficace)
 * - À $1.5m    : 1 thread grow → ~1.01x argent (peu efficace)
 * - À $1.75m   : 1 thread grow → 1.0x argent (aucun effet)
 * 
 * D'où l'importance de calculer le nombre exact de threads nécessaires
 * pour atteindre moneyMax sans gaspillage.
 * 
 * UTILISATION DANS HWGW :
 * -----------------------
 * Le grow est la troisième opération du batch HWGW :
 * 1. HACK   - Vole l'argent (augmente sécurité +0.002/thread)
 * 2. WEAKEN - Réduit sécurité
 * 3. GROW   - Augmente l'argent (augmente sécurité +0.004/thread)
 * 4. WEAKEN - Réduit sécurité
 * 
 * Timing critique : Les 4 opérations doivent se terminer dans le bon ordre
 * avec un écart de ~200ms entre chaque.
 * 
 * Ordre de fin souhaité :
 * H finit à T
 * W finit à T + 200ms
 * G finit à T + 400ms
 * W finit à T + 600ms
 * 
 * CALCUL DU NOMBRE DE THREADS GROW :
 * -----------------------------------
 * Pour ramener un serveur de currentMoney à moneyMax :
 * 
 * Sans Formulas.exe (approximation) :
 *   threadsNeeded = Math.ceil(ns.growthAnalyze(target, moneyMax / currentMoney))
 * 
 * Avec Formulas.exe (précis) :
 *   multiplicateur = moneyMax / currentMoney
 *   threadsNeeded = calculé itérativement avec ns.formulas.hacking.growPercent()
 * 
 * ATTENTION : Le grow est affecté par la sécurité du serveur.
 * Il faut toujours calculer les threads en tenant compte de la sécurité
 * APRÈS le weaken qui le précède dans le batch.
 * 
 * ARGUMENTS DÉTAILLÉS :
 * ---------------------
 * target (string) :
 *   - Hostname du serveur à grow
 *   - Doit exister et être accessible
 *   - Le joueur doit avoir root access (vérifié par ns.grow)
 * 
 * delay (number, optionnel) :
 *   - Délai en millisecondes avant d'exécuter le grow
 *   - Utilisé pour synchroniser les batchs HWGW
 *   - Défaut : 0 (exécution immédiate)
 *   - Exemple : delay = 8000 → attend 8s avant de grow
 * 
 * CODES DE RETOUR :
 * -----------------
 * > 1.0 : Multiplicateur de croissance (succès, argent augmenté)
 * = 1.0 : Aucune croissance (serveur au max ou erreur)
 * 
 * En cas d'erreur critique (serveur introuvable, arguments invalides),
 * un message d'erreur est affiché et 1.0 est retourné.
 * 
 * EXEMPLES D'UTILISATION :
 * ------------------------
 * 
 * // Grow simple
 * ns.exec("/hack/workers/grow.js", "home", 1, "n00dles");
 * 
 * // Grow avec beaucoup de threads (ramener à moneyMax)
 * const threadsNeeded = Math.ceil(ns.growthAnalyze("joesguns", 2.0));
 * ns.exec("/hack/workers/grow.js", "pserv-0", threadsNeeded, "joesguns");
 * 
 * // Grow synchronisé (HWGW batch)
 * const growTime = ns.getGrowTime("joesguns");
 * const weakenTime = ns.getWeakenTime("joesguns");
 * const growDelay = weakenTime - growTime + 200; // Termine 200ms après weaken1
 * ns.exec("/hack/workers/grow.js", "pserv-0", 200, "joesguns", growDelay);
 * 
 * PERFORMANCES :
 * --------------
 * RAM : 1.75 GB par thread (légèrement plus que hack)
 * CPU : Faible (l'opération est gérée par le jeu)
 * Durée : ~3.2x plus longue que hack
 * 
 * PROMETHEUS OPTIMISATIONS :
 * --------------------------
 * ✓ Validation stricte des arguments (évite crashs)
 * ✓ Try/catch autour de ns.grow() (gestion erreurs)
 * ✓ Logs détaillés avec pourcentage de croissance
 * ✓ Support du délai pour synchronisation HWGW
 * ✓ Retour du multiplicateur pour métriques du batcher
 * 
 * DIFFÉRENCES AVEC HACK :
 * -----------------------
 * - Durée : ~3.2x plus longue
 * - RAM : 1.75 GB vs 1.70 GB (légèrement plus)
 * - Sécurité : +0.004/thread vs +0.002/thread (2x plus)
 * - Retour : multiplicateur vs montant volé
 * - Effet : augmente argent vs vole argent
 * 
 * TIPS POUR LE BATCHER :
 * ----------------------
 * 1. Toujours calculer les threads grow en fonction de l'argent actuel
 * 2. Prendre en compte la sécurité du serveur après weaken1
 * 3. Le grow est l'opération la plus coûteuse en threads (souvent 10-50x plus que hack)
 * 4. Ne pas grow un serveur déjà à moneyMax (gaspillage de RAM)
 * 5. Synchroniser avec précision : grow doit finir 200ms après weaken1
 */
