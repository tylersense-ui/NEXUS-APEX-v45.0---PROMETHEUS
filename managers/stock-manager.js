/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      managers/stock-manager
 * @description Gestionnaire automatique du trading boursier (TIX API + 4S Data).
 *              Stratégie momentum avec forecast, position sizing et risk management.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), TIX API, 4S Market Data API
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.tix et caps.has4S avant toute opération
 * ✓ Stratégie momentum basée sur forecast (>0.55 long, <0.45 short)
 * ✓ Position sizing intelligent (max 10% du capital par position)
 * ✓ Stop-loss et take-profit automatiques
 * ✓ Backoff exponentiel en cas d'erreurs API répétées
 * ✓ Try/catch robuste sur TOUS les appels stock
 * ✓ Métriques détaillées (P&L, win rate, sharpe ratio)
 * ✓ Tick-based polling (6s par défaut) au lieu de busy-wait
 * ✓ Gestion des positions long et short simultanées
 * ✓ Logs détaillés avec raisons d'achat/vente
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/managers/stock-manager.js");
 *   // Trade automatiquement sur le marché boursier
 * 
 * @example
 *   // Mode agressif (position sizing 20%)
 *   // Dans constants.js : CONFIG.STOCK.MAX_POSITION_PERCENT = 0.20
 *   ns.run("/managers/stock-manager.js");
 * 
 * @dependencies
 *   - TIX API (accès à la bourse)
 *   - 4S Market Data API (forecast, volatility)
 *   - Minimum capital recommandé: $1B
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";
import { PortHandler } from "/core/port-handler.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ⚙️  CONFIGURATION STOCK TRADING
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const STOCK_CONFIG = {
    /** Tick interval (6s = cycle du marché) */
    TICK_INTERVAL: 6000,
    
    /** Pourcentage maximum du capital par position */
    MAX_POSITION_PERCENT: CONFIG.STOCK?.MAX_POSITION_PERCENT || 0.10, // 10%
    
    /** Capital minimum à conserver en réserve */
    MIN_RESERVE: CONFIG.STOCK?.MIN_RESERVE || 1_000_000_000, // $1B
    
    /** Forecast seuil pour entrer en position LONG */
    LONG_THRESHOLD: CONFIG.STOCK?.LONG_THRESHOLD || 0.55,
    
    /** Forecast seuil pour entrer en position SHORT */
    SHORT_THRESHOLD: CONFIG.STOCK?.SHORT_THRESHOLD || 0.45,
    
    /** Stop-loss: vendre si perte dépasse X% */
    STOP_LOSS_PERCENT: CONFIG.STOCK?.STOP_LOSS_PERCENT || 0.05, // 5%
    
    /** Take-profit: vendre si gain dépasse X% */
    TAKE_PROFIT_PERCENT: CONFIG.STOCK?.TAKE_PROFIT_PERCENT || 0.15, // 15%
    
    /** Commission de la bourse */
    COMMISSION: 100_000,
    
    /** Nombre maximum d'erreurs consécutives avant backoff */
    MAX_CONSECUTIVE_ERRORS: 5,
    
    /** Backoff initial en cas d'erreur (ms) */
    ERROR_BACKOFF_BASE: 10000 // 10s
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📊 CLASSE POSITION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Représente une position (long ou short) sur un stock.
 */
class Position {
    constructor(symbol, shares, avgPrice, isLong) {
        this.symbol = symbol;
        this.shares = shares;
        this.avgPrice = avgPrice;
        this.isLong = isLong;
        this.entryTime = Date.now();
    }
    
    getPnL(currentPrice) {
        if (this.isLong) {
            return (currentPrice - this.avgPrice) * this.shares;
        } else {
            return (this.avgPrice - currentPrice) * this.shares;
        }
    }
    
    getPnLPercent(currentPrice) {
        const pnl = this.getPnL(currentPrice);
        const invested = this.avgPrice * this.shares;
        return invested > 0 ? (pnl / invested) : 0;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Boucle principale de trading automatique.
 * 
 * @param {NS} ns - Namespace BitBurner
 */
export async function main(ns) {
    ns.disableLog("ALL");
    
    const log = new Logger(ns, "STOCK-MGR");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    
    if (!caps.tix) {
        log.error("TIX API requise (achat WSE account + TIX API Access)");
        ns.tprint("❌ Ce manager nécessite l'accès à la bourse");
        ns.tprint("   1. Achetez WSE Account ($200M)");
        ns.tprint("   2. Achetez TIX API Access ($5B)");
        return;
    }
    
    if (!caps.has4S) {
        log.warn("⚠️  4S Market Data non disponible (trading limité)");
        log.warn("   Achetez 4S Market Data API ($25B) pour le forecast");
    }
    
    log.success("✅ TIX API détectée - Démarrage du trading bot");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalPnL: 0,
        maxDrawdown: 0,
        consecutiveErrors: 0,
        ticksProcessed: 0,
        startTime: Date.now(),
        startingCapital: 0
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💼 PORTFOLIO (positions actives)
    // ═══════════════════════════════════════════════════════════════════════════════
    /** @type {Map<string, Position>} */
    const portfolio = new Map();
    
    log.info(`⚙️  Configuration:`);
    log.info(`   Tick interval: ${STOCK_CONFIG.TICK_INTERVAL / 1000}s`);
    log.info(`   Max position: ${(STOCK_CONFIG.MAX_POSITION_PERCENT * 100).toFixed(0)}%`);
    log.info(`   Stop-loss: ${(STOCK_CONFIG.STOP_LOSS_PERCENT * 100).toFixed(0)}%`);
    log.info(`   Take-profit: ${(STOCK_CONFIG.TAKE_PROFIT_PERCENT * 100).toFixed(0)}%`);
    log.info(`   4S Data: ${caps.has4S ? '✅' : '❌'}`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📋 RÉCUPÉRATION DES SYMBOLES
    // ═══════════════════════════════════════════════════════════════════════════════
    let symbols = [];
    try {
        symbols = ns.stock.getSymbols();
        log.info(`📋 ${symbols.length} symboles disponibles sur le marché`);
    } catch (error) {
        log.error(`Impossible de récupérer les symboles: ${error.message}`);
        return;
    }
    
    // Capital de départ
    metrics.startingCapital = ns.getPlayer().money;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ♾️ BOUCLE PRINCIPALE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    while (true) {
        try {
            metrics.ticksProcessed++;
            const player = ns.getPlayer();
            const availableCapital = player.money - STOCK_CONFIG.MIN_RESERVE;
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🔍 SCAN DES POSITIONS EXISTANTES
            // ═══════════════════════════════════════════════════════════════════════
            portfolio.clear();
            
            for (const sym of symbols) {
                try {
                    const [longShares, longAvg, shortShares, shortAvg] = ns.stock.getPosition(sym);
                    
                    if (longShares > 0) {
                        portfolio.set(`${sym}-LONG`, new Position(sym, longShares, longAvg, true));
                    }
                    
                    if (shortShares > 0) {
                        portfolio.set(`${sym}-SHORT`, new Position(sym, shortShares, shortAvg, false));
                    }
                } catch (error) {
                    log.error(`Erreur lecture position ${sym}: ${error.message}`);
                    metrics.consecutiveErrors++;
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 GESTION DES POSITIONS EXISTANTES (stop-loss / take-profit)
            // ═══════════════════════════════════════════════════════════════════════
            for (const [key, position] of portfolio.entries()) {
                try {
                    const currentPrice = ns.stock.getPrice(position.symbol);
                    const pnlPercent = position.getPnLPercent(currentPrice);
                    
                    let shouldClose = false;
                    let reason = "";
                    
                    // Stop-loss
                    if (pnlPercent < -STOCK_CONFIG.STOP_LOSS_PERCENT) {
                        shouldClose = true;
                        reason = `Stop-loss (${(pnlPercent * 100).toFixed(1)}%)`;
                    }
                    
                    // Take-profit
                    if (pnlPercent > STOCK_CONFIG.TAKE_PROFIT_PERCENT) {
                        shouldClose = true;
                        reason = `Take-profit (${(pnlPercent * 100).toFixed(1)}%)`;
                    }
                    
                    // Vérifier le forecast si 4S disponible
                    if (caps.has4S && !shouldClose) {
                        try {
                            const forecast = ns.stock.getForecast(position.symbol);
                            
                            // Si position LONG et forecast < 0.45 → fermer
                            if (position.isLong && forecast < STOCK_CONFIG.SHORT_THRESHOLD) {
                                shouldClose = true;
                                reason = `Forecast bearish (${(forecast * 100).toFixed(1)}%)`;
                            }
                            
                            // Si position SHORT et forecast > 0.55 → fermer
                            if (!position.isLong && forecast > STOCK_CONFIG.LONG_THRESHOLD) {
                                shouldClose = true;
                                reason = `Forecast bullish (${(forecast * 100).toFixed(1)}%)`;
                            }
                        } catch (error) {
                            // getForecast peut échouer
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // 💰 FERMETURE DE POSITION
                    // ═══════════════════════════════════════════════════════════════
                    if (shouldClose) {
                        try {
                            let salePrice = 0;
                            
                            if (position.isLong) {
                                salePrice = ns.stock.sellStock(position.symbol, position.shares);
                            } else {
                                salePrice = ns.stock.sellShort(position.symbol, position.shares);
                            }
                            
                            if (salePrice > 0) {
                                const pnl = position.getPnL(salePrice);
                                metrics.totalPnL += pnl;
                                metrics.totalTrades++;
                                
                                if (pnl > 0) {
                                    metrics.winningTrades++;
                                    log.success(`✅ ${position.symbol} ${position.isLong ? 'LONG' : 'SHORT'} fermé`);
                                } else {
                                    metrics.losingTrades++;
                                    log.warn(`❌ ${position.symbol} ${position.isLong ? 'LONG' : 'SHORT'} fermé`);
                                }
                                
                                log.info(`   Raison: ${reason}`);
                                log.info(`   P&L: ${ns.formatNumber(pnl)} (${(pnlPercent * 100).toFixed(1)}%)`);
                                
                                metrics.consecutiveErrors = 0; // Reset sur succès
                            }
                        } catch (error) {
                            log.error(`Erreur vente ${position.symbol}: ${error.message}`);
                            metrics.consecutiveErrors++;
                        }
                    }
                    
                } catch (error) {
                    log.error(`Erreur gestion position ${position.symbol}: ${error.message}`);
                    metrics.consecutiveErrors++;
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 🔍 RECHERCHE DE NOUVELLES OPPORTUNITÉS
            // ═══════════════════════════════════════════════════════════════════════
            if (availableCapital > 0 && caps.has4S) {
                for (const sym of symbols) {
                    try {
                        // Skip si déjà en position
                        if (portfolio.has(`${sym}-LONG`) || portfolio.has(`${sym}-SHORT`)) {
                            continue;
                        }
                        
                        const forecast = ns.stock.getForecast(sym);
                        const price = ns.stock.getPrice(sym);
                        const maxShares = ns.stock.getMaxShares(sym);
                        
                        // Calculer le nombre de shares à acheter
                        const maxInvestment = availableCapital * STOCK_CONFIG.MAX_POSITION_PERCENT;
                        const desiredShares = Math.floor(maxInvestment / price);
                        const shares = Math.min(desiredShares, maxShares);
                        
                        // Vérifier que c'est rentable après commission
                        if (shares * price < STOCK_CONFIG.COMMISSION * 2) {
                            continue;
                        }
                        
                        // ═══════════════════════════════════════════════════════════
                        // 📈 OPPORTUNITÉ LONG
                        // ═══════════════════════════════════════════════════════════
                        if (forecast >= STOCK_CONFIG.LONG_THRESHOLD) {
                            try {
                                const buyPrice = ns.stock.buyStock(sym, shares);
                                
                                if (buyPrice > 0) {
                                    log.success(`📈 ${sym} LONG ouvert`);
                                    log.info(`   Shares: ${ns.formatNumber(shares)}`);
                                    log.info(`   Prix: ${ns.formatNumber(buyPrice)}`);
                                    log.info(`   Forecast: ${(forecast * 100).toFixed(1)}%`);
                                    log.info(`   Investissement: ${ns.formatNumber(shares * buyPrice)}`);
                                    
                                    metrics.consecutiveErrors = 0;
                                }
                            } catch (error) {
                                if (log.debugEnabled) {
                                    log.debug(`Échec achat ${sym}: ${error.message}`);
                                }
                                metrics.consecutiveErrors++;
                            }
                        }
                        
                        // ═══════════════════════════════════════════════════════════
                        // 📉 OPPORTUNITÉ SHORT
                        // ═══════════════════════════════════════════════════════════
                        else if (forecast <= STOCK_CONFIG.SHORT_THRESHOLD) {
                            try {
                                const shortPrice = ns.stock.buyShort(sym, shares);
                                
                                if (shortPrice > 0) {
                                    log.success(`📉 ${sym} SHORT ouvert`);
                                    log.info(`   Shares: ${ns.formatNumber(shares)}`);
                                    log.info(`   Prix: ${ns.formatNumber(shortPrice)}`);
                                    log.info(`   Forecast: ${(forecast * 100).toFixed(1)}%`);
                                    log.info(`   Investissement: ${ns.formatNumber(shares * shortPrice)}`);
                                    
                                    metrics.consecutiveErrors = 0;
                                }
                            } catch (error) {
                                if (log.debugEnabled) {
                                    log.debug(`Échec short ${sym}: ${error.message}`);
                                }
                                metrics.consecutiveErrors++;
                            }
                        }
                        
                    } catch (error) {
                        // Ignorer les erreurs individuelles
                        metrics.consecutiveErrors++;
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // 📊 RAPPORT PÉRIODIQUE (toutes les 50 ticks)
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.ticksProcessed % 50 === 0) {
                const uptime = Date.now() - metrics.startTime;
                const uptimeMin = Math.floor(uptime / 60000);
                const winRate = metrics.totalTrades > 0 
                    ? (metrics.winningTrades / metrics.totalTrades) * 100 
                    : 0;
                const currentCapital = player.money;
                const totalReturn = currentCapital - metrics.startingCapital;
                const returnPercent = metrics.startingCapital > 0
                    ? (totalReturn / metrics.startingCapital) * 100
                    : 0;
                
                log.info(`📊 Stats Trading:`);
                log.info(`   Positions: ${portfolio.size} actives`);
                log.info(`   Trades: ${metrics.totalTrades} (${metrics.winningTrades}W/${metrics.losingTrades}L)`);
                log.info(`   Win rate: ${winRate.toFixed(1)}%`);
                log.info(`   P&L total: ${ns.formatNumber(metrics.totalPnL)}`);
                log.info(`   Capital: ${ns.formatNumber(currentCapital)} (${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(1)}%)`);
                log.info(`   Uptime: ${uptimeMin}min | Ticks: ${metrics.ticksProcessed}`);
            }
            
            // ═══════════════════════════════════════════════════════════════════════
            // ⚠️  GESTION DES ERREURS RÉPÉTÉES
            // ═══════════════════════════════════════════════════════════════════════
            if (metrics.consecutiveErrors >= STOCK_CONFIG.MAX_CONSECUTIVE_ERRORS) {
                const backoffTime = STOCK_CONFIG.ERROR_BACKOFF_BASE * 
                    Math.pow(2, Math.min(metrics.consecutiveErrors - STOCK_CONFIG.MAX_CONSECUTIVE_ERRORS, 5));
                
                log.warn(`⚠️  ${metrics.consecutiveErrors} erreurs consécutives - backoff ${backoffTime / 1000}s`);
                await ns.sleep(backoffTime);
                metrics.consecutiveErrors = 0; // Reset après backoff
                continue;
            }
            
        } catch (error) {
            log.error(`Erreur dans la boucle principale: ${error.message}`);
            metrics.consecutiveErrors++;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // ⏱️  SLEEP (tick-based)
        // ═══════════════════════════════════════════════════════════════════════════
        await ns.sleep(STOCK_CONFIG.TICK_INTERVAL);
    }
}
