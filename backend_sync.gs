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
    payload.grade || "N/A", // NOVI STUPAC E
    payload.subject || "N/A",
    payload.semester || "all",
    points,
    payload.duration || 0,
    payload.totalQuestions || 0,
    payload.isCompleted ? "DA" : "NE",
    payload.userId || "N/A"
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
  // Ažurirano zaglavlje da prati handleSaveStats (12 stupaca)
  sheet.appendRow([
    "Datum", 
    "Učenik", 
    "Email Roditelja 1", 
    "Email Roditelja 2", 
    "Razred",       // Col E
    "Predmet",      // Col F
    "Semestar",     // Col G
    "Bodovi",       // Col H
    "Trajanje (s)", // Col I
    "Ukupno Pitanja", // Col J
    "Završeno",     // Col K
    "User ID"       // Col L
  ]);
  return sheet;
}

/**
 * Šalje dnevni sažetak roditeljima. 
 */
/**
 * Šalje napredni dnevni izvještaj roditeljima s ocjenama i trajanjem.
 */
/**
 * Šalje napredni dnevni izvještaj roditeljima s ocjenama i trajanjem.
 * Prošireno na zadnjih 48h, grupirano po danima i brendirano.
 */
function sendDailySummaries() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName("Stats");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
  
  const COLORS = {
    "5": "#4a86e8", // Blue
    "6": "#6aa84f", // Green
    "7": "#ff9900", // Orange
    "8": "#ea4335", // Red
    "default": "#333333"
  };

  const reports = {}; // key: userId

  // 1. Group data by student, date, and subject
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const originalDate = new Date(row[0]);
    
    // Only process last 48 hours
    if (originalDate < fortyEightHoursAgo) continue;

    const dateKey = originalDate.toLocaleDateString('hr-HR');
    const name = row[1];
    const p1 = row[2];
    const p2 = row[3];
    const gradeVal = row[4];
    const subject = row[5];
    const semesterVal = row[6];
    const score = row[7];
    const duration = row[8] || 0;
    const isCompleted = row[10] === "DA";
    const userId = row[11];
    
    if (userId && p1 && p1 !== "N/A") {
      if (!reports[userId]) {
        reports[userId] = {
          studentName: name,
          emails: [p1],
          dates: {} 
        };
        if (p2 && p2 !== "") reports[userId].emails.push(p2);
      }
      
      if (!reports[userId].dates[dateKey]) {
        reports[userId].dates[dateKey] = [];
      }
      
      reports[userId].dates[dateKey].push({
        grade: gradeVal,
        subject: subject,
        semester: semesterVal,
        score: score,
        duration: duration,
        isCompleted: isCompleted
      });
    }
  }

  // 2. Generate and send HTML emails
  for (const userId in reports) {
    const r = reports[userId];
    let htmlBody = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">`;
    htmlBody += `<h2 style="color: #008CBA;">SharkLearn: Izvještaj o učenju</h2>`;
    htmlBody += `<p>Pozdrav, evo pregleda vježbanja za učenika: <b>${r.studentName}</b> u zadnjih 48 sati.</p>`;

    // Sort dates descending
    const sortedDates = Object.keys(r.dates).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
      htmlBody += `<div style="background: #f9f9f9; padding: 10px; margin: 15px 0; border-left: 5px solid #008CBA;">`;
      htmlBody += `<h3 style="margin: 0;">📅 Datum: ${date}</h3>`;
      htmlBody += `</div>`;

      let dayDuration = 0;
      const dayResults = r.dates[date];
      
      // Group by subject for the day
      const grouped = {};
      dayResults.forEach(res => {
        dayDuration += res.duration;
        const key = `${res.grade}_${res.subject}_${res.semester}`;
        if (!grouped[key]) {
          grouped[key] = {
            grade: String(res.grade),
            subject: res.subject,
            semester: res.semester,
            attempts: 0,
            completedCount: 0,
            scores: [],
            totalDur: 0
          };
        }
        grouped[key].attempts++;
        grouped[key].totalDur += res.duration;
        if (res.isCompleted) {
          grouped[key].completedCount++;
          grouped[key].scores.push(res.score);
        }
      });

      for (const key in grouped) {
        const g = grouped[key];
        const gradeColor = COLORS[g.grade] || COLORS.default;
        const semesterText = g.semester === "all" ? "Sve teme" : (g.semester + ". polugodište");
        const avgPoints = g.scores.length > 0 ? (g.scores.reduce((a, b) => a + b, 0) / g.scores.length) : 0;
        const finalGrade = calculateGradeFromPoints(avgPoints);

        htmlBody += `<div style="margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">`;
        htmlBody += `<p style="font-size: 16px; margin: 5px 0;">`;
        htmlBody += `<b style="color: ${gradeColor}; font-size: 18px;">${g.grade}. RAZRED</b> - <b>${g.subject}</b> (${semesterText})`;
        htmlBody += `</p>`;
        htmlBody += `<ul style="list-style: none; padding-left: 10px; margin: 5px 0;">`;
        htmlBody += `<li>🔹 Pokušaja: <b>${g.attempts}</b></li>`;
        htmlBody += `<li>⏱️ Vrijeme: <b>${formatDuration(g.totalDur)}</b></li>`;
        if (g.completedCount > 0) {
          htmlBody += `<li>🎓 PROSJEČNA OCJENA: <span style="background: ${gradeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${finalGrade}</span></li>`;
        } else {
          htmlBody += `<li>⚠️ Status: <i style="color: #666;">Vježba u tijeku (nema završenih ispita)</i></li>`;
        }
        htmlBody += `</ul></div>`;
      }

      htmlBody += `<p style="text-align: right; font-weight: bold; color: #555;">Ukupno vrijeme za ovaj dan: ${formatDuration(dayDuration)}</p>`;
    });

    // Footer with Logo
    htmlBody += `<hr style="border: 0; border-top: 2px solid #eee; margin-top: 30px;">`;
    htmlBody += `<div style="text-align: center; color: #999; font-size: 12px;">`;
    htmlBody += `<p>Powered by<br><b style="color: #333; font-size: 16px;">Sharpsharkdigital</b></p>`;
    htmlBody += `<p>SharkLearn v1.2 - Automatski sustav izvještavanja</p>`;
    htmlBody += `</div></div>`;
    
    r.emails.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: "SharkLearn: Izvještaj o učenju - " + r.studentName,
        htmlBody: htmlBody
      });
    });
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
  if (typeof seconds === 'string') seconds = parseInt(seconds);
  if (!seconds || seconds === 0) return "0 sek";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  let parts = [];
  if (h > 0) {
    let hLabel = "sati";
    if (h === 1) hLabel = "sat";
    else if (h >= 2 && h <= 4) hLabel = "sata";
    parts.push(h + " " + hLabel);
  }
  if (m > 0) parts.push(m + " min");
  if (s > 0 || parts.length === 0) parts.push(s + " sek");
  
  return parts.join(" ");
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * AUTOMATION: Colors tabs based on grade detected in sheet name.
 * 5 = Blue, 6 = Green, 7 = Orange, 8 = Red
 */
function autoColorSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  const COLORS = {
    "5": "#4a86e8", // Blue
    "6": "#6aa84f", // Green
    "7": "#ff9900", // Orange
    "8": "#ea4335", // Red (User requested)
    "stats": "#434343" // Dark Grey
  };

  sheets.forEach(sheet => {
    const name = sheet.getName();
    
    // System sheets
    if (name === "Stats") {
      sheet.setTabColor(COLORS.stats);
      return;
    }

    // Subject sheets (e.g., "Biologija7", "Matematika5")
    const match = name.match(/\d$/); // Find digit at the end
    if (match) {
      const grade = match[0];
      if (COLORS[grade]) {
        sheet.setTabColor(COLORS[grade]);
      }
    } else {
      sheet.setTabColor(null); // Reset if no grade found
    }
  });
}

/**
 * Adds a custom menu to the spreadsheet.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🦈 SHARKLEARN')
      .addItem('🎨 Organiziraj Boje Tabova', 'autoColorSheets')
      .addSeparator()
      .addItem('📊 Pošalji Dnevne Izvještaje', 'sendDailySummaries')
      .addToUi();
}
