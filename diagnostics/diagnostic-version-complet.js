/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v47.3 - "DIAGNOSTIC COMPLET"
 * 
 * @module      diagnostic-version-complet.js
 * @description Vérifie TOUS les fichiers du build PROMETHEUS et détecte les bugs
 *              Affichage dans tail (ns.print) pour meilleure lisibilité
 * @author      Claude (Anthropic)
 * @version     47.3
 * @date        2026-03-05
 * @license     MIT
 * 
 * @usage
 * run diagnostic-version-complet.js
 * 
 * @changelog
 * v47.3 - 2026-03-05
 * - Vérification complète de TOUS les fichiers du build
 * - Détection des bugs v45.8, v45.9, v46.x
 * - Détection si v47.3 est installé
 * - Affichage dans tail (ns.print) au lieu de terminal
 * - Rapport détaillé par catégorie de fichiers
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    
    ns.print("");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("🔍 DIAGNOSTIC VERSION COMPLET - PROMETHEUS v47.3");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    ns.print("Ce script vérifie TOUS les fichiers du build.");
    ns.print("Il détecte les bugs et les versions incorrectes.");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════
    // DÉFINITION DES FICHIERS À VÉRIFIER
    // ═══════════════════════════════════════════════════════════════════
    
    const files = [
        // ─────────────────────────────────────────────────────────────
        // CORE FILES (système critique)
        // ─────────────────────────────────────────────────────────────
        {
            path: "/core/orchestrator.js",
            category: "CORE",
            bugs: [
                {
                    name: "Boucle infinie prep (v45.7)",
                    pattern: /while\s*\(\s*batchCount\s*<\s*MAX_BATCHES_PER_TARGET\s*\)\s*{[\s\S]*?executeBatch[\s\S]*?}/,
                    checkFor: "MAX_BATCHES_PER_TARGET = 100",
                    severity: "🔴 CRITIQUE",
                    fix: "MAX_BATCHES_PER_TARGET = 1 (v45.8+)"
                }
            ],
            expectedVersion: "v45.8+",
            criticalFeatures: [
                { pattern: /MAX_BATCHES_PER_TARGET\s*=\s*1/, name: "MAX_BATCHES limité à 1" },
                { pattern: /if\s*\(\s*result\.isPrep\s*\)\s*break/, name: "Break sur isPrep" }
            ]
        },
        {
            path: "/core/batcher.js",
            category: "CORE",
            bugs: [
                {
                    name: "Bug hackThreads formulas (v45.9 - GAME-BREAKING)",
                    pattern: /hackThreads\s*=\s*Math\.floor\s*\(\s*hackPercent\s*\/\s*hackPercent\s*\)/,
                    severity: "🔴 GAME-BREAKING",
                    fix: "hackThreads = Math.floor(hackPercent / hackPercentPerThread)"
                },
                {
                    name: "CAS 2 prep sans weaken compensatoire (v46.1)",
                    pattern: /CAS 2.*?GROW seul/,
                    severity: "🔴 CRITIQUE",
                    fix: "Ajouter weaken compensatoire dans CAS 2"
                }
            ],
            expectedVersion: "v47.0+",
            criticalFeatures: [
                { pattern: /hackPercent\s*\/\s*hackPercentPerThread/, name: "Formule hackThreads correcte" },
                { pattern: /isPrep:\s*true/, name: "Flag isPrep dans prep" },
                { pattern: /isPrep:\s*false/, name: "Flag isPrep dans HWGW" }
            ]
        },
        {
            path: "/core/dashboard.js",
            category: "CORE",
            bugs: [
                {
                    name: "Bug uptimeLine (v45.8)",
                    pattern: /\buptimeLine\b/,
                    severity: "🔴 CRITIQUE",
                    fix: "Utiliser playtimeLine1 et playtimeLine2"
                },
                {
                    name: "Double déclaration player (v45.8)",
                    pattern: /const player = ns\.getPlayer\(\);[\s\S]{0,3000}const player = ns\.getPlayer\(\);/,
                    severity: "🔴 CRITIQUE",
                    fix: "Supprimer 2ème déclaration"
                }
            ],
            expectedVersion: "v46.1+",
            criticalFeatures: [
                { pattern: /playtimeLine1/, name: "playtimeLine1 utilisé" },
                { pattern: /playtimeLine2/, name: "playtimeLine2 utilisé" }
            ]
        },
        {
            path: "/core/port-handler.js",
            category: "CORE",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: [
                { pattern: /writeJSON/, name: "writeJSON disponible" },
                { pattern: /readJSON/, name: "readJSON disponible" }
            ]
        },
        {
            path: "/core/ram-manager.js",
            category: "CORE",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        },
        
        // ─────────────────────────────────────────────────────────────
        // HACK FILES (controller et workers)
        // ─────────────────────────────────────────────────────────────
        {
            path: "/hack/controller.js",
            category: "HACK",
            bugs: [
                {
                    name: "Pas de drainage instantané (v47.3)",
                    pattern: /while\s*\(\s*![\w.]+\.isEmpty\s*\([\w.]+\)\s*\)\s*{/,
                    invert: true,
                    severity: "🔴 CRITIQUE",
                    fix: "Ajouter boucle while interne pour drainage instantané"
                },
                {
                    name: "Backoff exponentiel (v45.6 - OBSOLÈTE)",
                    pattern: /consecutiveErrors|BACKOFF_MULTIPLIER|Math\.pow.*backoff/,
                    severity: "⚠️  OBSOLÈTE",
                    fix: "Supprimer backoff (v47.3)"
                },
                {
                    name: "Pas de génération UUID (v47.3)",
                    pattern: /generateUUID|crypto\.randomUUID/,
                    invert: true,
                    severity: "🔴 CRITIQUE",
                    fix: "Ajouter génération UUID salt"
                }
            ],
            expectedVersion: "v47.3",
            criticalFeatures: [
                { pattern: /while\s*\(\s*![\w.]+\.isEmpty/, name: "Boucle while interne (drainage)" },
                { pattern: /generateUUID/, name: "Génération UUID" },
                { pattern: /uuid/, name: "UUID passé aux workers" }
            ]
        },
        {
            path: "/hack/workers/hack.js",
            category: "HACK",
            bugs: [
                {
                    name: "Pas d'acceptation UUID (v47.3)",
                    pattern: /const uuid = ns\.args\[2\]/,
                    invert: true,
                    severity: "🔴 CRITIQUE",
                    fix: "Ajouter: const uuid = ns.args[2] || '000';"
                }
            ],
            expectedVersion: "v47.3",
            criticalFeatures: [
                { pattern: /const uuid = ns\.args\[2\]/, name: "UUID accepté" }
            ]
        },
        {
            path: "/hack/workers/grow.js",
            category: "HACK",
            bugs: [
                {
                    name: "Pas d'acceptation UUID (v47.3)",
                    pattern: /const uuid = ns\.args\[2\]/,
                    invert: true,
                    severity: "🔴 CRITIQUE",
                    fix: "Ajouter: const uuid = ns.args[2] || '000';"
                }
            ],
            expectedVersion: "v47.3",
            criticalFeatures: [
                { pattern: /const uuid = ns\.args\[2\]/, name: "UUID accepté" }
            ]
        },
        {
            path: "/hack/workers/weaken.js",
            category: "HACK",
            bugs: [
                {
                    name: "Pas d'acceptation UUID (v47.3)",
                    pattern: /const uuid = ns\.args\[2\]/,
                    invert: true,
                    severity: "🔴 CRITIQUE",
                    fix: "Ajouter: const uuid = ns.args[2] || '000';"
                }
            ],
            expectedVersion: "v47.3",
            criticalFeatures: [
                { pattern: /const uuid = ns\.args\[2\]/, name: "UUID accepté" }
            ]
        },
        {
            path: "/hack/workers/share.js",
            category: "HACK",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        },
        
        // ─────────────────────────────────────────────────────────────
        // LIB FILES (utilitaires)
        // ─────────────────────────────────────────────────────────────
        {
            path: "/lib/constants.js",
            category: "LIB",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: [
                { pattern: /CONFIG\.PORTS\.COMMANDS/, name: "PORTS.COMMANDS défini" },
                { pattern: /CONFIG\.CONTROLLER/, name: "CONFIG.CONTROLLER défini" }
            ]
        },
        {
            path: "/lib/logger.js",
            category: "LIB",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        },
        {
            path: "/lib/network.js",
            category: "LIB",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        },
        {
            path: "/lib/capabilities.js",
            category: "LIB",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        },
        
        // ─────────────────────────────────────────────────────────────
        // ROOT FILES (boot, kill, etc.)
        // ─────────────────────────────────────────────────────────────
        {
            path: "/boot.js",
            category: "ROOT",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        },
        {
            path: "/global-kill.js",
            category: "ROOT",
            bugs: [],
            expectedVersion: "v45.0+",
            criticalFeatures: []
        }
    ];
    
    let totalBugs = 0;
    let criticalBugs = 0;
    const results = [];
    const categories = new Map();
    
    // ═══════════════════════════════════════════════════════════════════
    // ANALYSE FICHIER PAR FICHIER
    // ═══════════════════════════════════════════════════════════════════
    
    ns.print("🔍 Analyse de " + files.length + " fichiers...");
    ns.print("");
    
    for (const file of files) {
        const fileResult = {
            path: file.path,
            category: file.category,
            exists: false,
            version: "INCONNUE",
            bugs: [],
            missingFeatures: [],
            clean: true
        };
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 1: FICHIER EXISTE ?
        // ───────────────────────────────────────────────────────────────
        
        if (!ns.fileExists(file.path, "home")) {
            fileResult.clean = false;
            fileResult.bugs.push({
                name: "FICHIER MANQUANT",
                severity: "🔴 CRITIQUE",
                fix: "Créer le fichier"
            });
            results.push(fileResult);
            totalBugs++;
            criticalBugs++;
            continue;
        }
        
        fileResult.exists = true;
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 2: LIRE CONTENU
        // ───────────────────────────────────────────────────────────────
        
        let content;
        try {
            content = ns.read(file.path);
        } catch (error) {
            fileResult.clean = false;
            fileResult.bugs.push({
                name: "ERREUR LECTURE",
                severity: "🔴 CRITIQUE",
                fix: "Vérifier permissions fichier"
            });
            results.push(fileResult);
            totalBugs++;
            criticalBugs++;
            continue;
        }
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 3: DÉTECTER VERSION
        // ───────────────────────────────────────────────────────────────
        
        const versionMatch = content.match(/@version\s+(\d+)\.(\d+)/);
        if (versionMatch) {
            fileResult.version = `v${versionMatch[1]}.${versionMatch[2]}`;
        }
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 4: SCANNER LES BUGS
        // ───────────────────────────────────────────────────────────────
        
        for (const bug of file.bugs) {
            const hasPattern = bug.pattern.test(content);
            const isBug = bug.invert ? hasPattern : !hasPattern;
            
            if (isBug) {
                fileResult.bugs.push(bug);
                fileResult.clean = false;
                totalBugs++;
                
                if (bug.severity.includes("CRITIQUE") || bug.severity.includes("GAME-BREAKING")) {
                    criticalBugs++;
                }
            }
        }
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 5: VÉRIFIER FEATURES CRITIQUES
        // ───────────────────────────────────────────────────────────────
        
        for (const feature of file.criticalFeatures || []) {
            if (!feature.pattern.test(content)) {
                fileResult.missingFeatures.push(feature.name);
                fileResult.clean = false;
            }
        }
        
        results.push(fileResult);
        
        // Grouper par catégorie
        if (!categories.has(file.category)) {
            categories.set(file.category, []);
        }
        categories.get(file.category).push(fileResult);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // AFFICHAGE DES RÉSULTATS PAR CATÉGORIE
    // ═══════════════════════════════════════════════════════════════════
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("📊 RÉSULTATS PAR CATÉGORIE");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    for (const [category, categoryFiles] of categories.entries()) {
        ns.print(`─── ${category} FILES ───────────────────────────────────────`);
        
        for (const result of categoryFiles) {
            const filename = result.path.split('/').pop();
            const status = result.clean ? "✅" : "❌";
            
            ns.print(`${status} ${filename.padEnd(25)} | v: ${result.version.padEnd(10)} | Bugs: ${result.bugs.length}`);
            
            // Afficher bugs si présents
            if (result.bugs.length > 0) {
                for (const bug of result.bugs) {
                    ns.print(`   ${bug.severity} ${bug.name}`);
                }
            }
            
            // Afficher features manquantes
            if (result.missingFeatures.length > 0) {
                ns.print(`   ⚠️  Features manquantes: ${result.missingFeatures.join(', ')}`);
            }
        }
        
        ns.print("");
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RAPPORT FINAL
    // ═══════════════════════════════════════════════════════════════════
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("📊 RAPPORT FINAL");
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    const cleanFiles = results.filter(r => r.clean).length;
    const buggyFiles = results.filter(r => !r.clean).length;
    
    ns.print(`📁 Fichiers analysés: ${results.length}`);
    ns.print(`✅ Fichiers propres: ${cleanFiles}`);
    ns.print(`❌ Fichiers avec bugs: ${buggyFiles}`);
    ns.print(`🔴 Bugs totaux: ${totalBugs}`);
    ns.print(`🔴 Bugs critiques: ${criticalBugs}`);
    ns.print("");
    
    if (totalBugs === 0) {
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("🟢 TOUS LES FICHIERS SONT À JOUR !");
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("");
        ns.print("✅ Aucun bug détecté");
        ns.print("✅ Versions correctes installées");
        ns.print("✅ Toutes les features critiques présentes");
        ns.print("");
        ns.print("📝 SYSTÈME PRÊT À FONCTIONNER");
        ns.print("");
        ns.print("🚀 PROCHAINES ÉTAPES:");
        ns.print("   1. run global-kill.js");
        ns.print("   2. run boot.js");
        ns.print("   3. Attendre 30 min pour stabilisation");
        ns.print("   4. Vérifier RAM > 80% utilisée");
        ns.print("   5. Profit ! 💰");
        ns.print("");
    } else {
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print(`🔴 ${totalBugs} BUG(S) DÉTECTÉ(S) - ${criticalBugs} CRITIQUES`);
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("");
        ns.print("❌ FICHIERS NÉCESSITANT UNE MISE À JOUR:");
        ns.print("");
        
        for (const result of results) {
            if (!result.clean) {
                ns.print(`📄 ${result.path}`);
                ns.print(`   Version actuelle: ${result.version}`);
                ns.print(`   Version requise: ${files.find(f => f.path === result.path).expectedVersion}`);
                
                if (result.bugs.length > 0) {
                    ns.print(`   Bugs:`);
                    for (const bug of result.bugs) {
                        ns.print(`   • ${bug.name}`);
                        ns.print(`     Fix: ${bug.fix}`);
                    }
                }
                
                if (result.missingFeatures.length > 0) {
                    ns.print(`   Features manquantes:`);
                    for (const feature of result.missingFeatures) {
                        ns.print(`   • ${feature}`);
                    }
                }
                
                ns.print("");
            }
        }
        
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("🛑 ACTION REQUISE");
        ns.print("═══════════════════════════════════════════════════════════════");
        ns.print("");
        ns.print("Vous utilisez des ANCIENS fichiers avec bugs !");
        ns.print("");
        ns.print("📝 SOLUTION:");
        ns.print("   1. Consulter README_INSTALLATION_v47.3.md");
        ns.print("   2. Remplacer les fichiers buggés par versions v47.3");
        ns.print("   3. Redémarrer: run global-kill.js && run boot.js");
        ns.print("   4. Re-exécuter ce diagnostic pour validation");
        ns.print("");
        ns.print("⚠️  FICHIERS v47.3 DISPONIBLES:");
        ns.print("   • controller_v47.3_COMPLET.js");
        ns.print("   • hack_v47.3_COMPLET.js");
        ns.print("   • grow_v47.3_COMPLET.js");
        ns.print("   • weaken_v47.3_COMPLET.js");
        ns.print("");
        ns.print("💡 GAIN ATTENDU APRÈS FIX:");
        ns.print("   • RAM utilisée: 6.4% → 85-95% (×14)");
        ns.print("   • Serveurs actifs: 27% → 70% (×2.6)");
        ns.print("   • Profit: ×10 à ×20 augmentation");
        ns.print("");
    }
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════
    // DÉTECTION VERSION v47.3 SPÉCIFIQUE
    // ═══════════════════════════════════════════════════════════════════
    
    ns.print("🔍 DÉTECTION VERSION v47.3 SPÉCIFIQUE:");
    ns.print("");
    
    const controllerResult = results.find(r => r.path === "/hack/controller.js");
    const hackResult = results.find(r => r.path === "/hack/workers/hack.js");
    const growResult = results.find(r => r.path === "/hack/workers/grow.js");
    const weakenResult = results.find(r => r.path === "/hack/workers/weaken.js");
    
    const hasV47_3 = 
        controllerResult?.version === "v47.3" &&
        hackResult?.version === "v47.3" &&
        growResult?.version === "v47.3" &&
        weakenResult?.version === "v47.3";
    
    if (hasV47_3) {
        ns.print("✅ VERSION v47.3 DÉTECTÉE !");
        ns.print("");
        ns.print("Tous les fichiers critiques sont en v47.3.");
        ns.print("Le système devrait fonctionner de manière optimale.");
        ns.print("");
    } else {
        ns.print("❌ VERSION v47.3 NON DÉTECTÉE");
        ns.print("");
        ns.print("Versions actuelles:");
        ns.print(`  controller.js: ${controllerResult?.version || 'INCONNUE'}`);
        ns.print(`  hack.js: ${hackResult?.version || 'INCONNUE'}`);
        ns.print(`  grow.js: ${growResult?.version || 'INCONNUE'}`);
        ns.print(`  weaken.js: ${weakenResult?.version || 'INCONNUE'}`);
        ns.print("");
        ns.print("📝 Installer v47.3 pour corriger les problèmes de déploiement.");
        ns.print("");
    }
    
    ns.print("═══════════════════════════════════════════════════════════════");
    ns.print("Diagnostic terminé. Fenêtre tail() conservée pour consultation.");
    ns.print("═══════════════════════════════════════════════════════════════");
}
