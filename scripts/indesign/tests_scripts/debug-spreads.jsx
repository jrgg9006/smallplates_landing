// debug-spreads.jsx
// Muestra TODOS los spreads con sus nombres de página reales
// Correr para diagnosticar por qué label-spreads.jsx no encuentra algunos spreads

var doc = app.activeDocument;
var info = "Total spreads: " + doc.spreads.length + "\n";
info += "Total pages: " + doc.pages.length + "\n\n";
info += "SPREAD INDEX | PAGES | LABEL ACTUAL\n";
info += "─────────────────────────────────────\n";

for (var i = 0; i < doc.spreads.length; i++) {
    var spread = doc.spreads[i];
    var pageNames = [];
    for (var j = 0; j < spread.pages.length; j++) {
        pageNames.push(spread.pages[j].name);
    }
    var label = spread.label || "(sin label)";
    info += "Spread [" + i + "]  |  Pages: " + pageNames.join(", ") + "  |  Label: " + label + "\n";
}

// Mostrar en alert (truncado si es muy largo)
if (info.length > 2000) {
    alert(info.substring(0, 2000) + "\n\n... (truncado, ver consola ESTK para el completo)");
} else {
    alert(info);
}

// Tambien al console de ESTK
$.writeln(info);
