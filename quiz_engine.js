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
        this.studentName = localStorage.getItem('sharklearn_user_name') || "";
        this.parentEmail1 = localStorage.getItem('sharklearn_parent_email_1') || "";
        this.parentEmail2 = localStorage.getItem('sharklearn_parent_email_2') || "";
        this.startTime = null;
        this.duration = 0;
        this.isRegistered = !!(this.studentName && this.parentEmail1);

        // Config
        this.storageKey = 'sharklearn_seen_ids';
        this.apiUrl = "https://script.google.com/macros/s/AKfycbxcJWoGRtBLRHs-aOH4HwoMESKEj5_CAbV67GZRFD54xQeJluQcGheoCYOjQelxxm0W/exec";

        // DOM Elements
        this.elements = {
            welcomeScreen: document.getElementById('welcome-screen'),
            subjectHidden: document.getElementById('selected-subject-hidden'),
            subjectCards: document.querySelectorAll('.subject-card'),
            startBtn: document.getElementById('start-btn'),
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
            displayParentEmails: document.getElementById('display-parent-emails')
        };

        this.init();
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

        // Subject Card Selection Logic
        this.elements.subjectCards.forEach(card => {
            card.onclick = () => {
                // Remove active from all
                this.elements.subjectCards.forEach(c => c.classList.remove('active'));
                // Add to clicked
                card.classList.add('active');
                // Update hidden input
                this.elements.subjectHidden.value = card.getAttribute('data-subject');
                console.log("SharkLearn: Subject changed to", this.elements.subjectHidden.value);
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
    }

    saveProfile() {
        const name = this.elements.regStudentName.value.trim();
        const email1 = this.elements.regParentEmail1.value.trim();
        const email2 = this.elements.regParentEmail2.value.trim();

        if (name.length < 3 || !email1.includes('@')) {
            alert("Molim te unesi svoje ime i barem jedan ispravan email roditelja!");
            return;
        }

        this.studentName = name;
        this.parentEmail1 = email1;
        this.parentEmail2 = email2;
        this.isRegistered = true;

        localStorage.setItem('sharklearn_user_name', name);
        localStorage.setItem('sharklearn_parent_email_1', email1);
        if (email2) localStorage.setItem('sharklearn_parent_email_2', email2);

        this.elements.registrationModal.style.display = 'none';
        this.updateProfileUI();
        console.log("SharkLearn: Profile saved for", name);
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

        // UI Transition to Loading State
        this.elements.startBtn.disabled = true;
        this.elements.startBtn.innerText = "UČITAVAM...";

        // Send Initial Attempt Stats (Cloud track that session started)
        this.saveStatsToCloud(false);

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

    endGame(success) {
        // Calculate final duration
        if (this.startTime) {
            const endTime = new Date();
            this.duration = Math.floor((endTime - this.startTime) / 1000); // seconds
        }

        this.elements.quizWrapper.style.display = 'none';
        this.elements.resultScreen.style.display = 'block';
        this.elements.progressBar.style.width = '100%';

        if (success) {
            this.elements.finalStats.innerText = `Misija uspješna, ${this.studentName}! Osvojio si ${this.score} bodova.`;
        } else {
            this.elements.finalStats.innerText = `Misija neuspješna. Pokušaj ponovno, ${this.studentName}!`;
            this.elements.finalStats.style.color = "var(--neon-orange)";
        }

        this.saveStatsToCloud(true);
    }

    async saveStatsToCloud(isCompleted = false) {
        try {
            const stats = {
                action: 'save_stats',
                studentName: this.studentName,
                parentEmail1: this.parentEmail1,
                parentEmail2: this.parentEmail2,
                subject: this.selectedSubject,
                score: this.score,
                livesLeft: this.lives,
                totalQuestions: this.currentIndex,
                duration: this.duration,
                isCompleted: isCompleted,
                version: 'v40'
            };
            fetch(this.apiUrl, { method: 'POST', body: JSON.stringify(stats) });
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
}

// Initial Launch
window.onload = () => {
    window.quiz = new QuizEngine();
};
