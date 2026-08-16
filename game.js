const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const messageBox = document.querySelector("#message");
const praiseLayer = document.querySelector("#praiseLayer");
const rulesDialog = document.querySelector("#rulesDialog");
const arsenalDialog = document.querySelector("#arsenalDialog");
const arsenalBody = document.querySelector("#arsenalBody");
const musicButton = document.querySelector("#musicButton");

const ui = {
  level: document.querySelector("#levelValue"),
  squad: document.querySelector("#squadValue"),
  score: document.querySelector("#scoreValue"),
  stars: document.querySelector("#starValue"),
  speed: document.querySelector("#speedValue"),
  gunName: document.querySelector("#gunName"),
  ammoName: document.querySelector("#ammoName"),
  homeLevel: document.querySelector("#homeLevel"),
  homeScore: document.querySelector("#homeScore"),
  homeStars: document.querySelector("#homeStars"),
  startButtonText: document.querySelector("#startButtonText")
};

const MAX_LEVEL = 10;
const MEMBER_HP = 1111;

const guns = [
  { name: "練習手槍", power: 1, damage: 25, fire: 300 },
  { name: "輕型機關槍", power: 2, damage: 45, fire: 235 },
  { name: "重型機關槍", power: 3, damage: 70, fire: 185 },
  { name: "狙擊步槍", power: 4, damage: 110, fire: 150 },
  { name: "電漿步槍", power: 5, damage: 160, fire: 125 },
  { name: "彩虹加農砲", power: 6, damage: 230, fire: 105 }
];

const ammos = [
  { name: "普通子彈", power: 1, multiplier: 1, color: "#dcecff", size: 3.5 },
  { name: "穿甲子彈", power: 2, multiplier: 1.35, color: "#63e8ff", size: 4 },
  { name: "燃燒子彈", power: 3, multiplier: 1.7, color: "#ffa94d", size: 4.5 },
  { name: "爆裂子彈", power: 4, multiplier: 2.1, color: "#b785ff", size: 5 },
  { name: "雷射子彈", power: 5, multiplier: 2.6, color: "#ff6fd1", size: 5.5 }
];

const STORAGE_KEY = "藍紅小隊進度";
const keys = { left: false, right: false, back: false };

let progress = loadProgress();
let view = { width: 900, height: 620, dpr: 1 };
let lastFrame = 0;
let animationId = 0;
let game = null;

function loadProgress() {
  const fallback = { level: 1, score: 0, stars: 0, gunsOwned: 1, ammosOwned: 1, gunIndex: 0, ammoIndex: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return fallback;
    return {
      level: clamp(Number(saved.level) || 1, 1, MAX_LEVEL),
      score: Math.max(0, Number(saved.score) || 0),
      stars: Math.max(0, Number(saved.stars) || 0),
      gunsOwned: clamp(Number(saved.gunsOwned) || 1, 1, guns.length),
      ammosOwned: clamp(Number(saved.ammosOwned) || 1, 1, ammos.length),
      gunIndex: clamp(Number(saved.gunIndex) || 0, 0, guns.length - 1),
      ammoIndex: clamp(Number(saved.ammoIndex) || 0, 0, ammos.length - 1)
    };
  } catch (error) {
    return fallback;
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function currentGun() {
  return guns[Math.min(progress.gunIndex, progress.gunsOwned - 1)];
}

function currentAmmo() {
  return ammos[Math.min(progress.ammoIndex, progress.ammosOwned - 1)];
}

function bulletDamage() {
  return currentGun().damage * currentAmmo().multiplier;
}

function makeGame() {
  return {
    level: progress.level,
    score: progress.score,
    stars: progress.stars,
    squad: [{ hp: MEMBER_HP, maxHp: MEMBER_HP }],
    player: { x: view.width / 2, y: view.height - 60, radius: 18 },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    pickups: [],
    dispensers: [
      { type: "member", zone: "left", timer: 3.5, interval: 11 },
      { type: "heal", zone: "right", timer: 6, interval: 10 },
      { type: "firerate", zone: "middle", timer: 2.5, interval: 7.5 }
    ],
    speedLevel: 0,
    lastShot: 0,
    spawnTimer: 0,
    spawned: 0,
    enemyTotal: 0,
    running: true,
    paused: false,
    over: false,
    betweenLevels: false
  };
}

function arena() {
  const thickness = clamp(view.width * 0.035, 14, 30);
  const left = view.width * 0.17;
  const right = view.width * 0.83;
  return { left, right, thickness, innerLeft: left + thickness / 2, innerRight: right - thickness / 2 };
}

function startGame() {
  startScreen.hidden = true;
  gameScreen.hidden = false;
  resizeCanvas();
  game = makeGame();
  beginLevel();
  startMusic();
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function beginLevel() {
  const allBig = game.level >= MAX_LEVEL;
  game.enemyTotal = allBig ? 8 : Math.min(8 + game.level * 2, 26);
  game.spawned = 0;
  game.spawnTimer = 400;
  game.enemies.length = 0;
  game.bullets.length = 0;
  game.enemyBullets.length = 0;
  game.pickups.length = 0;
  game.particles.length = 0;
  game.dispensers.forEach((dispenser, index) => {
    dispenser.timer = 2.5 + index * 1.5;
  });
  game.running = true;
  game.paused = false;
  game.over = false;
  game.betweenLevels = false;
  const bounds = arena();
  game.player.x = view.width / 2;
  game.player.y = view.height - 60;
  game.player.x = clamp(game.player.x, bounds.innerLeft + 24, bounds.innerRight - 24);
  pauseButton.textContent = "Ⅱ";
  clearPraise();
  hideMessage();
  updateHud();
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const oldWidth = view.width;
  const oldHeight = view.height;
  view = {
    width: Math.max(320, rect.width),
    height: Math.max(320, rect.height),
    dpr
  };
  canvas.width = Math.round(view.width * dpr);
  canvas.height = Math.round(view.height * dpr);
  canvas.style.width = `${view.width}px`;
  canvas.style.height = `${view.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (game && oldWidth && oldHeight) {
    const sx = view.width / oldWidth;
    const sy = view.height / oldHeight;
    game.player.x *= sx;
    game.player.y = Math.min(view.height - 45, game.player.y * sy);
    [...game.enemies, ...game.bullets, ...game.enemyBullets, ...game.pickups].forEach((item) => {
      item.x *= sx;
      item.y *= sy;
    });
  }
}

function loop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.034);
  lastFrame = now;

  if (game && game.running && !game.paused && !game.betweenLevels) {
    update(dt, now);
  }
  draw();
  animationId = requestAnimationFrame(loop);
}

function update(dt, now) {
  updatePlayer(dt);
  updateDispensers(dt);
  spawnEnemies(dt);
  shoot(now);
  updateBullets(dt);
  updateEnemies(dt);
  updateEnemyBullets(dt);
  updatePickups(dt);
  updateParticles(dt);

  if (game.spawned >= game.enemyTotal && game.enemies.length === 0 && !game.over) {
    completeLevel();
  }
}

function updatePlayer(dt) {
  const bounds = arena();
  const speed = Math.max(230, view.width * 0.38);
  if (keys.left) game.player.x -= speed * dt;
  if (keys.right) game.player.x += speed * dt;
  if (keys.back) game.player.y += speed * 0.58 * dt;
  if (!keys.back) {
    const homeY = view.height - 60;
    game.player.y += (homeY - game.player.y) * Math.min(1, dt * 5);
  }
  game.player.x = clamp(game.player.x, bounds.innerLeft + 24, bounds.innerRight - 24);
  game.player.y = clamp(game.player.y, view.height * 0.68, view.height - 35);
}

function updateDispensers(dt) {
  const bounds = arena();
  game.dispensers.forEach((dispenser) => {
    dispenser.timer -= dt;
    if (dispenser.timer > 0) return;
    dispenser.timer = dispenser.interval;

    const spot = dispenserSpot(dispenser, bounds);
    const speed = 225;
    let vx = 0;
    if (dispenser.zone === "left") vx = speed * 0.45;
    if (dispenser.zone === "right") vx = -speed * 0.45;
    game.pickups.push({
      x: spot.x,
      y: spot.y,
      vx,
      vy: speed,
      radius: 13,
      phase: random(0, 6),
      type: dispenser.type
    });
  });
}

function dispenserSpot(dispenser, bounds) {
  if (dispenser.zone === "left") return { x: bounds.left / 2, y: view.height * 0.3 };
  if (dispenser.zone === "right") return { x: (bounds.right + view.width) / 2, y: view.height * 0.3 };
  return { x: view.width / 2, y: view.height * 0.11 };
}

function enemyLevelScale() {
  return game.level;
}

function spawnEnemies(dt) {
  if (game.spawned >= game.enemyTotal) return;
  game.spawnTimer -= dt * 1000;
  if (game.spawnTimer > 0) return;

  const bounds = arena();
  const allBig = game.level >= MAX_LEVEL;
  const big = allBig || game.spawned === 0 || game.spawned % 4 === 0;
  const radius = big ? 34 : 16;
  const scale = enemyLevelScale();
  const hp = (big ? 100 : 1) * scale;
  const shield = (big ? 500 : 0) * scale;
  game.enemies.push({
    x: random(bounds.innerLeft + 40, bounds.innerRight - 40),
    y: -radius - random(0, 50),
    radius,
    big,
    hp,
    maxHp: hp,
    shield,
    shieldMax: shield,
    speed: big ? 30 : 42,
    shootTimer: random(900, 1800),
    phase: random(0, Math.PI * 2)
  });
  game.spawned += 1;
  game.spawnTimer = allBig ? 1500 : Math.max(420, 950 - game.level * 20);
}

function shoot(now) {
  const gun = currentGun();
  const ammo = currentAmmo();
  const multiplier = 1 + game.speedLevel * 0.15;
  if (now - game.lastShot < gun.fire / multiplier) return;
  game.lastShot = now;

  const columns = Math.min(game.squad.length, 5);
  for (let i = 0; i < columns; i += 1) {
    const offset = (i - (columns - 1) / 2) * 9;
    game.bullets.push({
      x: game.player.x + offset,
      y: game.player.y - 26,
      radius: ammo.size,
      speed: 540,
      damage: bulletDamage(),
      color: ammo.color
    });
  }
}

function updateBullets(dt) {
  const bounds = arena();
  for (let i = game.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = game.bullets[i];
    bullet.y -= bullet.speed * dt;

    if (bullet.x <= bounds.innerLeft || bullet.x >= bounds.innerRight) {
      burst(bullet.x, bullet.y, "#c9d8e4", 3);
      game.bullets.splice(i, 1);
      continue;
    }

    let hit = false;
    for (let e = game.enemies.length - 1; e >= 0; e -= 1) {
      const enemy = game.enemies[e];
      if (distance(bullet, enemy) < bullet.radius + enemy.radius) {
        hitEnemy(e, enemy, bullet);
        burst(bullet.x, bullet.y, bullet.color, 4);
        game.bullets.splice(i, 1);
        hit = true;
        break;
      }
    }
    if (!hit && bullet.y < -20) game.bullets.splice(i, 1);
  }
}

function hitEnemy(index, enemy, bullet) {
  if (enemy.shield > 0) {
    enemy.shield -= bullet.damage;
    if (enemy.shield <= 0) {
      enemy.shield = 0;
      burst(enemy.x, enemy.y, "#9fd8ff", 18);
      floatingNotice("盾牌破了！", "#9fd8ff");
    }
    return;
  }
  enemy.hp -= bullet.damage;
  if (enemy.hp <= 0) defeatEnemy(index, enemy);
}

function updateEnemies(dt) {
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    enemy.phase += dt * 2.2;
    enemy.y += enemy.speed * dt;
    enemy.x += Math.sin(enemy.phase) * 8 * dt;

    const canShoot = !enemy.big || enemy.shield <= 0;
    if (canShoot) {
      enemy.shootTimer -= dt * 1000;
      if (enemy.shootTimer <= 0 && enemy.y > 20 && enemy.y < view.height * 0.72) {
        const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
        const bulletSpeed = 185 * enemyLevelScale();
        game.enemyBullets.push({
          x: enemy.x,
          y: enemy.y + enemy.radius,
          vx: Math.cos(angle) * bulletSpeed,
          vy: Math.sin(angle) * bulletSpeed,
          radius: enemy.big ? 5 : 4,
          damage: 1
        });
        enemy.shootTimer = enemy.big ? random(320, 520) : random(1100, 1700);
      }
    }

    if (distance(enemy, game.player) < enemy.radius + game.player.radius + 4 || enemy.y > view.height + 30) {
      game.enemies.splice(i, 1);
      damageSquad(1);
    }
  }
}

function updateEnemyBullets(dt) {
  for (let i = game.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = game.enemyBullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (distance(bullet, game.player) < bullet.radius + game.player.radius + Math.min(game.squad.length, 4) * 3) {
      game.enemyBullets.splice(i, 1);
      damageSquad(bullet.damage);
      continue;
    }

    if (bullet.y > view.height + 20 || bullet.x < -20 || bullet.x > view.width + 20) {
      game.enemyBullets.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = game.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = game.pickups[i];
    pickup.phase += dt * 4;
    pickup.x += (pickup.vx || 0) * dt;
    pickup.y += (pickup.vy || 95) * dt;

    if (distance(pickup, game.player) < pickup.radius + game.player.radius + 8) {
      collectPickup(pickup);
      game.pickups.splice(i, 1);
    } else if (pickup.y > view.height + 25) {
      game.pickups.splice(i, 1);
    }
  }
}

function collectPickup(pickup) {
  if (pickup.type === "member") {
    game.squad.push({ hp: MEMBER_HP, maxHp: MEMBER_HP });
    burst(pickup.x, pickup.y, "#58e6ff", 14);
    floatingNotice("增員 +1！", "#58e6ff");
  } else if (pickup.type === "heal") {
    game.squad.forEach((member) => {
      member.hp = member.maxHp;
    });
    burst(pickup.x, pickup.y, "#ff8ec4", 14);
    floatingNotice("補血！全隊回滿", "#ff8ec4");
  } else if (pickup.type === "firerate") {
    game.speedLevel = Math.min(10, game.speedLevel + 1);
    burst(pickup.x, pickup.y, "#ffe45d", 14);
    floatingNotice(`加射速！${(1 + game.speedLevel * 0.15).toFixed(2)} 倍`, "#ffe45d");
  } else {
    const value = pickup.type === "starBig" ? 5 : 1;
    game.stars += value;
    burst(pickup.x, pickup.y, "#ffd83d", 12);
  }
  updateHud();
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const particle = game.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 80 * dt;
    particle.life -= dt;
    if (particle.life <= 0) game.particles.splice(i, 1);
  }
}

function defeatEnemy(index, enemy) {
  game.enemies.splice(index, 1);
  game.score += enemy.big ? 10 : 5;
  burst(enemy.x, enemy.y, "#ff536d", enemy.big ? 22 : 10);
  game.pickups.push({
    x: enemy.x,
    y: enemy.y,
    vx: 0,
    vy: 105,
    radius: enemy.big ? 15 : 10,
    phase: random(0, 6),
    type: enemy.big ? "starBig" : "starSmall"
  });
  updateHud();
}

function damageSquad(amount) {
  if (game.over || game.squad.length === 0) return;
  const member = game.squad[game.squad.length - 1];
  member.hp -= amount;
  burst(game.player.x, game.player.y, "#ff536d", 8);
  if (member.hp <= 0) {
    game.squad.pop();
    floatingNotice("一名隊員倒下了！", "#ff7187");
  }
  updateHud();
  if (game.squad.length === 0) endGame();
}

function grantLevelReward(completedLevel) {
  if (completedLevel % 2 === 1) {
    if (progress.gunsOwned < guns.length) {
      progress.gunsOwned += 1;
      progress.gunIndex = progress.gunsOwned - 1;
      return `獲得新槍「${guns[progress.gunIndex].name}」！`;
    }
    return "所有槍械都已收集完成！";
  }
  if (progress.ammosOwned < ammos.length) {
    progress.ammosOwned += 1;
    progress.ammoIndex = progress.ammosOwned - 1;
    return `獲得新子彈「${ammos[progress.ammoIndex].name}」！`;
  }
  return "所有子彈都已收集完成！";
}

function completeLevel() {
  game.betweenLevels = true;
  const completed = game.level;
  const rewardText = grantLevelReward(completed);
  progress.score = game.score;
  progress.stars = game.stars;

  if (completed >= MAX_LEVEL) {
    progress.level = MAX_LEVEL;
    saveProgress();
    updateHud();
    showVictory();
    return;
  }

  game.level += 1;
  progress.level = game.level;
  saveProgress();
  updateHud();
  showMessage(
    `第 ${completed} 關完成！`,
    `${rewardText}<br>目前分數 ${game.score} 分、星星 ${game.stars} 顆。`,
    "進入下一關",
    () => beginLevel()
  );
}

function showVictory() {
  game.running = false;
  stopMusic();
  showPraise();
  showMessage(
    "全部通關！",
    `你打敗了第 ${MAX_LEVEL} 關的大巨人軍團！<br>總分 ${game.score} 分、星星 ${game.stars} 顆。`,
    "回到主畫面",
    () => returnToStart()
  );
}

function showPraise() {
  clearPraise();
  for (let i = 0; i < 26; i += 1) {
    const praise = document.createElement("span");
    praise.textContent = "讚";
    praise.style.left = `${random(2, 94)}%`;
    praise.style.top = `${random(4, 90)}%`;
    praise.style.animationDelay = `${random(0, 1.6).toFixed(2)}s`;
    praise.style.fontSize = `${random(16, 34).toFixed(0)}px`;
    praiseLayer.appendChild(praise);
  }
}

function clearPraise() {
  praiseLayer.innerHTML = "";
}

function endGame() {
  game.over = true;
  game.running = false;
  progress.score = game.score;
  progress.stars = game.stars;
  saveProgress();
  showMessage(
    "藍色小隊全滅",
    `你停在第 ${game.level} 關，分數 ${game.score} 分。<br>裝備與進度都會保留，再來一次吧！`,
    "重新挑戰本關",
    () => {
      game = makeGame();
      beginLevel();
    }
  );
}

function updateHud() {
  if (game) {
    ui.level.textContent = game.level;
    ui.squad.textContent = game.squad.length;
    ui.score.textContent = game.score;
    ui.stars.textContent = game.stars;
    ui.speed.textContent = `${(1 + game.speedLevel * 0.15).toFixed(2)}×`;
  }
  ui.gunName.textContent = currentGun().name;
  ui.ammoName.textContent = currentAmmo().name;
  updateHomeInfo();
}

function updateHomeInfo() {
  ui.homeLevel.textContent = progress.level;
  ui.homeScore.textContent = progress.score;
  ui.homeStars.textContent = progress.stars;
  ui.startButtonText.textContent = progress.level > 1 ? `繼續第 ${progress.level} 關` : "開始遊戲";
}

function draw() {
  if (!game) return;
  drawArena();
  drawDispensers();
  drawPickups();
  drawBullets();
  drawEnemies();
  drawSquad();
  drawParticles();
}

function drawArena() {
  const bounds = arena();
  const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
  gradient.addColorStop(0, "#5b1728");
  gradient.addColorStop(0.22, "#203b4a");
  gradient.addColorStop(1, "#07547a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);

  ctx.fillStyle = "#04101fbb";
  ctx.fillRect(0, 0, bounds.left, view.height);
  ctx.fillRect(bounds.right, 0, view.width - bounds.right, view.height);

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  for (let y = 0; y < view.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(bounds.innerLeft, y);
    ctx.lineTo(bounds.innerRight, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  drawWall(bounds.left, bounds.thickness, 1);
  drawWall(bounds.right, bounds.thickness, -1);
}

function drawWall(x, thickness, inward) {
  const brick = 26;
  ctx.fillStyle = "#8d9bab";
  ctx.fillRect(x - thickness / 2, 0, thickness, view.height);
  ctx.fillStyle = "#6d7b8b";
  for (let y = 0; y < view.height; y += brick) {
    ctx.fillRect(x - thickness / 2, y + brick - 3, thickness, 3);
  }
  ctx.fillStyle = "#b6c4d1";
  for (let y = 6; y < view.height; y += brick * 2) {
    ctx.fillRect(x + inward * (thickness / 2 - 5), y, 5, brick);
  }
  ctx.fillStyle = "#cfdae6";
  ctx.fillRect(x - thickness / 2, 0, thickness, 3);
}

function drawDispensers() {
  const bounds = arena();
  game.dispensers.forEach((dispenser) => {
    const spot = dispenserSpot(dispenser, bounds);
    const info = dispenserInfo(dispenser.type);
    const width = dispenser.zone === "middle" ? 92 : Math.min(84, bounds.left * 0.82);
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.fillStyle = "#0d2138ee";
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 3;
    roundRect(-width / 2, -28, width, 56, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = info.color;
    ctx.textAlign = "center";
    ctx.font = `900 ${Math.max(13, width * 0.19)}px Microsoft JhengHei`;
    ctx.fillText(info.title, 0, 2);
    ctx.font = "800 10px Microsoft JhengHei";
    ctx.fillText("2.5 倍送出", 0, 19);
    ctx.restore();
  });
}

function dispenserInfo(type) {
  if (type === "member") return { title: "加一人", color: "#40d9ff" };
  if (type === "heal") return { title: "補血", color: "#ff8ec4" };
  return { title: "加射速", color: "#ffe14c" };
}

function drawEnemies() {
  game.enemies.forEach((enemy) => {
    const u = enemy.radius / 16;
    const bodyColor = enemy.big ? "#c62644" : "#ff506a";
    const darkColor = enemy.big ? "#7c1730" : "#a3283f";
    const hatColor = enemy.big ? "#320a17" : "#3d0f1d";
    const step = Math.sin(enemy.phase * 1.6) * 3 * u;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 30 * u, 17 * u, 5 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.fillRect(-9 * u, 12 * u, 7 * u, 18 * u + step);
    ctx.fillRect(2 * u, 12 * u, 7 * u, 18 * u - step);
    ctx.fillStyle = "#241017";
    ctx.fillRect(-11 * u, 28 * u + step, 9 * u, 5 * u);
    ctx.fillRect(2 * u, 28 * u - step, 9 * u, 5 * u);

    ctx.fillStyle = bodyColor;
    roundRect(-13 * u, -8 * u, 26 * u, 24 * u, 8 * u);
    ctx.fill();
    ctx.fillStyle = darkColor;
    roundRect(-13 * u, 4 * u, 26 * u, 12 * u, 6 * u);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-19 * u, -6 * u, 7 * u, 20 * u);
    ctx.fillRect(12 * u, -6 * u, 7 * u, 16 * u);

    ctx.fillStyle = "#1a232f";
    ctx.save();
    ctx.translate(15 * u, 10 * u);
    ctx.rotate(0.15);
    ctx.fillRect(0, -3 * u, 30 * u, 6 * u);
    ctx.fillStyle = "#2f3d4d";
    ctx.fillRect(20 * u, -2 * u, 12 * u, 3 * u);
    ctx.fillRect(6 * u, 2 * u, 5 * u, 8 * u);
    ctx.restore();

    ctx.fillStyle = enemy.big ? "#e8a58c" : "#f0b79c";
    ctx.beginPath();
    ctx.arc(0, -15 * u, 9 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hatColor;
    roundRect(-10 * u, -24 * u, 20 * u, 8 * u, 3 * u);
    ctx.fill();
    ctx.fillRect(-11 * u, -18 * u, 22 * u, 3 * u);
    ctx.fillStyle = enemy.big ? "#ffd83d" : "#ffe27a";
    ctx.beginPath();
    ctx.arc(0, -20 * u, 2.4 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#20140f";
    ctx.beginPath();
    ctx.arc(-3.4 * u, -14 * u, 1.5 * u, 0, Math.PI * 2);
    ctx.arc(3.4 * u, -14 * u, 1.5 * u, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.big && enemy.shield > 0) {
      const shieldWidth = 46 * u;
      const shieldHeight = 54 * u;
      ctx.fillStyle = "#9fd8ff44";
      ctx.strokeStyle = "#9fd8ff";
      ctx.lineWidth = 3;
      roundRect(-shieldWidth / 2, -shieldHeight / 2 + 4 * u, shieldWidth, shieldHeight, 8 * u);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d9f1ff";
      ctx.font = `900 ${Math.max(10, 11 * u)}px Microsoft JhengHei`;
      ctx.textAlign = "center";
      ctx.fillText(`${Math.ceil(enemy.shield)}`, 0, 6 * u);

      ctx.fillStyle = "#123047";
      ctx.fillRect(-shieldWidth / 2, -shieldHeight / 2 - 8 * u, shieldWidth, 5);
      ctx.fillStyle = "#57c8ff";
      ctx.fillRect(-shieldWidth / 2, -shieldHeight / 2 - 8 * u, shieldWidth * (enemy.shield / enemy.shieldMax), 5);
    } else if (enemy.big) {
      const barWidth = 30 * u;
      ctx.fillStyle = "#35121a";
      ctx.fillRect(-barWidth / 2, -34 * u, barWidth, 5);
      ctx.fillStyle = "#54e58d";
      ctx.fillRect(-barWidth / 2, -34 * u, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 5);
    }
    ctx.restore();
  });
}

function drawSquad() {
  const count = game.squad.length;
  const visible = Math.min(count, 10);
  for (let i = visible - 1; i >= 0; i -= 1) {
    const row = Math.floor(i / 5);
    const column = i % 5;
    const rowCount = Math.min(5, visible - row * 5);
    const offsetX = (column - (rowCount - 1) / 2) * 18;
    const offsetY = row * 15;
    const x = game.player.x + offsetX;
    const y = game.player.y + offsetY;
    const u = 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#073e73";
    ctx.fillRect(-7 * u, 6 * u, 5 * u, 15 * u);
    ctx.fillRect(2 * u, 6 * u, 5 * u, 15 * u);
    ctx.fillStyle = "#071e36";
    ctx.fillRect(-8 * u, 19 * u, 7 * u, 4 * u);
    ctx.fillRect(1 * u, 19 * u, 7 * u, 4 * u);
    ctx.fillStyle = "#159ef2";
    roundRect(-10 * u, -9 * u, 20 * u, 19 * u, 5 * u);
    ctx.fill();
    ctx.fillRect(-15 * u, -6 * u, 5 * u, 15 * u);
    ctx.fillRect(10 * u, -6 * u, 5 * u, 13 * u);
    ctx.fillStyle = "#10283d";
    ctx.fillRect(9 * u, 3 * u, 25 * u, 5 * u);
    ctx.fillStyle = "#f1c4a4";
    ctx.beginPath();
    ctx.arc(0, -15 * u, 7 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07549a";
    roundRect(-8 * u, -22 * u, 16 * u, 6 * u, 2 * u);
    ctx.fill();
    ctx.fillRect(-9 * u, -17 * u, 18 * u, 2 * u);
    ctx.fillStyle = "#17212d";
    ctx.beginPath();
    ctx.arc(-2.5 * u, -14 * u, 1.1 * u, 0, Math.PI * 2);
    ctx.arc(2.5 * u, -14 * u, 1.1 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const active = game.squad[game.squad.length - 1];
  if (active) {
    const width = 70;
    ctx.fillStyle = "#072238";
    ctx.fillRect(game.player.x - width / 2, game.player.y + 31, width, 6);
    ctx.fillStyle = "#46e991";
    ctx.fillRect(game.player.x - width / 2, game.player.y + 31, width * Math.max(0, active.hp / active.maxHp), 6);
  }
}

function drawBullets() {
  game.bullets.forEach((bullet) => {
    ctx.shadowBlur = 12;
    ctx.shadowColor = bullet.color;
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  game.enemyBullets.forEach((bullet) => {
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff5d4c";
    ctx.fillStyle = "#ffb13c";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

const rainbowStops = ["#ff536d", "#ffcc32", "#42e695", "#43c6ff", "#ac75ff"];

function drawPickups() {
  game.pickups.forEach((pickup) => {
    if (pickup.type === "starSmall" || pickup.type === "starBig") {
      const big = pickup.type === "starBig";
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.rotate(pickup.phase * 0.6);
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ffd83d";
      if (big) {
        const gradient = ctx.createLinearGradient(-pickup.radius, -pickup.radius, pickup.radius, pickup.radius);
        rainbowStops.forEach((color, index) => gradient.addColorStop(index / (rainbowStops.length - 1), color));
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "#ffd83d";
      }
      drawStar(0, 0, 5, pickup.radius + 3, pickup.radius * 0.5);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#4a3400";
      ctx.font = "900 9px Microsoft JhengHei";
      ctx.textAlign = "center";
      ctx.fillText(big ? "5" : "1", pickup.x, pickup.y + 3.5);
      return;
    }

    const info = dispenserInfo(pickup.type);
    ctx.shadowBlur = 16;
    ctx.shadowColor = info.color;
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0d2138";
    ctx.font = "900 9px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText(pickup.type === "member" ? "+1" : pickup.type === "heal" ? "補" : "速", pickup.x, pickup.y + 3);
  });
}

function drawStar(cx, cy, spikes, outer, inner) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i += 1) {
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  ctx.closePath();
}

function drawParticles() {
  game.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  ctx.globalAlpha = 1;
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i += 1) {
    game.particles.push({
      x,
      y,
      vx: random(-100, 100),
      vy: random(-120, 30),
      size: random(2, 5),
      color,
      life: random(0.2, 0.55)
    });
  }
}

function floatingNotice(text, color) {
  const notice = document.createElement("div");
  notice.className = "floating-notice";
  notice.textContent = text;
  notice.style.cssText = `
    position:absolute;left:50%;top:18%;z-index:5;max-width:80%;padding:9px 15px;
    border:1px solid ${color};border-radius:999px;background:#07162de6;color:${color};
    font-weight:900;text-align:center;pointer-events:none;transform:translateX(-50%);
    animation:notice-fade 1.8s ease forwards`;
  document.querySelector("#gameWrap").appendChild(notice);
  setTimeout(() => notice.remove(), 1800);
}

function showMessage(title, text, buttonText, action) {
  messageBox.innerHTML = `<h2>${title}</h2><p>${text}</p><button type="button">${buttonText}</button>`;
  messageBox.hidden = false;
  messageBox.querySelector("button").addEventListener("click", action, { once: true });
}

function hideMessage() {
  messageBox.hidden = true;
  messageBox.innerHTML = "";
}

function togglePause() {
  if (!game || game.over || game.betweenLevels) return;
  game.paused = !game.paused;
  pauseButton.textContent = game.paused ? "▶" : "Ⅱ";
  if (game.paused) {
    showMessage("遊戲暫停", "休息一下，準備好再繼續迎戰！", "繼續遊戲", togglePause);
  } else {
    hideMessage();
    lastFrame = performance.now();
  }
}

function returnToStart() {
  cancelAnimationFrame(animationId);
  animationId = 0;
  Object.keys(keys).forEach((key) => setDirection(key, false));
  if (game) {
    game.running = false;
    game.paused = false;
    progress.score = game.score;
    progress.stars = game.stars;
    progress.level = game.level;
    saveProgress();
  }
  clearPraise();
  hideMessage();
  stopMusic();
  gameScreen.hidden = true;
  startScreen.hidden = false;
  updateHomeInfo();
}

function resetProgress() {
  progress = { level: 1, score: 0, stars: 0, gunsOwned: 1, ammosOwned: 1, gunIndex: 0, ammoIndex: 0 };
  saveProgress();
  updateHomeInfo();
  renderArsenal();
}

function setDirection(direction, pressed) {
  keys[direction] = pressed;
  document.querySelector(`[data-direction="${direction}"]`)?.classList.toggle("active", pressed);
}

function renderArsenal() {
  const gunRows = guns.map((gun, index) => {
    const owned = index < progress.gunsOwned;
    const equipped = index === Math.min(progress.gunIndex, progress.gunsOwned - 1);
    return arsenalRow("gun", index, gun.name, gun.power, guns.length, owned, equipped, `傷害 ${gun.damage}`);
  }).join("");

  const ammoRows = ammos.map((ammo, index) => {
    const owned = index < progress.ammosOwned;
    const equipped = index === Math.min(progress.ammoIndex, progress.ammosOwned - 1);
    return arsenalRow("ammo", index, ammo.name, ammo.power, ammos.length, owned, equipped, `威力 ${ammo.multiplier.toFixed(2)} 倍`);
  }).join("");

  arsenalBody.innerHTML = `
    <h3>槍械（單數關獲得）</h3>
    <div class="arsenal-list">${gunRows}</div>
    <h3>子彈（雙數關獲得）</h3>
    <div class="arsenal-list">${ammoRows}</div>`;
}

function arsenalRow(kind, index, name, power, max, owned, equipped, detail) {
  const dots = "●".repeat(power) + "○".repeat(max - power);
  return `
    <button class="arsenal-item${owned ? "" : " locked"}${equipped ? " equipped" : ""}"
      type="button" data-kind="${kind}" data-index="${index}" ${owned ? "" : "disabled"}>
      <span class="arsenal-name">${owned ? name : "未取得"}</span>
      <span class="arsenal-dots">${dots}</span>
      <span class="arsenal-detail">${owned ? detail : "通關後解鎖"}</span>
      ${equipped ? '<span class="arsenal-badge">使用中</span>' : ""}
    </button>`;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

let audioCtx = null;
let masterGain = null;
let musicEnabled = true;
let musicTimer = 0;
let nextNoteTime = 0;
let melodyIndex = 0;
const beatDur = 0.42;
const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0
};
const melody = [
  ["A4", 1], ["E5", 1], ["C5", 1], ["A4", 1], ["B4", 1], ["G4", 1], ["A4", 2],
  ["E4", 1], ["A4", 1], ["C5", 1], ["B4", 1], ["A4", 1], ["G4", 1], ["E4", 2],
  ["F4", 1], ["A4", 1], ["C5", 1], ["D5", 1], ["C5", 1], ["A4", 1], ["G4", 2],
  ["E5", 1], ["D5", 1], ["C5", 1], ["B4", 1], ["A4", 1], ["B4", 1], ["A4", 2]
];

function ensureAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = musicEnabled ? 0.5 : 0;
  masterGain.connect(audioCtx.destination);
}

function playViolinNote(freq, start, dur) {
  if (!freq) return;
  const osc1 = audioCtx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.value = freq;
  const osc2 = audioCtx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = freq;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.8;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.22, start + 0.07);
  gain.gain.setValueAtTime(0.2, start + dur * 0.65);
  gain.gain.linearRampToValueAtTime(0, start + dur);
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 5.5;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 5;
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.detune);
  lfoGain.connect(osc2.detune);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc1.start(start);
  osc2.start(start);
  lfo.start(start);
  osc1.stop(start + dur + 0.05);
  osc2.stop(start + dur + 0.05);
  lfo.stop(start + dur + 0.05);
}

function musicScheduler() {
  if (!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + 0.25) {
    const [name, beats] = melody[melodyIndex % melody.length];
    const dur = beats * beatDur;
    playViolinNote(NOTE[name], nextNoteTime, dur * 0.92);
    nextNoteTime += dur;
    melodyIndex += 1;
  }
}

function startMusic() {
  if (!musicEnabled) return;
  ensureAudio();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (musicTimer) return;
  nextNoteTime = audioCtx.currentTime + 0.1;
  musicScheduler();
  musicTimer = setInterval(musicScheduler, 120);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = 0;
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  musicButton.textContent = musicEnabled ? "♪" : "🔇";
  musicButton.setAttribute("aria-pressed", String(musicEnabled));
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(musicEnabled ? 0.5 : 0, audioCtx.currentTime, 0.05);
  }
  if (musicEnabled) {
    startMusic();
  } else {
    stopMusic();
  }
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
musicButton.addEventListener("click", toggleMusic);
document.querySelector("#homeButton").addEventListener("click", returnToStart);
document.querySelector("#rulesButton").addEventListener("click", () => rulesDialog.showModal());
document.querySelector("#resetButton").addEventListener("click", resetProgress);
document.querySelector("#arsenalButton").addEventListener("click", () => {
  renderArsenal();
  arsenalDialog.showModal();
});
document.querySelector("#openArsenal").addEventListener("click", () => {
  renderArsenal();
  arsenalDialog.showModal();
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.close}`).close();
  });
});

[rulesDialog, arsenalDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

arsenalBody.addEventListener("click", (event) => {
  const item = event.target.closest(".arsenal-item");
  if (!item || item.disabled) return;
  const index = Number(item.dataset.index);
  if (item.dataset.kind === "gun") {
    progress.gunIndex = index;
  } else {
    progress.ammoIndex = index;
  }
  saveProgress();
  renderArsenal();
  updateHud();
});

document.querySelectorAll(".move-button").forEach((button) => {
  const direction = button.dataset.direction;
  ["pointerdown", "touchstart"].forEach((eventName) => {
    button.addEventListener(eventName, (event) => {
      event.preventDefault();
      setDirection(direction, true);
    }, { passive: false });
  });
  ["pointerup", "pointercancel", "pointerleave", "touchend"].forEach((eventName) => {
    button.addEventListener(eventName, () => setDirection(direction, false));
  });
});

const keyMap = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowDown: "back", s: "back", S: "back"
};

window.addEventListener("keydown", (event) => {
  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key], true);
  }
  if (event.key === "Escape" && !gameScreen.hidden) togglePause();
});

window.addEventListener("keyup", (event) => {
  if (keyMap[event.key]) setDirection(keyMap[event.key], false);
});

let dragging = false;
canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging || !game) return;
  const bounds = arena();
  const rect = canvas.getBoundingClientRect();
  game.player.x = clamp(event.clientX - rect.left, bounds.innerLeft + 24, bounds.innerRight - 24);
  game.player.y = clamp(event.clientY - rect.top, view.height * 0.68, view.height - 35);
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("blur", () => {
  Object.keys(keys).forEach((key) => setDirection(key, false));
});

const motionStyle = document.createElement("style");
motionStyle.textContent = `
  @keyframes notice-fade {
    0% { opacity:0; transform:translate(-50%, 12px) scale(.9) }
    18%, 72% { opacity:1; transform:translate(-50%, 0) scale(1) }
    100% { opacity:0; transform:translate(-50%, -18px) scale(.96) }
  }`;
document.head.appendChild(motionStyle);

updateHomeInfo();
renderArsenal();
ui.gunName.textContent = currentGun().name;
ui.ammoName.textContent = currentAmmo().name;
