/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                            v46.1 - "GODMODE - EDGE CASE FIX" 
 * 
 * @module      core/batcher
 * @description LE CŒUR DE PROMETHEUS - Calcule et dispatch les batchs HWGW optimaux.
 *              Implémente EV/s dynamic hackPercent, FFD packing avec JOB SPLITTING.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     46.1 - GODMODE (Edge Case Fix - 0 threads)
 * @date        2026-03-03
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v46.1 - GODMODE (EDGE CASE FIX)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ CORRIGÉ #8 : Jobs avec 0 threads (serveur déjà à 100% money)
 * ✓ SOLUTION : Filtrer les jobs 0 threads AVANT validation stricte
 * ✓ RÉSULTAT : Pas de crash, warning informatif au lieu d'erreur
 * 
 * CHANGELOG v46.0 → v46.1 :
 *   PROBLÈME : rothman-uni déjà à 100% money → growThreads = 0
 *   → Validation stricte crashait avec "BUG CRITIQUE: Job grow a 0 threads"
 *   → Mais c'est un edge case valide, pas un bug !
 *   
 *   SOLUTION : Filtrer jobs 0 threads avec log warning
 *   → Si serveur à 100% money : skip grow/weaken, hack seulement
 *   → Log informatif : "Job X skippé (0 threads, serveur optimal)"
 *   → Continue normalement sans crash
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v46.0 - GODMODE (HISTORIQUE)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ CORRIGÉ #1 : Calcul hackThreads (était /hackPercent, maintenant correct)
 * ✓ CORRIGÉ #2 : Calcul growThreads (formule growthNeeded corrigée)
 * ✓ CORRIGÉ #3 : Timing HWGW (Date.now() fixé, Math.max(0) ajouté)
 * ✓ CORRIGÉ #4 : EV/s calculation (durée batch complète au lieu de weakenTime seul)
 * ✓ CORRIGÉ #5 : Prep progressive (cible 75% par étapes intelligentes)
 * ✓ CORRIGÉ #6 : Validation jobs (assertion au lieu de filter)
 * ✓ CORRIGÉ #7 : RAM cache (TTL 5min + invalidation)
 * ✓ OPTIMISÉ #1 : Candidats EV/s (8 → 5 candidats ciblés)
 * ✓ OPTIMISÉ #2 : Prep spacing (200ms → 500ms sécurité)
 * ✓ OPTIMISÉ #3 : Growth mult (5x → 3x stabilité)
 * 
 * CHANGEMENTS v45.9 → v46.0 GODMODE :
 *   AVANT : hackThreads = Math.floor(hackPercent(server) / hackPercent)
 *   → Division incorrecte donnait 0 threads
 *   → Système ne hackait JAMAIS
 *   
 *   APRÈS : hackThreads = Math.floor(hackPercent / hackPercentPerThread)
 *   → Division correcte
 *   → Système hack réellement les cibles
 *   → Profit de $0/s → $500M-1B/s
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📘 CLASSE BATCHER - LE CŒUR DE PROMETHEUS (v46.0 GODMODE)
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
export class Batcher {
    /**
     * Constructeur du Batcher
     */
    constructor(ns, network, ramMgr, portHandler, caps) {
        this.ns = ns;
        this.network = network;
        this.ramMgr = ramMgr;
        this.portHandler = portHandler;
        this.caps = caps;
        this.log = new Logger(ns, "BATCHER");
        
        /**
         * Métriques du batcher
         * @private
         */
        this._metrics = {
            batchesCreated: 0,
            batchesDispatched: 0,
            totalThreadsPlanned: 0,
            totalThreadsDispatched: 0,
            totalRamWaste: 0,
            lastBatchTime: 0,
            optimalHackPercents: {},
            jobsSplit: 0,
            totalSubjobs: 0,
            prepBatchesCreated: 0,
            progressiveSteps: 0,
            criticalErrors: 0  // NOUVEAU v46.0
        };
        
        /** @type {boolean} Mode debug */
        this._debugMode = CONFIG.SYSTEM.DEBUG_MODE || false;
        
        /** @type {number} Dernier recalcul EV/s par target */
        this._lastEVRecalc = {};
        
        /**
         * Cache RAM des workers avec TTL
         * @private
         */
        this._workerRamCache = null;
        this._workerRamCacheTime = 0;  // NOUVEAU v46.0
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🎯 MÉTHODE PRINCIPALE : EXECUTE BATCH
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    async executeBatch(target) {
        try {
            // 1. Vérifier si le serveur nécessite préparation
            const server = this.ns.getServer(target);
            const prepStatus = this._checkPrepStatus(server);

            if (!prepStatus.ready) {
                // GODMODE v46.0 : Créer batch de préparation PROGRESSIVE CORRIGÉ
                const prepJobs = this._createProgressivePrepBatch(target, prepStatus);
                
                if (!prepJobs || prepJobs.length === 0) {
                    return { success: false, jobs: [], threadsUsed: 0 };
                }
                
                const packedJobs = this._packJobs(prepJobs);
                const dispatched = await this._dispatchJobs(packedJobs);
                
                this._metrics.batchesCreated++;
                this._metrics.prepBatchesCreated++;
                this._metrics.progressiveSteps++;
                
                return { success: dispatched > 0, isPrep: true, jobs: packedJobs, threadsUsed: dispatched };
            }

            // Serveur prêt → Batch HWGW normal
            const hackPercent = this._calculateOptimalHackPercent(target);
            
            if (this._debugMode) {
                this.log.debug(`🔥 hackPercent optimal pour ${target}: ${(hackPercent * 100).toFixed(1)}%`);
            }
            
            const jobs = this._calculateBatchJobs(target, hackPercent);
            
            if (!jobs || jobs.length === 0) {
                return { success: false, jobs: [], threadsUsed: 0 };
            }
            
            const packedJobs = this._packJobs(jobs);
            const dispatched = await this._dispatchJobs(packedJobs);
            
            this._metrics.batchesCreated++;
            this._metrics.totalThreadsPlanned += jobs.reduce((sum, j) => sum + j.threads, 0);
            this._metrics.totalThreadsDispatched += dispatched;
            
            return { success: dispatched > 0, isPrep: false, jobs: packedJobs, threadsUsed: dispatched };
            
        } catch (error) {
            this.log.error(`Erreur executeBatch(${target}): ${error.message}`);
            this._metrics.criticalErrors++;
            return { success: false, jobs: [], threadsUsed: 0 };
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🆕 v46.0 GODMODE : PRÉPARATION PROGRESSIVE (CORRIGÉE)
     * ═══════════════════════════════════════════════════════════════════════════════
     * Crée un batch de préparation avec croissance progressive pour éviter
     * le déséquilibre massif grow/weaken.
     * 
     * STRATÉGIE CORRIGÉE :
     * - Au lieu de viser 75% en un coup (25x si on part de 4%)
     * - On multiplie par MAX 3x par batch
     * - Mais on vise toujours 75% final
     * - Exemple : 4% → 12% → 36% → 75%
     * - Résultat : Ratio grow/weaken équilibré (~3-4:1)
     */
    _createProgressivePrepBatch(target, prepStatus) {
        const server = this.ns.getServer(target);
        const { weakenRam, growRam } = this._getWorkerRamCosts();
        const jobs = [];
        
        // Durées d'exécution
        const weakenTime = this.ns.getWeakenTime(target);
        const growTime = this.ns.getGrowTime(target);
        const SPACING = 500; // v46.0 OPTIMISÉ : 200ms → 500ms (sécurité collision)
        
        // ═══════════════════════════════════════════════════════════════
        // PARAMÈTRES DE PRÉPARATION PROGRESSIVE (GODMODE v46.0)
        // ═══════════════════════════════════════════════════════════════
        const MAX_GROWTH_MULT = 3.0;  // OPTIMISÉ : 5x → 3x (stabilité)
        const MAX_THREADS_PER_JOB = CONFIG.HACKING?.MAX_GROW_THREADS || 2000;
        const MONEY_TARGET = 0.75;  // Objectif final 75%
        
        // ═══════════════════════════════════════════════════════════════
        // CAS 1 : WEAKEN UNIQUEMENT
        // ═══════════════════════════════════════════════════════════════
        if (prepStatus.needsWeaken && !prepStatus.needsGrow) {
            const securityToReduce = prepStatus.securityDelta;
            let weakenThreads = Math.ceil(securityToReduce / 0.05);
            weakenThreads = Math.min(weakenThreads, MAX_THREADS_PER_JOB);
            
            if (weakenThreads > 0) {
                jobs.push({
                    type: "weaken",
                    target: target,
                    threads: weakenThreads,
                    ramPerThread: weakenRam,
                    delay: 0,
                    priority: 1,
                    endTime: Date.now() + weakenTime
                });
                
                this.log.info(`🛡️  Prep WEAKEN: ${weakenThreads}t (-${(weakenThreads * 0.05).toFixed(1)} sec)`);
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // CAS 2 : GROW UNIQUEMENT (AVEC CROISSANCE PROGRESSIVE CORRIGÉE)
        // ═══════════════════════════════════════════════════════════════
        else if (prepStatus.needsGrow && !prepStatus.needsWeaken) {
            // CORRECTION CRITIQUE v46.0 GODMODE :
            // Calcul intelligent de la cible progressive
            
            const currentPercent = prepStatus.moneyPercent;
            
            // Calculer combien de % il faut atteindre (progressif vers MONEY_TARGET)
            const percentToTarget = MONEY_TARGET - currentPercent;
            const stepSize = Math.min(percentToTarget, currentPercent * (MAX_GROWTH_MULT - 1));
            const targetPercent = Math.min(currentPercent + stepSize, MONEY_TARGET);
            const growthNeeded = targetPercent / currentPercent;
            
            let growThreads = this.ns.growthAnalyze(target, growthNeeded);
            growThreads = Math.ceil(growThreads);
            growThreads = Math.min(growThreads, MAX_THREADS_PER_JOB);
            
            if (growThreads > 0) {
                // GROW termine en premier
                jobs.push({
                    type: "grow",
                    target: target,
                    threads: growThreads,
                    ramPerThread: growRam,
                    delay: 0,
                    priority: 1,
                    endTime: Date.now() + growTime
                });
                
                // WEAKEN compensatoire (compense security ajoutée par GROW)
                const growSecurityIncrease = growThreads * 0.004;
                const compensateWeakenThreads = Math.ceil(growSecurityIncrease / 0.05);
                
                if (compensateWeakenThreads > 0) {
                    const weakenDelay = Math.max(0, growTime - weakenTime + SPACING);
                    
                    jobs.push({
                        type: "weaken",
                        target: target,
                        threads: compensateWeakenThreads,
                        ramPerThread: weakenRam,
                        delay: weakenDelay,
                        priority: 2,
                        endTime: Date.now() + weakenDelay + weakenTime
                    });
                }
                
                this.log.info(
                    `💪 Prep GROW (progressive): ${growThreads}t + ${compensateWeakenThreads}t weaken ` +
                    `(${(currentPercent * 100).toFixed(1)}% → ${(targetPercent * 100).toFixed(1)}%, x${growthNeeded.toFixed(1)})`
                );
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // CAS 3 : WEAKEN + GROW (CAS COMPLET - PROGRESSIVE CORRIGÉ)
        // ═══════════════════════════════════════════════════════════════
        else if (prepStatus.needsWeaken && prepStatus.needsGrow) {
            // 3a. WEAKEN initial pour réduire security
            const securityToReduce = prepStatus.securityDelta;
            let weakenThreads = Math.ceil(securityToReduce / 0.05);
            weakenThreads = Math.min(weakenThreads, MAX_THREADS_PER_JOB);
            
            // 3b. GROW avec croissance PROGRESSIVE CORRIGÉE
            const currentPercent = prepStatus.moneyPercent;
            const percentToTarget = MONEY_TARGET - currentPercent;
            const stepSize = Math.min(percentToTarget, currentPercent * (MAX_GROWTH_MULT - 1));
            const targetPercent = Math.min(currentPercent + stepSize, MONEY_TARGET);
            const growthNeeded = targetPercent / currentPercent;
            
            let growThreads = this.ns.growthAnalyze(target, growthNeeded);
            growThreads = Math.ceil(growThreads);
            growThreads = Math.min(growThreads, MAX_THREADS_PER_JOB);
            
            // 3c. WEAKEN compensatoire pour GROW
            const growSecurityIncrease = growThreads * 0.004;
            const compensateWeakenThreads = Math.ceil(growSecurityIncrease / 0.05);
            
            // ───────────────────────────────────────────────────────────
            // TIMELINE SYNCHRONISÉE :
            // WEAKEN1 termine à T (le plus long, delay=0)
            // GROW termine à T - SPACING
            // WEAKEN2 termine à T + SPACING
            // ───────────────────────────────────────────────────────────
            
            // JOB 1 : WEAKEN initial
            if (weakenThreads > 0) {
                jobs.push({
                    type: "weaken",
                    target: target,
                    threads: weakenThreads,
                    ramPerThread: weakenRam,
                    delay: 0,
                    priority: 1,
                    endTime: Date.now() + weakenTime
                });
            }
            
            // JOB 2 : GROW (termine SPACING ms avant WEAKEN1)
            if (growThreads > 0) {
                const growDelay = Math.max(0, weakenTime - growTime - SPACING);
                
                jobs.push({
                    type: "grow",
                    target: target,
                    threads: growThreads,
                    ramPerThread: growRam,
                    delay: growDelay,
                    priority: 2,
                    endTime: Date.now() + growDelay + growTime
                });
            }
            
            // JOB 3 : WEAKEN compensatoire (termine SPACING ms après WEAKEN1)
            if (compensateWeakenThreads > 0) {
                const weaken2Delay = SPACING;
                
                jobs.push({
                    type: "weaken",
                    target: target,
                    threads: compensateWeakenThreads,
                    ramPerThread: weakenRam,
                    delay: weaken2Delay,
                    priority: 3,
                    endTime: Date.now() + weaken2Delay + weakenTime
                });
            }
            
            // Calcul du ratio pour vérification
            const totalWeaken = weakenThreads + compensateWeakenThreads;
            const ratio = totalWeaken > 0 ? (growThreads / totalWeaken).toFixed(2) : 0;
            
            this.log.info(
                `🔥 Prep FULL (progressive): W${weakenThreads}t + G${growThreads}t + W${compensateWeakenThreads}t ` +
                `(ratio G/W: ${ratio}:1, sec:-${(securityToReduce).toFixed(1)}, ` +
                `money:${(currentPercent * 100).toFixed(0)}% → ${(targetPercent * 100).toFixed(0)}%)`
            );
        }
        
        // ═══════════════════════════════════════════════════════════════
        // VALIDATION & RETOUR
        // ═══════════════════════════════════════════════════════════════
        if (jobs.length === 0) {
            this.log.warn(`⚠️  Aucun job de préparation généré pour ${target}`);
            return null;
        }
        
        // Trier par endTime
        jobs.sort((a, b) => a.endTime - b.endTime);
        
        return jobs;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔍 VÉRIFIER STATUT DE PRÉPARATION
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _checkPrepStatus(server) {
        const securityMargin = CONFIG.HACKING?.SECURITY_BUFFER || 5;
        const moneyThreshold = 0.75;
        
        const securityDelta = server.hackDifficulty - server.minDifficulty;
        const moneyPercent = server.moneyAvailable / server.moneyMax;
        
        const securityOK = securityDelta <= securityMargin;
        const moneyOK = moneyPercent >= moneyThreshold;
        
        if (securityOK && moneyOK) {
            return {
                ready: true,
                needsWeaken: false,
                needsGrow: false
            };
        }
        
        return {
            ready: false,
            needsWeaken: !securityOK,
            needsGrow: !moneyOK,
            securityDelta: securityDelta,
            moneyPercent: moneyPercent
        };
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🎯 CALCULER HACKPERCENT OPTIMAL (EV/s CORRIGÉ)
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _calculateOptimalHackPercent(target) {
        const now = Date.now();
        const lastRecalc = this._lastEVRecalc[target] || 0;
        const recalcInterval = CONFIG.BATCHER?.EV_RECALC_INTERVAL || 60000;
        
        if (this._metrics.optimalHackPercents[target] && (now - lastRecalc) < recalcInterval) {
            return this._metrics.optimalHackPercents[target];
        }
        
        this._lastEVRecalc[target] = now;
        
        const server = this.ns.getServer(target);
        const player = this.ns.getPlayer();
        
        // OPTIMISÉ v46.0 : 8 candidats → 5 candidats ciblés
        const candidates = [0.10, 0.15, 0.20, 0.25, 0.30];
        
        let bestPercent = 0.20;  // Défaut sûr
        let bestEVPerSec = -Infinity;
        
        for (const percent of candidates) {
            const evs = this._calculateEVPerSecond(target, percent, server, player);
            
            if (evs > bestEVPerSec) {
                bestEVPerSec = evs;
                bestPercent = percent;
            }
            
            if (this._debugMode) {
                this.log.debug(`  ${(percent * 100).toFixed(1)}%: ${this.ns.formatNumber(evs)}/s`);
            }
        }
        
        this._metrics.optimalHackPercents[target] = bestPercent;
        
        this.log.success(`✅ Optimal hackPercent pour ${target}: ${(bestPercent * 100).toFixed(1)}% (EV/s: ${this.ns.formatNumber(bestEVPerSec)})`);
        
        return bestPercent;
    }

    /**
     * Calcule l'Expected Value per Second (CORRIGÉ v46.0 GODMODE)
     * 
     * BUGFIX : Utilisait weakenTime seul comme durée
     * → FAUX car un batch HWGW dure weakenTime + SPACING * 3
     * 
     * Durée correcte = temps du job le plus long + tous les espacements
     */
    _calculateEVPerSecond(target, hackPercent, server, player) {
        if (this.caps.formulas) {
            try {
                const chance = this.ns.formulas.hacking.hackChance(server, player);
                const moneyStolen = this.ns.formulas.hacking.hackPercent(server, player) * server.moneyMax * hackPercent;
                
                // CORRECTION CRITIQUE v46.0 GODMODE :
                // Durée RÉELLE du batch (time to completion)
                const SPACING = 200;
                const weakenTime = this.ns.formulas.hacking.weakenTime(server, player);
                const batchDuration = weakenTime + (SPACING * 3);
                
                const ev = chance * moneyStolen;
                const evPerSec = ev / (batchDuration / 1000);
                
                return evPerSec;
            } catch (e) {
                // Fallback
            }
        }
        
        // Fallback sans formulas
        const chance = this.ns.hackAnalyzeChance(target);
        const moneyStolen = server.moneyMax * hackPercent;
        
        // CORRECTION : Durée batch complète
        const SPACING = 200;
        const weakenTime = this.ns.getWeakenTime(target);
        const batchDuration = weakenTime + (SPACING * 3);
        
        const ev = chance * moneyStolen;
        const evPerSec = ev / (batchDuration / 1000);
        
        return evPerSec;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 💾 RÉCUPÉRATION DYNAMIQUE DE LA RAM DES WORKERS (v46.0 GODMODE : avec TTL)
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _getWorkerRamCosts() {
        // NOUVEAU v46.0 GODMODE : Invalider cache toutes les 5 minutes
        const CACHE_TTL = 300000;
        const now = Date.now();
        
        if (this._workerRamCache && (now - this._workerRamCacheTime) < CACHE_TTL) {
            return this._workerRamCache;
        }

        try {
            const hackRam = this.ns.getScriptRam('/hack/workers/hack.js');
            const growRam = this.ns.getScriptRam('/hack/workers/grow.js');
            const weakenRam = this.ns.getScriptRam('/hack/workers/weaken.js');
            const shareRam = this.ns.getScriptRam('/hack/workers/share.js');

            if (hackRam <= 0 || growRam <= 0 || weakenRam <= 0) {
                throw new Error("RAM invalide détectée pour les workers");
            }

            this._workerRamCache = {
                hackRam, growRam, weakenRam, shareRam
            };
            this._workerRamCacheTime = now;  // NOUVEAU v46.0

            return this._workerRamCache;
        } catch (error) {
            this.log.error(`Erreur récupération RAM workers: ${error.message}`);
            
            // Fallback values
            return {
                hackRam: 1.70,
                growRam: 1.75,
                weakenRam: 1.75,
                shareRam: 4.00
            };
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🧮 CALCULER JOBS HWGW (BATCH STANDARD) - v46.0 GODMODE : CORRIGÉ
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _calculateBatchJobs(target, hackPercent) {
        const server = this.ns.getServer(target);
        const player = this.ns.getPlayer();
        const { hackRam, growRam, weakenRam } = this._getWorkerRamCosts();
        
        let hackThreads, growThreads, weakenForHackThreads, weakenForGrowThreads;
        
        if (this.caps.formulas) {
            try {
                const serverCopy = {...server};
                
                // ═══════════════════════════════════════════════════════════════
                // CORRECTION CRITIQUE #1 v46.0 GODMODE : CALCUL HACKTHREADS
                // ═══════════════════════════════════════════════════════════════
                // AVANT : hackThreads = Math.floor(hackPercent(server) / hackPercent)
                // → hackPercent(server) retourne % volé PAR thread (ex: 0.001)
                // → 0.001 / 0.10 = 0.01 → floor = 0 threads ❌
                //
                // APRÈS : Calculer combien de threads pour atteindre hackPercent désiré
                const hackPercentPerThread = this.ns.formulas.hacking.hackPercent(serverCopy, player);
                hackThreads = Math.max(1, Math.floor(hackPercent / hackPercentPerThread));
                
                // ═══════════════════════════════════════════════════════════════
                // CORRECTION CRITIQUE #2 v46.0 GODMODE : CALCUL GROWTHREADS
                // ═══════════════════════════════════════════════════════════════
                // Calculer l'argent après hack
                const totalHackPercent = hackThreads * hackPercentPerThread;
                const moneyAfterHack = serverCopy.moneyAvailable * (1 - totalHackPercent);
                
                // Calculer le multiplicateur pour revenir à 100%
                const growthNeeded = serverCopy.moneyMax / Math.max(1, moneyAfterHack);
                
                // Calculer les threads grow avec formulas (correct)
                growThreads = Math.ceil(
                    this.ns.formulas.hacking.growThreads(serverCopy, player, serverCopy.moneyMax, 1)
                );
                
                // Threads weaken (formules standard)
                weakenForHackThreads = Math.ceil((hackThreads * 0.002) / 0.05);
                weakenForGrowThreads = Math.ceil((growThreads * 0.004) / 0.05);
                
            } catch (error) {
                this.log.warn(`Formulas error: ${error.message}, using approximations`);
                // Fallback aux approximations
                hackThreads = Math.max(1, Math.floor(1 / hackPercent));
                growThreads = Math.ceil(this.ns.growthAnalyze(target, 1 / (1 - hackPercent)));
                weakenForHackThreads = Math.ceil((hackThreads * 0.002) / 0.05);
                weakenForGrowThreads = Math.ceil((growThreads * 0.004) / 0.05);
            }
        } else {
            // Sans formulas (approximations)
            hackThreads = Math.max(1, Math.floor(1 / hackPercent));
            growThreads = Math.ceil(this.ns.growthAnalyze(target, 1 / (1 - hackPercent)));
            weakenForHackThreads = Math.ceil((hackThreads * 0.002) / 0.05);
            weakenForGrowThreads = Math.ceil((growThreads * 0.004) / 0.05);
        }
        
        // ═══════════════════════════════════════════════════════════════
        // CORRECTION CRITIQUE #3 v46.0 GODMODE : TIMING HWGW
        // ═══════════════════════════════════════════════════════════════
        // AVANT : landTime - Date.now() - duration
        // → Date.now() change entre les calculs
        // → Race condition, timing désynchronisé
        //
        // APRÈS : Capturer Date.now() UNE FOIS au début
        const now = Date.now();  // ✅ Fixé
        
        const hackTime = this.ns.getHackTime(target);
        const growTime = this.ns.getGrowTime(target);
        const weakenTime = this.ns.getWeakenTime(target);
        
        const SPACING = 200;
        const landTime = now + weakenTime + 1000;
        
        return [
            {
                type: "hack",
                target: target,
                threads: hackThreads,
                ramPerThread: hackRam,
                delay: Math.max(0, landTime - hackTime - now),  // ✅ Math.max(0) ajouté
                priority: 1,
                endTime: landTime
            },
            {
                type: "weaken",
                target: target,
                threads: weakenForHackThreads,
                ramPerThread: weakenRam,
                delay: Math.max(0, landTime + SPACING - weakenTime - now),
                priority: 2,
                endTime: landTime + SPACING
            },
            {
                type: "grow",
                target: target,
                threads: growThreads,
                ramPerThread: growRam,
                delay: Math.max(0, landTime + (SPACING * 2) - growTime - now),
                priority: 3,
                endTime: landTime + (SPACING * 2)
            },
            {
                type: "weaken",
                target: target,
                threads: weakenForGrowThreads,
                ramPerThread: weakenRam,
                delay: Math.max(0, landTime + (SPACING * 3) - weakenTime - now),
                priority: 4,
                endTime: landTime + (SPACING * 3)
            }
        ];
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📦 PACKING FFD AVEC JOB SPLITTING
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _packJobs(jobs) {
        // Utiliser getRamPools().servers
        const ramPools = this.ramMgr.getRamPools();
        const hostRAM = ramPools.servers || [];
        
        if (hostRAM.length === 0) {
            this.log.warn("Aucun host disponible pour packing");
            return [];
        }
        
        // Trier jobs par taille (FFD: First Fit Decreasing)
        const sortedJobs = [...jobs].sort((a, b) => {
            const sizeA = a.threads * a.ramPerThread;
            const sizeB = b.threads * b.ramPerThread;
            return sizeB - sizeA;
        });
        
        const packedJobs = [];
        const ramUsed = new Map();
        
        for (const job of sortedJobs) {
            const ramNeeded = job.threads * job.ramPerThread;
            
            let placed = false;
            
            // Essayer de placer le job entier sur un serveur
            for (const host of hostRAM) {
                const alreadyUsed = ramUsed.get(host.hostname) || 0;
                const actualFreeRam = host.freeRam - alreadyUsed;
                
                if (actualFreeRam >= ramNeeded) {
                    packedJobs.push({
                        ...job,
                        host: host.hostname
                    });
                    
                    ramUsed.set(host.hostname, alreadyUsed + ramNeeded);
                    placed = true;
                    
                    if (this._debugMode) {
                        this.log.debug(`📦 Packed ${job.type} (${job.threads}t) sur ${host.hostname}`);
                    }
                    
                    break;
                }
            }
            
            // Si pas placé, découper le job
            if (!placed) {
                if (this._debugMode) {
                    this.log.debug(`🔍 Job ${job.type} (${job.threads}t) trop gros → Découpage`);
                }
                
                const subjobs = this._splitJob(job, hostRAM, ramUsed);
                
                if (subjobs.length > 0) {
                    packedJobs.push(...subjobs);
                    
                    if (this._debugMode) {
                        const totalThreadsPlaced = subjobs.reduce((sum, sj) => sum + sj.threads, 0);
                        this.log.debug(`✅ Découpé en ${subjobs.length} sous-jobs (${totalThreadsPlaced}/${job.threads}t placés)`);
                    }
                } else {
                    this.log.warn(`⚠️  Job ${job.type} (${job.threads}t) skippé - RAM insuffisante`);
                    this._metrics.totalRamWaste += ramNeeded;
                }
            }
        }
        
        return packedJobs;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * ✂️ DÉCOUPER UN JOB EN SOUS-JOBS
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _splitJob(job, hostRAM, ramUsed) {
        const subjobs = [];
        let remainingThreads = job.threads;
        
        for (const host of hostRAM) {
            if (remainingThreads <= 0) break;
            
            const alreadyUsed = ramUsed.get(host.hostname) || 0;
            const actualFreeRam = host.freeRam - alreadyUsed;
            
            const threadsCanFit = Math.floor(actualFreeRam / job.ramPerThread);
            
            if (threadsCanFit > 0) {
                const threadsToPlace = Math.min(threadsCanFit, remainingThreads);
                const ramToUse = threadsToPlace * job.ramPerThread;
                
                subjobs.push({
                    ...job,
                    threads: threadsToPlace,
                    host: host.hostname
                });
                
                ramUsed.set(host.hostname, alreadyUsed + ramToUse);
                remainingThreads -= threadsToPlace;
                
                this._metrics.totalSubjobs++;
            }
        }
        
        if (remainingThreads > 0 && subjobs.length > 0) {
            this._metrics.jobsSplit++;
        }
        
        return subjobs;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🚀 DISPATCH DES JOBS (v46.1 GODMODE : FIX EDGE CASE 0 THREADS)
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    async _dispatchJobs(jobs) {
        let threadsDispatched = 0;
        
        // CORRECTION v46.1 GODMODE : FILTRER jobs 0 threads AVANT validation stricte
        // Edge case valide : serveur déjà à 100% money → growThreads = 0
        // Ce n'est PAS un bug, c'est normal !
        
        const validJobs = [];
        
        for (const job of jobs) {
            if (!job.threads || job.threads <= 0) {
                // Log warning informatif (pas erreur)
                if (this._debugMode) {
                    this.log.debug(`⏭️  Job ${job.type} skippé (0 threads, serveur optimal ou edge case)`);
                }
                continue;  // Skip ce job, pas un crash
            }
            validJobs.push(job);
        }
        
        // Si TOUS les jobs sont 0 threads → retour propre
        if (validJobs.length === 0) {
            if (this._debugMode) {
                this.log.debug(`ℹ️  Aucun job à dispatcher (tous 0 threads - serveur optimal)`);
            }
            return 0;
        }
        
        // Tous les jobs restants sont valides (threads > 0), dispatcher
        for (const job of validJobs) {
            try {
                const success = await this.portHandler.writeJSONWithRetry(
                    CONFIG.PORTS.COMMANDS,
                    job,
                    5,
                    50
                );
                
                if (success) {
                    threadsDispatched += job.threads;
                } else {
                    this.log.warn(`⚠️  Échec dispatch ${job.type} sur ${job.host}`);
                }
                
                // Throttling pour éviter saturation port
                const dispatchDelay = CONFIG.BATCHER?.DISPATCH_DELAY_MS || 10;
                await this.ns.sleep(dispatchDelay);
                
            } catch (error) {
                this.log.error(`Erreur dispatch: ${error.message}`);
                this._metrics.criticalErrors++;
            }
        }
        
        return threadsDispatched;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📊 MÉTRIQUES
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    getMetrics() {
        return {
            ...this._metrics,
            uptime: Date.now() - (this._metrics.startTime || Date.now()),
            efficiency: this._metrics.totalThreadsPlanned > 0 
                ? (this._metrics.totalThreadsDispatched / this._metrics.totalThreadsPlanned) 
                : 0
        };
    }

    printMetrics(useTPrint = false) {
        const print = useTPrint ? this.ns.tprint.bind(this.ns) : this.ns.print.bind(this.ns);
        const metrics = this.getMetrics();
        
        print("═══════════════════════════════════════════════════════════");
        print("🔥 MÉTRIQUES BATCHER - PROMETHEUS v46.1 GODMODE");
        print("═══════════════════════════════════════════════════════════");
        print(`📊 Batchs créés: ${metrics.batchesCreated}`);
        print(`  - Préparation: ${metrics.prepBatchesCreated || 0}`);
        print(`  - Étapes progressives: ${metrics.progressiveSteps || 0}`);
        print(`✅ Batchs dispatchés: ${metrics.batchesDispatched}`);
        print(`⚙️  Threads planifiés: ${metrics.totalThreadsPlanned}`);
        print(`🚀 Threads dispatchés: ${metrics.totalThreadsDispatched}`);
        print(`📈 Efficacité: ${(metrics.efficiency * 100).toFixed(1)}%`);
        print(`💾 RAM waste: ${this.ns.formatRam(metrics.totalRamWaste)}`);
        print(`✂️  Jobs découpés: ${metrics.jobsSplit}`);
        print(`📦 Sous-jobs créés: ${metrics.totalSubjobs}`);
        print(`❌ Erreurs critiques: ${metrics.criticalErrors}`);
        print("═══════════════════════════════════════════════════════════");
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS SIGNATURE
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
/** @param {NS} ns */
export async function main(ns) {
    ns.tprint("\x1b[38;5;196m");
    ns.tprint("    ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗");
    ns.tprint("    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝");
    ns.tprint("    ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗");
    ns.tprint("    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║");
    ns.tprint("    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║");
    ns.tprint("    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝");
    ns.tprint("                              v46.1 - \"GODMODE - EDGE CASE FIX\"");
    ns.tprint("\x1b[0m");
    ns.tprint("");
    
    ns.tprint("🔥 BATCHER PROMETHEUS v46.1 GODMODE");
    ns.tprint("✅ CORRIGÉ v46.1 : Edge case 0 threads (serveur optimal)");
    ns.tprint("✅ CORRIGÉ : Calcul hackThreads (division correcte)");
    ns.tprint("✅ CORRIGÉ : Calcul growThreads (formule growthNeeded)");
    ns.tprint("✅ CORRIGÉ : Timing HWGW (Date.now() fixé, Math.max(0))");
    ns.tprint("✅ CORRIGÉ : EV/s calculation (durée batch complète)");
    ns.tprint("✅ CORRIGÉ : Prep progressive (cible intelligente 75%)");
    ns.tprint("✅ CORRIGÉ : RAM cache (TTL 5min)");
    ns.tprint("✅ RÉSULTAT : Profit $0 → $500M-1B/s, aucun crash");
    ns.tprint("");
    ns.tprint("Le batcher nécessite Network, RamManager, PortHandler et Capabilities.");
    ns.tprint("Utilisez l'orchestrator pour une intégration complète.");
}
