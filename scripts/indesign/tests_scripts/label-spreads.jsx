// label-spreads.jsx
// Asigna Script Labels a los spreads del template maestro
// Correr una sola vez para preparar el template

var doc = app.activeDocument;

// Mapeo: número de primera página del spread → label deseado
var labelMap = {
    "22": "TEMPLATE_RECIPE_A",
    "24": "TEMPLATE_RECIPE_B",
    "26": "TEMPLATE_RECIPE_C",
    "28": "TEMPLATE_FILLER_1",
    "30": "TEMPLATE_FILLER_2",
    "32": "TEMPLATE_FILLER_3",
    "34": "TEMPLATE_FILLER_4",
    "36": "OBJECTS_THAT_STAY",
    "50": "CONTRIBUTORS"
};

// Paso 1: Limpiar TODOS los labels existentes
for (var i = 0; i < doc.spreads.length; i++) {
    doc.spreads[i].label = "";
}
$.writeln("🧹 Todos los labels limpiados.");

// Paso 2: Asignar labels nuevos
var count = 0;

for (var i = 0; i < doc.spreads.length; i++) {
    var spread = doc.spreads[i];
    var firstPageName = spread.pages[0].name;

    if (labelMap[firstPageName]) {
        spread.label = labelMap[firstPageName];
        count++;
        $.writeln("✅ Spread " + firstPageName + " → " + labelMap[firstPageName]);
    }
}

alert("¡Listo! " + count + " spreads etiquetados.\n\n" +
      "Spreads etiquetados:\n" +
      "22-23 → TEMPLATE_RECIPE_A\n" +
      "24-25 → TEMPLATE_RECIPE_B\n" +
      "26-27 → TEMPLATE_RECIPE_C\n" +
      "28-29 → TEMPLATE_FILLER_1\n" +
      "30-31 → TEMPLATE_FILLER_2\n" +
      "32-33 → TEMPLATE_FILLER_3\n" +
      "34-35 → TEMPLATE_FILLER_4\n" +
      "36-37 → OBJECTS_THAT_STAY\n" +
      "50-51 → CONTRIBUTORS");