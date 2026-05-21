// label-recipe-a-ingredients.jsx
// Surgical: adds TEMPLATE_RECIPE_A_INGREDIENTS label to the spread starting at page 30.
// Does NOT clear any existing labels — safe to re-run.

var doc = app.activeDocument;

var targetPage = "30";
var targetLabel = "TEMPLATE_RECIPE_A_INGREDIENTS";

var found = false;
var alreadyLabeled = false;

for (var i = 0; i < doc.spreads.length; i++) {
    var spread = doc.spreads[i];
    if (spread.pages[0].name === targetPage) {
        found = true;
        if (spread.label === targetLabel) {
            alreadyLabeled = true;
        } else {
            spread.label = targetLabel;
        }
        break;
    }
}

if (!found) {
    alert("NO se encontró spread que empiece en página " + targetPage + ".\n¿Cambió la paginación?");
} else if (alreadyLabeled) {
    alert("Spread página " + targetPage + " YA tenía el label '" + targetLabel + "'.\nNada que hacer.");
} else {
    alert("✅ Label '" + targetLabel + "' aplicado al spread de página " + targetPage + ".");
}
