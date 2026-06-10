"use strict";

// --- انتخاب المان‌های مورد نیاز ---
const score0El = document.getElementById("score-billy");
const score1El = document.getElementById("score-ben");
const currentScoreEl = document.querySelector(".sec-dice .desc strong");
const rolledNumEl = document.querySelector(".sec-dice .desc h3 span");
const diceEl = document.getElementById("dice");
const btnRoll = document.getElementById("roll");
const btnHold = document.getElementById("hold");
const btnNew = document.getElementById("new");

const desc0El = document.querySelector(
  ".player-box:nth-child(1) .desc .description",
);
const desc1El = document.querySelector(
  ".player-box:nth-child(2) .desc .description",
);
const player0Box = document.querySelectorAll(".player-box")[0];
const player1Box = document.querySelectorAll(".player-box")[1];

const customAlertEl = document.getElementById("custom-alert");
const btnCloseAlert = document.getElementById("close-alert");

// --- متغیرهای انیمیشن کاغذ رنگی ---
const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
let pieces = [];
let numberOfPieces = 300; // افزایش تعداد برای انفجار پرپشت‌تر
let lastUpdateTime = Date.now();
let animationFrameId;
let confettiTimer;

btnCloseAlert.addEventListener("click", function () {
  customAlertEl.classList.add("hidden");
});

let scores, currentScore, activePlayer, playing;

// --- توابع انیمیشن کاغذ رنگی ---
function randomColor() {
  let colors = [
    "#f00",
    "#0f0",
    "#00f",
    "#0ff",
    "#f0f",
    "#ff0",
    "#ff6347",
    "#32cd32",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function Piece() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // تعیین تصادفی مبدا: گوشه پایین-چپ یا پایین-راست
  const isLeft = Math.random() < 0.5;

  this.x = isLeft ? -10 : canvas.width + 10;
  this.y = canvas.height + 10;
  this.size = (Math.random() * 0.5 + 0.75) * 12;

  if (width > 990) {
    this.gravity = 0.003; // جاذبه

    // سرعت پرتاب به سمت بالا (منفی یعنی حرکت به بالا) - افزایش سرعت
    this.speedY = -(Math.random() * 0.5 + 0.7) * 2;
  } else {
    this.gravity = 0.004; // جاذبه

    // سرعت پرتاب به سمت بالا (منفی یعنی حرکت به بالا) - افزایش سرعت
    this.speedY = -(Math.random() * 0.5 + 0.7) * 1.5;
  }

  // سرعت افقی (از چپ به راست یا برعکس)
  const baseSpeedX = (Math.random() * 0.5 + 0.5) * 2;
  this.speedX = isLeft ? baseSpeedX : -baseSpeedX;

  this.rotation = Math.PI * 2 * Math.random();
  this.rotationSpeed = Math.PI * 2 * (Math.random() - 0.5) * 0.003;
  this.color = randomColor();
}

function updateConfetti() {
  let now = Date.now(),
    dt = now - lastUpdateTime;

  for (let i = pieces.length - 1; i >= 0; i--) {
    let p = pieces[i];

    p.speedY += p.gravity * dt; // اعمال جاذبه
    p.x += p.speedX * dt;
    p.y += p.speedY * dt;
    p.rotation += p.rotationSpeed * dt;

    // حذف کاغذهایی که پس از پرتاب، از پایین صفحه خارج می‌شوند
    if (p.y > canvas.height + p.size && p.speedY > 0) {
      pieces.splice(i, 1);
    }
  }

  lastUpdateTime = now;

  // توقف کامل انیمیشن زمانی که تمام کاغذها خارج شدند
  if (pieces.length > 0) {
    confettiTimer = setTimeout(updateConfetti, 10);
  } else {
    stopConfetti();
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width * 2, canvas.height * 2);
  pieces.forEach(function (p) {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
    ctx.rotate(p.rotation);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });

  if (pieces.length > 0) {
    animationFrameId = requestAnimationFrame(drawConfetti);
  }
}

function startConfetti() {
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  pieces = [];

  // تولید تمام کاغذها در همان لحظه اول برای ایجاد افکت انفجار
  for (let i = 0; i < numberOfPieces; i++) {
    pieces.push(new Piece());
  }

  lastUpdateTime = Date.now();
  updateConfetti();
  drawConfetti();
}

function stopConfetti() {
  canvas.style.display = "none";
  clearTimeout(confettiTimer);
  cancelAnimationFrame(animationFrameId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces = [];
}

// --- تابع به‌روزرسانی متن وضعیت ---
const updateDescriptions = () => {
  if (activePlayer === 0) {
    desc0El.textContent = "🔵 Blue";
    desc0El.style.color = "#0075ce";
    desc0El.style.borderColor = "#0075ce";
    desc1El.textContent = "Not Playing";
    desc1El.style.color = "#999";
    desc1El.style.borderColor = "#999";
  } else {
    desc1El.textContent = "🟠 Orange";
    desc1El.style.color = "orange";
    desc1El.style.borderColor = "orange";
    desc0El.textContent = "Not Playing";
    desc0El.style.color = "#999";
    desc0El.style.borderColor = "#999";
  }
};

// --- تابع شروع و ریست بازی ---
const init = () => {
  // توقف انیمیشن در صورت شروع بازی جدید
  stopConfetti();

  scores = [0, 0];
  currentScore = 0;
  playing = true;

  activePlayer = Math.floor(Math.random() * 2);

  // بازیکن غیرفعال بازی را با امتیاز 5 شروع می‌کند
  const inactivePlayer = activePlayer === 0 ? 1 : 0;
  scores[inactivePlayer] = 5;

  score0El.textContent = scores[0];
  score1El.textContent = scores[1];
  currentScoreEl.textContent = 0;
  rolledNumEl.textContent = "-";

  diceEl.style.opacity = 0;
  updateDescriptions();

  player0Box.style.backgroundColor = "#f3f5f7";
  player1Box.style.backgroundColor = "#f3f5f7";
};

init();

// --- تابع تغییر نوبت ---
const switchPlayer = () => {
  currentScore = 0;
  currentScoreEl.textContent = 0;
  activePlayer = activePlayer === 0 ? 1 : 0;
  updateDescriptions();
};

// --- رویداد پرتاب تاس ---
btnRoll.addEventListener("click", function () {
  if (playing) {
    const dice = Math.floor(Math.random() * 6) + 1;
    rolledNumEl.textContent = dice;

    diceEl.style.opacity = 1;
    diceEl.innerHTML = "";
    diceEl.className = `dice face-${dice}`;
    for (let i = 0; i < dice; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      diceEl.appendChild(dot);
    }
    diceEl.style.transform = `rotate(${Math.floor(Math.random() * 360) + 360}deg)`;

    if (dice !== 1) {
      currentScore += dice;
      currentScoreEl.textContent = currentScore;
    } else {
      switchPlayer();
    }
  }
});

// --- رویداد ذخیره امتیاز (با قانون دقیقاً 70 امتیاز) ---
btnHold.addEventListener("click", function () {
  if (playing) {
    const potentialScore = scores[activePlayer] + currentScore;

    if (potentialScore === 70) {
      // حالت اول: امتیاز دقیقاً 70 می‌شود و بازیکن برنده است
      scores[activePlayer] = potentialScore;
      document.getElementById(
        `score-${activePlayer === 0 ? "billy" : "ben"}`,
      ).textContent = scores[activePlayer];

      playing = false;
      diceEl.style.opacity = 0;
      currentScoreEl.textContent = "Win The Game🏆";
      rolledNumEl.textContent = "-";

      document.querySelectorAll(".player-box")[
        activePlayer
      ].style.backgroundColor = "#d4edda";

      // شروع انیمیشن سفارشی کاغذ رنگی
      startConfetti();
    } else if (potentialScore > 70) {
      // حالت دوم: امتیاز از 70 عبور می‌کند
      customAlertEl.classList.remove("hidden");
      switchPlayer();
    } else {
      // حالت سوم: امتیاز کمتر از 70 است
      scores[activePlayer] = potentialScore;
      document.getElementById(
        `score-${activePlayer === 0 ? "billy" : "ben"}`,
      ).textContent = scores[activePlayer];
      switchPlayer();
    }
  }
});

// --- رویداد دکمه بازی جدید ---
btnNew.addEventListener("click", init);
