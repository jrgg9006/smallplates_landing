// ============================================
// SMALL PLATES - Generador de Recetas v10
// Script para InDesign - Cascada de templates A→B→C
// ============================================

var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    placeholders: [
        {find: "<<recipe_name>>", alt: "\u00ABrecipe_name\u00BB", field: "recipe_name"},
        {find: "<<guest_name>>", alt: "\u00ABguest_name\u00BB", field: "guest_name"},
        {find: "<<comments>>", alt: "\u00ABcomments\u00BB", field: "comments"},
        {find: "<<ingredients>>", alt: "\u00ABingredients\u00BB", field: "ingredients"},
        {find: "<<instructions>>", alt: "\u00ABinstructions\u00BB", field: "instructions"}
    ]
};

// ============================================
// FIX: Capture and restore frame positions
// InDesign bug shifts overridden parent items
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
                    $.writeln("WARNING: Label mismatch at page " + p + " index " + i + 
                              ": expected '" + saved.label + "' got '" + item.label + "'");
                    continue;
                }
                
                item.geometricBounds = saved.bounds;
            } catch (e) {
                $.writeln("Could not restore position for item " + i + " on page " + p + ": " + e.message);
            }
        }
    }
}

// ============================================
// Remove a spread (all its pages)
// ============================================

function removeSpread(spread) {
    for (var p = spread.pages.length - 1; p >= 0; p--) {
        spread.pages[p].remove();
    }
}

// ============================================
// Process a single recipe on a given template
// Returns the new spread, or null if failed
// ============================================

function processRecipeOnTemplate(templateSpread, savedPositions, recipe, basePath) {
    var newSpread = templateSpread.duplicate(LocationOptions.AT_END);
    restoreFramePositions(newSpread, savedPositions);
    replaceInAllTextFrames(newSpread, recipe);
    placeImageInSpread(newSpread, recipe, basePath);
    
    // Force InDesign to recompose text before checking overflow
    app.activeDocument.recompose();
    
    return newSpread;
}

// ============================================
// Main
// ============================================

function main() {
    if (app.documents.length === 0) {
        alert("Error: No hay documento abierto.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // ============================================
    // Detect the 3 template spreads
    // Spread 1 = Template A (G-Parent, standard)
    // Spread 2 = Template B (A-TextOverflow w-image)
    // Spread 3 = Template C (B-TextOverflow full-text)
    // ============================================
    
    if (doc.spreads.length < 4) {
        alert("Error: Se necesitan al menos 4 spreads en el documento.\n\n" +
              "Spread 0 = Página sola (portada/inicio)\n" +
              "Spread 1 = Template A (estándar)\n" +
              "Spread 2 = Template B (overflow con imagen)\n" +
              "Spread 3 = Template C (overflow sin imagen)");
        return;
    }
    
    var templateA = doc.spreads[1];
    var templateB = doc.spreads[2];
    var templateC = doc.spreads[3];
    
    // Confirm with user
    if (!confirm("Templates detectados:\n\n" +
                 "Spread 1 → Template A (estándar con imagen full)\n" +
                 "Spread 2 → Template B (overflow con imagen reducida)\n" +
                 "Spread 3 → Template C (overflow sin imagen)\n\n" +
                 "¿Es correcto?")) {
        return;
    }
    
    var jsonFile = File.openDialog("Selecciona el archivo JSON", "JSON:*.json");
    if (jsonFile === null) return;
    
    var basePath = jsonFile.parent;
    
    var recipes = readJSON(jsonFile);
    if (recipes === null || recipes.length === 0) {
        alert("Error: No se pudieron leer las recetas.");
        return;
    }
    
    var recipesWithImages = 0;
    for (var j = 0; j < recipes.length; j++) {
        if (recipes[j].local_image_path) recipesWithImages++;
    }
    
    if (!confirm("Se procesarán " + recipes.length + " recetas.\n" + 
                 recipesWithImages + " tienen imagen.\n\n" +
                 "El script usará Template A primero.\n" +
                 "Si hay overflow → Template B.\n" +
                 "Si aún hay overflow → Template C.\n\n" +
                 "¿Continuar?")) {
        return;
    }
    
    // Capture positions for all 3 templates
    var positionsA = captureFramePositions(templateA);
    var positionsB = captureFramePositions(templateB);
    var positionsC = captureFramePositions(templateC);
    
    $.writeln("Template A: " + positionsA.length + " pages");
    $.writeln("Template B: " + positionsB.length + " pages");
    $.writeln("Template C: " + positionsC.length + " pages");
    
    var progressWin = createProgressWindow(recipes.length);
    progressWin.show();
    
    // Tracking
    var successCount = 0;
    var imagesPlaced = 0;
    var usedTemplateA = [];
    var usedTemplateB = [];
    var usedTemplateC = [];
    var stillOverflow = [];
    
    for (var i = 0; i < recipes.length; i++) {
        try {
            var recipeName = recipes[i].recipe_name || ("Receta " + (i + 1));
            updateProgress(progressWin, i + 1, recipes.length, recipeName);
            
            // ============================================
            // CASCADA: A → B → C
            // ============================================
            
            // Intento 1: Template A
            var newSpread = processRecipeOnTemplate(templateA, positionsA, recipes[i], basePath);
            
            if (checkForOverflow(newSpread)) {
                // Template A tiene overflow → eliminar y probar B
                $.writeln(recipeName + " → overflow en A, intentando B...");
                removeSpread(newSpread);
                
                // Intento 2: Template B
                newSpread = processRecipeOnTemplate(templateB, positionsB, recipes[i], basePath);
                
                if (checkForOverflow(newSpread)) {
                    // Template B también tiene overflow → eliminar y usar C
                    $.writeln(recipeName + " → overflow en B, usando C...");
                    removeSpread(newSpread);
                    
                    // Intento 3: Template C (último recurso)
                    newSpread = processRecipeOnTemplate(templateC, positionsC, recipes[i], basePath);
                    
                    if (checkForOverflow(newSpread)) {
                        // Incluso Template C tiene overflow
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
        } catch (e) {
            $.writeln("Error con receta " + i + ": " + e.message);
        }
    }
    
    progressWin.close();
    
    // ============================================
    // Eliminar templates originales
    // ============================================
    if (confirm("¡Listo!\n\n" + successCount + " recetas creadas.\n\n" +
                "Template A: " + usedTemplateA.length + " recetas\n" +
                "Template B: " + usedTemplateB.length + " recetas\n" +
                "Template C: " + usedTemplateC.length + " recetas\n\n" +
                "¿Eliminar los 3 spreads template?")) {
        try {
            // Remove in reverse order to preserve indices
            removeSpread(templateC);
            removeSpread(templateB);
            removeSpread(templateA);
        } catch (e) {
            $.writeln("Error eliminando templates: " + e.message);
        }
    }
    
    // ============================================
    // Mensaje final
    // ============================================
    var finalMessage = "✅ Proceso completado.\n\n";
    finalMessage += successCount + " recetas creadas.\n";
    finalMessage += imagesPlaced + " imágenes colocadas.\n\n";
    finalMessage += "📊 Distribución de templates:\n";
    finalMessage += "   A (estándar): " + usedTemplateA.length + "\n";
    finalMessage += "   B (overflow + imagen): " + usedTemplateB.length + "\n";
    finalMessage += "   C (overflow sin imagen): " + usedTemplateC.length + "\n";
    
    if (usedTemplateB.length > 0) {
        finalMessage += "\n📋 Recetas en Template B:\n";
        for (var b = 0; b < usedTemplateB.length; b++) {
            finalMessage += "   • " + usedTemplateB[b] + "\n";
        }
    }
    
    if (usedTemplateC.length > 0) {
        finalMessage += "\n📋 Recetas en Template C:\n";
        for (var c = 0; c < usedTemplateC.length; c++) {
            finalMessage += "   • " + usedTemplateC[c] + "\n";
        }
    }
    
    if (stillOverflow.length > 0) {
        finalMessage += "\n⚠️ RECETAS CON OVERFLOW INCLUSO EN TEMPLATE C (" + stillOverflow.length + "):\n";
        for (var s = 0; s < stillOverflow.length; s++) {
            finalMessage += "   • " + stillOverflow[s] + "\n";
        }
    }
    
    alert(finalMessage);
}

// ============================================
// Helper: check if spread has a placed image
// ============================================

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
// Core functions
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

function placeImageInSpread(spread, recipe, basePath) {
    if (!recipe.local_image_path) {
        return false;
    }
    
    var imagePath = basePath + "/" + recipe.local_image_path;
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
    
    // Template C may not have an image frame - that's OK
    return false;
}

function replaceInAllTextFrames(spread, recipe) {
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            
            if (item instanceof TextFrame) {
                replaceInTextFrame(item, recipe);
            }
        }
    }
}

function replaceInTextFrame(tf, recipe) {
    try {
        var story = tf.parentStory;
        
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        
        for (var i = 0; i < CONFIG.placeholders.length; i++) {
            var ph = CONFIG.placeholders[i];
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
    var win = new Window("palette", "Generando...", undefined, {closeButton: false});
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.statusText = win.add("statictext", undefined, "Preparando...");
    win.statusText.preferredSize = [350, 20];
    win.progressBar = win.add("progressbar", undefined, 0, total);
    win.progressBar.preferredSize = [350, 20];
    win.recipeText = win.add("statictext", undefined, "");
    win.recipeText.preferredSize = [350, 20];
    win.templateText = win.add("statictext", undefined, "");
    win.templateText.preferredSize = [350, 20];
    return win;
}

function updateProgress(win, current, total, name) {
    win.statusText.text = current + " de " + total;
    win.progressBar.value = current;
    win.recipeText.text = name || "";
    win.update();
}

main();