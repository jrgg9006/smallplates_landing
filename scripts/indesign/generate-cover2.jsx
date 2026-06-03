// ============================================
// SMALL PLATES — Cover Generator v2.0
// ExtendScript para InDesign
//
// Abre SmallPlates_cover_MixamV.indd (template master)
// Genera una COPIA NUEVA y trabaja sobre ella (NO sobrescribe el master).
// Ajusta spine, dimensiones, posiciones, nombres y el logo del lomo.
//
// USO: Abrir el template master → Scripts panel → generate-cover2.jsx
//
// CAMBIOS vs v1.0:
//  1. NO sobrescribe el master. Al confirmar hace "Save As" a una copia nueva
//     (Cover_<Name1>-<Name2>.indd) y edita esa copia. El master queda intacto,
//     conservando los placeholders <<name_1>> / <<name_2>> del back para siempre.
//  2. El logo del lomo (imagen rotada 90°) ahora crece proporcionalmente al spine
//     y la imagen llena el frame (ya no hay que "alargarlo" a mano).
//
// REQUISITO (una sola vez): el master debe tener en la caja COVER_SUBTITLE_BACK
//  el texto con placeholders, p.ej.:  "A cookbook made by the people who love\n<<name_1>> & <<name_2>>"
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

    // --- Spine logo (v2.0: proporcional al spine) ---
    // El logo del lomo es una IMAGEN colocada y ROTADA 90° (se lee vertical).
    // "thickness" = grosor visible a través del lomo (eje X de la página).
    // "length"    = largo visible a lo alto del lomo (eje Y de la página).
    //
    // SPINE_LOGO_SPINE_FILL: qué fracción del ancho del lomo ocupa el logo (su grosor).
    //   0.62 → el logo usa ~62% del grosor del lomo (presente sin tocar las orillas).
    //   El logo se escala UNIFORME (frame + imagen) hasta ese grosor, manteniendo su
    //   proporción, así que el largo crece junto con el grosor.
    //   Súbelo para un logo más grueso/grande, bájalo para uno más delgado/chico.
    SPINE_LOGO_SPINE_FILL: 0.62,

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

function sanitizeFileName(s) {
    // Deja solo caracteres seguros para nombre de archivo
    var out = String(s).replace(/[^A-Za-z0-9 _-]/g, '');
    out = out.replace(/\s+/g, ' ');
    out = out.replace(/^\s+/, '').replace(/\s+$/, '');
    return out.length > 0 ? out : 'Cover';
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
    if (!spineLogo) return;

    // El logo del lomo es una imagen ROTADA 90°.
    // Reason: usar fit()/geometricBounds sobre un frame rotado vacía o deforma el
    // contenido. En su lugar escalamos el OBJETO COMPLETO (frame + imagen) de forma
    // UNIFORME alrededor de su centro: la imagen nunca se desliga ni desaparece y
    // mantiene su proporción, sin importar la rotación.
    var gb = spineLogo.geometricBounds;            // [top, left, bottom, right] visible
    var visW = gb[3] - gb[1];
    var visH = gb[2] - gb[0];
    var currentThickness = Math.min(visW, visH);   // el grosor (a través del lomo) es el lado corto
    if (currentThickness <= 0) return;

    // Grosor objetivo proporcional al spine → el logo crece con el lomo.
    var desiredThickness = pos.spineWidth * BASE.SPINE_LOGO_SPINE_FILL;
    var scale = desiredThickness / currentThickness;

    try {
        spineLogo.resize(
            CoordinateSpaces.PASTEBOARD_COORDINATES,
            AnchorPoint.CENTER_ANCHOR,
            ResizeMethods.MULTIPLYING_CURRENT_DIMENSIONS_BY,
            [scale, scale]
        );
    } catch (e) {
        return; // si falla, dejamos el logo como estaba (no lo borramos)
    }

    // Recentrar en el lomo: centro X = spineCenter, centro Y = mitad de la página.
    var gb2 = spineLogo.geometricBounds;
    var curCenterX = (gb2[1] + gb2[3]) / 2;
    var curCenterY = (gb2[0] + gb2[2]) / 2;
    var dx = pos.spineCenter - curCenterX;
    var dy = (BASE.DOC_HEIGHT / 2) - curCenterY;
    spineLogo.move(undefined, [dx, dy]);
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
    // El master conserva los placeholders <<name_1>> / <<name_2>> porque trabajamos
    // sobre una COPIA. Por eso este replace ahora funciona en cada corrida.
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

    // Definir ruta de la COPIA nueva (no se sobrescribe el master)
    var parentFolder = (doc.saved && doc.fullName) ? doc.fullName.parent : Folder.desktop;
    var outName = "Cover_" + sanitizeFileName(name1) + "-" + sanitizeFileName(name2) + ".indd";
    var newFile = File(parentFolder.fsName + "/" + outName);

    // Log
    var summary = "Small Plates — Cover Generator v2.0\n\n" +
                  "Pareja: " + name1 + " & " + name2 + "\n" +
                  "Páginas: " + pageCount + "\n" +
                  "Spine calculado: " + spineWidth + "\"\n" +
                  (input.spineOverride > 0 ? "(usando override manual)\n" : "(calculado automáticamente)\n") +
                  "Doc width: " + pos.docWidth.toFixed(4) + "\"\n" +
                  "Delta vs template: " + pos.delta.toFixed(4) + "\"\n\n" +
                  "Se generará una COPIA NUEVA (el master NO se toca):\n" +
                  newFile.fsName + "\n\n" +
                  "¿Generar la cover?";

    if (!confirm(summary)) {
        return;
    }

    // --- Paso 0: Guardar como COPIA NUEVA antes de editar nada ---
    // Reason: el master en disco queda intacto (conserva placeholders del back).
    // El documento activo pasa a ser la copia; todas las ediciones van sobre ella.
    try {
        doc.save(newFile);
    } catch (e) {
        alert("Error: No se pudo guardar la copia nueva en:\n" + newFile.fsName +
              "\n\n" + e.message + "\n\nNo se editó nada. El master sigue intacto.");
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

    // --- Paso 8: Guardar la copia con los cambios ---
    try {
        doc.save();
    } catch (e) {
        // No es crítico: el usuario puede guardar manualmente.
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================

    alert("✅ Cover generada exitosamente!\n\n" +
          "Archivo: " + outName + "\n" +
          "Pareja: " + name1 + " & " + name2 + "\n" +
          "Páginas: " + pageCount + "\n" +
          "Spine: " + spineWidth + "\"\n" +
          "Doc width: " + pos.docWidth.toFixed(2) + "\"\n\n" +
          "El master quedó intacto. Editaste la copia nueva.\n\n" +
          "📋 Checklist antes de exportar:\n" +
          "1. Verificar nombres del front Y del back\n" +
          "2. Verificar la paella no se cortó\n" +
          "3. Verificar el lomo y el logo\n" +
          "4. Comparar spine con el valor de Mixam\n" +
          "5. Exportar con preset SmallPlates_cover");
}

// ============================================
// RUN
// ============================================
main();
