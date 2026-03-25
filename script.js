let currentUser = "";
let selectedLevel = null;
let score = 0, correctAnswer;
let timer = null, timeLeft = 30;
let qCount = 0, maxQ = 15;
let answered = false;
let streak = 0;
let lastQuestion = "";
let hintUsed = false;

/* DOM */
const scoreEl = document.getElementById("score");
const question = document.getElementById("question");
const options = document.getElementById("options");
const steps = document.getElementById("steps");
const prog = document.getElementById("prog");
const time = document.getElementById("time");
const nextBtn = document.getElementById("nextBtn");
const final = document.getElementById("final");
const leaderboard = document.getElementById("leaderboard");
const userName = document.getElementById("userName");
const streakEl = document.getElementById("streak");

/* LOAD */
window.onload = () => {
    show("auth");

    let saved = localStorage.getItem("sessionUser");
    if (saved) {
        currentUser = saved;
        userName.innerText = currentUser;
        show("home");
    }
};

/* SCREEN */
function show(id) {
    document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

/* AUTH */
function showRegister() {
    authTitle.innerText = "Register";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
}
function showLogin() {
    authTitle.innerText = "Login";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
}

/* REGISTER */
function register() {
    let name = rName.value.trim();
    let email = rEmail.value.trim();
    let pass = rPass.value;
    let cpass = rCpass.value;

    if (!name || !email || !pass) return alert("Fill all fields");
    if (pass !== cpass) return alert("Passwords mismatch");

    let users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[email]) return alert("User exists");

    users[email] = { name, pass };
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registered!");
    showLogin();
}

/* LOGIN */
function login() {
    let email = lEmail.value.trim();
    let pass = lPass.value;

    let users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[email] && users[email].pass === pass) {
        currentUser = users[email].name;
        userName.innerText = currentUser;
        localStorage.setItem("sessionUser", currentUser);
        show("home");
    } else alert("Invalid login");
}

/* LOGOUT */
function logout() {
    localStorage.removeItem("sessionUser");
    show("auth");
}

/* LEVEL */
function setLevel(btn, l) {
    selectedLevel = l;
    document.querySelectorAll(".levels button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

/* START */
function startGame() {
    if (!selectedLevel) return alert("Select level");

    score = 0;
    qCount = 0;
    streak = 0;

    // 🔥 questions
    if (selectedLevel === "easy") maxQ = 5;
    else if (selectedLevel === "medium") maxQ = 8;
    else if (selectedLevel === "hard") maxQ = 10;
    else maxQ = Infinity; // ♾️ endless
    document.getElementById("endBtn").style.display =
        selectedLevel === "endless" ? "block" : "none";

    scoreEl.innerText = 0;
    streakEl.innerText = 0;
    prog.style.width = "0%";

    show("game");
    nextQ();
}

/* RANDOM */
function rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

/* QUESTION */
function genQ() {
    answered = false;
    hintUsed = false;
    nextBtn.classList.add("hidden");

    let a = rand(1, 10), b = rand(1, 10), c = rand(1, 10);

    let ops = selectedLevel === "easy" ? ["+", "-"] :
        selectedLevel === "medium" ? ["+", "-", "*"] :
            ["+", "-", "*"];

    let op1 = ops[rand(0, ops.length - 1)];
    let op2 = ops[rand(0, ops.length - 1)];

    let exp = `${a} ${op1} ${b} ${op2} ${c}`;
    question.innerText = exp;

    correctAnswer = Math.round(eval(exp));

    let set = new Set([correctAnswer]);
    while (set.size < 4) {
        let w = correctAnswer + rand(-5, 5);
        set.add(w);
    }

    options.innerHTML = "";
    [...set].sort(() => Math.random() - 0.5).forEach(v => {
        let btn = document.createElement("button");
        btn.innerText = v;
        btn.onclick = () => check(v, btn);
        options.appendChild(btn);
    });

    steps.innerText = "";
}

/* EXPLANATION (🔥 NEW) */
function explain(exp) {
    return `Step: Solve multiplication first → then addition/subtraction (BODMAS)\nAnswer = ${correctAnswer}`;
}

/* CHECK */
function check(val, btn) {
    if (answered) return;
    answered = true;

    clearInterval(timer);

    document.querySelectorAll("#options button").forEach(b => {
        b.disabled = true;
        if (+b.innerText === correctAnswer) b.style.background = "green";
    });

    if (val === correctAnswer) {
        score++;
        streak++;
        correctSound?.play();
        setTimeout(nextQ, 800);
    } else {
        streak = 0;
        btn.style.background = "red";
        wrongSound?.play();

        steps.innerText = explain(question.innerText);
        nextBtn.classList.remove("hidden");
    }

    scoreEl.innerText = score;
    streakEl.innerText = streak;
}

/* NEXT */
function nextQ() {

    if (selectedLevel !== "endless" && qCount >= maxQ) {
        return endGame();
    }

    qCount++;

    if (selectedLevel !== "endless") {
        prog.style.width = (qCount / maxQ * 100) + "%";
    } else {
        prog.style.width = "100%"; // full always
    }

    genQ();
    startTimer();
}

/* TIMER FIX 🔥 */
function startTimer() {
    clearInterval(timer);

    // 🔥 level based time
    if (selectedLevel === "easy") timeLeft = 30;
    else if (selectedLevel === "medium") timeLeft = 25;
    else if (selectedLevel === "hard") timeLeft = 20;
    else timeLeft = 15; // endless

    time.innerText = timeLeft;
    time.style.color = "white";

    timer = setInterval(() => {
        timeLeft--;
        time.innerText = timeLeft;

        if (timeLeft <= 5) time.style.color = "red";

        if (timeLeft <= 0) {
            clearInterval(timer);

            answered = true;

            steps.innerText = "⏰ Time up!\nCorrect Answer = " + correctAnswer;

            document.querySelectorAll("#options button").forEach(b => {
                b.disabled = true;
                if (+b.innerText === correctAnswer) b.style.background = "green";
            });

            nextBtn.classList.remove("hidden");
        }
    }, 1000);
}

/* HINT IMPROVED 🔥 */
function useHint() {
    if (hintUsed) return;
    hintUsed = true;

    let btns = [...document.querySelectorAll("#options button")];
    let removed = 0;

    btns.forEach(b => {
        if (+b.innerText !== correctAnswer && removed < 2) {
            b.style.opacity = "0.2";
            b.disabled = true;
            removed++;
        }
    });
}

/* END */
function endGame() {

    clearInterval(timer); // 🔥 important fix

    show("result");

    let scores = JSON.parse(localStorage.getItem("scores") || "[]");
    scores.push({ name: currentUser, score });

    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);

    localStorage.setItem("scores", JSON.stringify(scores));

    final.innerText = `Score: ${score} 🔥`;

    leaderboard.innerHTML = scores.map((s, i) =>
        `<div>${i + 1}. ${s.name} - ${s.score}</div>`
    ).join("");
    if (selectedLevel === "endless") {
        document.getElementById("endBtn").style.display = "inline-block";
    } else {
        document.getElementById("endBtn").style.display = "none";
    }
}

/* NAV */
function goHome() {
    clearInterval(timer); // 🔥 important
    show("home");
}