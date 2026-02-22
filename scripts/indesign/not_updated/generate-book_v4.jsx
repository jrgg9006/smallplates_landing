// ============================================
// SMALL PLATES — Book Generator v1.4
// 
// Uses AT_END duplication (proven in v10)
// Then MOVES generated spreads to correct position
// Adds: fillers, personalization, contributors
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
        {finds: ["<<couple_first_name>>", "<< couple_first_name >>"], field: "couple.couple_first_name"},
        {finds: ["<<partner_first_name>>", "<< partner_first_name >>"], field: "couple.partner_first_name"},
        {finds: ["<<couple_display_name>>", "<<COUPLE_NAME>>"], field: "couple.couple_display_name"},
        {finds: ["<<contributor_count>>", "<<number_guests>>"], field: "contributors.count"},
        {finds: ["<<contributors_list>>"], field: "_contributors_formatted"},
        {finds: ["<<captains_list>>"], field: "_captains_formatted"}
    ],
    
    labels: {
        recipeA: "TEMPLATE_RECIPE_A",
        recipeB: "TEMPLATE_RECIPE_B",
        recipeC: "TEMPLATE_RECIPE_C",
        filler1: "TEMPLATE_FILLER_1",
        filler2: "TEMPLATE_FILLER_2",
        filler3: "TEMPLATE_FILLER_3",
        filler4: "TEMPLATE_FILLER_4",
        contributors: "CONTRIBUTORS",
        objectsThatStay: "OBJECTS_THAT_STAY"
    }
};

// ============================================
// POSITION CAPTURE/RESTORE (exact copy from v10)
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
                    $.writeln("WARNING: Label mismatch page " + p + " index " + i);
                    continue;
                }
                
                item.geometricBounds = saved.bounds;
            } catch (e) {
                $.writeln("Position restore error page " + p + " item " + i + ": " + e.message);
            }
        }
    }
}

// ============================================
// PROCESS RECIPE (exact pattern from v10)
// ============================================

function processRecipeOnTemplate(templateSpread, savedPositions, recipe, basePath) {
    var newSpread = templateSpread.duplicate(LocationOptions.AT_END);
    restoreFramePositions(newSpread, savedPositions);
    replaceInAllTextFrames(newSpread, recipe);
    placeImageInSpread(newSpread, recipe, basePath);
    app.activeDocument.recompose();
    return newSpread;
}

// ============================================
// MAIN
// ============================================

function main() {
    if (app.documents.length === 0) {
        alert("No hay documento abierto.");
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
    if (bookData === null || !bookData.couple || !bookData.recipes) {
        alert("Error: JSON no válido.");
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
    
    // ── STEP 2: Find labeled spreads ──
    var templateA = findSpreadByLabel(doc, CONFIG.labels.recipeA);
    var templateB = findSpreadByLabel(doc, CONFIG.labels.recipeB);
    var templateC = findSpreadByLabel(doc, CONFIG.labels.recipeC);
    var filler1 = findSpreadByLabel(doc, CONFIG.labels.filler1);
    var filler2 = findSpreadByLabel(doc, CONFIG.labels.filler2);
    var filler3 = findSpreadByLabel(doc, CONFIG.labels.filler3);
    var filler4 = findSpreadByLabel(doc, CONFIG.labels.filler4);
    var contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    var objectsSpread = findSpreadByLabel(doc, CONFIG.labels.objectsThatStay);
    
    var missing = [];
    if (!templateA) missing.push("TEMPLATE_RECIPE_A");
    if (!templateB) missing.push("TEMPLATE_RECIPE_B");
    if (!templateC) missing.push("TEMPLATE_RECIPE_C");
    if (!filler1) missing.push("TEMPLATE_FILLER_1");
    if (!filler2) missing.push("TEMPLATE_FILLER_2");
    if (!filler3) missing.push("TEMPLATE_FILLER_3");
    if (!filler4) missing.push("TEMPLATE_FILLER_4");
    if (!contributorsSpread) missing.push("CONTRIBUTORS");
    if (!objectsSpread) missing.push("OBJECTS_THAT_STAY");
    
    if (missing.length > 0) {
        alert("Spreads no encontrados:\n" + missing.join("\n") + "\n\nCorre label-spreads.jsx");
        return;
    }
    
    if (!confirm("SMALL PLATES - Book Generator v1.4\n\n" +
                 "Pareja: " + bookData.couple.couple_display_name + "\n" +
                 "Recetas: " + recipes.length + " (" + recipesWithImages + " con imagen)\n" +
                 "Contributors: " + bookData.contributors.list.length + "\n" +
                 "Captains: " + bookData.captains.list.length + "\n\n" +
                 "Generar libro completo?")) {
        return;
    }
    
    // ── STEP 3: Personalize fixed pages ──
    $.writeln("\n=== Personalizing fixed pages ===");
    personalizeFixedPages(doc, bookData);
    
    // ── STEP 4: Populate Contributors ──
    $.writeln("\n=== Populating contributors ===");
    populateContributors(contributorsSpread, bookData);
    
    // ── STEP 5: Capture positions (once, like v10) ──
    $.writeln("\n=== Capturing positions ===");
    var positionsA = captureFramePositions(templateA);
    var positionsB = captureFramePositions(templateB);
    var positionsC = captureFramePositions(templateC);
    
    // ── STEP 6: Calculate filler distribution ──
    var totalRecipes = recipes.length;
    var fillerInterval = Math.floor(totalRecipes / 4);
    
    var fillerPositions = {};
    fillerPositions[fillerInterval] = filler1;
    fillerPositions[fillerInterval * 2] = filler2;
    fillerPositions[fillerInterval * 3] = filler3;
    fillerPositions[totalRecipes] = filler4;
    
    $.writeln("Fillers after: " + fillerInterval + ", " + (fillerInterval*2) + ", " + (fillerInterval*3) + ", " + totalRecipes);
    
    // ── STEP 7: Generate recipes + fillers AT_END ──
    $.writeln("\n=== Generating recipes (AT_END) ===");
    
    var progressWin = createProgressWindow(totalRecipes);
    progressWin.show();
    
    var stats = {
        success: 0, images: 0, fillers: 0,
        tplA: [], tplB: [], tplC: [], overflow: []
    };
    
    // Track all generated spreads for moving later
    var generatedSpreads = [];
    
    for (var i = 0; i < recipes.length; i++) {
        try {
            var recipeName = recipes[i].recipe_name || ("Receta " + (i + 1));
            updateProgress(progressWin, i + 1, totalRecipes, recipeName);
            $.writeln("\n[" + (i+1) + "] " + recipeName);
            
            // ── CASCADE A → B → C (exact v10 pattern) ──
            
            // Attempt 1: Template A
            var newSpread = processRecipeOnTemplate(templateA, positionsA, recipes[i], basePath);
            
            if (checkForOverflow(newSpread)) {
                $.writeln("  Overflow A -> B");
                removeSpread(newSpread);
                
                // Attempt 2: Template B
                newSpread = processRecipeOnTemplate(templateB, positionsB, recipes[i], basePath);
                
                if (checkForOverflow(newSpread)) {
                    $.writeln("  Overflow B -> C");
                    removeSpread(newSpread);
                    
                    // Attempt 3: Template C
                    newSpread = processRecipeOnTemplate(templateC, positionsC, recipes[i], basePath);
                    
                    if (checkForOverflow(newSpread)) {
                        $.writeln("  !! OVERFLOW in C");
                        stats.overflow.push(recipeName);
                    }
                    stats.tplC.push(recipeName);
                } else {
                    stats.tplB.push(recipeName);
                }
            } else {
                stats.tplA.push(recipeName);
            }
            
            if (hasImage(newSpread)) stats.images++;
            stats.success++;
            generatedSpreads.push(newSpread);
            
            // ── FILLER after this recipe ──
            var recipeNum = i + 1;
            if (fillerPositions[recipeNum]) {
                var fillerSpread = fillerPositions[recipeNum].duplicate(LocationOptions.AT_END);
                generatedSpreads.push(fillerSpread);
                stats.fillers++;
                $.writeln("  >> Filler inserted");
            }
            
        } catch (e) {
            $.writeln("ERROR #" + (i+1) + ": " + e.message + " (line " + e.line + ")");
        }
    }
    
    progressWin.close();
    
    // ── STEP 8: Move generated spreads to correct position ──
    // IMPORTANT: Move BEFORE deleting templates, otherwise references break
    $.writeln("\n=== Moving spreads to position ===");
    
    objectsSpread = findSpreadByLabel(doc, CONFIG.labels.objectsThatStay);
    
    if (objectsSpread && generatedSpreads.length > 0) {
        var moved = 0;
        
        // Move each spread BEFORE Objects that Stay, in order
        for (var m = 0; m < generatedSpreads.length; m++) {
            try {
                generatedSpreads[m].move(LocationOptions.BEFORE, objectsSpread);
                moved++;
            } catch (e) {
                $.writeln("Move error spread " + m + ": " + e.message);
            }
        }
        
        $.writeln(moved + " spreads moved before Objects that Stay");
    } else {
        $.writeln("WARNING: Could not move - objectsSpread: " + !!objectsSpread + ", generated: " + generatedSpreads.length);
    }
    
    // ── STEP 9: Delete original templates ──
    $.writeln("\n=== Removing templates ===");
    
    var labelsToRemove = [
        CONFIG.labels.filler4, CONFIG.labels.filler3,
        CONFIG.labels.filler2, CONFIG.labels.filler1,
        CONFIG.labels.recipeC, CONFIG.labels.recipeB,
        CONFIG.labels.recipeA
    ];
    
    var removed = 0;
    for (var t = 0; t < labelsToRemove.length; t++) {
        var found = findSpreadByLabel(doc, labelsToRemove[t]);
        if (found) {
            try {
                removeSpread(found);
                removed++;
                $.writeln("Removed: " + labelsToRemove[t]);
            } catch (e) {
                $.writeln("Error: " + e.message);
            }
        }
    }
    
    // ── STEP 10: TOC ──
    try {
        app.menuActions.itemByName("Update Table of Contents").invoke();
        $.writeln("TOC updated");
    } catch (e) {
        $.writeln("TOC: update manually");
    }
    
    // ── STEP 11: Save ──
    var coupleName = bookData.couple.couple_display_name
        .replace(/[^a-zA-Z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1&\s]/g, "")
        .replace(/\s+/g, "_");
    var savePath = new File(basePath.fsName + "/SmallPlates_" + coupleName + ".indd");
    
    try {
        doc.saveACopy(savePath);
        $.writeln("Saved: " + savePath.fsName);
    } catch (e) {
        $.writeln("Save: " + e.message);
    }
    
    // ── REPORT ──
    var msg = "LIBRO GENERADO (v1.4)\n\n";
    msg += bookData.couple.couple_display_name + "\n\n";
    msg += "Recetas: " + stats.success + "\n";
    msg += "Imagenes: " + stats.images + "\n";
    msg += "Fillers: " + stats.fillers + "\n\n";
    msg += "Distribucion:\n";
    msg += "  A: " + stats.tplA.length + "\n";
    msg += "  B: " + stats.tplB.length + "\n";
    msg += "  C: " + stats.tplC.length + "\n";
    
    if (stats.tplB.length > 0) {
        msg += "\nTemplate B:\n";
        for (var b = 0; b < stats.tplB.length; b++) msg += "  " + stats.tplB[b] + "\n";
    }
    if (stats.tplC.length > 0) {
        msg += "\nTemplate C:\n";
        for (var c = 0; c < stats.tplC.length; c++) msg += "  " + stats.tplC[c] + "\n";
    }
    if (stats.overflow.length > 0) {
        msg += "\nOVERFLOW:\n";
        for (var o = 0; o < stats.overflow.length; o++) msg += "  " + stats.overflow[o] + "\n";
    }
    
    msg += "\nGuardado: SmallPlates_" + coupleName + ".indd";
    msg += "\nRevisa TOC: Layout > Update Table of Contents";
    
    alert(msg);
}

// ============================================
// SPREAD UTILITIES
// ============================================

function findSpreadByLabel(doc, label) {
    for (var i = 0; i < doc.spreads.length; i++) {
        if (doc.spreads[i].label === label) return doc.spreads[i];
    }
    return null;
}

function removeSpread(spread) {
    for (var p = spread.pages.length - 1; p >= 0; p--) {
        spread.pages[p].remove();
    }
}

// ============================================
// TEXT REPLACEMENT (from v10)
// ============================================

function replaceInAllTextFrames(spread, recipe) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i] instanceof TextFrame) {
                replaceInTextFrame(items[i], recipe);
            }
        }
    }
}

function replaceInTextFrame(tf, recipe) {
    try {
        var story = tf.parentStory;
        
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        
        for (var i = 0; i < CONFIG.recipePlaceholders.length; i++) {
            var ph = CONFIG.recipePlaceholders[i];
            var value = recipe[ph.field] || "";
            
            value = value.split("\n").join("<<<BR>>>");
            value = value.split("\\n").join("<<<BR>>>");
            
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
// IMAGE PLACEMENT (from v10)
// ============================================

function placeImageInSpread(spread, recipe, basePath) {
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
// OVERFLOW (from v10)
// ============================================

function checkForOverflow(spread) {
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
// PERSONALIZE FIXED PAGES
// ============================================

function personalizeFixedPages(doc, bookData) {
    var placeholders = CONFIG.bookPlaceholders;
    
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        if (value === null || value === undefined) continue;
        
        value = String(value).split("\n").join("\r");
        
        for (var f = 0; f < ph.finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = ph.finds[f];
            app.changeTextPreferences.changeTo = value;
            var results = doc.changeText();
            if (results.length > 0) {
                $.writeln("  Replaced '" + ph.finds[f] + "' (" + results.length + "x)");
            }
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
        
        for (var f = 0; f < ph.finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = ph.finds[f];
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