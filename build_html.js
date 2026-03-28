const fs = require('fs');
const oldHtml = fs.readFileSync('index_old.html', 'utf8');

// Match the scripts
const scriptsMatch = oldHtml.match(/<!-- 5\. RAZRED CONTENT -->[\s\S]*?<script src="quiz_engine\.js\?v=\d+"><\/script>/);
const scriptsHtml = scriptsMatch ? scriptsMatch[0] : '<script src="quiz_engine.js"></script>';

// Match the subject cards
const subjectsMatch = oldHtml.match(/<div class="subject-cards" id="subject-cards-container">([\s\S]*?)<\/div>\s*<input type="hidden" id="selected-subject-hidden"/);
let subjectsHtml = subjectsMatch ? subjectsMatch[1] : '';

// Convert subject card classes to Tailwind 
subjectsHtml = subjectsHtml.replace(/<div class="subject-card"([^>]*)>\s*<span class="icon"[^>]*>([^<]+)<\/span>\s*<span class="label"[^>]*>([^<]+)<\/span>\s*<\/div>/g,
    '<button class="glass-card p-4 rounded-2xl flex flex-col items-center text-center subject-card w-full hover:bg-[#fe9d00]/10 transition-colors border-b-4 border-transparent active:scale-95"$1><div class="bg-[#fe9d00]/10 p-2 rounded-xl mb-2"><span class="text-3xl">$2</span></div><span class="font-bold text-[10px] uppercase tracking-widest text-white/80">$3</span></button>'
);

// Remove the old exam card, we will put our own Tailwind version
subjectsHtml = subjectsHtml.replace(/<div class="subject-card exam-card"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g, '');

const finalHtml = `<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SharkLearn | Modernized Edition</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#060e1d">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="SharkLearn">
    <meta name="mobile-web-app-capable" content="yes">
    <link rel="apple-touch-icon" href="assets/img/shark_icon.svg">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .shark-orange { color: #FF9D00; }
        .bg-shark-dark { background-color: #060e1d; }
        .glass-card { 
            background: rgba(11, 23, 45, 0.7); 
            backdrop-filter: blur(12px); 
            border: 1px solid rgba(254, 157, 0, 0.1);
        }
        
        .modal-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .ocean-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; background: radial-gradient(circle at center, #0b172d 0%, #060e1d 100%); }
        .grid-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background-image: linear-gradient(rgba(255,157,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,157,0,0.03) 1px, transparent 1px); background-size: 30px 30px; }
        
        .option-btn {
            width: 100%;
            background: rgba(11, 23, 45, 0.7);
            backdrop-filter: blur(12px);
            border: 2px solid transparent;
            padding: 1.25rem;
            border-radius: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            text-align: left;
            transition: all 0.2s ease-in-out;
            color: white;
            font-weight: bold;
            margin-bottom: 0.75rem;
        }
        .option-btn:hover { border-color: rgba(254, 157, 0, 0.5); }
        .option-btn:active { transform: scale(0.98); }
        .option-btn.correct { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); box-shadow: 0 0 15px rgba(34, 197, 94, 0.2); }
        .option-btn.wrong { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
        
        .sem-opt.active { background-color: rgba(254, 157, 0, 0.2); border: 1px solid #fe9d00; color: #fe9d00; }
        .subject-card.active { border-color: #fe9d00; background-color: rgba(254, 157, 0, 0.15); transform: scale(1.05); }
        
        /* Utility to override quiz_engine.js display:none */
        .hidden.force-hidden { display: none !important; }
    </style>
</head>
<body class="bg-[#060e1d] text-[#dde5fb] min-h-screen">
    <div class="ocean-bg"></div>
    <div class="grid-overlay"></div>

    <!-- USER INFO BAR -->
    <div id="user-info-bar" class="hidden fixed top-0 left-0 w-full p-4 bg-[#0b172d]/90 backdrop-blur-md z-[60] border-b border-white/5 flex justify-between items-center text-xs shadow-lg">
        <div class="flex items-center gap-2">
            <span class="text-[#fe9d00] animate-pulse">●</span>
            <span id="display-student-name" class="font-bold text-white">Učenik</span>
        </div>
        <div class="flex items-center gap-2 opacity-80">
            <span id="display-parent-emails" class="text-[10px] hidden sm:block"></span>
            <button id="edit-profile-btn" class="ml-2 bg-white/10 px-3 py-1.5 rounded-full font-bold hover:bg-white/20 transition">UREDI ✏️</button>
        </div>
    </div>

    <!-- APP CONTAINER -->
    <div class="max-w-md mx-auto min-h-screen relative pb-28 pt-16 z-10 w-full overflow-hidden">

        <!-- WELCOME BACK MODAL -->
        <section id="welcome-back-modal" class="hidden fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div class="glass-card w-full max-w-sm rounded-[2rem] p-8 text-center border-t-2 border-[#fe9d00]/50 shadow-[0_0_50px_rgba(254,157,0,0.2)]">
                <div class="text-3xl font-black italic tracking-tighter mb-4">
                    <span class="text-white">SHARK</span><span class="text-[#fe9d00]">LEARN</span>
                </div>
                <h2 class="text-xl font-extrabold text-white mb-2 tracking-widest">POVRATAK U BAZU</h2>
                <p class="text-[#dde5fb]/60 mb-8 text-sm">Dobrodošao natrag, <span id="welcome-back-name" class="text-white font-bold">Učenik</span>! 👋</p>
                <div class="space-y-3">
                    <button id="continue-btn" class="w-full bg-[#fe9d00] text-[#060e1d] font-black py-4 rounded-2xl hover:scale-[1.02] shadow-[0_8px_20px_rgba(254,157,0,0.3)] transition transform active:scale-95">NASTAVI LEARNAT ;)</button>
                    <button id="new-user-btn" class="w-full bg-transparent border border-white/20 text-white/60 py-3 rounded-2xl hover:bg-white/5 hover:text-white transition text-xs font-bold tracking-widest uppercase active:scale-95">👤 NOVI KORISNIK</button>
                </div>
                <div class="mt-8 pt-4 border-t border-[#fe9d00]/20">
                    <img src="SharpShark_Logo.png" alt="SharpShark" class="mx-auto h-6 opacity-50">
                </div>
            </div>
        </section>

        <!-- 1. REGISTRATION -->
        <section id="registration-section" class="px-6 pt-8 hidden transition-all duration-500">
            <div class="flex flex-col items-center text-center">
                <div class="text-3xl font-black italic tracking-tighter mb-8 bg-black/30 px-6 py-2 rounded-full border border-white/5 shadow-inner">
                    <span class="text-white">SHARK</span><span class="text-[#fe9d00]">LEARN</span>
                </div>
                <div class="glass-card w-full rounded-[2rem] p-8 shadow-2xl modal-content">
                    <h2 class="text-2xl font-black text-white mb-2">DOBRODOŠAO</h2>
                    <p class="text-sm text-[#dde5fb]/60 mb-8">Postavi svoj profil za početak.</p>
                    
                    <div class="space-y-4 text-left">
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-widest text-[#fe9d00] mb-2 px-2">Ime učenika</label>
                            <input type="text" id="reg-student-name" placeholder="Tvoje ime i prezime" class="w-full bg-[#0b172d]/80 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#fe9d00] transition placeholder-white/20 shadow-inner">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-widest text-[#fe9d00] mb-2 px-2">Email roditelja 1</label>
                            <input type="email" id="reg-parent-email-1" placeholder="primjer@email.com" class="w-full bg-[#0b172d]/80 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#fe9d00] transition placeholder-white/20 shadow-inner">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-2">Email roditelja 2 <span class="text-[9px] lowercase opacity-50">(opcionalno)</span></label>
                            <input type="email" id="reg-parent-email-2" placeholder="opcionalno@email.com" class="w-full bg-[#0b172d]/50 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-white/20 transition placeholder-white/10 shadow-inner text-sm">
                        </div>
                        <div id="reg-validation-msg" class="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20 hidden"></div>
                        <button id="save-profile-btn" class="w-full bg-[#fe9d00] text-[#060e1d] font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(254,157,0,0.3)] hover:scale-[1.02] active:scale-95 transition-transform mt-4 text-lg">
                            SPREMI I KRENI
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- 2. GRADE SELECTION -->
        <section id="grade-selection-section" class="px-6 hidden transition-all duration-500">
            <div class="text-center mb-8">
                <div class="text-3xl font-black italic tracking-tighter mb-4">
                    <span class="text-white">SHARK</span><span class="text-[#fe9d00]">LEARN</span>
                </div>
                <h1 class="text-4xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Odaberi razred</h1>
            </div>
            
            <div class="grid grid-cols-2 gap-4 pb-10">
                <button class="grade-btn glass-card p-6 rounded-[2rem] flex flex-col items-center justify-center hover:bg-[#fe9d00]/10 hover:border-[#fe9d00]/50 transition-all border-b-4 border-b-[#fe9d00]/20 active:scale-95" data-grade="5">
                    <span class="text-5xl mb-3 drop-shadow-lg scale-110">🎒</span>
                    <span class="font-bold text-xl text-white">5. razred</span>
                </button>
                <button class="grade-btn glass-card p-6 rounded-[2rem] flex flex-col items-center justify-center hover:bg-[#fe9d00]/10 hover:border-[#fe9d00]/50 transition-all border-b-4 border-b-[#fe9d00]/20 active:scale-95" data-grade="6">
                    <span class="text-5xl mb-3 drop-shadow-lg scale-110">🔭</span>
                    <span class="font-bold text-xl text-white">6. razred</span>
                </button>
                <button class="grade-btn glass-card p-6 rounded-[2rem] flex flex-col items-center justify-center hover:bg-[#fe9d00]/10 hover:border-[#fe9d00]/50 transition-all border-b-4 border-b-[#fe9d00]/20 active:scale-95" data-grade="7">
                    <span class="text-5xl mb-3 drop-shadow-lg scale-110">🧬</span>
                    <span class="font-bold text-xl text-white">7. razred</span>
                </button>
                <button class="grade-btn glass-card p-6 rounded-[2rem] flex flex-col items-center justify-center hover:bg-[#fe9d00]/10 hover:border-[#fe9d00]/50 transition-all border-b-4 border-b-[#fe9d00]/20 active:scale-95" data-grade="8">
                    <span class="text-5xl mb-3 drop-shadow-lg scale-110">⚡</span>
                    <span class="font-bold text-xl text-white">8. razred</span>
                </button>
            </div>
            <p class="text-[#00f3ff] text-center text-xs font-bold px-4 opacity-80 mt-4 leading-relaxed tracking-wide">Možeš ući u bilo koji razred bez obzira koji pohađaš.</p>
        </section>

        <!-- 3. SUBJECT SELECTION -->
        <section id="subject-selection-section" class="px-6 hidden transition-all duration-500 pb-20">
            <button id="back-to-grades" class="text-[10px] font-bold text-white/50 hover:text-white mb-6 uppercase tracking-widest flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full active:scale-95"><span class="text-sm">←</span> PROMIJENI RAZRED</button>
            
            <div class="mb-6">
                <h1 id="selected-grade-title" class="text-4xl font-black text-white leading-none tracking-tighter shadow-sm text-center">7. RAZRED</h1>
                <p class="text-white/40 font-bold text-xs tracking-widest mt-2 text-center uppercase">Spremno za misiju</p>
            </div>
            
            <!-- Semesters -->
            <div class="flex justify-center gap-3 mb-8 bg-black/40 p-2 rounded-full border border-white/5 shadow-inner">
                <button class="sem-opt active flex-1 bg-white/5 px-4 py-2.5 rounded-full text-xs font-black shadow-sm transition-all" data-semester="all">Cijela god.</button>
                <button class="sem-opt flex-1 bg-transparent text-white/50 px-4 py-2.5 rounded-full text-xs font-black transition-all hover:bg-white/5" data-semester="1">1. Pol.</button>
                <button class="sem-opt flex-1 bg-transparent text-white/50 px-4 py-2.5 rounded-full text-xs font-black transition-all hover:bg-white/5" data-semester="2">2. Pol.</button>
            </div>
            
            <input type="hidden" id="selected-subject-hidden" value="Biologija7">
            <input type="hidden" id="selected-semester-hidden" value="all">

            <div class="grid grid-cols-2 gap-4" id="subject-cards-container">
                <!-- EXAM MODE PROMO -->
                <div id="exam-mode-card" class="subject-card exam-card col-span-2 bg-gradient-to-br from-[#fe9d00] to-[#ff5e00] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(254,157,0,0.3)] relative overflow-hidden text-left hover:scale-[1.02] active:scale-95 transition-transform border border-white/20 cursor-pointer" data-subject="SPECIAL_EXAM" data-grade="MIXED" style="display: none;">
                    <div class="relative z-10 flex items-center justify-between">
                        <div>
                            <span class="bg-[#060e1d]/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block text-white shadow-inner">Intenzivni trening</span>
                            <h3 class="text-2xl font-black text-white mb-1 shadow-sm tracking-wide">EXAM MODE</h3>
                            <p class="text-white/90 text-[10px] font-bold tracking-wider">5 RANDOM PREDMETA • OPASNO</p>
                        </div>
                        <div class="text-5xl drop-shadow-xl saturate-150">🏆</div>
                    </div>
                    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                </div>
                
                <!-- Injected via Script Map -->
                ${subjectsHtml}
            </div>

            <!-- Fixed Start Button Area -->
            <div class="fixed bottom-24 left-0 w-full px-6 z-20 pointer-events-none">
                 <!-- Gradient mask for smooth fade into start button -->
                 <div class="absolute -top-12 left-0 w-full h-12 bg-gradient-to-t from-[#060e1d] to-transparent"></div>
                 <div class="max-w-md mx-auto pointer-events-auto bg-[#060e1d] pb-2 pt-2">
                    <button id="start-btn" class="w-full bg-[#fe9d00] text-[#060e1d] font-black py-4 rounded-2xl shadow-[0_0_30px_rgba(254,157,0,0.4)] hover:scale-[1.02] active:scale-95 transition-transform text-lg border-2 border-[#ffb333] tracking-widest uppercase">
                        ZAPOČNI MISIJU
                    </button>
                 </div>
            </div>
        </section>

        <!-- 4. QUIZ SECTION -->
        <section id="quiz-section" class="px-6 hidden flex-col transition-all duration-300">
            <div class="flex justify-between items-center mb-6 pt-2">
                <div class="flex items-center gap-2 bg-black/40 border border-red-500/20 px-4 py-2 rounded-full shadow-inner">
                    <span class="text-red-500 animate-pulse text-lg">❤️</span>
                    <span id="lives" class="font-black text-white text-base">5</span>
                </div>
                <!-- Mini top logo for quiz -->
                <div class="text-[10px] font-black italic tracking-widest text-center opacity-40">
                    <span class="text-white">SHARK</span><span class="text-[#fe9d00]">LEARN</span><br>
                    <span class="text-white/50" id="quiz-grade-indicator">MISIJA</span>
                </div>
                <div class="flex items-center gap-2 bg-black/40 border border-[#fe9d00]/20 px-4 py-2 rounded-full shadow-inner">
                    <span class="text-yellow-400 text-lg">⭐</span>
                    <span id="score" class="font-black text-white text-base tracking-wider">0</span>
                </div>
            </div>

            <div class="w-full bg-black/60 h-2 rounded-full mb-8 overflow-hidden border border-white/5 shadow-inner">
                <div id="progress-bar" class="bg-gradient-to-r from-[#FFD700] via-[#fe9d00] to-[#ff5e00] h-full w-[0%] transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_#fe9d00]"></div>
            </div>

            <!-- Card holding media & question -->
            <div class="glass-card rounded-[2rem] p-6 mb-6 relative overflow-hidden shadow-2xl shrink-0">
                <!-- Glossy highlight effect -->
                <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <div id="media-container" class="bg-[#060e1d] rounded-2xl mb-6 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner p-2 relative" style="display: none; min-height: 180px;">
                    <img id="question-image" src="" alt="Pitanje" class="w-full h-auto max-h-[200px] object-contain rounded-xl">
                </div>

                <div class="flex gap-3">
                    <div class="w-1.5 bg-[#fe9d00] rounded-full shrink-0 my-1 shadow-[0_0_10px_#fe9d00]"></div>
                    <h2 id="question" class="text-[1.125rem] sm:text-lg font-bold text-white leading-relaxed">Učitavam pitanje... Ovo može potrajati sekundu.</h2>
                </div>
            </div>

            <div id="options" class="flex flex-col gap-3 pb-[100px]">
                <!-- Buttons injected by JS -->
            </div>
        </section>

        <!-- EXPLANATION MODAL -->
        <section id="explanation-modal" class="hidden force-hidden fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md transition-opacity">
            <div class="glass-card w-full max-w-sm rounded-[2rem] p-8 text-center border-t-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div class="text-6xl mb-4 drop-shadow-xl saturate-150 animate-bounce">🦈</div>
                <h2 class="text-2xl font-black text-red-500 mb-4 tracking-tight text-shadow-sm">UPS! SKORO...</h2>
                <div id="explanation-text" class="text-white text-base mb-6 font-bold leading-relaxed shadow-sm"></div>
                
                <div class="bg-black/50 rounded-2xl p-4 mb-6 text-left border border-white/5 shadow-inner">
                    <p class="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2">NEŠTO NIJE U REDU S PITANJEM?</p>
                    <textarea id="bug-note" placeholder="Tvoja napomena (opcionalno)..." class="w-full bg-transparent text-xs font-bold text-white focus:outline-none resize-none h-14 mb-2 bg-[#060e1d] p-3 rounded-xl border border-white/5"></textarea>
                    <div class="flex items-center justify-between mt-2">
                        <button id="report-bug-btn" class="bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-white text-xs font-black py-2.5 px-4 rounded-xl transition uppercase tracking-widest active:scale-95">PRIJAVI BUG 🐞</button>
                        <span id="bug-status" class="text-xs text-[#00f3ff] font-bold hidden bg-[#00f3ff]/10 px-3 py-1 rounded-lg">POSLANO! ✓</span>
                    </div>
                </div>

                <button id="next-after-exp-btn" class="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4.5 rounded-2xl hover:scale-[1.02] shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition border-b-4 border-black/20 active:scale-95 text-lg uppercase tracking-widest mt-2 p-4">NASTAVI DALJE</button>
            </div>
        </section>

        <!-- RESULT SCREEN -->
        <section id="result-screen" class="hidden absolute inset-0 z-[80] bg-[#060e1d] flex-col items-center justify-center p-6 text-center">
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#fe9d00]/20 via-[#060e1d] to-[#060e1d] pointer-events-none opacity-50"></div>
            
            <div class="relative z-10 w-full">
                <!-- Trophy Animation Container -->
                <div class="text-[100px] mb-4 drop-shadow-[0_0_50px_rgba(255,215,0,0.5)] leading-none animate-pulse">🏆</div>
                <h1 class="text-4xl font-black text-white mb-2 tracking-tighter uppercase">MISIJA GOTOVA!</h1>
                <p class="text-white/60 mb-8 font-bold text-sm tracking-widest uppercase">SharkLearn izvještaj</p>
                
                <div class="glass-card rounded-[2rem] p-6 mb-8 border-t-2 border-[#fe9d00]/50 shadow-[0_20px_50px_rgba(254,157,0,0.1)] inline-block min-w-[280px]">
                    <p class="text-xs text-white/50 uppercase tracking-widest font-bold mb-2">Tvoj Rezultat</p>
                    <p id="final-stats" class="text-3xl font-black text-[#fe9d00] tracking-tight">Osvojio si 0 ⭐️</p>
                </div>
                
                <div class="flex flex-col gap-4 max-w-[280px] mx-auto">
                    <button onclick="location.reload()" class="w-full bg-[#fe9d00] text-[#060e1d] font-black py-4 rounded-2xl hover:scale-[1.02] shadow-[0_10px_30px_rgba(254,157,0,0.4)] transition text-lg uppercase tracking-widest active:scale-95">IGRAJ PONOVNO 🔄</button>
                    <button id="stats-btn" class="w-full bg-white/10 border border-white/20 text-white py-4 rounded-2xl font-bold hover:bg-white/20 transition text-sm uppercase tracking-widest active:scale-95">📊 OTVORI STATISTIKU</button>
                </div>
            </div>
        </section>

        <!-- STATS OVERLAY -->
        <section id="stats-overlay" class="hidden force-hidden fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div class="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2rem] p-6 border-t-[3px] border-[#00f3ff]/50 shadow-[0_0_50px_rgba(0,243,255,0.15)] relative">
                
                <!-- Header -->
                <div class="flex justify-between items-center mb-8 sticky -top-6 bg-[#0b172d]/95 backdrop-blur-xl p-4 -mx-6 rounded-t-[2rem] border-b border-white/5 z-20">
                    <div class="flex items-center gap-3">
                        <div class="bg-[#00f3ff]/20 p-2 rounded-xl text-[#00f3ff]">📊</div>
                        <h2 class="text-xl font-black text-white tracking-widest uppercase shadow-sm">STATISTIKA</h2>
                    </div>
                    <button onclick="document.getElementById('stats-overlay').style.display='none'" class="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full p-2 h-10 w-10 flex items-center justify-center font-black transition active:scale-90 border border-white/10 text-sm">X</button>
                </div>

                <!-- Charts -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-[#060e1d] p-4 rounded-2xl border border-white/5 shadow-inner">
                        <h3 class="text-xs font-black text-white/50 uppercase tracking-widest text-center mb-4">Aktivnost Misija</h3>
                        <div class="aspect-video relative w-full h-full flex justify-center items-center"><canvas id="activityChart" class="max-w-full"></canvas></div>
                    </div>
                    <div class="bg-[#060e1d] p-4 rounded-2xl border border-white/5 shadow-inner">
                        <h3 class="text-xs font-black text-white/50 uppercase tracking-widest text-center mb-4">Uspješnost (Ocjene)</h3>
                        <div class="aspect-video relative w-full h-full flex justify-center items-center"><canvas id="gradesChart" class="max-w-full"></canvas></div>
                    </div>
                </div>

                <!-- Summary Text -->
                <div id="stats-summary-text" class="text-center text-sm font-bold text-white/80 bg-gradient-to-br from-white/10 to-transparent p-6 rounded-[1.5rem] leading-loose whitespace-pre-line border border-white/10 shadow-inner">
                    <!-- Textual summary injected by JS -->
                </div>
            </div>
        </section>

        <!-- EXAM SEMESTER MODAL -->
        <section id="exam-semester-modal" class="hidden force-hidden fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div class="glass-card w-full max-w-sm rounded-[2rem] p-8 text-center border-t-4 border-[#FFD700] shadow-[0_0_70px_rgba(255,215,0,0.2)] bg-[#0f0f19]">
                
                <div class="text-[80px] mb-4 leading-none inline-block drop-shadow-[0_10px_20px_rgba(255,215,0,0.3)] relative">
                    🏆
                    <span class="absolute top-0 right-0 w-4 h-4 bg-white rounded-full animate-ping opacity-50"></span>
                </div>
                
                <h2 class="text-3xl font-black text-[#FFD700] mb-2 tracking-tighter">ISPITNI MOD</h2>
                <p class="text-white/60 text-xs font-bold uppercase tracking-widest mb-8">Odaberi gradivo za testiranje</p>

                <div class="flex flex-col gap-3">
                    <button class="exam-sem-btn bg-white/5 border border-white/10 text-white font-black py-4.5 p-4 rounded-[1.5rem] hover:bg-white/10 transition flex items-center justify-between px-6 active:scale-95" data-exam-sem="1">
                        <span>1. POLUGODIŠTE</span> <span class="text-white/30 text-xl">→</span>
                    </button>
                    <button class="exam-sem-btn bg-white/5 border border-white/10 text-white font-black py-4.5 p-4 rounded-[1.5rem] hover:bg-white/10 transition flex items-center justify-between px-6 active:scale-95" data-exam-sem="2">
                        <span>2. POLUGODIŠTE</span> <span class="text-white/30 text-xl">→</span>
                    </button>
                    <button class="exam-sem-btn bg-gradient-to-r from-[#FF9D00] to-[#FF5E00] text-white font-black py-5 p-4 rounded-[1.5rem] hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,94,0,0.4)] mt-4 transition border border-[#FFD700]/50 uppercase tracking-widest active:scale-95 text-sm" data-exam-sem="all">
                        CIJELA GODINA (MIX)
                    </button>
                </div>

                <div class="mt-8 pt-4 border-t border-white/10">
                    <button id="close-exam-modal" class="text-white/40 text-[10px] uppercase tracking-widest font-black hover:text-white transition decoration-white/20 underline-offset-4 active:scale-95 p-2">ODUSTANI OD ISPITA</button>
                </div>
            </div>
        </section>

        <!-- BOTTOM NAVIGATION -->
        <!-- Hidden on registration/result pages by JS or CSS z-index, but we'll manage z-index so it doesn't overlap modals -->
        <nav id="bottom-nav" class="fixed bottom-0 left-0 w-full px-4 pb-6 pt-8 bg-gradient-to-t from-[#060e1d] via-[#060e1d]/90 to-transparent z-[30] pointer-events-none">
            <div class="pointer-events-auto bg-[#0b172d]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] py-2 px-3 flex justify-between items-center shadow-2xl max-w-sm mx-auto">
                
                <!-- Back / Level Down Button (Big Center-Left) -->
                <button id="nav-back-btn" class="flex flex-col items-center justify-center bg-gradient-to-br from-[#fe9d00] to-[#ff7a00] text-[#060e1d] rounded-[1.5rem] w-16 h-16 -mt-8 shadow-[0_10px_20px_rgba(254,157,0,0.4)] hover:scale-105 active:scale-95 transition-all shrink-0 border-4 border-[#060e1d]">
                    <span class="text-2xl drop-shadow-sm font-bold">←</span>
                </button>
                
                <!-- Other Actions -->
                <div class="flex gap-1">
                    <button onclick="document.getElementById('stats-btn')?.click()" class="flex flex-col items-center justify-center text-white/50 hover:text-white transition-all bg-transparent rounded-2xl px-5 py-2 hover:bg-white/5 active:scale-95">
                        <span class="text-xl mb-1 saturate-50">📊</span>
                        <span class="text-[9px] font-black uppercase tracking-widest">Stats</span>
                    </button>
                    <!-- Pseudo Leaderboard / Ranks (Disabled for now as not in original) -->
                    <button class="flex flex-col items-center justify-center text-white/30 bg-transparent rounded-2xl px-5 py-2 cursor-not-allowed">
                        <span class="text-xl mb-1 grayscale opacity-50">🎖️</span>
                        <span class="text-[9px] font-black uppercase tracking-widest">Ranks</span>
                    </button>
                </div>
            </div>
        </nav>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Inline patch for elements missing their JS listeners if any, though quiz_engine does most.
        // E.g. hooking up the local start-btn if JS fails to rebind.
        document.addEventListener('DOMContentLoaded', () => {
            const startBtn = document.getElementById('start-btn');
            // If quiz_engine isn't ready for this button in DOM changes, we ensure clicks are passed correctly.
            // QuizEngine handles this in init() mostly.
        });
    </script>
    ${scriptsHtml}
</body>
</html>`;

fs.writeFileSync('C:\\Users\\Karlo\\.gemini\\antigravity\\scratch\\sharklearn\\index.html', finalHtml);
console.log('Successfully generated complete modern index.html');
