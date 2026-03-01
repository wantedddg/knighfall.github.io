const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const images = {};

for (let key in spritesConfig) {
  images[key] = new Image();
  images[key].src = spritesConfig[key].src;
}

const worldWidth = 40000;

let cameraX = 0;
let cameraLookOffset = 0;
let cameraTargetOffset = 0;

let currentAnim = "idle";
let animConfig = spritesConfig[currentAnim];

let currentFrame = 0;
let frameCounter = 0;

let charX = 300;

const tileSize = 500;
const groundY = canvas.height - tileSize * 0;

let charBaseY = groundY - animConfig.frameHeight * animConfig.scale + -20;
let charY = charBaseY;

const tileBaseSize = 64;
const tileScale = 1.5;

const defaultSpeed = 1.5;
let speed = defaultSpeed;

let keys = { a: false, d: false };

let facingRight = true;

let isJumping = false;
let jumpVel = 0;
const jumpForce = 12;
const gravity = 0.5;

let isAttacking = false;
let isHurt = false;

let score = 0;
let playerHealth = 100;

const backImg = new Image();
backImg.src = "assets/rendering/back.png";

const middleImg = new Image();
middleImg.src = "assets/rendering/middle.png";

const tilesImg = new Image();
tilesImg.src = "assets/rendering/tiles.png";

let orcSpeed = 1;
let orcFollowRange = 250;
let orcAttackRange = 80;

let orcIsAttacking = false;
let orcIsHurt = false;

const orcStunDuration = 400;
let orcIsDead = false;

let orc = {
  x: 900,
  y: charBaseY,
  currentAnim: "orc_idle",
  animConfig: spritesConfig["orc_idle"],
  currentFrame: 0,
  frameCounter: 0,
  facingRight: true,
  health: 100,
};

let showDebug = true;
let debugFps = 0;
let debugFrameCount = 0;
let debugLastFpsTime = performance.now();

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "a" || key === "arrowleft") keys.a = true;
  if (key === "d" || key === "arrowright") keys.d = true;
  if (key === "shift") keys.shift = true;

  if ((key === " " || key === "arrowup" || key === "w") && !isJumping) {
    jumpVel = -jumpForce;
    isJumping = true;
  }

  if (key === "f3") {
    showDebug = !showDebug;
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();

  if (key === "a" || key === "arrowleft") keys.a = false;
  if (key === "d" || key === "arrowright") keys.d = false;
  if (key === "shift") keys.shift = false;
});

canvas.addEventListener("click", () => {
  if (!isAttacking && !isJumping) {
    isAttacking = true;
    switchAnim("attack");

    setTimeout(() => {
      const playerCenterX =
        charX + (animConfig.frameWidth * animConfig.scale) / 2;
      const orcCenterX =
        orc.x + (orc.animConfig.frameWidth * orc.animConfig.scale) / 2;
      const distance = Math.abs(playerCenterX - orcCenterX);

      if (distance < 100 && orc.health > 0) {
        orc.health -= 10;

        if (orc.health < 0) orc.health = 0;

        if (orc.health > 0) {
          orcIsHurt = true;
          orcIsAttacking = false;

          orc.currentAnim = "orc_hurt";
          orc.animConfig = spritesConfig["orc_hurt"];
          orc.currentFrame = 0;
          orc.frameCounter = 0;

          setTimeout(() => {
            orcIsHurt = false;
          }, orcStunDuration);
        } else {
          orcIsHurt = false;
          orcIsAttacking = false;
          orcIsDead = true;

          orc.currentAnim = "orc_death";
          orc.animConfig = spritesConfig["orc_death"];
          orc.currentFrame = 0;
          orc.frameCounter = 0;

          score += 100;
        }
      }
    }, 230);
  }
});

function switchAnim(name) {
  if (currentAnim === name) return;

  currentAnim = name;
  animConfig = spritesConfig[name];
  currentFrame = 0;
  frameCounter = 0;
}

function drawOrc() {
  const img = images[orc.currentAnim];

  ctx.save();

  const centerX =
    orc.x - cameraX + (orc.animConfig.frameWidth * orc.animConfig.scale) / 2;
  const centerY =
    orc.y + (orc.animConfig.frameHeight * orc.animConfig.scale) / 2;

  ctx.translate(centerX, centerY);
  if (!orc.facingRight) ctx.scale(-1, 1);

  ctx.drawImage(
    img,
    orc.currentFrame * orc.animConfig.frameWidth,
    0,
    orc.animConfig.frameWidth,
    orc.animConfig.frameHeight,
    -(orc.animConfig.frameWidth * orc.animConfig.scale) / 2,
    -(orc.animConfig.frameHeight * orc.animConfig.scale) / 2,
    orc.animConfig.frameWidth * orc.animConfig.scale,
    orc.animConfig.frameHeight * orc.animConfig.scale,
  );

  ctx.restore();

  orc.frameCounter++;

  if (orc.frameCounter >= orc.animConfig.frameSpeed) {
    orc.frameCounter = 0;
    orc.currentFrame++;

    if (orcIsDead && orc.currentFrame >= orc.animConfig.totalFrames) {
      orc.currentFrame = orc.animConfig.totalFrames - 1;
      orcIsAttacking = false;
      orcIsHurt = false;
      return;
    } else if (!orcIsDead && orc.currentFrame >= orc.animConfig.totalFrames) {
      orc.currentFrame = 0;
    }
  }

  if (!orcIsDead) {
    const barWidth = 80;
    const barHeight = 18;

    const barX =
      orc.x -
      cameraX +
      (orc.animConfig.frameWidth * orc.animConfig.scale) / 2 -
      barWidth / 2 +
      5;
    const barY = orc.y - -170;

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    const healthWidth = (orc.health / 100) * barWidth;

    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, healthWidth, barHeight);

    ctx.fillStyle = "white";
    ctx.font = "10px 'Pixelify Sans'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(orc.health, barX + barWidth / 2, barY + barHeight / 2);
  }
}

function gameLoop() {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  debugFrameCount++;
  const now = performance.now();
  if (now - debugLastFpsTime >= 1000) {
    debugFps = debugFrameCount;
    debugFrameCount = 0;
    debugLastFpsTime = now;
  }

  const bScale = 3;
  const backWidth = backImg.width * bScale,
    backHeight = backImg.height * bScale;
  const backY = canvas.height - backHeight - 60;
  for (let x = 0; x < worldWidth; x += backWidth) {
    ctx.drawImage(backImg, x - cameraX * 0.2, backY, backWidth, backHeight);
  }

  const mScale = 3;
  const middleWidth = middleImg.width * mScale,
    middleHeight = middleImg.height * mScale;
  const middleY2 = canvas.height - middleHeight - 60;
  for (let x = 0; x < worldWidth; x += middleWidth) {
    ctx.drawImage(
      middleImg,
      x - cameraX * 0.5,
      middleY2,
      middleWidth,
      middleHeight,
    );
  }

  const ts = tileBaseSize * tileScale + 50;
  const groundTileY = canvas.height - ts * 1.6;
  for (let x = 0; x < worldWidth; x += ts) {
    ctx.drawImage(
      tilesImg,
      16,
      16,
      tileBaseSize,
      tileBaseSize,
      x - cameraX,
      groundTileY,
      ts,
      ts,
    );
  }

  ctx.fillStyle = "white";
  ctx.font = "20px 'Pixelify Sans'";
  ctx.fillText("SCORE: " + score, 20, 40);
  ctx.fillText("HP: " + playerHealth, 20, 70);

  let moving = false;

  if (keys.a) {
    charX -= speed;
    moving = true;
    facingRight = false;
  }

  if (keys.d) {
    charX += speed;
    moving = true;
    facingRight = true;
  }

  if (keys.shift) {
    speed = defaultSpeed + 1.1;
  } else {
    speed = defaultSpeed;
  }

  if (charX < 0) charX = 0;

  let playerWidth = animConfig.frameWidth * animConfig.scale;
  if (charX > worldWidth - playerWidth) charX = worldWidth - playerWidth;

  if (isJumping) {
    charY += jumpVel;
    jumpVel += gravity;
    if (charY >= charBaseY) {
      charY = charBaseY;
      isJumping = false;
      jumpVel = 0;
    }
  }

  if (keys.d) cameraTargetOffset = 120;
  else if (keys.a) cameraTargetOffset = -120;
  else cameraTargetOffset = 0;

  cameraLookOffset += (cameraTargetOffset - cameraLookOffset) * 0.05;

  const deadZoneWidth = canvas.width * 0.3;
  let targetCameraX = charX + cameraLookOffset - canvas.width / 2;
  let playerScreenX = charX - cameraX;

  if (playerScreenX > canvas.width / 2 + deadZoneWidth / 2) {
    targetCameraX = charX - (canvas.width / 2 + deadZoneWidth / 2);
  } else if (playerScreenX < canvas.width / 2 - deadZoneWidth / 2) {
    targetCameraX = charX - (canvas.width / 2 - deadZoneWidth / 2);
  }

  cameraX += (targetCameraX - cameraX) * 0.08;
  cameraX = Math.max(0, Math.min(cameraX, worldWidth - canvas.width));

  const playerCenterX = charX + (animConfig.frameWidth * animConfig.scale) / 2;
  const orcCenterX =
    orc.x + (orc.animConfig.frameWidth * orc.animConfig.scale) / 2;
  const distance = playerCenterX - orcCenterX;
  const absDistance = Math.abs(distance);

  if (orc.health > 0) {
    if (!orcIsAttacking && !orcIsHurt) {
      if (absDistance < orcFollowRange) {
        orc.facingRight = distance > 0;

        if (absDistance > orcAttackRange) {
          orc.currentAnim = "orc_walk";
          orc.animConfig = spritesConfig["orc_walk"];
          orc.x += distance > 0 ? orcSpeed : -orcSpeed;
        } else {
          orcIsAttacking = true;
          orc.currentAnim = "orc_attack";
          orc.animConfig = spritesConfig["orc_attack"];
          orc.currentFrame = 0;
          orc.frameCounter = 0;

          setTimeout(() => {
            if (orcIsHurt || orc.health <= 0) return;

            const playerCenterXNow =
              charX + (animConfig.frameWidth * animConfig.scale) / 2;
            const orcCenterXNow =
              orc.x + (orc.animConfig.frameWidth * orc.animConfig.scale) / 2;
            const impactDistance = Math.abs(playerCenterXNow - orcCenterXNow);

            if (impactDistance <= orcAttackRange) {
              if (!isHurt) {
                isHurt = true;
                playerHealth -= 10;

                if (playerHealth < 0) playerHealth = 0;

                switchAnim("hurt");
                setTimeout(() => {
                  isHurt = false;
                }, 400);
              }
            }
          }, 300);

          setTimeout(() => {
            orcIsAttacking = false;
          }, 1000);
        }
      } else {
        orc.currentAnim = "orc_idle";
        orc.animConfig = spritesConfig["orc_idle"];
      }
    }
  }

  drawOrc();

  let nextAnim = "idle";
  if (isHurt) nextAnim = "hurt";
  else if (isAttacking) nextAnim = "attack";
  else if (isJumping && spritesConfig.jump) nextAnim = "jump";
  else if (moving) nextAnim = "walk";

  switchAnim(nextAnim);

  if (isAttacking && currentFrame >= animConfig.totalFrames - 1) {
    isAttacking = false;
  }

  const img = images[currentAnim];
  ctx.save();

  const centerX =
    charX - cameraX + (animConfig.frameWidth * animConfig.scale) / 2;
  const centerY = charY + (animConfig.frameHeight * animConfig.scale) / 2;

  ctx.translate(centerX, centerY);
  if (!facingRight) ctx.scale(-1, 1);

  ctx.drawImage(
    img,
    currentFrame * animConfig.frameWidth,
    0,
    animConfig.frameWidth,
    animConfig.frameHeight,
    -(animConfig.frameWidth * animConfig.scale) / 2,
    -(animConfig.frameHeight * animConfig.scale) / 2,
    animConfig.frameWidth * animConfig.scale,
    animConfig.frameHeight * animConfig.scale,
  );

  ctx.restore();

  let actualFrameSpeed = animConfig.frameSpeed;
  if (currentAnim === "walk" && keys.shift) {
    actualFrameSpeed = Math.max(1, animConfig.frameSpeed / 2);
  }

  frameCounter++;

  if (frameCounter >= actualFrameSpeed) {
    frameCounter = 0;
    currentFrame++;
    if (currentFrame >= animConfig.totalFrames) currentFrame = 0;
  }

  if (showDebug) drawDebug();

  requestAnimationFrame(gameLoop);
}

function drawDebug() {
  const lines = [
    "FPS: " + debugFps,
    "Pos: (" + Math.round(charX) + ", " + Math.round(charY) + ")",
    "State: " + currentAnim,
    "HP: " + playerHealth,
    "Score: " + score,
    "[F3 to hide]",
  ];

  const pad = 10,
    lH = 18,
    pW = 200,
    pH = lines.length * lH + pad * 2;
  const pX = canvas.width - pW - 10,
    pY = 10;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(pX, pY, pW, pH);

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pX, pY, pW, pH);

  ctx.fillStyle = "#00ff88";
  ctx.font = "13px 'Pixelify Sans'";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], pX + pad, pY + pad + i * lH);
  }

  ctx.textBaseline = "alphabetic";
}

const bgMusic = new Audio("assets/sounds/Brighter_Music.m4a");
bgMusic.loop = false;
bgMusic.volume = 0.1;

const MUSIC_MIN_DELAY = 30;
const MUSIC_MAX_DELAY = 120;
let musicUnlocked = false;

function playAmbientMusic() {
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});
}

function scheduleNextPlay() {
  const delaySec =
    MUSIC_MIN_DELAY + Math.random() * (MUSIC_MAX_DELAY - MUSIC_MIN_DELAY);
  setTimeout(playAmbientMusic, delaySec * 1000);
}

bgMusic.addEventListener("ended", scheduleNextPlay);

function unlockMusic() {
  if (musicUnlocked) return;
  musicUnlocked = true;
  setTimeout(playAmbientMusic, 20000);
}

const imagesToLoad = [
  backImg,
  middleImg,
  tilesImg,
  ...Object.keys(spritesConfig).map((key) => images[key]),
];

let loadedCount = 0;
let isGameLoading = true;

const btnSinglePlayer = document.getElementById("btnSinglePlayer");
const mainMenu = document.getElementById("mainMenu");

if (btnSinglePlayer) {
  btnSinglePlayer.innerText = "Loading assets...";
  btnSinglePlayer.disabled = true;
}

imagesToLoad.forEach((img) => {
  img.onload = () => {
    loadedCount++;
    if (loadedCount === imagesToLoad.length) {
      isGameLoading = false;

      if (btnSinglePlayer) {
        btnSinglePlayer.innerText = "Single Player";
        btnSinglePlayer.disabled = false;
      }
    }
  };

  img.onerror = () => {
    console.error("Failed to load image:", img.src);
  };
});

const loadingScreen = document.getElementById("loadingScreen");

if (btnSinglePlayer) {
  btnSinglePlayer.addEventListener("click", () => {
    if (!isGameLoading) {
      mainMenu.classList.add("hidden-animated");

      loadingScreen.style.display = "flex";
      loadingScreen.offsetHeight;
      loadingScreen.classList.add("visible");

      setTimeout(() => {
        mainMenu.style.display = "none";
        canvas.style.display = "block";
        resizeCanvas();

        loadingScreen.classList.add("slide-up");

        setTimeout(() => {
          loadingScreen.style.display = "none";
          loadingScreen.classList.remove("visible", "slide-up");
          document.body.style.backgroundColor = "#222200";
          unlockMusic();
          gameLoop();
        }, 1000);
      }, 2000);
    }
  });
}
