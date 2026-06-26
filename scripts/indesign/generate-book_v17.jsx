// ============================================
// SMALL PLATES — Book Generator v1.14.0
//
// Uses AT_END duplication (proven in v10)
// Then MOVES generated spreads to correct position
// Adds: fillers, personalization, contributors
// v1.4.1: Copies recipe title to footer as real text (emoji fix)
// v1.4.2: Strips emojis from footer copy (keeps title intact)
// v1.6.0: Footer uses recipe data directly (no recipeTitle label needed)
//         TOC update tries multiple languages (EN/ES)
//         Debug alerts for move errors
// v1.6.0: Fix contributors/owners/captains — extract .name from objects
// v1.7.0: Protects master template (works on a copy from the start)
//         Auto-removes trailing blank page
// v1.8.0: INDEX_OVERFLOW — auto-removes extra TOC pages if empty
// v1.9.0: Couple image — places couple photo on {{COUPLE_IMAGE}} frame
// v1.10.0: QR image — places QR code on {{QR_IMAGE}} frame (back of book)
// v1.11.0: Repurchase QR — places second QR on {{QR_REPURCHASE}} frame
//          pointing to /copy/<GROUP_ID> for one-tap repurchase by the couple
// v1.12.0: INDEX_OVERFLOW now supports MULTIPLE spreads with the same label.
//          Each empty overflow spread is removed independently; spreads with
//          content (because the index actually flowed into them) stay.
//          Iterates in reverse to keep indices valid as spreads are removed.
// v1.13.0: NEW template TEMPLATE_RECIPE_A_INGREDIENTS inserted between A and B
//          in the cascade. Wins for recipes where A overflows but the new
//          layout (more height on ingredients column) fits the text.
//          New cascade: A → A-INGREDIENTS → B → C.
// v1.14.0: Fix TOC page numbers. STEP 11.5 removes empty INDEX_OVERFLOW spreads
//          AFTER the TOC was built (STEP 11), which shifts every later page
//          number and leaves the TOC stale. Added STEP 11.6: re-update the TOC
//          after overflow removal so pagination matches the final document.
// v1.15.0: ORIGINALS section (M4). Gated on recipes carrying an "annex_images"
//          array (written by the M3 pipeline). When present:
//            · Builds a "The Originals" section AFTER the back matter, one
//              handwritten image per page, caption "{recipe} shared by {guest}".
//              Duplicates ORIGINALS_OPENER (1x) + ORIGINALS_PAIR (Nx) so the
//              section always ends on an even page count.
//            · Final pass writes "See Originals Page {N}" into each recipe's
//              originalNoteFooter frame (only recipes that have an original).
//          ZERO-REGRESSION: no recipe has annex_images -> runs identical to v16
//          (no section, no footers, ORIGINALS templates not required).
//          Manual .indd work (Ricardo): ORIGINALS_OPENER + ORIGINALS_PAIR
//          template spreads (image frame {{ORIGINAL_IMAGE}} + caption frame
//          "originalCaption" on each image page), and an empty "originalNoteFooter"
//          frame on the 4 recipe templates. TOC must ignore the Originals styles.
// ============================================

var CONFIG = {
    imageFrameLabel: "{{IMAGE}}",
    coupleImageLabel: "{{COUPLE_IMAGE}}",
    qrImageLabel: "{{QR_IMAGE}}",
    repurchaseQRLabel: "{{QR_REPURCHASE}}",

    // Originals section (v1.15.0)
    originalImageLabel: "{{ORIGINAL_IMAGE}}",
    originalCaptionLabel: "originalCaption",
    originalNoteFooterLabel: "originalNoteFooter",

    recipePlaceholders: [
        {find: "<<recipe_name>>", alt: "«recipe_name»", field: "recipe_name"},
        {find: "<<guest_name>>", alt: "«guest_name»", field: "guest_name"},
        {find: "<<comments>>", alt: "«comments»", field: "comments"},
        {find: "<<ingredients>>", alt: "«ingredients»", field: "ingredients"},
        {find: "<<instructions>>", alt: "«instructions»", field: "instructions"}
    ],

    bookPlaceholders: [
        {finds: ["<<couple_first_name>>", "<< couple_first_name >>"], field: "couple.couple_first_name"},
        {finds: ["<<partner_first_name>>", "<< partner_first_name >>"], field: "couple.partner_first_name"},
        {finds: ["<<couple_display_name>>", "<<COUPLE_NAME>>"], field: "couple.couple_display_name"},
        {finds: ["<<contributor_count>>", "<<number_guests>>"], field: "contributors.count"},
        {finds: ["<<contributors_list>>"], field: "_contributors_formatted"},
        {finds: ["<<captains_list>>"], field: "_captains_formatted"},
        {finds: ["<<captain_list>>"], field: "_captain_list_formatted"}
    ],

    labels: {
        recipeA: "TEMPLATE_RECIPE_A",
        recipeAIngredients: "TEMPLATE_RECIPE_A_INGREDIENTS",
        recipeB: "TEMPLATE_RECIPE_B",
        recipeC: "TEMPLATE_RECIPE_C",
        filler1: "TEMPLATE_FILLER_1",
        filler2: "TEMPLATE_FILLER_2",
        filler3: "TEMPLATE_FILLER_3",
        filler4: "TEMPLATE_FILLER_4",
        contributors: "CONTRIBUTORS",
        objectsThatStay: "OBJECTS_THAT_STAY",
        indexOverflow: "INDEX_OVERFLOW",
        originalsOpener: "ORIGINALS_OPENER",
        originalsPair: "ORIGINALS_PAIR"
    }
};

// ============================================
// POSITION CAPTURE/RESTORE (exact copy from v10)
// ============================================

function captureFramePositions(spread) {
    var positions = [];

    for (var p = 0; p < spread.pages.length; p++) {
        var page = spread.pages[p];
        var pagePositions = [];
        var allItems = page.allPageItems;

        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            pagePositions.push({
                index: i,
                label: item.label || "",
                bounds: item.geometricBounds.slice(0)
            });
        }

        positions.push({
            pageIndex: p,
            items: pagePositions
        });
    }

    return positions;
}

function restoreFramePositions(newSpread, savedPositions) {
    for (var p = 0; p < newSpread.pages.length; p++) {
        if (p >= savedPositions.length) break;

        var page = newSpread.pages[p];
        var allItems = page.allPageItems;
        var savedItems = savedPositions[p].items;

        for (var i = 0; i < allItems.length && i < savedItems.length; i++) {
            try {
                var item = allItems[i];
                var saved = savedItems[i];

                if (saved.label !== "" && item.label !== "" && saved.label !== item.label) {
                    $.writeln("WARNING: Label mismatch page " + p + " index " + i);
                    continue;
                }

                item.geometricBounds = saved.bounds;
            } catch (e) {
                $.writeln("Position restore error page " + p + " item " + i + ": " + e.message);
            }
        }
    }
}

// ============================================
// PROCESS RECIPE (exact pattern from v10)
// ============================================

function processRecipeOnTemplate(templateSpread, savedPositions, recipe, basePath) {
    var newSpread = templateSpread.duplicate(LocationOptions.AT_END);
    restoreFramePositions(newSpread, savedPositions);
    replaceInAllTextFrames(newSpread, recipe);
    placeImageInSpread(newSpread, recipe, basePath);
    app.activeDocument.recompose();
    return newSpread;
}

// ============================================
// COPY TITLE TO FOOTER (v1.6.0)
// Reason: recipe title may share a text frame with guest name + comments,
// so we pass the title directly from recipe data instead of reading from a labeled frame.
// Only requires "recipeFooter" label on the footer text frame in the template.
// ============================================

function copyTitleToFooter(spread, recipeName) {
    if (!recipeName) return;
    var cleanTitle = stripEmojis(recipeName);

    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].label === "recipeFooter") {
                items[i].contents = cleanTitle;
                return;
            }
        }
    }
}

function stripEmojis(text) {
    var clean = "";
    for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);
        // Skip high surrogates and their pairs (emojis)
        if (code >= 0xD800 && code <= 0xDBFF) {
            i++; // skip low surrogate too
            continue;
        }
        // Skip common emoji in BMP range
        if (code >= 0x2600 && code <= 0x27BF) continue;
        if (code >= 0xFE00 && code <= 0xFE0F) continue;
        if (code === 0x200D || code === 0x20E3) continue;
        clean += text.charAt(i);
    }
    // Trim trailing spaces left by removed emojis
    return clean.replace(/\s+$/, "");
}

// ============================================
// MAIN
// ============================================

function main() {
    if (app.documents.length === 0) {
        alert("No hay documento abierto.");
        return;
    }

    var masterDoc = app.activeDocument;

    // ── STEP 1: Load JSON ──
    var jsonFile = File.openDialog("Selecciona el archivo book.JSON", "JSON:*.json");
    if (jsonFile === null) return;

    var basePath = jsonFile.parent;
    if (basePath.name === 'data') {
        basePath = basePath.parent;
    }

    var bookData = readJSON(jsonFile);
    if (bookData === null || !bookData.couple || !bookData.recipes) {
        alert("Error: JSON no válido.");
        return;
    }

    // Reason: list items can be objects {name: "..."} (fetch-book-data.js)
    // or plain strings (fetch-book.js). This helper handles both.
    function extractName(item) {
        return (typeof item === "object" && item.name) ? item.name : String(item);
    }

    // Pre-format contributors
    var contributorNames = [];
    for (var cn = 0; cn < bookData.contributors.list.length; cn++) {
        contributorNames.push(extractName(bookData.contributors.list[cn]));
    }
    bookData._contributors_formatted = contributorNames.join("\r");
    bookData.contributors.count = String(bookData.contributors.count);

    // Reason: Special Thanks shows owners first, then captains (members)
    var specialThanksList = [];
    if (bookData.owners && bookData.owners.list) {
        for (var ow = 0; ow < bookData.owners.list.length; ow++) {
            specialThanksList.push(extractName(bookData.owners.list[ow]));
        }
    }
    if (bookData.captains && bookData.captains.list) {
        for (var cp = 0; cp < bookData.captains.list.length; cp++) {
            specialThanksList.push(extractName(bookData.captains.list[cp]));
        }
    }
    bookData._captains_formatted = specialThanksList.join("\r");

    // Reason: "Organized by" page shows only captains (not owners)
    var captainOnlyList = [];
    if (bookData.captains && bookData.captains.list) {
        for (var co = 0; co < bookData.captains.list.length; co++) {
            captainOnlyList.push(extractName(bookData.captains.list[co]));
        }
    }
    bookData._captain_list_formatted = captainOnlyList.join("\r");

    var recipes = bookData.recipes;
    var recipesWithImages = 0;
    for (var j = 0; j < recipes.length; j++) {
        if (recipes[j].local_image_path) recipesWithImages++;
    }

    // ── ORIGINALS gate + queue (v1.15.0) ──
    // Reason: flatten every recipe's annex_images (M3 pipeline) into a single
    // book-order queue. The section follows recipe order, then position within a
    // recipe, so a recipe's originals land on consecutive pages. If the queue is
    // empty the whole feature is inert and the run matches v16 exactly.
    var annexQueue = [];
    for (var ax = 0; ax < recipes.length; ax++) {
        var rcAx = recipes[ax];
        if (rcAx.annex_images && rcAx.annex_images.length > 0) {
            var imgsAx = rcAx.annex_images.slice(0).sort(function (a, b) { return a.position - b.position; });
            for (var im = 0; im < imgsAx.length; im++) {
                if (!imgsAx[im].local_image_path) continue;
                annexQueue.push({
                    recipeId: rcAx.id,
                    recipe: rcAx,
                    position: imgsAx[im].position,
                    local_image_path: imgsAx[im].local_image_path,
                    caption: buildOriginalCaption(rcAx)
                });
            }
        }
    }
    var hasAnnex = annexQueue.length > 0;
    // recipeId -> the page object of its FIRST original (filled during generation,
    // read in the final cross-ref pass once pagination is stable).
    var recipeFirstOrigPage = {};
    // {recipe, spread} for every generated recipe spread (no fillers) — lets the
    // final pass locate each recipe's originalNoteFooter frame.
    var recipeSpreadRefs = [];

    // ── STEP 2: Validate labeled spreads (on master) ──
    var requiredLabels = [
        CONFIG.labels.recipeA, CONFIG.labels.recipeAIngredients, CONFIG.labels.recipeB, CONFIG.labels.recipeC,
        CONFIG.labels.filler1, CONFIG.labels.filler2, CONFIG.labels.filler3, CONFIG.labels.filler4,
        CONFIG.labels.contributors, CONFIG.labels.objectsThatStay
    ];
    var missing = [];
    for (var q = 0; q < requiredLabels.length; q++) {
        if (!findSpreadByLabel(masterDoc, requiredLabels[q])) {
            missing.push(requiredLabels[q]);
        }
    }

    if (missing.length > 0) {
        alert("Spreads no encontrados:\n" + missing.join("\n") + "\n\nCorre label-spreads.jsx o label-recipe-a-ingredients.jsx");
        return;
    }

    if (!confirm("SMALL PLATES - Book Generator v1.15.0\n\n" +
                 "Pareja: " + bookData.couple.couple_display_name + "\n" +
                 "Recetas: " + recipes.length + " (" + recipesWithImages + " con imagen)\n" +
                 "Contributors: " + bookData.contributors.list.length + "\n" +
                 "Captains: " + bookData.captains.list.length + "\n" +
                 "Originals: " + (hasAnnex ? annexQueue.length + " imagen(es)" : "ninguno") + "\n\n" +
                 "Generar libro completo?")) {
        return;
    }

    // ── STEP 2.5: Create working copy (protects master template) ──
    // Reason: all work happens on the copy so the master is never modified.
    // After the script runs, the master stays exactly as it was.
    $.writeln("\n=== Creating working copy ===");

    var coupleName = bookData.couple.couple_display_name
        .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ&\s]/g, "")
        .replace(/\s+/g, "_");
    var savePath = new File(basePath.fsName + "/SmallPlates_" + coupleName + ".indd");

    try {
        masterDoc.saveACopy(savePath);
    } catch (e) {
        alert("Error al crear copia de trabajo:\n" + e.message);
        return;
    }

    var doc = app.open(savePath);
    if (!doc) {
        alert("Error al abrir copia de trabajo.");
        return;
    }
    $.writeln("Working copy: " + savePath.fsName);

    // ── STEP 3: Find labeled spreads (on working copy) ──
    var templateA = findSpreadByLabel(doc, CONFIG.labels.recipeA);
    var templateAIngredients = findSpreadByLabel(doc, CONFIG.labels.recipeAIngredients);
    var templateB = findSpreadByLabel(doc, CONFIG.labels.recipeB);
    var templateC = findSpreadByLabel(doc, CONFIG.labels.recipeC);
    var filler1 = findSpreadByLabel(doc, CONFIG.labels.filler1);
    var filler2 = findSpreadByLabel(doc, CONFIG.labels.filler2);
    var filler3 = findSpreadByLabel(doc, CONFIG.labels.filler3);
    var filler4 = findSpreadByLabel(doc, CONFIG.labels.filler4);
    var contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    var objectsSpread = findSpreadByLabel(doc, CONFIG.labels.objectsThatStay);

    // Originals templates (only needed when the book has originals).
    var originalsOpenerTpl = hasAnnex ? findSpreadByLabel(doc, CONFIG.labels.originalsOpener) : null;
    var originalsPairTpl = hasAnnex ? findSpreadByLabel(doc, CONFIG.labels.originalsPair) : null;

    // Reason: capture the AT_END buffer blank page NOW (it's the master's last
    // page, before any duplication). When the book has originals the blank ends
    // up between the back matter and the Originals section, so STEP 10.5 removes
    // it by this reference instead of "last page" logic.
    var bufferBlankPage = doc.pages[doc.pages.length - 1];

    // ── STEP 4: Personalize fixed pages ──
    $.writeln("\n=== Personalizing fixed pages ===");
    personalizeFixedPages(doc, bookData);

    // ── STEP 4b: Place couple image ──
    $.writeln("\n=== Placing couple image ===");
    var coupleImagePlaced = placeCoupleImage(doc, bookData, basePath);
    $.writeln(coupleImagePlaced ? "Couple image placed" : "No couple image (skipped)");

    // ── STEP 4c: Place QR image (back of book) ──
    // Reason: last page of every book carries a QR pointing to /from-the-book
    // for the viral capture moment (A1.5). The image is generated by
    // fetch-book.js as qr.<GROUP_ID>.png in the same image_assets folder.
    $.writeln("\n=== Placing QR image ===");
    var qrImagePlaced = placeQRImage(doc, bookData, basePath);
    $.writeln(qrImagePlaced ? "QR image placed" : "No QR image (skipped)");

    // ── STEP 4d: Place repurchase QR (left page of last spread) ──
    // Reason: small QR pointing to /copy/<GROUP_ID> so the couple can re-order
    // their own book in one tap. fetch-book.js generates qr_repurchase.<GROUP_ID>.png
    // — same GROUP_ID as the rest of the book, so a book can never carry
    // another couple's repurchase URL.
    $.writeln("\n=== Placing repurchase QR ===");
    var repurchaseQRPlaced = placeRepurchaseQR(doc, bookData, basePath);
    $.writeln(repurchaseQRPlaced ? "Repurchase QR placed" : "No repurchase QR (skipped)");

    // ── STEP 5: Populate Contributors ──
    $.writeln("\n=== Populating contributors ===");
    contributorsSpread = findSpreadByLabel(doc, CONFIG.labels.contributors);
    if (contributorsSpread) {
        populateContributors(contributorsSpread, bookData);
    }

    // ── STEP 6: Capture positions (templates still clean for duplication) ──
    $.writeln("\n=== Capturing positions ===");
    var positionsA = captureFramePositions(templateA);
    var positionsAIngredients = captureFramePositions(templateAIngredients);
    var positionsB = captureFramePositions(templateB);
    var positionsC = captureFramePositions(templateC);

    // ── STEP 7: Calculate filler distribution ──
    var totalRecipes = recipes.length;
    var fillerInterval = Math.floor(totalRecipes / 4);

    var fillerPositions = {};
    fillerPositions[fillerInterval] = filler1;
    fillerPositions[fillerInterval * 2] = filler2;
    fillerPositions[fillerInterval * 3] = filler3;
    fillerPositions[totalRecipes] = filler4;

    $.writeln("Fillers after: " + fillerInterval + ", " + (fillerInterval*2) + ", " + (fillerInterval*3) + ", " + totalRecipes);

    // ── STEP 8: Generate recipes + fillers AT_END ──
    $.writeln("\n=== Generating recipes (AT_END) ===");

    var progressWin = createProgressWindow(totalRecipes);
    progressWin.show();

    var stats = {
        success: 0, images: 0, fillers: 0,
        tplA: [], tplAIngredients: [], tplB: [], tplC: [], overflow: [],
        indexOverflowRemoved: 0,
        indexOverflowKept: 0
    };

    // Track all generated spreads for moving later
    var generatedSpreads = [];

    for (var i = 0; i < recipes.length; i++) {
        try {
            var recipeName = recipes[i].recipe_name || ("Receta " + (i + 1));
            updateProgress(progressWin, i + 1, totalRecipes, recipeName);
            $.writeln("\n[" + (i+1) + "] " + recipeName);

            // ── CASCADE A → A-INGREDIENTS → B → C (v1.13.0) ──

            // Attempt 1: Template A
            var newSpread = processRecipeOnTemplate(templateA, positionsA, recipes[i], basePath);

            if (checkForOverflow(newSpread)) {
                $.writeln("  Overflow A -> A-INGREDIENTS");
                removeSpread(newSpread);

                // Attempt 2: Template A-INGREDIENTS
                newSpread = processRecipeOnTemplate(templateAIngredients, positionsAIngredients, recipes[i], basePath);

                if (checkForOverflow(newSpread)) {
                    $.writeln("  Overflow A-INGREDIENTS -> B");
                    removeSpread(newSpread);

                    // Attempt 3: Template B
                    newSpread = processRecipeOnTemplate(templateB, positionsB, recipes[i], basePath);

                    if (checkForOverflow(newSpread)) {
                        $.writeln("  Overflow B -> C");
                        removeSpread(newSpread);

                        // Attempt 4: Template C
                        newSpread = processRecipeOnTemplate(templateC, positionsC, recipes[i], basePath);

                        if (checkForOverflow(newSpread)) {
                            $.writeln("  !! OVERFLOW in C");
                            stats.overflow.push(recipeName);
                        }
                        stats.tplC.push(recipeName);
                    } else {
                        stats.tplB.push(recipeName);
                    }
                } else {
                    stats.tplAIngredients.push(recipeName);
                }
            } else {
                stats.tplA.push(recipeName);
            }

            if (hasImage(newSpread)) stats.images++;
            copyTitleToFooter(newSpread, recipes[i].recipe_name);
            stats.success++;
            generatedSpreads.push(newSpread);
            // Track recipe -> its spread for the Originals cross-ref pass (v1.15.0).
            recipeSpreadRefs.push({ recipe: recipes[i], spread: newSpread });

            // ── FILLER after this recipe ──
            var recipeNum = i + 1;
            if (fillerPositions[recipeNum]) {
                var fillerSpread = fillerPositions[recipeNum].duplicate(LocationOptions.AT_END);
                generatedSpreads.push(fillerSpread);
                stats.fillers++;
                $.writeln("  >> Filler inserted");
            }

        } catch (e) {
            $.writeln("ERROR #" + (i+1) + ": " + e.message + " (line " + e.line + ")");
        }
    }

    progressWin.close();

    // ── STEP 8b: Generate ORIGINALS section (v1.15.0) ──
    // Reason: built AT_END (after the buffer blank) while the ORIGINALS templates
    // still exist. The opener + pair model guarantees an even page count. Recipes
    // get moved in STEP 9; the originals stay at the very end of the document, so
    // they naturally land after the back matter. Cross-ref page numbers are filled
    // later (STEP 11.7) once pagination is final.
    var originalsStatus = "Not attempted";
    var originalsSpreads = [];
    if (hasAnnex) {
        if (originalsOpenerTpl && originalsPairTpl) {
            try {
                generateOriginalsSection(originalsOpenerTpl, originalsPairTpl, annexQueue, basePath, originalsSpreads, recipeFirstOrigPage);
                originalsStatus = "Generated " + annexQueue.length + " original(s) in " + originalsSpreads.length + " spread(s)";
                $.writeln("Originals: " + originalsStatus);
            } catch (e) {
                originalsStatus = "ERROR: " + e.message + " (line " + e.line + ")";
                $.writeln("Originals: " + originalsStatus);
            }
        } else {
            originalsStatus = "SKIPPED — need templates " + CONFIG.labels.originalsOpener + " + " + CONFIG.labels.originalsPair;
            $.writeln("Originals: " + originalsStatus);
            alert("ORIGINALS no generados:\n" + originalsStatus + "\n\nEl resto del libro se genera normal.");
        }
    }

    // ── STEP 9: Move generated spreads to correct position ──
    // IMPORTANT: Move BEFORE deleting templates, otherwise references break
    $.writeln("\n=== Moving spreads to position ===");

    objectsSpread = findSpreadByLabel(doc, CONFIG.labels.objectsThatStay);

    if (objectsSpread && generatedSpreads.length > 0) {
        var moved = 0;
        var moveErrors = [];

        // Move each spread BEFORE Objects that Stay, in order
        for (var m = 0; m < generatedSpreads.length; m++) {
            try {
                generatedSpreads[m].move(LocationOptions.BEFORE, objectsSpread);
                moved++;
            } catch (e) {
                moveErrors.push("Spread " + m + ": " + e.message);
                $.writeln("Move error spread " + m + ": " + e.message);
            }
        }

        $.writeln(moved + " spreads moved before Objects that Stay");

        if (moveErrors.length > 0) {
            alert("MOVE ERRORS (" + moveErrors.length + " of " + generatedSpreads.length + "):\n\n" + moveErrors.join("\n"));
        }
    } else {
        alert("WARNING: Could not move spreads.\nobjectsSpread found: " + !!objectsSpread + "\ngenerated: " + generatedSpreads.length);
    }

    // ── STEP 10: Delete original templates ──
    $.writeln("\n=== Removing templates ===");

    var labelsToRemove = [
        CONFIG.labels.filler4, CONFIG.labels.filler3,
        CONFIG.labels.filler2, CONFIG.labels.filler1,
        CONFIG.labels.recipeC, CONFIG.labels.recipeB,
        CONFIG.labels.recipeAIngredients, CONFIG.labels.recipeA
    ];

    var removed = 0;
    for (var t = 0; t < labelsToRemove.length; t++) {
        var found = findSpreadByLabel(doc, labelsToRemove[t]);
        if (found) {
            try {
                removeSpread(found);
                removed++;
                $.writeln("Removed: " + labelsToRemove[t]);
            } catch (e) {
                $.writeln("Error: " + e.message);
            }
        }
    }

    // Remove ORIGINALS templates (v1.15.0). Done here (before the TOC) so their
    // deletion is accounted for in pagination, same as the recipe templates. The
    // duplicated originals spreads (after the back matter) are untouched.
    if (hasAnnex) {
        var origTplLabels = [CONFIG.labels.originalsPair, CONFIG.labels.originalsOpener];
        for (var ot = 0; ot < origTplLabels.length; ot++) {
            var foundOrig = findSpreadByLabel(doc, origTplLabels[ot]);
            if (foundOrig) {
                try {
                    removeSpread(foundOrig);
                    $.writeln("Removed: " + origTplLabels[ot]);
                } catch (e) {
                    $.writeln("Error removing " + origTplLabels[ot] + ": " + e.message);
                }
            }
        }
    }

    // ── STEP 10.5: Remove trailing blank page ──
    // Reason: the master template needs a blank page at the end for AT_END
    // duplication to work correctly, but the final book should not have it.
    // With an Originals section the buffer blank is no longer the last page
    // (the section sits after it), so we remove the captured buffer page by
    // reference; otherwise fall back to the original "last page" logic.
    var blankRemoved;
    if (hasAnnex && originalsSpreads.length > 0) {
        blankRemoved = removePageIfBlank(bufferBlankPage);
        $.writeln(blankRemoved ? "Buffer blank page removed (by reference)" : "Buffer blank page not removed (not empty or invalid)");
    } else {
        blankRemoved = removeTrailingBlankPage(doc);
        $.writeln(blankRemoved ? "Trailing blank page removed" : "No trailing blank page found");
    }

    // ── STEP 11: TOC ──
    // Reason: "Update Table of Contents" menu action requires the TOC frame to be selected first
    var tocUpdated = false;
    var tocFrame = findItemByLabel(doc, "TOC_FRAME");

    if (tocFrame) {
        try {
            app.selection = [tocFrame];
            app.menuActions.itemByName("Update Table of Contents").invoke();
            tocUpdated = true;
            $.writeln("TOC updated via selection");
        } catch (e) {
            $.writeln("TOC update failed: " + e.message);
        }
        app.selection = [];
    } else {
        $.writeln("TOC: TOC_FRAME label not found, skipping auto-update");
    }
    $.writeln(tocUpdated ? "TOC updated" : "TOC: update manually");

    // ── STEP 11.5: Remove empty INDEX_OVERFLOW spreads (v1.12.0) ──
    // Reason: master template can have MULTIPLE overflow index spreads, all
    // labeled INDEX_OVERFLOW. After the TOC is populated, every overflow
    // spread that ended up with no real text content gets removed. Spreads
    // where the index actually flowed (i.e. have content) stay intact —
    // never split a dupla (pages within a spread always travel together).
    // Iterates in reverse to keep indices valid as spreads are removed.
    $.writeln("\n=== Checking INDEX_OVERFLOW ===");
    var overflowSpreads = [];
    for (var os = 0; os < doc.spreads.length; os++) {
        if (doc.spreads[os].label === CONFIG.labels.indexOverflow) {
            overflowSpreads.push(doc.spreads[os]);
        }
    }
    $.writeln("Found " + overflowSpreads.length + " INDEX_OVERFLOW spread(s)");

    for (var ox = overflowSpreads.length - 1; ox >= 0; ox--) {
        var overflowSp = overflowSpreads[ox];
        var hasContent = false;

        for (var iop = 0; iop < overflowSp.pages.length && !hasContent; iop++) {
            var ioItems = overflowSp.pages[iop].allPageItems;
            for (var ioi = 0; ioi < ioItems.length; ioi++) {
                if (ioItems[ioi] instanceof TextFrame) {
                    var ioText = (ioItems[ioi].contents || "").replace(/[\s\r\n]/g, "");
                    if (ioText.length > 0) {
                        hasContent = true;
                        break;
                    }
                }
            }
        }

        if (!hasContent) {
            try {
                removeSpread(overflowSp);
                stats.indexOverflowRemoved++;
                $.writeln("INDEX_OVERFLOW removed (empty)");
            } catch (e) {
                $.writeln("INDEX_OVERFLOW remove error: " + e.message);
            }
        } else {
            stats.indexOverflowKept++;
            $.writeln("INDEX_OVERFLOW kept (has content)");
        }
    }

    // ── STEP 11.6: Re-update TOC after INDEX_OVERFLOW removal (v1.14.0) ──
    // Reason: STEP 11.5 deletes empty overflow spreads from the front matter,
    // which shifts every subsequent page number back. The TOC built in STEP 11
    // still holds the pre-removal page numbers, so when spreads were actually
    // removed we refresh the TOC once more against the now-final pagination.
    // Order matters: this must run AFTER STEP 11 (the first pass is what flows
    // the index and reveals which overflow spreads had content) and AFTER
    // STEP 11.5 (the removal). If nothing was removed, pagination is unchanged
    // and we skip the extra pass.
    if (stats.indexOverflowRemoved > 0) {
        var tocFrame2 = findItemByLabel(doc, "TOC_FRAME");
        if (tocFrame2) {
            try {
                app.selection = [tocFrame2];
                app.menuActions.itemByName("Update Table of Contents").invoke();
                tocUpdated = true;
                $.writeln("TOC re-updated after removing " + stats.indexOverflowRemoved + " overflow spread(s)");
            } catch (e) {
                $.writeln("TOC re-update failed: " + e.message);
            }
            app.selection = [];
        } else {
            $.writeln("TOC re-update: TOC_FRAME not found, skipping");
        }
    } else {
        $.writeln("TOC re-update: skipped (no overflow spreads removed)");
    }

    // ── STEP 11.7: Originals cross-ref footers (v1.15.0) ──
    // Reason: pagination is now final (spreads moved, templates + buffer blank
    // removed, TOC rebuilt, INDEX_OVERFLOW cleaned). Read each recipe's first
    // original page number and write "See Originals Page {N}" into its
    // originalNoteFooter frame. Recipes without an original keep an empty footer.
    var footersFilled = 0;
    if (hasAnnex) {
        footersFilled = fillRecipeOriginalsFooters(recipeSpreadRefs, recipeFirstOrigPage);
        $.writeln("Originals cross-ref: " + footersFilled + " recipe footer(s) filled");
    }

    // ── STEP 12: Save ──
    // Reason: doc is already the working copy at savePath, so save() is enough
    try {
        doc.save();
        $.writeln("Saved: " + savePath.fsName);
    } catch (e) {
        $.writeln("Save: " + e.message);
    }

    // ── REPORT ──
    var msg = "LIBRO GENERADO (v1.15.0)\n\n";
    msg += bookData.couple.couple_display_name + "\n\n";
    msg += "Recetas: " + stats.success + "\n";
    msg += "Imagenes: " + stats.images + "\n";
    msg += "Fillers: " + stats.fillers + "\n\n";
    msg += "Distribucion:\n";
    msg += "  A: " + stats.tplA.length + "\n";
    msg += "  A-INGREDIENTS: " + stats.tplAIngredients.length + "\n";
    msg += "  B: " + stats.tplB.length + "\n";
    msg += "  C: " + stats.tplC.length + "\n";

    if (stats.tplAIngredients.length > 0) {
        msg += "\nTemplate A-INGREDIENTS:\n";
        for (var ai = 0; ai < stats.tplAIngredients.length; ai++) msg += "  " + stats.tplAIngredients[ai] + "\n";
    }
    if (stats.tplB.length > 0) {
        msg += "\nTemplate B:\n";
        for (var b = 0; b < stats.tplB.length; b++) msg += "  " + stats.tplB[b] + "\n";
    }
    if (stats.tplC.length > 0) {
        msg += "\nTemplate C:\n";
        for (var c = 0; c < stats.tplC.length; c++) msg += "  " + stats.tplC[c] + "\n";
    }
    if (stats.overflow.length > 0) {
        msg += "\nOVERFLOW:\n";
        for (var o = 0; o < stats.overflow.length; o++) msg += "  " + stats.overflow[o] + "\n";
    }

    msg += "\nCouple image: " + (coupleImagePlaced ? "Placed" : "None");

    // Reason: show the actual URL each QR encodes — ground truth comes from
    // the JSON (fetch-book.js writes bookData.qr_urls). Without this, you'd
    // have to scan each QR with a phone to verify.
    var qrUrl = getNestedValue(bookData, "qr_urls.from_the_book");
    var repurchaseUrl = getNestedValue(bookData, "qr_urls.repurchase");
    msg += "\nQR image: " + QR_STATUS;
    if (qrImagePlaced && qrUrl) msg += "\n  -> " + qrUrl;
    msg += "\nRepurchase QR: " + REPURCHASE_QR_STATUS;
    if (repurchaseQRPlaced && repurchaseUrl) msg += "\n  -> " + repurchaseUrl;

    msg += "\nTOC: " + (tocUpdated ? "Actualizado" : "Actualizar manualmente (Layout > Update TOC)");
    msg += "\nIndex overflow: " + stats.indexOverflowRemoved + " removed, " + stats.indexOverflowKept + " kept";
    msg += "\nOriginals: " + originalsStatus;
    if (hasAnnex) msg += "\nOriginals footers: " + footersFilled + " receta(s) con 'See Originals Page'";
    msg += "\nGuardado: SmallPlates_" + coupleName + ".indd";
    msg += "\n\nMaster template: sin cambios";

    alert(msg);
}

// ============================================
// SPREAD UTILITIES
// ============================================

function findSpreadByLabel(doc, label) {
    for (var i = 0; i < doc.spreads.length; i++) {
        if (doc.spreads[i].label === label) return doc.spreads[i];
    }
    return null;
}

// Reason: finds a page item (text frame, etc.) by script label across all pages.
// Robust to invisible chars (NBSP, ZWSP, BOM) and stray whitespace that can sneak
// into a Script Label when typed/pasted in the InDesign panel and look identical
// to the target on screen but break a strict === comparison.
function normalizeLabel(s) {
    // Strips ASCII whitespace + invisible chars that look identical to nothing
    // but break === comparisons (NBSP, ZWSP, ZWNJ, ZWJ, LRM, RLM, line/paragraph
    // separators, word joiner, BOM/ZWNBSP, en/em spaces and friends).
    return String(s).replace(/[\s\u00A0\u2000-\u200F\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]/g, "");
}
function findItemByLabel(doc, label) {
    var target = String(label);
    var targetNorm = normalizeLabel(label);
    for (var s = 0; s < doc.spreads.length; s++) {
        for (var p = 0; p < doc.spreads[s].pages.length; p++) {
            var items = doc.spreads[s].pages[p].allPageItems;
            for (var i = 0; i < items.length; i++) {
                try {
                    var actual = String(items[i].label);
                    if (actual === target) return items[i];
                    if (normalizeLabel(actual) === targetNorm) return items[i];
                } catch (e) {}
            }
        }
    }
    return null;
}

function removeSpread(spread) {
    for (var p = spread.pages.length - 1; p >= 0; p--) {
        spread.pages[p].remove();
    }
}

// Reason: removes the blank buffer page at the end of the document
// that was needed during generation but is no longer required.
// Uses doc.pages (not spreads) because the blank page may be
// the second page of a 2-page spread, not its own spread.
function removeTrailingBlankPage(doc) {
    var lastPage = doc.pages[doc.pages.length - 1];

    $.writeln("Last page: " + lastPage.name + " (items: " + lastPage.allPageItems.length + ")");

    var items = lastPage.allPageItems;

    // Check if page has real content (text or placed images)
    // Empty text frames and empty graphic frames are OK to remove
    for (var i = 0; i < items.length; i++) {
        if (items[i] instanceof TextFrame) {
            var txt = items[i].contents || "";
            if (txt.replace(/[\s\r\n]/g, "").length > 0) {
                $.writeln("  Skip: text frame " + i + " has content");
                return false;
            }
        } else {
            try {
                if (items[i].images.length > 0 || items[i].graphics.length > 0) {
                    $.writeln("  Skip: item " + i + " has placed graphic");
                    return false;
                }
            } catch (e) {}
        }
    }

    try {
        lastPage.remove();
        return true;
    } catch (e) {
        $.writeln("  Remove failed: " + e.message);
        return false;
    }
}

// ============================================
// TEXT REPLACEMENT (from v10)
// ============================================

function replaceInAllTextFrames(spread, recipe) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i] instanceof TextFrame) {
                replaceInTextFrame(items[i], recipe);
            }
        }
    }
}

function replaceInTextFrame(tf, recipe) {
    try {
        var story = tf.parentStory;

        app.findTextPreferences = null;
        app.changeTextPreferences = null;

        for (var i = 0; i < CONFIG.recipePlaceholders.length; i++) {
            var ph = CONFIG.recipePlaceholders[i];
            var value = recipe[ph.field] || "";

            value = value.split("\n").join("<<<BR>>>");
            value = value.split("\\n").join("<<<BR>>>");

            app.findTextPreferences.findWhat = ph.find;
            app.changeTextPreferences.changeTo = value;
            story.changeText();

            if (ph.alt) {
                app.findTextPreferences = null;
                app.changeTextPreferences = null;
                app.findTextPreferences.findWhat = ph.alt;
                app.changeTextPreferences.changeTo = value;
                story.changeText();
            }
        }

        app.findTextPreferences = null;
        app.changeTextPreferences = null;
        app.findTextPreferences.findWhat = "<<<BR>>>";
        app.changeTextPreferences.changeTo = "\r";
        story.changeText();

        app.findTextPreferences = null;
        app.changeTextPreferences = null;
    } catch (e) {}
}

// ============================================
// IMAGE PLACEMENT (from v10)
// ============================================

function placeImageInSpread(spread, recipe, basePath) {
    if (!recipe.local_image_path) return false;

    var imageFile = new File(basePath.fsName + "/" + recipe.local_image_path);
    if (!imageFile.exists) {
        $.writeln("  Image not found: " + imageFile.fsName);
        return false;
    }

    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].label === CONFIG.imageFrameLabel) {
                try {
                    items[i].place(imageFile);
                    items[i].fit(FitOptions.FILL_PROPORTIONALLY);
                    items[i].sendToBack();
                    return true;
                } catch (e) {
                    $.writeln("  Image error: " + e.message);
                    return false;
                }
            }
        }
    }
    return false;
}

// ============================================
// COUPLE IMAGE PLACEMENT
// ============================================

function placeCoupleImage(doc, bookData, basePath) {
    var imagePath = getNestedValue(bookData, "couple.local_image_path");
    if (!imagePath) {
        $.writeln("  No couple.local_image_path in JSON");
        return false;
    }
    $.writeln("  Image path from JSON: " + imagePath);

    var imageFile = new File(basePath.fsName + "/" + imagePath);
    $.writeln("  Full path: " + imageFile.fsName);
    $.writeln("  File exists: " + imageFile.exists);
    if (!imageFile.exists) {
        alert("DEBUG: Couple image not found:\n" + imageFile.fsName);
        return false;
    }

    var frame = findItemByLabel(doc, CONFIG.coupleImageLabel);
    $.writeln("  Frame found: " + (frame !== null));
    if (!frame) {
        alert("DEBUG: Frame {{COUPLE_IMAGE}} not found in document");
        return false;
    }

    try {
        frame.place(imageFile);
        frame.fit(FitOptions.FILL_PROPORTIONALLY);
        frame.fit(FitOptions.CENTER_CONTENT);
        return true;
    } catch (e) {
        $.writeln("  Couple image error: " + e.message);
        return false;
    }
}

// ============================================
// QR IMAGE PLACEMENT
// Reason: fetch-book.js generates qr.<GROUP_ID>.png inside
// image_assets/<GROUP_ID>/. We derive GROUP_ID from the same image_assets
// path that couple/recipes use, so we don't depend on a new JSON field.
// If the {{QR_IMAGE}} frame is not present in the template, this no-ops
// silently — the rest of the book still generates fine.
// ============================================

// Reason: shared status string the main() summary alert reads to show
// what happened with the QR step (placed, skipped, or why it failed).
var QR_STATUS = "Not attempted";
var REPURCHASE_QR_STATUS = "Not attempted";

function placeQRImage(doc, bookData, basePath) {
    // Derive GROUP_ID by looking at any local_image_path the JSON already has.
    // Path shape: "image_assets/<GROUP_ID>/<filename>"
    var sourcePath = getNestedValue(bookData, "couple.local_image_path");
    if (!sourcePath && bookData.recipes) {
        for (var r = 0; r < bookData.recipes.length; r++) {
            if (bookData.recipes[r].local_image_path) {
                sourcePath = bookData.recipes[r].local_image_path;
                break;
            }
        }
    }
    if (!sourcePath) {
        QR_STATUS = "Skipped — no image_assets path in JSON";
        $.writeln("  " + QR_STATUS);
        return false;
    }

    var match = sourcePath.match(/image_assets[\/\\]([^\/\\]+)[\/\\]/);
    if (!match) {
        QR_STATUS = "Skipped — could not parse GROUP_ID from path: " + sourcePath;
        $.writeln("  " + QR_STATUS);
        return false;
    }
    var groupId = match[1];

    var qrRelative = "image_assets/" + groupId + "/qr." + groupId + ".png";
    var qrFile = new File(basePath.fsName + "/" + qrRelative);
    $.writeln("  QR path: " + qrFile.fsName);
    $.writeln("  QR exists: " + qrFile.exists);
    if (!qrFile.exists) {
        QR_STATUS = "FAILED — qr." + groupId + ".png not found at " + qrFile.fsName + " (run fetch-book.js first)";
        $.writeln("  " + QR_STATUS);
        return false;
    }

    var frame = findItemByLabel(doc, CONFIG.qrImageLabel);
    $.writeln("  Frame {{QR_IMAGE}} found: " + (frame !== null));
    if (!frame) {
        // Diagnostic: list every non-empty label in the document so we can
        // see if {{QR_IMAGE}} is actually persisted somewhere unexpected
        // (master page, inside a group, on the wrong item, etc.)
        var labelCounts = {};
        var totalItems = 0;
        for (var s = 0; s < doc.spreads.length; s++) {
            for (var p = 0; p < doc.spreads[s].pages.length; p++) {
                var items = doc.spreads[s].pages[p].allPageItems;
                for (var i = 0; i < items.length; i++) {
                    totalItems++;
                    var lbl = items[i].label || "";
                    if (lbl !== "") {
                        labelCounts[lbl] = (labelCounts[lbl] || 0) + 1;
                    }
                }
            }
        }
        // Also check master spreads (parent pages)
        var masterLabels = [];
        try {
            for (var ms = 0; ms < doc.masterSpreads.length; ms++) {
                for (var mp = 0; mp < doc.masterSpreads[ms].pages.length; mp++) {
                    var mItems = doc.masterSpreads[ms].pages[mp].allPageItems;
                    for (var mi = 0; mi < mItems.length; mi++) {
                        if (mItems[mi].label && mItems[mi].label !== "") {
                            masterLabels.push(mItems[mi].label + " [in master '" + doc.masterSpreads[ms].name + "']");
                        }
                    }
                }
            }
        } catch (mErr) {}

        var labelList = [];
        var qrLikeDump = [];
        for (var key in labelCounts) {
            if (labelCounts.hasOwnProperty(key)) {
                labelList.push(key + " x" + labelCounts[key]);
                // For any label that LOOKS like the QR target, dump its char codes
                // so we can see invisible chars or typo differences.
                if (key.indexOf("QR") !== -1) {
                    var codes = [];
                    for (var c = 0; c < key.length; c++) codes.push(key.charCodeAt(c));
                    qrLikeDump.push("'" + key + "' len=" + key.length + " codes=[" + codes.join(",") + "]");
                }
            }
        }
        var targetCodes = [];
        for (var tc = 0; tc < CONFIG.qrImageLabel.length; tc++) targetCodes.push(CONFIG.qrImageLabel.charCodeAt(tc));

        QR_STATUS = "FAILED — frame with Script Label '{{QR_IMAGE}}' not found.\n" +
                    "  Doc has " + doc.spreads.length + " spreads, " + totalItems + " items.\n" +
                    "  Labels in spreads: " + (labelList.length === 0 ? "(none)" : labelList.join(" | ")) + "\n" +
                    "  Labels in master pages: " + (masterLabels.length === 0 ? "(none)" : masterLabels.join(" | ")) + "\n" +
                    "  Target: '" + CONFIG.qrImageLabel + "' len=" + CONFIG.qrImageLabel.length + " codes=[" + targetCodes.join(",") + "]\n" +
                    "  QR-like labels found: " + (qrLikeDump.length === 0 ? "(none)" : qrLikeDump.join(" || "));
        $.writeln("  " + QR_STATUS);
        return false;
    }

    try {
        frame.place(qrFile);
        frame.fit(FitOptions.FILL_PROPORTIONALLY);
        frame.fit(FitOptions.CENTER_CONTENT);
        QR_STATUS = "Placed (" + qrRelative + ")";
        $.writeln("  " + QR_STATUS);
        return true;
    } catch (e) {
        QR_STATUS = "FAILED — error placing image: " + e.message;
        $.writeln("  " + QR_STATUS);
        return false;
    }
}

// ============================================
// REPURCHASE QR PLACEMENT
// Reason: mirror of placeQRImage but reads qr_repurchase.<GROUP_ID>.png
// and places it on the {{QR_REPURCHASE}} frame. If the frame doesn't exist
// in the template, this no-ops silently — books printed from older masters
// still generate fine, they just won't have the repurchase QR.
// ============================================
function placeRepurchaseQR(doc, bookData, basePath) {
    var sourcePath = getNestedValue(bookData, "couple.local_image_path");
    if (!sourcePath && bookData.recipes) {
        for (var r = 0; r < bookData.recipes.length; r++) {
            if (bookData.recipes[r].local_image_path) {
                sourcePath = bookData.recipes[r].local_image_path;
                break;
            }
        }
    }
    if (!sourcePath) {
        REPURCHASE_QR_STATUS = "Skipped — no image_assets path in JSON";
        $.writeln("  " + REPURCHASE_QR_STATUS);
        return false;
    }

    var match = sourcePath.match(/image_assets[\/\\]([^\/\\]+)[\/\\]/);
    if (!match) {
        REPURCHASE_QR_STATUS = "Skipped — could not parse GROUP_ID from path: " + sourcePath;
        $.writeln("  " + REPURCHASE_QR_STATUS);
        return false;
    }
    var groupId = match[1];

    var qrRelative = "image_assets/" + groupId + "/qr_repurchase." + groupId + ".png";
    var qrFile = new File(basePath.fsName + "/" + qrRelative);
    $.writeln("  Repurchase QR path: " + qrFile.fsName);
    $.writeln("  Repurchase QR exists: " + qrFile.exists);
    if (!qrFile.exists) {
        REPURCHASE_QR_STATUS = "FAILED — qr_repurchase." + groupId + ".png not found at " + qrFile.fsName + " (run fetch-book.js first)";
        $.writeln("  " + REPURCHASE_QR_STATUS);
        return false;
    }

    var frame = findItemByLabel(doc, CONFIG.repurchaseQRLabel);
    $.writeln("  Frame {{QR_REPURCHASE}} found: " + (frame !== null));
    if (!frame) {
        REPURCHASE_QR_STATUS = "Skipped — frame '{{QR_REPURCHASE}}' not in template (older master?)";
        $.writeln("  " + REPURCHASE_QR_STATUS);
        return false;
    }

    try {
        frame.place(qrFile);
        frame.fit(FitOptions.FILL_PROPORTIONALLY);
        frame.fit(FitOptions.CENTER_CONTENT);
        REPURCHASE_QR_STATUS = "Placed (" + qrRelative + ")";
        $.writeln("  " + REPURCHASE_QR_STATUS);
        return true;
    } catch (e) {
        REPURCHASE_QR_STATUS = "FAILED — error placing image: " + e.message;
        $.writeln("  " + REPURCHASE_QR_STATUS);
        return false;
    }
}

// ============================================
// OVERFLOW (from v10)
// ============================================

function checkForOverflow(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i] instanceof TextFrame && items[i].overflows) return true;
        }
    }
    return false;
}

function hasImage(spread) {
    for (var p = 0; p < spread.pages.length; p++) {
        var items = spread.pages[p].allPageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].label === CONFIG.imageFrameLabel) {
                try {
                    if (items[i].images.length > 0 || items[i].graphics.length > 0) return true;
                } catch (e) {}
            }
        }
    }
    return false;
}

// ============================================
// ORIGINALS SECTION (v1.15.0)
// ============================================

// Caption under each original: "{recipe} shared by {guest}" (e.g.
// "Hart Family Red Cake shared by Grandma Donna Hart"). Emojis stripped so the
// real text renders cleanly, same as the recipe footer.
function buildOriginalCaption(recipe) {
    var name = stripEmojis(recipe.recipe_name || "");
    var guest = stripEmojis(recipe.guest_name || "");
    if (guest) return name + " shared by " + guest;
    return name;
}

// Finds a page item by script label on a single page (robust to invisible chars).
function findItemOnPageByLabel(page, label) {
    var target = String(label);
    var targetNorm = normalizeLabel(label);
    var items = page.allPageItems;
    for (var i = 0; i < items.length; i++) {
        try {
            var actual = String(items[i].label);
            if (actual === target) return items[i];
            if (normalizeLabel(actual) === targetNorm) return items[i];
        } catch (e) {}
    }
    return null;
}

// Finds a page item by script label within a single spread (used to locate the
// originalNoteFooter frame inside one specific recipe spread, since the label
// repeats across every recipe spread in the document).
function findItemInSpreadByLabel(spread, label) {
    for (var p = 0; p < spread.pages.length; p++) {
        var hit = findItemOnPageByLabel(spread.pages[p], label);
        if (hit) return hit;
    }
    return null;
}

// Pushes every page in a spread that carries an {{ORIGINAL_IMAGE}} frame (i.e.
// an "image page") onto arr, in page order. The opener's title page has no
// image frame, so it is skipped automatically.
function collectImagePagesFromSpread(spread, arr) {
    for (var p = 0; p < spread.pages.length; p++) {
        if (findItemOnPageByLabel(spread.pages[p], CONFIG.originalImageLabel)) {
            arr.push(spread.pages[p]);
        }
    }
}

function placeOriginalOnPage(page, localPath, basePath) {
    var frame = findItemOnPageByLabel(page, CONFIG.originalImageLabel);
    if (!frame) return false;
    var imageFile = new File(basePath.fsName + "/" + localPath);
    if (!imageFile.exists) {
        $.writeln("  Original image not found: " + imageFile.fsName);
        return false;
    }
    try {
        frame.place(imageFile);
        // Reason: handwritten notes must show whole (never crop) -> fit the entire
        // image inside the frame, centered. Ricardo sizes the frame in the template.
        frame.fit(FitOptions.PROPORTIONALLY);
        frame.fit(FitOptions.CENTER_CONTENT);
        return true;
    } catch (e) {
        $.writeln("  Original place error: " + e.message);
        return false;
    }
}

function setCaptionOnPage(page, text) {
    var frame = findItemOnPageByLabel(page, CONFIG.originalCaptionLabel);
    if (frame) {
        try { frame.contents = text; } catch (e) {}
    }
}

// Reason: a trailing unused image page (when the image count is even) must read
// as a true blank — clear every text frame (eyebrow + caption) and leave the
// image frame empty (an empty graphic frame does not print).
function blankOutImagePage(page) {
    var items = page.allPageItems;
    for (var i = 0; i < items.length; i++) {
        if (items[i] instanceof TextFrame) {
            try { items[i].contents = ""; } catch (e) {}
        }
    }
}

// Builds the Originals section: one ORIGINALS_OPENER spread (title page + first
// image page) plus as many ORIGINALS_PAIR spreads as needed. Both templates are
// 2-page spreads, so the section always ends on an even page count. Images fill
// in book order; the first original of each recipe is recorded for the cross-ref.
function generateOriginalsSection(openerTpl, pairTpl, queue, basePath, originalsSpreads, recipeFirstOrigPage) {
    var imagePages = [];

    var openerSpread = openerTpl.duplicate(LocationOptions.AT_END);
    originalsSpreads.push(openerSpread);
    collectImagePagesFromSpread(openerSpread, imagePages);

    while (imagePages.length < queue.length) {
        var before = imagePages.length;
        var pairSpread = pairTpl.duplicate(LocationOptions.AT_END);
        originalsSpreads.push(pairSpread);
        collectImagePagesFromSpread(pairSpread, imagePages);
        // Guard: if the pair template has no {{ORIGINAL_IMAGE}} frames we'd loop
        // forever — bail out instead.
        if (imagePages.length === before) {
            $.writeln("  Originals: ORIGINALS_PAIR has no {{ORIGINAL_IMAGE}} frames — aborting fill");
            break;
        }
    }

    for (var k = 0; k < imagePages.length; k++) {
        var page = imagePages[k];
        if (k < queue.length) {
            var item = queue[k];
            placeOriginalOnPage(page, item.local_image_path, basePath);
            setCaptionOnPage(page, item.caption);
            // First time we see a recipe = its lowest position = its first original.
            if (!recipeFirstOrigPage[item.recipeId]) {
                recipeFirstOrigPage[item.recipeId] = page;
            }
        } else {
            blankOutImagePage(page);
        }
    }
}

// Removes a specific page if it has no real content (text or placed graphics).
// Used for the captured buffer blank, which is no longer the document's last
// page once the Originals section is appended.
function removePageIfBlank(page) {
    if (!page) return false;
    var items;
    try { items = page.allPageItems; } catch (e) { return false; }
    for (var i = 0; i < items.length; i++) {
        if (items[i] instanceof TextFrame) {
            var txt = items[i].contents || "";
            if (txt.replace(/[\s\r\n]/g, "").length > 0) return false;
        } else {
            try {
                if (items[i].images.length > 0 || items[i].graphics.length > 0) return false;
            } catch (e) {}
        }
    }
    try { page.remove(); return true; } catch (e) { return false; }
}

// Final cross-ref pass: for each recipe that has an original, write
// "See Originals Page {N}" into its originalNoteFooter frame. N is the real page
// number of that recipe's first original, read now that pagination is stable.
function fillRecipeOriginalsFooters(refs, recipeFirstOrigPage) {
    var filled = 0;
    for (var i = 0; i < refs.length; i++) {
        var rec = refs[i].recipe;
        var sp = refs[i].spread;
        var page = recipeFirstOrigPage[rec.id];
        if (!page) continue;
        var pageName;
        try { pageName = page.name; } catch (e) { continue; }
        var footer = findItemInSpreadByLabel(sp, CONFIG.originalNoteFooterLabel);
        if (footer) {
            try {
                footer.contents = "See Originals Page " + pageName;
                filled++;
            } catch (e) {}
        }
    }
    return filled;
}

// ============================================
// PERSONALIZE FIXED PAGES
// ============================================

function personalizeFixedPages(doc, bookData) {
    var placeholders = CONFIG.bookPlaceholders;

    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        if (value === null || value === undefined) continue;

        value = String(value).split("\n").join("\r");

        for (var f = 0; f < ph.finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = ph.finds[f];
            app.changeTextPreferences.changeTo = value;
            var results = doc.changeText();
            if (results.length > 0) {
                $.writeln("  Replaced '" + ph.finds[f] + "' (" + results.length + "x)");
            }
        }
    }

    app.findTextPreferences = null;
    app.changeTextPreferences = null;
}

function populateContributors(spread, bookData) {
    var placeholders = CONFIG.bookPlaceholders;

    for (var i = 0; i < placeholders.length; i++) {
        var ph = placeholders[i];
        var value = getNestedValue(bookData, ph.field);
        if (value === null || value === undefined) continue;

        value = String(value).split("\n").join("\r");

        for (var f = 0; f < ph.finds.length; f++) {
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            app.findTextPreferences.findWhat = ph.finds[f];
            app.changeTextPreferences.changeTo = value;

            for (var p = 0; p < spread.pages.length; p++) {
                var items = spread.pages[p].allPageItems;
                for (var it = 0; it < items.length; it++) {
                    if (items[it] instanceof TextFrame) {
                        try { items[it].parentStory.changeText(); } catch (e) {}
                    }
                }
            }
        }
    }

    app.findTextPreferences = null;
    app.changeTextPreferences = null;
}

// ============================================
// UTILITIES
// ============================================

function getNestedValue(obj, path) {
    var parts = path.split(".");
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return null;
        current = current[parts[i]];
    }
    return current;
}

function readJSON(file) {
    try {
        file.open("r");
        file.encoding = "UTF-8";
        var content = file.read();
        file.close();
        return eval("(" + content + ")");
    } catch (e) { return null; }
}

function createProgressWindow(total) {
    var win = new Window("palette", "Generando libro...", undefined, {closeButton: false});
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.statusText = win.add("statictext", undefined, "Preparando...");
    win.statusText.preferredSize = [400, 20];
    win.progressBar = win.add("progressbar", undefined, 0, total);
    win.progressBar.preferredSize = [400, 20];
    win.recipeText = win.add("statictext", undefined, "");
    win.recipeText.preferredSize = [400, 20];
    return win;
}

function updateProgress(win, current, total, name) {
    win.statusText.text = "Receta " + current + " de " + total;
    win.progressBar.value = current;
    win.recipeText.text = name || "";
    win.update();
}

main();
