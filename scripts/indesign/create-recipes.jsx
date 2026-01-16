// ============================================
// SMALL PLATES - Generador de Recetas v6
// Script para InDesign
// ============================================

// ============================================
// CONFIGURACIÓN
// ============================================
var CONFIG = {
    placeholders: [
        {find: "<<recipe_name>>", field: "recipe_name"},
        {find: "<<guest_name>>", field: "guest_name"},
        {find: "<<comments>>", field: "comments"},
        {find: "<<ingredients>>", field: "ingredients"},
        {find: "<<instructions>>", field: "instructions"}
    ]
};

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
function main() {
    if (app.documents.length === 0) {
        alert("Error: No hay documento abierto.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // Obtener spread activo
    var templateSpread = null;
    if (app.activeWindow && app.activeWindow.activePage) {
        templateSpread = app.activeWindow.activePage.parent;
    }
    
    if (templateSpread === null) {
        alert("Error: No se detectó el spread actual.");
        return;
    }
    
    // Seleccionar JSON
    var jsonFile = File.openDialog("Selecciona el archivo JSON", "JSON:*.json");
    if (jsonFile === null) return;
    
    // Leer JSON
    var recipes = readJSON(jsonFile);
    if (recipes === null || recipes.length === 0) {
        alert("Error: No se pudieron leer las recetas.");
        return;
    }
    
    if (!confirm("Se crearán " + recipes.length + " spreads.\n\n¿Continuar?")) {
        return;
    }
    
    // Progreso
    var progressWin = createProgressWindow(recipes.length);
    progressWin.show();
    
    var successCount = 0;
    
    for (var i = 0; i < recipes.length; i++) {
        try {
            updateProgress(progressWin, i + 1, recipes.length, recipes[i].recipe_name);
            
            // Duplicar spread
            var newSpread = templateSpread.duplicate(LocationOptions.AT_END);
            
            // Reemplazar en TODOS los text frames del spread
            replaceInAllTextFrames(newSpread, recipes[i]);
            
            successCount++;
        } catch (e) {
            $.writeln("Error: " + e.message);
        }
    }
    
    progressWin.close();
    
    if (confirm("¡Listo! " + successCount + " recetas.\n\n¿Eliminar template original?")) {
        try {
            for (var p = templateSpread.pages.length - 1; p >= 0; p--) {
                templateSpread.pages[p].remove();
            }
        } catch (e) {}
    }
    
    alert("Proceso completado.");
}

// ============================================
// REEMPLAZAR EN TODOS LOS TEXT FRAMES
// ============================================
function replaceInAllTextFrames(spread, recipe) {
    // Iterar cada página del spread
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        
        // Obtener TODOS los text frames (incluyendo anidados)
        var allItems = page.allPageItems;
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            
            if (item instanceof TextFrame) {
                replaceInTextFrame(item, recipe);
            }
        }
    }
}

// ============================================
// REEMPLAZAR EN UN TEXT FRAME
// ============================================
function replaceInTextFrame(tf, recipe) {
    try {
        var story = tf.parentStory;
        
        // Limpiar preferencias
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        
        // Reemplazar cada placeholder
        for (var i = 0; i < CONFIG.placeholders.length; i++) {
            var ph = CONFIG.placeholders[i];
            var value = recipe[ph.field] || "";
            
            // Convertir \n a marcador temporal
            value = value.split("\\n").join("<<<BR>>>");
            
            app.findTextPreferences.findWhat = ph.find;
            app.changeTextPreferences.changeTo = value;
            
            story.changeText();
        }
        
        // Convertir marcadores a saltos de línea
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        app.findTextPreferences.findWhat = "<<<BR>>>";
        app.changeTextPreferences.changeTo = "\r";
        story.changeText();
        
        // Limpiar
        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        
    } catch (e) {
        // Ignorar errores en frames individuales
    }
}

// ============================================
// LEER JSON
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

// ============================================
// PROGRESO
// ============================================
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

// ============================================
// EJECUTAR
// ============================================
main();