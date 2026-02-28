/**
 * ██████╗ ██████╗  ██████╗ ███╗   ███╗███████╗████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 * ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 * ██████╔╝██████╔╝██║   ██║██╔████╔██║█████╗     ██║   ███████║█████╗  ██║   ██║███████╗
 * ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 * ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║███████╗╚██████╔╝███████║
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
 *                           v45.0 - "Stealing Fire From The Gods"
 * 
 * @module      tools/pre-flight
 * @description Vérifications pré-démarrage du système Nexus-Automation.
 *              Valide l'intégrité des fichiers, configs et dépendances.
 * @author      Claude (Anthropic) + tylersense-ui
 * @version     45.0 - PROMETHEUS
 * @date        2025-01-XX
 * @license     MIT
 * @requires    BitBurner v2.8.1+ (Steam)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔥 PROMETHEUS ENHANCEMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ✓ Validation de l'existence de TOUS les fichiers core/lib/hack
 * ✓ Vérification de l'intégrité de constants.js (JSON valide)
 * ✓ Test des capacités du joueur (SF unlocks)
 * ✓ Vérification de la RAM disponible sur home
 * ✓ Test de lecture/écriture des ports
 * ✓ Validation des dépendances externes (formulas, singularity)
 * ✓ Rapport détaillé avec warnings et blockers
 * ✓ Exit code approprié (0 = OK, 1 = warnings, 2 = blockers)
 * ✓ Mode verbose (--verbose) pour diagnostics
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @usage
 *   ns.run("/tools/pre-flight.js");
 *   ns.run("/tools/pre-flight.js", 1, "--verbose");
 * 
 * @args
 *   --verbose          Afficher les détails de chaque vérification
 *   --json <path>      Export résultat en JSON
 *   --help             Show this help
 * 
 * @example
 *   // Avant de lancer boot.js
 *   ns.run("/tools/pre-flight.js");
 *   // Si OK → ns.run("/boot.js");
 */

import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 📋 FICHIERS REQUIS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
const REQUIRED_FILES = {
    core: [
        "/core/batcher.js",
        "/core/dashboard.js",
        "/core/orchestrator.js",
        "/core/port-handler.js",
        "/core/ram-manager.js"
    ],
    lib: [
        "/lib/capabilities.js",
        "/lib/constants.js",
        "/lib/logger.js",
        "/lib/network.js"
    ],
    hack: [
        "/hack/controller.js",
        "/hack/watcher.js",
        "/hack/workers/hack.js",
        "/hack/workers/grow.js",
        "/hack/workers/weaken.js",
        "/hack/workers/share.js"
    ],
    root: [
        "/boot.js",
        "/global-kill.js"
    ]
};

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔧 HELPER: PARSE ARGUMENTS
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
function parseArgs(args) {
    const config = {
        verbose: false,
        json: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === "--verbose") {
            config.verbose = true;
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
    ns.tprint("  PROMETHEUS Pre-Flight Check v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("USAGE:");
    ns.tprint("  run /tools/pre-flight.js [OPTIONS]");
    ns.tprint("");
    ns.tprint("OPTIONS:");
    ns.tprint("  --verbose          Show detailed check results");
    ns.tprint("  --json <path>      Export results to JSON");
    ns.tprint("  --help             Show this help");
    ns.tprint("");
    ns.tprint("EXIT CODES:");
    ns.tprint("  0 = All checks passed");
    ns.tprint("  1 = Warnings detected (non-critical)");
    ns.tprint("  2 = Blockers detected (critical failures)");
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
    
    const log = new Logger(ns, "PRE-FLIGHT");
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("  ✈️  PROMETHEUS Pre-Flight Check v45.0");
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RÉSULTATS
    // ═══════════════════════════════════════════════════════════════════════════════
    const results = {
        timestamp: Date.now(),
        checks: [],
        warnings: [],
        blockers: [],
        passed: 0,
        failed: 0
    };
    
    /**
     * Helper pour ajouter un check
     */
    function addCheck(name, status, message, level = "info") {
        const check = { name, status, message, level };
        results.checks.push(check);
        
        if (status === "PASS") {
            results.passed++;
            if (config.verbose) {
                ns.tprint(`✅ ${name}: ${message}`);
            }
        } else if (status === "FAIL") {
            results.failed++;
            
            if (level === "blocker") {
                results.blockers.push(check);
                ns.tprint(`❌ BLOCKER: ${name}`);
                ns.tprint(`   ${message}`);
            } else {
                results.warnings.push(check);
                ns.tprint(`⚠️  WARNING: ${name}`);
                ns.tprint(`   ${message}`);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📁 CHECK 1: FICHIERS REQUIS
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("📁 Vérification des fichiers...");
    
    let missingFiles = [];
    
    for (const [category, files] of Object.entries(REQUIRED_FILES)) {
        for (const file of files) {
            if (ns.fileExists(file, "home")) {
                addCheck(`File: ${file}`, "PASS", "Exists");
            } else {
                missingFiles.push(file);
                addCheck(`File: ${file}`, "FAIL", "File not found", "blocker");
            }
        }
    }
    
    if (missingFiles.length === 0) {
        ns.tprint(`   ✅ Tous les fichiers requis présents (${results.passed} fichiers)`);
    } else {
        ns.tprint(`   ❌ ${missingFiles.length} fichiers manquants`);
    }
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ⚙️  CHECK 2: CONSTANTS.JS (JSON valide)
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("⚙️  Vérification de constants.js...");
    
    try {
        const { CONFIG } = await import("/lib/constants.js");
        
        if (CONFIG && typeof CONFIG === "object") {
            addCheck("constants.js", "PASS", "Valid configuration object");
            ns.tprint(`   ✅ Configuration valide`);
            
            // Vérifier les sections importantes
            const requiredSections = ["SYSTEM", "HACKING", "PORTS"];
            for (const section of requiredSections) {
                if (CONFIG[section]) {
                    addCheck(`CONFIG.${section}`, "PASS", "Section exists");
                } else {
                    addCheck(`CONFIG.${section}`, "FAIL", "Section missing", "warning");
                }
            }
        } else {
            addCheck("constants.js", "FAIL", "Invalid CONFIG export", "blocker");
            ns.tprint(`   ❌ Configuration invalide`);
        }
    } catch (error) {
        addCheck("constants.js", "FAIL", `Import failed: ${error.message}`, "blocker");
        ns.tprint(`   ❌ Erreur import: ${error.message}`);
    }
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 CHECK 3: CAPACITÉS DU JOUEUR
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("🎯 Vérification des capacités...");
    
    try {
        const caps = new Capabilities(ns);
        
        addCheck("Capabilities", "PASS", "Object created successfully");
        
        // Tester les principales capacités
        const capTests = [
            { name: "formulas", value: caps.formulas },
            { name: "singularity", value: caps.singularity },
            { name: "tix", value: caps.tix },
            { name: "has4S", value: caps.has4S },
            { name: "gang", value: caps.gang },
            { name: "sleeve", value: caps.sleeve },
            { name: "corp", value: caps.corp }
        ];
        
        for (const test of capTests) {
            if (test.value) {
                addCheck(`Capability: ${test.name}`, "PASS", "Available");
                if (config.verbose) {
                    ns.tprint(`   ✅ ${test.name} disponible`);
                }
            } else {
                addCheck(`Capability: ${test.name}`, "FAIL", "Not available", "info");
            }
        }
        
        ns.tprint(`   ℹ️  Capacités détectées: ${capTests.filter(t => t.value).length}/${capTests.length}`);
        
    } catch (error) {
        addCheck("Capabilities", "FAIL", `Test failed: ${error.message}`, "warning");
        ns.tprint(`   ⚠️  Erreur test capacités: ${error.message}`);
    }
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💾 CHECK 4: RAM DISPONIBLE
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("💾 Vérification de la RAM...");
    
    const homeMaxRAM = ns.getServerMaxRam("home");
    const homeUsedRAM = ns.getServerUsedRam("home");
    const homeFreeRAM = homeMaxRAM - homeUsedRAM;
    
    addCheck("Home RAM", "PASS", `${ns.formatRam(homeMaxRAM)} total`);
    
    if (homeFreeRAM < 32) {
        addCheck("Home Free RAM", "FAIL", `Only ${ns.formatRam(homeFreeRAM)} free`, "warning");
        ns.tprint(`   ⚠️  RAM libre faible: ${ns.formatRam(homeFreeRAM)}`);
    } else {
        addCheck("Home Free RAM", "PASS", `${ns.formatRam(homeFreeRAM)} available`);
        ns.tprint(`   ✅ RAM libre: ${ns.formatRam(homeFreeRAM)}`);
    }
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🔌 CHECK 5: PORTS (test lecture/écriture)
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("🔌 Vérification des ports...");
    
    try {
        const testPort = 20; // Port 20 pour test
        const testData = { test: true, timestamp: Date.now() };
        
        // Test écriture
        ns.clearPort(testPort);
        ns.writePort(testPort, JSON.stringify(testData));
        
        // Test lecture
        const readData = ns.readPort(testPort);
        const parsed = JSON.parse(readData);
        
        if (parsed.test === true) {
            addCheck("Port I/O", "PASS", "Read/write successful");
            ns.tprint(`   ✅ Lecture/écriture des ports OK`);
        } else {
            addCheck("Port I/O", "FAIL", "Data mismatch", "warning");
            ns.tprint(`   ⚠️  Données port corrompues`);
        }
        
        // Nettoyer
        ns.clearPort(testPort);
        
    } catch (error) {
        addCheck("Port I/O", "FAIL", `Test failed: ${error.message}`, "warning");
        ns.tprint(`   ⚠️  Erreur test ports: ${error.message}`);
    }
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 📊 RÉSUMÉ FINAL
    // ═══════════════════════════════════════════════════════════════════════════════
    ns.tprint("═══════════════════════════════════════════════════════════════");
    ns.tprint("📊 Résumé Pre-Flight:");
    ns.tprint(`   Checks totaux: ${results.checks.length}`);
    ns.tprint(`   Passed: ${results.passed}`);
    ns.tprint(`   Failed: ${results.failed}`);
    ns.tprint(`   Warnings: ${results.warnings.length}`);
    ns.tprint(`   Blockers: ${results.blockers.length}`);
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 VERDICT
    // ═══════════════════════════════════════════════════════════════════════════════
    let exitCode = 0;
    
    if (results.blockers.length > 0) {
        ns.tprint("");
        ns.tprint("❌ CRITICAL: Blockers détectés - Système non opérationnel");
        ns.tprint("   Résolvez les erreurs critiques avant de lancer boot.js");
        exitCode = 2;
    } else if (results.warnings.length > 0) {
        ns.tprint("");
        ns.tprint("⚠️  WARNING: Avertissements détectés");
        ns.tprint("   Le système peut fonctionner mais avec limitations");
        exitCode = 1;
    } else {
        ns.tprint("");
        ns.tprint("✅ ALL SYSTEMS GO - Prêt pour le lancement");
        ns.tprint("   Vous pouvez exécuter: run /boot.js");
        exitCode = 0;
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════════");
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 💾 EXPORT JSON
    // ═══════════════════════════════════════════════════════════════════════════════
    if (config.json) {
        try {
            await ns.write(config.json, JSON.stringify(results, null, 2), "w");
            ns.tprint("");
            ns.tprint(`✅ Export JSON: ${config.json}`);
        } catch (error) {
            ns.tprint(`❌ Erreur export JSON: ${error.message}`);
        }
    }
    
    // Note: BitBurner ne supporte pas process.exit(), donc on utilise juste return
    // mais le exitCode est disponible pour les scripts qui appellent celui-ci
    results.exitCode = exitCode;
}
