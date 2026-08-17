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
const shopDialog = document.querySelector("#shopDialog");
const shopBody = document.querySelector("#shopBody");
const itemHotbar = document.querySelector("#itemHotbar");
const skipWallButton = document.querySelector("#skipWallButton");
const continueWallButton = document.querySelector("#continueWallButton");
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
  shield: document.querySelector("#shieldValue"),
  laser: document.querySelector("#laserValue"),
  bomb: document.querySelector("#bombValue"),
  leftDoor: document.querySelector("#leftDoorValue"),
  rightDoor: document.querySelector("#rightDoorValue"),
  gunName: document.querySelector("#gunName"),
  ammoName: document.querySelector("#ammoName"),
  homeLevel: document.querySelector("#homeLevel"),
  homeScore: document.querySelector("#homeScore"),
  homeStars: document.querySelector("#homeStars"),
  homeCC: document.querySelector("#homeCC"),
  cc: document.querySelector("#ccValue"),
  shopCC: document.querySelector("#shopCC"),
  shopOwned: document.querySelector("#shopOwned")
};

const MAX_CHAPTER = 10;
const MEMBER_HP = 50;
const DOOR_HITS_NEEDED = 100;
const PACK_SIZE = 10;
const SQUAD_SCALE = 0.68;
const FIXED_SPEED_MULT = 2.5;
const PLAYER_MOVE_MULT = 0.14;
const PLAYER_BULLET_MULT = 1.5;
const CARRIER_HP = 50;
const CARRIER_HIT = 5;
const CARRIER_SPEED = 88;
const BATTLE_BOOST_TIME = 8;
const SPRINT_BOOST_TIME = 6;
const STAR_POWER_COST = 1;
const SHOP_ROOM_SLOTS = 27;
const HOTBAR_SLOTS = 9;
const SHIELD_PLATES = [12, 9, 13, 6, 5, 4, 3, 2, 1];
const LASER_DAMAGE = 7;
const LASER_DURATION = 10;
const SHIELD_DURATION = 30;
const BOMB_FUSE = 1;
const EDGE_HOLD = 0.7;
const SHOP_ITEMS = [
  { id: "shieldBlue", name: "藍色防護罩", detail: "30 秒，前排 12–1", cost: 1 },
  { id: "shieldWhite", name: "白色防護罩", detail: "30 秒白罩", cost: 1 },
  { id: "shieldRed", name: "紅色防護罩", detail: "30 秒紅罩", cost: 1 },
  { id: "laser", name: "雷射", detail: "10 秒、傷害 7", cost: 1 },
  { id: "bomb", name: "巨型炸彈", detail: "1 秒後砰", cost: 1 }
];
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
let usingPointer = false;
let pointerTargetX = null;
let pointerTargetY = null;
let pointerPushSide = null;
let selectedShopId = "shieldBlue";
let pendingAdvance = null;
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
    subLevel: 1,
    leftWallBroken: false,
    rightWallBroken: false,
    leftWallCleared: false,
    rightWallCleared: false,
    cc: 1,
    shopItem: null,
    shopRoom: []
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
      subLevel,
      leftWallBroken: Boolean(saved.leftWallBroken),
      rightWallBroken: Boolean(saved.rightWallBroken),
      leftWallCleared: Boolean(saved.leftWallCleared),
      rightWallCleared: Boolean(saved.rightWallCleared),
      cc: saved.cc == null ? 1 : Math.max(0, Number(saved.cc) || 0),
      shopItem: null,
      shopRoom: normalizeShopRoom(saved)
    };
  } catch (error) {
    return fallback;
  }
}

function normalizeShopRoom(saved) {
  const allowed = new Set(SHOP_ITEMS.map((item) => item.id));
  const room = Array.isArray(saved?.shopRoom)
    ? saved.shopRoom.filter((id) => allowed.has(id))
    : [];
  if (!room.length && saved?.shopItem && allowed.has(saved.shopItem)) {
    room.push(saved.shopItem);
  }
  return room.slice(0, SHOP_ROOM_SLOTS);
}

function shopItemMeta(id) {
  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item) return { id, name: "空", short: "", color: "#8b8b8b" };
  if (id === "shieldBlue") return { ...item, short: "藍", color: "#4db7ff" };
  if (id === "shieldWhite") return { ...item, short: "白", color: "#f4f8ff" };
  if (id === "shieldRed") return { ...item, short: "紅", color: "#ff536d" };
  if (id === "laser") return { ...item, short: "雷", color: "#ff6a3c" };
  return { ...item, short: "彈", color: "#7ec8ff" };
}

function squadHpTotal() {
  if (!game) return MEMBER_HP;
  return game.squad.reduce((sum, member) => sum + member.hp, 0);
}

function isStarPickup(pickup) {
  return pickup?.type === "starSmall" || pickup?.type === "starBig";
}

function hasStarPickups() {
  return game?.pickups?.some((pickup) => isStarPickup(pickup) && !pickup.cosmetic) ?? false;
}

function trySpendStar() {
  const available = game ? game.stars : progress.stars;
  if ((available || 0) < STAR_POWER_COST) {
    floatingNotice("星星不夠！需要 1 顆", "#ffd83d");
    return false;
  }
  if (game) {
    game.stars -= STAR_POWER_COST;
    progress.stars = game.stars;
  } else {
    progress.stars -= STAR_POWER_COST;
  }
  saveProgress();
  updateHud();
  return true;
}

function useStarSprint() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  game.sprintTimer = SPRINT_BOOST_TIME;
  floatingNotice(`加速 ${SPRINT_BOOST_TIME} 秒！`, "#9fd8ff");
}

function useStarShield() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  activateShield("blue");
}

function useStarLaser() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  activateLaser();
}

function useStarBomb() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  activateBomb();
}

function useStarMember() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  game.squad.push({ hp: MEMBER_HP, maxHp: MEMBER_HP });
  burst(game.player.x, game.player.y, "#58e6ff", 14);
  floatingNotice("增員 +1！", "#58e6ff");
  updateHud();
}

function useStarHeal() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  game.squad.forEach((member) => {
    member.hp = member.maxHp;
  });
  burst(game.player.x, game.player.y, "#ff8ec4", 14);
  floatingNotice("補血！全隊回滿", "#ff8ec4");
  updateHud();
}

function useStarBulletBoost() {
  if (!game || game.over || game.falling || game.betweenLevels || game.paused) return;
  if (!trySpendStar()) return;
  game.battleBoost = BATTLE_BOOST_TIME;
  floatingNotice(`子彈加速 ${BATTLE_BOOST_TIME} 秒！`, "#ffe45d");
  updateHud();
}

function grantStars(amount, x, y) {
  if (!game || amount <= 0) return;
  game.stars += amount;
  progress.stars = game.stars;
  saveProgress();
  if (x != null && y != null) burst(x, y, "#ffd83d", amount >= 5 ? 18 : 12);
  floatingNotice(`星星 +${amount}`, "#ffd83d");
  updateHud();
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
    dispensers: [],
    leftDoor: { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 },
    rightDoor: { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 },
    speedLevel: 0,
    battleBoost: 0,
    sprintTimer: 0,
    lastShot: 0,
    spawnTimer: 0,
    spawned: 0,
    enemyTotal: 0,
    edgeTimer: 0,
    falling: false,
    fallVy: 0,
    walls: {
      left: { broken: Boolean(progress.leftWallBroken), cleared: Boolean(progress.leftWallCleared) },
      right: { broken: Boolean(progress.rightWallBroken), cleared: Boolean(progress.rightWallCleared) }
    },
    shield: { active: false, time: 0, color: "blue", plates: [] },
    laser: { active: false, time: 0, pulse: 0 },
    bomb: { active: false, time: 0 },
    expectCCRefund: false,
    refundKinds: [],
    running: true,
    paused: false,
    over: false,
    betweenLevels: false
  };
}

function arena() {
  const corridor = clamp(view.width * 0.52, 180, 360);
  const mid = view.width / 2;
  const innerLeft = mid - corridor / 2;
  const innerRight = mid + corridor / 2;
  const thickness = clamp((view.width - corridor) * 0.28, 36, 90);
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
  // 第 1 小關仍是 1 隻大怪；之後敵人不那麼密
  game.enemyTotal = allBig
    ? Math.min(Math.max(1, Math.ceil(game.subLevel / 40)), 16)
    : Math.min(Math.max(1, Math.ceil(game.subLevel * 0.85)), 36);
  game.spawned = 0;
  game.spawnTimer = 160;
  game.enemies.length = 0;
  game.bullets.length = 0;
  game.enemyBullets.length = 0;
  game.pickups.length = 0;
  game.particles.length = 0;
  game.leftDoor = { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 };
  game.rightDoor = { hits: 0, max: DOOR_HITS_NEEDED, open: false, spin: 0 };
  game.battleBoost = 0;
  game.sprintTimer = 0;
  game.edgeTimer = 0;
  game.falling = false;
  game.fallVy = 0;
  game.walls = {
    left: { broken: Boolean(progress.leftWallBroken), cleared: Boolean(progress.leftWallCleared) },
    right: { broken: Boolean(progress.rightWallBroken), cleared: Boolean(progress.rightWallCleared) }
  };
  game.shield = { active: false, time: 0, color: "blue", plates: [] };
  game.laser = { active: false, time: 0, pulse: 0 };
  game.bomb = { active: false, time: 0 };
  game.expectCCRefund = false;
  if (game.refundKinds?.length) {
    progress.cc = 1;
    saveProgress();
  }
  game.refundKinds = [];
  game.dispensers = makeDoorDispensers();
  renderItemHotbar();
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
  updatePowers(dt);
  updateDispensers(dt);
  spawnEnemies(dt);
  if (!game.falling) shoot(now);
  updateBullets(dt);
  updateEnemies(dt);
  updateEnemyBullets(dt);
  updatePickups(dt);
  updateParticles(dt);
  game.leftDoor.spin += dt * 2.8;
  game.rightDoor.spin += dt * 2.8;

  if (game.spawned >= game.enemyTotal && game.enemies.length === 0 && !hasStarPickups() && !game.over && !game.falling) {
    completeLevel();
  }
}

function playerMoveSpeed() {
  return Math.max(96, view.width * PLAYER_MOVE_MULT);
}

function movePlayerToward(targetX, targetY, speed, dt) {
  const dx = targetX - game.player.x;
  const dy = targetY - game.player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) {
    game.player.x = targetX;
    game.player.y = targetY;
    return;
  }
  const step = Math.min(speed * dt, dist);
  game.player.x += (dx / dist) * step;
  game.player.y += (dy / dist) * step;
}

function updatePlayer(dt) {
  const bounds = arena();
  if (game.falling) {
    game.fallVy += 980 * dt;
    game.player.y += game.fallVy * dt;
    game.player.x += (game.player.x < bounds.mid ? -40 : 40) * dt;
    if (game.player.y > view.height + 40) fallToDeath();
    return;
  }

  if (game.sprintTimer > 0) {
    game.sprintTimer = Math.max(0, game.sprintTimer - dt);
  }

  const sprintMult = game.sprintTimer > 0 ? 2.3 : 1;
  const speed = playerMoveSpeed() * sprintMult;
  const leftEdge = bounds.innerLeft + 16;
  const rightEdge = bounds.innerRight - 16;
  const minY = view.height * 0.68;
  const maxY = view.height - 28;

  if (usingPointer && pointerTargetX != null) {
    movePlayerToward(pointerTargetX, pointerTargetY ?? game.player.y, speed, dt);
    if (pointerPushSide === "left" && game.player.x <= leftEdge + 1.5) {
      tryPushBrokenWall("left");
    } else if (pointerPushSide === "right" && game.player.x >= rightEdge - 1.5) {
      tryPushBrokenWall("right");
    }
  } else {
    if (keys.left) game.player.x -= speed * dt;
    if (keys.right) game.player.x += speed * dt;
    if (keys.back) game.player.y += speed * 0.58 * dt;
    if (!keys.back) {
      const homeY = view.height - 52;
      game.player.y += (homeY - game.player.y) * Math.min(1, dt * 3.2);
    }
  }

  // 按鍵／螢幕按鈕操作：只在通道內移動，不會撞牆、也不會掉下去
  game.player.x = clamp(game.player.x, leftEdge, rightEdge);
  game.player.y = clamp(game.player.y, minY, maxY);
  if (game.player.x > leftEdge + 8 && game.player.x < rightEdge - 8) {
    markWallsCleared();
  }
}

function markWallsCleared() {
  if (!game.walls) return;
  let changed = false;
  if (game.walls.left.broken && !game.walls.left.cleared) {
    game.walls.left.cleared = true;
    changed = true;
  }
  if (game.walls.right.broken && !game.walls.right.cleared) {
    game.walls.right.cleared = true;
    changed = true;
  }
  if (changed) persistWalls();
}

function persistWalls() {
  progress.leftWallBroken = game.walls.left.broken;
  progress.rightWallBroken = game.walls.right.broken;
  progress.leftWallCleared = game.walls.left.cleared;
  progress.rightWallCleared = game.walls.right.cleared;
  saveProgress();
}

function smashWall(side) {
  const wall = game.walls[side];
  if (wall.broken) return;
  wall.broken = true;
  wall.cleared = false;
  persistWalls();
  const bounds = arena();
  const x = side === "left" ? bounds.innerLeft : bounds.innerRight;
  burst(x, game.player.y, "#e8eef4", 28);
  burst(x, game.player.y, "#9aa8b6", 16);
  floatingNotice("白色城牆撞爛了！再過來就會掉下去", "#e8eef4");
}

function tryPushBrokenWall(side) {
  const wall = game.walls[side];
  if (!wall.broken) {
    smashWall(side);
    return false;
  }
  if (wall.cleared) {
    startFalling();
    return true;
  }
  return false;
}

function startFalling() {
  if (game.falling || game.over) return;
  game.falling = true;
  game.fallVy = 40;
  floatingNotice("從破牆掉下去了！", "#ffd27a");
}

function stripWeapons() {
  progress.gunsOwned = 1;
  progress.ammosOwned = 1;
  progress.gunIndex = 0;
  progress.ammoIndex = 0;
  saveProgress();
  updateHud();
}

function fallToDeath() {
  if (game.over) return;
  stripWeapons();
  floatingNotice("槍跟子彈全部掉光，只剩一開始的練習手槍！", "#ff7187");
  game.falling = false;
  game.fallVy = 0;
  const bounds = arena();
  game.player.x = bounds.mid;
  game.player.y = view.height - 52;
  if (game.squad.length > 0) game.squad.pop();
  updateHud();
  if (game.squad.length === 0) {
    endGame();
    return;
  }
  burst(game.player.x, game.player.y, "#ff536d", 16);
}

function activateShield(color) {
  game.shield = {
    active: true,
    time: SHIELD_DURATION,
    color,
    plates: SHIELD_PLATES.map((hp) => ({ hp, max: hp }))
  };
  floatingNotice(color === "blue" ? "藍色防護罩 30 秒！" : color === "white" ? "白色防護罩 30 秒！" : "紅色防護罩 30 秒！", shieldColor(color));
}

function shieldColor(color) {
  if (color === "white") return "#f4f8ff";
  if (color === "red") return "#ff536d";
  return "#4db7ff";
}

function shieldRowBox() {
  const width = 168;
  const height = 16;
  return {
    x: game.player.x - width / 2,
    y: game.player.y - 36,
    w: width,
    h: height
  };
}

function hitShieldPlates(amount) {
  if (!game.shield.active) return false;
  while (amount > 0 && game.shield.plates.length) {
    const plate = game.shield.plates[0];
    const take = Math.min(plate.hp, amount);
    plate.hp -= take;
    amount -= take;
    if (plate.hp <= 0) game.shield.plates.shift();
  }
  if (!game.shield.plates.length) {
    game.shield.active = false;
    game.shield.time = 0;
    floatingNotice("防護罩破了！", "#9fd8ff");
  }
  return true;
}

function activateLaser() {
  game.laser.active = true;
  game.laser.time = LASER_DURATION;
  game.laser.pulse = 0;
  floatingNotice("雷射 10 秒！一排打過去", "#ff6a3c");
}

function activateBomb() {
  game.bomb.active = true;
  game.bomb.time = BOMB_FUSE;
  floatingNotice("巨型炸彈 1 秒！", "#7ec8ff");
}

function explodeBomb() {
  game.bomb.active = false;
  game.bomb.time = 0;
  burst(game.player.x, game.player.y - 40, "#9fd8ff", 40);
  floatingNotice("砰！巨人掉下去了！", "#ffe45d");
  game.enemies.forEach((enemy) => {
    enemy.falling = true;
    enemy.speed = 420;
  });
  game.shield.color = "blue";
  if (game.shield.active) {
    game.shield.plates = SHIELD_PLATES.map((hp) => ({ hp, max: hp }));
    game.shield.time = Math.max(game.shield.time, 8);
  } else {
    activateShield("blue");
  }
  maybeRefundShopCC();
}

function fireLaserRow() {
  const beam = laserBeamBox();
  for (let e = game.enemies.length - 1; e >= 0; e -= 1) {
    const enemy = game.enemies[e];
    if (enemy.falling) continue;
    if (rectHitsCircle(beam, enemy)) {
      hitEnemy(e, enemy, { damage: LASER_DAMAGE, color: "#ff4d2e" });
    }
  }
  for (let i = game.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = game.pickups[i];
    if (!isDoorCarrier(pickup)) continue;
    if (rectHitsCircle(beam, pickup)) {
      hurtDoorCarrier(i, pickup, LASER_DAMAGE);
    }
  }
}

function laserBeamBox(bounds = arena()) {
  const thickness = 34;
  if (fireAim === "left") {
    return { x: 0, y: game.player.y - 28, w: game.player.x, h: thickness };
  }
  if (fireAim === "right") {
    return { x: game.player.x, y: game.player.y - 28, w: view.width - game.player.x, h: thickness };
  }
  return {
    x: game.player.x - thickness / 2,
    y: 0,
    w: thickness,
    h: game.player.y - 8
  };
}

function rectHitsCircle(box, circle) {
  const nx = clamp(circle.x, box.x, box.x + box.w);
  const ny = clamp(circle.y, box.y, box.y + box.h);
  return Math.hypot(circle.x - nx, circle.y - ny) < circle.radius;
}

function updatePowers(dt) {
  if (game.shield.active) {
    game.shield.time -= dt;
    if (game.shield.time <= 0 || !game.shield.plates.length) {
      game.shield.active = false;
      game.shield.time = 0;
      game.shield.plates = [];
      maybeRefundShopCC();
    }
  }
  if (game.laser.active) {
    game.laser.time -= dt;
    game.laser.pulse += dt;
    if (game.laser.pulse >= 0.16) {
      game.laser.pulse = 0;
      fireLaserRow();
    }
    if (game.laser.time <= 0) {
      game.laser.active = false;
      game.laser.time = 0;
      maybeRefundShopCC();
    }
  }
  if (game.battleBoost > 0) {
    game.battleBoost = Math.max(0, game.battleBoost - dt);
  }
  if (game.bomb.active) {
    game.bomb.time -= dt;
    if (game.bomb.time <= 0) explodeBomb();
  }
}

function makeDoorDispensers() {
  return [
    { type: "member", side: "left", timer: 0.12, interval: 7.2 },
    { type: "heal", side: "right", timer: 0.12, interval: 6.8 },
    { type: "firerate", side: "either", timer: 1.6, interval: 8.4 }
  ];
}

function dispenserOpenSide(dispenser) {
  if (dispenser.side === "left") return game.leftDoor.open ? "left" : null;
  if (dispenser.side === "right") return game.rightDoor.open ? "right" : null;
  const open = [];
  if (game.leftDoor.open) open.push("left");
  if (game.rightDoor.open) open.push("right");
  if (!open.length) return null;
  return open[Math.floor(Math.random() * open.length)];
}

function isDoorCarrier(pickup) {
  return Boolean(pickup && pickup.carrier);
}

function spawnDoorCarrier(type, side) {
  const bounds = arena();
  const box = doorBox(side, bounds);
  const speed = type === "member" ? CARRIER_SPEED * FIXED_SPEED_MULT : CARRIER_SPEED;
  const hp = CARRIER_HP * Math.max(1, game.squad.length);
  const liveMembers = game.pickups.filter((item) => item.carrier && item.type === "member").length;
  if (type === "member" && liveMembers >= Math.max(1, game.squad.length)) return;
  game.pickups.push({
    x: box.x + box.w / 2,
    y: box.y + box.h * 0.58,
    vx: side === "left" ? speed : -speed,
    vy: 0,
    radius: 17,
    hp,
    maxHp: hp,
    carrier: true,
    phase: random(0, 6),
    type
  });
}

function hurtDoorCarrier(index, pickup, amount) {
  pickup.hp -= amount;
  burst(pickup.x, pickup.y, dispenserInfo(pickup.type).color, 6);
  if (pickup.hp > 0) return false;
  collectPickup(pickup);
  game.pickups.splice(index, 1);
  return true;
}

function updateDispensers(dt) {
  if (!game || game.falling || game.over) return;
  game.dispensers.forEach((dispenser) => {
    const side = dispenserOpenSide(dispenser);
    if (!side) return;
    dispenser.timer -= dt;
    if (dispenser.timer > 0) return;
    dispenser.timer = dispenser.interval;
    spawnDoorCarrier(dispenser.type, side);
  });
}

function maybeRefundShopCC() {
  if (!game || !Array.isArray(game.refundKinds) || !game.refundKinds.length) return;
  game.refundKinds = game.refundKinds.filter((kind) => {
    if (kind === "laser" && game.laser.active) return true;
    if (kind === "bomb" && game.bomb.active) return true;
    if (String(kind).startsWith("shield") && game.shield.active) return true;
    grantCCOnUseUp();
    return false;
  });
}

function shopItemName(id) {
  return SHOP_ITEMS.find((item) => item.id === id)?.name || "尚未購買";
}

function roomItemSummary() {
  if (!progress.shopRoom?.length) return "房間是空的";
  const counts = {};
  progress.shopRoom.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([id, count]) => `${shopItemName(id)}${count > 1 ? `×${count}` : ""}`)
    .join("、");
}

function mcSlotButton(id, extraClass = "", disabled = false) {
  const meta = shopItemMeta(id);
  const filled = Boolean(id);
  return `
    <button class="mc-slot${filled ? " filled" : ""}${extraClass}" type="button" ${id ? `data-shop-item="${id}"` : ""} ${disabled ? "disabled" : ""}>
      ${filled ? `<span class="mc-slot-icon" style="background:${meta.color}">${meta.short}</span>` : ""}
    </button>`;
}

function activateBoughtItem(id) {
  if (id === "shieldBlue") activateShield("blue");
  else if (id === "shieldWhite") activateShield("white");
  else if (id === "shieldRed") activateShield("red");
  else if (id === "laser") activateLaser();
  else if (id === "bomb") activateBomb();
}

function shopTypeCount(id) {
  return (progress.shopRoom || []).filter((entry) => entry === id).length;
}

function selectShopItem(id) {
  if (!SHOP_ITEMS.some((item) => item.id === id)) return;
  selectedShopId = id;
  renderShop();
}

function deployRoomItemByType(id) {
  const index = progress.shopRoom.indexOf(id);
  if (index === -1) {
    floatingNotice(`還沒有${shopItemName(id)}，請先到商店購買`, "#ffd83d");
    return;
  }
  deployRoomItem(index);
}

function deployRoomItem(index) {
  if (!game || game.over || game.falling) {
    floatingNotice("進關後按格子才會播出", "#ffd83d");
    return;
  }
  const id = progress.shopRoom[index];
  if (!id) return;
  progress.shopRoom.splice(index, 1);
  game.refundKinds = game.refundKinds || [];
  game.refundKinds.push(id);
  saveProgress();
  activateBoughtItem(id);
  renderShop();
  renderItemHotbar();
  updateHud();
  floatingNotice(`${shopItemName(id)}播出了！`, shopItemMeta(id).color);
}

function grantCCOnUseUp() {
  progress.cc = 1;
  saveProgress();
  updateHud();
  renderShop();
  renderItemHotbar();
  floatingNotice("用完了，獲得 1 顆 CC", "#ffd83d");
}

function showServiceCart(id) {
  const cartItem = document.querySelector("#serviceCartItem");
  if (!cartItem) return;
  const meta = shopItemMeta(id);
  cartItem.textContent = meta.short;
  cartItem.style.background = meta.color;
  cartItem.classList.remove("loaded");
  void cartItem.offsetWidth;
  cartItem.classList.add("loaded");
}

function buyShopItem(id) {
  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item) return;
  selectedShopId = item.id;
  if (!Array.isArray(progress.shopRoom)) progress.shopRoom = [];
  if (progress.shopRoom.length >= SHOP_ROOM_SLOTS) {
    floatingNotice("房間已經滿了！", "#ffd83d");
    renderShop();
    return;
  }
  if ((progress.stars || 0) < STAR_POWER_COST) {
    floatingNotice("星星不夠！需要 1 顆", "#ffd83d");
    renderShop();
    return;
  }
  progress.stars -= STAR_POWER_COST;
  if (game) game.stars = progress.stars;
  progress.shopRoom.push(item.id);
  saveProgress();
  renderShop();
  renderItemHotbar();
  updateHud();
  showServiceCart(item.id);
  floatingNotice(`已購買${item.name}，送到房間了`, item.id.includes("shield") ? "#4db7ff" : "#ffd83d");
}

function renderShop() {
  if (!shopBody) return;
  if (!Array.isArray(progress.shopRoom)) progress.shopRoom = [];
  if (ui.shopCC) ui.shopCC.textContent = String(progress.stars || 0);
  if (ui.shopOwned) ui.shopOwned.textContent = roomItemSummary();
  const shopSlots = Array.from({ length: 9 }, (_, index) => {
    const item = SHOP_ITEMS[index];
    if (!item) return mcSlotButton("", "", true);
    const selected = selectedShopId === item.id ? " selected" : "";
    return `
      <button class="mc-slot filled${selected}" type="button" data-shop-item="${item.id}" title="${item.name}">
        <span class="mc-slot-icon" style="background:${shopItemMeta(item.id).color}">${shopItemMeta(item.id).short}</span>
      </button>`;
  }).join("");
  const roomSlots = Array.from({ length: SHOP_ROOM_SLOTS }, (_, index) => {
    const owned = progress.shopRoom[index];
    if (owned) {
      const meta = shopItemMeta(owned);
      return `<div class="mc-slot filled room-owned" title="已買：${shopItemName(owned)}">
        <span class="mc-slot-icon" style="background:${meta.color}">${meta.short}</span>
      </div>`;
    }
    const stock = SHOP_ITEMS[index % SHOP_ITEMS.length];
    const meta = shopItemMeta(stock.id);
    return `<div class="mc-slot filled room-stock" title="${stock.name}">
      <span class="mc-slot-icon dim" style="background:${meta.color}">${meta.short}</span>
    </div>`;
  }).join("");
  shopBody.innerHTML = `
    <div class="mc-chest">
      <p class="mc-chest-label">選商品（藍／白／紅／雷／彈）→ 按彩虹購買</p>
      <div class="mc-grid">${shopSlots}</div>
      <button id="buyRainbowButton" class="rainbow-buy-button" type="button">
        <span>購買</span>
        <small>1 星星</small>
      </button>
      <div class="mc-service-cart" id="serviceCart">
        <div class="mc-cart-item loaded" id="serviceCartItem">${shopItemMeta(progress.shopRoom.at(-1) || selectedShopId).short}</div>
        <div class="mc-cart-bed"></div>
        <div class="mc-cart-body"></div>
        <div class="mc-cart-wheels"><span></span><span></span></div>
        <p>服務車</p>
      </div>
      <p class="mc-chest-label">裡面的房間（格子都是滿的）</p>
      <div class="mc-grid room-grid">${roomSlots}</div>
    </div>`;
  const cartItem = document.querySelector("#serviceCartItem");
  if (cartItem) {
    const last = progress.shopRoom.at(-1) || selectedShopId;
    cartItem.style.background = shopItemMeta(last).color;
  }
}

function renderItemHotbar() {
  if (!itemHotbar) return;
  if (!Array.isArray(progress.shopRoom)) progress.shopRoom = [];
  const slots = SHOP_ITEMS.map((item) => {
    const count = shopTypeCount(item.id);
    const meta = shopItemMeta(item.id);
    const label = item.id === "bomb" ? "彈" : meta.short;
    return `
      <button class="mc-slot hotbar-slot${count ? " filled" : ""}" type="button" data-deploy-item="${item.id}" title="${item.name}${count ? ` ×${count}` : "（尚未購買）"}">
        <span class="mc-slot-icon" style="background:${meta.color}">${label}</span>
        <span class="mc-hotbar-name">${item.name.replace("防護罩", "罩").replace("巨型炸彈", "巨彈").replace("藍色", "藍").replace("白色", "白").replace("紅色", "紅")}</span>
        ${count ? `<span class="mc-slot-count">${count}</span>` : ""}
      </button>`;
  }).join("");
  itemHotbar.innerHTML = `<p class="mc-hotbar-label">點格子播出</p><div class="mc-hotbar-row">${slots}</div>`;
}

function skipRemainingPackLevels() {
  if (!game) return;
  const chapter = game.chapter;
  const pack = packOfSubLevel(game.subLevel);
  const range = packRange(pack);
  const goal = chapterGoal(chapter);
  setChapterCleared(chapter, Math.max(getChapterCleared(chapter), range.end));
  progress.chapter = chapter;
  progress.subLevel = Math.min(range.end + 1, goal);
  progress.score = game.score;
  progress.stars = game.stars;
  saveProgress();
  const skippedAll = range.end >= goal;
  floatingNotice(skippedAll ? "已去掉這章剩下的關卡" : "已去掉這組剩下的關卡", "#ffd83d");
  cancelAnimationFrame(animationId);
  animationId = 0;
  stopMusic();
  hideMessage();
  clearPraise();
  game = null;
  selectedChapter = chapter;
  updateHomeInfo();
  renderChapterList();
  hideMenuScreens();
  if (skippedAll) {
    startScreen.hidden = false;
    return;
  }
  packSelectScreen.hidden = false;
  renderPackList();
}

function continuePlaying() {
  if (pendingAdvance) {
    const action = pendingAdvance;
    pendingAdvance = null;
    action();
    return;
  }
  if (game?.paused) {
    togglePause();
    return;
  }
  floatingNotice("繼續打這一關！", "#9fd8ff");
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
  const shield = big ? 100 : 0;
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
    speed: big ? 72 : 46,
    shootTimer: big ? random(280, 480) : random(700, 1400),
    phase: random(0, Math.PI * 2),
    falling: false
  });
  game.spawned += 1;
  game.spawnTimer = allBig
    ? Math.max(700, 1300 - Math.floor(game.subLevel / 20) * 18)
    : Math.max(320, 780 - Math.min(game.subLevel, 40) * 6);
}

function shoot(now) {
  const gun = currentGun();
  const ammo = currentAmmo();
  const boost = game.battleBoost > 0 ? PLAYER_BULLET_MULT : 1;
  if (now - game.lastShot < gun.fire / (FIXED_SPEED_MULT * boost)) return;
  game.lastShot = now;

  const speed = 560 * PLAYER_BULLET_MULT;
  let vx = 0;
  let vy = -speed;
  if (fireAim === "left") {
    vx = -speed;
    vy = 0;
  } else if (fireAim === "right") {
    vx = speed;
    vy = 0;
  }
  game.bullets.push({
    x: game.player.x,
    y: game.player.y - 16,
    radius: ammo.size * 0.95 * PLAYER_BULLET_MULT,
    speed,
    damage: bulletDamage(),
    color: ammo.color,
    vx,
    vy
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
    floatingNotice(side === "left" ? "左鐵門開啟！橫向加人衝出來了" : "右鐵門開啟！橫向補血衝出來了", "#c9d6e8");
    const dispenser = game.dispensers.find((item) => item.side === side);
    if (dispenser) dispenser.timer = 0.05;
    const boost = game.dispensers.find((item) => item.side === "either");
    if (boost) boost.timer = Math.min(boost.timer, 0.8);
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

    const sideways = Math.abs(bullet.vx || 0) > Math.abs(bullet.vy || 0);
    const inOpenLeft = game.leftDoor.open && pointInBox(bullet, leftBox);
    const inOpenRight = game.rightDoor.open && pointInBox(bullet, rightBox);
    const outsideLane = bullet.x <= bounds.innerLeft || bullet.x >= bounds.innerRight;
    if (!sideways && outsideLane && !inOpenLeft && !inOpenRight) {
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
    if (!hit) {
      for (let p = game.pickups.length - 1; p >= 0; p -= 1) {
        const pickup = game.pickups[p];
        if (!isDoorCarrier(pickup)) continue;
        if (distance(bullet, pickup) < bullet.radius + pickup.radius) {
          game.bullets.splice(i, 1);
          hurtDoorCarrier(p, pickup, CARRIER_HIT);
          hit = true;
          break;
        }
      }
    }
    if (!hit && (bullet.y < -20 || bullet.y > view.height + 20 || bullet.x < -30 || bullet.x > view.width + 30)) {
      game.bullets.splice(i, 1);
    }
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
    if (enemy.falling) {
      enemy.y += Math.max(enemy.speed, 380) * dt;
      enemy.x += (enemy.x < bounds.mid ? -50 : 50) * dt;
      if (enemy.y > view.height + 40) {
        game.enemies.splice(i, 1);
        game.score += enemy.big ? 10 : 5;
        updateHud();
      }
      continue;
    }
    enemy.y += enemy.speed * dt;
    if (enemy.big) {
      const chase = clamp(game.player.x - enemy.x, -enemy.speed * 0.7 * dt, enemy.speed * 0.7 * dt);
      enemy.x += chase;
    } else {
      enemy.x += Math.sin(enemy.phase) * 5 * dt;
    }
    enemy.x = clamp(enemy.x, bounds.innerLeft + enemy.radius, bounds.innerRight - enemy.radius);

    const canShoot = enemy.y > 20 && enemy.y < view.height * 0.78;
    if (canShoot) {
      enemy.shootTimer -= dt * 1000;
      if (enemy.shootTimer <= 0) {
        const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
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

    if (game.shield.active && pointInBox(bullet, shieldRowBox())) {
      hitShieldPlates(bullet.damage || 1);
      burst(bullet.x, bullet.y, shieldColor(game.shield.color), 6);
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
    pickup.phase += dt * 4;
    pickup.x += (pickup.vx || 0) * dt;
    pickup.y += (pickup.vy || (isDoorCarrier(pickup) ? 0 : 95)) * dt;

    if (isDoorCarrier(pickup)) {
      if (pickup.x < -40 || pickup.x > view.width + 40) {
        game.pickups.splice(i, 1);
      }
      continue;
    }

    if (isStarPickup(pickup)) {
      if (pickup.cosmetic) {
        if (pickup.y > view.height + 25) game.pickups.splice(i, 1);
        continue;
      }
      const reach = pickup.radius + game.player.radius + 18;
      if (distance(pickup, game.player) < reach) {
        collectPickup(pickup);
        game.pickups.splice(i, 1);
      } else if (pickup.y > view.height + 25) {
        game.pickups.splice(i, 1);
      }
      continue;
    }

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
  } else if (pickup.type === "shieldBlue") {
    activateShield("blue");
  } else if (pickup.type === "shieldWhite") {
    activateShield("white");
  } else if (pickup.type === "shieldRed") {
    activateShield("red");
  } else if (pickup.type === "laser") {
    activateLaser();
  } else if (pickup.type === "bomb") {
    activateBomb();
  } else if (pickup.type === "firerate") {
    game.battleBoost = BATTLE_BOOST_TIME;
    burst(pickup.x, pickup.y, "#ffe45d", 14);
    floatingNotice("加強戰！射速再提升", "#ffe45d");
  } else if (isStarPickup(pickup)) {
    if (!pickup.cosmetic) {
      grantStars(pickup.type === "starBig" ? 5 : 1, pickup.x, pickup.y);
    }
  } else {
    burst(pickup.x, pickup.y, "#ffd83d", 8);
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
  if (enemy.big) {
    grantStars(5, enemy.x, enemy.y);
    game.pickups.push({
      x: enemy.x,
      y: enemy.y,
      vx: 0,
      vy: 70,
      radius: 14,
      phase: random(0, 6),
      type: "starBig",
      cosmetic: true
    });
    enemy.falling = true;
    enemy.speed = 380;
    enemy.shield = 0;
    burst(enemy.x, enemy.y, "#9fd8ff", 18);
    floatingNotice("巨型敵人掉下去了！", "#7ec8ff");
    return;
  }
  game.enemies.splice(index, 1);
  game.score += 5;
  burst(enemy.x, enemy.y, "#ff536d", 10);
  game.pickups.push({
    x: enemy.x,
    y: enemy.y,
    vx: 0,
    vy: 105,
    radius: 10,
    phase: random(0, 6),
    type: "starSmall"
  });
  updateHud();
}

function damageSquad(amount) {
  if (game.over || game.squad.length === 0 || game.falling) return;
  if (game.shield.active && hitShieldPlates(amount)) {
    burst(game.player.x, game.player.y - 30, shieldColor(game.shield.color), 8);
    updateHud();
    return;
  }
  const member = game.squad[game.squad.length - 1];
  member.hp -= amount;
  burst(game.player.x, game.player.y, "#ff536d", 8);
  if (member.hp <= 0) {
    game.squad.pop();
    stripWeapons();
    floatingNotice("一名隊員倒下，槍械回到練習手槍！", "#ff7187");
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
    ui.squad.textContent = `${game.squad.length}／${Math.ceil(squadHpTotal())}`;
    ui.score.textContent = game.score;
    ui.stars.textContent = game.stars;
    ui.speed.textContent = game.battleBoost > 0
      ? `${(FIXED_SPEED_MULT * PLAYER_BULLET_MULT).toFixed(1)}×`
      : `${FIXED_SPEED_MULT.toFixed(1)}×`;
    if (ui.cc) ui.cc.textContent = String(progress.cc || 0);
    ui.shield.textContent = game.shield.active ? `${Math.ceil(game.shield.time)}秒` : "關";
    ui.laser.textContent = game.laser.active ? `${Math.ceil(game.laser.time)}秒` : "關";
    ui.bomb.textContent = game.bomb.active ? `${game.bomb.time.toFixed(1)}秒` : "關";
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
  if (ui.homeCC) ui.homeCC.textContent = String(progress.cc || 0);
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
  drawLaser();
  drawEnemies();
  drawShield();
  drawSquad();
  drawBombFuse();
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
  const leftText = game.leftDoor.open ? "左門已開·加人橫出" : `左門 ${game.leftDoor.hits}/100`;
  const rightText = game.rightDoor.open ? "右門已開·補血橫出" : `右門 ${game.rightDoor.hits}/100`;
  ctx.fillText(leftText, bounds.mid - bounds.corridor * 0.28, 24);
  ctx.fillText("作戰通道", bounds.mid, 24);
  ctx.fillText(rightText, bounds.mid + bounds.corridor * 0.28, 24);
  ctx.fillStyle = "#9eb6d0";
  ctx.font = "700 10px Microsoft JhengHei";
  ctx.fillText("開門後橫向衝出加人／補血／加強戰", bounds.mid, 38);
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
  ctx.fillText(door.open ? "開" : `${door.hits}`, cx, box.y + box.h * 0.52);
  ctx.font = "800 10px Microsoft JhengHei";
  ctx.fillStyle = "#b7c4d4";
  ctx.fillText(door.open ? "橫出" : `/ ${door.max}`, cx, box.y + box.h * 0.52 + 13);
  ctx.fillStyle = side === "left" ? "#58e6ff" : "#ff8ec4";
  ctx.fillText(side === "left" ? "加人" : "補血", cx, box.y + box.h * 0.52 + 26);
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
  const broken = game.walls?.[side]?.broken;
  if (broken) {
    ctx.fillStyle = "#2a3138";
    ctx.fillRect(wallLeft, 0, thickness, view.height);
    ctx.fillStyle = "#6d7780";
    for (let y = 10; y < view.height; y += 34) {
      ctx.beginPath();
      ctx.moveTo(wallLeft + 2, y);
      ctx.lineTo(wallRight - 2, y + 18);
      ctx.lineTo(wallLeft + 6, y + 28);
      ctx.strokeStyle = "#c5ced6";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = "#8b97a2";
    ctx.font = "800 11px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText("已撞爛", (wallLeft + wallRight) / 2, view.height * 0.55);
    if (box) {
      ctx.fillStyle = "#121820";
      const notchX = side === "left" ? Math.min(wallLeft, box.x) : Math.max(wallLeft, box.x - 2);
      const notchRight = side === "left" ? Math.min(wallRight + 8, box.x + box.w) : wallRight;
      ctx.fillRect(notchX, box.y - 4, Math.max(10, notchRight - notchX), box.h + 8);
    }
  } else {
    ctx.fillStyle = "#b6c4d1";
    for (let y = 6; y < view.height; y += brick * 2) {
      if (box && y + brick > box.y && y < box.y + box.h) continue;
      ctx.fillRect(x + inward * (thickness / 2 - 5), y, 5, brick);
    }
    ctx.fillStyle = "#cfdae6";
    ctx.fillRect(wallLeft, 0, thickness, 3);
  }
}

function drawDispensers() {
  return;
}

function dispenserInfo(type) {
  if (type === "member") return { title: "加一人", color: "#40d9ff" };
  if (type === "heal") return { title: "補血", color: "#ff8ec4" };
  if (type === "firerate") return { title: "加強戰", color: "#ffe14c" };
  if (type === "shieldBlue") return { title: "藍罩", color: "#4db7ff" };
  if (type === "shieldWhite") return { title: "白罩", color: "#f4f8ff" };
  if (type === "shieldRed") return { title: "紅罩", color: "#ff536d" };
  if (type === "laser") return { title: "雷射", color: "#ff6a3c" };
  if (type === "bomb") return { title: "巨彈", color: "#7ec8ff" };
  return { title: "加強戰", color: "#ffe14c" };
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
    const offsetX = (column - (rowCount - 1) / 2) * 16;
    const offsetY = row * 14;
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
    const total = Math.max(0, Math.ceil(squadHpTotal()));
    ctx.fillStyle = "#fff7c2";
    ctx.font = "900 13px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#082033";
    ctx.lineWidth = 3;
    ctx.strokeText(`${total}`, game.player.x, game.player.y - 36);
    ctx.fillText(`${total}`, game.player.x, game.player.y - 36);
    ctx.fillStyle = "#072238";
    ctx.fillRect(game.player.x - width / 2, game.player.y + 22, width, 5);
    ctx.fillStyle = "#46e991";
    ctx.fillRect(game.player.x - width / 2, game.player.y + 22, width * Math.max(0, active.hp / active.maxHp), 5);
  }
}

function pickupLabel(type) {
  if (type === "member") return "+1";
  if (type === "heal") return "補";
  if (type === "firerate") return "戰";
  if (type === "shieldBlue") return "藍";
  if (type === "shieldWhite") return "白";
  if (type === "shieldRed") return "紅";
  if (type === "laser") return "雷";
  if (type === "bomb") return "炸";
  return "戰";
}

function drawShield() {
  if (!game.shield.active || !game.shield.plates.length) return;
  const box = shieldRowBox();
  const count = game.shield.plates.length;
  const slotW = box.w / count;
  const color = shieldColor(game.shield.color);
  game.shield.plates.forEach((plate, index) => {
    const x = box.x + index * slotW;
    ctx.fillStyle = `${color}cc`;
    ctx.strokeStyle = "#ffffffaa";
    ctx.lineWidth = 1;
    ctx.fillRect(x + 1, box.y, slotW - 2, box.h);
    ctx.strokeRect(x + 1, box.y, slotW - 2, box.h);
    ctx.fillStyle = "#082033";
    ctx.font = "800 9px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText(String(plate.hp), x + slotW / 2, box.y + 12);
  });
}

function drawLaser() {
  if (!game.laser.active) return;
  const beam = laserBeamBox();
  const gradient = fireAim === "front"
    ? ctx.createLinearGradient(beam.x, beam.y + beam.h, beam.x, beam.y)
    : fireAim === "left"
      ? ctx.createLinearGradient(beam.x + beam.w, beam.y, beam.x, beam.y)
      : ctx.createLinearGradient(beam.x, beam.y, beam.x + beam.w, beam.y);
  gradient.addColorStop(0, "#ff2a1a");
  gradient.addColorStop(0.35, "#ff4d2e");
  gradient.addColorStop(1, "#ffb347");
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.shadowBlur = 36;
  ctx.shadowColor = "#ff4d2e";
  ctx.fillStyle = gradient;
  ctx.fillRect(beam.x - 4, beam.y - 4, beam.w + 8, beam.h + 8);
  ctx.globalAlpha = 0.95;
  ctx.shadowBlur = 24;
  ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
  ctx.fillStyle = "#fff4ea";
  ctx.globalAlpha = 0.55;
  if (fireAim === "front") {
    ctx.fillRect(beam.x + beam.w * 0.35, beam.y, beam.w * 0.3, beam.h);
  } else if (fireAim === "left") {
    ctx.fillRect(beam.x, beam.y + beam.h * 0.35, beam.w, beam.h * 0.3);
  } else {
    ctx.fillRect(beam.x, beam.y + beam.h * 0.35, beam.w, beam.h * 0.3);
  }
  ctx.restore();
}

function drawBombFuse() {
  if (!game.bomb.active) return;
  ctx.save();
  ctx.fillStyle = "#7ec8ff";
  ctx.font = "900 22px Microsoft JhengHei";
  ctx.textAlign = "center";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#4db7ff";
  ctx.fillText("1", game.player.x, game.player.y - 52);
  ctx.restore();
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
    if (isDoorCarrier(pickup)) {
      const barW = pickup.radius * 2.2;
      ctx.fillStyle = "#082033cc";
      ctx.fillRect(pickup.x - barW / 2, pickup.y - pickup.radius - 8, barW, 5);
      ctx.fillStyle = "#46e991";
      ctx.fillRect(
        pickup.x - barW / 2,
        pickup.y - pickup.radius - 8,
        barW * Math.max(0, pickup.hp / pickup.maxHp),
        5
      );
      ctx.fillStyle = "#082033";
      ctx.font = "900 10px Microsoft JhengHei";
      ctx.textAlign = "center";
      ctx.fillText(pickupLabel(pickup.type), pickup.x, pickup.y + 1);
      ctx.fillStyle = "#082033";
      ctx.font = "800 9px Microsoft JhengHei";
      ctx.fillText(String(Math.max(0, Math.ceil(pickup.hp))), pickup.x, pickup.y + 12);
      return;
    }
    ctx.fillStyle = "#0d2138";
    ctx.font = "900 9px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText(pickupLabel(pickup.type), pickup.x, pickup.y + 3);
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
  const host = !gameScreen.hidden ? document.querySelector("#gameWrap") : document.querySelector(".hero-card");
  if (!host) return;
  const notice = document.createElement("div");
  notice.className = "floating-notice";
  notice.textContent = text;
  notice.style.cssText = `
    position:absolute;left:50%;top:18%;z-index:8;max-width:80%;padding:9px 15px;
    border:1px solid ${color};border-radius:999px;background:#07162de6;color:${color};
    font-weight:900;text-align:center;pointer-events:none;transform:translateX(-50%);
    animation:notice-fade 1.8s ease forwards`;
  host.style.position = host.style.position || "relative";
  host.appendChild(notice);
  setTimeout(() => notice.remove(), 1800);
}

function showMessage(title, text, buttonText, action) {
  pendingAdvance = action;
  messageBox.innerHTML = `<h2>${title}</h2><p>${text}</p><button type="button">${buttonText}</button>`;
  messageBox.hidden = false;
  messageBox.querySelector("button").addEventListener("click", () => {
    pendingAdvance = null;
    action();
  }, { once: true });
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
    subLevel: 1,
    leftWallBroken: false,
    rightWallBroken: false,
    leftWallCleared: false,
    rightWallCleared: false,
    cc: 1,
    shopItem: null,
    shopRoom: []
  };
  selectedChapter = 1;
  saveProgress();
  updateHomeInfo();
  renderChapterList();
  renderArsenal();
  renderShop();
  renderItemHotbar();
}

function setDirection(direction, pressed) {
  usingPointer = false;
  pointerTargetX = null;
  pointerTargetY = null;
  pointerPushSide = null;
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
document.querySelector("#shopButton").addEventListener("click", () => {
  renderShop();
  shopDialog.showModal();
});
document.querySelector("#openShop").addEventListener("click", () => {
  renderShop();
  shopDialog.showModal();
});

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

[rulesDialog, arsenalDialog, shopDialog].forEach((dialog) => {
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

shopBody.addEventListener("click", (event) => {
  if (event.target.closest("#buyRainbowButton")) {
    buyShopItem(selectedShopId);
    return;
  }
  const item = event.target.closest("[data-shop-item]");
  if (!item || item.disabled) return;
  selectShopItem(item.dataset.shopItem);
});

itemHotbar?.addEventListener("click", (event) => {
  const slot = event.target.closest("[data-deploy-item]");
  if (!slot) return;
  deployRoomItemByType(slot.dataset.deployItem);
});

skipWallButton?.addEventListener("click", skipRemainingPackLevels);
continueWallButton?.addEventListener("click", continuePlaying);

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

const starKeyActions = {
  Digit5: useStarSprint,
  Numpad5: useStarSprint,
  Digit6: useStarShield,
  Numpad6: useStarShield,
  Digit7: useStarLaser,
  Numpad7: useStarLaser,
  Digit8: useStarBomb,
  Numpad8: useStarBomb,
  Digit9: useStarMember,
  Numpad9: useStarMember,
  Digit0: useStarHeal,
  Numpad0: useStarHeal,
  KeyQ: useStarBulletBoost
};

function isDialogOpen() {
  return Boolean(document.querySelector("dialog[open]"));
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !gameScreen.hidden) {
    togglePause();
    return;
  }
  if (isDialogOpen()) return;

  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) useStarSprint();
    return;
  }

  const starAction = starKeyActions[event.code];
  if (starAction) {
    if (!event.repeat) starAction();
    return;
  }

  if (event.code === "Digit1" || event.code === "Numpad1") {
    setFireAim("front");
    return;
  }
  if (event.code === "Digit2" || event.code === "Numpad2") {
    setDirection("back", true);
    return;
  }
  if (event.code === "Digit3" || event.code === "Numpad3") {
    setFireAim("left");
    return;
  }
  if (event.code === "Digit4" || event.code === "Numpad4") {
    setFireAim("right");
    return;
  }

  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key], true);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Digit2" || event.code === "Numpad2") {
    setDirection("back", false);
    return;
  }
  if (keyMap[event.key]) setDirection(keyMap[event.key], false);
});

let dragging = false;

function aimWithPointer(event) {
  if (!game || game.falling || game.over) return;
  usingPointer = true;
  const bounds = arena();
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const leftEdge = bounds.innerLeft + 16;
  const rightEdge = bounds.innerRight - 16;
  const minY = view.height * 0.68;
  const maxY = view.height - 28;
  if (x < leftEdge) {
    pointerTargetX = leftEdge;
    pointerPushSide = "left";
  } else if (x > rightEdge) {
    pointerTargetX = rightEdge;
    pointerPushSide = "right";
  } else {
    pointerTargetX = clamp(x, leftEdge, rightEdge);
    pointerPushSide = null;
  }
  pointerTargetY = clamp(y, minY, maxY);
}

function clearPointerAim() {
  dragging = false;
  usingPointer = false;
  pointerTargetX = null;
  pointerTargetY = null;
  pointerPushSide = null;
}

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  aimWithPointer(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  aimWithPointer(event);
});
canvas.addEventListener("pointerup", clearPointerAim);
canvas.addEventListener("pointercancel", clearPointerAim);

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
renderShop();
renderItemHotbar();
ui.gunName.textContent = currentGun().name;
ui.ammoName.textContent = currentAmmo().name;
