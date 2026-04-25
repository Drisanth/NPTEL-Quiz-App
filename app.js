// State Management
const state = {
    questions: typeof questionBank !== 'undefined' ? questionBank : [],
    currentQuiz: [],
    currentIndex: 0,
    userAnswers: [], // { question, selected, isCorrect }
    mode: 'practice', // 'practice' or 'test'
    selection: 'week-1',
    options: {
        shuffle: false,
        showScore: true,
        darkMode: true
    }
};

const appDiv = document.getElementById('app');

function init() {
    // Set initial theme
    if (!state.options.darkMode) {
        document.body.classList.remove('dark-mode');
    }
    renderMenu();
}

function renderMenu() {
    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1 class="text-center">HCI Practice Quiz</h1>
            <p class="text-center">Select your practice or test mode.</p>
            
            <div class="flex gap-4 mb-4 mt-4">
                <button class="btn flex-1 ${state.mode === 'practice' ? 'btn-primary' : ''}" onclick="setMode('practice')">Practice Mode</button>
                <button class="btn flex-1 ${state.mode === 'test' ? 'btn-primary' : ''}" onclick="setMode('test')">Test Mode</button>
            </div>

            <h3>Select questions</h3>
            <div class="mb-4">
                <select class="dropdown" onchange="state.selection = this.value">
                    ${Array.from({length: 12}, (_, i) => `
                        <option value="week-${i+1}" ${state.selection === 'week-' + (i+1) ? 'selected' : ''}>Week ${i+1}</option>
                    `).join('')}
                    <option value="weeks-1-6" ${state.selection === 'weeks-1-6' ? 'selected' : ''}>Weeks 1-6</option>
                    <option value="weeks-7-12" ${state.selection === 'weeks-7-12' ? 'selected' : ''}>Weeks 7-12</option>
                    <option value="all" ${state.selection === 'all' ? 'selected' : ''}>All 120 Questions</option>
                </select>
            </div>

            <h3>Options</h3>
            <div class="flex-col gap-2 mb-4">
                <div class="toggle-group">
                    <span>Shuffle Questions & Options</span>
                    <label class="switch">
                        <input type="checkbox" id="opt-shuffle" ${state.options.shuffle ? 'checked' : ''} onchange="toggleOption('shuffle', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-group">
                    <span>Show Score</span>
                    <label class="switch">
                        <input type="checkbox" id="opt-score" ${state.options.showScore ? 'checked' : ''} onchange="toggleOption('showScore', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-group">
                    <span>Dark Mode</span>
                    <label class="switch">
                        <input type="checkbox" id="opt-dark" ${state.options.darkMode ? 'checked' : ''} onchange="toggleOption('darkMode', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="mt-4">
                <button class="btn btn-primary btn-block" style="font-size: 1.15rem; padding: 15px;" onclick="startQuiz(state.selection)">Start Quiz</button>
            </div>
        </div>
    `;
}

window.setMode = function(mode) {
    state.mode = mode;
    renderMenu();
}

window.toggleOption = function(opt, val) {
    state.options[opt] = val;
    if (opt === 'darkMode') {
        if (val) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

window.startQuiz = function(selection, customQuestions = null) {
    let selectedQ = [];

    if (customQuestions) {
        selectedQ = customQuestions;
    } else {
        if (selection.startsWith('week-')) {
            const week = parseInt(selection.replace('week-', ''));
            selectedQ = state.questions.filter(q => q.week === week);
        } else if (selection === 'weeks-1-6') {
            selectedQ = state.questions.filter(q => q.week >= 1 && q.week <= 6);
        } else if (selection === 'weeks-7-12') {
            selectedQ = state.questions.filter(q => q.week >= 7 && q.week <= 12);
        } else if (selection === 'all') {
            selectedQ = [...state.questions];
        }
    }

    if (state.options.shuffle) {
        selectedQ = shuffleArray(selectedQ);
        // Shuffle options as well
        selectedQ = selectedQ.map(q => ({
            ...q,
            options: shuffleArray(q.options)
        }));
    }

    state.currentQuiz = selectedQ;
    state.currentIndex = 0;
    state.userAnswers = new Array(selectedQ.length).fill(null);
    
    renderQuiz();
}

function renderQuiz() {
    const q = state.currentQuiz[state.currentIndex];
    const progress = ((state.currentIndex) / state.currentQuiz.length) * 100;
    
    // Check if answered
    const currentAnswer = state.userAnswers[state.currentIndex];
    const isAnswered = currentAnswer !== null;

    let scoreHtml = '';
    if (state.options.showScore) {
        const currentScore = state.userAnswers.filter(a => a && a.isCorrect).length;
        scoreHtml = `<span>Score: ${currentScore}</span>`;
    }

    let nextBtnText = state.currentIndex === state.currentQuiz.length - 1 ? 'Finish Quiz' : 'Next Question';
    let nextBtnDisabled = (state.mode === 'practice' && !isAnswered) ? 'disabled' : '';

    appDiv.innerHTML = `
        <div class="glass-panel" key="${state.currentIndex}">
            <div class="quiz-header">
                <span>Question ${state.currentIndex + 1} of ${state.currentQuiz.length}</span>
                ${scoreHtml}
                <span style="text-transform: capitalize; color: var(--primary);">${state.mode} Mode</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>

            <div class="question-text">${q.question}</div>

            <div class="options-container flex-col gap-2 mb-4">
                ${q.options.map((opt, i) => {
                    let btnClass = 'option';
                    
                    if (state.mode === 'practice' && isAnswered) {
                        btnClass += ' disabled';
                        if (opt === q.answer) btnClass += ' correct';
                        else if (currentAnswer && currentAnswer.selected === opt && !currentAnswer.isCorrect) btnClass += ' wrong';
                    } else if (state.mode === 'test') {
                        if (currentAnswer && currentAnswer.selected === opt) btnClass += ' selected';
                    }

                    return `<div class="${btnClass}" onclick="selectOption(${i})">${opt}</div>`;
                }).join('')}
            </div>

            <div class="flex justify-between mt-4">
                <div></div> <!-- Placeholder for layout -->
                <button class="btn btn-primary" ${nextBtnDisabled} onclick="nextQuestion()">${nextBtnText}</button>
            </div>
            ${(state.mode === 'practice' && state.options.showScore && isAnswered) ? 
                `<div class="text-center mt-4" style="animation: fadeIn 0.3s ease;">
                    ${currentAnswer.isCorrect ? '<span class="text-success text-center">Correct!</span>' : '<span class="text-danger text-center">Incorrect.</span>'}
                </div>` : ''}
        </div>
    `;
}

window.selectOption = function(optionIndex) {
    const q = state.currentQuiz[state.currentIndex];
    const currentAnswer = state.userAnswers[state.currentIndex];
    
    if (state.mode === 'practice' && currentAnswer !== null) return; // Prevent changing answer in practice mode

    const option = q.options[optionIndex];
    const isCorrect = option === q.answer;
    
    state.userAnswers[state.currentIndex] = {
        question: q,
        selected: option,
        isCorrect: isCorrect
    };

    renderQuiz(); // Re-render to show selection / feedback
}

window.nextQuestion = function() {
    if (state.mode === 'practice' && state.userAnswers[state.currentIndex] === null) return;

    if (state.currentIndex < state.currentQuiz.length - 1) {
        state.currentIndex++;
        renderQuiz();
    } else {
        renderResults();
    }
}

function renderResults() {
    const correctCount = state.userAnswers.filter(a => a && a.isCorrect).length;
    const total = state.currentQuiz.length;
    
    let wrongAnswers = state.userAnswers.filter(a => !a || !a.isCorrect).map(a => a ? a.question : null).filter(Boolean);

    // If test mode and answers are missing, find them
    if (wrongAnswers.length === 0 && correctCount < total) {
       state.userAnswers.forEach((ans, idx) => {
           if (!ans) wrongAnswers.push(state.currentQuiz[idx]);
       });
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h2 class="text-center">Quiz Completed!</h2>
            ${state.options.showScore ? `
                <div class="text-center mb-4" style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">
                    ${correctCount} <span style="font-size: 1.5rem; color: var(--text-secondary)">/ ${total}</span>
                </div>
                <p class="text-center" style="font-size: 1.1rem; font-weight: 500;">Score: ${Math.round((correctCount/total)*100)}%</p>
            ` : ''}
            
            <div class="flex gap-4 mb-4 mt-4 justify-center">
                ${wrongAnswers.length > 0 ? `<button class="btn btn-primary" onclick="retryWrong()">Retry Wrong Answers</button>` : ''}
                <button class="btn" onclick="renderMenu()">Back to Menu</button>
            </div>

            <h3 class="mt-4">Review Your Answers</h3>
            <div class="review-list flex-col gap-2">
                ${state.currentQuiz.map((q, i) => {
                    const ans = state.userAnswers[i];
                    const isCorrect = ans && ans.isCorrect;
                    
                    return `
                        <div class="review-item ${isCorrect ? 'correct' : 'wrong'}">
                            <div class="review-question">${i+1}. ${q.question}</div>
                            <div class="review-answer">
                                <span style="color: var(--text-secondary)">Your Answer:</span> 
                                <span class="${isCorrect ? 'text-success' : 'text-danger'}">
                                    ${ans ? ans.selected : 'Not Answered'}
                                </span>
                            </div>
                            ${!isCorrect ? `
                                <div class="review-answer mt-2">
                                    <span style="color: var(--text-secondary)">Correct Answer:</span>
                                    <span class="text-success">${q.answer}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="flex justify-center mt-4">
               <button class="btn btn-block" onclick="renderMenu()">Back to Menu</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.retryWrong = function() {
    let wrongQuestions = [];
    state.userAnswers.forEach((ans, idx) => {
        if (!ans || !ans.isCorrect) wrongQuestions.push(state.currentQuiz[idx]);
    });
    
    if (wrongQuestions.length > 0) {
        startQuiz('retry', wrongQuestions);
    }
}

// Start Application
init();
