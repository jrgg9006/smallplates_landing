// ============================================
// DIAGNÓSTICO - Revisa los 3 template spreads
// ============================================

var doc = app.activeDocument;
var report = "";

for (var s = 0; s < 3 && s < doc.spreads.length; s++) {
    var spread = doc.spreads[s];
    report += "=== SPREAD " + (s + 1) + " ===\n";
    report += "Pages: " + spread.pages.length + "\n";
    
    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var allItems = page.allPageItems;
        report += "\n  Page " + (p + 1) + ": " + allItems.length + " items\n";
        
        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            var type = item.constructor.name;
            var label = item.label || "(sin label)";
            
            if (item instanceof TextFrame) {
                var content = "";
                try {
                    content = item.contents.substring(0, 50);
                } catch(e) {
                    content = "(error leyendo)";
                }
                report += "    [" + i + "] TextFrame | label: " + label + " | texto: \"" + content + "\"\n";
            } else {
                report += "    [" + i + "] " + type + " | label: " + label + "\n";
            }
        }
    }
    report += "\n";
}

// Test: duplicar spread 0 y ver si mantiene items
report += "=== TEST DUPLICATE ===\n";
var testSpread = doc.spreads[0].duplicate(LocationOptions.AT_END);
for (var p = 0; p < testSpread.pages.length; p++) {
    var page = testSpread.pages[p];
    var allItems = page.allPageItems;
    report += "Duplicado Page " + (p + 1) + ": " + allItems.length + " items\n";
    
    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        if (item instanceof TextFrame) {
            var content = "";
            try {
                content = item.contents.substring(0, 50);
            } catch(e) {
                content = "(error)";
            }
            report += "    [" + i + "] TextFrame | label: " + item.label + " | texto: \"" + content + "\"\n";
        }
    }
}

// Limpiar el spread de prueba
for (var p = testSpread.pages.length - 1; p >= 0; p--) {
    testSpread.pages[p].remove();
}

alert(report);