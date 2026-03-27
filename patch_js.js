const fs = require('fs');
let js = fs.readFileSync('quiz_engine.js', 'utf8');

// Replace quizWrapper to flex
js = js.replace(/this\.elements\.quizWrapper\.style\.display = 'block'/g, "this.elements.quizWrapper.style.display = 'flex'");

// Replace resultScreen to flex
js = js.replace(/this\.elements\.resultScreen\.style\.display = 'block'/g, "this.elements.resultScreen.style.display = 'flex'");

// Replace explanationModal to flex (just in case they were block)
js = js.replace(/this\.elements\.explanationModal\.style\.display = 'block'/g, "this.elements.explanationModal.style.display = 'flex'");

// Replace statsOverlay to flex
js = js.replace(/this\.elements\.statsOverlay\.style\.display = 'block'/g, "this.elements.statsOverlay.style.display = 'flex'");

// Replace examSemModal to flex
js = js.replace(/this\.elements\.examSemModal\.style\.display = 'block'/g, "this.elements.examSemModal.style.display = 'flex'");

// Replace registrationModal back to block (in case it was flex accidentally by old logic)
js = js.replace(/this\.elements\.registrationModal\.style\.display = 'flex'/g, "this.elements.registrationModal.style.display = 'block'");

// Write back
fs.writeFileSync('quiz_engine.js', js);
console.log('Fixed js displays');
