/**
 * SharkLearn Multiplayer v1.0
 * Firebase Realtime Database — 2 igrača duel mod
 */

class MultiplayerManager {
  constructor() {
    this.db = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.roomRef = null;
    this.active = false;
    this.seed = null;
    this.onRoomUpdate = null;
    this._initFirebase();
  }

  _initFirebase() {
    // Config se učitava iz firebase_config.js (gitignored)
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    this.db = firebase.database();
  }

  isActive() { return this.active; }

  _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  _mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  getSeededMission(allQuestions, count) {
    const rng = this._mulberry32(this.seed);
    const arr = [...allQuestions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(count, arr.length));
  }

  async createRoom(subject, grade, semester, playerName) {
    this.roomCode = this._generateCode();
    this.playerId = 'p1';
    this.isHost = true;
    this.seed = Math.floor(Math.random() * 999999);
    this.roomRef = this.db.ref('rooms/' + this.roomCode);

    await this.roomRef.set({
      subject, grade, semester, seed: this.seed,
      status: 'waiting',
      createdAt: Date.now(),
      players: {
        p1: { name: playerName, score: 0, lives: 5, index: 0, finished: false }
      }
    });

    this.roomRef.onDisconnect().remove();
    this.active = true;
    this._listen();
    return this.roomCode;
  }

  async joinRoom(code, playerName) {
    code = code.toUpperCase().trim();
    const ref = this.db.ref('rooms/' + code);
    const snap = await ref.once('value');
    if (!snap.exists()) throw new Error('Soba ne postoji! Provjeri kod.');
    const data = snap.val();
    if (data.status !== 'waiting') throw new Error('Igra je već u tijeku!');
    if (data.players && data.players.p2) throw new Error('Soba je puna!');

    this.roomCode = code;
    this.playerId = 'p2';
    this.isHost = false;
    this.seed = data.seed;
    this.roomRef = ref;

    await ref.child('players/p2').set({
      name: playerName, score: 0, lives: 5, index: 0, finished: false
    });

    this.active = true;
    this._listen();
    return { subject: data.subject, grade: data.grade, semester: data.semester };
  }

  async syncState(score, lives, index, finished) {
    if (!this.roomRef || !this.active) return;
    try {
      await this.roomRef.child('players/' + this.playerId).update({ score, lives, index, finished });
      if (finished) {
        const snap = await this.roomRef.once('value');
        const p = snap.val()?.players;
        if (p?.p1?.finished && p?.p2?.finished) {
          await this.roomRef.update({ status: 'finished' });
        }
      }
    } catch (e) { console.warn('MP sync error:', e); }
  }

  getOpponentId() { return this.playerId === 'p1' ? 'p2' : 'p1'; }

  _listen() {
    this.roomRef.on('value', snap => {
      const data = snap.val();
      if (data && this.onRoomUpdate) this.onRoomUpdate(data);
    });
  }

  cleanup() {
    if (this.roomRef) this.roomRef.off();
    this.active = false;
    this.roomRef = null;
    this.roomCode = null;
    this.seed = null;
  }

  showDuelResult(myScore) {
    const overlay = document.getElementById('mp-result-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';

    const myName = localStorage.getItem('sharklearn_user_name') || 'Ti';
    document.getElementById('mp-my-name').innerText = myName;
    document.getElementById('mp-my-score').innerText = myScore + ' ⭐';
    document.getElementById('mp-op-name').innerText = '...';
    document.getElementById('mp-op-score').innerText = '...';
    document.getElementById('mp-waiting-result').style.display = 'flex';
    document.getElementById('mp-winner-text').style.display = 'none';

    const opId = this.getOpponentId();
    let resolved = false;

    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      document.getElementById('mp-waiting-result').style.display = 'none';
      this._showWinner('⏱️ PROTIVNIK JE ODUSTAO!', 'text-[#fe9d00]');
    }, 30000);

    this.onRoomUpdate = (data) => {
      const op = data.players?.[opId];
      if (!op) return;
      document.getElementById('mp-op-name').innerText = op.name || 'Protivnik';
      document.getElementById('mp-op-score').innerText = (op.score || 0) + ' ⭐';
      if (op.finished && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        document.getElementById('mp-waiting-result').style.display = 'none';
        if (myScore > op.score) this._showWinner('🏆 POBIJEDIO/LA SI!', 'text-[#fe9d00]');
        else if (myScore < op.score) this._showWinner('😤 BOLJE SLJEDEĆI PUT!', 'text-red-400');
        else this._showWinner('🤝 NERIJEŠENO!', 'text-white');
      }
    };
  }

  _showWinner(text, cls) {
    const el = document.getElementById('mp-winner-text');
    el.innerText = text;
    el.className = `text-2xl font-black ${cls} mt-4`;
    el.style.display = 'block';
  }
}

window.MP = new MultiplayerManager();

// ===== LOBBY CONTROLLER =====
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('duel-btn')?.addEventListener('click', () => {
    document.getElementById('mp-lobby-overlay').style.display = 'flex';
  });

  document.getElementById('mp-close-lobby')?.addEventListener('click', () => {
    document.getElementById('mp-lobby-overlay').style.display = 'none';
  });

  const tabCreate = document.getElementById('mp-tab-create');
  const tabJoin = document.getElementById('mp-tab-join');
  const panelCreate = document.getElementById('mp-panel-create');
  const panelJoin = document.getElementById('mp-panel-join');

  tabCreate?.addEventListener('click', () => {
    tabCreate.classList.add('border-b-2', 'border-[#fe9d00]', 'text-[#fe9d00]');
    tabJoin.classList.remove('border-b-2', 'border-[#fe9d00]', 'text-[#fe9d00]');
    panelCreate.style.display = 'block';
    panelJoin.style.display = 'none';
  });

  tabJoin?.addEventListener('click', () => {
    tabJoin.classList.add('border-b-2', 'border-[#fe9d00]', 'text-[#fe9d00]');
    tabCreate.classList.remove('border-b-2', 'border-[#fe9d00]', 'text-[#fe9d00]');
    panelJoin.style.display = 'block';
    panelCreate.style.display = 'none';
  });

  // CREATE ROOM
  document.getElementById('mp-create-btn')?.addEventListener('click', async () => {
    const engine = window.gameEngine;
    if (!engine?.isRegistered) { alert('Moraš biti prijavljen!'); return; }
    const btn = document.getElementById('mp-create-btn');
    btn.disabled = true; btn.innerText = '⏳ Kreiram...';
    try {
      const subject = engine.elements.subjectHidden.value;
      const grade = engine.selectedGrade;
      const semester = engine.elements.semesterHidden.value;
      if (!subject || !grade) {
        alert('Odaberi predmet i razred prije kreiranja sobe!');
        btn.disabled = false; btn.innerText = '🦈 KREIRAJ SOBU'; return;
      }
      const code = await window.MP.createRoom(subject, grade, semester, engine.studentName);
      document.getElementById('mp-lobby-overlay').style.display = 'none';
      showWaiting(code, 'Čekam protivnika...');

      window.MP.onRoomUpdate = async (data) => {
        if (data.players?.p2 && data.status === 'waiting') {
          await window.MP.roomRef.update({ status: 'countdown' });
          hideWaiting();
          startCountdown(engine, data);
        }
      };
    } catch (e) {
      alert('Greška: ' + e.message);
      btn.disabled = false; btn.innerText = '🦈 KREIRAJ SOBU';
    }
  });

  // JOIN ROOM
  document.getElementById('mp-join-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('mp-join-code').value;
    const engine = window.gameEngine;
    if (!engine?.isRegistered) { alert('Moraš biti prijavljen!'); return; }
    if (!code || code.trim().length < 4) { alert('Unesi ispravan kod sobe!'); return; }
    const btn = document.getElementById('mp-join-btn');
    btn.disabled = true; btn.innerText = '⏳ Spajam se...';
    try {
      const roomData = await window.MP.joinRoom(code, engine.studentName);
      document.getElementById('mp-lobby-overlay').style.display = 'none';
      showWaiting(window.MP.roomCode, 'Čekam hosta da pokrene...');

      window.MP.onRoomUpdate = (data) => {
        if (data.status === 'countdown') {
          hideWaiting();
          engine.selectedSubject = roomData.subject;
          engine.selectedGrade = roomData.grade;
          engine.selectedSemester = roomData.semester;
          engine.elements.subjectHidden.value = roomData.subject;
          startCountdown(engine, data);
        }
      };
    } catch (e) {
      alert('Greška: ' + e.message);
      btn.disabled = false; btn.innerText = '🔗 SPOJI SE';
    }
  });

  document.getElementById('mp-cancel-wait')?.addEventListener('click', () => {
    window.MP.cleanup();
    hideWaiting();
  });

  document.getElementById('mp-play-again')?.addEventListener('click', () => location.reload());

  function showWaiting(code, text) {
    document.getElementById('mp-waiting-overlay').style.display = 'flex';
    document.getElementById('mp-room-code').innerText = code;
    document.getElementById('mp-waiting-text').innerText = text || 'Čekam...';
  }

  function hideWaiting() {
    document.getElementById('mp-waiting-overlay').style.display = 'none';
  }

  function startCountdown(engine, roomData) {
    const opId = window.MP.getOpponentId();
    let count = 3;
    const overlay = document.getElementById('mp-countdown-overlay');
    const numEl = document.getElementById('mp-countdown-num');
    overlay.style.display = 'flex';
    numEl.innerText = count;

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.innerText = count;
      } else {
        clearInterval(timer);
        overlay.style.display = 'none';

        // Opponent widget
        const opName = roomData.players?.[opId]?.name || 'Protivnik';
        const widget = document.getElementById('mp-opponent-widget');
        widget.style.display = 'flex';
        document.getElementById('mp-op-widget-name').innerText = opName;

        // Live opponent updates
        window.MP.onRoomUpdate = (data) => {
          const op = data.players?.[opId];
          if (!op) return;
          document.getElementById('mp-op-widget-score').innerText = op.score || 0;
          const lives = Math.max(0, op.lives ?? 5);
          document.getElementById('mp-op-widget-lives').innerText = '❤️'.repeat(lives);
          if (op.finished) {
            const fin = document.getElementById('mp-op-widget-finished');
            if (fin) fin.style.display = 'inline';
          }
        };

        engine.startGame();
      }
    }, 1000);
  }
});
