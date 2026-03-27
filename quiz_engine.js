/**
 * SHARKLEARN QUIZ ENGINE v1.1
 * Handles cloud sync, persistence, user tracking, and feedback.
 */

class QuizEngine {
    constructor() {
        // State
        this.allQuestions = [];
        this.currentMission = [];
        this.currentIndex = 0;
        this.score = 0;
        this.lives = 5;
        this.questionsPerMission = 10;

        // Registration & Tracking
        this.userId = localStorage.getItem('sharklearn_user_id') || this.generateUserId();
        localStorage.setItem('sharklearn_user_id', this.userId);

        this.studentName = localStorage.getItem('sharklearn_user_name') || "";
        this.parentEmail1 = localStorage.getItem('sharklearn_parent_email_1') || "";
        this.parentEmail2 = localStorage.getItem('sharklearn_parent_email_2') || "";
        this.startTime = null;
        this.duration = 0;
        this.isRegistered = !!(this.studentName && this.parentEmail1);

        // Config
        this.storageKey = 'sharklearn_seen_ids';
        this.apiUrl = "https://script.google.com/macros/s/AKfycbxcJWoGRtBLRHs-aOH4HwoMESKEj5_CAbV67GZRFD54xQeJluQcGheoCYOjQelxxm0W/exec";

        this.selectedGrade = localStorage.getItem('sharklearn_selected_grade') || null;

        // DOM Elements
        this.elements = {
            gradeScreen: document.getElementById('grade-selection-section'),
            gradeBtns: document.querySelectorAll('.grade-btn'),
            gradeTitle: document.getElementById('selected-grade-title'),
            backToGradesBtn: document.getElementById('back-to-grades'),
            welcomeScreen: document.getElementById('subject-selection-section'),
            subjectHidden: document.getElementById('selected-subject-hidden'),
            subjectCards: document.querySelectorAll('.subject-card'),
            startBtn: document.getElementById('start-btn'),
            // ... (keep others)
            quizWrapper: document.getElementById('quiz-section'),
            question: document.getElementById('question'),
            mediaContainer: document.getElementById('media-container'),
            questionImage: document.getElementById('question-image'),
            options: document.getElementById('options'),
            livesDisplay: document.getElementById('lives'),
            scoreDisplay: document.getElementById('score'),
            progressBar: document.getElementById('progress-bar'),
            quizArea: document.getElementById('quiz-section'),
            resultScreen: document.getElementById('result-screen'),
            finalStats: document.getElementById('final-stats'),
            explanationModal: document.getElementById('explanation-modal'),
            explanationText: document.getElementById('explanation-text'),
            nextBtn: document.getElementById('next-after-exp-btn'),
            semesterOptions: document.querySelectorAll('.sem-opt'),
            semesterHidden: document.getElementById('selected-semester-hidden'),

            // Registration Elements
            registrationModal: document.getElementById('registration-section'),
            welcomeBackModal: document.getElementById('welcome-back-modal'),
            welcomeBackName: document.getElementById('welcome-back-name'),
            continueBtn: document.getElementById('continue-btn'),
            newUserBtn: document.getElementById('new-user-btn'),
            regStudentName: document.getElementById('reg-student-name'),
            regParentEmail1: document.getElementById('reg-parent-email-1'),
            regParentEmail2: document.getElementById('reg-parent-email-2'),
            saveProfileBtn: document.getElementById('save-profile-btn'),
            userInfoBar: document.getElementById('user-info-bar'),
            displayStudentName: document.getElementById('display-student-name'),
            displayParentEmails: document.getElementById('display-parent-emails'),
            statsBtn: document.getElementById('stats-btn'),
            statsOverlay: document.getElementById('stats-overlay'),
            reportBugBtn: document.getElementById('report-bug-btn'),
            bugNote: document.getElementById('bug-note'),
            bugStatus: document.getElementById('bug-status'),
            editProfileBtn: document.getElementById('edit-profile-btn'),
            regValidationMsg: document.getElementById('reg-validation-msg'),
            // Exam Semester Modal
            examSemModal: document.getElementById('exam-semester-modal'),
            examSemBtns: document.querySelectorAll('.exam-sem-btn'),
            closeExamModal: document.getElementById('close-exam-modal')
        };

        this.init();

        // Exit listener for interrupted sessions
        window.addEventListener('beforeunload', () => {
            if (this.startTime && this.currentIndex > 0 && this.elements.resultScreen.style.display === 'none') {
                this.saveStatsToCloud(false);
            }
        });
    }

    async init() {
        // Clear registration inputs for fresh start
        this.elements.regStudentName.value = "";
        this.elements.regParentEmail1.value = "";
        this.elements.regParentEmail2.value = "";

        // Logic for returning vs new user
        if (this.isRegistered) {
            // Returning user -> Show Welcome Back Modal
            if (this.elements.welcomeBackName) this.elements.welcomeBackName.innerText = this.studentName;
            if (this.elements.welcomeBackModal) this.elements.welcomeBackModal.style.display = 'flex';

            // Setup listeners for this modal
            if (this.elements.continueBtn) {
                this.elements.continueBtn.onclick = () => {
                    this.elements.welcomeBackModal.style.display = 'none';
                    this.showGradeSelection();
                    this.updateProfileUI();
                };
            }

            if (this.elements.newUserBtn) {
                this.elements.newUserBtn.onclick = () => {
                    this.handleNewUser();
                };
            }
        } else {
            // New user -> Show Registration
            this.elements.registrationModal.style.display = 'block';
            this.elements.saveProfileBtn.onclick = () => this.saveProfile();
        }

        // Grade Selection Logic
        this.elements.gradeBtns.forEach(btn => {
            btn.onclick = () => {
                const grade = btn.getAttribute('data-grade');
                this.selectGrade(grade);
            };
        });

        // Back to Grades Logic
        if (this.elements.backToGradesBtn) {
            this.elements.backToGradesBtn.onclick = () => {
                // Reset mission state before switching
                if (this.heartbeat) clearInterval(this.heartbeat);
                this.startTime = null;
                this.duration = 0;

                this.elements.quizWrapper.style.display = 'none';
                this.elements.resultScreen.style.display = 'none';
                this.elements.explanationModal.style.display = 'none';
                this.showGradeSelection();
            };
        }

        // Subject Card Selection Logic
        this.elements.subjectCards.forEach(card => {
            if (card.classList.contains('placeholder')) return;
            card.onclick = () => {
                // If quiz is running, save stats first
                if (this.elements.quizWrapper.style.display === 'block') {
                    this.handleEarlyExit(() => {
                        this.activateSubjectCard(card);
                    });
                } else {
                    this.activateSubjectCard(card);
                }
            };
        });

        // Semester Selection Logic
        this.elements.semesterOptions.forEach(opt => {
            opt.onclick = () => {
                this.elements.semesterOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.elements.semesterHidden.value = opt.getAttribute('data-semester');
                console.log("SharkLearn: Semester changed to", this.elements.semesterHidden.value);
            };
        });

        // Enable Start
        this.elements.startBtn.disabled = false;
        this.elements.startBtn.innerText = "ZAPOČNI MISIJU";
        this.elements.startBtn.onclick = () => this.startGame();

        // Stats Button Logic
        if (this.elements.statsBtn) {
            this.elements.statsBtn.onclick = () => this.showStatistics();
        }

        if (this.elements.reportBugBtn) {
            this.elements.reportBugBtn.onclick = () => this.reportBug();
        }

        if (this.elements.editProfileBtn) {
            this.elements.editProfileBtn.onclick = () => this.editProfile();
        }

        // Exam Semester Modal Selection
        this.elements.examSemBtns.forEach(btn => {
            btn.onclick = () => {
                const semester = btn.getAttribute('data-exam-sem');
                console.log("SharkLearn: Exam semester chosen:", semester);
                this.elements.examSemModal.style.display = 'none';
                this.startExamMode(semester); // Start immediately with chosen semester
            };
        });

        if (this.elements.closeExamModal) {
            this.elements.closeExamModal.onclick = () => {
                this.elements.examSemModal.style.display = 'none';
            };
        }

        // Safety Save on Tab Close / App Switch
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // If quiz is running, try to save stats
                if (this.elements.quizWrapper && this.elements.quizWrapper.style.display === 'block') {
                    console.log("SharkLearn: App went background, ending game...");
                    // Force end game to prevent cheating/pausing and save stats
                    this.endGame(false);
                }
            }
        });
    }

    validateEmail(email) {
        if (!email) return { valid: false, msg: "Email nedostaje!" };

        // Basic Regex
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(email)) return { valid: false, msg: "Neispravan format emaila!" };

        // Common typos
        if (email.includes('..')) return { valid: false, msg: "Email ima dvije točke za redom (..)" };
        if (email.includes('.@')) return { valid: false, msg: "Email ima točku ispred @ signa (.@)" };

        const parts = email.split('@');
        if (parts[1] && parts[1].startsWith('.')) return { valid: false, msg: "Domena ne smije početi točkom!" };

        return { valid: true };
    }

    async syncUserToCloud() {
        try {
            const payload = {
                action: 'sync_user',
                userId: this.userId,
                studentName: this.studentName,
                parentEmail1: this.parentEmail1,
                parentEmail2: this.parentEmail2
            };
            fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                mode: 'no-cors'
            });
        } catch (e) {
            console.warn("SharkLearn: User sync failed", e);
        }
    }

    editProfile() {
        // Populate inputs with current data
        this.elements.regStudentName.value = this.studentName;
        this.elements.regParentEmail1.value = this.parentEmail1;
        this.elements.regParentEmail2.value = this.parentEmail2 || "";

        // Change button text and show modal
        this.elements.saveProfileBtn.innerText = "SPREMI PROMJENE";
        this.elements.registrationModal.style.display = 'block';
        this.elements.regValidationMsg.style.display = 'none';
    }

    saveProfile() {
        console.log("SharkLearn: saveProfile triggered");
        try {
            const name = this.elements.regStudentName.value.trim();
            const email1 = this.elements.regParentEmail1.value.trim();
            const email2 = this.elements.regParentEmail2.value.trim();

            console.log("SharkLearn: Inputs -", { name, email1, email2 });

            this.elements.regValidationMsg.style.display = 'none';
            this.elements.registrationModal.classList.remove('modal-shake');

            if (name.length < 3) {
                console.warn("SharkLearn: Name too short");
                this.showValidationError("Unesi ime i prezime (min 3 znaka).");
                return;
            }

            console.log("SharkLearn: Validating email 1...");
            const v1 = this.validateEmail(email1);
            if (!v1.valid) {
                console.warn("SharkLearn: Email 1 invalid -", v1.msg);
                this.showValidationError(v1.msg);
                return;
            }

            if (email2) {
                console.log("SharkLearn: Validating email 2...");
                const v2 = this.validateEmail(email2);
                if (!v2.valid) {
                    console.warn("SharkLearn: Email 2 invalid -", v2.msg);
                    this.showValidationError("Email 2: " + v2.msg);
                    return;
                }
            }

            this.studentName = name;
            this.parentEmail1 = email1;
            this.parentEmail2 = email2;
            this.isRegistered = true;

            localStorage.setItem('sharklearn_user_name', name);
            localStorage.setItem('sharklearn_parent_email_1', email1);
            localStorage.setItem('sharklearn_parent_email_2', email2);

            this.elements.registrationModal.style.display = 'none';
            this.updateProfileUI();
            this.showGradeSelection(); // Direct redirect to grades
            this.syncUserToCloud();

            console.log("SharkLearn: Profile saved/updated:", name);
        } catch (err) {
            console.error("SharkLearn Critical Error:", err);
            alert("Greška kod spremanja: " + err.message);
        }
    }

    showValidationError(msg) {
        console.warn("SharkLearn Validation Failed:", msg);
        this.elements.regValidationMsg.innerText = "🛑 " + msg;
        this.elements.regValidationMsg.style.display = 'block';

        // Modal shake effect
        const modal = this.elements.registrationModal.querySelector('.modal-content');
        if (modal) {
            modal.classList.remove('modal-shake');
            void modal.offsetWidth; // Force reflow
            modal.classList.add('modal-shake');
        }
    }

    showGradeSelection() {
        this.elements.gradeScreen.style.display = 'block';
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.quizWrapper.style.display = 'none';
        this.elements.resultScreen.style.display = 'none';
    }

    selectGrade(grade) {
        this.selectedGrade = grade;
        localStorage.setItem('sharklearn_selected_grade', grade);

        // Refresh the list of subject cards and re-attach listeners
        this.elements.subjectCards = document.querySelectorAll('.subject-card');
        this.elements.subjectCards.forEach(card => {
            card.onclick = () => {
                if (this.elements.quizWrapper && this.elements.quizWrapper.style.display === 'block') {
                    this.handleEarlyExit(() => this.activateSubjectCard(card));
                } else {
                    this.activateSubjectCard(card);
                }
            };
        });

        // Update UI
        this.elements.gradeScreen.style.display = 'none';
        this.elements.welcomeScreen.style.display = 'block';
        this.elements.gradeTitle.innerText = `${grade}. RAZRED`;

        // Filter Subject Cards
        let firstVisible = null;
        const examCard = document.getElementById('exam-mode-card');

        // Show exam card only for 5th and 7th grade
        if (examCard) {
            if (grade === "5" || grade === "7") {
                examCard.style.display = 'block';
                examCard.setAttribute('data-grade', grade); // Sync grade for exam mode
                firstVisible = examCard;
            } else {
                examCard.style.display = 'none';
            }
        }

        this.elements.subjectCards.forEach(card => {
            if (card === examCard) return; // Already handled

            const cardGrade = card.getAttribute('data-grade');
            if (cardGrade === grade) {
                card.style.display = 'flex';
                if (!firstVisible && !card.classList.contains('placeholder')) firstVisible = card;
            } else {
                card.style.display = 'none';
            }
        });

        // Auto-select first subject
        if (firstVisible) {
            this.elements.subjectCards.forEach(c => c.classList.remove('active'));
            firstVisible.classList.add('active');
            this.elements.subjectHidden.value = firstVisible.getAttribute('data-subject');
            this.selectedSubject = this.elements.subjectHidden.value; // CRITICAL: Update state too
            this.selectedSemester = "all";
            console.log("SharkLearn: Auto-selected subject", this.selectedSubject);
        }

        console.log("SharkLearn: Grade selected", grade);
    }


    activateSubjectCard(card) {
        // Remove active from all visible cards of this grade
        this.elements.subjectCards.forEach(c => c.classList.remove('active'));
        // Add to clicked
        card.classList.add('active');
        // Update hidden input
        this.elements.subjectHidden.value = card.getAttribute('data-subject');

        // Also update selectedSubject if tracked live
        this.selectedSubject = this.elements.subjectHidden.value;
        console.log("SharkLearn: Subject Card Activated:", this.selectedSubject);

        // SPECIAL CASE: EXAM MODE TRIGGER
        if (this.selectedSubject === 'SPECIAL_EXAM') {
            this.elements.examSemModal.style.display = 'flex';
            return;
        }

        this.selectedSemester = "all";

        // Reset semester UI to 'all'
        this.elements.semesterHidden.value = "all";
        this.elements.semesterOptions.forEach(o => o.classList.remove('active'));
        this.elements.semesterOptions[0].classList.add('active');

        console.log("SharkLearn: Subject activated:", this.selectedSubject);
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    handleNewUser() {
        // Clear local data
        if (confirm("Jesi li siguran? Tvoji lokalni podaci bit će zamijenjeni novim korisnikom.")) {
            localStorage.removeItem('sharklearn_user_name');
            localStorage.removeItem('sharklearn_parent_email_1');
            localStorage.removeItem('sharklearn_parent_email_2');

            this.studentName = "";
            this.parentEmail1 = "";
            this.parentEmail2 = "";
            this.isRegistered = false;

            // Switch modals
            this.elements.welcomeBackModal.style.display = 'none';
            this.elements.registrationModal.style.display = 'block';

            // Clear inputs just in case
            this.elements.regStudentName.value = "";
            this.elements.regParentEmail1.value = "";
            this.elements.regParentEmail2.value = "";
        }
    }

    updateProfileUI() {
        this.elements.displayStudentName.innerText = this.studentName;
        let emailsStr = this.parentEmail1;
        if (this.parentEmail2) emailsStr += " | " + this.parentEmail2;
        this.elements.displayParentEmails.innerText = emailsStr;
        this.elements.userInfoBar.style.display = 'flex';
    }

    async startGame() {
        if (!this.isRegistered) {
            this.elements.registrationModal.style.display = 'block';
            return;
        }
        this.selectedSubject = this.elements.subjectHidden.value;
        this.selectedSemester = this.elements.semesterHidden.value;
        localStorage.setItem('sharklearn_user_name', this.studentName);

        console.log(`SharkLearn: startGame CLICKED! Subject: ${this.selectedSubject}, Grade: ${this.selectedGrade}, Sem: ${this.selectedSemester}`);

        // Tracking Init
        this.startTime = new Date();
        this.duration = 0;
        this.currentIndex = 0;
        this.score = 0;
        this.lives = 5;

        // Start Heartbeat for duration
        if (this.heartbeat) clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
            if (this.startTime) {
                this.duration = Math.floor((new Date() - this.startTime) / 1000);
            }
        }, 2000);

        // UI Transition

        // IMMEDIATE EXAM START (Skip unnecessary cloud fetch for exam mode)
        if (this.selectedSubject === 'SPECIAL_EXAM') {
            console.log("SharkLearn: Instant exam mode detected.");
            this.startExamMode();
            return;
        }

        // Load Questions for selected subject from Cloud
        try {
            console.log(`SharkLearn: Loading ${this.selectedSubject} (Sem: ${this.selectedSemester})...`);
            const response = await fetch(`${this.apiUrl}?action=get_questions&subject=${this.selectedSubject}`);
            const cloudData = await response.json();

            if (Array.isArray(cloudData) && cloudData.length > 0) {
                this.allQuestions = cloudData;
            } else {
                throw new Error("Empty response");
            }
        } catch (e) {
            console.warn("SharkLearn: Cloud error, trying local fallback...", e);

            // AUTOMATIC FALLBACK MAPPING
            // Maps subject names to their global variable data sources
            const dataMap = {
                // 5. RAZRED
                "Engleski5": "ENG_DATA",
                "Geografija5": "GEO_DATA",
                "Glazbeni5": "GLA_5_DATA",
                "Hrvatski5": "HRV_5_DATA",
                "Informatika5": "INF_5_DATA",
                "Likovni5": "LIK_5_DATA",
                "Matematika5": "MAT_DATA",
                "Njemacki5": "GER_DATA",
                "Povijest5": "HIS_5_DATA",
                "prirodaidrustvo5": "PRI_5_DATA",
                "Tehnicki5": "TEH_5_DATA",
                "Vjeronauk5": "VJE_5_DATA",

                // 6. RAZRED
                "Engleski6": "ENG_6_DATA",
                "Geografija6": "GEO_6_DATA",
                "Glazbeni6": "GLA_6_DATA",
                "Hrvatski6": "HRV_6_DATA",
                "Informatika6": "INF_6_DATA",
                "Likovni6": "LIK_6_DATA",
                "Matematika6": "MAT_6_DATA",
                "Njemacki6": "GER_6_DATA",
                "Povijest6": "HIS_6_DATA",
                "Priroda6": "PRI_6_DATA",
                "Tehnicki6": "TEH_6_DATA",
                "Vjeronauk6": "VJE_6_DATA",

                // 7. RAZRED
                "Biologija7": "QUIZ_DATA", // Legacy name kept for safety
                "Engleski7": "ENG_7_DATA",
                "Fizika7": "FIZ_DATA",
                "Geografija7": "GEO_7_DATA",
                "Glazbeni7": "GLAZ_7_DATA",
                "Hrvatski7": "HRV_7_DATA",
                "Informatika7": "INF_7_DATA",
                "Kemija7": "KEM_DATA",
                "Likovni7": "LIK_7_DATA",
                "Matematika7": "MAT_7_DATA",
                "njemacki7": "GER_7_DATA", // Small 'n' legacy check
                "Povijest7": "HIS_DATA", // Legacy name
                "Tehnicki7": "TEH_7_DATA",
                "Vjeronauk7": "VJE_7_DATA",

                // 8. RAZRED
                "Biologija8": "BIO_8_DATA",
                "Engleski8": "ENG_8_DATA",
                "Fizika8": "FIZ_8_DATA",
                "Geografija8": "GEO_8_DATA",
                "Glazbeni8": "GLA_8_DATA",
                "Hrvatski8": "HRV_8_DATA",
                "Kemija8": "KEM_8_DATA",
                "Likovni8": "LIK_8_DATA",
                "Matematika8": "MAT_8_DATA",
                "Njemacki8": "GER_8_DATA",
                "Povijest8": "HIS_8_DATA",
                "Tehnicki8": "TEH_8_DATA",
                "Vjeronauk8": "VJE_8_DATA"
            };

            // Normalize subject name just in case (e.g. "Njemacki7" vs "njemacki7")
            // Note: In the map above keys must match exactly what is in index.html data-subject attributes

            const varName = dataMap[this.selectedSubject];
            if (varName && window[varName]) {
                console.log(`SharkLearn: Using local fallback for ${this.selectedSubject} (${varName})`);
                this.allQuestions = window[varName];

                // Check for additional data (e.g. MAT_8_DATA -> MAT_8_ADD_DATA)
                // We assume the suffix is always _ADD_DATA appended to the base name minus _DATA, or just appended?
                // Based on file inspection: mat_8.js -> MAT_8_DATA, mat_8_add.js -> MAT_8_ADD_DATA
                // So we replace '_DATA' with '_ADD_DATA'
                if (varName.endsWith('_DATA')) {
                    const addVarName = varName.replace('_DATA', '_ADD_DATA');
                    if (window[addVarName]) {
                        console.log(`SharkLearn: Found additional data ${addVarName}`);
                        this.allQuestions = this.allQuestions.concat(window[addVarName]);
                    }
                }
            } else {
                console.error(`SharkLearn: No local data found for ${this.selectedSubject}`);
            }
        }

        if (this.allQuestions.length > 0 || this.selectedSubject === 'SPECIAL_EXAM') {
            // Apply Semester Filter locally if not already done by backend
            if (this.selectedSemester !== "all" && this.selectedSubject !== 'SPECIAL_EXAM') {
                const filtered = this.allQuestions.filter(q => q.semester == this.selectedSemester);
                if (filtered.length > 0) {
                    this.allQuestions = filtered;
                } else {
                    console.warn(`No questions for semester ${this.selectedSemester}, showing all.`);
                }
            }

            if (this.selectedSubject === 'SPECIAL_EXAM') {
                this.startExamMode();
                return;
            }

            this.elements.welcomeScreen.style.display = 'none';
            this.elements.quizWrapper.style.display = 'flex';
            this.setupMission();
        } else {
            alert("Greška: Nema pitanja za ovaj predmet u oblaku. Učitelj mora dodati pitanja u " + this.selectedSubject + " tablicu.");
            this.elements.startBtn.disabled = false;
            this.elements.startBtn.innerText = "ZAPOČNI MISIJU";
        }
    }

    async startExamMode(chosenSemester = null) {
        console.log("SharkLearn: Starting Exam Mode for Grade", this.selectedGrade, "Semester:", chosenSemester);

        // Pokaži indikator učitavanja na glavnom gumbu
        const oldBtnText = this.elements.startBtn.innerText;
        this.elements.startBtn.innerText = "UČITAVANJE ISPITA...";
        this.elements.startBtn.disabled = true;

        // Use provided semester or fallback to global if somehow missing
        const activeSemester = chosenSemester || this.selectedSemester || "all";
        const gradeStr = this.selectedGrade.toString();

        // Lista predmeta koji postoje u Google Sheetu prema razredima
        const subjectIdsByGrade = {
            "5": ["Engleski5", "Geografija5", "Glazbeni5", "Hrvatski5", "Informatika5", "Likovni5", "Matematika5", "Njemacki5", "Povijest5", "prirodaidrustvo5", "Tehnicki5", "Vjeronauk5"],
            "7": ["Biologija7", "Engleski7", "Fizika7", "Geografija7", "Glazbeni7", "Hrvatski7", "Informatika7", "Kemija7", "Likovni7", "Matematika7", "Njemacki7", "Povijest7", "Tehnicki7", "Vjeronauk7"]
        };

        const subjectsPool = subjectIdsByGrade[gradeStr] || [];

        // 2. Pick 5 random subjects
        const selectedSubjects = this.getRandomSubarray(subjectsPool, 5);

        // 3. Collect 10 questions from each subject using Google Sheets API
        let examQuestions = [];
        this.examBreakdown = []; // Track which questions belong to which subject for scoring

        try {
            console.log(`SharkLearn: Fetching exam questions from cloud for: ${selectedSubjects.join(', ')}`);

            // Radimo 5 paralelnih fetch poziva prema Google Sheetu
            const fetchPromises = selectedSubjects.map(subjectId =>
                fetch(`${this.apiUrl}?action=get_questions&subject=${subjectId}`)
                    .then(res => res.json())
                    .then(data => ({ subjectId, data }))
                    .catch(e => {
                        console.error(`Greška pri dohvaćanju za ${subjectId}`, e);
                        return { subjectId, data: [] }; // Fallback na prazno u slučaju greške
                    })
            );

            const results = await Promise.all(fetchPromises);

            results.forEach(result => {
                let questions = Array.isArray(result.data) ? result.data : [];

                if (questions.length > 0) {
                    // Filter by semester
                    if (activeSemester !== "all") {
                        questions = questions.filter(q => q.semester == activeSemester);
                    }

                    if (questions.length > 0) {
                        const sampledCount = Math.min(questions.length, 10);
                        const sampled = this.getRandomSubarray(questions, sampledCount);
                        examQuestions = examQuestions.concat(sampled);
                        console.log(`SharkLearn: Subject ${result.subjectId} added ${sampled.length} questions from cloud pool of ${questions.length}.`);

                        this.examBreakdown.push({
                            label: result.subjectId.replace(gradeStr, '').replace(/^\w/, c => c.toUpperCase()),
                            questionIds: sampled.map(q => q.id),
                            correctCount: 0
                        });
                    } else {
                        console.warn(`SharkLearn: No questions for ${result.subjectId} in semester ${activeSemester} after filtering.`);
                    }
                } else {
                    console.warn(`SharkLearn: Google Sheet returned empty data for ${result.subjectId}.`);
                }
            });

        } catch (error) {
            console.error("SharkLearn: Critical error in Cloud Fetch for Exam Mode", error);
            alert("Došlo je do greške pri dohvaćanju ispita. Provjeri vezu.");
            this.elements.startBtn.innerText = oldBtnText;
            this.elements.startBtn.disabled = false;
            return;
        }

        console.log(`SharkLearn: Exam Build Finished. Total Questions: ${examQuestions.length}`);

        this.elements.startBtn.innerText = oldBtnText; // vracamo stari tekst gumba
        this.elements.startBtn.disabled = false;

        if (examQuestions.length < 5) {
            alert(`Nedovoljno pitanja za ispitni mod (${examQuestions.length} pronađeno u Sheetu). Provjeri jesu li pitanja unesena u Google tablicu.`);
            return;
        }

        // 4. Setup Mission
        this.allQuestions = examQuestions;
        this.currentMission = examQuestions; // No further slicing, use all 50 (or less if pool was small)
        this.currentIndex = 0;
        this.score = 0;
        this.lives = 99; // Essentially infinite for exam mode, or we can keep it at 5 if preferred
        this.isExamMode = true;

        this.elements.welcomeScreen.style.display = 'none';
        this.elements.quizWrapper.style.display = 'flex';

        this.updateStatsUI();
        this.renderQuestion();
    }

    setupMission() {
        const seenIds = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        const unseen = this.allQuestions.filter(q => !seenIds.includes(q.id));

        let pool = [];
        if (unseen.length >= this.questionsPerMission) {
            pool = unseen.slice(0, this.questionsPerMission);
        } else if (this.allQuestions.length > 0) {
            // Random mode if all seen or pool is small
            pool = this.getRandomSubarray(this.allQuestions, Math.min(this.questionsPerMission, this.allQuestions.length));
        }

        this.currentMission = this.shuffleArray([...pool]);
        this.currentIndex = 0;
        this.score = 0;
        this.lives = 5;

        this.updateStatsUI();
        this.renderQuestion();
    }

    renderQuestion() {
        const q = this.currentMission[this.currentIndex];
        if (!q) return;

        // Update Progress
        const progress = (this.currentIndex / this.currentMission.length) * 100;
        this.elements.progressBar.style.width = `${progress}%`;

        // Question Text
        this.elements.question.innerText = q.pitanje || "Pitanje bez teksta?";

        // Image handling
        if (q.slika) {
            this.elements.questionImage.src = q.slika;
            this.elements.mediaContainer.style.display = 'block';
        } else {
            this.elements.mediaContainer.style.display = 'none';
        }

        // Options
        this.elements.options.innerHTML = '';
        const options = Array.isArray(q.opcije) ? q.opcije : [];

        // Sanity Check for data
        if (!q || isNaN(q.tocan_odgovor) || !q.opcije || q.opcije.length < 2) {
            console.warn("SharkLearn: Skipping invalid question", q);
            this.nextQuestion();
            return;
        }

        q.opcije.forEach((opt, index) => {
            if (opt !== undefined && opt !== null && opt !== "") {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt;
                btn.onclick = () => this.handleAnswer(index, btn);
                this.elements.options.appendChild(btn);
            }
        });
    }

    handleAnswer(selectedIndex, btn) {
        const buttons = this.elements.options.querySelectorAll('.option-btn');
        const q = this.currentMission[this.currentIndex];

        buttons.forEach(b => b.style.pointerEvents = 'none');

        if (selectedIndex === q.tocan_odgovor) {
            btn.classList.add('correct');
            this.score += 100;
            this.markAsSeen(q.id);

            // Track for Exam Mode breakdown
            if (this.isExamMode && this.examBreakdown) {
                const sub = this.examBreakdown.find(b => b.questionIds.includes(q.id));
                if (sub) sub.correctCount++;
            }

            this.updateStatsUI();
            setTimeout(() => this.nextQuestion(), 800);
        } else {
            btn.classList.add('wrong');
            buttons[q.tocan_odgovor].classList.add('correct');
            this.elements.quizArea.classList.add('shake');

            this.lives -= 1;
            this.updateStatsUI();

            // Modal Explanation
            setTimeout(() => {
                this.elements.explanationText.innerText = q.obasnjenje || "Točan odgovor je bio: " + q.opcije[q.tocan_odgovor];
                this.elements.explanationModal.style.display = 'flex';
                this.elements.nextBtn.onclick = () => {
                    this.elements.explanationModal.style.display = 'none';
                    this.elements.quizArea.classList.remove('shake');
                    if (this.lives <= 0) {
                        this.endGame(false);
                    } else {
                        this.nextQuestion();
                    }
                };
            }, 1000);
        }
    }

    nextQuestion() {
        this.currentIndex++;


        // Save progress disabled

        if (this.currentIndex < this.currentMission.length) {
            this.renderQuestion();
        } else {
            this.endGame(true);
        }
    }

    updateStatsUI() {
        this.elements.scoreDisplay.innerText = this.score;
        this.elements.livesDisplay.innerText = this.lives;
    }

    handleEarlyExit(callback) {
        if (confirm("Želiš li prekinuti misiju? Tvoj napredak bit će spremljen.")) {
            if (this.heartbeat) clearInterval(this.heartbeat);

            // Calculate duration up to this point
            if (this.startTime) {
                this.duration = Math.floor((new Date() - this.startTime) / 1000);
            }

            this.saveStatsToCloud(false).then(() => {
                if (callback) callback();
            });
        }
    }

    endGame(success) {
        if (this.heartbeat) clearInterval(this.heartbeat);

        // Final duration calculation
        if (this.startTime) {
            this.duration = Math.floor((new Date() - this.startTime) / 1000);
        }

        this.elements.quizWrapper.style.display = 'none';
        this.elements.resultScreen.style.display = 'flex';
        this.elements.progressBar.style.width = '100%';

        if (success) {
            if (this.isExamMode && this.examBreakdown) {
                let gradeSum = 0;
                let detailsHtml = '<div style="text-align:left; margin: 20px 0; font-size: 0.9rem; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">';
                let examSummaryText = []; // Za Google Sheets

                this.examBreakdown.forEach(sub => {
                    const points = (sub.correctCount / 10) * 100;
                    const grade = parseInt(this.calculateGradeFromPoints(points));
                    gradeSum += grade;
                    detailsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                        <span>${sub.label}:</span>
                        <span style="color:var(--neon-cyan); font-weight:bold;">${sub.correctCount}/10 (Ocjena: ${grade})</span>
                    </div>`;
                    examSummaryText.push(`${sub.label} ${grade}`); // Npr. "Matematika 5"
                });

                const avgGradeRaw = gradeSum / this.examBreakdown.length;
                // Rounding: 4.5 -> 5
                const finalGradeRounded = Math.round(avgGradeRaw);

                detailsHtml += `<div style="margin-top: 15px; pt: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-weight: 800; font-size: 1.1rem; text-align: center;">
                    PROSJEČNA OCJENA: <span style="color: var(--neon-orange); font-size: 1.5rem;">${finalGradeRounded}</span>
                </div></div>`;

                this.elements.finalStats.innerHTML = `Ispit završen, ${this.studentName}! ${detailsHtml}`;

                // CRITICAL: Formatiramo 'subject' varijablu tako da u Google Sheetu pišu svi detalji i prosjek!
                this.selectedSubject = `ISPIT PROSJEK: ${finalGradeRounded} (${examSummaryText.join(', ')})`;

            } else {
                this.elements.finalStats.innerText = `Misija uspješna, ${this.studentName}! Osvojio si ${this.score} bodova.`;
            }
        } else {
            this.elements.finalStats.innerText = `Ispit neuspješan. Tvoja ocjena je 1. Više sreće drugi put, ${this.studentName}!`;
            this.elements.finalStats.style.color = "var(--neon-orange)";
            if (this.isExamMode) {
                this.selectedSubject = "ISPIT PROSJEK: 1 (Game Over / Prekid)";
            }
        }

        // Save as COMPLETED even if failed (Game Over counts as Grade 1 attempt)
        this.saveStatsToCloud(true);
        this.isExamMode = false; // Reset
    }

    async saveStatsToCloud(isCompleted = false) {
        try {
            const stats = {
                action: 'save_stats',
                studentName: this.studentName,
                parentEmail1: this.parentEmail1,
                parentEmail2: this.parentEmail2,
                subject: this.selectedSubject,
                semester: this.selectedSemester,
                grade: this.selectedGrade,
                score: this.score,
                livesLeft: this.lives,
                totalQuestions: this.currentIndex,
                duration: this.duration,
                isCompleted: isCompleted,
                userId: this.userId,
                version: 'v48'
            };

            // Using fetch with keepalive: true (Modern alternative to sendBeacon)
            // It's more reliable with JSON and Google Apps Script
            fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify(stats),
                keepalive: true,
                mode: 'no-cors' // Use no-cors to avoid preflight issues with GAS
            });

            console.log("SharkLearn: Stats sync attempted...", isCompleted ? "FINAL" : "PROGRESS");

            // LOCAL HISTORY TRACKING
            this.trackLocalHistory(stats);

        } catch (e) {
            console.error("Cloud: Failed to save stats.", e);
        }
    }

    markAsSeen(id) {
        let seenIds = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        if (!seenIds.includes(id)) {
            seenIds.push(id);
            localStorage.setItem(this.storageKey, JSON.stringify(seenIds));
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getRandomSubarray(arr, size) {
        let shuffled = this.shuffleArray([...arr]);
        return shuffled.slice(0, size);
    }

    trackLocalHistory(stats) {
        let history = JSON.parse(localStorage.getItem('sharklearn_history')) || [];
        // Add timestamp if missing
        stats.timestamp = new Date().toISOString();
        history.push(stats);
        // Keep last 100 entries
        if (history.length > 100) history.shift();
        localStorage.setItem('sharklearn_history', JSON.stringify(history));
    }

    showStatistics() {
        const history = JSON.parse(localStorage.getItem('sharklearn_history')) || [];
        this.elements.statsOverlay.style.display = 'flex';

        if (history.length === 0) {
            document.getElementById('stats-summary-text').innerHTML = "Nema još podataka za prikaz. Završi barem jednu misiju! 🦈";
            return;
        }

        // 1. Activity Data (Completed vs Interrupted)
        const completed = history.filter(h => h.isCompleted).length;
        const interrupted = history.length - completed;

        this.renderPieChart('activityChart', ['Završeno', 'Prekinuto'], [completed, interrupted], ['#4a86e8', '#ea4335']);

        // 2. Success Data (Grades Distribution)
        const grades = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
        let totalPoints = 0;
        let completedCount = 0;

        history.forEach(h => {
            if (h.isCompleted) {
                const g = this.calculateGradeFromPoints(h.score);
                grades[g]++;
                totalPoints += h.score;
                completedCount++;
            }
        });

        const gradeLabels = Object.keys(grades).reverse(); // 5, 4, 3, 2, 1
        const gradeValues = gradeLabels.map(l => grades[l]);

        this.renderBarChart('gradesChart', gradeLabels, gradeValues, '#ff9900');

        // 3. Summary Text
        const avgScore = completedCount > 0 ? Math.round(totalPoints / completedCount) : 0;
        const totalMinutes = Math.round(history.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60);

        document.getElementById('stats-summary-text').innerHTML = `
            🚀 Ukupno vrijeme učenja: <b>${totalMinutes} min</b><br>
            🎯 Prosječan uspjeh: <b>${avgScore}%</b> (Ocjena: <b>${this.calculateGradeFromPoints(avgScore)}</b>)
        `;
    }

    calculateGradeFromPoints(points) {
        if (points >= 90) return "5";
        if (points >= 80) return "4";
        if (points >= 70) return "3";
        if (points >= 60) return "2";
        return "1";
    }

    renderPieChart(canvasId, labels, data, colors) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (window[canvasId + 'Ref']) window[canvasId + 'Ref'].destroy();

        window[canvasId + 'Ref'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: 'white' } }
                }
            }
        });
    }

    renderBarChart(canvasId, labels, data, color) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (window[canvasId + 'Ref']) window[canvasId + 'Ref'].destroy();

        window[canvasId + 'Ref'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Broj postignutih ocjena',
                    data: data,
                    backgroundColor: color,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'white' } },
                    x: { ticks: { color: 'white' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    async reportBug() {
        if (!this.currentMission[this.currentIndex]) return;

        const q = this.currentMission[this.currentIndex];
        const note = this.elements.bugNote.value.trim();
        const payload = {
            action: 'report_bug',
            questionId: q.id,
            subject: this.selectedSubject,
            userId: this.userId, // User ID is unique across sessions
            note: note
        };

        this.elements.reportBugBtn.disabled = true;
        this.elements.reportBugBtn.innerText = "SLANJE...";

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.status === 'success') {
                this.elements.bugStatus.style.display = 'inline';
                this.elements.bugNote.value = "";
                setTimeout(() => {
                    this.elements.bugStatus.style.display = 'none';
                    this.elements.reportBugBtn.disabled = false;
                    this.elements.reportBugBtn.innerText = "PRIJAVI BUG 🐞";
                }, 3000);
            }
        } catch (error) {
            console.error("Bug report failed:", error);
            this.elements.reportBugBtn.disabled = false;
            this.elements.reportBugBtn.innerText = "POKUŠAJ PONOVNO";
        }
    }

    getRandomSubarray(arr, n) {
        var shuffled = arr.slice(0), i = arr.length, min = i - n, temp, index;
        if (min < 0) min = 0;
        while (i-- > min) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(min);
    }
}

// Initial Launch
window.onload = () => {
    // Initialize
    const engine = new QuizEngine();
    window.gameEngine = engine; // Expose for inline onclick handlers
};
