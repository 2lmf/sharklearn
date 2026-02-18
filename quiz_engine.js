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
            gradeScreen: document.getElementById('grade-selection-screen'),
            gradeBtns: document.querySelectorAll('.grade-btn'),
            gradeTitle: document.getElementById('selected-grade-title'),
            backToGradesBtn: document.getElementById('back-to-grades'),
            welcomeScreen: document.getElementById('welcome-screen'),
            subjectHidden: document.getElementById('selected-subject-hidden'),
            subjectCards: document.querySelectorAll('.subject-card'),
            startBtn: document.getElementById('start-btn'),
            // ... (keep others)
            quizWrapper: document.getElementById('quiz-ui-wrapper'),
            question: document.getElementById('question'),
            mediaContainer: document.getElementById('media-container'),
            questionImage: document.getElementById('question-image'),
            options: document.getElementById('options'),
            livesDisplay: document.getElementById('lives'),
            scoreDisplay: document.getElementById('score'),
            progressBar: document.getElementById('progress-bar'),
            quizArea: document.getElementById('quiz-area'),
            resultScreen: document.getElementById('result-screen'),
            finalStats: document.getElementById('final-stats'),
            explanationModal: document.getElementById('explanation-modal'),
            explanationText: document.getElementById('explanation-text'),
            nextBtn: document.getElementById('next-after-exp-btn'),
            semesterOptions: document.querySelectorAll('.sem-opt'),
            semesterHidden: document.getElementById('selected-semester-hidden'),

            // Registration Elements
            registrationModal: document.getElementById('registration-modal'),
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
            regValidationMsg: document.getElementById('reg-validation-msg')
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
            this.elements.registrationModal.style.display = 'flex';
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
            this.elements.backToGradesBtn.onclick = () => this.handleEarlyExit(() => this.showGradeSelection());
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
        this.elements.registrationModal.style.display = 'flex';
        this.elements.regValidationMsg.style.display = 'none';
    }

    saveProfile() {
        const name = this.elements.regStudentName.value.trim();
        const email1 = this.elements.regParentEmail1.value.trim();
        const email2 = this.elements.regParentEmail2.value.trim();

        this.elements.regValidationMsg.style.display = 'none';

        if (name.length < 3) {
            this.showValidationError("Unesi puno ime (min 3 znaka).");
            return;
        }

        const v1 = this.validateEmail(email1);
        if (!v1.valid) {
            this.showValidationError(v1.msg);
            return;
        }

        if (email2) {
            const v2 = this.validateEmail(email2);
            if (!v2.valid) {
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
        this.showGradeSelection();
        this.syncUserToCloud();
        console.log("SharkLearn: Profile saved/updated for", name);
    }

    showValidationError(msg) {
        this.elements.regValidationMsg.innerText = "⚠️ " + msg;
        this.elements.regValidationMsg.style.display = 'block';
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

        // Update UI
        this.elements.gradeScreen.style.display = 'none';
        this.elements.welcomeScreen.style.display = 'block';
        this.elements.gradeTitle.innerText = `${grade}. RAZRED`;

        // Filter Subject Cards
        let firstVisible = null;
        this.elements.subjectCards.forEach(card => {
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
            this.elements.registrationModal.style.display = 'flex';

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
            this.elements.registrationModal.style.display = 'flex';
            return;
        }
        this.selectedSubject = this.elements.subjectHidden.value;
        this.selectedSemester = this.elements.semesterHidden.value;
        localStorage.setItem('sharklearn_user_name', this.studentName);

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

        // Load Questions for selected subject
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
            // Local fallback based on subject
            if (this.selectedSubject === "Biologija7" && typeof QUIZ_DATA !== 'undefined') {
                this.allQuestions = QUIZ_DATA;
            } else if (this.selectedSubject === "Geografija5" && typeof GEO_DATA !== 'undefined') {
                this.allQuestions = GEO_DATA;
            } else if (this.selectedSubject === "Engleski5" && typeof ENG_DATA !== 'undefined') {
                this.allQuestions = ENG_DATA;
            } else if (this.selectedSubject === "Njemacki5" && typeof GER_DATA !== 'undefined') {
                this.allQuestions = GER_DATA;
            } else if (this.selectedSubject === "Povijest7" && typeof HIS_DATA !== 'undefined') {
                this.allQuestions = HIS_DATA;
            } else if (this.selectedSubject === "Geografija7" && typeof GEO_7_DATA !== 'undefined') {
                this.allQuestions = GEO_7_DATA;
            } else if (this.selectedSubject === "Hrvatski5" && typeof HRV_5_DATA !== 'undefined') {
                this.allQuestions = HRV_5_DATA;
            } else if (this.selectedSubject === "Hrvatski7" && typeof HRV_7_DATA !== 'undefined') {
                this.allQuestions = HRV_7_DATA;
            } else if (this.selectedSubject === "Kemija7" && typeof KEM_DATA !== 'undefined') {
                this.allQuestions = KEM_DATA;
            } else if (this.selectedSubject === "Fizika7" && typeof FIZ_DATA !== 'undefined') {
                this.allQuestions = FIZ_DATA;
            } else if (this.selectedSubject === "Matematika5" && typeof MAT_DATA !== 'undefined') {
                this.allQuestions = MAT_DATA;
            } else if (this.selectedSubject === "Matematika7" && typeof MAT_7_DATA !== 'undefined') {
                this.allQuestions = MAT_7_DATA;
            } else if (this.selectedSubject === "Engleski7" && typeof ENG_7_DATA !== 'undefined') {
                this.allQuestions = ENG_7_DATA;
            } else if (this.selectedSubject === "Povijest5" && typeof HIS_5_DATA !== 'undefined') {
                this.allQuestions = HIS_5_DATA;
            } else if (this.selectedSubject === "njemacki7" && typeof GER_7_DATA !== 'undefined') {
                this.allQuestions = GER_7_DATA;
            } else if (this.selectedSubject === "prirodaidrustvo5" && typeof PRI_5_DATA !== 'undefined') {
                this.allQuestions = PRI_5_DATA;
            }
        }

        if (this.allQuestions.length > 0) {
            // Apply Semester Filter locally if not already done by backend
            if (this.selectedSemester !== "all") {
                const filtered = this.allQuestions.filter(q => q.semester == this.selectedSemester);
                if (filtered.length > 0) {
                    this.allQuestions = filtered;
                } else {
                    console.warn(`No questions for semester ${this.selectedSemester}, showing all.`);
                }
            }

            this.elements.welcomeScreen.style.display = 'none';
            this.elements.quizWrapper.style.display = 'block';
            this.setupMission();
        } else {
            alert("Greška: Nema pitanja za ovaj predmet u oblaku. Učitelj mora dodati pitanja u " + this.selectedSubject + " tablicu.");
            this.elements.startBtn.disabled = false;
            this.elements.startBtn.innerText = "ZAPOČNI MISIJU";
        }
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
        this.elements.resultScreen.style.display = 'block';
        this.elements.progressBar.style.width = '100%';

        if (success) {
            this.elements.finalStats.innerText = `Misija uspješna, ${this.studentName}! Osvojio si ${this.score} bodova.`;
            this.saveStatsToCloud(true); // Completed = DA
        } else {
            this.elements.finalStats.innerText = `Misija neuspješna. Pokušaj ponovno, ${this.studentName}!`;
            this.elements.finalStats.style.color = "var(--neon-orange)";
            this.saveStatsToCloud(false); // Completed = NE (but has duration/score)
        }
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
}

// Initial Launch
window.onload = () => {
    window.quiz = new QuizEngine();
};
