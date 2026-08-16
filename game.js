const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const messageBox = document.querySelector("#message");
const rulesDialog = document.querySelector("#rulesDialog");

const ui = {
  level: document.querySelector("#levelValue"),
  squad: document.querySelector("#squadValue"),
  coins: document.querySelector("#coinValue"),
  speed: document.querySelector("#speedValue"),
  energy: document.querySelector("#energyValue"),
  energyMeter: document.querySelector("#energyMeter"),
  weaponName: document.querySelector("#weaponName"),
  weaponButton: document.querySelector("#weaponButton")
};

const weapons = [
  { name: "練習手槍", unlock: 1, damage: 20, fire: 270, color: "#dcecff" },
  { name: "雙管衝鋒槍", unlock: 10, damage: 30, fire: 225, color: "#63e8ff" },
  { name: "雷霆步槍", unlock: 20, damage: 45, fire: 190, color: "#ffe356" },
  { name: "電漿機關槍", unlock: 30, damage: 65, fire: 155, color: "#b785ff" },
  { name: "彩虹加農砲", unlock: 40, damage: 95, fire: 125, color: "#ff6fd1" }
];

const keys = { left: false, right: false, back: false };
let view = { width: 900, height: 620, dpr: 1 };
let lastFrame = 0;
let animationId = 0;
let game = null;

function loadCoins() {
  const saved = Number(localStorage.getItem("藍紅小隊金幣"));
  return Number.isFinite(saved) && saved >= 0 ? saved : 0;
}

function saveCoins() {
  localStorage.setItem("藍紅小隊金幣", String(game.coins));
}

function makeGame(level = 1, coins = loadCoins()) {
  return {
    level,
    coins,
    squad: [{ hp: 1111, maxHp: 1111, big: false }],
    player: { x: view.width / 2, y: view.height - 60, radius: 18 },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    pickups: [],
    gates: [
      { type: "member", side: "left", progress: 0, goal: 500, open: false },
      { type: "speed", side: "right", progress: 0, goal: 600, open: false }
    ],
    speedLevel: 0,
    energy: 0,
    weaponIndex: 0,
    lastShot: 0,
    spawnTimer: 0,
    spawned: 0,
    enemyTotal: 0,
    running: true,
    paused: false,
    over: false,
    betweenLevels: false,
    elapsed: 0
  };
}

function startGame() {
  startScreen.hidden = true;
  gameScreen.hidden = false;
  resizeCanvas();
  game = makeGame();
  beginLevel();
  updateHud();
  startMusic();
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function beginLevel() {
  game.enemyTotal = Math.min(7 + game.level * 2, 32);
  game.spawned = 0;
  game.spawnTimer = 250;
  game.enemies.length = 0;
  game.bullets.length = 0;
  game.enemyBullets.length = 0;
  game.pickups.length = 0;
  game.gates = [
    { type: "member", side: "left", progress: 0, goal: 500, open: false },
    { type: "speed", side: "right", progress: 0, goal: 600, open: false }
  ];
  game.running = true;
  game.paused = false;
  game.over = false;
  game.betweenLevels = false;
  game.player.x = view.width / 2;
  game.player.y = view.height - 60;
  pauseButton.textContent = "Ⅱ";
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
  game.elapsed += dt;
  updatePlayer(dt);
  updateGateBonuses();
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
  const speed = Math.max(230, view.width * 0.38);
  if (keys.left) game.player.x -= speed * dt;
  if (keys.right) game.player.x += speed * dt;
  if (keys.back) game.player.y += speed * 0.58 * dt;
  if (!keys.back) {
    const homeY = view.height - 60;
    game.player.y += (homeY - game.player.y) * Math.min(1, dt * 5);
  }
  game.player.x = clamp(game.player.x, 28, view.width - 28);
  game.player.y = clamp(game.player.y, view.height * 0.68, view.height - 35);
}

function spawnEnemies(dt) {
  if (game.spawned >= game.enemyTotal) return;
  game.spawnTimer -= dt * 1000;
  if (game.spawnTimer > 0) return;

  const shouldBeBig = game.spawned === 0 || game.spawned % 4 === 0;
  const big = shouldBeBig;
  const radius = big ? 34 : 16;
  const hp = 1;
  const laneSpread = Math.min(210, view.width * 0.27);
  game.enemies.push({
    x: view.width / 2 + random(-laneSpread, laneSpread),
    y: -radius - random(0, 50),
    radius,
    hp,
    maxHp: hp,
    big,
    speed: (big ? 24 : 38) + game.level * 1.25,
    shootTimer: random(650, 1500),
    phase: random(0, Math.PI * 2)
  });
  game.spawned += 1;
  game.spawnTimer = Math.max(280, 900 - game.level * 18);
}

function shoot(now) {
  const weapon = weapons[game.weaponIndex];
  const multiplier = 1 + game.speedLevel * 0.15;
  if (now - game.lastShot < weapon.fire / multiplier) return;
  game.lastShot = now;

  const columns = Math.min(game.squad.length, 5);
  for (let i = 0; i < columns; i += 1) {
    const offset = (i - (columns - 1) / 2) * 9;
    game.bullets.push({
      x: game.player.x + offset,
      y: game.player.y - 26 - Math.floor(i / 5) * 8,
      radius: game.weaponIndex >= 4 ? 5 : 3.5,
      speed: 520 + game.weaponIndex * 35,
      damage: weapon.damage,
      color: weapon.color
    });
  }
}

function updateBullets(dt) {
  for (let i = game.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = game.bullets[i];
    bullet.y -= bullet.speed * dt;

    if (hitBarrier(bullet.x, bullet.y, bullet.radius)) {
      burst(bullet.x, bullet.y, "#b6d6e7", 3);
      game.bullets.splice(i, 1);
      continue;
    }

    let hit = false;
    for (let e = game.enemies.length - 1; e >= 0; e -= 1) {
      const enemy = game.enemies[e];
      if (distance(bullet, enemy) < bullet.radius + enemy.radius) {
        burst(bullet.x, bullet.y, bullet.color, 4);
        game.bullets.splice(i, 1);
        hit = true;
        defeatEnemy(e, enemy);
        break;
      }
    }
    if (!hit && bullet.y < -20) game.bullets.splice(i, 1);
  }
}

function updateEnemies(dt) {
  const gapHalf = Math.min(105, view.width * 0.18);
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    enemy.phase += dt * 2.2;
    const nearWall = [view.height * 0.34, view.height * 0.59].some((wallY) => Math.abs(enemy.y - wallY) < 42);
    if (nearWall && Math.abs(enemy.x - view.width / 2) > gapHalf - enemy.radius) {
      enemy.x += Math.sign(view.width / 2 - enemy.x) * enemy.speed * 1.65 * dt;
    } else {
      enemy.y += enemy.speed * dt;
      enemy.x += Math.sin(enemy.phase) * 8 * dt;
    }

    enemy.shootTimer -= dt * 1000;
    if (enemy.shootTimer <= 0 && enemy.y > 20 && enemy.y < view.height * 0.72) {
      const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
      game.enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.radius,
        vx: Math.cos(angle) * (enemy.big ? 155 : 175),
        vy: Math.sin(angle) * (enemy.big ? 155 : 175),
        radius: enemy.big ? 5 : 4,
        damage: 1
      });
      enemy.shootTimer = random(enemy.big ? 900 : 1250, enemy.big ? 1450 : 1900);
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

    if (hitBarrier(bullet.x, bullet.y, bullet.radius)) {
      game.enemyBullets.splice(i, 1);
      continue;
    }

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
    pickup.y += 85 * dt;
    pickup.phase += dt * 4;
    pickup.x += Math.sin(pickup.phase) * 15 * dt;
    if (distance(pickup, game.player) < pickup.radius + game.player.radius + 8) {
      game.energy = Math.min(100, game.energy + 10);
      burst(pickup.x, pickup.y, "#45d8ff", 12);
      game.pickups.splice(i, 1);
      if (game.energy >= 100) transformSquad();
      updateHud();
    } else if (pickup.y > view.height + 20) {
      game.pickups.splice(i, 1);
    }
  }
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

function hitBarrier(x, y, radius) {
  const gapHalf = Math.min(105, view.width * 0.18);
  const wallThickness = 14;
  return [view.height * 0.34, view.height * 0.59].some((wallY) => {
    const atHeight = y + radius > wallY - wallThickness / 2 && y - radius < wallY + wallThickness / 2;
    const outsideGap = x - radius < view.width / 2 - gapHalf || x + radius > view.width / 2 + gapHalf;
    return atHeight && outsideGap;
  });
}

function updateGateBonuses() {
  const gateY = view.height * 0.64;
  const size = Math.min(86, view.width * 0.14);
  game.gates.forEach((gate) => {
    if (gate.open) return;
    const gateX = gate.side === "left" ? size * 0.62 : view.width - size * 0.62;
    if (Math.hypot(game.player.x - gateX, game.player.y - gateY) < size * 0.95) {
      openGate(gate);
    }
  });
}

function openGate(gate) {
  gate.open = true;
  if (gate.type === "member") {
    game.squad.push({ hp: 1111, maxHp: 1111, big: false });
    floatingNotice("增員 +1！", "#58e6ff");
  } else {
    game.speedLevel = Math.min(10, game.speedLevel + 1);
    floatingNotice(`射速提升至 ${(1 + game.speedLevel * 0.15).toFixed(2)} 倍！`, "#ffe45d");
  }
  updateHud();
}

function defeatEnemy(index, enemy) {
  game.enemies.splice(index, 1);
  burst(enemy.x, enemy.y, "#ff536d", enemy.big ? 22 : 10);
  if (Math.random() < (enemy.big ? 0.8 : 0.28)) {
    game.pickups.push({ x: enemy.x, y: enemy.y, radius: 9, phase: random(0, 6) });
  }
}

function damageSquad(amount) {
  if (game.over || game.squad.length === 0) return;
  const member = game.squad[game.squad.length - 1];
  member.hp -= amount;
  burst(game.player.x, game.player.y, "#ff536d", 10);
  if (member.hp <= 0) {
    game.squad.pop();
    floatingNotice("一名隊員倒下了！", "#ff7187");
  }
  updateHud();
  if (game.squad.length === 0) endGame();
}

function transformSquad() {
  game.energy = 0;
  const member = game.squad[0];
  member.hp = 1111;
  member.maxHp = 1111;
  member.big = true;
  game.player.radius = 27;
  floatingNotice("大型藍色巨人登場！1111 生命", "#63e8ff");
}

function completeLevel() {
  game.betweenLevels = true;
  game.coins += 10;
  saveCoins();
  const completed = game.level;
  game.level += 1;
  updateHud();
  const unlocked = weapons.find((weapon) => weapon.unlock === game.level);
  showMessage(
    `第 ${completed} 關完成！`,
    `獲得 10 金幣。${unlocked ? `新武器「${unlocked.name}」已解鎖！` : "紅色軍團正準備下一波攻勢。"}`,
    "進入下一關",
    () => beginLevel()
  );
}

function endGame() {
  game.over = true;
  game.running = false;
  showMessage(
    "藍色小隊全滅",
    `你抵達第 ${game.level} 關。保留金幣後，可以重新挑戰！`,
    "重新挑戰",
    () => {
      const coins = game.coins;
      game = makeGame(game.level, coins);
      beginLevel();
    }
  );
}

function equipNextWeapon() {
  if (!game || game.coins < 10) return;
  const unlockedIndices = weapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => game.level >= weapon.unlock);
  if (unlockedIndices.length < 2) return;

  const currentPosition = unlockedIndices.findIndex(({ index }) => index === game.weaponIndex);
  const next = unlockedIndices[(currentPosition + 1) % unlockedIndices.length];
  if (next.index === game.weaponIndex) return;
  game.coins -= 10;
  game.weaponIndex = next.index;
  saveCoins();
  floatingNotice(`已裝備 ${next.weapon.name}`, next.weapon.color);
  updateHud();
}

function updateHud() {
  if (!game) return;
  ui.level.textContent = game.level;
  ui.squad.textContent = game.squad.length;
  ui.coins.textContent = game.coins;
  ui.speed.textContent = `${(1 + game.speedLevel * 0.15).toFixed(2)}×`;
  ui.energy.textContent = game.energy;
  ui.energyMeter.style.width = `${game.energy}%`;
  ui.weaponName.textContent = weapons[game.weaponIndex].name;

  const unlocked = weapons.filter((weapon) => game.level >= weapon.unlock);
  const canSwitch = unlocked.length > 1;
  ui.weaponButton.disabled = !canSwitch || game.coins < 10;
  if (!canSwitch) {
    const next = weapons.find((weapon) => weapon.unlock > game.level);
    ui.weaponButton.textContent = next ? `第 ${next.unlock} 關解鎖下一把槍` : "已解鎖全部武器";
  } else if (game.coins < 10) {
    ui.weaponButton.textContent = "需要 10 金幣更換武器";
  } else {
    ui.weaponButton.textContent = "更換武器（10 金幣）";
  }
}

function draw() {
  if (!game) return;
  ctx.save();
  drawArena();
  drawGates();
  drawPickups();
  drawBullets();
  drawEnemies();
  drawSquad();
  drawParticles();
  ctx.restore();
}

function drawArena() {
  const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
  gradient.addColorStop(0, "#5b1728");
  gradient.addColorStop(0.22, "#203b4a");
  gradient.addColorStop(1, "#07547a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);

  ctx.globalAlpha = 0.13;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  const tile = 48;
  for (let y = 0; y < view.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.width, y);
    ctx.stroke();
  }
  for (let x = 0; x < view.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, view.height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const gapHalf = Math.min(105, view.width * 0.18);
  [view.height * 0.34, view.height * 0.59].forEach((wallY) => {
    ctx.fillStyle = "#7894a5";
    ctx.fillRect(0, wallY - 7, view.width / 2 - gapHalf, 14);
    ctx.fillRect(view.width / 2 + gapHalf, wallY - 7, view.width / 2 - gapHalf, 14);
    ctx.fillStyle = "#b9ccd6";
    ctx.fillRect(0, wallY - 7, view.width / 2 - gapHalf, 3);
    ctx.fillRect(view.width / 2 + gapHalf, wallY - 7, view.width / 2 - gapHalf, 3);
    ctx.fillStyle = "#d9f1ff";
    ctx.font = "700 10px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText("防彈牆", (view.width / 2 - gapHalf) / 2, wallY - 12);
    ctx.fillText("防彈牆", view.width - (view.width / 2 - gapHalf) / 2, wallY - 12);
  });

  ctx.fillStyle = "#ffffff16";
  ctx.fillRect(view.width / 2 - gapHalf, 0, gapHalf * 2, view.height);
  ctx.strokeStyle = "#ffffff28";
  ctx.setLineDash([10, 12]);
  ctx.strokeRect(view.width / 2 - gapHalf, 0, gapHalf * 2, view.height);
  ctx.setLineDash([]);
}

function drawGates() {
  const gateY = view.height * 0.64;
  const size = Math.min(86, view.width * 0.14);
  game.gates.forEach((gate) => {
    const x = gate.side === "left" ? size * 0.62 : view.width - size * 0.62;
    const color = gate.type === "member" ? "#40d9ff" : "#ffe14c";
    ctx.save();
    ctx.translate(x, gateY);
    ctx.fillStyle = gate.open ? "#1a405499" : "#102333ee";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    roundRect(-size / 2, -34, size, 68, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.font = `900 ${Math.max(13, size * 0.2)}px Microsoft JhengHei`;
    ctx.fillText(gate.open ? "已領取" : gate.type === "member" ? "+1 人" : "射速", 0, -8);
    ctx.font = "800 11px Microsoft JhengHei";
    ctx.fillText(gate.open ? "完成" : "靠近直接領取", 0, 14);
    if (!gate.open) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 31);
      ctx.lineTo(-7, 24);
      ctx.lineTo(7, 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
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

    if (enemy.big) {
      ctx.fillStyle = "#ffd83d";
      ctx.font = "900 10px Microsoft JhengHei";
      ctx.textAlign = "center";
      ctx.fillText("巨人", 0, 2 * u);
    }

    const barWidth = 30 * u;
    ctx.fillStyle = "#35121a";
    ctx.fillRect(-barWidth / 2, -34 * u, barWidth, 5);
    ctx.fillStyle = "#54e58d";
    ctx.fillRect(-barWidth / 2, -34 * u, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 5);
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
    const member = game.squad[Math.min(i, count - 1)];
    const big = member.big;
    const radius = big ? 24 : 13;
    const x = game.player.x + offsetX;
    const y = game.player.y + offsetY;
    const u = radius / 13;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#073e73";
    ctx.fillRect(-7 * u, 6 * u, 5 * u, 15 * u);
    ctx.fillRect(2 * u, 6 * u, 5 * u, 15 * u);
    ctx.fillStyle = "#071e36";
    ctx.fillRect(-8 * u, 19 * u, 7 * u, 4 * u);
    ctx.fillRect(1 * u, 19 * u, 7 * u, 4 * u);
    ctx.fillStyle = big ? "#45dfff" : "#159ef2";
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

function drawPickups() {
  game.pickups.forEach((pickup) => {
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#3de8ff";
    ctx.fillStyle = "#45dfff";
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e9fdff";
    ctx.font = "900 9px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText("+10", pickup.x, pickup.y + 3);
  });
  ctx.shadowBlur = 0;
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
  }
  hideMessage();
  stopMusic();
  gameScreen.hidden = true;
  startScreen.hidden = false;
}

function setDirection(direction, pressed) {
  keys[direction] = pressed;
  document.querySelector(`[data-direction="${direction}"]`)?.classList.toggle("active", pressed);
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

const musicButton = document.querySelector("#musicButton");
let audioCtx = null;
let masterGain = null;
let musicEnabled = true;
let musicTimer = 0;
let nextNoteTime = 0;
let melodyIndex = 0;
const beatDur = 0.42;
const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, R: 0
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
  if (freq <= 0) return;
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
  if (musicEnabled) startMusic();
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
musicButton.addEventListener("click", toggleMusic);
document.querySelector("#homeButton").addEventListener("click", returnToStart);
ui.weaponButton.addEventListener("click", equipNextWeapon);
document.querySelector("#rulesButton").addEventListener("click", () => rulesDialog.showModal());
document.querySelector("#closeRules").addEventListener("click", () => rulesDialog.close());
rulesDialog.addEventListener("click", (event) => {
  if (event.target === rulesDialog) rulesDialog.close();
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

window.addEventListener("keydown", (event) => {
  const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "back", s: "back", S: "back" };
  if (map[event.key]) {
    event.preventDefault();
    setDirection(map[event.key], true);
  }
  if (event.key === "Escape" && gameScreen.hidden === false) togglePause();
});

window.addEventListener("keyup", (event) => {
  const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "back", s: "back", S: "back" };
  if (map[event.key]) setDirection(map[event.key], false);
});

let dragging = false;
canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging || !game) return;
  const rect = canvas.getBoundingClientRect();
  game.player.x = clamp(event.clientX - rect.left, 28, view.width - 28);
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
