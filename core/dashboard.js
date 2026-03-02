/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.1 - "DASHBOARD PREMIUM"
 * 
 * @module      core/dashboard
 * @description Dashboard premium avec design professionnel et auto-tail
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.1 - PROMETHEUS PREMIUM
 * @date        2026-03-01
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎨 DASHBOARD PREMIUM - FONCTIONNALITÉS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Design box-drawing professionnel
 * ✓ BitNode actuel affiché automatiquement
 * ✓ Record de profit historique
 * ✓ Statut bourse (TIX API) si disponible
 * ✓ Barre de progression RAM visuelle
 * ✓ Threads détaillés par type (Hack/Grow/Weaken)
 * ✓ Rep boost si share actif
 * ✓ Target status multi-cibles avec ETA
 * ✓ Sub-systems (Singularity, Gang, Hacknet)
 * ✓ Time played (temps de jeu)
 * ✓ Auto-tail automatique (se rafraîchit seul)
 * ✓ Adaptatif selon APIs disponibles
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   run dashboard.js
 *   // S'affiche et se rafraîchit automatiquement !
 */

import { CONFIG } from "/lib/constants.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎨 DASHBOARD PREMIUM - MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.clearLog();
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 ÉTAT GLOBAL
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const state = {
        startTime: Date.now(),
        maxProfit: 0,
        lastProfit: 0,
        profitSamples: [],
        lastUpdate: 0
    };
    
    // Détection des APIs disponibles
    const apis = detectAPIs(ns);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔄 BOUCLE PRINCIPALE (AUTO-REFRESH)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const REFRESH_RATE = CONFIG.SYSTEM?.REFRESH_RATE || 1000;
    
    while (true) {
        // Effacer et redessiner
        ns.clearLog();
        
        // Collecter les données
        const data = collectData(ns, state, apis);
        
        // Dessiner le dashboard
        drawDashboard(ns, data);
        
        // Attendre avant refresh
        await ns.sleep(REFRESH_RATE);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔍 DÉTECTION DES APIS DISPONIBLES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function detectAPIs(ns) {
    const apis = {
        formulas: false,
        tix: false,
        singularity: false,
        gang: false,
        hacknet: false
    };
    
    // Formulas.exe
    try {
        if (ns.fileExists("Formulas.exe", "home")) {
            apis.formulas = true;
        }
    } catch (e) {}
    
    // TIX API
    try {
        ns.stock.getSymbols();
        apis.tix = true;
    } catch (e) {}
    
    // Singularity API
    try {
        ns.singularity.getCurrentWork();
        apis.singularity = true;
    } catch (e) {}
    
    // Gang API
    try {
        const gangInfo = ns.gang.getGangInformation();
        if (gangInfo) apis.gang = true;
    } catch (e) {}
    
    // Hacknet
    try {
        const numNodes = ns.hacknet.numNodes();
        if (numNodes > 0) apis.hacknet = true;
    } catch (e) {}
    
    return apis;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📊 COLLECTE DES DONNÉES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function collectData(ns, state, apis) {
    const data = {};
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // PLAYER & BITNODE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const player = ns.getPlayer();
    data.level = player.skills.hacking;
    
    // BitNode info
    try {
        const resetInfo = ns.getResetInfo();
        data.bitnode = `BN ${resetInfo.currentNode}.${resetInfo.ownedSF.get(resetInfo.currentNode) || 1}`;
    } catch (e) {
        data.bitnode = "BN ?.?";
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // FINANCE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    data.capital = player.money;
    
    // Calculer profit/s
    const now = Date.now();
    if (state.lastUpdate > 0) {
        const deltaTime = (now - state.lastUpdate) / 1000; // secondes
        const deltaMoney = player.money - state.lastProfit;
        const profitPerSec = deltaMoney / deltaTime;
        
        data.profit = Math.max(0, profitPerSec);
        
        // Track max profit
        if (data.profit > state.maxProfit) {
            state.maxProfit = data.profit;
        }
    } else {
        data.profit = 0;
    }
    
    data.maxProfit = state.maxProfit;
    state.lastProfit = player.money;
    state.lastUpdate = now;
    
    // Bourse
    if (apis.tix) {
        data.stockProfit = calculateStockProfit(ns);
        data.stockValue = calculateStockValue(ns);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // XP
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Calculer XP/s (approximatif)
    data.xpRate = 0; // TODO: Tracker XP si nécessaire
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // NETWORK & RAM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const allServers = scanAll(ns);
    data.serversTotal = allServers.length;
    data.serversRooted = allServers.filter(s => ns.hasRootAccess(s)).length;
    
    // Compter nodes (nexus-node-*)
    const nodePrefix = CONFIG.MANAGERS?.PSERV_PREFIX || "nexus-node-";
    const nodes = allServers.filter(s => s.startsWith(nodePrefix));
    data.nodesOnline = nodes.filter(s => ns.serverExists(s)).length;
    data.nodesTotal = 25; // Max dans BitBurner
    
    // RAM totale du réseau
    let totalRam = 0;
    let usedRam = 0;
    
    for (const server of allServers) {
        if (ns.hasRootAccess(server)) {
            totalRam += ns.getServerMaxRam(server);
            usedRam += ns.getServerUsedRam(server);
        }
    }
    
    data.totalRam = totalRam;
    data.usedRam = usedRam;
    data.ramPercent = totalRam > 0 ? (usedRam / totalRam) : 0;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // THREADS ACTIFS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const threads = countThreads(ns, allServers);
    data.threadsHack = threads.hack;
    data.threadsGrow = threads.grow;
    data.threadsWeaken = threads.weaken;
    data.threadsShare = threads.share;
    data.threadsTotal = threads.total;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // TARGET STATUS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    data.targets = getTopTargets(ns, 3);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SUB-SYSTEMS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (apis.singularity) {
        data.currentAction = getCurrentAction(ns);
    }
    
    if (apis.gang) {
        data.gangInfo = getGangInfo(ns);
    }
    
    if (apis.hacknet) {
        data.hacknetInfo = getHacknetInfo(ns);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // TIME
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const uptime = now - state.startTime;
    data.uptime = formatTime(uptime);
    
    data.currentTime = new Date().toLocaleTimeString("fr-FR");
    
    return data;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🎨 DESSINER LE DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function drawDashboard(ns, data) {
    const width = 58;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const title = "NEXUS-APEX";
    const time = data.currentTime;
    const levelInfo = `LVL ${data.level} (${data.bitnode})`;
    
    // Construire la ligne header
    const headerContent = `${title} ─ ${time} ─ ${levelInfo}`;
    const padding = Math.max(0, width - 4 - headerContent.length);
    const headerLine = `┌── ${headerContent}${" ".repeat(padding)}┐`;
    
    ns.print(headerLine);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION: CAPITAL & PROFIT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`│ 💰 CAPITAL : ${formatMoney(data.capital).padEnd(width - 16)}│`);
    
    const profitLine = `📈 PROFIT  : ${formatMoney(data.profit)}/s [REC: ${formatMoney(data.maxProfit)}/s]`;
    ns.print(`│ ${profitLine.padEnd(width - 4)}│`);
    
    // Bourse si disponible
    if (data.stockProfit !== undefined) {
        const stockLine = `💹 BOURSE  : ${formatMoney(data.stockProfit)}/s | Portfolio: ${formatMoney(data.stockValue)}`;
        ns.print(`│ ${stockLine.padEnd(width - 4)}│`);
    } else {
        ns.print(`│ 💹 BOURSE  : ${"LOCKED (TIX API Requise)".padEnd(width - 16)}│`);
    }
    
    const xpLine = `✨ XP RATE : ${formatNumber(data.xpRate)}/s`;
    ns.print(`│ ${xpLine.padEnd(width - 4)}│`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SEPARATOR
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`├${"─".repeat(width - 2)}┤`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION: NETWORK & RAM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const nodesLine = `🌐 NODES   : ${data.nodesOnline} / ${data.nodesTotal} Online`;
    ns.print(`│ ${nodesLine.padEnd(width - 4)}│`);
    
    const ramLine = `💾 NETWORK : ${ns.formatRam(data.usedRam)} / ${ns.formatRam(data.totalRam)} (${(data.ramPercent * 100).toFixed(1)}%)`;
    ns.print(`│ ${ramLine.padEnd(width - 4)}│`);
    
    // Barre de progression
    const barWidth = width - 6;
    const filledWidth = Math.round(barWidth * data.ramPercent);
    const bar = `[${"█".repeat(filledWidth)}${"░".repeat(barWidth - filledWidth)}]`;
    ns.print(`│ ${bar.padEnd(width - 4)}│`);
    
    // Threads
    const threadsLine = `⚙️ THREADS : 💸H:${formatNumber(data.threadsHack, true)}  💪G:${formatNumber(data.threadsGrow, true)}  🛡️W:${formatNumber(data.threadsWeaken, true)}`;
    ns.print(`│ ${threadsLine.padEnd(width - 4)}│`);
    
    // Rep boost si share actif
    if (data.threadsShare > 0) {
        const repBoost = 1 + (data.threadsShare * 0.001); // Approximation
        const repLine = `✨ REP     : x${repBoost.toFixed(3)} (${formatNumber(data.threadsShare, true)} threads)`;
        ns.print(`│ ${repLine.padEnd(width - 4)}│`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION: TARGET STATUS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (data.targets && data.targets.length > 0) {
        const sectionTitle = "TARGET STATUS";
        const sectionPadding = Math.floor((width - 2 - sectionTitle.length) / 2);
        ns.print(`├${"─".repeat(sectionPadding)} ${sectionTitle} ${"─".repeat(width - 2 - sectionPadding - sectionTitle.length - 2)}┤`);
        
        for (const target of data.targets) {
            const icon = target.status === "ready" ? "💸" : "🛡️";
            const name = target.name.substring(0, 10).toUpperCase().padEnd(10);
            const moneyPct = `M:${(target.moneyPercent * 100).toFixed(0)}%`.padStart(7);
            const secDiff = `S:${target.securityDiff >= 0 ? "+" : ""}${target.securityDiff.toFixed(1)}`.padStart(8);
            const eta = `ETA: ${target.eta}`.padStart(12);
            
            const targetLine = `${icon} ${name} | ${moneyPct} ${secDiff} | ${eta}`;
            ns.print(`│ ${targetLine.padEnd(width - 4)}│`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION: SUB-SYSTEMS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const hasSubsystems = data.currentAction || data.gangInfo || data.hacknetInfo;
    
    if (hasSubsystems) {
        const sectionTitle = "SUB-SYSTEMS";
        const sectionPadding = Math.floor((width - 2 - sectionTitle.length) / 2);
        ns.print(`├${"─".repeat(sectionPadding)} ${sectionTitle} ${"─".repeat(width - 2 - sectionPadding - sectionTitle.length - 2)}┤`);
        
        if (data.currentAction) {
            const actionLine = `🎯 ACTION  : ${data.currentAction}`;
            ns.print(`│ ${actionLine.padEnd(width - 4)}│`);
        }
        
        if (data.gangInfo) {
            const gangLine = `🔪 GANG    : ${formatMoney(data.gangInfo.moneyPerSec)}/s | Respect: ${formatNumber(data.gangInfo.respectPerSec)}/s`;
            ns.print(`│ ${gangLine.padEnd(width - 4)}│`);
        }
        
        if (data.hacknetInfo) {
            const hacknetLine = `🖥️ HACKNET : ${data.hacknetInfo.numNodes} Nodes | Hash: ${formatNumber(data.hacknetInfo.hashRate)}/s`;
            ns.print(`│ ${hacknetLine.padEnd(width - 4)}│`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    ns.print(`├${"─".repeat(width - 2)}┤`);
    
    const uptimeLine = `⏳ UPTIME : ${data.uptime}`;
    ns.print(`│ ${uptimeLine.padEnd(width - 4)}│`);
    
    ns.print(`└${"─".repeat(width - 2)}┘`);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🛠️ FONCTIONS UTILITAIRES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Scanner récursif de tous les serveurs
 */
function scanAll(ns) {
    const visited = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        
        const neighbors = ns.scan(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }
    
    return Array.from(visited);
}

/**
 * Compter les threads par type
 */
function countThreads(ns, servers) {
    const threads = {
        hack: 0,
        grow: 0,
        weaken: 0,
        share: 0,
        total: 0
    };
    
    for (const server of servers) {
        const processes = ns.ps(server);
        
        for (const proc of processes) {
            const filename = proc.filename.toLowerCase();
            
            if (filename.includes("hack.js")) {
                threads.hack += proc.threads;
            } else if (filename.includes("grow.js")) {
                threads.grow += proc.threads;
            } else if (filename.includes("weaken.js")) {
                threads.weaken += proc.threads;
            } else if (filename.includes("share.js")) {
                threads.share += proc.threads;
            }
            
            threads.total += proc.threads;
        }
    }
    
    return threads;
}

/**
 * Obtenir les top cibles
 */
function getTopTargets(ns, count = 3) {
    const allServers = scanAll(ns);
    const targets = [];
    
    for (const server of allServers) {
        if (server === "home" || server.startsWith("nexus-node-") || server.startsWith("pserv-")) {
            continue;
        }
        
        if (!ns.hasRootAccess(server)) continue;
        
        const maxMoney = ns.getServerMaxMoney(server);
        if (maxMoney === 0) continue;
        
        const reqLevel = ns.getServerRequiredHackingLevel(server);
        const playerLevel = ns.getHackingLevel();
        if (reqLevel > playerLevel) continue;
        
        const currentMoney = ns.getServerMoneyAvailable(server);
        const moneyPercent = maxMoney > 0 ? currentMoney / maxMoney : 0;
        
        const currentSec = ns.getServerSecurityLevel(server);
        const minSec = ns.getServerMinSecurityLevel(server);
        const secDiff = currentSec - minSec;
        
        const status = (moneyPercent >= 0.95 && secDiff <= 1) ? "ready" : "prep";
        
        // ETA approximatif (5-10 min pour les non-ready)
        let eta = "Ready";
        if (status === "prep") {
            const estMinutes = Math.ceil(5 + (secDiff * 0.5));
            eta = `${estMinutes}m`;
        }
        
        targets.push({
            name: server,
            maxMoney: maxMoney,
            moneyPercent: moneyPercent,
            securityDiff: secDiff,
            status: status,
            eta: eta
        });
    }
    
    // Trier par max money
    targets.sort((a, b) => b.maxMoney - a.maxMoney);
    
    return targets.slice(0, count);
}

/**
 * Action actuelle (Singularity)
 */
function getCurrentAction(ns) {
    try {
        const work = ns.singularity.getCurrentWork();
        if (!work) return "🏠 Idle";
        
        const type = work.type;
        
        if (type === "COMPANY") {
            return `💼 ${work.companyName}`;
        } else if (type === "FACTION") {
            return `🎖️ ${work.factionName} (${work.factionWorkType})`;
        } else if (type === "CLASS") {
            const className = work.classType.replace("_", " ");
            return `🎓 University (${className})`;
        } else if (type === "CRIME") {
            return `🔫 Crime (${work.crimeType})`;
        } else if (type === "GRAFTING") {
            return `🧬 Grafting (${work.augmentation})`;
        } else {
            return `⚙️ ${type}`;
        }
    } catch (e) {
        return null;
    }
}

/**
 * Info Gang
 */
function getGangInfo(ns) {
    try {
        const gangInfo = ns.gang.getGangInformation();
        
        const moneyPerSec = gangInfo.moneyGainRate * 5; // Par cycle (5s)
        const respectPerSec = gangInfo.respect;
        
        return {
            moneyPerSec: moneyPerSec,
            respectPerSec: respectPerSec
        };
    } catch (e) {
        return null;
    }
}

/**
 * Info Hacknet
 */
function getHacknetInfo(ns) {
    try {
        const numNodes = ns.hacknet.numNodes();
        if (numNodes === 0) return null;
        
        let totalHashRate = 0;
        for (let i = 0; i < numNodes; i++) {
            const nodeStats = ns.hacknet.getNodeStats(i);
            totalHashRate += nodeStats.production;
        }
        
        return {
            numNodes: numNodes,
            hashRate: totalHashRate
        };
    } catch (e) {
        return null;
    }
}

/**
 * Calculer profit bourse
 */
function calculateStockProfit(ns) {
    try {
        const symbols = ns.stock.getSymbols();
        let totalProfit = 0;
        
        for (const sym of symbols) {
            const position = ns.stock.getPosition(sym);
            if (position[0] > 0) { // Long position
                const shares = position[0];
                const avgPrice = position[1];
                const currentPrice = ns.stock.getPrice(sym);
                
                const profit = (currentPrice - avgPrice) * shares;
                totalProfit += profit;
            }
        }
        
        // Approximation de profit/s
        return totalProfit / 3600; // Très approximatif
    } catch (e) {
        return 0;
    }
}

/**
 * Calculer valeur portfolio
 */
function calculateStockValue(ns) {
    try {
        const symbols = ns.stock.getSymbols();
        let totalValue = 0;
        
        for (const sym of symbols) {
            const position = ns.stock.getPosition(sym);
            if (position[0] > 0) {
                const shares = position[0];
                const currentPrice = ns.stock.getPrice(sym);
                totalValue += shares * currentPrice;
            }
        }
        
        return totalValue;
    } catch (e) {
        return 0;
    }
}

/**
 * Formater un montant d'argent
 */
function formatMoney(amount) {
    if (amount >= 1e15) return `$${(amount / 1e15).toFixed(3)}q`;
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(3)}t`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(3)}b`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(3)}m`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(3)}k`;
    return `$${amount.toFixed(0)}`;
}

/**
 * Formater un nombre
 */
function formatNumber(num, compact = false) {
    if (compact) {
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}m`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}k`;
        return num.toFixed(0);
    }
    
    if (num >= 1e9) return `${(num / 1e9).toFixed(3)}b`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(3)}m`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(3)}k`;
    return num.toFixed(0);
}

/**
 * Formater un temps en h:m:s
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const s = seconds % 60;
    const m = minutes % 60;
    const h = hours;
    
    return `${h}h ${m}m ${s}s`;
}
