// label-objects-that-stay.jsx
// Adds label to the Objects that Stay section
// Run once on the master template

var doc = app.activeDocument;

// Objects that Stay starts at page 38
var labelMap = {
    "38": "OBJECTS_THAT_STAY"
};

var count = 0;

for (var i = 0; i < doc.spreads.length; i++) {
    var spread = doc.spreads[i];
    var firstPageName = spread.pages[0].name;
    
    if (labelMap[firstPageName]) {
        spread.label = labelMap[firstPageName];
        count++;
    }
}

alert("Listo! " + count + " spread etiquetado.\n\n38-39 → OBJECTS_THAT_STAY");