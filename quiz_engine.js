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
        this.studentName = localStorage.getItem('sharklearn_user_name') || "";

        // Config
        this.storageKey = 'sharklearn_seen_ids';
        this.apiUrl = "https://script.google.com/macros/s/AKfycbyb8wmUOU--5fjmfsZr24l9WkYQRs8r0jVqSwEywEopStKCSjlqoTXIABQf1bAV3JU_/exec";

        // DOM Elements
        this.elements = {
            welcomeScreen: document.getElementById('welcome-screen'),
            studentInput: document.getElementById('student-name-input'),
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
            nextBtn: document.getElementById('next-after-exp-btn')
        };

        this.init();
    }

    async init() {
        // Setup Login UI
        if (this.studentName) {
            this.elements.studentInput.value = this.studentName;
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

        // Enable Start
        this.elements.startBtn.disabled = false;
        this.elements.startBtn.innerText = "ZAPOČNI MISIJU";
        this.elements.startBtn.onclick = () => this.startGame();
    }

    async startGame() {
        const nameInput = this.elements.studentInput.value.trim();
        if (!nameInput) {
            alert("Molim te unesi svoje ime!");
            return;
        }

        this.studentName = nameInput;
        this.selectedSubject = this.elements.subjectHidden.value;
        localStorage.setItem('sharklearn_user_name', this.studentName);

        // UI Transition to Loading State
        this.elements.startBtn.disabled = true;
        this.elements.startBtn.innerText = "UČITAVAM...";

        // Load Questions for selected subject
        try {
            console.log(`SharkLearn: Loading ${this.selectedSubject}...`);
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
            if (this.selectedSubject === "Questions" && typeof QUIZ_DATA !== 'undefined') {
                this.allQuestions = QUIZ_DATA;
            } else if (this.selectedSubject === "Geography5" && typeof GEO_DATA !== 'undefined') {
                this.allQuestions = GEO_DATA;
            }
        }

        if (this.allQuestions.length > 0) {
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
        this.lives = 3;

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
        this.elements.quizWrapper.style.display = 'none';
        this.elements.resultScreen.style.display = 'block';
        this.elements.progressBar.style.width = '100%';

        if (success) {
            this.elements.finalStats.innerText = `Misija uspješna, ${this.studentName}! Osvojio si ${this.score} bodova.`;
        } else {
            this.elements.finalStats.innerText = `Misija neuspješna. Pokušaj ponovno, ${this.studentName}!`;
            this.elements.finalStats.style.color = "var(--neon-orange)";
        }

        this.saveStatsToCloud();
    }

    async saveStatsToCloud() {
        try {
            const stats = {
                action: 'save_stats',
                studentName: this.studentName,
                subject: this.selectedSubject === "Questions" ? "Biologija 7" : "Geografija 5",
                score: this.score,
                livesLeft: this.lives,
                totalQuestions: this.currentIndex
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
