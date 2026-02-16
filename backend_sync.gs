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
  
  // Točno usklađeno sa zaglavljima (A-J):
  // G: Bodovi pretvaramo iz 0-1000 u 0-10
  const points = (payload.score || 0) / 100;
  
  sheet.appendRow([
    new Date(),
    payload.studentName || "Anonymous",
    payload.parentEmail1 || "N/A",
    payload.parentEmail2 || "",
    payload.subject || "N/A",
    payload.semester || "all",
    points,
    payload.duration || 0,
    payload.totalQuestions || 0,
    payload.isCompleted ? "DA" : "NE"
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
/**
 * Šalje napredni dnevni izvještaj roditeljima s ocjenama i trajanjem.
 */
function sendDailySummaries() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName("Stats");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const today = new Date().toDateString();
  const reports = {}; // key: unique identifier (parentEmail1 + studentName)

  // 1. Group data by student and subject
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateStr = new Date(row[0]).toDateString();
    if (dateStr !== today) continue;

    const name = row[1];
    const p1 = row[2];
    const p2 = row[3];
    const subject = row[4];
    const score = row[6]; // Bodovi (obično 0-1000)
    const totalQ = row[8] || 10;
    const duration = row[7] || 0;
    const isCompleted = row[9] === "DA";
    
    if (p1 && p1 !== "N/A") {
      const parentKey = p1 + "_" + name;
      if (!reports[parentKey]) {
        reports[parentKey] = {
          studentName: name,
          emails: [p1],
          subjects: {} // Data per subject
        };
        if (p2) reports[parentKey].emails.push(p2);
      }
      
      if (!reports[parentKey].subjects[subject]) {
        reports[parentKey].subjects[subject] = {
          attempts: 0,
          completedCount: 0,
          interruptedCount: 0,
          totalDuration: 0,
          completedDuration: 0,
          interruptedDuration: 0,
          scores: []
        };
      }
      
      const sub = reports[parentKey].subjects[subject];
      sub.attempts++;
      sub.totalDuration += duration;
      
      if (isCompleted) {
        sub.completedCount++;
        sub.completedDuration += duration;
        sub.scores.push(score / (payload.scorePerQuestion || 100)); // Pretvori u 0-10
      } else {
        sub.interruptedCount++;
        sub.interruptedDuration += duration;
      }
    }
  }

  // 2. Generate and send emails
  for (const parentKey in reports) {
    const r = reports[parentKey];
    let message = `Pozdrav,\n\nEvo današnjeg izvještaja o vježbanju za: ${r.studentName}\n`;
    message += `--------------------------------------------------\n`;

    let totalDayDuration = 0;

    for (const subjectName in r.subjects) {
      const s = r.subjects[subjectName];
      totalDayDuration += s.totalDuration;
      
      const avgPoints = s.scores.length > 0 ? (s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
      const grade = calculateGradeFromPoints(avgPoints);

      const avgCompletedTime = s.completedCount > 0 ? (s.completedDuration / s.completedCount) : 0;
      const avgInterruptedTime = s.interruptedCount > 0 ? (s.interruptedDuration / s.interruptedCount) : 0;

      message += `\nPREDMET: ${subjectName}\n`;
      message += `- Ukupno pokušaja: ${s.attempts}\n`;
      message += `- Završeni ispiti: ${s.completedCount} (Prosjek: ${formatDuration(avgCompletedTime)})\n`;
      message += `- Prekinuti ispiti: ${s.interruptedCount} (Prosjek: ${formatDuration(avgInterruptedTime)})\n`;
      if (s.completedCount > 0) {
        message += `- PROSJEČNA OCJENA: ${grade}\n`;
      }
      message += `--------------------------------------------------\n`;
    }

    message += `\nUKUPNO VRIJEME DANAS: ${formatDuration(totalDayDuration)}\n\n`;
    message += `SharkLearn Tim`;
    // ... rest
  }
}

function calculateGradeFromPoints(points) {
  if (points >= 10) return "5 (Odličan)";
  if (points >= 9) return "5- (Izvrstan)";
  if (points >= 8) return "4 (Vrlo dobar)";
  if (points >= 6) return "3 (Dobar)";
  if (points >= 5) return "2 (Dovoljan)";
  return "1 (Nedovoljan)";
}

/**
 * Formatiranje sekundi u format: X sati, Y min, Z sek.
 */
function formatDuration(seconds) {
  if (seconds === 0) return "0 sek";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  let parts = [];
  if (h > 0) parts.push(h + " sati");
  if (m > 0) parts.push(m + " min");
  if (s > 0 || parts.length === 0) parts.push(s + " sek");
  
  return parts.join(" ");
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
