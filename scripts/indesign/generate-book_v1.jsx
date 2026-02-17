// ============================================
// SMALL PLATES — Book Generator v1.1
// Master script: generates a complete book
// from SmallPlates_MasterTemplate + book JSON
//
// v1.1 FIXES:
// - Removed frame position capture/restore
//   (was corrupting frames after first few recipes)
// - Flexible placeholder matching (spaces tolerated)
// - Cleaner spread duplication & removal
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
    // Each entry can have multiple "find" variants to handle spacing differences
    bookPlaceholders: [
        {finds: ["<<couple_first_name>>", "<< couple_first_name >>", "<<COUPLE_FIRST_NAME>>"], field: "couple.couple_first_name"},
        {finds: ["<<partner_first_name>>", "<< partner_first_name >>", "<<PARTNER_FIRST_NAME>>"], field: "couple.partner_first_name"},
        {finds: ["<<couple_display_name>>", "<< couple_display_name >>", "<<COUPLE_DISPLAY_NAME>>", "<<COUPLE_NAME>>"], field: "couple.couple_display_name"},
        {finds: ["<<contributor_count>>", "<< contributor_count >>", "<<number_guests>>", "<<NUMBER_GUESTS>>"], field: "contributors.count"},
        {finds: ["<<contributors_list>>", "<< contributors_list >>"], field: "_contributors_formatted"},
        {finds: ["<<captains_list>>", "<< captains_list >>"], field: "_captains_formatted"}
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
    bookData._contributors_formatted = bookData.contributors.list.join("\r");
    bookData._captains_formatted = bookData.captains.list.join("\r");
    bookData.contributors.count = String(bookData.contributors.count);
    
    // ── Confirm with user ──
    var recipes = bookData.recipes;
    var recipesWithImages = 0;
    for (var j = 0; j < recipes.length; j++) {
        if (recipes[j].local_image_path) recipesWithImages++;
    }
    
    if (!confirm("SMALL PLATES - Book Generator v1.1\n\n" +
                 "Pareja: " + bookData.couple.couple_display_name + "\n" +
                 "Recetas: " + recipes.length + " (" + recipesWithImages + " con imagen)\n" +
                 "Contributors: " + bookData.contributors.list.length + "\n" +
                 "Captains: " + bookData.captains.list.length + "\n\n" +
                 "Generar libro completo?")) {
        return;
    }
    
    // ── STEP 2: Find all labeled spreads ──
    $.writeln("\n=== STEP 2: Finding labeled spreads ===");
    
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
    
    $.writeln("All 8 labeled spreads found");
    
    // ── STEP 3: Personalize fixed pages ──
    $.writeln("\n=== STEP 3: Personalizing fixed pages ===");
    
    personalizeFixedPages(doc, bookData);
    $.writeln("Fixed pages personalized");
    
    // ── STEP 4: Calculate filler distribution ──
    $.writeln("\n=== STEP 4: Calculating filler positions ===");
    
    var totalRecipes = recipes.length;
    var fillerInterval = Math.floor(totalRecipes / 4);
    
    var fillerPositions = {
        filler1: fillerInterval,
        filler2: fillerInterval * 2,
        filler3: fillerInterval * 3,
        filler4: totalRecipes
    };
    
    $.writeln("Total recipes: " + totalRecipes);
    $.writeln("Filler interval: " + fillerInterval);
    $.writeln("Filler 1 after recipe #" + fillerPositions.filler1);
    $.writeln("Filler 2 after recipe #" + fillerPositions.filler2);
    $.writeln("Filler 3 after recipe #" + fillerPositions.filler3);
    $.writeln("Filler 4 after recipe #" + fillerPositions.filler4 + " (last)");
    
    // ── STEP 5: Generate recipes + fillers ──
    $.writeln("\n=== STEP 5: Generating recipes ===");
    
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
            
            $.writeln("\n--- Recipe " + (i + 1) + ": " + recipeName + " ---");
            
            // ── CASCADA: A → B → C ──
            // All insertions go BEFORE templateA (the anchor point)
            
            // Attempt 1: Template A (standard layout)
            var newSpread = duplicateSpreadBefore(doc, templateA, templateA);
            populateRecipeSpread(newSpread, recipes[i], basePath);
            
            doc.recompose();
            
            if (checkForOverflow(newSpread)) {
                $.writeln("  -> Overflow in A, trying B...");
                safeRemoveSpread(doc, newSpread);
                
                // Attempt 2: Template B (overflow with image)
                newSpread = duplicateSpreadBefore(doc, templateA, templateB);
                populateRecipeSpread(newSpread, recipes[i], basePath);
                
                doc.recompose();
                
                if (checkForOverflow(newSpread)) {
                    $.writeln("  -> Overflow in B, trying C...");
                    safeRemoveSpread(doc, newSpread);
                    
                    // Attempt 3: Template C (overflow, no image)
                    newSpread = duplicateSpreadBefore(doc, templateA, templateC);
                    populateRecipeSpread(newSpread, recipes[i], basePath);
                    
                    doc.recompose();
                    
                    if (checkForOverflow(newSpread)) {
                        $.writeln("  !! STILL OVERFLOW in C");
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
            $.writeln("  OK (" + (usedTemplateA.length > successCount - 1 ? "A" : usedTemplateB.length > 0 && usedTemplateB[usedTemplateB.length-1] === recipeName ? "B" : "C") + ")");
            
            // ── INSERT FILLER if needed ──
            var recipeNumber = i + 1;
            
            if (recipeNumber === fillerPositions.filler1) {
                duplicateSpreadBefore(doc, templateA, filler1);
                fillersInserted++;
                $.writeln("  >> Filler 1 inserted");
            }
            if (recipeNumber === fillerPositions.filler2) {
                duplicateSpreadBefore(doc, templateA, filler2);
                fillersInserted++;
                $.writeln("  >> Filler 2 inserted");
            }
            if (recipeNumber === fillerPositions.filler3) {
                duplicateSpreadBefore(doc, templateA, filler3);
                fillersInserted++;
                $.writeln("  >> Filler 3 inserted");
            }
            if (recipeNumber === fillerPositions.filler4) {
                duplicateSpreadBefore(doc, templateA, filler4);
                fillersInserted++;
                $.writeln("  >> Filler 4 (final) inserted");
            }
            
        } catch (e) {
            $.writeln("ERROR recipe " + (i + 1) + " (" + recipeName + "): " + e.message);
            $.writeln("  Line: " + e.line);
        }
    }
    
    progressWin.close();
    
    $.writeln("\n" + successCount + " recipes generated, " + fillersInserted + " fillers inserted");
    
    // ── STEP 6: Populate Contributors + Captains ──
    $.writeln("\n=== STEP 6: Populating contributors ===");
    
    contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    if (contributorsSpread) {
        populateContributors(contributorsSpread, bookData);
        $.writeln("Contributors and captains populated");
    } else {
        $.writeln("WARNING: Contributors spread not found");
    }
    
    // ── STEP 7: Delete template spreads ──
    $.writeln("\n=== STEP 7: Cleaning up templates ===");
    
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
    for (var t = templatesToRemove.length - 1; t >= 0; t--) {
        var templateSpread = findSpreadByLabel(doc, templatesToRemove[t]);
        if (templateSpread) {
            try {
                safeRemoveSpread(doc, templateSpread);
                removedCount++;
                $.writeln("Removed: " + templatesToRemove[t]);
            } catch (e) {
                $.writeln("Error removing " + templatesToRemove[t] + ": " + e.message);
            }
        }
    }
    
    $.writeln(removedCount + " template spreads removed");
    
    // ── STEP 8: Update TOC ──
    $.writeln("\n=== STEP 8: Updating TOC ===");
    
    try {
        app.menuActions.itemByName("Update Table of Contents").invoke();
        $.writeln("TOC updated");
    } catch (tocError) {
        $.writeln("Could not auto-update TOC: " + tocError.message);
        $.writeln("-> Update manually: Layout > Update Table of Contents");
    }
    
    // ── STEP 9: Save As ──
    $.writeln("\n=== STEP 9: Saving ===");
    
    var coupleName = bookData.couple.couple_display_name
        .replace(/[^a-zA-Z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1&\s]/g, "")
        .replace(/\s+/g, "_");
    var newFileName = "SmallPlates_" + coupleName + ".indd";
    
    var savePath = new File(basePath.fsName + "/" + newFileName);
    
    try {
        doc.saveACopy(savePath);
        $.writeln("Saved: " + savePath.fsName);
    } catch (e) {
        $.writeln("Could not auto-save: " + e.message);
    }
    
    // ── FINAL REPORT ──
    var msg = "LIBRO GENERADO!\n\n";
    msg += bookData.couple.couple_display_name + "\n\n";
    msg += "Recetas: " + successCount + "\n";
    msg += "Imagenes: " + imagesPlaced + "\n";
    msg += "Fillers: " + fillersInserted + "\n";
    msg += "Templates eliminados: " + removedCount + "\n\n";
    msg += "Distribucion:\n";
    msg += "  A (estandar): " + usedTemplateA.length + "\n";
    msg += "  B (overflow+img): " + usedTemplateB.length + "\n";
    msg += "  C (overflow-img): " + usedTemplateC.length + "\n";
    
    if (usedTemplateB.length > 0) {
        msg += "\nTemplate B:\n";
        for (var b = 0; b < usedTemplateB.length; b++) {
            msg += "  " + usedTemplateB[b] + "\n";
        }
    }
    
    if (usedTemplateC.length > 0) {
        msg += "\nTemplate C:\n";
        for (var c = 0; c < usedTemplateC.length; c++) {
            msg += "  " + usedTemplateC[c] + "\n";
        }
    }
    
    if (stillOverflow.length > 0) {
        msg += "\nOVERFLOW en C:\n";
        for (var ov = 0; ov < stillOverflow.length; ov++) {
            msg += "  " + stillOverflow[ov] + "\n";
        }
    }
    
    msg += "\nGuardado: " + newFileName;
    msg += "\n\nRevisa TOC: Layout > Update Table of Contents";
    
    alert(msg);
}

// ============================================
// SPREAD OPERATIONS
// ============================================

function findSpreadByLabel(doc, label) {
    for (var i = 0; i < doc.spreads.length; i++) {
        if (doc.spreads[i].label === label) {
            return doc.spreads[i];
        }
    }
    return null;
}

// Duplicate sourceSpread and place it BEFORE anchorSpread
// No position restoration — let InDesign handle it natively
function duplicateSpreadBefore(doc, anchorSpread, sourceSpread) {
    var newSpread = sourceSpread.duplicate(LocationOptions.BEFORE, anchorSpread);
    return newSpread;
}

// Safely remove a spread by removing all its pages
function safeRemoveSpread(doc, spread) {
    // Get page references first
    var pageNames = [];
    for (var p = 0; p < spread.pages.length; p++) {
        pageNames.push(spread.pages[p].name);
    }
    
    // Remove pages in reverse order
    for (var p = spread.pages.length - 1; p >= 0; p--) {
        try {
            spread.pages[p].remove();
        } catch (e) {
            $.writeln("  Warning: could not remove page " + pageNames[p] + ": " + e.message);
        }
    }
}

// ============================================
// RECIPE POPULATION
// ============================================

// Populate a single recipe spread with data + image
function populateRecipeSpread(spread, recipe, basePath) {
    // Replace text placeholders
    replaceInSpread(spread, recipe, CONFIG.recipePlaceholders);
    
    // Place image
    placeImageInSpread(spread, recipe, basePath);
}

// Replace placeholders in all text frames of a spread
function replaceInSpread(spread, data, placeholders) {
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            if (allItems[i] instanceof TextFrame) {
                replaceInTextFrame(allItems[i], data, placeholders);
            }
        }
    }
}

function replaceInTextFrame(tf, data, placeholders) {
    try {
        var story = tf.parentStory;
        
        for (var i = 0; i < placeholders.length; i++) {
            var ph = placeholders[i];
            
            // Get value
            var value;
            if (ph.field.indexOf(".") >= 0) {
                value = getNestedValue(data, ph.field);
            } else {
                value = data[ph.field];
            }
            
            value = (value !== null && value !== undefined) ? String(value) : "";
            
            // Convert line breaks to marker
            value = value.split("\n").join("<<<BR>>>");
            value = value.split("\\n").join("<<<BR>>>");
            
            // Replace main placeholder
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = ph.find;
            app.changeTextPreferences.changeTo = value;
            story.changeText();
            
            // Replace alt placeholder (guillemets «»)
            if (ph.alt) {
                app.findTextPreferences = null;
                app.changeTextPreferences = null;
                app.findTextPreferences.findWhat = ph.alt;
                app.changeTextPreferences.changeTo = value;
                story.changeText();
            }
        }
        
        // Convert markers to InDesign paragraph breaks
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
// PERSONALIZE FIXED PAGES (pp. 6-9)
// Uses document-wide find/replace
// Supports multiple find variants per placeholder
// ============================================

function personalizeFixedPages(doc, bookData) {
    var placeholders = CONFIG.bookPlaceholders;
    
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        
        if (value === null || value === undefined) {
            $.writeln("  No value for: " + ph.field);
            continue;
        }
        
        value = String(value);
        value = value.split("\n").join("\r");
        
        // Try each find variant
        var finds = ph.finds;
        var replaced = false;
        
        for (var f = 0; f < finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = finds[f];
            app.changeTextPreferences.changeTo = value;
            
            var results = doc.changeText();
            
            if (results.length > 0) {
                $.writeln("  Replaced '" + finds[f] + "' -> " + (value.length > 40 ? value.substring(0, 40) + "..." : value) + " (" + results.length + " instances)");
                replaced = true;
            }
        }
        
        if (!replaced) {
            $.writeln("  WARNING: No match found for field: " + ph.field);
            $.writeln("    Tried: " + finds.join(", "));
        }
    }
    
    app.findTextPreferences = null;
    app.changeTextPreferences = null;
}

// Populate contributors spread separately
function populateContributors(spread, bookData) {
    var placeholders = CONFIG.bookPlaceholders;
    
    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        
        if (value === null || value === undefined) continue;
        
        value = String(value);
        value = value.split("\n").join("\r");
        
        var finds = ph.finds;
        
        for (var f = 0; f < finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = finds[f];
            app.changeTextPreferences.changeTo = value;
            
            // Search within this spread's stories only
            for (var p = 0; p < spread.pages.length; p++) {
                var allItems = spread.pages[p].allPageItems;
                for (var it = 0; it < allItems.length; it++) {
                    if (allItems[it] instanceof TextFrame) {
                        try {
                            allItems[it].parentStory.changeText();
                        } catch (e) {}
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

function placeImageInSpread(spread, recipe, basePath) {
    if (!recipe.local_image_path) return false;
    
    var imagePath = basePath.fsName + "/" + recipe.local_image_path;
    var imageFile = new File(imagePath);
    
    if (!imageFile.exists) {
        $.writeln("  Image not found: " + imagePath);
        return false;
    }
    
    // Find frame with image label
    for (var p = 0; p < spread.pages.length; p++) {
        var allItems = spread.pages[p].allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            if (allItems[i].label === CONFIG.imageFrameLabel) {
                try {
                    allItems[i].place(imageFile);
                    allItems[i].fit(FitOptions.FILL_PROPORTIONALLY);
                    allItems[i].sendToBack();
                    return true;
                } catch (e) {
                    $.writeln("  Error placing image: " + e.message);
                    return false;
                }
            }
        }
    }
    
    return false;
}

// ============================================
// OVERFLOW DETECTION
// ============================================

function checkForOverflow(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var allItems = spread.pages[p].allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            if (allItems[i] instanceof TextFrame && allItems[i].overflows) {
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