// ============================================
// SMALL PLATES - Generador de Recetas v8
// Script para InDesign - Con imágenes y detección de overflow
// ============================================

var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    placeholders: [
        {find: "<<recipe_name>>", field: "recipe_name"},
        {find: "<<guest_name>>", field: "guest_name"},
        {find: "<<comments>>", field: "comments"},
        {find: "<<ingredients>>", field: "ingredients"},
        {find: "<<instructions>>", field: "instructions"}
    ]
};

function main() {
    if (app.documents.length === 0) {
        alert("Error: No hay documento abierto.");
        return;
    }
    
    var doc = app.activeDocument;
    
    var templateSpread = null;
    if (app.activeWindow && app.activeWindow.activePage) {
        templateSpread = app.activeWindow.activePage.parent;
    }
    
    if (templateSpread === null) {
        alert("Error: No se detectó el spread actual.");
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
    
    if (!confirm("Se crearán " + recipes.length + " spreads.\n" + recipesWithImages + " tienen imagen.\n\n¿Continuar?")) {
        return;
    }
    
    var progressWin = createProgressWindow(recipes.length);
    progressWin.show();
    
    var successCount = 0;
    var imagesPlaced = 0;
    var overflowRecipes = [];
    
    for (var i = 0; i < recipes.length; i++) {
        try {
            updateProgress(progressWin, i + 1, recipes.length, recipes[i].recipe_name);
            
            var newSpread = templateSpread.duplicate(LocationOptions.AT_END);
            
            replaceInAllTextFrames(newSpread, recipes[i]);
            
            if (placeImageInSpread(newSpread, recipes[i], basePath)) {
                imagesPlaced++;
            }
            
            // Detectar overflow
            if (checkForOverflow(newSpread)) {
                overflowRecipes.push(recipes[i].recipe_name);
            }
            
            successCount++;
        } catch (e) {
            $.writeln("Error: " + e.message);
        }
    }
    
    progressWin.close();
    
    if (confirm("¡Listo!\n\n" + successCount + " recetas creadas.\n" + imagesPlaced + " imágenes colocadas.\n\n¿Eliminar template original?")) {
        try {
            for (var p = templateSpread.pages.length - 1; p >= 0; p--) {
                templateSpread.pages[p].remove();
            }
        } catch (e) {}
    }
    
    // Mensaje final con overflow
    var finalMessage = "Proceso completado.\n\n" + successCount + " recetas.\n" + imagesPlaced + " imágenes.";
    
    if (overflowRecipes.length > 0) {
        finalMessage += "\n\n⚠️ RECETAS CON OVERFLOW (" + overflowRecipes.length + "):\n";
        for (var k = 0; k < overflowRecipes.length; k++) {
            finalMessage += "• " + overflowRecipes[k] + "\n";
        }
    }
    
    alert(finalMessage);
}

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
    
    $.writeln("No se encontró frame con label: " + CONFIG.imageFrameLabel);
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
            
            value = value.split("\\n").join("<<<BR>>>");
            
            app.findTextPreferences.findWhat = ph.find;
            app.changeTextPreferences.changeTo = value;
            
            story.changeText();
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
    win.statusText.preferredSize = [300, 20];
    win.progressBar = win.add("progressbar", undefined, 0, total);
    win.progressBar.preferredSize = [300, 20];
    win.recipeText = win.add("statictext", undefined, "");
    win.recipeText.preferredSize = [300, 20];
    return win;
}

function updateProgress(win, current, total, name) {
    win.statusText.text = current + " de " + total;
    win.progressBar.value = current;
    win.recipeText.text = name || "";
    win.update();
}

main();