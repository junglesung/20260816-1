const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const packSelectScreen = document.querySelector("#packSelectScreen");
const stageSelectScreen = document.querySelector("#stageSelectScreen");
const gameScreen = document.querySelector("#gameScreen");
const pauseButton = document.querySelector("#pauseButton");
const messageBox = document.querySelector("#message");
const praiseLayer = document.querySelector("#praiseLayer");
const rulesDialog = document.querySelector("#rulesDialog");
const arsenalDialog = document.querySelector("#arsenalDialog");
const arsenalBody = document.querySelector("#arsenalBody");
const musicButton = document.querySelector("#musicButton");
const chapterList = document.querySelector("#chapterList");
const packList = document.querySelector("#packList");
const subLevelList = document.querySelector("#subLevelList");
const packSelectTitle = document.querySelector("#packSelectTitle");
const packSelectHint = document.querySelector("#packSelectHint");
const stageSelectTitle = document.querySelector("#stageSelectTitle");
const stageSelectHint = document.querySelector("#stageSelectHint");

const ui = {
  level: document.querySelector("#levelValue"),
  squad: document.querySelector("#squadValue"),
  score: document.querySelector("#scoreValue"),
  stars: document.querySelector("#starValue"),
  speed: document.querySelector("#speedValue"),
  leftDoor: document.querySelector("#leftDoorValue"),
  rightDoor: document.querySelector("#rightDoorValue"),
  gunName: document.querySelector("#gunName"),
  ammoName: document.querySelector("#ammoName"),
  homeLevel: document.querySelector("#homeLevel"),
  homeScore: document.querySelector("#homeScore"),
  homeStars: document.querySelector("#homeStars")
};

const MAX_CHAPTER = 10;
const MEMBER_HP = 1111;
const DOOR_HITS_NEEDED = 580;
const PACK_SIZE = 10;
const SQUAD_SCALE = 0.68;
const FIXED_SPEED_MULT = 2.5;
const CLEAR_QUOTES = [
  "漂亮！這一波清得乾乾淨淨。",
  "藍色小隊再下一城！",
  "窄道突圍成功，繼續往前衝！",
  "單排直射，紅色軍團擋不住！",
  "門縫裡的補給也別忘了拿哦。"
];

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
let selectedChapter = 1;
let selectedPack = 1;
let fireAim = "front";
let view = { width: 900, height: 620, dpr: 1 };
let lastFrame = 0;
let animationId = 0;
let game = null;

function chapterGoal(chapter) {
  return chapter * 100;
}

function packCount(chapter) {
  return Math.ceil(chapterGoal(chapter) / PACK_SIZE);
}

function packRange(pack) {
  const start = (pack - 1) * PACK_SIZE + 1;
  const end = pack * PACK_SIZE;
  return { start, end };
}

function packOfSubLevel(subLevel) {
  return Math.ceil(subLevel / PACK_SIZE);
}

function isPackUnlocked(chapter, pack) {
  if (pack <= 1) return isChapterUnlocked(chapter);
  return getChapterCleared(chapter) >= (pack - 1) * PACK_SIZE;
}

function defaultChapterCleared() {
  return Array.from({ length: MAX_CHAPTER }, () => 0);
}

function normalizeChapterCleared(raw, legacyLevel) {
  const cleared = defaultChapterCleared();
  if (Array.isArray(raw)) {
    for (let i = 0; i < MAX_CHAPTER; i += 1) {
      cleared[i] = clamp(Number(raw[i]) || 0, 0, chapterGoal(i + 1));
    }
    return cleared;
  }
  if (raw && typeof raw === "object") {
    for (let i = 1; i <= MAX_CHAPTER; i += 1) {
      cleared[i - 1] = clamp(Number(raw[i]) || 0, 0, chapterGoal(i));
    }
    return cleared;
  }
  const migrated = clamp(Number(legacyLevel) || 1, 1, MAX_CHAPTER);
  cleared[0] = Math.max(0, migrated - 1);
  return cleared;
}

function loadProgress() {
  const fallback = {
    score: 0,
    stars: 0,
    gunsOwned: 1,
    ammosOwned: 1,
    gunIndex: 0,
    ammoIndex: 0,
    chapterCleared: defaultChapterCleared(),
    chapter: 1,
    subLevel: 1
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return fallback;
    const chapterCleared = normalizeChapterCleared(saved.chapterCleared, saved.level);
    const chapter = clamp(Number(saved.chapter) || 1, 1, MAX_CHAPTER);
    const maxSub = chapterGoal(chapter);
    const subLevel = clamp(Number(saved.subLevel) || Math.min(chapterCleared[chapter - 1] + 1, maxSub), 1, maxSub);
    return {
      score: Math.max(0, Number(saved.score) || 0),
      stars: Math.max(0, Number(saved.stars) || 0),
      gunsOwned: clamp(Number(saved.gunsOwned) || 1, 1, guns.length),
      ammosOwned: clamp(Number(saved.ammosOwned) || 1, 1, ammos.length),
      gunIndex: clamp(Number(saved.gunIndex) || 0, 0, guns.length - 1),
      ammoIndex: clamp(Number(saved.ammoIndex) || 0, 0, ammos.length - 1),
      chapterCleared,
      chapter,
      subLevel
    };
  } catch (error) {
    return fallback;
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getChapterCleared(chapter) {
  return progress.chapterCleared[chapter - 1] || 0;
}

function setChapterCleared(chapter, value) {
  progress.chapterCleared[chapter - 1] = clamp(value, 0, chapterGoal(chapter));
}

function isChapterUnlocked(chapter) {
  if (chapter <= 1) return true;
  if (chapter > MAX_CHAPTER) return false;
  return getChapterCleared(chapter - 1) >= chapterGoal(chapter - 1);
}

function highestUnlockedChapter() {
  let unlocked = 1;
  for (let chapter = 2; chapter <= MAX_CHAPTER; chapter += 1) {
    if (!isChapterUnlocked(chapter)) break;
    unlocked = chapter;
  }
  return unlocked;
}

function visibleSubLevelCount(chapter) {
  return chapterGoal(chapter);
}

function difficultyScale(chapter, subLevel) {
  return (chapter - 1) * 100 + subLevel;
}

function randomClearQuote() {
  return CLEAR_QUOTES[Math.floor(Math.random() * CLEAR_QUOTES.length)];
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

function makeGame(chapter, subLevel) {
  return {
    chapter,
    subLevel,
    score: progress.score,
    stars: progress.stars,
    squad: [{ hp: MEMBER_HP, maxHp: MEMBER_HP }],
    player: { x: view.width / 2, y: view.height - 52, radius: 12 },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    pickups: [],
    dispensers: [
      { type: "member", zone: "left", timer: 3.5, interval: 11 },
      { type: "firerate", zone: "right", timer: 6, interval: 10 },
      { type: "firerate", zone: "middle", timer: 2.5, interval: 7.5 }
    ],
    leftDoor: { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 },
    rightDoor: { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 },
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
  const corridor = clamp(view.width * 0.2, 70, 104);
  const mid = view.width / 2;
  const innerLeft = mid - corridor / 2;
  const innerRight = mid + corridor / 2;
  const thickness = clamp((view.width - corridor) * 0.42, 48, 120);
  const left = innerLeft - thickness / 2;
  const right = innerRight + thickness / 2;
  return { left, right, thickness, innerLeft, innerRight, corridor, mid };
}

function doorBox(side, bounds = arena()) {
  const width = clamp(bounds.thickness * 0.55, 22, 40);
  const height = clamp(view.height * 0.26, 100, 168);
  const y = view.height * 0.18;
  // 凹進通道一點，方便左右管打到門
  if (side === "left") {
    return { x: bounds.innerLeft - width + 10, y, w: width + 4, h: height };
  }
  return { x: bounds.innerRight - 14, y, w: width + 4, h: height };
}

function pointInBox(point, box) {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
}

function hideMenuScreens() {
  startScreen.hidden = true;
  packSelectScreen.hidden = true;
  stageSelectScreen.hidden = true;
  gameScreen.hidden = true;
}

function openStageSelect(chapter) {
  if (!isChapterUnlocked(chapter)) return;
  selectedChapter = chapter;
  const cleared = getChapterCleared(chapter);
  selectedPack = clamp(packOfSubLevel(Math.max(1, cleared + 1)), 1, packCount(chapter));
  hideMenuScreens();
  packSelectScreen.hidden = false;
  renderPackList();
}

function openPackLevels(pack) {
  if (!isPackUnlocked(selectedChapter, pack)) return;
  selectedPack = pack;
  hideMenuScreens();
  stageSelectScreen.hidden = false;
  renderSubLevelList();
}

function returnToHome() {
  cancelAnimationFrame(animationId);
  animationId = 0;
  Object.keys(keys).forEach((key) => setDirection(key, false));
  if (game) {
    game.running = false;
    game.paused = false;
    progress.score = game.score;
    progress.stars = game.stars;
    progress.chapter = game.chapter;
    progress.subLevel = game.subLevel;
    saveProgress();
  }
  clearPraise();
  hideMessage();
  stopMusic();
  game = null;
  hideMenuScreens();
  startScreen.hidden = false;
  updateHomeInfo();
  renderChapterList();
}

function returnToPackSelect() {
  cancelAnimationFrame(animationId);
  animationId = 0;
  Object.keys(keys).forEach((key) => setDirection(key, false));
  if (game) {
    game.running = false;
    game.paused = false;
    progress.score = game.score;
    progress.stars = game.stars;
    progress.chapter = game.chapter;
    progress.subLevel = game.subLevel;
    selectedChapter = game.chapter;
    selectedPack = packOfSubLevel(game.subLevel);
    saveProgress();
  }
  clearPraise();
  hideMessage();
  stopMusic();
  game = null;
  hideMenuScreens();
  packSelectScreen.hidden = false;
  renderPackList();
  updateHomeInfo();
}

function returnToStageSelect() {
  cancelAnimationFrame(animationId);
  animationId = 0;
  Object.keys(keys).forEach((key) => setDirection(key, false));
  if (game) {
    game.running = false;
    game.paused = false;
    progress.score = game.score;
    progress.stars = game.stars;
    progress.chapter = game.chapter;
    progress.subLevel = game.subLevel;
    selectedChapter = game.chapter;
    selectedPack = packOfSubLevel(game.subLevel);
    saveProgress();
  }
  clearPraise();
  hideMessage();
  stopMusic();
  game = null;
  hideMenuScreens();
  stageSelectScreen.hidden = false;
  renderSubLevelList();
  updateHomeInfo();
}

function startGame(chapter, subLevel) {
  if (!isChapterUnlocked(chapter)) return;
  const goal = chapterGoal(chapter);
  if (subLevel < 1 || subLevel > goal) return;
  const pack = packOfSubLevel(subLevel);
  if (!isPackUnlocked(chapter, pack)) return;

  selectedChapter = chapter;
  selectedPack = pack;
  progress.chapter = chapter;
  progress.subLevel = subLevel;
  saveProgress();

  hideMenuScreens();
  gameScreen.hidden = false;
  resizeCanvas();
  game = makeGame(chapter, subLevel);
  beginLevel();
  startMusic();
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function beginLevel() {
  const allBig = game.chapter >= MAX_CHAPTER;
  // 第 N 小關派出更多、更密的敵人；第 1 小關仍是 1 隻大怪
  game.enemyTotal = allBig
    ? Math.min(Math.max(1, Math.ceil(game.subLevel / 30)), 28)
    : Math.min(Math.max(1, Math.ceil(game.subLevel * 1.6)), 120);
  game.spawned = 0;
  game.spawnTimer = 160;
  game.enemies.length = 0;
  game.bullets.length = 0;
  game.enemyBullets.length = 0;
  game.pickups.length = 0;
  game.particles.length = 0;
  game.leftDoor = { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 };
  game.rightDoor = { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 };
  game.dispensers.forEach((dispenser, index) => {
    dispenser.timer = 2.5 + index * 1.5;
  });
  game.running = true;
  game.paused = false;
  game.over = false;
  game.betweenLevels = false;
  const bounds = arena();
  game.player.x = view.width / 2;
  game.player.y = view.height - 52;
  game.player.radius = 12;
  game.player.x = clamp(game.player.x, bounds.innerLeft + 16, bounds.innerRight - 16);
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
  game.leftDoor.spin += dt * 2.8;
  game.rightDoor.spin += dt * 2.8;

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
    const homeY = view.height - 52;
    game.player.y += (homeY - game.player.y) * Math.min(1, dt * 5);
  }
  game.player.x = clamp(game.player.x, bounds.innerLeft + 16, bounds.innerRight - 16);
  game.player.y = clamp(game.player.y, view.height * 0.68, view.height - 28);
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
  if (dispenser.zone === "left") return { x: bounds.innerLeft * 0.45, y: view.height * 0.28 };
  if (dispenser.zone === "right") return { x: bounds.innerRight + (view.width - bounds.innerRight) * 0.55, y: view.height * 0.28 };
  return { x: view.width / 2, y: view.height * 0.11 };
}

function enemyLevelScale() {
  return difficultyScale(game.chapter, game.subLevel);
}

function enemyHpScale() {
  const raw = enemyLevelScale();
  if (raw <= 10) return raw;
  return 10 + Math.pow(raw - 10, 0.72);
}

function spawnEnemies(dt) {
  if (game.spawned >= game.enemyTotal) return;
  game.spawnTimer -= dt * 1000;
  if (game.spawnTimer > 0) return;

  const bounds = arena();
  const allBig = game.chapter >= MAX_CHAPTER;
  const singleBoss = game.enemyTotal === 1;
  const big = allBig || singleBoss || game.spawned === 0 || game.spawned % 3 === 0;
  const radius = big ? 26 : 11;
  const scale = enemyHpScale();
  const hp = (big ? 100 : 1) * scale;
  const shield = (big ? 500 : 0) * scale;
  const margin = big ? radius + 2 : radius + 4;
  game.enemies.push({
    x: random(bounds.innerLeft + margin, bounds.innerRight - margin),
    y: -radius - random(0, 28),
    radius,
    big,
    hp,
    maxHp: hp,
    shield,
    shieldMax: shield,
    speed: (big ? 30 : 46) * FIXED_SPEED_MULT,
    shootTimer: random(700, 1400),
    phase: random(0, Math.PI * 2)
  });
  game.spawned += 1;
  game.spawnTimer = allBig
    ? Math.max(520, 1100 - Math.floor(game.subLevel / 20) * 18)
    : Math.max(140, 520 - Math.min(game.subLevel, 60) * 5);
}

function shoot(now) {
  const gun = currentGun();
  const ammo = currentAmmo();
  if (now - game.lastShot < gun.fire / FIXED_SPEED_MULT) return;
  game.lastShot = now;

  const bounds = arena();
  let x = game.player.x;
  if (fireAim === "left") x = bounds.innerLeft + 8;
  if (fireAim === "right") x = bounds.innerRight - 8;
  game.bullets.push({
    x,
    y: game.player.y - 18,
    radius: ammo.size * 0.95,
    speed: 560,
    damage: bulletDamage(),
    color: ammo.color,
    vx: 0,
    vy: -560
  });
}

function setFireAim(aim) {
  fireAim = aim;
  document.querySelectorAll(".aim-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.aim === aim);
  });
}

function registerDoorHit(side) {
  const door = side === "left" ? game.leftDoor : game.rightDoor;
  if (!door || door.open) return;
  door.hits = Math.min(door.max, door.hits + 1);
  if (door.hits >= door.max) {
    door.open = true;
    floatingNotice(side === "left" ? "左鐵門開啟！" : "右鐵門開啟！", "#c9d6e8");
    const bounds = arena();
    const box = doorBox(side, bounds);
    game.pickups.push({
      x: box.x + box.w / 2,
      y: box.y + box.h * 0.55,
      vx: side === "left" ? 80 : -80,
      vy: 90,
      radius: 13,
      phase: random(0, 6),
      type: side === "left" ? "member" : "firerate"
    });
  }
  updateHud();
}

function updateBullets(dt) {
  const bounds = arena();
  const leftBox = doorBox("left", bounds);
  const rightBox = doorBox("right", bounds);

  for (let i = game.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = game.bullets[i];
    bullet.y += (bullet.vy || -bullet.speed) * dt;
    bullet.x += (bullet.vx || 0) * dt;

    if (!game.leftDoor.open && pointInBox(bullet, leftBox)) {
      registerDoorHit("left");
      burst(bullet.x, bullet.y, "#ffd27a", 5);
      game.bullets.splice(i, 1);
      continue;
    }
    if (!game.rightDoor.open && pointInBox(bullet, rightBox)) {
      registerDoorHit("right");
      burst(bullet.x, bullet.y, "#ffd27a", 5);
      game.bullets.splice(i, 1);
      continue;
    }

    const inOpenLeft = game.leftDoor.open && pointInBox(bullet, leftBox);
    const inOpenRight = game.rightDoor.open && pointInBox(bullet, rightBox);
    const outsideLane = bullet.x <= bounds.innerLeft || bullet.x >= bounds.innerRight;
    if (outsideLane && !inOpenLeft && !inOpenRight) {
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
  const bounds = arena();
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    enemy.phase += dt * 2.6;
    enemy.y += enemy.speed * dt;
    enemy.x += Math.sin(enemy.phase) * 5 * dt;
    enemy.x = clamp(enemy.x, bounds.innerLeft + enemy.radius, bounds.innerRight - enemy.radius);

    const canShoot = !enemy.big || enemy.shield <= 0;
    if (canShoot) {
      enemy.shootTimer -= dt * 1000;
      if (enemy.shootTimer <= 0 && enemy.y > 20 && enemy.y < view.height * 0.72) {
        const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
        // 敵方射速／彈速固定 2.5 倍，不再隨關卡狂加速
        const bulletSpeed = 210 * FIXED_SPEED_MULT;
        game.enemyBullets.push({
          x: enemy.x,
          y: enemy.y + enemy.radius,
          vx: Math.cos(angle) * bulletSpeed,
          vy: Math.sin(angle) * bulletSpeed,
          radius: enemy.big ? 4.5 : 3.5,
          damage: 1
        });
        enemy.shootTimer = (enemy.big ? random(320, 520) : random(900, 1400)) / FIXED_SPEED_MULT;
      }
    }

    if (distance(enemy, game.player) < enemy.radius + game.player.radius + 3 || enemy.y > view.height + 30) {
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
  } else if (pickup.type === "firerate") {
    burst(pickup.x, pickup.y, "#ffe45d", 14);
    floatingNotice(`射速固定 ${FIXED_SPEED_MULT} 倍！`, "#ffe45d");
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

function grantLevelReward(completedCount) {
  if (completedCount % 2 === 1) {
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

function totalClearedSubLevels() {
  return progress.chapterCleared.reduce((sum, value) => sum + value, 0);
}

function completeLevel() {
  game.betweenLevels = true;
  const chapter = game.chapter;
  const completedSub = game.subLevel;
  const goal = chapterGoal(chapter);
  const isNewClear = completedSub > getChapterCleared(chapter);
  const rewardText = isNewClear
    ? grantLevelReward(totalClearedSubLevels() + 1)
    : "這小關已通關過，繼續前進吧！";

  if (isNewClear) {
    setChapterCleared(chapter, completedSub);
  }

  progress.score = game.score;
  progress.stars = game.stars;
  progress.chapter = chapter;
  progress.subLevel = Math.min(Math.max(completedSub + 1, progress.subLevel), goal);
  saveProgress();
  updateHud();

  const chapterDone = getChapterCleared(chapter) >= goal;
  const nextChapter = chapter + 1;
  const unlockedNext = chapterDone && nextChapter <= MAX_CHAPTER && isChapterUnlocked(nextChapter);

  if (chapter === MAX_CHAPTER && chapterDone) {
    showVictory();
    return;
  }

  if (chapterDone && isNewClear) {
    const unlockText = unlockedNext
      ? `<br>已解鎖第 ${nextChapter} 章！主畫面現在會出現下一章。`
      : "";
    showMessage(
      `第 ${chapter} 章完成！`,
      `${rewardText}<br>你打完了全部 ${goal} 小關。${unlockText}<br>目前分數 ${game.score} 分、星星 ${game.stars} 顆。`,
      unlockedNext ? "前往下一章" : "回到關卡列表",
      () => {
        if (unlockedNext) openStageSelect(nextChapter);
        else returnToHome();
      }
    );
    return;
  }

  if (completedSub >= goal) {
    showMessage(
      `第 ${chapter} 章 · 第 ${completedSub} 關完成！`,
      `${rewardText}<br>${randomClearQuote()}<br>這一章已全部打通。<br>目前分數 ${game.score} 分、星星 ${game.stars} 顆。`,
      "回到關卡列表",
      () => returnToHome()
    );
    return;
  }

  const finishedPack = completedSub % PACK_SIZE === 0;
  const nextPack = packOfSubLevel(completedSub + 1);
  showMessage(
    `第 ${chapter} 章 · 第 ${completedSub} 關完成！`,
    `${rewardText}<br>${randomClearQuote()}<br>進度 ${getChapterCleared(chapter)} / ${goal}${finishedPack ? `<br>已解鎖第 ${nextPack} 組！` : ""}<br>目前分數 ${game.score} 分、星星 ${game.stars} 顆。`,
    finishedPack ? "前往下一組" : "進入下一關",
    () => {
      if (finishedPack) {
        progress.score = game.score;
        progress.stars = game.stars;
        progress.chapter = chapter;
        progress.subLevel = completedSub + 1;
        saveProgress();
        cancelAnimationFrame(animationId);
        animationId = 0;
        stopMusic();
        clearPraise();
        hideMessage();
        game = null;
        selectedChapter = chapter;
        selectedPack = nextPack;
        hideMenuScreens();
        openPackLevels(nextPack);
        return;
      }
      game.subLevel = completedSub + 1;
      progress.subLevel = game.subLevel;
      saveProgress();
      beginLevel();
    }
  );
}

function showVictory() {
  game.running = false;
  stopMusic();
  showPraise();
  showMessage(
    "全部通關！",
    `你打通了第 ${MAX_CHAPTER} 章的大巨人軍團！<br>總分 ${game.score} 分、星星 ${game.stars} 顆。`,
    "回到主畫面",
    () => returnToHome()
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
  progress.chapter = game.chapter;
  progress.subLevel = game.subLevel;
  saveProgress();
  showMessage(
    "藍色小隊全滅",
    `你停在第 ${game.chapter} 章第 ${game.subLevel} 小關，分數 ${game.score} 分。<br>裝備與進度都會保留，再來一次吧！`,
    "重新挑戰本關",
    () => {
      game = makeGame(game.chapter, game.subLevel);
      beginLevel();
    }
  );
}

function updateHud() {
  if (game) {
    ui.level.textContent = `${game.chapter}-${game.subLevel}`;
    ui.squad.textContent = game.squad.length;
    ui.score.textContent = game.score;
    ui.stars.textContent = game.stars;
    ui.speed.textContent = `${FIXED_SPEED_MULT.toFixed(1)}×`;
    ui.leftDoor.textContent = game.leftDoor.open ? "已開啟" : `${game.leftDoor.hits}/${game.leftDoor.max}`;
    ui.rightDoor.textContent = game.rightDoor.open ? "已開啟" : `${game.rightDoor.hits}/${game.rightDoor.max}`;
  }
  ui.gunName.textContent = currentGun().name;
  ui.ammoName.textContent = currentAmmo().name;
  updateHomeInfo();
}

function updateHomeInfo() {
  ui.homeLevel.textContent = `${highestUnlockedChapter()}`;
  ui.homeScore.textContent = progress.score;
  ui.homeStars.textContent = progress.stars;
}

function renderChapterList() {
  const items = [];
  for (let chapter = 1; chapter <= MAX_CHAPTER; chapter += 1) {
    if (!isChapterUnlocked(chapter)) break;
    const cleared = getChapterCleared(chapter);
    const goal = chapterGoal(chapter);
    const packs = packCount(chapter);
    const done = cleared >= goal;
    const current = !done && (chapter === progress.chapter || cleared > 0 || chapter === 1);
    items.push(`
      <button class="stage-item${done ? " cleared" : ""}${current && !done ? " current" : ""}"
        type="button" role="listitem" data-chapter="${chapter}">
        <span class="stage-item-index">${chapter}</span>
        <span class="stage-item-body">
          <span class="stage-item-title">第 ${chapter} 章</span>
          <span class="stage-item-meta">共 ${packs} 組（每組 ${PACK_SIZE} 關）· 進度 ${cleared} / ${goal}</span>
        </span>
        <span class="stage-item-status">${done ? "已通關" : cleared > 0 ? "繼續挑戰" : "開始挑戰"}</span>
      </button>
    `);
  }
  chapterList.innerHTML = items.join("");
}

function renderPackList() {
  const chapter = selectedChapter;
  const goal = chapterGoal(chapter);
  const cleared = getChapterCleared(chapter);
  const totalPacks = packCount(chapter);
  packSelectTitle.textContent = `第 ${chapter} 章 · 關卡組`;
  packSelectHint.textContent = `共 ${goal} 關，分成 ${totalPacks} 組，每組 ${PACK_SIZE} 關。打完一組才會解鎖下一組。`;

  const items = [];
  for (let pack = 1; pack <= totalPacks; pack += 1) {
    const range = packRange(pack);
    const unlocked = isPackUnlocked(chapter, pack);
    const packCleared = Math.max(0, Math.min(PACK_SIZE, cleared - (pack - 1) * PACK_SIZE));
    const done = packCleared >= PACK_SIZE;
    if (!unlocked) {
      items.push(`
        <button class="stage-item locked" type="button" role="listitem" disabled data-pack="${pack}">
          <span class="stage-item-index">${pack}</span>
          <span class="stage-item-body">
            <span class="stage-item-title">第 ${pack} 組</span>
            <span class="stage-item-meta">第 ${range.start}–${range.end} 關 · 尚未解鎖</span>
          </span>
          <span class="stage-item-status">鎖定</span>
        </button>
      `);
      break;
    }
    items.push(`
      <button class="stage-item${done ? " cleared" : ""}${!done && packCleared >= 0 ? " current" : ""}"
        type="button" role="listitem" data-pack="${pack}">
        <span class="stage-item-index">${pack}</span>
        <span class="stage-item-body">
          <span class="stage-item-title">第 ${pack} 組</span>
          <span class="stage-item-meta">第 ${range.start}–${range.end} 關 · 進度 ${packCleared} / ${PACK_SIZE}</span>
        </span>
        <span class="stage-item-status">${done ? "已通關" : packCleared > 0 ? "繼續" : "可挑戰"}</span>
      </button>
    `);
  }
  packList.innerHTML = items.join("");
}

function renderSubLevelList() {
  const chapter = selectedChapter;
  const pack = selectedPack;
  const range = packRange(pack);
  const cleared = getChapterCleared(chapter);
  stageSelectTitle.textContent = `第 ${chapter} 章 · 第 ${pack} 組`;
  stageSelectHint.textContent = `這一組是第 ${range.start}–${range.end} 關，共 ${PACK_SIZE} 關，可自由挑選挑戰。`;

  const items = [];
  for (let sub = range.start; sub <= range.end; sub += 1) {
    const isCleared = sub <= cleared;
    const localIndex = sub - range.start + 1;
    items.push(`
      <button class="stage-item${isCleared ? " cleared" : ""}"
        type="button" role="listitem" data-sub-level="${sub}">
        <span class="stage-item-index">${localIndex}</span>
        <span class="stage-item-body">
          <span class="stage-item-title">第 ${sub} 關</span>
          <span class="stage-item-meta">${sub === 1 ? "打掉 1 隻大怪即可過關" : `密集敵軍約 ${Math.min(Math.ceil(sub * 1.6), 120)} 隻 · 難度 ×${difficultyScale(chapter, sub)}`}</span>
        </span>
        <span class="stage-item-status">${isCleared ? "已通過" : "可挑戰"}</span>
      </button>
    `);
  }
  subLevelList.innerHTML = items.join("");
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

  // 側牆區塊
  ctx.fillStyle = "#04101fbb";
  ctx.fillRect(0, 0, bounds.innerLeft, view.height);
  ctx.fillRect(bounds.innerRight, 0, view.width - bounds.innerRight, view.height);

  // 中間窄樓梯
  const stepH = 22;
  for (let y = 0, i = 0; y < view.height; y += stepH, i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#1d4f6ecc" : "#163d56cc";
    ctx.fillRect(bounds.innerLeft, y, bounds.corridor, stepH);
    ctx.strokeStyle = "#ffffff22";
    ctx.beginPath();
    ctx.moveTo(bounds.innerLeft, y + stepH);
    ctx.lineTo(bounds.innerRight, y + stepH);
    ctx.stroke();
  }

  drawWall(bounds.left, bounds.thickness, 1, "left");
  drawWall(bounds.right, bounds.thickness, -1, "right");
  drawDoor("left", bounds);
  drawDoor("right", bounds);

  // 上方狀態條
  ctx.fillStyle = "#07162de6";
  ctx.fillRect(bounds.innerLeft, 8, bounds.corridor, 36);
  ctx.fillStyle = "#d7e8ff";
  ctx.font = "800 11px Microsoft JhengHei";
  ctx.textAlign = "center";
  const leftText = game.leftDoor.open ? "左門已開" : `左門 ${game.leftDoor.hits}/580`;
  const rightText = game.rightDoor.open ? "右門已開" : `右門 ${game.rightDoor.hits}/580`;
  ctx.fillText(leftText, bounds.mid - bounds.corridor * 0.28, 24);
  ctx.fillText("窄道樓梯", bounds.mid, 24);
  ctx.fillText(rightText, bounds.mid + bounds.corridor * 0.28, 24);
  ctx.fillStyle = "#9eb6d0";
  ctx.font = "700 10px Microsoft JhengHei";
  ctx.fillText(`雙方射速固定 ${FIXED_SPEED_MULT} 倍`, bounds.mid, 38);
}

function drawDoor(side, bounds) {
  const door = side === "left" ? game.leftDoor : game.rightDoor;
  const box = doorBox(side, bounds);
  const ratio = door.hits / door.max;
  const cx = box.x + box.w / 2;
  const cy = box.y + 16;
  ctx.save();
  if (door.open) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#8fa4b866";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = "#c5d4e4";
  } else {
    // 鐵門配色
    const iron = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y);
    iron.addColorStop(0, "#3a4552");
    iron.addColorStop(0.45, "#7b8796");
    iron.addColorStop(1, "#2b333d");
    ctx.fillStyle = iron;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = "#1c222a";
    for (let y = box.y + 28; y < box.y + box.h - 24; y += 14) {
      ctx.fillRect(box.x + 5, y, box.w - 10, 3);
    }
    ctx.fillStyle = "#d7e3f0";
    ctx.fillRect(box.x + 4, box.y + box.h - 18, (box.w - 8) * ratio, 7);
    ctx.strokeStyle = "#aeb9c7";
  }
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);

  // 門上旋轉輪
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(door.spin || 0);
  ctx.strokeStyle = "#d5dee8";
  ctx.fillStyle = "#5c6775";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const a = (Math.PI / 2) * i;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
    ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#eef5ff";
  ctx.font = "900 12px Microsoft JhengHei";
  ctx.textAlign = "center";
  ctx.fillText(door.open ? "開" : `${door.hits}`, cx, box.y + box.h * 0.55);
  ctx.font = "800 10px Microsoft JhengHei";
  ctx.fillStyle = "#b7c4d4";
  ctx.fillText(door.open ? "鐵門" : `/ ${door.max}`, cx, box.y + box.h * 0.55 + 14);
  ctx.restore();
}

function drawWall(x, thickness, inward, side) {
  const brick = 26;
  const box = side ? doorBox(side) : null;
  const wallLeft = x - thickness / 2;
  const wallRight = x + thickness / 2;

  // 整面牆，但門位挖凹槽（去掉一塊淺色牆）
  ctx.fillStyle = "#8d9bab";
  ctx.fillRect(wallLeft, 0, thickness, view.height);
  if (box) {
    const notchX = side === "left" ? Math.min(wallLeft, box.x) : Math.max(wallLeft, box.x - 2);
    const notchRight = side === "left" ? Math.min(wallRight + 8, box.x + box.w) : wallRight;
    const notchW = Math.max(10, notchRight - notchX);
    ctx.fillStyle = "#121820";
    ctx.fillRect(notchX, box.y - 4, notchW, box.h + 8);
    ctx.strokeStyle = "#2a3542";
    ctx.strokeRect(notchX + 0.5, box.y - 3.5, notchW - 1, box.h + 7);
  }

  ctx.fillStyle = "#6d7b8b";
  for (let y = 0; y < view.height; y += brick) {
    if (box && y + brick > box.y && y < box.y + box.h) continue;
    ctx.fillRect(wallLeft, y + brick - 3, thickness, 3);
  }
  ctx.fillStyle = "#b6c4d1";
  for (let y = 6; y < view.height; y += brick * 2) {
    if (box && y + brick > box.y && y < box.y + box.h) continue;
    ctx.fillRect(x + inward * (thickness / 2 - 5), y, 5, brick);
  }
  ctx.fillStyle = "#cfdae6";
  ctx.fillRect(wallLeft, 0, thickness, 3);
}

function drawDispensers() {
  const bounds = arena();
  game.dispensers.forEach((dispenser) => {
    const spot = dispenserSpot(dispenser, bounds);
    const info = dispenserInfo(dispenser.type);
    const width = dispenser.zone === "middle"
      ? Math.min(84, bounds.corridor * 0.9)
      : Math.min(72, Math.max(48, (bounds.innerLeft) * 0.55));
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
  const u = SQUAD_SCALE;
  for (let i = visible - 1; i >= 0; i -= 1) {
    const row = Math.floor(i / 5);
    const column = i % 5;
    const rowCount = Math.min(5, visible - row * 5);
    const offsetX = (column - (rowCount - 1) / 2) * 12;
    const offsetY = row * 11;
    const x = game.player.x + offsetX;
    const y = game.player.y + offsetY;

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
    ctx.fillRect(9 * u, 3 * u, 18 * u, 4 * u);
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
    const width = 48;
    ctx.fillStyle = "#072238";
    ctx.fillRect(game.player.x - width / 2, game.player.y + 22, width, 5);
    ctx.fillStyle = "#46e991";
    ctx.fillRect(game.player.x - width / 2, game.player.y + 22, width * Math.max(0, active.hp / active.maxHp), 5);
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
    ctx.fillText(pickup.type === "member" ? "+1" : "速", pickup.x, pickup.y + 3);
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
  returnToHome();
}

function resetProgress() {
  progress = {
    score: 0,
    stars: 0,
    gunsOwned: 1,
    ammosOwned: 1,
    gunIndex: 0,
    ammoIndex: 0,
    chapterCleared: defaultChapterCleared(),
    chapter: 1,
    subLevel: 1
  };
  selectedChapter = 1;
  saveProgress();
  updateHomeInfo();
  renderChapterList();
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

pauseButton.addEventListener("click", togglePause);
musicButton.addEventListener("click", toggleMusic);
document.querySelector("#homeButton").addEventListener("click", () => {
  if (selectedPack && isPackUnlocked(selectedChapter, selectedPack)) returnToStageSelect();
  else returnToPackSelect();
});
document.querySelector("#backToHomeFromPackButton").addEventListener("click", returnToHome);
document.querySelector("#backToPackButton").addEventListener("click", () => {
  hideMenuScreens();
  packSelectScreen.hidden = false;
  renderPackList();
});
document.querySelector("#rulesButton").addEventListener("click", () => rulesDialog.showModal());
document.querySelector("#resetButton").addEventListener("click", resetProgress);

chapterList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-chapter]");
  if (!item) return;
  openStageSelect(Number(item.dataset.chapter));
});

packList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-pack]");
  if (!item || item.disabled) return;
  openPackLevels(Number(item.dataset.pack));
});

subLevelList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-sub-level]");
  if (!item) return;
  startGame(selectedChapter, Number(item.dataset.subLevel));
});
document.querySelector("#arsenalButton").addEventListener("click", () => {
  renderArsenal();
  arsenalDialog.showModal();
});
document.querySelector("#openArsenal").addEventListener("click", () => {
  renderArsenal();
  arsenalDialog.showModal();
});

document.querySelectorAll(".aim-button").forEach((button) => {
  button.addEventListener("click", () => setFireAim(button.dataset.aim));
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
  game.player.x = clamp(event.clientX - rect.left, bounds.innerLeft + 16, bounds.innerRight - 16);
  game.player.y = clamp(event.clientY - rect.top, view.height * 0.68, view.height - 28);
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
renderChapterList();
renderArsenal();
ui.gunName.textContent = currentGun().name;
ui.ammoName.textContent = currentAmmo().name;
