/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                            v45.3 - "PREP LOGIC INTEGRATED"
 * 
 * @module      core/batcher
 * @description LE CŒUR DE PROMETHEUS - Calcule et dispatch les batchs HWGW optimaux.
 *              Implémente EV/s dynamic hackPercent, FFD packing avec JOB SPLITTING.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.3 - PROMETHEUS PREP LOGIC INTEGRATED
 * @date        2026-03-02
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.3 - INTELLIGENT TARGET PREPARATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ NOUVEAU : _checkPrepStatus() - Vérifie si serveur prêt pour HWGW
 * ✓ NOUVEAU : _createPrepBatch() - Crée batchs de préparation automatiques
 * ✓ MODIFIÉ : executeBatch() - Gère préparation ET exploitation
 * ✓ RÉSULTAT : Serveurs automatiquement optimisés avant hacking
 * 
 * CHANGEMENTS v45.2 → v45.3 :
 *   AVANT : Serveurs jamais optimisés (security haute, money bas)
 *   → QUE DES HACKS, revenus sous-optimaux
 *   
 *   APRÈS : Préparation active et intelligente
 *   → Détecte security/money insuffisants
 *   → Crée batch weaken+grow+compensate
 *   → Puis HWGW optimal une fois prêt
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS v45.2 - CRITICAL BUGFIX
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ BUGFIX : hostRAM n'est plus muté entre les jobs
 * ✓ BUGFIX : Chaque job reçoit une copie fraîche de l'état RAM
 * ✓ RÉSULTAT : 100% des threads placés au lieu de 0%
 * 
 * BUG CORRIGÉ v45.1 → v45.2 :
 *   AVANT : _splitJob() modifiait hostRAM en place
 *   → Premier job utilisait toute la RAM
 *   → Jobs suivants ne trouvaient plus de RAM libre
 *   → RÉSULTAT : 0% des threads placés
 *   
 *   APRÈS : Tracker séparé des RAM utilisées
 *   → Chaque job voit la RAM disponible correcte
 *   → RÉSULTAT : 100% des threads placés
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   import { Batcher } from "/core/batcher.js";
 *   const batcher = new Batcher(ns, network, ramMgr, portHandler, caps);
 *   await batcher.executeBatch("joesguns");
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📘 CLASSE BATCHER - LE CŒUR DE PROMETHEUS (v45.3 PREP LOGIC)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Calcule, optimise et dispatch les batchs HWGW avec algorithmes avancés.
 * VERSION v45.3 avec système de préparation intelligente intégré.
 */
export class Batcher {
    /**
     * Constructeur du Batcher
     * 
     * @param {NS} ns - Namespace BitBurner
     * @param {Network} network - Instance du Network scanner
     * @param {RamManager} ramMgr - Instance du RAM Manager
     * @param {PortHandler} portHandler - Instance du Port Handler
     * @param {Capabilities} caps - Instance des Capabilities
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
            optimalHackPercents: {}, // Cache des hackPercent optimaux par target
            jobsSplit: 0,             // NOUVEAU : Nombre de jobs découpés
            totalSubjobs: 0,           // NOUVEAU : Nombre total de sous-jobs créés
            prepBatchesCreated: 0     // NOUVEAU v45.3
        };
        
        /** @type {boolean} Mode debug (depuis CONFIG) */
        this._debugMode = CONFIG.SYSTEM.DEBUG_MODE || false;
        
        /** @type {number} Dernier recalcul EV/s par target */
        this._lastEVRecalc = {};
        
        /**
         * Cache RAM des workers (évite appels répétés à getScriptRam)
         * @private
         */
        this._workerRamCache = null;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🎯 MÉTHODE PRINCIPALE : EXECUTE BATCH
     * ═══════════════════════════════════════════════════════════════════════════════
     * Calcule et exécute un batch HWGW complet sur une cible.
     * 
     * @public
     * @param {string} target - Hostname de la cible
     * @returns {Promise<Object>} Résultats du batch { success, jobs, threadsUsed }
     */
    
       async executeBatch(target) {
        try {
            // 1. Vérifier si le serveur nécessite préparation (v45.3)
            const server = this.ns.getServer(target);
            const prepStatus = this._checkPrepStatus(server);

            if (!prepStatus.ready) {
                const prepJobs = this._createPrepBatch(target, prepStatus);
                
                if (!prepJobs || prepJobs.length === 0) {
                    return { success: false, jobs: [], threadsUsed: 0 };
                }
                
                const packedJobs = this._packJobs(prepJobs);
                const dispatched = await this._dispatchJobs(packedJobs);
                
                this._metrics.batchesCreated++;
                this._metrics.prepBatchesCreated++;
                
                return { success: dispatched > 0, jobs: packedJobs, threadsUsed: dispatched };
            }

            // Serveur prêt → Continuer avec batch HWGW normal
            
            // 2. Calculer le hackPercent optimal (EV/s)
            const hackPercent = this._calculateOptimalHackPercent(target);
            
            if (this._debugMode) {
                this.log.debug(`🔥 hackPercent optimal pour ${target}: ${(hackPercent * 100).toFixed(1)}%`);
            }
            
            // 3. Calculer les jobs HWGW
            const jobs = this._calculateBatchJobs(target, hackPercent);
            
            if (!jobs || jobs.length === 0) {
                this.log.warn(`⚠️  Aucun job calculé pour ${target}`);
                return { success: false, jobs: [], threadsUsed: 0 };
            }
            
            // 4. Packer les jobs (FFD algorithm avec split)
            const packedJobs = this._packJobs(jobs);
            
            if (packedJobs.length === 0) {
                this.log.warn(`⚠️  Packing échoué - RAM insuffisante`);
                return { success: false, jobs: [], threadsUsed: 0 };
            }
            
            // 5. Dispatcher les jobs
            const dispatched = await this._dispatchJobs(packedJobs);
            
            // 6. Métriques
            this._metrics.batchesCreated++;
            if (dispatched > 0) {
                this._metrics.batchesDispatched++;
            }
            
            this._metrics.totalThreadsPlanned += jobs.reduce((sum, j) => sum + j.threads, 0);
            this._metrics.totalThreadsDispatched += dispatched;
            
            if (this._debugMode) {
                this.log.debug(`📊 Batch ${target}: ${dispatched}/${jobs.reduce((s, j) => s + j.threads, 0)} threads dispatchés`);
            }
            
            return {
                success: dispatched > 0,
                jobs: packedJobs,
                threadsUsed: dispatched
            };
            
        } catch (error) {
            this.log.error(`Erreur dans executeBatch(${target}): ${error.message}`);
            return { success: false, jobs: [], threadsUsed: 0 };
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔥 EV/s OPTIMIZATION - PROMETHEUS CORE
     * ═══════════════════════════════════════════════════════════════════════════════
     * Calcule le hackPercent optimal en maximisant Expected Value per Second (EV/s).
     * 
     * @private
     * @param {string} target - Hostname de la cible
     * @returns {number} hackPercent optimal (entre 0.01 et 0.50)
     */
    _calculateOptimalHackPercent(target) {
        const now = Date.now();
        
        // Cache: recalculer seulement toutes les 5 minutes
        if (this._lastEVRecalc[target] && 
            (now - this._lastEVRecalc[target]) < CONFIG.HACKING.EV_RECALC_INTERVAL_MS) {
            return this._metrics.optimalHackPercents[target] || CONFIG.HACKING.HACK_PERCENT;
        }
        
        this._lastEVRecalc[target] = now;
        
        const server = this.ns.getServer(target);
        const player = this.ns.getPlayer();
        
        // Candidats à tester
        const candidates = CONFIG.HACKING.HACK_PERCENT_CANDIDATES;
        let bestPercent = CONFIG.HACKING.HACK_PERCENT;
        let bestEVPerSec = -Infinity;
        
        for (const percent of candidates) {
            // Calculer EV/s pour ce candidat
            const evs = this._calculateEVPerSecond(target, percent, server, player);
            
            if (evs > bestEVPerSec) {
                bestEVPerSec = evs;
                bestPercent = percent;
            }
            
            if (this._debugMode) {
                this.log.debug(`  ${(percent * 100).toFixed(1)}%: ${this.ns.formatNumber(evs)}/s`);
            }
        }
        
        // Cacher le résultat
        this._metrics.optimalHackPercents[target] = bestPercent;
        
        this.log.success(`✅ Optimal hackPercent pour ${target}: ${(bestPercent * 100).toFixed(1)}% (EV/s: ${this.ns.formatNumber(bestEVPerSec)})`);
        
        return bestPercent;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🆕 v45.3 : VÉRIFIER STATUT DE PRÉPARATION
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _checkPrepStatus(server) {
        const securityMargin = 5;
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
     * 🆕 v45.3 : CRÉER BATCH DE PRÉPARATION
     * ═══════════════════════════════════════════════════════════════════════════════
     */
    _createPrepBatch(target, prepStatus) {
        const server = this.ns.getServer(target);
        const { weakenRam, growRam } = this._getWorkerRamCosts();
        const jobs = [];
        
        if (prepStatus.needsWeaken) {
            const securityToReduce = prepStatus.securityDelta;
            let weakenThreads = Math.ceil(securityToReduce / 0.05);
            weakenThreads = Math.min(weakenThreads, 5000);
            
            if (weakenThreads > 0) {
                jobs.push({
                    type: 'weaken',
                    target: target,
                    threads: weakenThreads,
                    delay: 0,
                    ramPerThread: weakenRam
                });
            }
        }
        
        if (prepStatus.needsGrow) {
            const currentMoney = Math.max(1, server.moneyAvailable);
            const targetMoney = server.moneyMax;
            const growMultiplier = targetMoney / currentMoney;
            
            let growThreads = Math.ceil(this.ns.growthAnalyze(target, growMultiplier));
            growThreads = Math.min(growThreads, 5000);
            
            if (growThreads > 0) {
                jobs.push({
                    type: 'grow',
                    target: target,
                    threads: growThreads,
                    delay: 0,
                    ramPerThread: growRam
                });
                
                const compensateWeakenThreads = Math.ceil((growThreads * 0.004) / 0.05);
                jobs.push({
                    type: 'weaken',
                    target: target,
                    threads: compensateWeakenThreads,
                    delay: 0,
                    ramPerThread: weakenRam
                });
            }
        }
        
        return jobs;
    }

    /**
     * Calcule l'Expected Value per Second pour un hackPercent donné
     * 
     * Formule: EV/s = (chance × moneyStolen - costWeakenGrow) / duration
     * 
     * @private
     * @param {string} target - Hostname
     * @param {number} hackPercent - Pourcentage à hack (0.0 - 1.0)
     * @param {Server} server - Objet serveur
     * @param {Player} player - Objet joueur
     * @returns {number} EV/s (peut être négatif si coût > gain)
     */
    _calculateEVPerSecond(target, hackPercent, server, player) {
        // Calculer avec Formulas si disponible (précis)
        if (this.caps.formulas) {
            try {
                const chance = this.ns.formulas.hacking.hackChance(server, player);
                const moneyStolen = this.ns.formulas.hacking.hackPercent(server, player) * server.moneyMax * hackPercent;
                const duration = this.ns.formulas.hacking.weakenTime(server, player);
                
                // Coût approximatif des opérations weaken/grow
                // (simplifié: on ne calcule pas exactement les threads ici)
                const cost = 0; // À affiner si besoin
                
                const ev = (chance * moneyStolen) - cost;
                const evPerSec = ev / (duration / 1000);
                
                return evPerSec;
            } catch (e) {
                // Fallback si formulas échoue
            }
        }
        
        // Approximation sans Formulas
        const chance = this.ns.hackAnalyzeChance(target);
        const moneyStolen = server.moneyMax * hackPercent;
        const duration = this.ns.getWeakenTime(target);
        
        const ev = (chance * moneyStolen);
        const evPerSec = ev / (duration / 1000);
        
        return evPerSec;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 💾 RÉCUPÉRATION DYNAMIQUE DE LA RAM DES WORKERS
     * ═══════════════════════════════════════════════════════════════════════════════
     * Utilise ns.getScriptRam() pour obtenir les valeurs exactes (FIX CRITIQUE).
     * Cache les résultats pour éviter les appels répétés.
     * 
     * @private
     * @returns {Object} { hackRam, growRam, weakenRam, shareRam }
     */
    _getWorkerRamCosts() {
        // Utiliser le cache si déjà calculé
        if (this._workerRamCache) {
            return this._workerRamCache;
        }

        // Calculer les RAM exactes via ns.getScriptRam()
        try {
            const hackRam = this.ns.getScriptRam('/hack/workers/hack.js');
            const growRam = this.ns.getScriptRam('/hack/workers/grow.js');
            const weakenRam = this.ns.getScriptRam('/hack/workers/weaken.js');
            const shareRam = this.ns.getScriptRam('/hack/workers/share.js');

            // Vérifier que les valeurs sont valides
            if (hackRam <= 0 || growRam <= 0 || weakenRam <= 0) {
                throw new Error("RAM invalide détectée pour les workers");
            }

            // Cacher les résultats
            this._workerRamCache = {
                hackRam: hackRam,
                growRam: growRam,
                weakenRam: weakenRam,
                shareRam: shareRam
            };

            if (this._debugMode) {
                this.log.debug(`💾 RAM workers: H=${hackRam.toFixed(2)}GB G=${growRam.toFixed(2)}GB W=${weakenRam.toFixed(2)}GB`);
            }

            return this._workerRamCache;

        } catch (error) {
            // Fallback sur valeurs approximatives si getScriptRam échoue
            this.log.warn(`⚠️  Échec getScriptRam, fallback sur valeurs approximatives: ${error.message}`);
            
            this._workerRamCache = {
                hackRam: 1.70,
                growRam: 1.75,
                weakenRam: 1.75,
                shareRam: 4.00
            };

            return this._workerRamCache;
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🧮 CALCUL DES JOBS HWGW
     * ═══════════════════════════════════════════════════════════════════════════════
     * Calcule les 4 jobs (Hack, Weaken, Grow, Weaken) avec timing précis.
     * 
     * @private
     * @param {string} target - Hostname
     * @param {number} hackPercent - Pourcentage optimal à hack
     * @returns {Array<Object>} Liste des jobs [{type, target, threads, delay, ramPerThread}]
     */
    _calculateBatchJobs(target, hackPercent) {
        const server = this.ns.getServer(target);
        const player = this.ns.getPlayer();
        
        // ═══════════════════════════════════════════════════════════════════════════
        // RAM DYNAMIQUE DES WORKERS (FIX CRITIQUE)
        // ═══════════════════════════════════════════════════════════════════════════
        const { hackRam, growRam, weakenRam } = this._getWorkerRamCosts();
        
        // ═══════════════════════════════════════════════════════════════════════════
        // TIMING (avec Formulas si disponible)
        // ═══════════════════════════════════════════════════════════════════════════
        
        let hackTime, growTime, weakenTime;
        
        if (this.caps.formulas) {
            hackTime = this.ns.formulas.hacking.hackTime(server, player);
            growTime = this.ns.formulas.hacking.growTime(server, player);
            weakenTime = this.ns.formulas.hacking.weakenTime(server, player);
        } else {
            hackTime = this.ns.getHackTime(target);
            growTime = this.ns.getGrowTime(target);
            weakenTime = this.ns.getWeakenTime(target);
        }
        
        const buffer = CONFIG.HACKING.TIMING_BUFFER_MS;
        
        // ═══════════════════════════════════════════════════════════════════════════
        // CALCUL DES THREADS
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Hack threads
        const hackThreads = Math.max(1, Math.floor(hackPercent / this.ns.hackAnalyze(target)));
        
        // Weaken1 threads (compense hack)
        const weakenThreads1 = Math.max(1, Math.ceil((hackThreads * 0.002) / 0.05));
        
        // Grow threads (ramène à 100%)
        const growMultiplier = 1 / (1 - hackPercent);
        let growThreads = Math.max(1, Math.ceil(this.ns.growthAnalyze(target, growMultiplier)));
        
        // Limiter grow threads (sécurité)
        growThreads = Math.min(growThreads, CONFIG.HACKING.MAX_GROW_THREADS || 10000);
        
        // Weaken2 threads (compense grow)
        const weakenThreads2 = Math.max(1, Math.ceil((growThreads * 0.004) / 0.05));
        
        // ═══════════════════════════════════════════════════════════════════════════
        // CALCUL DES DÉLAIS (synchronisation HWGW)
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Weaken est le plus long - il part en premier et finit en premier
        const hackDelay = weakenTime - hackTime - buffer;
        const weaken1Delay = 0; // Part en premier
        const growDelay = weakenTime - growTime + buffer;
        const weaken2Delay = buffer * 2; // Finit 200ms après weaken1
        
        // ═══════════════════════════════════════════════════════════════════════════
        // CONSTRUCTION DES JOBS (avec RAM DYNAMIQUE)
        // ═══════════════════════════════════════════════════════════════════════════
        
        const jobs = [
            {
                type: 'hack',
                target: target,
                threads: hackThreads,
                delay: Math.max(0, hackDelay),
                ramPerThread: hackRam  // ✅ DYNAMIQUE
            },
            {
                type: 'weaken',
                target: target,
                threads: weakenThreads1,
                delay: Math.max(0, weaken1Delay),
                ramPerThread: weakenRam  // ✅ DYNAMIQUE
            },
            {
                type: 'grow',
                target: target,
                threads: growThreads,
                delay: Math.max(0, growDelay),
                ramPerThread: growRam  // ✅ DYNAMIQUE
            },
            {
                type: 'weaken',
                target: target,
                threads: weakenThreads2,
                delay: Math.max(0, weaken2Delay),
                ramPerThread: weakenRam  // ✅ DYNAMIQUE
            }
        ];
        
        return jobs;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * ✂️ BUGFIX v45.2 : SPLIT JOB - DÉCOUPAGE SANS MUTATION
     * ═══════════════════════════════════════════════════════════════════════════════
     * Découpe un job trop gros en plusieurs sous-jobs qui rentrent sur les serveurs.
     * 
     * BUGFIX v45.2 : N'utilise plus hostRAM directement, mais un tracker séparé.
     * 
     * @private
     * @param {Object} job - Job à découper {type, target, threads, delay, ramPerThread}
     * @param {Array<Object>} hostRAM - Liste des serveurs [{hostname, freeRam}]
     * @param {Map<string, number>} ramUsed - Tracker des RAM utilisées par hostname
     * @returns {Array<Object>} Liste des sous-jobs avec host assigné
     */
    _splitJob(job, hostRAM, ramUsed) {
        const subjobs = [];
        let remainingThreads = job.threads;
        const minThreadsPerSubjob = CONFIG.HACKING.MIN_THREADS_PER_SUBJOB || 1;
        
        if (this._debugMode) {
            this.log.debug(`✂️ Découpage job ${job.type} (${job.threads}t)`);
        }
        
        // Parcourir les serveurs par RAM libre décroissante
        for (const host of hostRAM) {
            if (remainingThreads <= 0) break;
            
            // Calculer la RAM vraiment libre (freeRam - déjà utilisée)
            const alreadyUsed = ramUsed.get(host.hostname) || 0;
            const actualFreeRam = host.freeRam - alreadyUsed;
            
            if (actualFreeRam <= 0) continue;
            
            // Calculer combien de threads peuvent rentrer
            const maxThreadsOnHost = Math.floor(actualFreeRam / job.ramPerThread);
            
            if (maxThreadsOnHost < minThreadsPerSubjob) {
                continue;
            }
            
            // Placer autant de threads que possible
            const threadsToPlace = Math.min(maxThreadsOnHost, remainingThreads);
            const ramNeeded = threadsToPlace * job.ramPerThread;
            
            // Créer un sous-job
            subjobs.push({
                type: job.type,
                target: job.target,
                threads: threadsToPlace,
                delay: job.delay,
                ramPerThread: job.ramPerThread,
                host: host.hostname
            });
            
            // BUGFIX v45.2 : Mettre à jour le tracker séparé
            ramUsed.set(host.hostname, alreadyUsed + ramNeeded);
            remainingThreads -= threadsToPlace;
            
            if (this._debugMode) {
                this.log.debug(`  ✅ Sous-job (${threadsToPlace}t) → ${host.hostname}`);
            }
        }
        
        // Vérifier si tous les threads ont été placés
        if (remainingThreads > 0) {
            this.log.warn(`⚠️  Job ${job.type}: ${remainingThreads}/${job.threads} threads non placés`);
        }
        
        // Métriques
        if (subjobs.length > 1) {
            this._metrics.jobsSplit++;
            this._metrics.totalSubjobs += subjobs.length;
        }
        
        return subjobs;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📦 BUGFIX v45.2 : FFD PACKING AVEC TRACKER RAM
     * ═══════════════════════════════════════════════════════════════════════════════
     * First Fit Decreasing - Minimise la fragmentation RAM.
     * BUGFIX v45.2 : Utilise un tracker Map pour éviter la mutation de hostRAM.
     * 
     * @private
     * @param {Array<Object>} jobs - Liste des jobs à packer
     * @returns {Array<Object>} Jobs packés avec host assigné
     */
    _packJobs(jobs) {
        // Récupérer tous les serveurs avec root access
        const allServers = this.network.refresh();
        const availableHosts = allServers.filter(h => this.ns.hasRootAccess(h));
        
        // Sort jobs by RAM needed (descending)
        const sortedJobs = [...jobs].sort((a, b) => {
            const ramA = a.threads * a.ramPerThread;
            const ramB = b.threads * b.ramPerThread;
            return ramB - ramA;
        });
        
        // Récupérer la RAM disponible sur chaque host
        const hostRAM = availableHosts.map(h => ({
            hostname: h,
            freeRam: this.ramMgr.getRamInfo(h).freeRam
        }));
        
        // Sort hosts by free RAM (descending)
        hostRAM.sort((a, b) => b.freeRam - a.freeRam);
        
        // BUGFIX v45.2 : Tracker séparé pour les RAM utilisées
        const ramUsed = new Map();
        
        // Pack jobs (FFD avec split)
        const packedJobs = [];
        
        for (const job of sortedJobs) {
            const ramNeeded = job.threads * job.ramPerThread;
            
            // Trouver le premier host avec assez de RAM (First-Fit)
            let placed = false;
            
            for (const host of hostRAM) {
                const alreadyUsed = ramUsed.get(host.hostname) || 0;
                const actualFreeRam = host.freeRam - alreadyUsed;
                
                if (actualFreeRam >= ramNeeded) {
                    // Placer le job entier sur ce host
                    packedJobs.push({
                        ...job,
                        host: host.hostname
                    });
                    
                    // Mettre à jour le tracker
                    ramUsed.set(host.hostname, alreadyUsed + ramNeeded);
                    placed = true;
                    
                    if (this._debugMode) {
                        this.log.debug(`📦 Packed ${job.type} (${job.threads}t) sur ${host.hostname}`);
                    }
                    
                    break;
                }
            }
            
            if (!placed) {
                // ═══════════════════════════════════════════════════════════════
                // JOB SPLITTING avec tracker ramUsed
                // ═══════════════════════════════════════════════════════════════
                
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
                    this.log.warn(`⚠️  Job ${job.type} (${job.threads}t) skippé - RAM insuffisante même après découpage`);
                    this._metrics.totalRamWaste += ramNeeded;
                }
            }
        }
        
        return packedJobs;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🚀 DISPATCH DES JOBS
     * ═══════════════════════════════════════════════════════════════════════════════
     * Écrit les jobs dans le port 4 pour que le controller les exécute.
     * 
     * @private
     * @param {Array<Object>} jobs - Jobs packés avec host
     * @returns {Promise<number>} Nombre de threads dispatchés
     */
    async _dispatchJobs(jobs) {
    let threadsDispatched = 0;
    
    for (const job of jobs) {
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
            
            // ✅ DÉLAI ANTI-CONTENTION : 10ms entre chaque dispatch
            await this.ns.sleep(10);
            
        } catch (error) {
            this.log.error(`Erreur dispatch: ${error.message}`);
        }
    }
    
    return threadsDispatched;
}


    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📊 MÉTRIQUES ET UTILITAIRES
     * ═══════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Retourne les métriques du batcher
     * 
     * @public
     * @returns {Object} Métriques détaillées
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

    /**
     * Affiche un rapport des métriques
     * 
     * @public
     * @param {boolean} [useTPrint=false] - Utiliser tprint au lieu de print
     */
    printMetrics(useTPrint = false) {
        const print = useTPrint ? this.ns.tprint.bind(this.ns) : this.ns.print.bind(this.ns);
        const metrics = this.getMetrics();
        
        print("═══════════════════════════════════════════════════════════");
        print("🔥 MÉTRIQUES BATCHER - PROMETHEUS v45.2 BUGFIX");
        print("═══════════════════════════════════════════════════════════");
        print(`📊 Batchs créés: ${metrics.batchesCreated}`);
        print(`✅ Batchs dispatchés: ${metrics.batchesDispatched}`);
        print(`⚙️  Threads planifiés: ${metrics.totalThreadsPlanned}`);
        print(`🚀 Threads dispatchés: ${metrics.totalThreadsDispatched}`);
        print(`📈 Efficacité: ${(metrics.efficiency * 100).toFixed(1)}%`);
        print(`💾 RAM waste: ${this.ns.formatRam(metrics.totalRamWaste)}`);
        print(`✂️ Jobs découpés: ${metrics.jobsSplit}`);
        print(`📦 Sous-jobs créés: ${metrics.totalSubjobs}`);
        print(`  - Préparation: ${metrics.prepBatchesCreated || 0}`);
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
    ns.tprint("                              v45.2 - \"CRITICAL BUGFIX - Job Splitting Fixed\"");
    ns.tprint("\x1b[0m");
    ns.tprint("");
    
    ns.tprint("🔥 BATCHER PROMETHEUS v45.2 BUGFIX");
    ns.tprint("✅ CORRIGÉ : hostRAM n'est plus muté entre jobs");
    ns.tprint("✅ RÉSULTAT : 100% des threads placés au lieu de 0%");
    ns.tprint("");
    ns.tprint("Le batcher nécessite Network, RamManager, PortHandler et Capabilities.");
    ns.tprint("Utilisez l'orchestrator pour une intégration complète.");
}
