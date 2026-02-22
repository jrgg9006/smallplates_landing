// ============================================
// SMALL PLATES — Book Generator v1.2
// 
// v1.2 FIXES:
// - Restored frame position capture/restore 
//   for recipe templates (fixes frame shift)
// - Clear labels on duplicated spreads so 
//   cleanup only deletes original templates
// - Flexible placeholder matching (spaces)
// ============================================

var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    
    recipePlaceholders: [
        {find: "<<recipe_name>>", alt: "\u00ABrecipe_name\u00BB", field: "recipe_name"},
        {find: "<<guest_name>>", alt: "\u00ABguest_name\u00BB", field: "guest_name"},
        {find: "<<comments>>", alt: "\u00ABcomments\u00BB", field: "comments"},
        {find: "<<ingredients>>", alt: "\u00ABingredients\u00BB", field: "ingredients"},
        {find: "<<instructions>>", alt: "\u00ABinstructions\u00BB", field: "instructions"}
    ],
    
    bookPlaceholders: [
        {finds: ["<<couple_first_name>>", "<< couple_first_name >>", "<<COUPLE_FIRST_NAME>>"], field: "couple.couple_first_name"},
        {finds: ["<<partner_first_name>>", "<< partner_first_name >>", "<<PARTNER_FIRST_NAME>>"], field: "couple.partner_first_name"},
        {finds: ["<<couple_display_name>>", "<< couple_display_name >>", "<<COUPLE_DISPLAY_NAME>>", "<<COUPLE_NAME>>"], field: "couple.couple_display_name"},
        {finds: ["<<contributor_count>>", "<< contributor_count >>", "<<number_guests>>", "<<NUMBER_GUESTS>>"], field: "contributors.count"},
        {finds: ["<<contributors_list>>", "<< contributors_list >>"], field: "_contributors_formatted"},
        {finds: ["<<captains_list>>", "<< captains_list >>"], field: "_captains_formatted"}
    ],
    
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
        alert("No hay documento abierto.\n\nAbre SmallPlates_MasterTemplate primero.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // ── STEP 1: Load JSON ──
    var jsonFile = File.openDialog("Selecciona el archivo book.JSON", "JSON:*.json");
    if (jsonFile === null) return;
    
    var basePath = jsonFile.parent;
    if (basePath.name === 'data') {
        basePath = basePath.parent;
    }
    
    var bookData = readJSON(jsonFile);
    if (bookData === null) {
        alert("Error: No se pudo leer el JSON.");
        return;
    }
    
    if (!bookData.couple || !bookData.recipes || !bookData.contributors) {
        alert("Error: JSON no tiene estructura esperada.");
        return;
    }
    
    // Pre-format
    bookData._contributors_formatted = bookData.contributors.list.join("\r");
    bookData._captains_formatted = bookData.captains.list.join("\r");
    bookData.contributors.count = String(bookData.contributors.count);
    
    var recipes = bookData.recipes;
    var recipesWithImages = 0;
    for (var j = 0; j < recipes.length; j++) {
        if (recipes[j].local_image_path) recipesWithImages++;
    }
    
    if (!confirm("SMALL PLATES - Book Generator v1.2\n\n" +
                 "Pareja: " + bookData.couple.couple_display_name + "\n" +
                 "Recetas: " + recipes.length + " (" + recipesWithImages + " con imagen)\n" +
                 "Contributors: " + bookData.contributors.list.length + "\n" +
                 "Captains: " + bookData.captains.list.length + "\n\n" +
                 "Generar libro completo?")) {
        return;
    }
    
    // ── STEP 2: Find labeled spreads ──
    $.writeln("\n=== STEP 2: Finding labeled spreads ===");
    
    var templateA = findSpreadByLabel(doc, CONFIG.labels.recipeA);
    var templateB = findSpreadByLabel(doc, CONFIG.labels.recipeB);
    var templateC = findSpreadByLabel(doc, CONFIG.labels.recipeC);
    var filler1 = findSpreadByLabel(doc, CONFIG.labels.filler1);
    var filler2 = findSpreadByLabel(doc, CONFIG.labels.filler2);
    var filler3 = findSpreadByLabel(doc, CONFIG.labels.filler3);
    var filler4 = findSpreadByLabel(doc, CONFIG.labels.filler4);
    var contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    
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
        alert("Spreads no encontrados:\n\n" + missing.join("\n") + "\n\nCorre label-spreads.jsx primero.");
        return;
    }
    
    $.writeln("All 8 labeled spreads found");
    
    // ── STEP 3: Personalize fixed pages ──
    $.writeln("\n=== STEP 3: Personalizing fixed pages ===");
    personalizeFixedPages(doc, bookData);
    
    // ── STEP 4: Capture positions for recipe templates ──
    $.writeln("\n=== STEP 4: Capturing template positions ===");
    
    var posA = capturePositions(templateA);
    var posB = capturePositions(templateB);
    var posC = capturePositions(templateC);
    
    $.writeln("Template A: " + posA.length + " pages captured");
    $.writeln("Template B: " + posB.length + " pages captured");
    $.writeln("Template C: " + posC.length + " pages captured");
    
    // ── STEP 5: Calculate filler distribution ──
    $.writeln("\n=== STEP 5: Filler distribution ===");
    
    var totalRecipes = recipes.length;
    var fillerInterval = Math.floor(totalRecipes / 4);
    
    var fillerAfter = {};
    fillerAfter[fillerInterval] = filler1;
    fillerAfter[fillerInterval * 2] = filler2;
    fillerAfter[fillerInterval * 3] = filler3;
    fillerAfter[totalRecipes] = filler4;
    
    $.writeln("Fillers after recipes: " + fillerInterval + ", " + (fillerInterval*2) + ", " + (fillerInterval*3) + ", " + totalRecipes);
    
    // ── STEP 6: Generate recipes + fillers ──
    $.writeln("\n=== STEP 6: Generating recipes ===");
    
    var progressWin = createProgressWindow(totalRecipes);
    progressWin.show();
    
    var stats = {
        success: 0,
        images: 0,
        fillers: 0,
        templateA: [],
        templateB: [],
        templateC: [],
        overflow: []
    };
    
    for (var i = 0; i < recipes.length; i++) {
        try {
            var recipeName = recipes[i].recipe_name || ("Receta " + (i + 1));
            updateProgress(progressWin, i + 1, totalRecipes, recipeName);
            $.writeln("\n[" + (i+1) + "/" + totalRecipes + "] " + recipeName);
            
            // ── CASCADE: A → B → C ──
            
            // Attempt 1: Template A (G-Parent, standard)
            var newSpread = duplicateAndClear(templateA, templateA);
            restorePositions(newSpread, posA);
            populateRecipe(newSpread, recipes[i], basePath);
            doc.recompose();
            
            if (checkOverflow(newSpread)) {
                $.writeln("  Overflow A -> trying B");
                safeRemove(newSpread);
                
                // Attempt 2: Template B (TextOverflow w-image)
                newSpread = duplicateAndClear(templateB, templateA);
                restorePositions(newSpread, posB);
                populateRecipe(newSpread, recipes[i], basePath);
                doc.recompose();
                
                if (checkOverflow(newSpread)) {
                    $.writeln("  Overflow B -> trying C");
                    safeRemove(newSpread);
                    
                    // Attempt 3: Template C (TextOverflow full-text)
                    newSpread = duplicateAndClear(templateC, templateA);
                    restorePositions(newSpread, posC);
                    populateRecipe(newSpread, recipes[i], basePath);
                    doc.recompose();
                    
                    if (checkOverflow(newSpread)) {
                        $.writeln("  !! STILL OVERFLOW");
                        stats.overflow.push(recipeName);
                    }
                    stats.templateC.push(recipeName);
                } else {
                    stats.templateB.push(recipeName);
                }
            } else {
                stats.templateA.push(recipeName);
            }
            
            if (hasImage(newSpread)) stats.images++;
            stats.success++;
            
            // ── FILLER after this recipe? ──
            var recipeNum = i + 1;
            if (fillerAfter[recipeNum]) {
                var fillerSource = fillerAfter[recipeNum];
                var fillerSpread = duplicateAndClear(fillerSource, templateA);
                stats.fillers++;
                $.writeln("  >> Filler inserted after #" + recipeNum);
            }
            
        } catch (e) {
            $.writeln("ERROR recipe " + (i+1) + ": " + e.message + " (line " + e.line + ")");
        }
    }
    
    progressWin.close();
    $.writeln("\n" + stats.success + " recipes, " + stats.fillers + " fillers");
    
    // ── STEP 7: Populate Contributors ──
    $.writeln("\n=== STEP 7: Contributors ===");
    contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    if (contributorsSpread) {
        populateContributors(contributorsSpread, bookData);
        $.writeln("Contributors populated");
    }
    
    // ── STEP 8: Delete original template spreads ──
    $.writeln("\n=== STEP 8: Cleanup ===");
    
    // Only spreads that STILL have their label are originals
    // (duplicates had their labels cleared in duplicateAndClear)
    var labelsToRemove = [
        CONFIG.labels.recipeA,
        CONFIG.labels.recipeB,
        CONFIG.labels.recipeC,
        CONFIG.labels.filler1,
        CONFIG.labels.filler2,
        CONFIG.labels.filler3,
        CONFIG.labels.filler4
    ];
    
    var removed = 0;
    for (var t = labelsToRemove.length - 1; t >= 0; t--) {
        var found = findSpreadByLabel(doc, labelsToRemove[t]);
        if (found) {
            try {
                safeRemove(found);
                removed++;
                $.writeln("Removed: " + labelsToRemove[t]);
            } catch (e) {
                $.writeln("Error removing " + labelsToRemove[t] + ": " + e.message);
            }
        }
    }
    $.writeln(removed + " templates removed");
    
    // ── STEP 9: TOC ──
    $.writeln("\n=== STEP 9: TOC ===");
    try {
        app.menuActions.itemByName("Update Table of Contents").invoke();
        $.writeln("TOC updated");
    } catch (e) {
        $.writeln("TOC manual update needed: " + e.message);
    }
    
    // ── STEP 10: Save ──
    $.writeln("\n=== STEP 10: Save ===");
    var coupleName = bookData.couple.couple_display_name
        .replace(/[^a-zA-Z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1&\s]/g, "")
        .replace(/\s+/g, "_");
    var newFileName = "SmallPlates_" + coupleName + ".indd";
    var savePath = new File(basePath.fsName + "/" + newFileName);
    
    try {
        doc.saveACopy(savePath);
        $.writeln("Saved: " + savePath.fsName);
    } catch (e) {
        $.writeln("Save error: " + e.message);
    }
    
    // ── REPORT ──
    var msg = "LIBRO GENERADO!\n\n";
    msg += bookData.couple.couple_display_name + "\n\n";
    msg += "Recetas: " + stats.success + "\n";
    msg += "Imagenes: " + stats.images + "\n";
    msg += "Fillers: " + stats.fillers + "\n";
    msg += "Templates eliminados: " + removed + "\n\n";
    msg += "Distribucion:\n";
    msg += "  A (estandar): " + stats.templateA.length + "\n";
    msg += "  B (overflow+img): " + stats.templateB.length + "\n";
    msg += "  C (overflow txt): " + stats.templateC.length + "\n";
    
    if (stats.templateB.length > 0) {
        msg += "\nTemplate B:\n";
        for (var b = 0; b < stats.templateB.length; b++) msg += "  " + stats.templateB[b] + "\n";
    }
    if (stats.templateC.length > 0) {
        msg += "\nTemplate C:\n";
        for (var c = 0; c < stats.templateC.length; c++) msg += "  " + stats.templateC[c] + "\n";
    }
    if (stats.overflow.length > 0) {
        msg += "\nOVERFLOW:\n";
        for (var o = 0; o < stats.overflow.length; o++) msg += "  " + stats.overflow[o] + "\n";
    }
    
    msg += "\nGuardado: " + newFileName;
    msg += "\nRevisa TOC: Layout > Update Table of Contents";
    
    alert(msg);
}

// ============================================
// SPREAD OPERATIONS
// ============================================

function findSpreadByLabel(doc, label) {
    for (var i = 0; i < doc.spreads.length; i++) {
        if (doc.spreads[i].label === label) return doc.spreads[i];
    }
    return null;
}

// Duplicate sourceSpread BEFORE anchorSpread, then CLEAR the label
// so cleanup only finds the original templates
function duplicateAndClear(sourceSpread, anchorSpread) {
    var newSpread = sourceSpread.duplicate(LocationOptions.BEFORE, anchorSpread);
    newSpread.label = ""; // Clear label so it's not found during cleanup
    return newSpread;
}

function safeRemove(spread) {
    for (var p = spread.pages.length - 1; p >= 0; p--) {
        try { spread.pages[p].remove(); } catch (e) {}
    }
}

// ============================================
// POSITION CAPTURE & RESTORE
// Fixes InDesign facing-pages duplication bug
// ============================================

function capturePositions(spread) {
    var result = [];
    
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var items = page.allPageItems;
        var pageData = [];
        
        for (var i = 0; i < items.length; i++) {
            pageData.push({
                bounds: items[i].geometricBounds.slice(0),
                label: items[i].label || "",
                type: items[i].constructor.name
            });
        }
        
        result.push(pageData);
    }
    
    return result;
}

function restorePositions(spread, saved) {
    for (var p = 0; p < spread.pages.length; p++) {
        if (p >= saved.length) break;
        
        var items = spread.pages[p].allPageItems;
        var savedItems = saved[p];
        
        // First pass: restore by matching label (most reliable)
        var restored = {};
        
        for (var i = 0; i < items.length; i++) {
            var itemLabel = items[i].label || "";
            if (itemLabel === "") continue;
            
            // Find matching saved item by label
            for (var s = 0; s < savedItems.length; s++) {
                if (savedItems[s].label === itemLabel && !restored[s]) {
                    try {
                        items[i].geometricBounds = savedItems[s].bounds;
                        restored[s] = true;
                    } catch (e) {}
                    break;
                }
            }
        }
        
        // Second pass: restore remaining by index
        // Only if item count matches (same template structure)
        if (items.length === savedItems.length) {
            for (var i2 = 0; i2 < items.length; i2++) {
                if (restored[i2]) continue; // Already done by label
                
                // Check if this item was already restored by label match
                var alreadyRestored = false;
                for (var key in restored) {
                    if (restored.hasOwnProperty(key)) {
                        // Check if this specific item was the target of a label match
                    }
                }
                
                try {
                    items[i2].geometricBounds = savedItems[i2].bounds;
                } catch (e) {}
            }
        }
    }
}

// ============================================
// RECIPE POPULATION
// ============================================

function populateRecipe(spread, recipe, basePath) {
    replaceInSpread(spread, recipe, CONFIG.recipePlaceholders);
    placeImage(spread, recipe, basePath);
}

function replaceInSpread(spread, data, placeholders) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i] instanceof TextFrame) {
                replaceInFrame(items[i], data, placeholders);
            }
        }
    }
}

function replaceInFrame(tf, data, placeholders) {
    try {
        var story = tf.parentStory;
        
        for (var i = 0; i < placeholders.length; i++) {
            var ph = placeholders[i];
            var value;
            
            if (ph.field.indexOf(".") >= 0) {
                value = getNestedValue(data, ph.field);
            } else {
                value = data[ph.field];
            }
            
            value = (value !== null && value !== undefined) ? String(value) : "";
            value = value.split("\n").join("<<<BR>>>");
            value = value.split("\\n").join("<<<BR>>>");
            
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = ph.find;
            app.changeTextPreferences.changeTo = value;
            story.changeText();
            
            if (ph.alt) {
                app.findTextPreferences = null;
                app.changeTextPreferences = null;
                app.findTextPreferences.findWhat = ph.alt;
                app.changeTextPreferences.changeTo = value;
                story.changeText();
            }
        }
        
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
// FIXED PAGE PERSONALIZATION
// ============================================

function personalizeFixedPages(doc, bookData) {
    var placeholders = CONFIG.bookPlaceholders;
    
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        
        if (value === null || value === undefined) continue;
        
        value = String(value);
        value = value.split("\n").join("\r");
        
        var finds = ph.finds;
        var replaced = false;
        
        for (var f = 0; f < finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = finds[f];
            app.changeTextPreferences.changeTo = value;
            
            var results = doc.changeText();
            if (results.length > 0) {
                $.writeln("  Replaced '" + finds[f] + "' (" + results.length + "x)");
                replaced = true;
            }
        }
        
        if (!replaced) {
            $.writeln("  WARNING: no match for " + ph.field + " (tried: " + finds.join(", ") + ")");
        }
    }
    
    app.findTextPreferences = null;
    app.changeTextPreferences = null;
}

function populateContributors(spread, bookData) {
    var placeholders = CONFIG.bookPlaceholders;
    
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        if (value === null || value === undefined) continue;
        
        value = String(value).split("\n").join("\r");
        var finds = ph.finds;
        
        for (var f = 0; f < finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = finds[f];
            app.changeTextPreferences.changeTo = value;
            
            for (var p = 0; p < spread.pages.length; p++) {
                var items = spread.pages[p].allPageItems;
                for (var it = 0; it < items.length; it++) {
                    if (items[it] instanceof TextFrame) {
                        try { items[it].parentStory.changeText(); } catch (e) {}
                    }
                }
            }
        }
    }
    
    app.findTextPreferences = null;
    app.changeTextPreferences = null;
}

// ============================================
// IMAGE PLACEMENT
// ============================================

function placeImage(spread, recipe, basePath) {
    if (!recipe.local_image_path) return false;
    
    var imageFile = new File(basePath.fsName + "/" + recipe.local_image_path);
    if (!imageFile.exists) {
        $.writeln("  Image not found: " + imageFile.fsName);
        return false;
    }
    
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].label === CONFIG.imageFrameLabel) {
                try {
                    items[i].place(imageFile);
                    items[i].fit(FitOptions.FILL_PROPORTIONALLY);
                    items[i].sendToBack();
                    return true;
                } catch (e) {
                    $.writeln("  Image error: " + e.message);
                    return false;
                }
            }
        }
    }
    return false;
}

// ============================================
// OVERFLOW
// ============================================

function checkOverflow(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i] instanceof TextFrame && items[i].overflows) return true;
        }
    }
    return false;
}

function hasImage(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].label === CONFIG.imageFrameLabel) {
                try {
                    if (items[i].images.length > 0 || items[i].graphics.length > 0) return true;
                } catch (e) {}
            }
        }
    }
    return false;
}

// ============================================
// UTILITIES
// ============================================

function getNestedValue(obj, path) {
    var parts = path.split(".");
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return null;
        current = current[parts[i]];
    }
    return current;
}

function readJSON(file) {
    try {
        file.open("r");
        file.encoding = "UTF-8";
        var content = file.read();
        file.close();
        return eval("(" + content + ")");
    } catch (e) { return null; }
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

main();