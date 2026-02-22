// ============================================
// SMALL PLATES — Book Generator v1.0
// Master script: generates a complete book
// from SmallPlates_MasterTemplate + book JSON
// ============================================

// ============================================
// CONFIGURATION
// ============================================

var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    
    // Placeholders for recipe pages (same as v10)
    recipePlaceholders: [
        {find: "<<recipe_name>>", alt: "\u00ABrecipe_name\u00BB", field: "recipe_name"},
        {find: "<<guest_name>>", alt: "\u00ABguest_name\u00BB", field: "guest_name"},
        {find: "<<comments>>", alt: "\u00ABcomments\u00BB", field: "comments"},
        {find: "<<ingredients>>", alt: "\u00ABingredients\u00BB", field: "ingredients"},
        {find: "<<instructions>>", alt: "\u00ABinstructions\u00BB", field: "instructions"}
    ],
    
    // Placeholders for personalized fixed pages
    bookPlaceholders: [
        {find: "<<couple_first_name>>", field: "couple.couple_first_name"},
        {find: "<<partner_first_name>>", field: "couple.partner_first_name"},
        {find: "<<couple_display_name>>", field: "couple.couple_display_name"},
        {find: "<<contributor_count>>", field: "contributors.count"},
        {find: "<<contributors_list>>", field: "_contributors_formatted"},
        {find: "<<captains_list>>", field: "_captains_formatted"}
    ],
    
    // Script Labels (must match label-spreads.jsx)
    labels: {
        recipeA: "TEMPLATE_RECIPE_A",
        recipeB: "TEMPLATE_RECIPE_B",
        recipeC: "TEMPLATE_RECIPE_C",
        filler1: "TEMPLATE_FILLER_1",
        filler2: "TEMPLATE_FILLER_2",
        filler3: "TEMPLATE_FILLER_3",
        filler4: "TEMPLATE_FILLER_4",
        contributors: "CONTRIBUTORS"
    }
};

// ============================================
// MAIN
// ============================================

function main() {
    if (app.documents.length === 0) {
        alert("Error: No hay documento abierto.\n\nAbre SmallPlates_MasterTemplate_v1.indd primero.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // ── STEP 1: Load JSON ──
    var jsonFile = File.openDialog("Selecciona el archivo book.JSON", "JSON:*.json");
    if (jsonFile === null) return;
    
    var basePath = jsonFile.parent;
    // Si el JSON está en subdirectorio 'data', subir un nivel
    if (basePath.name === 'data') {
        basePath = basePath.parent;
    }
    
    var bookData = readJSON(jsonFile);
    if (bookData === null) {
        alert("Error: No se pudo leer el JSON.");
        return;
    }
    
    // Validate JSON structure
    if (!bookData.couple || !bookData.recipes || !bookData.contributors) {
        alert("Error: El JSON no tiene la estructura esperada.\n\nAsegúrate de usar el JSON generado por fetch-book.js");
        return;
    }
    
    // ── Pre-format data ──
    // Format contributor names as line-separated string
    bookData._contributors_formatted = bookData.contributors.list.join("\r");
    
    // Format captain names as line-separated string
    bookData._captains_formatted = bookData.captains.list.join("\r");
    
    // Convert contributor count to string
    bookData.contributors.count = String(bookData.contributors.count);
    
    // ── Confirm with user ──
    var recipes = bookData.recipes;
    var recipesWithImages = 0;
    for (var j = 0; j < recipes.length; j++) {
        if (recipes[j].local_image_path) recipesWithImages++;
    }
    
    if (!confirm("📖 SMALL PLATES — Book Generator\n\n" +
                 "💑 Pareja: " + bookData.couple.couple_display_name + "\n" +
                 "🍽️ Recetas: " + recipes.length + " (" + recipesWithImages + " con imagen)\n" +
                 "👥 Contributors: " + bookData.contributors.list.length + "\n" +
                 "🎖️ Captains: " + bookData.captains.list.length + "\n\n" +
                 "¿Generar libro completo?")) {
        return;
    }
    
    // ── STEP 2: Find all labeled spreads ──
    $.writeln("\n═══ STEP 2: Finding labeled spreads ═══");
    
    var templateA = findSpreadByLabel(doc, CONFIG.labels.recipeA);
    var templateB = findSpreadByLabel(doc, CONFIG.labels.recipeB);
    var templateC = findSpreadByLabel(doc, CONFIG.labels.recipeC);
    var filler1 = findSpreadByLabel(doc, CONFIG.labels.filler1);
    var filler2 = findSpreadByLabel(doc, CONFIG.labels.filler2);
    var filler3 = findSpreadByLabel(doc, CONFIG.labels.filler3);
    var filler4 = findSpreadByLabel(doc, CONFIG.labels.filler4);
    var contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    
    // Validate all templates found
    var missing = [];
    if (!templateA) missing.push("TEMPLATE_RECIPE_A");
    if (!templateB) missing.push("TEMPLATE_RECIPE_B");
    if (!templateC) missing.push("TEMPLATE_RECIPE_C");
    if (!filler1) missing.push("TEMPLATE_FILLER_1");
    if (!filler2) missing.push("TEMPLATE_FILLER_2");
    if (!filler3) missing.push("TEMPLATE_FILLER_3");
    if (!filler4) missing.push("TEMPLATE_FILLER_4");
    if (!contributorsSpread) missing.push("CONTRIBUTORS");
    
    if (missing.length > 0) {
        alert("Error: No se encontraron estos spreads:\n\n" + 
              missing.join("\n") + 
              "\n\nCorre label-spreads.jsx primero.");
        return;
    }
    
    $.writeln("✅ All 8 labeled spreads found");
    
    // ── STEP 3: Personalize fixed pages ──
    $.writeln("\n═══ STEP 3: Personalizing fixed pages ═══");
    
    personalizeFixedPages(doc, bookData);
    $.writeln("✅ Fixed pages personalized");
    
    // ── STEP 4: Capture template positions ──
    $.writeln("\n═══ STEP 4: Capturing template positions ═══");
    
    var positionsA = captureFramePositions(templateA);
    var positionsB = captureFramePositions(templateB);
    var positionsC = captureFramePositions(templateC);
    var positionsFiller1 = captureFramePositions(filler1);
    var positionsFiller2 = captureFramePositions(filler2);
    var positionsFiller3 = captureFramePositions(filler3);
    var positionsFiller4 = captureFramePositions(filler4);
    
    $.writeln("✅ Positions captured for all templates");
    
    // ── STEP 5: Calculate filler distribution ──
    $.writeln("\n═══ STEP 5: Calculating filler positions ═══");
    
    var totalRecipes = recipes.length;
    var fillerInterval = Math.floor(totalRecipes / 4);
    
    // Filler positions (insert AFTER recipe at these indices)
    // Filler 4 always goes after the last recipe
    var fillerPositions = {
        filler1: fillerInterval,
        filler2: fillerInterval * 2,
        filler3: fillerInterval * 3,
        filler4: totalRecipes // after last recipe
    };
    
    $.writeln("Total recipes: " + totalRecipes);
    $.writeln("Filler 1 after recipe #" + fillerPositions.filler1);
    $.writeln("Filler 2 after recipe #" + fillerPositions.filler2);
    $.writeln("Filler 3 after recipe #" + fillerPositions.filler3);
    $.writeln("Filler 4 after recipe #" + fillerPositions.filler4 + " (last)");
    
    // ── STEP 6: Generate recipes + fillers ──
    $.writeln("\n═══ STEP 6: Generating recipes ═══");
    
    // The insertion point: BEFORE the first template spread
    // All new spreads go before TEMPLATE_RECIPE_A
    // After each insertion, templateA's index shifts +1
    
    var progressWin = createProgressWindow(totalRecipes);
    progressWin.show();
    
    var successCount = 0;
    var imagesPlaced = 0;
    var usedTemplateA = [];
    var usedTemplateB = [];
    var usedTemplateC = [];
    var stillOverflow = [];
    var fillersInserted = 0;
    
    for (var i = 0; i < recipes.length; i++) {
        try {
            var recipeName = recipes[i].recipe_name || ("Receta " + (i + 1));
            updateProgress(progressWin, i + 1, totalRecipes, recipeName);
            
            // ── CASCADA: A → B → C ──
            // Insert BEFORE templateA (which shifts right with each insertion)
            
            // Attempt 1: Template A
            var newSpread = duplicateSpreadBefore(templateA, positionsA);
            replaceInAllTextFrames(newSpread, recipes[i], CONFIG.recipePlaceholders);
            placeImageInSpread(newSpread, recipes[i], basePath);
            
            doc.recompose();
            
            if (checkForOverflow(newSpread)) {
                $.writeln(recipeName + " → overflow en A, intentando B...");
                removeSpread(newSpread);
                
                // Attempt 2: Template B
                newSpread = duplicateSpreadBefore(templateA, positionsB, templateB);
                replaceInAllTextFrames(newSpread, recipes[i], CONFIG.recipePlaceholders);
                placeImageInSpread(newSpread, recipes[i], basePath);
                
                doc.recompose();
                
                if (checkForOverflow(newSpread)) {
                    $.writeln(recipeName + " → overflow en B, usando C...");
                    removeSpread(newSpread);
                    
                    // Attempt 3: Template C
                    newSpread = duplicateSpreadBefore(templateA, positionsC, templateC);
                    replaceInAllTextFrames(newSpread, recipes[i], CONFIG.recipePlaceholders);
                    placeImageInSpread(newSpread, recipes[i], basePath);
                    
                    doc.recompose();
                    
                    if (checkForOverflow(newSpread)) {
                        $.writeln("⚠️ " + recipeName + " → OVERFLOW INCLUSO EN TEMPLATE C");
                        stillOverflow.push(recipeName);
                    }
                    
                    usedTemplateC.push(recipeName);
                } else {
                    usedTemplateB.push(recipeName);
                }
            } else {
                usedTemplateA.push(recipeName);
            }
            
            // Count images
            if (hasImage(newSpread)) {
                imagesPlaced++;
            }
            
            successCount++;
            
            // ── INSERT FILLER if needed ──
            var recipeNumber = i + 1; // 1-based
            
            if (recipeNumber === fillerPositions.filler1) {
                duplicateSpreadBefore(templateA, positionsFiller1, filler1);
                fillersInserted++;
                $.writeln("📄 Filler 1 inserted after recipe #" + recipeNumber);
            }
            if (recipeNumber === fillerPositions.filler2) {
                duplicateSpreadBefore(templateA, positionsFiller2, filler2);
                fillersInserted++;
                $.writeln("📄 Filler 2 inserted after recipe #" + recipeNumber);
            }
            if (recipeNumber === fillerPositions.filler3) {
                duplicateSpreadBefore(templateA, positionsFiller3, filler3);
                fillersInserted++;
                $.writeln("📄 Filler 3 inserted after recipe #" + recipeNumber);
            }
            if (recipeNumber === fillerPositions.filler4) {
                duplicateSpreadBefore(templateA, positionsFiller4, filler4);
                fillersInserted++;
                $.writeln("📄 Filler 4 (cierre) inserted after recipe #" + recipeNumber);
            }
            
        } catch (e) {
            $.writeln("Error con receta " + i + ": " + e.message);
        }
    }
    
    progressWin.close();
    
    $.writeln("\n✅ " + successCount + " recipes generated, " + fillersInserted + " fillers inserted");
    
    // ── STEP 7: Populate Contributors + Captains ──
    $.writeln("\n═══ STEP 7: Populating contributors ═══");
    
    // Re-find contributors spread (index may have changed)
    contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    if (contributorsSpread) {
        replaceInAllTextFrames(contributorsSpread, bookData, CONFIG.bookPlaceholders);
        $.writeln("✅ Contributors and captains populated");
    } else {
        $.writeln("⚠️ Contributors spread not found — skipping");
    }
    
    // ── STEP 8: Delete template spreads ──
    $.writeln("\n═══ STEP 8: Cleaning up templates ═══");
    
    // Re-find all template spreads (indices changed after insertions)
    var templatesToRemove = [
        CONFIG.labels.recipeA,
        CONFIG.labels.recipeB,
        CONFIG.labels.recipeC,
        CONFIG.labels.filler1,
        CONFIG.labels.filler2,
        CONFIG.labels.filler3,
        CONFIG.labels.filler4
    ];
    
    var removedCount = 0;
    // Remove in reverse order to preserve indices
    for (var t = templatesToRemove.length - 1; t >= 0; t--) {
        var templateSpread = findSpreadByLabel(doc, templatesToRemove[t]);
        if (templateSpread) {
            try {
                removeSpread(templateSpread);
                removedCount++;
                $.writeln("Removed: " + templatesToRemove[t]);
            } catch (e) {
                $.writeln("Error removing " + templatesToRemove[t] + ": " + e.message);
            }
        }
    }
    
    $.writeln("✅ " + removedCount + " template spreads removed");
    
    // ── STEP 9: Update TOC ──
    $.writeln("\n═══ STEP 9: Updating Table of Contents ═══");
    
    try {
        if (doc.tocStyles.length > 0) {
            // Find the TOC story and update it
            for (var s = 0; s < doc.stories.length; s++) {
                var story = doc.stories[s];
                // Check if this story contains TOC content by looking for tab+page number patterns
                // The TOC is generated by InDesign's built-in TOC feature
            }
            
            // Use the menu command to update TOC
            // This is equivalent to Layout → Update Table of Contents
            try {
                app.menuActions.itemByName("Update Table of Contents").invoke();
                $.writeln("✅ TOC updated via menu command");
            } catch (tocError) {
                $.writeln("⚠️ Could not auto-update TOC: " + tocError.message);
                $.writeln("   → Update manually: Layout → Update Table of Contents");
            }
        }
    } catch (e) {
        $.writeln("⚠️ TOC update skipped: " + e.message);
    }
    
    // ── STEP 10: Save As ──
    $.writeln("\n═══ STEP 10: Saving ═══");
    
    var coupleName = bookData.couple.couple_display_name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ&\s]/g, "").replace(/\s+/g, "_");
    var newFileName = "SmallPlates_" + coupleName + ".indd";
    
    // Save in same directory as the JSON
    var savePath = new File(basePath.fsName + "/" + newFileName);
    
    try {
        doc.saveACopy(savePath);
        $.writeln("✅ Saved: " + savePath.fsName);
    } catch (e) {
        $.writeln("⚠️ Could not auto-save: " + e.message);
        $.writeln("   → Save manually with File → Save As");
    }
    
    // ── FINAL REPORT ──
    var finalMessage = "✅ ¡LIBRO GENERADO!\n\n";
    finalMessage += "💑 " + bookData.couple.couple_display_name + "\n\n";
    finalMessage += "🍽️ " + successCount + " recetas creadas\n";
    finalMessage += "📷 " + imagesPlaced + " imágenes colocadas\n";
    finalMessage += "📄 " + fillersInserted + " fillers insertados\n";
    finalMessage += "🗑️ " + removedCount + " templates eliminados\n\n";
    finalMessage += "📊 Distribución:\n";
    finalMessage += "   A (estándar): " + usedTemplateA.length + "\n";
    finalMessage += "   B (overflow+img): " + usedTemplateB.length + "\n";
    finalMessage += "   C (overflow-img): " + usedTemplateC.length + "\n";
    
    if (usedTemplateB.length > 0) {
        finalMessage += "\n📋 Template B:\n";
        for (var b = 0; b < usedTemplateB.length; b++) {
            finalMessage += "   • " + usedTemplateB[b] + "\n";
        }
    }
    
    if (usedTemplateC.length > 0) {
        finalMessage += "\n📋 Template C:\n";
        for (var c = 0; c < usedTemplateC.length; c++) {
            finalMessage += "   • " + usedTemplateC[c] + "\n";
        }
    }
    
    if (stillOverflow.length > 0) {
        finalMessage += "\n⚠️ OVERFLOW en Template C:\n";
        for (var s = 0; s < stillOverflow.length; s++) {
            finalMessage += "   • " + stillOverflow[s] + "\n";
        }
    }
    
    finalMessage += "\n📁 Guardado como: " + newFileName;
    finalMessage += "\n\n⚠️ Revisa el TOC manualmente:\nLayout → Update Table of Contents";
    
    alert(finalMessage);
}

// ============================================
// SPREAD UTILITIES
// ============================================

function findSpreadByLabel(doc, label) {
    for (var i = 0; i < doc.spreads.length; i++) {
        if (doc.spreads[i].label === label) {
            return doc.spreads[i];
        }
    }
    return null;
}

function duplicateSpreadBefore(targetSpread, savedPositions, sourceSpread) {
    // If sourceSpread is provided, duplicate that one before targetSpread
    // Otherwise, duplicate targetSpread itself before targetSpread
    var spreadToDuplicate = sourceSpread || targetSpread;
    
    var newSpread = spreadToDuplicate.duplicate(LocationOptions.BEFORE, targetSpread);
    restoreFramePositions(newSpread, savedPositions);
    
    return newSpread;
}

function removeSpread(spread) {
    for (var p = spread.pages.length - 1; p >= 0; p--) {
        spread.pages[p].remove();
    }
}

// ============================================
// FRAME POSITION FIX (from v10)
// InDesign bug: shifts overridden parent items
// when duplicating spreads in facing pages docs
// ============================================

function captureFramePositions(spread) {
    var positions = [];
    
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var pagePositions = [];
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            pagePositions.push({
                index: i,
                label: item.label || "",
                bounds: item.geometricBounds.slice(0)
            });
        }
        
        positions.push({
            pageIndex: p,
            items: pagePositions
        });
    }
    
    return positions;
}

function restoreFramePositions(newSpread, savedPositions) {
    for (var p = 0; p < newSpread.pages.length; p++) {
        if (p >= savedPositions.length) break;
        
        var page = newSpread.pages[p];
        var allItems = page.allPageItems;
        var savedItems = savedPositions[p].items;
        
        for (var i = 0; i < allItems.length && i < savedItems.length; i++) {
            try {
                var item = allItems[i];
                var saved = savedItems[i];
                
                if (saved.label !== "" && item.label !== "" && saved.label !== item.label) {
                    $.writeln("WARNING: Label mismatch at page " + p + " index " + i);
                    continue;
                }
                
                item.geometricBounds = saved.bounds;
            } catch (e) {
                $.writeln("Could not restore position for item " + i + " on page " + p);
            }
        }
    }
}

// ============================================
// PERSONALIZE FIXED PAGES
// ============================================

function personalizeFixedPages(doc, bookData) {
    // Search and replace in ALL text frames of the document
    // This handles pp. 6-9 placeholders
    
    app.findTextPreferences = null;
    app.changeTextPreferences = null;
    
    var placeholders = CONFIG.bookPlaceholders;
    
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        
        if (value === null || value === undefined) {
            $.writeln("⚠️ No value found for: " + ph.field);
            continue;
        }
        
        // Convert to string
        value = String(value);
        
        // Replace line breaks for InDesign
        value = value.split("\n").join("\r");
        
        app.findTextPreferences.findWhat = ph.find;
        app.changeTextPreferences.changeTo = value;
        doc.changeText();
        
        $.writeln("Replaced " + ph.find + " → " + (value.length > 50 ? value.substring(0, 50) + "..." : value));
    }
    
    app.findTextPreferences = null;
    app.changeTextPreferences = null;
}

// Helper: get nested value from object using dot notation
// e.g., getNestedValue(obj, "couple.couple_first_name")
function getNestedValue(obj, path) {
    var parts = path.split(".");
    var current = obj;
    
    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return null;
        current = current[parts[i]];
    }
    
    return current;
}

// ============================================
// TEXT REPLACEMENT (enhanced from v10)
// ============================================

function replaceInAllTextFrames(spread, data, placeholders) {
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            
            if (item instanceof TextFrame) {
                replaceInTextFrame(item, data, placeholders);
            }
        }
    }
}

function replaceInTextFrame(tf, data, placeholders) {
    try {
        var story = tf.parentStory;
        
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        
        for (var i = 0; i < placeholders.length; i++) {
            var ph = placeholders[i];
            
            // Get value: support both flat fields and nested paths
            var value;
            if (ph.field.indexOf(".") >= 0) {
                value = getNestedValue(data, ph.field);
            } else {
                value = data[ph.field];
            }
            
            value = (value !== null && value !== undefined) ? String(value) : "";
            
            // Handle line breaks
            value = value.split("\n").join("<<<BR>>>");
            value = value.split("\\n").join("<<<BR>>>");
            
            // Replace main placeholder
            app.findTextPreferences.findWhat = ph.find;
            app.changeTextPreferences.changeTo = value;
            story.changeText();
            
            // Replace alt placeholder (guillemets)
            if (ph.alt) {
                app.findTextPreferences = null;
                app.changeTextPreferences = null;
                app.findTextPreferences.findWhat = ph.alt;
                app.changeTextPreferences.changeTo = value;
                story.changeText();
            }
        }
        
        // Convert line break markers to InDesign paragraph breaks
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        app.findTextPreferences.findWhat = "<<<BR>>>";
        app.changeTextPreferences.changeTo = "\r";
        story.changeText();
        
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        
    } catch (e) {}
}

// ============================================
// IMAGE PLACEMENT (from v10)
// ============================================

function placeImageInSpread(spread, recipe, basePath) {
    if (!recipe.local_image_path) {
        return false;
    }
    
    var imagePath = basePath.fsName + "/" + recipe.local_image_path;
    var imageFile = new File(imagePath);
    
    if (!imageFile.exists) {
        $.writeln("Imagen no encontrada: " + imagePath);
        return false;
    }
    
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            
            if (item.label === CONFIG.imageFrameLabel) {
                try {
                    item.place(imageFile);
                    item.fit(FitOptions.FILL_PROPORTIONALLY);
                    item.sendToBack();
                    return true;
                } catch (e) {
                    $.writeln("Error colocando imagen: " + e.message);
                    return false;
                }
            }
        }
    }
    
    return false;
}

// ============================================
// OVERFLOW DETECTION (from v10)
// ============================================

function checkForOverflow(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            
            if (item instanceof TextFrame && item.overflows) {
                return true;
            }
        }
    }
    return false;
}

function hasImage(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var allItems = spread.pages[p].allPageItems;
        for (var i = 0; i < allItems.length; i++) {
            if (allItems[i].label === CONFIG.imageFrameLabel) {
                try {
                    if (allItems[i].images.length > 0 || allItems[i].graphics.length > 0) {
                        return true;
                    }
                } catch (e) {}
            }
        }
    }
    return false;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function readJSON(file) {
    try {
        file.open("r");
        file.encoding = "UTF-8";
        var content = file.read();
        file.close();
        return eval("(" + content + ")");
    } catch (e) {
        return null;
    }
}

function createProgressWindow(total) {
    var win = new Window("palette", "Generando libro...", undefined, {closeButton: false});
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.statusText = win.add("statictext", undefined, "Preparando...");
    win.statusText.preferredSize = [400, 20];
    win.progressBar = win.add("progressbar", undefined, 0, total);
    win.progressBar.preferredSize = [400, 20];
    win.recipeText = win.add("statictext", undefined, "");
    win.recipeText.preferredSize = [400, 20];
    return win;
}

function updateProgress(win, current, total, name) {
    win.statusText.text = "Receta " + current + " de " + total;
    win.progressBar.value = current;
    win.recipeText.text = name || "";
    win.update();
}

// ============================================
// RUN
// ============================================

main();