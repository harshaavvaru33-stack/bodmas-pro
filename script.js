// GLOBAL STATE
let currentUser = "";
let selectedLevel = null;
let score = 0, correctAnswer;
let timer = null, timeLeft = 30;
let qCount = 0, maxQ = 10;
let answered = false;
let streak = 0;
let hintUsed = false;

// DOM
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

// LOAD
window.onload = () => {
    show("auth");

    let saved = localStorage.getItem("sessionUser");
    if (saved) {
        currentUser = saved;
        userName.innerText = currentUser;
        show("home");
    }
};

// SCREEN SWITCH
function show(id) {
    document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// AUTH UI
function showRegister() {
    document.getElementById("authTitle").innerText = "Register";
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
}
function showLogin() {
    document.getElementById("authTitle").innerText = "Login";
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
}

// REGISTER
function register(e) {
    e?.preventDefault();

    let name = document.getElementById("rName").value.trim();
    let email = document.getElementById("rEmail").value.trim();
    let pass = document.getElementById("rPass").value;
    let cpass = document.getElementById("rCpass").value; // 🔥 FIX

    if (!name || !email || !pass || !cpass) {
        alert("Fill all fields");
        return;
    }

    if (pass !== cpass) {
        alert("Passwords do not match");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[email]) {
        alert("User already exists");
        return;
    }

    users[email] = { name, pass };
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registered successfully!");

    // 🔥 CLEAR FIELDS
    document.getElementById("rName").value = "";
    document.getElementById("rEmail").value = "";
    document.getElementById("rPass").value = "";
    document.getElementById("rCpass").value = "";

    showLogin();
}


// LOGIN
function login(e) {
    e?.preventDefault();

    let email = document.getElementById("lEmail").value.trim();
    let pass = document.getElementById("lPass").value;

    if (!email || !pass) {
        alert("Enter email and password");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[email] && users[email].pass === pass) {
        currentUser = users[email].name;

        document.getElementById("userName").innerText = currentUser;

        localStorage.setItem("sessionUser", currentUser);

        // 🔥 CLEAR FIELDS
        document.getElementById("lEmail").value = "";
        document.getElementById("lPass").value = "";

        show("home");
    } else {
        alert("Invalid login");
    }
}
// LOGOUT
function logout() {
    localStorage.removeItem("sessionUser");
    show("auth");
}

// LEVEL SELECT
function setLevel(btn, level) {
    selectedLevel = level;
    document.querySelectorAll(".levels button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

// START GAME
function startGame() {
    if (!selectedLevel) return alert("Select level");

    score = 0;
    qCount = 0;
    streak = 0;

    if (selectedLevel === "easy") maxQ = 10;
    else if (selectedLevel === "medium") maxQ = 12;
    else if (selectedLevel === "hard") maxQ = 15;
    else maxQ = Infinity;

    document.getElementById("endBtn").style.display =
        selectedLevel === "endless" ? "inline-block" : "none";

    scoreEl.innerText = 0;
    streakEl.innerText = 0;
    prog.style.width = "0%";

    show("game");
    nextQ();
}

// RANDOM
function rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// GENERATE QUESTION
function genQ() {
    answered = false;
    hintUsed = false;
    nextBtn.classList.add("hidden");

    let a = rand(1, 10), b = rand(1, 10), c = rand(1, 10);

    let ops = selectedLevel === "easy" ? ["+", "-"] :
              selectedLevel === "medium" ? ["+", "-", "*"] :
              ["+", "-", "*"];

    let exp = `${a} ${ops[rand(0, ops.length - 1)]} ${b} ${ops[rand(0, ops.length - 1)]} ${c}`;
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

// EXPLANATION
function explain() {
    return `BODMAS rule → multiply first, then add/subtract\nAnswer = ${correctAnswer}`;
}

// CHECK ANSWER
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

        steps.innerText = explain();
        nextBtn.classList.remove("hidden");
    }

    scoreEl.innerText = score;
    streakEl.innerText = streak;
}

// NEXT QUESTION
function nextQ() {
    if (selectedLevel !== "endless" && qCount >= maxQ) return endGame();

    qCount++;

    if (selectedLevel !== "endless") {
        prog.style.width = (qCount / maxQ * 100) + "%";
    } else {
        prog.style.width = "100%";
    }

    genQ();
    startTimer();
}

// TIMER
function startTimer() {
    clearInterval(timer);

    timeLeft = selectedLevel === "easy" ? 30 :
               selectedLevel === "medium" ? 25 :
               selectedLevel === "hard" ? 20 : 15;

    time.innerText = timeLeft;
    time.style.color = "white";

    timer = setInterval(() => {
        timeLeft--;
        time.innerText = timeLeft;

        if (timeLeft <= 5) time.style.color = "red";

        if (timeLeft <= 0) {
            clearInterval(timer);
            answered = true;

            steps.innerText = "⏰ Time up!\nAnswer = " + correctAnswer;

            document.querySelectorAll("#options button").forEach(b => {
                b.disabled = true;
                if (+b.innerText === correctAnswer) b.style.background = "green";
            });

            nextBtn.classList.remove("hidden");
        }
    }, 1000);
}

// HINT
function useHint() {
    if (hintUsed) return;
    hintUsed = true;

    let removed = 0;

    document.querySelectorAll("#options button").forEach(b => {
        if (+b.innerText !== correctAnswer && removed < 2) {
            b.style.opacity = "0.3";
            b.disabled = true;
            removed++;
        }
    });
}

// END GAME
function endGame() {
    clearInterval(timer);
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
}

// NAV
function goHome() {
    clearInterval(timer);
    show("home");
}
