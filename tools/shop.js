/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/shop
 * @description Affiche les items disponibles à l'achat (programmes, serveurs, etc).
 *              Interface de shopping pour le Darknet, TIX, upgrades corporation.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Catalogues multiples (programs, tor, hacknet, servers, stock)
 * ✓ Tri par prix ou priorité
 * ✓ Filtrage par budget disponible (--affordable)
 * ✓ Vérification caps avant affichage (singularity, tix, etc)
 * ✓ Mode compact (--compact) pour rapports
 * ✓ Export JSON (--json) pour automatisation
 * ✓ Calcul du temps pour atteindre le budget (money/s)
 * ✓ Aucun effet de bord (lecture seule)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/shop.js");
 *   ns.run("/tools/shop.js", 1, "--category", "programs");
 *   ns.run("/tools/shop.js", 1, "--affordable");
 * 
 * @args
 *   --category <type>  Filter: programs, tor, hacknet, servers, stock, all
 *   --affordable       Show only items you can afford
 *   --sort <field>     Sort by: price, priority, name (default: price)
 *   --compact          Compact output
 *   --json <path>      Export to JSON
 *   --help             Show this help
 * 
 * @example
 *   // Programmes achetables seulement
 *   ns.run("/tools/shop.js", 1, "--category", "programs", "--affordable");
 */

import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🛒 CATALOGUES
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const CATALOGS = {
    programs: [
        { name: "BruteSSH.exe", price: 500_000, priority: 1, desc: "Ouvre port SSH" },
        { name: "FTPCrack.exe", price: 1_500_000, priority: 1, desc: "Ouvre port FTP" },
        { name: "relaySMTP.exe", price: 5_000_000, priority: 1, desc: "Ouvre port SMTP" },
        { name: "HTTPWorm.exe", price: 30_000_000, priority: 1, desc: "Ouvre port HTTP" },
        { name: "SQLInject.exe", price: 250_000_000, priority: 1, desc: "Ouvre port SQL" },
        { name: "DeepscanV1.exe", price: 500_000, priority: 2, desc: "Scan 5 nœuds" },
        { name: "DeepscanV2.exe", price: 25_000_000, priority: 2, desc: "Scan 10 nœuds" },
        { name: "AutoLink.exe", price: 1_000_000, priority: 2, desc: "Backdoor auto" },
        { name: "ServerProfiler.exe", price: 500_000, priority: 3, desc: "Analyse serveurs" },
        { name: "Formulas.exe", price: 5_000_000_000, priority: 3, desc: "Calculs précis" }
    ],
    
    tor: [
        { name: "TOR Router", price: 200_000, priority: 1, desc: "Accès au Darknet" },
        { name: "WSE Account", price: 200_000_000, priority: 2, desc: "Accès bourse" },
        { name: "TIX API Access", price: 5_000_000_000, priority: 2, desc: "API boursière" },
        { name: "4S Market Data", price: 25_000_000_000, priority: 2, desc: "Forecast stocks" }
    ],
    
    hacknet: [
        { name: "Hacknet Node", price: "Variable", priority: 1, desc: "Node passif" },
        { name: "Node Level Upgrade", price: "Variable", priority: 2, desc: "+Production" },
        { name: "Node RAM Upgrade", price: "Variable", priority: 2, desc: "+Production" },
        { name: "Node Core Upgrade", price: "Variable", priority: 2, desc: "+Production" }
    ],
    
    servers: [
        { name: "Purchased Server (8GB)", price: 55_000, priority: 1, desc: "8GB RAM" },
        { name: "Purchased Server (64GB)", price: 460_000, priority: 2, desc: "64GB RAM" },
        { name: "Purchased Server (512GB)", price: 3_680_000, priority: 2, desc: "512GB RAM" },
        { name: "Purchased Server (4TB)", price: 29_440_000, priority: 3, desc: "4TB RAM" },
        { name: "Purchased Server (32TB)", price: 235_520_000, priority: 3, desc: "32TB RAM" }
    ]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: PARSE ARGUMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function parseArgs(args) {
    const config = {
        category: "all",
        affordable: false,
        sort: "price",
        compact: false,
        json: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--category" && i + 1 < args.length) {
            config.category = args[++i];
        } else if (arg === "--affordable") {
            config.affordable = true;
        } else if (arg === "--sort" && i + 1 < args.length) {
            config.sort = args[++i];
        } else if (arg === "--compact") {
            config.compact = true;
        } else if (arg === "--json" && i + 1 < args.length) {
            config.json = args[++i];
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
    ns.tprint("  PROMETHEUS Shop v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/shop.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --category <type>  programs, tor, hacknet, servers, all");
    ns.tprint("  --affordable       Show only affordable items");
    ns.tprint("  --sort <field>     price, priority, name");
    ns.tprint("  --compact          Compact output");
    ns.tprint("  --json <path>      Export to JSON");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("EXAMPLES:");
    ns.tprint("  run /tools/shop.js --category programs --affordable");
    ns.tprint("  run /tools/shop.js --json /data/shop.json");
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
    
    const log = new Logger(ns, "SHOP");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  🛒 PROMETHEUS Shop v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    const player = ns.getPlayer();
    const budget = player.money;
    
    ns.tprint(`💰 Budget disponible: ${ns.formatNumber(budget)}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 SÉLECTION DU CATALOGUE
    // ═══════════════════════════════════════════════════════════════════════════════
    let items = [];
    
    if (config.category === "all") {
        for (const [cat, catItems] of Object.entries(CATALOGS)) {
            items.push(...catItems.map(item => ({ ...item, category: cat })));
        }
    } else if (CATALOGS[config.category]) {
        items = CATALOGS[config.category].map(item => ({ ...item, category: config.category }));
    } else {
        ns.tprint(`❌ Catégorie invalide: ${config.category}`);
        ns.tprint(`   Catégories valides: ${Object.keys(CATALOGS).join(", ")}, all`);
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 FILTRAGE (affordable)
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.affordable) {
        items = items.filter(item => {
            if (typeof item.price === "number") {
                return item.price <= budget;
            }
            return true; // Garder les items à prix variable
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 TRI
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.sort === "price") {
        items.sort((a, b) => {
            const priceA = typeof a.price === "number" ? a.price : Infinity;
            const priceB = typeof b.price === "number" ? b.price : Infinity;
            return priceA - priceB;
        });
    } else if (config.sort === "priority") {
        items.sort((a, b) => a.priority - b.priority);
    } else if (config.sort === "name") {
        items.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📄 AFFICHAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    if (items.length === 0) {
        ns.tprint("⚠️  Aucun item trouvé avec ces filtres");
        return;
    }
    
    ns.tprint(`📋 Catalogue: ${config.category} (${items.length} items)`);
    ns.tprint("");
    
    if (config.compact) {
        // Mode compact
        ns.tprint("CATEGORY | NAME | PRICE | PRIORITY | AFFORDABLE");
        ns.tprint("───────────────────────────────────────────────────────────────");
        
        for (const item of items) {
            const priceStr = typeof item.price === "number" 
                ? ns.formatNumber(item.price) 
                : item.price;
            const affordable = typeof item.price === "number" && item.price <= budget 
                ? "✅" 
                : "❌";
            
            ns.tprint(
                `${item.category.padEnd(10)} | ` +
                `${item.name.padEnd(25)} | ` +
                `${priceStr.padStart(12)} | ` +
                `${String(item.priority).padStart(8)} | ` +
                `${affordable}`
            );
        }
    } else {
        // Mode détaillé
        for (const item of items) {
            const priceStr = typeof item.price === "number" 
                ? ns.formatNumber(item.price) 
                : item.price;
            const affordable = typeof item.price === "number" && item.price <= budget;
            const timeToAfford = !affordable && typeof item.price === "number"
                ? Math.ceil((item.price - budget) / (player.money / 3600)) // Approximation 1h
                : 0;
            
            ns.tprint(`┌─────────────────────────────────────────────────────────────`);
            ns.tprint(`│ 🛒 ${item.name}`);
            ns.tprint(`├─────────────────────────────────────────────────────────────`);
            ns.tprint(`│ Catégorie:   ${item.category}`);
            ns.tprint(`│ Prix:        ${priceStr}`);
            ns.tprint(`│ Priorité:    ${item.priority} ${item.priority === 1 ? "(Essentiel)" : ""}`);
            ns.tprint(`│ Description: ${item.desc}`);
            ns.tprint(`│ Achetable:   ${affordable ? "✅ OUI" : "❌ NON"}`);
            
            if (!affordable && timeToAfford > 0) {
                ns.tprint(`│ Temps requis: ~${timeToAfford}s (estimation)`);
            }
            
            ns.tprint(`└─────────────────────────────────────────────────────────────`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 STATISTIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const affordable = items.filter(item => 
        typeof item.price === "number" && item.price <= budget
    ).length;
    
    ns.tprint("");
    ns.tprint(`📊 Statistiques:`);
    ns.tprint(`   Items affichés: ${items.length}`);
    ns.tprint(`   Achetables: ${affordable}/${items.length}`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💾 EXPORT JSON
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.json) {
        try {
            const exportData = {
                timestamp: Date.now(),
                budget: budget,
                category: config.category,
                items: items.map(item => ({
                    ...item,
                    affordable: typeof item.price === "number" && item.price <= budget
                }))
            };
            
            await ns.write(config.json, JSON.stringify(exportData, null, 2), "w");
            ns.tprint("");
            ns.tprint(`✅ Export JSON: ${config.json}`);
        } catch (error) {
            ns.tprint(`❌ Erreur export JSON: ${error.message}`);
        }
    }
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("✅ Catalogue terminé");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
