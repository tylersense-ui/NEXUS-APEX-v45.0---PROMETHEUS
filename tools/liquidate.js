/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/liquidate
 * @description Liquide tous les assets (stocks, serveurs) pour convertir en cash.
 *              Utile avant une augmentation ou pour reset complet.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vente de toutes les positions boursières (long + short)
 * ✓ Suppression de tous les serveurs achetés
 * ✓ Confirmation obligatoire (--force pour skip)
 * ✓ Mode dry-run (--dry-run) pour preview
 * ✓ Calcul du cash total récupéré
 * ✓ Vérification caps.tix avant vente stocks
 * ✓ Try/catch robuste sur toutes les opérations
 * ✓ Rapport détaillé (items vendus, cash gagné)
 * ✓ Protection contre liquidations accidentelles
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/liquidate.js");
 *   ns.run("/tools/liquidate.js", 1, "--dry-run");
 *   ns.run("/tools/liquidate.js", 1, "--force");
 * 
 * @args
 *   --dry-run          Simulate liquidation (no actual actions)
 *   --force            Skip confirmation prompt
 *   --stocks           Liquidate stocks only
 *   --servers          Liquidate servers only
 *   --help             Show this help
 * 
 * @example
 *   // Preview avant liquidation
 *   ns.run("/tools/liquidate.js", 1, "--dry-run");
 * 
 * @example
 *   // Liquider seulement les stocks
 *   ns.run("/tools/liquidate.js", 1, "--stocks", "--force");
 */

import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: PARSE ARGUMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function parseArgs(args) {
    const config = {
        dryRun: false,
        force: false,
        stocksOnly: false,
        serversOnly: false,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--dry-run") {
            config.dryRun = true;
        } else if (arg === "--force") {
            config.force = true;
        } else if (arg === "--stocks") {
            config.stocksOnly = true;
        } else if (arg === "--servers") {
            config.serversOnly = true;
        } else if (arg === "--help") {
            config.help = true;
        }
    }
    
    return config;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: AFFICHER L'AIDE
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function showHelp(ns) {
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  PROMETHEUS Asset Liquidator v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/liquidate.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --dry-run          Simulate liquidation (no actions)");
    ns.tprint("  --force            Skip confirmation prompt");
    ns.tprint("  --stocks           Liquidate stocks only");
    ns.tprint("  --servers          Liquidate servers only");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("DESCRIPTION:");
    ns.tprint("  Sell all stocks and delete all purchased servers.");
    ns.tprint("  Use before augmentation installation to maximize cash.");
    ns.tprint("");
    ns.tprint("EXAMPLES:");
    ns.tprint("  run /tools/liquidate.js --dry-run");
    ns.tprint("  run /tools/liquidate.js --stocks --force");
    ns.tprint("  run /tools/liquidate.js --force");
    ns.tprint("");
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 MAIN FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
export async function main(ns) {
    const config = parseArgs(ns.args);
    
    if (config.help) {
        showHelp(ns);
        return;
    }
    
    const log = new Logger(ns, "LIQUIDATE");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  💰 PROMETHEUS Asset Liquidator v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    if (config.dryRun) {
        ns.tprint("⚠️  MODE DRY-RUN ACTIVÉ (simulation uniquement)");
        ns.tprint("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    const player = ns.getPlayer();
    const startingCash = player.money;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const metrics = {
        stockPositions: 0,
        stocksSold: 0,
        stocksCash: 0,
        serversDeleted: 0,
        serversCash: 0,
        totalCash: 0
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📈 SCAN DES POSITIONS BOURSIÈRES
    // ═══════════════════════════════════════════════════════════════════════════════
    const stockPositions = [];
    
    if (caps.tix && !config.serversOnly) {
        try {
            const symbols = ns.stock.getSymbols();
            
            for (const sym of symbols) {
                const [longShares, longAvg, shortShares, shortAvg] = ns.stock.getPosition(sym);
                const price = ns.stock.getPrice(sym);
                
                if (longShares > 0) {
                    const value = longShares * price;
                    stockPositions.push({
                        symbol: sym,
                        type: "LONG",
                        shares: longShares,
                        avgPrice: longAvg,
                        currentPrice: price,
                        value: value
                    });
                    metrics.stockPositions++;
                }
                
                if (shortShares > 0) {
                    const value = shortShares * price;
                    stockPositions.push({
                        symbol: sym,
                        type: "SHORT",
                        shares: shortShares,
                        avgPrice: shortAvg,
                        currentPrice: price,
                        value: value
                    });
                    metrics.stockPositions++;
                }
            }
        } catch (error) {
            ns.tprint(`⚠️  Erreur scan stocks: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🖥️  SCAN DES SERVEURS ACHETÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    let purchasedServers = [];
    
    if (!config.stocksOnly) {
        try {
            purchasedServers = ns.getPurchasedServers();
        } catch (error) {
            ns.tprint(`⚠️  Erreur scan serveurs: ${error.message}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 AFFICHAGE DU PLAN
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("📋 Plan de liquidation:");
    ns.tprint("");
    
    if (stockPositions.length > 0) {
        ns.tprint(`📈 Positions boursières: ${stockPositions.length}`);
        
        const totalStockValue = stockPositions.reduce((sum, pos) => sum + pos.value, 0);
        ns.tprint(`   Valeur totale: ${ns.formatNumber(totalStockValue)}`);
        
        // Afficher top 5
        const topPositions = [...stockPositions]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        for (const pos of topPositions) {
            const pnl = pos.type === "LONG" 
                ? (pos.currentPrice - pos.avgPrice) * pos.shares
                : (pos.avgPrice - pos.currentPrice) * pos.shares;
            const pnlPercent = pos.avgPrice > 0 ? (pnl / (pos.avgPrice * pos.shares)) * 100 : 0;
            
            ns.tprint(`   ${pos.symbol} ${pos.type}: ${ns.formatNumber(pos.shares)} shares @ ${ns.formatNumber(pos.currentPrice)}`);
            ns.tprint(`     Valeur: ${ns.formatNumber(pos.value)} | P&L: ${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`);
        }
        
        if (stockPositions.length > 5) {
            ns.tprint(`   ... et ${stockPositions.length - 5} autres positions`);
        }
        ns.tprint("");
    }
    
    if (purchasedServers.length > 0) {
        ns.tprint(`🖥️  Serveurs achetés: ${purchasedServers.length}`);
        
        let totalRAM = 0;
        for (const server of purchasedServers) {
            totalRAM += ns.getServerMaxRam(server);
        }
        
        ns.tprint(`   RAM totale: ${ns.formatRam(totalRAM)}`);
        ns.tprint(`   Note: Les serveurs seront supprimés (pas de remboursement)`);
        ns.tprint("");
    }
    
    if (stockPositions.length === 0 && purchasedServers.length === 0) {
        ns.tprint("✅ Aucun asset à liquider");
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ⚠️  CONFIRMATION (si pas --force et pas --dry-run)
    // ═══════════════════════════════════════════════════════════════════════════════
    if (!config.force && !config.dryRun) {
        ns.tprint("═══════════════════════════════════════════════════════════════");
        ns.tprint("⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE");
        ns.tprint("");
        ns.tprint(`   - ${stockPositions.length} positions boursières seront vendues`);
        ns.tprint(`   - ${purchasedServers.length} serveurs seront supprimés`);
        ns.tprint("");
        ns.tprint("   Utilisez --dry-run pour simuler ou --force pour confirmer");
        ns.tprint("═══════════════════════════════════════════════════════════════");
        ns.tprint("");
        ns.tprint("❌ Opération annulée (utilisez --force pour confirmer)");
        return;
    }
    
    if (config.dryRun) {
        ns.tprint("✅ Simulation terminée (aucune action effectuée)");
        ns.tprint("   Utilisez --force pour liquider réellement");
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💰 LIQUIDATION DES STOCKS
    // ═══════════════════════════════════════════════════════════════════════════════
    if (stockPositions.length > 0) {
        ns.tprint("💰 Liquidation des positions boursières...");
        ns.tprint("");
        
        for (const pos of stockPositions) {
            try {
                let salePrice = 0;
                
                if (pos.type === "LONG") {
                    salePrice = ns.stock.sellStock(pos.symbol, pos.shares);
                } else {
                    salePrice = ns.stock.sellShort(pos.symbol, pos.shares);
                }
                
                if (salePrice > 0) {
                    const proceeds = pos.shares * salePrice;
                    metrics.stocksSold++;
                    metrics.stocksCash += proceeds;
                    
                    log.success(`✅ ${pos.symbol} ${pos.type}: ${ns.formatNumber(proceeds)}`);
                } else {
                    log.warn(`❌ ${pos.symbol} ${pos.type}: échec vente`);
                }
                
            } catch (error) {
                log.error(`❌ ${pos.symbol}: ${error.message}`);
            }
        }
        
        ns.tprint("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🗑️  SUPPRESSION DES SERVEURS
    // ═══════════════════════════════════════════════════════════════════════════════
    if (purchasedServers.length > 0) {
        ns.tprint("🗑️  Suppression des serveurs achetés...");
        ns.tprint("");
        
        for (const server of purchasedServers) {
            try {
                const deleted = ns.deleteServer(server);
                
                if (deleted) {
                    metrics.serversDeleted++;
                    log.info(`✅ ${server} supprimé`);
                } else {
                    log.warn(`❌ ${server}: échec suppression`);
                }
                
            } catch (error) {
                log.error(`❌ ${server}: ${error.message}`);
            }
        }
        
        ns.tprint("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RAPPORT FINAL
    // ═══════════════════════════════════════════════════════════════════════════════
    const endingCash = ns.getPlayer().money;
    const cashGained = endingCash - startingCash;
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("📊 Résultat de la liquidation:");
    ns.tprint("");
    ns.tprint(`📈 Stocks:`);
    ns.tprint(`   Positions vendues: ${metrics.stocksSold}/${metrics.stockPositions}`);
    ns.tprint(`   Cash récupéré: ${ns.formatNumber(metrics.stocksCash)}`);
    ns.tprint("");
    ns.tprint(`🖥️  Serveurs:`);
    ns.tprint(`   Serveurs supprimés: ${metrics.serversDeleted}/${purchasedServers.length}`);
    ns.tprint("");
    ns.tprint(`💰 Total:`);
    ns.tprint(`   Cash avant: ${ns.formatNumber(startingCash)}`);
    ns.tprint(`   Cash après: ${ns.formatNumber(endingCash)}`);
    ns.tprint(`   Cash gagné: ${ns.formatNumber(cashGained)}`);
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    if (metrics.stocksSold === metrics.stockPositions && metrics.serversDeleted === purchasedServers.length) {
        ns.tprint("✅ Liquidation terminée avec succès");
    } else {
        ns.tprint("⚠️  Liquidation partielle - vérifiez les erreurs ci-dessus");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
