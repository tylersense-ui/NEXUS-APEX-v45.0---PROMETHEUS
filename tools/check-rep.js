/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/check-rep
 * @description Affiche la réputation du joueur auprès de toutes les factions.
 *              Identifie les factions disponibles et les augmentations achetables.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam), Singularity API (SF4)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Vérification caps.singularity avant accès API
 * ✓ Affichage formaté avec progression vers objectifs
 * ✓ Identification des augmentations achetables
 * ✓ Tri par réputation (descendant)
 * ✓ Export JSON optionnel (--json)
 * ✓ Mode compact (--compact)
 * ✓ Try/catch robuste sur tous les appels Singularity
 * ✓ Aucun effet de bord (lecture seule)
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/check-rep.js");
 *   ns.run("/tools/check-rep.js", 1, "--compact");
 *   ns.run("/tools/check-rep.js", 1, "--json", "/data/reputation.json");
 * 
 * @args
 *   --compact          Compact output (one line per faction)
 *   --json <path>      Export to JSON file
 *   --help             Show this help
 * 
 * @example
 *   // Vérifier quelle faction a le plus de rep
 *   ns.run("/tools/check-rep.js");
 * 
 * @example
 *   // Export pour analyse
 *   ns.run("/tools/check-rep.js", 1, "--json", "/data/rep.json");
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
        compact: false,
        json: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--compact") {
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
    ns.tprint("  PROMETHEUS Reputation Checker v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/check-rep.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --compact          Compact output (one line per faction)");
    ns.tprint("  --json <path>      Export to JSON file");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("EXAMPLES:");
    ns.tprint("  run /tools/check-rep.js");
    ns.tprint("  run /tools/check-rep.js --compact");
    ns.tprint("  run /tools/check-rep.js --json /data/rep.json");
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
    
    const log = new Logger(ns, "CHECK-REP");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔍 VÉRIFICATION DES CAPACITÉS
    // ═══════════════════════════════════════════════════════════════════════════════
    const caps = new Capabilities(ns);
    
    if (!caps.singularity) {
        ns.tprint("❌ Singularity API requise (SF4)");
        ns.tprint("   Terminez BitNode 4 pour débloquer cette fonctionnalité");
        return;
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  🎯 PROMETHEUS Reputation Checker v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 👤 RÉCUPÉRATION DES FACTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    const player = ns.getPlayer();
    const joinedFactions = player.factions || [];
    
    if (joinedFactions.length === 0) {
        ns.tprint("");
        ns.tprint("⚠️  Aucune faction rejointe");
        ns.tprint("   Rejoignez des factions pour voir votre réputation");
        ns.tprint("");
        return;
    }
    
    ns.tprint("");
    ns.tprint(`📊 Factions rejointes: ${joinedFactions.length}`);
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 COLLECTE DES DONNÉES DE RÉPUTATION
    // ═══════════════════════════════════════════════════════════════════════════════
    const factionData = [];
    
    for (const factionName of joinedFactions) {
        try {
            const rep = ns.singularity.getFactionRep(factionName);
            const favor = ns.singularity.getFactionFavor(factionName);
            
            // Récupérer les augmentations disponibles
            let augs = [];
            let buyableAugs = [];
            
            try {
                augs = ns.singularity.getAugmentationsFromFaction(factionName);
                const ownedAugs = ns.singularity.getOwnedAugmentations(true);
                
                for (const augName of augs) {
                    if (ownedAugs.includes(augName)) continue;
                    
                    try {
                        const augRep = ns.singularity.getAugmentationRepReq(augName);
                        const augPrice = ns.singularity.getAugmentationPrice(augName);
                        
                        if (rep >= augRep) {
                            buyableAugs.push({
                                name: augName,
                                rep: augRep,
                                price: augPrice
                            });
                        }
                    } catch (error) {
                        // Ignorer les erreurs d'aug individuelle
                    }
                }
            } catch (error) {
                // getAugmentationsFromFaction peut échouer
            }
            
            factionData.push({
                name: factionName,
                rep: rep,
                favor: favor,
                totalAugs: augs.length,
                buyableAugs: buyableAugs
            });
            
        } catch (error) {
            log.error(`Erreur lecture faction ${factionName}: ${error.message}`);
        }
    }
    
    // Trier par réputation (descendant)
    factionData.sort((a, b) => b.rep - a.rep);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📄 AFFICHAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.compact) {
        // Mode compact
        ns.tprint("FACTION | REPUTATION | FAVOR | BUYABLE AUGS");
        ns.tprint("───────────────────────────────────────────────────────────────");
        
        for (const faction of factionData) {
            ns.tprint(
                `${faction.name.padEnd(25)} | ` +
                `${ns.formatNumber(faction.rep).padStart(12)} | ` +
                `${String(faction.favor).padStart(5)} | ` +
                `${faction.buyableAugs.length}/${faction.totalAugs}`
            );
        }
    } else {
        // Mode détaillé
        for (const faction of factionData) {
            ns.tprint(`┌─────────────────────────────────────────────────────────────`);
            ns.tprint(`│ 🎯 ${faction.name}`);
            ns.tprint(`├─────────────────────────────────────────────────────────────`);
            ns.tprint(`│ Réputation:  ${ns.formatNumber(faction.rep)}`);
            ns.tprint(`│ Favor:       ${faction.favor}`);
            ns.tprint(`│ Augs:        ${faction.buyableAugs.length}/${faction.totalAugs} achetables`);
            
            if (faction.buyableAugs.length > 0) {
                ns.tprint(`├─────────────────────────────────────────────────────────────`);
                ns.tprint(`│ 💎 Augmentations achetables:`);
                
                for (const aug of faction.buyableAugs.slice(0, 5)) { // Max 5 pour lisibilité
                    ns.tprint(`│   • ${aug.name}`);
                    ns.tprint(`│     Rep: ${ns.formatNumber(aug.rep)} | Prix: ${ns.formatNumber(aug.price)}`);
                }
                
                if (faction.buyableAugs.length > 5) {
                    ns.tprint(`│   ... et ${faction.buyableAugs.length - 5} autres`);
                }
            }
            
            ns.tprint(`└─────────────────────────────────────────────────────────────`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 STATISTIQUES GLOBALES
    // ═══════════════════════════════════════════════════════════════════════════════
    const totalRep = factionData.reduce((sum, f) => sum + f.rep, 0);
    const totalBuyableAugs = factionData.reduce((sum, f) => sum + f.buyableAugs.length, 0);
    
    ns.tprint("");
    ns.tprint(`📊 Statistiques globales:`);
    ns.tprint(`   Total réputation: ${ns.formatNumber(totalRep)}`);
    ns.tprint(`   Augs achetables: ${totalBuyableAugs}`);
    ns.tprint(`   Faction avec le plus de rep: ${factionData[0]?.name || 'N/A'}`);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💾 EXPORT JSON
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.json) {
        try {
            const exportData = {
                timestamp: Date.now(),
                player: player.name || 'Unknown',
                totalFactions: factionData.length,
                totalReputation: totalRep,
                totalBuyableAugs: totalBuyableAugs,
                factions: factionData
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
    ns.tprint("✅ Check terminé");
    ns.tprint("═══════════════════════════════════════════════════════════════");
}
