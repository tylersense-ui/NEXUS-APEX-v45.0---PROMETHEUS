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
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 VALIDATION DES ARGUMENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Argument 1 : delay (optionnel, défaut 0)
    let delay = ns.args[0] || 0;
    if (typeof delay !== 'number' || delay < 0) {
        ns.print(`⚠️  [SHARE] Délai invalide (${delay}), utilisation de 0`);
        delay = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ⏱️ DÉLAI AVANT DÉMARRAGE (si spécifié)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (delay > 0) {
        ns.print(`⏱️  [SHARE] Attente de ${delay}ms avant démarrage...`);
        await ns.sleep(delay);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🤝 EXÉCUTION DU SHARE (BOUCLE INFINIE)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`✅ [SHARE] Démarrage du partage en continu...`);
    
    try {
        // ns.share() est une fonction BLOQUANTE qui ne se termine jamais
        // Elle boucle automatiquement en interne
        await ns.share();
        
        // Cette ligne ne devrait jamais être atteinte
        ns.print(`⚠️  [SHARE] ns.share() s'est terminé (comportement inattendu)`);
        
    } catch (error) {
        // Erreur critique (script killé, etc.)
        ns.tprint(`❌ [SHARE] Erreur critique: ${error.message}`);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION TECHNIQUE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * OPÉRATION SHARE :
 * -----------------
 * - Partage la puissance de calcul avec des factions
 * - Augmente le pouvoir de faction du joueur
 * - Donne des bonus passifs (reputation, etc.)
 * - Utilise la RAM disponible pour des calculs distribués
 * 
 * FONCTIONNEMENT :
 * ----------------
 * ns.share() est une fonction BLOQUANTE qui :
 * - Ne se termine jamais (boucle infinie interne)
 * - Utilise 4.00 GB de RAM par thread
 * - N'a pas besoin de cible (contrairement à hack/grow/weaken)
 * - Doit tourner en continu pour avoir un effet
 * 
 * Le script continue à s'exécuter jusqu'à ce qu'il soit killé manuellement
 * ou que le serveur soit redémarré.
 * 
 * COÛT ET BÉNÉFICES :
 * -------------------
 * RAM : 4.00 GB par thread (plus cher que hack/grow/weaken)
 * 
 * Bénéfices :
 * - Augmente le pouvoir de faction
 * - Bonus de reputation pour certaines factions
 * - Utile quand on a de la RAM disponible mais pas de cibles intéressantes
 * - Peut être stoppé/redémarré à tout moment sans perte
 * 
 * Les bénéfices sont proportionnels au nombre de threads utilisés.
 * Plus de threads = plus de pouvoir de faction.
 * 
 * QUAND UTILISER SHARE :
 * ----------------------
 * Utiliser share() quand :
 * - Vous avez de la RAM inutilisée
 * - Pas de cibles intéressantes à hacker
 * - Vous voulez augmenter votre pouvoir de faction
 * - En early game quand les serveurs ont peu d'argent
 * 
 * NE PAS utiliser share() si :
 * - Vous avez des cibles rentables à hacker (hack/grow/weaken est plus profitable)
 * - Votre RAM est limitée (share coûte 4 GB/thread)
 * - Vous n'êtes pas intéressé par les factions
 * 
 * DIFFÉRENCE AVEC HACK/GROW/WEAKEN :
 * -----------------------------------
 * Share est fondamentalement différent :
 * - Pas de cible (pas d'argument target)
 * - Boucle infinie (jamais terminé)
 * - Plus cher en RAM (4 GB vs ~1.7 GB)
 * - Pas de retour (void)
 * - Bénéfice passif et continu
 * - Utile pour factions, pas pour argent
 * 
 * UTILISATION DANS LE SYSTÈME :
 * ------------------------------
 * Le share n'est PAS utilisé dans les batchs HWGW.
 * C'est un script séparé qui tourne en parallèle.
 * 
 * Stratégie typique :
 * 1. Calculer la RAM nécessaire pour les batchs HWGW
 * 2. Utiliser le reste de la RAM pour share()
 * 3. Ajuster dynamiquement selon les besoins
 * 
 * Exemple :
 *   totalRam = 1000 GB
 *   ramForBatches = 800 GB (hack/grow/weaken)
 *   ramForShare = 200 GB
 *   threadsShare = Math.floor(200 / 4) = 50 threads
 * 
 * GESTION DYNAMIQUE :
 * -------------------
 * Le share peut être stoppé et redémarré à tout moment :
 * 
 * // Stopper tous les share
 * ns.killall("pserv-0", "/hack/workers/share.js");
 * 
 * // Redémarrer avec nouvelle allocation
 * ns.exec("/hack/workers/share.js", "pserv-0", newThreads);
 * 
 * Cette flexibilité permet d'ajuster l'allocation de RAM
 * en fonction des besoins changeants du système.
 * 
 * ARGUMENTS DÉTAILLÉS :
 * ---------------------
 * delay (number, optionnel) :
 *   - Délai en millisecondes avant de commencer à partager
 *   - Utile pour synchroniser le démarrage avec d'autres scripts
 *   - Défaut : 0 (démarrage immédiat)
 *   - Exemple : delay = 5000 → attend 5s avant de partager
 * 
 * CODES DE RETOUR :
 * -----------------
 * Le share ne retourne jamais normalement.
 * Il continue jusqu'à être killé manuellement.
 * 
 * Si le script se termine, c'est une anomalie (error ou comportement inattendu).
 * 
 * EXEMPLES D'UTILISATION :
 * ------------------------
 * 
 * // Share simple (démarrage immédiat)
 * ns.exec("/hack/workers/share.js", "pserv-0", 50);
 * 
 * // Share avec délai (synchronisation)
 * ns.exec("/hack/workers/share.js", "pserv-0", 100, 5000);
 * 
 * // Calculer threads disponibles pour share
 * const totalRam = ns.getServerMaxRam("pserv-0");
 * const usedRam = ns.getServerUsedRam("pserv-0");
 * const freeRam = totalRam - usedRam;
 * const threadsShare = Math.floor(freeRam / 4.0);
 * if (threadsShare > 0) {
 *     ns.exec("/hack/workers/share.js", "pserv-0", threadsShare);
 * }
 * 
 * // Stopper le share pour libérer de la RAM
 * ns.kill("/hack/workers/share.js", "pserv-0");
 * 
 * PERFORMANCES :
 * --------------
 * RAM : 4.00 GB par thread (le plus cher des 4 workers)
 * CPU : Faible (opération gérée par le jeu)
 * Durée : Infinie (jusqu'à kill manuel)
 * 
 * PROMETHEUS OPTIMISATIONS :
 * --------------------------
 * ✓ Validation du délai (évite valeurs invalides)
 * ✓ Try/catch autour de ns.share() (gestion erreurs)
 * ✓ Logs clairs pour monitoring
 * ✓ Support du délai pour synchronisation
 * ✓ Documentation exhaustive pour usage correct
 * 
 * COMPARAISON RAM WORKERS :
 * -------------------------
 * Hack   : 1.70 GB/thread
 * Grow   : 1.75 GB/thread
 * Weaken : 1.75 GB/thread
 * Share  : 4.00 GB/thread ← Le plus cher (2.3x plus que hack)
 * 
 * D'où l'importance d'utiliser share uniquement sur la RAM excédentaire.
 * 
 * TIPS POUR LE SYSTÈME :
 * ----------------------
 * 1. Share est optionnel, pas critique
 * 2. Utiliser share uniquement sur RAM inutilisée
 * 3. Monitorer l'allocation de RAM dynamiquement
 * 4. Stopper share en priorité si besoin de RAM pour batchs
 * 5. Share peut tourner en parallèle des batchs HWGW
 * 6. Pas besoin de synchronisation avec HWGW (indépendant)
 * 
 * RATIO RAM SYSTÈME TYPIQUE :
 * ----------------------------
 * En mid/late game :
 * - HWGW (hack/grow/weaken) : 80-90% de la RAM totale
 * - Share : 10-20% de la RAM totale (sur excédent)
 * 
 * En early game (peu de cibles rentables) :
 * - HWGW : 30-50% de la RAM
 * - Share : 50-70% de la RAM (plus utilisé)
 * 
 * INTÉGRATION AVEC ORCHESTRATOR :
 * --------------------------------
 * L'orchestrator peut gérer le share dynamiquement :
 * 1. Calculer RAM nécessaire pour batchs
 * 2. Allouer le reste à share
 * 3. Ajuster périodiquement (ex: toutes les 60s)
 * 4. Stopper share si besoin urgent de RAM
 * 
 * Pseudo-code :
 *   ramForBatches = calculateBatchesRamNeeded()
 *   ramAvailable = getTotalRam() - ramForBatches
 *   threadsShare = floor(ramAvailable / 4.0)
 *   
 *   if (threadsShare > currentShareThreads) {
 *       // Augmenter share
 *       launchMoreShare(threadsShare - currentShareThreads)
 *   } else if (threadsShare < currentShareThreads) {
 *       // Réduire share (kill scripts)
 *       killSomeShare(currentShareThreads - threadsShare)
 *   }
 */
