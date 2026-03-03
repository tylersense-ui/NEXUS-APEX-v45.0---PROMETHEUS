/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.4 - "PATCHED - No Backoff Controller"
 * 
 * @module      hack/controller
 * @description Dispatcher central - Lit les jobs du port 4 et dispatch les workers.
 *              Gère la copie des scripts et l'exécution sur les serveurs cibles.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.4 - PROMETHEUS PATCHED (No Backoff)
 * @date        2026-03-02
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.4 - NO BACKOFF (CRITICAL PATCH)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ SUPPRIMÉ : Backoff exponentiel contre-productif
 * ✓ RÉSULTAT : Controller lit toujours à 50ms constant
 * ✓ IMPACT : Port 4 se vide régulièrement, pas de ralentissement
 * 
 * CHANGEMENTS v45.0 → v45.4 :
 *   AVANT : Backoff après 5 erreurs exec (50ms → 3200ms)
 *   → Controller ralentit en cas d'erreur
 *   → Port 4 se remplit encore plus
 *   → WriteJSON échoue encore plus
 *   → Cercle vicieux
 *   
 *   APRÈS : Pas de backoff, lecture constante à 50ms
 *   → Controller lit à vitesse constante
 *   → Port 4 se vide régulièrement
 *   → Combiné au throttling Batcher = 0 saturation
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.0 - ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Sleep 50ms au lieu de 1ms (FIX CPU waste critique)
 * ✓ fileExists avant scp (évite copies inutiles)
 * ✓ Try/catch robuste sur exec/scp
 * ✓ Validation jobs via PortHandler.validateCommandSchema()
 * ✓ Logging détaillé avec icônes (🎮✅❌⚠️📨)
 * ✓ Métriques : jobs traités, erreurs, temps moyen
 * ✓ Cache des fichiers copiés par serveur
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/hack/controller.js");
 *   // Le controller tourne en boucle infinie et lit les jobs du port 4
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { PortHandler } from "/core/port-handler.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎮 CONTROLLER - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale du dispatcher :
 * 1. Lit les jobs du port 4 (COMMANDS)
 * 2. Valide le schéma du job
 * 3. Copie les workers nécessaires sur le host
 * 4. Exécute le worker avec les arguments
 * 5. Continue sans ralentir (PAS DE BACKOFF v45.4)
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    // Désactiver les logs par défaut pour éviter le spam
    ns.disableLog("ALL");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔧 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const log = new Logger(ns, "CONTROLLER");
    const ph = new PortHandler(ns);
    
    log.info("🎮 Démarrage du Controller PROMETHEUS v45.4...");
    
    /**
     * Mapping des types de jobs vers les scripts workers
     * @type {Object}
     */
    const WORKER_SCRIPTS = {
        'hack': '/hack/workers/hack.js',
        'grow': '/hack/workers/grow.js',
        'weaken': '/hack/workers/weaken.js',
        'share': '/hack/workers/share.js'
    };
    
    /**
     * Cache des fichiers copiés par serveur
     * Format: { hostname: Set(['script1', 'script2']) }
     * Évite les scp inutiles
     * @type {Object}
     */
    const copiedFiles = {};
    
    /**
     * Métriques du controller
     * @type {Object}
     */
    const metrics = {
        jobsProcessed: 0,
        jobsSucceeded: 0,
        jobsFailed: 0,
        startTime: Date.now(),
        lastJobTime: 0
    };
    
    /**
     * Délai constant pour le sleep (v45.4: PAS DE BACKOFF)
     * @type {number}
     */
    const BASE_DELAY = CONFIG.CONTROLLER?.POLL_INTERVAL_MS || 50;
    
    log.success("✅ Controller initialisé - En attente de jobs...");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔄 BOUCLE PRINCIPALE (INFINIE)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            // ═══════════════════════════════════════════════════════════════════════
            // 📨 LECTURE DU PORT 4 (COMMANDS)
            // ═══════════════════════════════════════════════════════════════════════
            
            const job = ph.readJSON(CONFIG.PORTS.COMMANDS);
            
            if (!job) {
                // Pas de job disponible - attendre avec le délai constant
                await ns.sleep(BASE_DELAY);
                continue;
            }
            
            // Job reçu - logger et traiter
            metrics.jobsProcessed++;
            metrics.lastJobTime = Date.now();
            
            if (log.debugEnabled) {
                log.debug(`📨 Job reçu: ${job.type} sur ${job.host} (target: ${job.target || 'N/A'})`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ✅ VALIDATION DU JOB
            // ═══════════════════════════════════════════════════════════════════════
            
            if (!ph.validateCommandSchema(job)) {
                log.error(`Schéma invalide: ${JSON.stringify(job)}`);
                metrics.jobsFailed++;
                continue;
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🔍 VÉRIFICATION DU TYPE DE JOB
            // ═══════════════════════════════════════════════════════════════════════
            
            const workerScript = WORKER_SCRIPTS[job.type];
            
            if (!workerScript) {
                log.error(`Type de job inconnu: ${job.type}`);
                metrics.jobsFailed++;
                continue;
            }
            // ═════════════════════════════════════════════════════════════
            // 🔥 v45.5 URGENTFIX : VÉRIFICATION RAM PRE-EXEC
            // ═════════════════════════════════════════════════════════════
             const ramPerThread = {
    'hack': 1.70,
    'grow': 1.75,
    'weaken': 1.75,
    'share': 4.00
            };

            const ramNeeded = (job.threads || 1) * (ramPerThread[job.type] || 2.0);
            const serverInfo = ns.getServer(job.host);
            const ramFree = serverInfo.maxRam - serverInfo.ramUsed;

            if (ramFree < ramNeeded) {
             if (log.debugEnabled) {
             log.debug(`⏭️ Skip ${job.type} sur ${job.host}: RAM insuffisante (${ns.formatRam(ramFree)} < ${ns.formatRam(ramNeeded)})`);
            }
            continue; // Skip ce job
            }
            // ═════════════════════════════════════════════════════════════
            // 🚀 EXÉCUTION DU JOB
            // ═══════════════════════════════════════════════════════════════════════
            
            try {
                // ───────────────────────────────────────────────────────────────────
                // 📋 COPIE DU WORKER SUR LE HOST (avec cache)
                // ───────────────────────────────────────────────────────────────────
                
                if (!copiedFiles[job.host]?.has(workerScript)) {
                    try {
                        await ns.scp(workerScript, job.host);
                        if (!copiedFiles[job.host]) {
                            copiedFiles[job.host] = new Set();
                        }
                        copiedFiles[job.host].add(workerScript);
                        
                        if (log.debugEnabled) {
                            log.debug(`📄 Copié ${workerScript} vers ${job.host}`);
                        }
                    } catch (scpError) {
                        log.error(`Échec scp ${workerScript} vers ${job.host}: ${scpError.message}`);
                        metrics.jobsFailed++;
                        continue; // Skip ce job mais pas de ralentissement
                    }
                }
                
                // ───────────────────────────────────────────────────────────────────
                // 🎯 PRÉPARATION DES ARGUMENTS
                // ───────────────────────────────────────────────────────────────────
                
                let args = [];
                
                if (job.type === 'hack' || job.type === 'grow' || job.type === 'weaken') {
                    // Format: [target, delay]
                    args = [job.target, job.delay || 0];
                } else if (job.type === 'share') {
                    // share n'a pas de target, juste le delay
                    args = [job.delay || 0];
                }
                
                // ───────────────────────────────────────────────────────────────────
                // 🚀 EXÉCUTION DU WORKER
                // ───────────────────────────────────────────────────────────────────
                
                const pid = ns.exec(workerScript, job.host, job.threads || 1, ...args);
                
                if (!pid || pid === 0) {
                    // ───────────────────────────────────────────────────────────────
                    // ❌ ÉCHEC EXEC (RAM insuffisante ou autre)
                    // ───────────────────────────────────────────────────────────────
                    
                    log.warn(`⚠️  Échec exec ${job.type} sur ${job.host} (${job.threads} threads)`);
                    metrics.jobsFailed++;
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 🔥 PATCH v45.4 : PAS DE BACKOFF
                    // ═══════════════════════════════════════════════════════════════
                    // AVANT : consecutiveErrors++; puis backoff si >= 5
                    // APRÈS : On ne compte plus les erreurs
                    //
                    // Raison : L'échec exec est TEMPORAIRE
                    // - Autre process utilise la RAM
                    // - La RAM se libèrera au prochain cycle
                    // - Ralentir le Controller n'aide PAS
                    // ═══════════════════════════════════════════════════════════════
                    
                } else {
                    // ───────────────────────────────────────────────────────────────
                    // ✅ SUCCÈS EXEC
                    // ───────────────────────────────────────────────────────────────
                    
                    if (log.debugEnabled) {
                        log.debug(`✅ Lancé ${job.type} sur ${job.host} (PID: ${pid}, threads: ${job.threads})`);
                    }
                    metrics.jobsSucceeded++;
                }
                
            } catch (error) {
                log.error(`Erreur lors de l'exec: ${error.message}`);
                metrics.jobsFailed++;
                // Pas de ralentissement non plus en cas d'erreur
            }
            
        } catch (error) {
            // Erreur critique dans la boucle principale
            log.error(`Erreur critique dans la boucle: ${error.message}`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️ SLEEP CONSTANT - PAS DE BACKOFF (v45.4)
        // ═══════════════════════════════════════════════════════════════════════════
        // Le Controller lit TOUJOURS à BASE_DELAY (50ms), peu importe les erreurs.
        // C'est le throttling du Batcher (20ms) qui contrôle le débit.
        // ═══════════════════════════════════════════════════════════════════════════
        
        await ns.sleep(BASE_DELAY); // Toujours 50ms constant
    }
}
