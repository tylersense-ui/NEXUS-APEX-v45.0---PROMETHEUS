/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v47.3 - "ULTIMATE DEPLOYMENT FIX"
 * 
 * @module      hack/controller
 * @description Dispatcher central ultra-rapide avec drainage instantané du port 4.
 *              Gère la copie des scripts et l'exécution sur les serveurs cibles avec UUID salt.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     47.3 - CRITICAL FIX
 * @date        2026-03-05
 * @license     MIT
 * @requires    BitBurner v2.8.1+
 * 
 * @changelog
 * v47.3 - 2026-03-05 - CRITICAL DEPLOYMENT FIX
 * - 🔥 DRAINAGE INSTANTANÉ: Boucle while interne vide le port 4 d'un coup (fix désynchronisation HWGW)
 * - 🔥 UUID SALT: Génération UUID unique pour chaque job (fix collisions de processus)
 * - 🔥 NO BACKOFF: Suppression complète du backoff exponentiel (fix saturation port 4)
 * - ✅ Passage UUID dans ns.exec() pour tous les workers
 * - ✅ Logs améliorés avec timestamps et contexte
 * - ✅ Try/catch robuste partout
 * 
 * v45.6 - 2026-03-03
 * - Ajout de l'UUID pour contourner collision d'arguments
 * - Logs détaillés de dispatch
 * 
 * v45.0 - 2025-01-XX
 * - Version initiale PROMETHEUS
 * 
 * @description
 * Le Controller est le dispatcher central qui:
 * 1. Lit les jobs JSON depuis le port 4 (COMMANDS)
 * 2. Copie les workers sur les serveurs cibles
 * 3. Exécute les workers avec les bons arguments
 * 4. Gère les erreurs et les retries
 * 
 * Architecture:
 * - Boucle principale: lecture port 4 + dispatch
 * - Boucle interne (v47.3): drainage instantané du port
 * - UUID salt: contourne collision ns.exec()
 * - Pas de backoff: vitesse constante 50ms
 * 
 * @example
 * // Lancé automatiquement par orchestrator.js
 * // Peut aussi être lancé manuellement:
 * run /hack/controller.js
 * 
 * @see /docs/architecture.txt - Architecture complète
 * @see /core/batcher.js - Génération des jobs
 * @see /hack/workers/ - Scripts workers
 */

import { CONFIG } from "/lib/constants.js";
import { PortHandler } from "/core/port-handler.js";
import { Logger } from "/lib/logger.js";

/**
 * Point d'entrée principal du Controller
 * @param {NS} ns - Netscript API
 */
export async function main(ns) {
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "CONTROLLER");
    const portHandler = new PortHandler(ns);
    
    log.info("🎮 Controller v47.3 démarré");
    log.info("🔥 Drainage instantané activé");
    log.info("🔥 UUID salt activé");
    log.info("🔥 No backoff - vitesse constante");
    
    // Configuration
    const COMMANDS_PORT = CONFIG.PORTS?.COMMANDS || 4;
    const BASE_DELAY = CONFIG.CONTROLLER?.POLL_INTERVAL_MS || 50;
    
    // Workers disponibles
    const WORKERS = {
        hack: "/hack/workers/hack.js",
        grow: "/hack/workers/grow.js",
        weaken: "/hack/workers/weaken.js",
        share: "/hack/workers/share.js"
    };
    
    // Métriques
    let jobsProcessed = 0;
    let jobsSucceeded = 0;
    let jobsFailed = 0;
    let totalThreadsDispatched = 0;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════
    
    log.info("🔄 Boucle principale activée");
    log.info(`📨 Écoute port ${COMMANDS_PORT} | Intervalle: ${BASE_DELAY}ms`);
    
    while (true) {
        try {
            // ═══════════════════════════════════════════════════════════════
            // 🔥 v47.3 FIX: DRAINAGE INSTANTANÉ DU PORT 4
            // ═══════════════════════════════════════════════════════════════
            // Boucle while INTERNE qui vide le port d'un coup.
            // Tous les jobs d'un batch HWGW sont dispatchés en <10ms.
            // Fix la désynchronisation temporelle.
            // ═══════════════════════════════════════════════════════════════
            
            let batchJobsCount = 0;
            
            while (!portHandler.isEmpty(COMMANDS_PORT)) {
                batchJobsCount++;
                
                // Lire le job depuis le port 4
                const job = portHandler.readJSON(COMMANDS_PORT);
                
                if (!job) {
                    log.warn("Message invalide dans le port 4");
                    continue;
                }
                
                // ═══════════════════════════════════════════════════════════
                // VALIDATION DU JOB
                // ═══════════════════════════════════════════════════════════
                
                if (!job.type || !job.target || !job.host) {
                    log.error(`Job invalide: ${JSON.stringify(job)}`);
                    jobsFailed++;
                    continue;
                }
                
                if (!job.threads || job.threads < 1) {
                    log.warn(`Job ${job.type} avec 0 threads ignoré`);
                    continue;
                }
                
                // ═══════════════════════════════════════════════════════════
                // PRÉPARATION DU WORKER
                // ═══════════════════════════════════════════════════════════
                
                const workerScript = WORKERS[job.type];
                
                if (!workerScript) {
                    log.error(`Type de worker inconnu: ${job.type}`);
                    jobsFailed++;
                    continue;
                }
                
                // Vérifier que le worker existe
                if (!ns.fileExists(workerScript, "home")) {
                    log.error(`Worker introuvable: ${workerScript}`);
                    jobsFailed++;
                    continue;
                }
                
                // ═══════════════════════════════════════════════════════════
                // COPIE DU WORKER SUR LE SERVEUR CIBLE
                // ═══════════════════════════════════════════════════════════
                
                try {
                    const copied = await ns.scp(workerScript, job.host, "home");
                    
                    if (!copied) {
                        log.warn(`Impossible de copier ${workerScript} sur ${job.host}`);
                        jobsFailed++;
                        continue;
                    }
                } catch (error) {
                    log.error(`Erreur scp ${workerScript} → ${job.host}: ${error.message}`);
                    jobsFailed++;
                    continue;
                }
                
                // ═══════════════════════════════════════════════════════════
                // 🔥 v47.3 FIX: GÉNÉRATION UUID SALT
                // ═══════════════════════════════════════════════════════════
                // Génère un UUID unique pour chaque job.
                // Contourne la collision ns.exec() quand même script + mêmes args.
                // Permet le job splitting (plusieurs subjobs du même type).
                // ═══════════════════════════════════════════════════════════
                
                const uuid = job.uuid || generateUUID();
                
                // ═══════════════════════════════════════════════════════════
                // EXÉCUTION DU WORKER
                // ═══════════════════════════════════════════════════════════
                
                try {
                    // Arguments pour le worker:
                    // - arg[0]: target (ex: "n00dles")
                    // - arg[1]: delay (ex: 1500)
                    // - arg[2]: uuid (ex: "a3f8d9e2-4b1c-...")  ← v47.3 FIX
                    
                    const pid = ns.exec(
                        workerScript,
                        job.host,
                        job.threads,
                        job.target,  // arg[0]
                        job.delay || 0,  // arg[1]
                        uuid  // arg[2] - UUID SALT
                    );
                    
                    if (pid > 0) {
                        jobsSucceeded++;
                        totalThreadsDispatched += job.threads;
                        
                        if (log.debugEnabled) {
                            log.debug(
                                `✅ ${job.type} ${job.target} → ${job.host} ` +
                                `(${job.threads}t, ${job.delay}ms) PID:${pid}`
                            );
                        }
                    } else {
                        jobsFailed++;
                        
                        log.warn(
                            `⚠️  Échec exec ${job.type} sur ${job.host} ` +
                            `(${job.threads}t) - RAM insuffisante ?`
                        );
                    }
                    
                } catch (error) {
                    jobsFailed++;
                    log.error(`Erreur exec ${job.type}: ${error.message}`);
                }
                
                jobsProcessed++;
            }
            
            // Log si des jobs ont été traités dans ce cycle
            if (batchJobsCount > 0 && jobsProcessed % 100 === 0) {
                log.info(
                    `📊 Jobs: ${jobsProcessed} traités | ` +
                    `✅ ${jobsSucceeded} OK | ` +
                    `❌ ${jobsFailed} failed | ` +
                    `⚙️  ${totalThreadsDispatched} threads`
                );
            }
            
        } catch (error) {
            log.error(`Erreur boucle principale: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // 🔥 v47.3 FIX: NO BACKOFF - VITESSE CONSTANTE
        // ═══════════════════════════════════════════════════════════════════
        // Sleep UNIQUEMENT quand le port est vide.
        // Toujours 50ms constant (pas de backoff exponentiel).
        // Fix la saturation du port 4.
        // ═══════════════════════════════════════════════════════════════════
        
        await ns.sleep(BASE_DELAY);
    }
}

/**
 * Génère un UUID unique pour éviter les collisions de processus
 * @returns {string} UUID unique (format simplifié)
 * 
 * @example
 * generateUUID() // "a3f8d9e2-4b1c-7f3a-9d2e-1c4b8f6a3e5d"
 */
function generateUUID() {
    // Fallback si crypto.randomUUID n'est pas disponible
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Génération manuelle: timestamp + random
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    
    return `${timestamp}-${randomPart}-${randomPart2}`;
}
