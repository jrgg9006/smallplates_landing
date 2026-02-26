// label-spreads.jsx
// Asigna Script Labels a los spreads del template maestro
// Correr una sola vez para preparar el template
// Updated: pages 20-21 added as INDEX_OVERFLOW, everything after shifted +2

var doc = app.activeDocument;

// Mapeo: número de primera página del spread → label deseado
var labelMap = {
    "20": "INDEX_OVERFLOW",
    "24": "TEMPLATE_RECIPE_A",
    "26": "TEMPLATE_RECIPE_B",
    "28": "TEMPLATE_RECIPE_C",
    "30": "TEMPLATE_FILLER_1",
    "32": "TEMPLATE_FILLER_2",
    "34": "TEMPLATE_FILLER_3",
    "36": "TEMPLATE_FILLER_4",
    "38": "OBJECTS_THAT_STAY",
    "52": "CONTRIBUTORS"
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
      "20-21 → INDEX_OVERFLOW\n" +
      "24-25 → TEMPLATE_RECIPE_A\n" +
      "26-27 → TEMPLATE_RECIPE_B\n" +
      "28-29 → TEMPLATE_RECIPE_C\n" +
      "30-31 → TEMPLATE_FILLER_1\n" +
      "32-33 → TEMPLATE_FILLER_2\n" +
      "34-35 → TEMPLATE_FILLER_3\n" +
      "36-37 → TEMPLATE_FILLER_4\n" +
      "38-39 → OBJECTS_THAT_STAY\n" +
      "52-53 → CONTRIBUTORS");
