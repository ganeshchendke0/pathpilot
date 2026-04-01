# Career Quiz - Detailed Code Changes

## File 1: `frontend/js/career.js`

### Change 1: `renderQuestion()` Function - COMPLETE REWRITE

#### BEFORE (Broken ❌)
```javascript
function renderQuestion() {
  const body = document.getElementById("quiz-body");
  if (currentQ >= quizQuestions.length) { submitQuiz(); return; }
  const q    = quizQuestions[currentQ];
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const pct  = Math.round(((currentQ) / quizQuestions.length) * 100);

  body.innerHTML = `
    <div class="quiz-progress">
      <div class="flex justify-between text-small text-muted" style="margin-bottom:8px">
        <span>Question ${currentQ + 1} of ${quizQuestions.length}</span>
        <span>${pct}% done</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="quiz-question">${esc(q.question)}</div>
    <div class="quiz-options">
      ${opts.map((opt, i) => `
        <button class="quiz-option-btn" onclick="selectAnswer(${JSON.stringify(opt.tags)}, this)">
          <span class="qopt-letter">${String.fromCharCode(65 + i)}</span>
          <span>${esc(opt.text)}</span>
        </button>`).join("")}
    </div>`;
}

function selectAnswer(tags, btn) {
  document.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  setTimeout(() => {
    quizAnswers.push(tags);
    currentQ++;
    renderQuestion();
  }, 400);
}
```

**Problems:**
1. ❌ `JSON.stringify(opt.tags)` in onclick breaks HTML escaping
2. ❌ Tags might be strings or objects (inconsistent)
3. ❌ Auto-advances after 400ms with no visible button
4. ❌ No validation that answer was selected
5. ❌ `selectAnswer` function uses onclick (brittle)

#### AFTER (Fixed ✅)
```javascript
function renderQuestion() {
  const body = document.getElementById("quiz-body");
  if (currentQ >= quizQuestions.length) { submitQuiz(); return; }
  const q    = quizQuestions[currentQ];
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const pct  = Math.round(((currentQ) / quizQuestions.length) * 100);
  let selectedTags = null;

  body.innerHTML = `
    <div class="quiz-progress">
      <div class="flex justify-between text-small text-muted" style="margin-bottom:8px">
        <span>Question ${currentQ + 1} of ${quizQuestions.length}</span>
        <span>${pct}% done</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="quiz-question">${esc(q.question)}</div>
    <div class="quiz-options">
      ${opts.map((opt, i) => `
        <button class="quiz-option-btn" data-option-index="${i}" data-tags="${JSON.stringify(typeof opt.tags === 'string' ? JSON.parse(opt.tags) : opt.tags).replace(/"/g, '&quot;')}">
          <span class="qopt-letter">${String.fromCharCode(65 + i)}</span>
          <span>${esc(opt.text)}</span>
        </button>`).join("")}
    </div>
    <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">
      ${currentQ > 0 ? `<button class="btn btn-ghost btn-md" onclick="goToPreviousQuestion()">← Back</button>` : ""}
      <button class="btn btn-primary btn-md" id="next-btn" onclick="goToNextQuestion()" disabled>Next →</button>
    </div>`;

  // Attach event listeners to options
  document.querySelectorAll(".quiz-option-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
      this.classList.add("selected");
      document.getElementById("next-btn").disabled = false;
      selectedTags = JSON.parse(this.dataset.tags);
    });
  });
}
```

**Improvements:**
1. ✅ Use `data-tags` attribute (safe HTML)
2. ✅ Parse JSON string/object consistently
3. ✅ Visible "Next →" button (initially disabled)
4. ✅ Event listeners instead of onclick
5. ✅ "← Back" button for previous questions
6. ✅ Next button only enabled after selection

---

### Change 2: Add Two New Functions

#### `goToNextQuestion()` - NEW ✅
```javascript
function goToNextQuestion() {
  if (!document.querySelector(".quiz-option-btn.selected")) {
    showToast("Please select an answer", "warning");
    return;
  }
  const selectedBtn = document.querySelector(".quiz-option-btn.selected");
  const tags = JSON.parse(selectedBtn.dataset.tags);
  quizAnswers.push(tags);
  currentQ++;
  renderQuestion();
}
```

**Purpose:**
- Validate answer selected before proceeding
- Get tags from selected button's data-attribute
- Add to quiz answers array
- Increment question counter
- Re-render quiz

#### `goToPreviousQuestion()` - NEW ✅
```javascript
function goToPreviousQuestion() {
  if (currentQ > 0) {
    quizAnswers.pop();
    currentQ--;
    renderQuestion();
  }
}
```

**Purpose:**
- Go back one question
- Remove last answer from array
- Decrement question counter
- Re-render quiz

---

### Change 3: `submitQuiz()` Function - ENHANCED ERROR HANDLING

#### BEFORE (Minimal) ❌
```javascript
async function submitQuiz() {
  const body = document.getElementById("quiz-body");
  body.innerHTML = `<p class="text-muted text-center" style="padding:30px">✨ Analysing your answers…</p>`;
  try {
    const { matches } = await AI.quizSubmit(quizAnswers);
    renderQuizResults(matches);
  } catch (err) {
    body.innerHTML = `<p style="color:var(--rose)">${err.message}</p>`;
  }
}
```

**Problems:**
1. ❌ No validation that answers exist
2. ❌ Sends nested arrays possibly
3. ❌ No check for empty responses
4. ❌ No logging for debugging

#### AFTER (With Validation) ✅
```javascript
async function submitQuiz() {
  const body = document.getElementById("quiz-body");
  body.innerHTML = `<p class="text-muted text-center" style="padding:30px">✨ Analysing your answers…</p>`;
  try {
    // Flatten and filter the answers - convert arrays of tags to a single combined list
    const flattenedAnswers = quizAnswers.flat().filter(Boolean);
    if (!flattenedAnswers.length) {
      throw new Error("No valid answers to submit");
    }
    const { matches } = await AI.quizSubmit(flattenedAnswers);
    if (!matches || !matches.length) {
      body.innerHTML = `<p class="text-muted text-center">No career matches found. Please try again.</p>`;
      return;
    }
    renderQuizResults(matches);
  } catch (err) {
    console.error("Quiz submission error:", err);
    body.innerHTML = `<p style="color:var(--rose)">Error: ${err.message}</p>`;
  }
}
```

**Improvements:**
1. ✅ Flatten nested answer arrays
2. ✅ Filter out false/null values
3. ✅ Validate non-empty before submission
4. ✅ Check for empty matches response
5. ✅ Console logging for debugging
6. ✅ Better error messages

---

### Change 4: `startQuiz()` Function - ADDED VALIDATION

#### BEFORE (Minimal) ❌
```javascript
async function startQuiz() {
  if (!Auth.isLoggedIn()) { showToast("Sign in to take the quiz", "warning"); return; }
  openModal("quiz-modal");
  const body = document.getElementById("quiz-body");
  body.innerHTML = `<p class="text-muted">Loading quiz…</p>`;
  try {
    const { questions } = await AI.quizQuestions();
    quizQuestions = questions;
    quizAnswers   = [];
    currentQ      = 0;
    renderQuestion();
  } catch (err) {
    body.innerHTML = `<p style="color:var(--rose)">${err.message}</p>`;
  }
}
```

#### AFTER (With Validation) ✅
```javascript
async function startQuiz() {
  if (!Auth.isLoggedIn()) { 
    showToast("Sign in to take the quiz", "warning"); 
    return; 
  }
  openModal("quiz-modal");
  const body = document.getElementById("quiz-body");
  body.innerHTML = `<p class="text-muted">Loading quiz…</p>`;
  try {
    const { questions } = await AI.quizQuestions();
    if (!questions || !questions.length) {
      throw new Error("No quiz questions available");
    }
    quizQuestions = questions;
    quizAnswers   = [];
    currentQ      = 0;
    renderQuestion();
  } catch (err) {
    console.error("Quiz load error:", err);
    body.innerHTML = `<p style="color:var(--rose)">⚠️ ${err.message}</p>`;
  }
}
```

**Improvements:**
1. ✅ Check if questions array is empty
2. ✅ Check if questions exist at all
3. ✅ Better error message with emoji
4. ✅ Console logging for debugging

---

## File 2: `frontend/css/main.css`

### Change 1: Add `.btn-md` Size

#### LOCATION: Around line 194 (with other button sizes)

#### BEFORE ❌
```css
.btn-sm   { padding: 7px 18px; font-size: 0.82rem; border-radius: var(--r-sm); }
.btn-lg   { padding: 15px 40px; font-size: 1rem; border-radius: var(--r-lg); }
```

#### AFTER ✅
```css
.btn-sm   { padding: 7px 18px; font-size: 0.82rem; border-radius: var(--r-sm); }
.btn-md   { padding: 9px 20px; font-size: 0.88rem; border-radius: var(--r-md); }
.btn-lg   { padding: 15px 40px; font-size: 1rem; border-radius: var(--r-lg); }
```

**Why:** Medium button size for quiz navigation buttons

---

### Change 2: Add Button Disabled State

#### LOCATION: Around line 163 (with other button styles)

#### BEFORE ❌
```css
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: white;
  opacity: 0;
  transition: opacity 0.2s;
}
.btn:hover::after { opacity: 0.06; }
.btn:active { transform: scale(0.98); }
```

#### AFTER ✅
```css
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: white;
  opacity: 0;
  transition: opacity 0.2s;
}
.btn:hover::after { opacity: 0.06; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

**Why:** Show disabled state for Next button before answer selected

---

## Summary of Changes

### JavaScript (`career.js`)
| Function | Change | Lines |
|----------|--------|-------|
| `renderQuestion()` | REWRITE | ~35 |
| `goToNextQuestion()` | NEW | ~10 |
| `goToPreviousQuestion()` | NEW | ~6 |
| `selectAnswer()` | REMOVED | - |
| `submitQuiz()` | ENHANCED | +8 |
| `startQuiz()` | ENHANCED | +2 |

### CSS (`main.css`)
| Change | Lines |
|--------|-------|
| `.btn-md` (NEW) | 1 |
| `.btn:disabled` (NEW) | 1 |

### Total Changes
- **4 functions enhanced/rewritten**
- **2 new functions added**
- **2 CSS rules added**
- **~62 lines added/modified**
- **~10 lines removed**

---

## Testing the Changes

### Manual Test
```javascript
// In browser console, run:
startQuiz()  // Opens quiz modal
// Select answer → Next button should enable
// Click Next → shows next question
// On question 2+, Back button appears
// Answer all 6 → shows career matches
```

### Network Test
```
1. Open DevTools (F12) → Network tab
2. Click "Take the Quiz →"
3. Watch for: GET /ai/quiz-questions
4. Answer all 6 questions
5. Watch for: POST /ai/quiz-submit
6. Check response: should have "matches" array
```

### Console Test
```javascript
// Each action should log:
console.log(quizQuestions)  // Array of 6 questions
console.log(quizAnswers)    // Growing array of tag arrays
console.log(currentQ)        // 0 → 1 → 2 → ... → 6
```

---

**All changes are backward compatible and don't affect other features! ✅**
