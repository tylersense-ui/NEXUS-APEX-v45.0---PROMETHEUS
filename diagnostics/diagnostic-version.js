/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 🔍 DIAGNOSTIC VERSION CHECKER - IN-GAME
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * @description Vérifie quelle VERSION des fichiers est RÉELLEMENT installée
 *              Tourne DANS Bitburner pour détecter les bugs
 * 
 * USAGE :
 *   run diagnostic-version.js
 * 
 * @author Claude (Anthropic)
 * @version 1.0
 * @date 2026-03-03
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    
    ns.tprint("");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("🔍 DIAGNOSTIC VERSION CHECKER");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("Ce script détecte quelle VERSION vous avez installée.");
    ns.tprint("Il trouve les BUGS dans vos fichiers actuels !");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════
    // FICHIERS À VÉRIFIER
    // ═══════════════════════════════════════════════════════════════════
    
    const files = [
        {
            path: "/core/dashboard.js",
            bugs: [
                {
                    name: "BUG uptimeLine (v45.8)",
                    pattern: /\buptimeLine\b/g,
                    severity: "🔴 CRITIQUE",
                    fix: "Utiliser playtimeLine1 et playtimeLine2"
                },
                {
                    name: "Double déclaration player (v45.8)",
                    pattern: /const player = ns\.getPlayer\(\);[\s\S]{0,2000}const player = ns\.getPlayer\(\);/,
                    severity: "🔴 CRITIQUE",
                    fix: "Supprimer la 2ème déclaration (ligne ~271)"
                }
            ],
            expectedVersion: "v46.1+"
        },
        {
            path: "/core/batcher.js",
            bugs: [
                {
                    name: "Bug hackThreads (v45.9)",
                    pattern: /hackThreads\s*=\s*Math\.floor\(hackPercent\(server\)\s*\/\s*hackPercent\)/,
                    severity: "🔴 GAME-BREAKING",
                    fix: "Corriger : hackPercent / hackPercentPerThread"
                }
            ],
            expectedVersion: "v46.1+"
        },
        {
            path: "/lib/constants.js",
            bugs: [],
            expectedVersion: "v46.0+"
        }
    ];
    
    let totalBugs = 0;
    const results = [];
    
    // ═══════════════════════════════════════════════════════════════════
    // ANALYSE FICHIER PAR FICHIER
    // ═══════════════════════════════════════════════════════════════════
    
    for (const file of files) {
        ns.tprint(`📄 Analyse: ${file.path}`);
        
        const fileResult = {
            path: file.path,
            exists: false,
            version: "INCONNUE",
            bugs: [],
            clean: true
        };
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 1: FICHIER EXISTE ?
        // ───────────────────────────────────────────────────────────────
        
        if (!ns.fileExists(file.path, "home")) {
            ns.tprint(`   ❌ FICHIER MANQUANT !`);
            ns.tprint("");
            fileResult.clean = false;
            results.push(fileResult);
            totalBugs++;
            continue;
        }
        
        fileResult.exists = true;
        ns.tprint(`   ✅ Fichier existe`);
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 2: LIRE CONTENU
        // ───────────────────────────────────────────────────────────────
        
        let content;
        try {
            content = ns.read(file.path);
        } catch (error) {
            ns.tprint(`   ❌ Erreur lecture: ${error.message}`);
            ns.tprint("");
            fileResult.clean = false;
            results.push(fileResult);
            totalBugs++;
            continue;
        }
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 3: DÉTECTER VERSION
        // ───────────────────────────────────────────────────────────────
        
        const versionMatch = content.match(/@version\s+(\d+)\.(\d+)/);
        if (versionMatch) {
            fileResult.version = `v${versionMatch[1]}.${versionMatch[2]}`;
            ns.tprint(`   📌 Version détectée: ${fileResult.version}`);
        } else {
            ns.tprint(`   ⚠️  Version inconnue (pas de @version tag)`);
        }
        
        // ───────────────────────────────────────────────────────────────
        // CHECK 4: SCANNER LES BUGS
        // ───────────────────────────────────────────────────────────────
        
        for (const bug of file.bugs) {
            if (bug.pattern.test(content)) {
                fileResult.bugs.push(bug);
                fileResult.clean = false;
                totalBugs++;
                
                ns.tprint(`   ${bug.severity} ${bug.name}`);
                ns.tprint(`      → Fix: ${bug.fix}`);
            }
        }
        
        if (fileResult.bugs.length === 0) {
            ns.tprint(`   ✅ Aucun bug connu détecté`);
        }
        
        ns.tprint("");
        results.push(fileResult);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RAPPORT FINAL
    // ═══════════════════════════════════════════════════════════════════
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("📊 RAPPORT DIAGNOSTIC");
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    if (totalBugs === 0) {
        ns.tprint("🟢 TOUS LES FICHIERS SONT À JOUR !");
        ns.tprint("");
        ns.tprint("✅ Aucun bug détecté");
        ns.tprint("✅ Versions correctes installées");
        ns.tprint("✅ Système prêt à fonctionner");
        ns.tprint("");
        ns.tprint("📝 PROCHAINES ÉTAPES :");
        ns.tprint("   1. run global-kill.js");
        ns.tprint("   2. run boot.js");
        ns.tprint("   3. Attendre 30 min");
        ns.tprint("   4. Profit ! 💰");
    } else {
        ns.tprint(`🔴 ${totalBugs} BUG(S) DÉTECTÉ(S) !`);
        ns.tprint("");
        ns.tprint("❌ FICHIERS AVEC BUGS :");
        ns.tprint("");
        
        for (const result of results) {
            if (!result.clean) {
                ns.tprint(`📄 ${result.path}`);
                ns.tprint(`   Version: ${result.version}`);
                
                if (result.bugs.length > 0) {
                    ns.tprint(`   Bugs:`);
                    for (const bug of result.bugs) {
                        ns.tprint(`   • ${bug.name}`);
                    }
                }
                ns.tprint("");
            }
        }
        
        ns.tprint("🛑 ACTION REQUISE :");
        ns.tprint("");
        ns.tprint("Vous utilisez des VIEUX fichiers avec bugs !");
        ns.tprint("");
        ns.tprint("📝 SOLUTION :");
        ns.tprint("   1. Ouvrir le fichier dans Bitburner");
        ns.tprint("   2. SUPPRIMER TOUT le contenu");
        ns.tprint("   3. Copier le NOUVEAU fichier fourni (v46.1+)");
        ns.tprint("   4. Sauvegarder");
        ns.tprint("   5. Re-exécuter ce diagnostic");
        ns.tprint("");
        ns.tprint("⚠️  IMPORTANT : Copier le code COMPLET !");
        ns.tprint("   Ne PAS faire de copier-coller partiel !");
    }
    
    ns.tprint("═══════════════════════════════════════════════════════════");
    ns.tprint("");
    
    // ═══════════════════════════════════════════════════════════════════
    // AFFICHER DÉTAILS SI BUGS
    // ═══════════════════════════════════════════════════════════════════
    
    if (totalBugs > 0) {
        ns.tprint("📋 DÉTAILS DES BUGS DÉTECTÉS :");
        ns.tprint("");
        
        for (const result of results) {
            if (result.bugs.length > 0) {
                ns.tprint(`─────────────────────────────────────────────────────`);
                ns.tprint(`Fichier: ${result.path}`);
                ns.tprint(`Version actuelle: ${result.version}`);
                ns.tprint(`Version requise: ${files.find(f => f.path === result.path).expectedVersion}`);
                ns.tprint(``);
                
                for (const bug of result.bugs) {
                    ns.tprint(`${bug.severity} ${bug.name}`);
                    ns.tprint(`Fix: ${bug.fix}`);
                    ns.tprint(``);
                }
            }
        }
        
        ns.tprint(`─────────────────────────────────────────────────────`);
        ns.tprint("");
        ns.tprint("💡 CONSEIL :");
        ns.tprint("   Les fichiers corrects sont dans /mnt/user-data/outputs/");
        ns.tprint("   Copiez-les COMPLÈTEMENT dans Bitburner !");
    }
}