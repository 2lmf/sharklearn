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
    .map((row) => {
      return {
        id: row[0] || "N/A", // Column A
        pitanje: row[1],      // Column B
        opcije: [row[2], row[3], row[4], row[5]], // C, D, E, F
        tocan_odgovor: parseInt(row[6]), // G
        slika: row[7] || null, // H
        obasnjenje: row[8] || "", // I
        semester: row[9] || "all" // J
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
    payload.parentEmail1 || "N/A",      // Email roditelja 1
    payload.parentEmail2 || "",         // Email roditelja 2
    payload.subject || "Unknown", 
    payload.score,
    payload.livesLeft,
    payload.totalQuestions,
    payload.duration || 0,             
    payload.isCompleted ? "DA" : "NE", 
    payload.version || "v25"           
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
    "=ROW()-1", // Auto-ID formula or placeholder
    payload.pitanje,
    payload.opcije[0],
    payload.opcije[1],
    payload.opcije[2],
    payload.opcije[3],
    payload.tocan_odgovor,
    payload.slika || "",
    payload.obasnjenje || "",
    payload.semester || "all"
  ]);
  
  return createJsonResponse({ status: 'success', message: "Pitanje spremljeno u: " + sheetName });
}

// --- UTILS ---

function initializeStatsSheet(ss) {
  const sheet = ss.insertSheet("Stats");
  sheet.appendRow(["Datum", "Učenik", "Email Roditelja 1", "Email Roditelja 2", "Predmet", "Bodovi", "Preostalo Života", "Ukupno Pitanja", "Trajanje (sek)", "Završeno", "Verzija"]);
  return sheet;
}

/**
 * Šalje dnevni sažetak roditeljima. 
 */
function sendDailySummaries() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName("Stats");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const today = new Date().toDateString();
  const reports = {}; // key: unique identifier (parentEmail1 + studentName)

  // 1. Group today's results
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateStr = new Date(row[0]).toDateString();
    if (dateStr !== today) continue;

    const name = row[1];
    const p1 = row[2];
    const p2 = row[3];
    
    if (p1 && p1 !== "N/A") {
      const key = p1 + "_" + name;
      if (!reports[key]) {
        reports[key] = {
          studentName: name,
          emails: [p1],
          attempts: 0,
          completed: 0,
          totalScore: 0,
          totalDuration: 0,
          subjects: []
        };
        if (p2) reports[key].emails.push(p2);
      }
      
      reports[key].attempts++;
      if (row[9] === "DA") reports[key].completed++;
      reports[key].totalScore += row[5];
      reports[key].totalDuration += row[8];
      if (!reports[key].subjects.includes(row[4])) {
        reports[key].subjects.push(row[4]);
      }
    }
  }

  // 2. Send emails
  for (const key in reports) {
    const r = reports[key];
    const avgScore = r.completed > 0 ? (r.totalScore / r.completed).toFixed(1) : 0;
    const avgDuration = r.attempts > 0 ? (r.totalDuration / r.attempts / 60).toFixed(1) : 0;
    
    const subjectLine = `SharkLearn: Dnevni izvještaj za učenika: ${r.studentName}`;
    const message = `
      Pozdrav,
      
      Evo današnjeg sažetka aktivnosti za učenika: ${r.studentName}
      
      - Ukupno pokušaja rješavanja: ${r.attempts}
      - Završeno ispita do kraja: ${r.completed}
      - Prosječan broj bodova po završenom ispitu: ${avgScore}
      - Ukupno provedeno vrijeme: ${(r.totalDuration / 60).toFixed(1)} min
      - Prosječno trajanje jednog ispita: ${avgDuration} min
      - Predmeti koji su vježbani: ${r.subjects.join(", ")}
      
      Aplikacija je bez reklama i služi isključivo za vježbanje gradiva.
      
      Srdačan pozdrav,
      Vaš SharkLearn Tim
    `;
    
    r.emails.forEach(email => {
      try {
        MailApp.sendEmail(email, subjectLine, message);
        console.log("Email poslan na: " + email);
      } catch (e) {
        console.error("Greška pri slanju na " + email, e);
      }
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
