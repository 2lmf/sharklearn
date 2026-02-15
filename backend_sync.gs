/**
 * SHARKLEARN BACKEND (Google Apps Script)
 * =====================================
 * Connects the Quiz PWA with a Google Sheet "Database"
 */

const CONFIG = {
  SHEET_ID: "1kPsecnDOAyl2leQJ3AOP5symiHTjHswmWbuTzV8jEu8", // Google Sheet ID
  ADMIN_PASSWORD: "shark"           // Basic protection for Teacher Dashboard
};

function doGet(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.subject || "Questions"; // Default to Bio if not specified
  
  if (action === 'get_questions') {
    return getQuestionsFromSheet(sheetName, e.parameter.semester);
  }
  
  return ContentService.createTextOutput("SharkLearn API Active")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'save_stats') {
      return handleSaveStats(data);
    } else if (action === 'add_question') {
      return handleAddQuestion(data);
    }
    
    return createJsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- CORE FUNCTIONS ---

function getQuestionsFromSheet(sheetName, semesterFilter) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) return createJsonResponse([]); // Empty or header only

  let questions = data.slice(1)
    .map((row, index) => {
      return {
        id: index + 1,
        pitanje: row[0],
        opcije: [row[1], row[2], row[3], row[4]],
        tocan_odgovor: parseInt(row[5]),
        slika: row[6] || null,
        obasnjenje: row[7] || "",
        semester: row[8] || "all" // New Column I
      };
    })
    .filter(q => q.pitanje && !isNaN(q.tocan_odgovor)); // Skip placeholders

  // Optional: Backend filtering
  if (semesterFilter && semesterFilter !== 'all') {
    questions = questions.filter(q => q.semester == semesterFilter);
  }
  
  return createJsonResponse(questions);
}

function handleSaveStats(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName("Stats") || initializeStatsSheet(ss);
  
  sheet.appendRow([
    new Date(),
    payload.studentName || "Anonymous",
    payload.subject || "Unknown", // Track which subject
    payload.score,
    payload.livesLeft,
    payload.totalQuestions
  ]);
  
  return createJsonResponse({ status: 'success' });
}

function handleAddQuestion(payload) {
  if (payload.password !== CONFIG.ADMIN_PASSWORD) {
    throw new Error("Neispravna lozinka!");
  }

  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheetName = payload.subject || "Questions";
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.appendRow([
    payload.pitanje,
    payload.opcije[0],
    payload.opcije[1],
    payload.opcije[2],
    payload.opcije[3],
    payload.tocan_odgovor,
    payload.slika || "",
    payload.obasnjenje || "",
    payload.semester || "all" // Save to Column I
  ]);
  
  return createJsonResponse({ status: 'success', message: "Pitanje spremljeno u: " + sheetName });
}

// --- UTILS ---

function initializeStatsSheet(ss) {
  const sheet = ss.insertSheet("Stats");
  sheet.appendRow(["Datum", "Učenik", "Predmet", "Bodovi", "Preostalo Života", "Ukupno Pitanja"]);
  return sheet;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
