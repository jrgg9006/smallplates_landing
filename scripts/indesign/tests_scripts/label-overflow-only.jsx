// label-overflow-only.jsx
// Surgical: adds INDEX_OVERFLOW label to specific spreads.
// Does NOT clear any existing labels — safe to re-run, safe to mix with label-spreads2.jsx.
//
// Edit overflowFirstPages if the index layout changes.

var doc = app.activeDocument;

// Spreads (by first-page name) that should carry the INDEX_OVERFLOW label.
// Current layout: 14-15 obligatorio (sin label), 16-17 / 18-19 / 20-21 / 22-23 son overflow.
var overflowFirstPages = ["16", "18", "20", "22"];

var labeled = [];
var alreadyLabeled = [];
var notFound = [];

for (var t = 0; t < overflowFirstPages.length; t++) {
    var targetName = overflowFirstPages[t];
    var found = false;

    for (var i = 0; i < doc.spreads.length; i++) {
        var spread = doc.spreads[i];
        if (spread.pages[0].name === targetName) {
            found = true;
            if (spread.label === "INDEX_OVERFLOW") {
                alreadyLabeled.push(targetName);
            } else {
                spread.label = "INDEX_OVERFLOW";
                labeled.push(targetName);
            }
            break;
        }
    }

    if (!found) notFound.push(targetName);
}

var msg = "INDEX_OVERFLOW — label quirúrgico\n\n";
msg += "Etiquetados ahora: " + (labeled.length === 0 ? "ninguno" : labeled.join(", ")) + "\n";
msg += "Ya tenían el label: " + (alreadyLabeled.length === 0 ? "ninguno" : alreadyLabeled.join(", ")) + "\n";
if (notFound.length > 0) {
    msg += "NO encontrados (¿cambió la paginación?): " + notFound.join(", ");
}

alert(msg);
