// ============================================
// SMALL PLATES — Cover Generator v1.0
// ExtendScript para InDesign
// 
// Abre SmallPlates_cover_MixamV.indd (template master)
// Lee el JSON del libro (mismo que genera fetch-book.js)
// Ajusta spine, dimensiones, posiciones, y nombres
//
// USO: Abrir el template master → Scripts panel → generate-cover.jsx
// ============================================

// ============================================
// CONFIGURACIÓN BASE
// Estos valores corresponden al template master
// con spine de 0.75" (156 páginas)
// ============================================

var BASE = {
    // Dimensiones Mixam (constantes)
    COVER_WIDTH: 8.0,       // Ancho de cada tapa
    HINGE: 0.2,             // Área de bisagra entre tapa y lomo
    BLEED: 0.8,             // Bleed de la cover
    DOC_HEIGHT: 10.0,       // Alto de la página

    // Cálculo del spine
    // Calibrado con dato real: 156 páginas = 0.75" spine en Mixam
    // Papel: 150gsm silk (el que usamos en Mixam para cookbooks)
    // Fórmula: spine = (page_count / 2) × PAPER_THICKNESS_PER_SHEET
    PAPER_THICKNESS_PER_SHEET: 0.009615,  // pulgadas por hoja (calibrado)
    
    // Spine del template base
    BASE_SPINE: 0.75,

    // Posiciones calculadas del template base (spine = 0.75")
    // Estas se recalculan si el spine cambia
    SPINE_START: 8.2,       // COVER_WIDTH + HINGE
    SPINE_CENTER: 8.575,    // SPINE_START + BASE_SPINE/2
    SPINE_END: 8.95,        // SPINE_START + BASE_SPINE
    FRONT_START: 9.15,      // SPINE_END + HINGE
    FRONT_CENTER: 13.15,    // FRONT_START + COVER_WIDTH/2
    BACK_CENTER: 4.0,       // COVER_WIDTH / 2

    // Posiciones Y de los elementos del front cover
    SUBHEAD_Y: 1.3417,
    NAMES_Y: 2.2524,
    AMPERSAND_Y: 2.2035,

    // Posiciones Y de los elementos del back cover
    TITLE_BACK_Y: 4.4643,
    SUBTITLE_BACK_Y: 4.894,
    LOGO_BACK_Y: 9.3239,

    // Dimensiones de los text frames del front
    SUBHEAD_W: 4.9056,
    SUBHEAD_H: 0.1983,
    NAME_1_W: 3.3413,
    NAME_1_H: 1.3932,
    AMPERSAND_W: 0.8015,
    AMPERSAND_H: 0.8528,
    NAME_2_W: 3.2191,
    NAME_2_H: 1.4698,

    // Dimensiones de los text frames del back
    TITLE_BACK_W: 2.78,
    TITLE_BACK_H: 0.23,
    SUBTITLE_BACK_W: 2.12,
    SUBTITLE_BACK_H: 0.5453,
    LOGO_BACK_W: 1.62,
    LOGO_BACK_H: 0.1934,

    // Spine logo
    SPINE_LOGO_W: 1.0,
    SPINE_LOGO_H: 0.1194,

    // Offsets relativos desde el front_center (para recalcular con nuevo spine)
    // NAME_1 right edge to AMPERSAND left edge gap
    NAME_1_RIGHT_TO_AMP: 0.0400,   // gap between name_1 and &
    AMP_RIGHT_TO_NAME_2: 0.0400    // gap between & and name_2
};

// Script labels (deben coincidir con las etiquetas en el template)
var LABELS = {
    BG_BACK: "COVER_BG_BACK",
    BG_SPINE: "COVER_BG_SPINE",
    BG_FRONT: "COVER_BG_FRONT",
    IMAGE: "COVER_IMAGE",
    SUBHEAD: "COVER_SUBHEAD",
    NAME_1: "COVER_NAME_1",
    AMPERSAND: "COVER_AMPERSAND",
    NAME_2: "COVER_NAME_2",
    TITLE_BACK: "COVER_TITLE_BACK",
    SUBTITLE_BACK: "COVER_SUBTITLE_BACK",
    LOGO_BACK: "COVER_LOGO_BACK",
    LOGO_SPINE: "COVER_LOGO_SPINE"
};


// ============================================
// UTILIDADES
// ============================================

function findByLabel(doc, label) {
    // Busca en todos los page items del documento
    for (var i = 0; i < doc.allPageItems.length; i++) {
        if (doc.allPageItems[i].label === label) {
            return doc.allPageItems[i];
        }
    }
    return null;
}

function getNestedValue(obj, path) {
    // Accede a propiedades anidadas: "couple.couple_first_name"
    var parts = path.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return '';
        current = current[parts[i]];
    }
    return current || '';
}

function readJSON(filePath) {
    var file = new File(filePath);
    if (!file.exists) {
        alert("Error: No se encontró el archivo JSON:\n" + filePath);
        return null;
    }
    file.open('r');
    var content = file.read();
    file.close();

    // ExtendScript no tiene JSON.parse nativo
    // Usamos eval (seguro en este contexto local)
    try {
        var data = eval('(' + content + ')');
        return data;
    } catch (e) {
        alert("Error al leer el JSON:\n" + e.message);
        return null;
    }
}


// ============================================
// FUNCIONES DE POSICIONAMIENTO
// ============================================

// ============================================
// VALORES CONFIRMADOS DE MIXAM
// Actualizados manualmente con el dato real de cada orden.
// Si el page count está aquí, usar este valor.
// Si no, caer al cálculo automático.
// ============================================
var MIXAM_CONFIRMED = {
    88:  0.510,
    108: 0.580,
    140: 0.690,
    156: 0.750
    // Agregar más conforme se confirmen:
    // 100: 0.xxx,
    // 120: 0.xxx,
};

function calculateSpineWidth(pageCount) {
    if (MIXAM_CONFIRMED.hasOwnProperty(String(pageCount))) {
        return MIXAM_CONFIRMED[pageCount];
    }
    // Fallback: fórmula calibrada con Mixam
    // 156 páginas → 78 hojas × 0.009615"/hoja = 0.75"
    var sheets = pageCount / 2;
    var spine = sheets * BASE.PAPER_THICKNESS_PER_SHEET;
    spine = Math.round(spine * 100) / 100;
    return spine;
}

function calculatePositions(spineWidth) {
    // Recalcula todas las posiciones basándose en el nuevo spine
    var pos = {};

    pos.spineWidth = spineWidth;
    pos.docWidth = BASE.COVER_WIDTH + BASE.HINGE + spineWidth + BASE.HINGE + BASE.COVER_WIDTH;

    // Coordenadas X clave
    pos.spineStart = BASE.COVER_WIDTH + BASE.HINGE;          // Siempre 8.20"
    pos.spineCenter = pos.spineStart + spineWidth / 2;
    pos.spineEnd = pos.spineStart + spineWidth;
    pos.frontStart = pos.spineEnd + BASE.HINGE;
    pos.frontCenter = pos.frontStart + BASE.COVER_WIDTH / 2;
    pos.backCenter = BASE.COVER_WIDTH / 2;                    // Siempre 4.00"

    // Delta respecto al template base
    pos.delta = spineWidth - BASE.BASE_SPINE;

    return pos;
}

function resizeDocument(doc, pos) {
    // Cambia el ancho del documento
    doc.documentPreferences.pageWidth = pos.docWidth;
}

function repositionBackgrounds(doc, pos) {
    // --- Back background (NO cambia) ---
    var bgBack = findByLabel(doc, LABELS.BG_BACK);
    if (bgBack) {
        bgBack.geometricBounds = [
            -BASE.BLEED,                                      // top
            -BASE.BLEED,                                      // left
            BASE.DOC_HEIGHT + BASE.BLEED,                     // bottom
            BASE.COVER_WIDTH + BASE.HINGE                     // right (8.20")
        ];
    }

    // --- Spine background ---
    var bgSpine = findByLabel(doc, LABELS.BG_SPINE);
    if (bgSpine) {
        bgSpine.geometricBounds = [
            -BASE.BLEED,                                      // top
            pos.spineStart,                                   // left (8.20")
            BASE.DOC_HEIGHT + BASE.BLEED,                     // bottom
            pos.spineEnd                                      // right
        ];
    }

    // --- Front background ---
    var bgFront = findByLabel(doc, LABELS.BG_FRONT);
    if (bgFront) {
        bgFront.geometricBounds = [
            -BASE.BLEED,                                      // top
            pos.spineEnd,                                     // left
            BASE.DOC_HEIGHT + BASE.BLEED,                     // bottom
            pos.docWidth + BASE.BLEED                         // right (hasta el bleed)
        ];
    }
}

function repositionCoverImage(doc, pos) {
    var img = findByLabel(doc, LABELS.IMAGE);
    if (img) {
        // La imagen del front ocupa todo el panel front + bleed
        img.geometricBounds = [
            -BASE.BLEED,                                      // top
            pos.spineEnd,                                     // left (empieza donde termina el spine)
            BASE.DOC_HEIGHT + BASE.BLEED,                     // bottom
            pos.docWidth + BASE.BLEED                         // right
        ];
    }
}

function repositionFrontText(doc, pos) {
    // --- SUBHEAD: "RECIPES FROM THE PEOPLE WHO LOVE" ---
    var subhead = findByLabel(doc, LABELS.SUBHEAD);
    if (subhead) {
        var subX = pos.frontCenter - BASE.SUBHEAD_W / 2;
        subhead.geometricBounds = [
            BASE.SUBHEAD_Y,                                   // top
            subX,                                             // left
            BASE.SUBHEAD_Y + BASE.SUBHEAD_H,                 // bottom
            subX + BASE.SUBHEAD_W                             // right
        ];
    }

    // --- AMPERSAND: siempre centrado en front_center ---
    var amp = findByLabel(doc, LABELS.AMPERSAND);
    if (amp) {
        var ampX = pos.frontCenter - BASE.AMPERSAND_W / 2;
        amp.geometricBounds = [
            BASE.AMPERSAND_Y,                                 // top
            ampX,                                             // left
            BASE.AMPERSAND_Y + BASE.AMPERSAND_H,             // bottom
            ampX + BASE.AMPERSAND_W                           // right
        ];
    }

    // --- NAME_1: alineado a la derecha, pegado al ampersand ---
    var name1 = findByLabel(doc, LABELS.NAME_1);
    if (name1) {
        var ampLeft = pos.frontCenter - BASE.AMPERSAND_W / 2;
        var name1Right = ampLeft - BASE.NAME_1_RIGHT_TO_AMP;
        var name1X = name1Right - BASE.NAME_1_W;
        name1.geometricBounds = [
            BASE.NAMES_Y,                                     // top
            name1X,                                           // left
            BASE.NAMES_Y + BASE.NAME_1_H,                    // bottom
            name1Right                                        // right
        ];
    }

    // --- NAME_2: alineado a la izquierda, pegado al ampersand ---
    var name2 = findByLabel(doc, LABELS.NAME_2);
    if (name2) {
        var ampRight = pos.frontCenter + BASE.AMPERSAND_W / 2;
        var name2X = ampRight + BASE.AMP_RIGHT_TO_NAME_2;
        name2.geometricBounds = [
            BASE.NAMES_Y,                                     // top
            name2X,                                           // left
            BASE.NAMES_Y + BASE.NAME_2_H,                    // bottom
            name2X + BASE.NAME_2_W                            // right
        ];
    }
}

function repositionBackText(doc, pos) {
    // Los elementos del back cover NO se mueven
    // back_center es siempre 4.00"
    // Pero los reposicionamos por si acaso el template se desalineó

    var titleBack = findByLabel(doc, LABELS.TITLE_BACK);
    if (titleBack) {
        var tX = pos.backCenter - BASE.TITLE_BACK_W / 2;
        titleBack.geometricBounds = [
            BASE.TITLE_BACK_Y,
            tX,
            BASE.TITLE_BACK_Y + BASE.TITLE_BACK_H,
            tX + BASE.TITLE_BACK_W
        ];
    }

    var subtitleBack = findByLabel(doc, LABELS.SUBTITLE_BACK);
    if (subtitleBack) {
        var sX = pos.backCenter - BASE.SUBTITLE_BACK_W / 2;
        subtitleBack.geometricBounds = [
            BASE.SUBTITLE_BACK_Y,
            sX,
            BASE.SUBTITLE_BACK_Y + BASE.SUBTITLE_BACK_H,
            sX + BASE.SUBTITLE_BACK_W
        ];
    }

    var logoBack = findByLabel(doc, LABELS.LOGO_BACK);
    if (logoBack) {
        var lX = pos.backCenter - BASE.LOGO_BACK_W / 2;
        logoBack.geometricBounds = [
            BASE.LOGO_BACK_Y,
            lX,
            BASE.LOGO_BACK_Y + BASE.LOGO_BACK_H,
            lX + BASE.LOGO_BACK_W
        ];
    }
}

function repositionSpineLogo(doc, pos) {
    var spineLogo = findByLabel(doc, LABELS.LOGO_SPINE);
    if (spineLogo) {
        // Centrado en ambos ejes del spine
        var logoX = pos.spineCenter - BASE.SPINE_LOGO_W / 2;
        var logoY = (BASE.DOC_HEIGHT / 2) - BASE.SPINE_LOGO_H / 2;
        spineLogo.geometricBounds = [
            logoY,
            logoX,
            logoY + BASE.SPINE_LOGO_H,
            logoX + BASE.SPINE_LOGO_W
        ];
    }
}


// ============================================
// FUNCIONES DE TEXTO
// ============================================

function replaceNames(doc, name1, name2) {
    // --- Front cover: Name 1 ---
    var frameName1 = findByLabel(doc, LABELS.NAME_1);
    if (frameName1) {
        frameName1.contents = name1;
    }

    // --- Front cover: Name 2 ---
    var frameName2 = findByLabel(doc, LABELS.NAME_2);
    if (frameName2) {
        frameName2.contents = name2;
    }

    // --- Back cover: Subtitle con nombres ---
    var subtitle = findByLabel(doc, LABELS.SUBTITLE_BACK);
    if (subtitle) {
        var currentText = subtitle.contents;
        // Reemplazar placeholders
        currentText = currentText.replace(/<<name_1>>/g, name1);
        currentText = currentText.replace(/<<name_2>>/g, name2);
        subtitle.contents = currentText;
    }
}


// ============================================
// DIÁLOGO DE INPUT
// ============================================

function showInputDialog() {
    var dialog = app.dialogs.add({
        name: "Small Plates — Cover Generator",
        canCancel: true
    });

    with (dialog.dialogColumns.add()) {
        // Page count
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "Número de páginas del interior:" });
        }
        with (dialogRows.add()) {
            var pageCountField = integerEditboxes.add({
                editValue: 156,
                minimumValue: 32,
                maximumValue: 600
            });
        }

        // Spine override (opcional)
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "Spine override (dejar en 0 para auto):" });
        }
        with (dialogRows.add()) {
            var spineOverrideField = realEditboxes.add({
                editValue: 0,
                minimumValue: 0,
                maximumValue: 2.0,
                smallNudge: 0.05,
                largeNudge: 0.1
            });
        }

        // Separador
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "─────────────────────────" });
        }

        // Nombre 1
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "Nombre 1 (izquierda del &):" });
        }
        with (dialogRows.add()) {
            var name1Field = textEditboxes.add({
                editContents: "Nombre",
                minWidth: 200
            });
        }

        // Nombre 2
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "Nombre 2 (derecha del &):" });
        }
        with (dialogRows.add()) {
            var name2Field = textEditboxes.add({
                editContents: "Nombre",
                minWidth: 200
            });
        }

        // Separador
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "─────────────────────────" });
        }

        // JSON path (opcional)
        with (dialogRows.add()) {
            staticTexts.add({ staticLabel: "O cargar desde JSON (opcional):" });
        }
        with (dialogRows.add()) {
            var jsonField = textEditboxes.add({
                editContents: "",
                minWidth: 300
            });
        }
    }

    var result = dialog.show();

    if (result) {
        var data = {
            pageCount: pageCountField.editValue,
            spineOverride: spineOverrideField.editValue,
            name1: name1Field.editContents,
            name2: name2Field.editContents,
            jsonPath: jsonField.editContents
        };
        dialog.destroy();
        return data;
    } else {
        dialog.destroy();
        return null;
    }
}


// ============================================
// MAIN
// ============================================

function main() {
    // Verificar que hay un documento abierto
    if (app.documents.length === 0) {
        alert("Error: No hay documento abierto.\n\nAbre SmallPlates_cover_MixamV.indd primero.");
        return;
    }

    var doc = app.activeDocument;

    // Verificar que es el template correcto (tiene las labels)
    var testLabel = findByLabel(doc, LABELS.AMPERSAND);
    if (!testLabel) {
        alert("Error: Este documento no parece ser el template de cover.\n\n" +
              "No se encontró el label '" + LABELS.AMPERSAND + "'.\n" +
              "Asegúrate de abrir SmallPlates_cover_MixamV.indd");
        return;
    }

    // Obtener inputs
    var input = showInputDialog();
    if (!input) {
        // Cancelado
        return;
    }

    var spineWidth;
    var pageCount = input.pageCount;
    
    // Calcular spine: usar override si se proporcionó, si no, calcular
    if (input.spineOverride > 0) {
        spineWidth = input.spineOverride;
    } else {
        spineWidth = calculateSpineWidth(pageCount);
    }
    
    var name1 = input.name1;
    var name2 = input.name2;

    // Si se proporcionó un JSON, leerlo y sobreescribir los nombres
    if (input.jsonPath && input.jsonPath.length > 0) {
        var bookData = readJSON(input.jsonPath);
        if (bookData) {
            name1 = getNestedValue(bookData, 'couple.couple_first_name') || name1;
            name2 = getNestedValue(bookData, 'couple.partner_first_name') || name2;
        }
    }

    // Validación
    if (!name1 || name1 === "Nombre" || !name2 || name2 === "Nombre") {
        alert("Error: Ingresa los nombres de la pareja.");
        return;
    }

    if (spineWidth <= 0) {
        alert("Error: El spine width calculado es inválido.");
        return;
    }

    // ============================================
    // EJECUTAR
    // ============================================

    // Asegurar unidades en pulgadas
    app.scriptPreferences.measurementUnit = MeasurementUnits.INCHES;

    // Calcular nuevas posiciones
    var pos = calculatePositions(spineWidth);

    // Log
    var summary = "Small Plates — Cover Generator\n\n" +
                  "Pareja: " + name1 + " & " + name2 + "\n" +
                  "Páginas: " + pageCount + "\n" +
                  "Spine calculado: " + spineWidth + "\"\n" +
                  (input.spineOverride > 0 ? "(usando override manual)\n" : "(calculado automáticamente)\n") +
                  "Doc width: " + pos.docWidth.toFixed(4) + "\"\n" +
                  "Delta vs template: " + pos.delta.toFixed(4) + "\"\n\n" +
                  "¿Generar la cover?";

    if (!confirm(summary)) {
        return;
    }

    // --- Paso 1: Redimensionar documento ---
    resizeDocument(doc, pos);

    // --- Paso 2: Reposicionar backgrounds ---
    repositionBackgrounds(doc, pos);

    // --- Paso 3: Reposicionar imagen de portada ---
    repositionCoverImage(doc, pos);

    // --- Paso 4: Reposicionar textos del front ---
    repositionFrontText(doc, pos);

    // --- Paso 5: Reposicionar textos del back ---
    repositionBackText(doc, pos);

    // --- Paso 6: Reposicionar logo del spine ---
    repositionSpineLogo(doc, pos);

    // --- Paso 7: Reemplazar nombres ---
    replaceNames(doc, name1, name2);

    // ============================================
    // RESUMEN FINAL
    // ============================================

    alert("✅ Cover generada exitosamente!\n\n" +
          "Pareja: " + name1 + " & " + name2 + "\n" +
          "Páginas: " + pageCount + "\n" +
          "Spine: " + spineWidth + "\"\n" +
          "Doc width: " + pos.docWidth.toFixed(2) + "\"\n\n" +
          "📋 Checklist antes de exportar:\n" +
          "1. Verificar nombres visualmente\n" +
          "2. Verificar la paella no se cortó\n" +
          "3. Verificar el lomo\n" +
          "4. Comparar spine con el valor de Mixam\n" +
          "5. Exportar con preset SmallPlates_cover");
}

// ============================================
// RUN
// ============================================
main();