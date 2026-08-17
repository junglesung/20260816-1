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
const rangeCanvas = document.querySelector("#rangeCanvas");
const rangeCtx = rangeCanvas?.getContext("2d");
const rangeStatus = document.querySelector("#rangeStatus");
const upgradeStars = document.querySelector("#upgradeStars");
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
const STAR_CAP = 11200000;
const STAR_START = 100;
const GUN_COST = 50;
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
const keys = { left: false, right: false, back: false, up: false };

const PLAYER_TINT = "#73dcff";
const SWORD_DAMAGE = 38;
const SWORD_RANGE = 56;
const SWORD_COOLDOWN = 0.36;
const CONVERT_NEED = 10;
const FIGHTER_COLORS = [
  { id: "red", name: "紅", color: "#ff536d" },
  { id: "orange", name: "橙", color: "#ff8a3d" },
  { id: "yellow", name: "黃", color: "#ffd83d" },
  { id: "green", name: "綠", color: "#42e695" },
  { id: "blue", name: "藍", color: "#4db7ff" },
  { id: "purple", name: "紫", color: "#b785ff" },
  { id: "rainbow", name: "彩虹", color: "#ff6fd1" },
  { id: "black", name: "黑", color: "#2a2a2a" },
  { id: "white", name: "白", color: "#f4f8ff" }
];

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
let previewGunIndex = 0;
let rangeState = null;
let rangeAnim = 0;
let rangePausedGame = false;

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
    stars: STAR_START,
    gunsOwned: 1,
    ownedGuns: [0],
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
    planePassword: "0000",
    shopItem: null,
    shopRoom: [],
    starStartGranted: true
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return fallback;
    const chapterCleared = normalizeChapterCleared(saved.chapterCleared, saved.level);
    const chapter = clamp(Number(saved.chapter) || 1, 1, MAX_CHAPTER);
    const maxSub = chapterGoal(chapter);
    const subLevel = clamp(Number(saved.subLevel) || Math.min(chapterCleared[chapter - 1] + 1, maxSub), 1, maxSub);
    const stars = saved.starStartGranted
      ? clampStars(saved.stars)
      : clampStars(Math.max(STAR_START, Number(saved.stars) || 0));
    return {
      score: Math.max(0, Number(saved.score) || 0),
      stars,
      gunsOwned: clamp(Number(saved.gunsOwned) || 1, 1, guns.length),
      ownedGuns: normalizeOwnedGuns(saved),
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
      planePassword: normalizePassword(saved.planePassword),
      shopItem: null,
      shopRoom: normalizeShopRoom(saved),
      starStartGranted: true
    };
  } catch (error) {
    return fallback;
  }
}

function normalizePassword(value) {
  const text = String(value ?? "0000").replace(/\D/g, "").slice(0, 4);
  return text.padEnd(4, "0");
}

function planePassword() {
  return normalizePassword(progress.planePassword);
}

function normalizeOwnedGuns(saved) {
  const allowed = guns.map((_, index) => index);
  let owned = Array.isArray(saved?.ownedGuns)
    ? saved.ownedGuns.map((value) => Number(value)).filter((index) => allowed.includes(index))
    : [];
  if (!owned.length) {
    const count = clamp(Number(saved?.gunsOwned) || 1, 1, guns.length);
    owned = Array.from({ length: count }, (_, index) => index);
  }
  if (!owned.includes(0)) owned.unshift(0);
  return [...new Set(owned)].sort((a, b) => a - b);
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
  return spendStars(STAR_POWER_COST);
}

function clampStars(value) {
  return Math.max(0, Math.min(STAR_CAP, Math.floor(Number(value) || 0)));
}

function formatStars(value) {
  const n = clampStars(value);
  if (n >= 10000) {
    const wan = n / 10000;
    const text = Number.isInteger(wan) ? String(wan) : wan.toFixed(1).replace(/\.0$/, "");
    return `${text}萬`;
  }
  return String(n);
}

function currentStars() {
  return clampStars(game ? game.stars : progress.stars);
}

function syncStars(value) {
  const next = clampStars(value);
  progress.stars = next;
  if (game) game.stars = next;
  return next;
}

function addStars(amount) {
  if (!(amount > 0)) return 0;
  const before = currentStars();
  const gained = syncStars(before + amount) - before;
  saveProgress();
  return gained;
}

function spendStars(cost) {
  const need = Math.max(0, Math.floor(Number(cost) || 0));
  const available = currentStars();
  if (available < need) {
    floatingNotice(`星星不夠！需要 ${need} 顆`, "#ffd83d");
    return false;
  }
  syncStars(available - need);
  saveProgress();
  updateHud();
  return true;
}

function ownsGun(index) {
  if (!Array.isArray(progress.ownedGuns)) progress.ownedGuns = normalizeOwnedGuns(progress);
  return progress.ownedGuns.includes(index);
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
  const gained = addStars(amount);
  if (x != null && y != null) burst(x, y, "#ffd83d", gained >= 5 ? 18 : 12);
  if (gained <= 0) {
    floatingNotice("星星已存滿 1120 萬", "#ffd83d");
  } else {
    floatingNotice(`星星 +${gained}`, "#ffd83d");
  }
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
  const index = ownsGun(progress.gunIndex) ? progress.gunIndex : 0;
  return guns[index];
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
    stars: clampStars(progress.stars),
    squad: [{ hp: MEMBER_HP, maxHp: MEMBER_HP }],
    player: { x: view.width / 2, y: view.height * 0.55, radius: 12 },
    plane: { x: view.width / 2, y: view.height * 0.55, parked: false, vx: 0, vy: 0 },
    control: "plane",
    sword: { swing: 0, facing: "up" },
    converts: 0,
    allies: [],
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

function flyBounds() {
  return {
    minX: 40,
    maxX: view.width - 40,
    minY: 36,
    maxY: view.height - 24,
    mid: view.width / 2
  };
}

function bodyPos() {
  if (!game) return { x: 0, y: 0 };
  if (game.control === "plane") return { x: game.plane.x, y: game.plane.y };
  return game.player;
}

function facingVector() {
  const facing = game?.sword?.facing || "up";
  if (facing === "left") return { x: -1, y: 0 };
  if (facing === "right") return { x: 1, y: 0 };
  if (facing === "down") return { x: 0, y: 1 };
  return { x: 0, y: -1 };
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
  requestAnimationFrame(() => {
    resizeCanvas();
    requestAnimationFrame(resizeCanvas);
  });
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
  const bounds = flyBounds();
  game.control = "plane";
  game.plane = { x: bounds.mid, y: view.height * 0.58, parked: false, vx: 0, vy: 0 };
  game.player.x = game.plane.x;
  game.player.y = game.plane.y;
  game.player.radius = 12;
  game.sword = { swing: 0, facing: "up" };
  game.converts = 0;
  game.allies = [];
  spawnLevelBonusStars();
  pauseButton.textContent = "Ⅱ";
  clearPraise();
  hideMessage();
  updateHud();
}

function resizeCanvas() {
  if (gameScreen.hidden) return;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.round(rect.width);
  const cssHeight = Math.round(rect.height);
  if (cssWidth < 8 || cssHeight < 8) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nextWidth = Math.round(cssWidth * dpr);
  const nextHeight = Math.round(cssHeight * dpr);
  const oldWidth = view.width;
  const oldHeight = view.height;
  if (
    canvas.width === nextWidth &&
    canvas.height === nextHeight &&
    Math.abs(cssWidth - oldWidth) < 0.5 &&
    Math.abs(cssHeight - oldHeight) < 0.5
  ) {
    return;
  }

  view = { width: cssWidth, height: cssHeight, dpr };
  canvas.width = nextWidth;
  canvas.height = nextHeight;
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
  animationId = requestAnimationFrame(loop);
  try {
    const dt = Math.min((now - lastFrame) / 1000, 0.034);
    lastFrame = now;
    if (game && game.running && !game.paused && !game.betweenLevels) {
      update(dt, now);
    }
    draw();
  } catch (error) {
    console.error(error);
  }
}

function update(dt, now) {
  updatePlayer(dt);
  updateAllies(dt);
  spawnEnemies(dt);
  updateSword(dt, now);
  updateEnemies(dt);
  updatePickups(dt);
  updateParticles(dt);

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
  const bounds = flyBounds();
  const speed = playerMoveSpeed() * 1.35;
  if (game.sword.swing > 0) {
    game.sword.swing = Math.max(0, game.sword.swing - dt);
  }

  if (game.control === "parachute") {
    if (keys.left) game.player.x -= speed * 0.8 * dt;
    if (keys.right) game.player.x += speed * 0.8 * dt;
    if (keys.up) game.player.y -= speed * 0.25 * dt;
    if (keys.back) game.player.y += speed * 0.35 * dt;
    game.player.y += 78 * dt;
    game.player.x = clamp(game.player.x, bounds.minX, bounds.maxX);
    game.player.y = clamp(game.player.y, bounds.minY, bounds.maxY);
    if (game.player.y >= bounds.maxY - 2) {
      game.control = "walk";
      floatingNotice("降落了！按 2 可靠近飛機再上去", "#9fd8ff");
    }
    updateFacingFromKeys();
    return;
  }

  if (game.control === "walk") {
    if (keys.left) game.player.x -= speed * dt;
    if (keys.right) game.player.x += speed * dt;
    if (keys.up) game.player.y -= speed * dt;
    if (keys.back) game.player.y += speed * dt;
    game.player.x = clamp(game.player.x, bounds.minX, bounds.maxX);
    game.player.y = clamp(game.player.y, bounds.minY, bounds.maxY);
    updateFacingFromKeys();
    return;
  }

  if (!game.plane.parked) {
    if (keys.left) game.plane.x -= speed * dt;
    if (keys.right) game.plane.x += speed * dt;
    if (keys.up) game.plane.y -= speed * dt;
    if (keys.back) game.plane.y += speed * dt;
    game.plane.x = clamp(game.plane.x, bounds.minX, bounds.maxX);
    game.plane.y = clamp(game.plane.y, bounds.minY, bounds.maxY);
    game.player.x = game.plane.x;
    game.player.y = game.plane.y;
    updateFacingFromKeys();
  }
}

function updateFacingFromKeys() {
  if (keys.left) game.sword.facing = "left";
  else if (keys.right) game.sword.facing = "right";
  else if (keys.up) game.sword.facing = "up";
  else if (keys.back) game.sword.facing = "down";
}

function parachuteOut() {
  if (!game || game.over || game.paused || game.betweenLevels) return;
  if (game.control !== "plane") {
    floatingNotice("已經在外面了", "#ffd83d");
    return;
  }
  game.control = "parachute";
  game.player.x = game.plane.x;
  game.player.y = game.plane.y + 18;
  burst(game.player.x, game.player.y, "#dcecff", 16);
  floatingNotice("從洞口跳傘！", "#9fd8ff");
  updateHud();
}

function parkPlane() {
  if (!game || game.over || game.paused || game.betweenLevels) return;
  if (game.control === "walk" || game.control === "parachute") {
    const dist = Math.hypot(game.player.x - game.plane.x, game.player.y - game.plane.y);
    if (dist < 48) {
      game.control = "plane";
      game.plane.parked = false;
      game.player.x = game.plane.x;
      game.player.y = game.plane.y;
      floatingNotice("密碼正確，回到飛機上", "#42e695");
      updateHud();
      return;
    }
    floatingNotice("靠近飛機繩子才能再上去", "#ffd83d");
    return;
  }
  game.plane.parked = true;
  game.control = "walk";
  game.player.x = game.plane.x;
  game.player.y = Math.min(flyBounds().maxY, game.plane.y + 36);
  floatingNotice(`飛機停住了，車門密碼 ${planePassword()}`, "#ffd83d");
  updateHud();
}

function swingSword() {
  if (!game || game.over || game.paused || game.betweenLevels || game.falling) return;
  if (game.sword.swing > 0.12) return;
  game.sword.swing = SWORD_COOLDOWN;
  const origin = bodyPos();
  const dir = facingVector();
  const hx = origin.x + dir.x * 28;
  const hy = origin.y + dir.y * 28;
  burst(hx, hy, "#ff8a3d", 10);
  burst(hx, hy, "#ffffff", 8);
  playSfx("shoot");
  let hit = false;
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    if (Math.hypot(enemy.x - hx, enemy.y - hy) < SWORD_RANGE + enemy.radius) {
      hitEnemy(i, enemy, { damage: SWORD_DAMAGE, color: "#ffffff" });
      burst(enemy.x, enemy.y, "#ffffff", 12);
      hit = true;
    }
  }
  if (hit) floatingNotice("橘色寶劍！", "#ff8a3d");
}

function updateSword(dt) {
  if (game.sword.swing > 0) game.sword.swing = Math.max(0, game.sword.swing - dt);
}

function updateAllies(dt) {
  const origin = bodyPos();
  const speed = playerMoveSpeed();
  game.allies.forEach((ally, index) => {
    const tx = origin.x + Math.cos(index * 0.9) * 28;
    const ty = origin.y + 18 + (index % 3) * 12;
    ally.x += (tx - ally.x) * Math.min(1, dt * 3.2);
    ally.y += (ty - ally.y) * Math.min(1, dt * 3.2);
    ally.swing = Math.max(0, (ally.swing || 0) - dt);
    if (ally.swing <= 0) {
      const target = game.enemies.find((enemy) => Math.hypot(enemy.x - ally.x, enemy.y - ally.y) < SWORD_RANGE + 20);
      if (target) {
        ally.swing = 0.7;
        const idx = game.enemies.indexOf(target);
        if (idx !== -1) hitEnemy(idx, target, { damage: SWORD_DAMAGE * 0.7, color: "#ffffff" });
      }
    }
  });
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
  playSfx("boom");
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
  if (!spendStars(STAR_POWER_COST)) {
    renderShop();
    return;
  }
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
  if (ui.shopCC) ui.shopCC.textContent = formatStars(currentStars());
  if (ui.shopOwned) ui.shopOwned.textContent = planePassword();
  shopBody.innerHTML = `
    <label class="arsenal-hint" for="planePasswordInput">車門密碼（4碼）</label>
    <input id="planePasswordInput" class="password-input" type="text" inputmode="numeric" maxlength="4" value="${planePassword()}" aria-label="飛機車門密碼">
    <button id="savePasswordButton" class="rainbow-buy-button" type="button"><span>儲存密碼</span><small>上鎖用</small></button>
    <p class="mc-chest-label">停機後別人要知道這組密碼才能上去。這場其他人都是電腦操控。</p>`;
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

  const allBig = game.chapter >= MAX_CHAPTER;
  const singleBoss = game.enemyTotal === 1;
  const big = allBig || singleBoss || game.spawned === 0 || game.spawned % 3 === 0;
  const radius = big ? 26 : 14;
  const scale = enemyHpScale();
  const hp = (big ? 100 : 18) * scale;
  game.enemies.push({
    x: random(40, view.width - 40),
    y: -radius - random(0, 40),
    radius,
    big,
    hp,
    maxHp: hp,
    shield: big ? 80 : 28,
    shieldMax: big ? 80 : 28,
    speed: big ? 70 : 52,
    shootTimer: random(400, 900),
    phase: random(0, Math.PI * 2),
    falling: false,
    inPlane: true,
    color: FIGHTER_COLORS[game.spawned % FIGHTER_COLORS.length]
  });
  game.spawned += 1;
  game.spawnTimer = allBig
    ? Math.max(700, 1300 - Math.floor(game.subLevel / 20) * 18)
    : Math.max(320, 780 - Math.min(game.subLevel, 40) * 6);
}

function shoot(now) {
  swingSword();
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
  const origin = bodyPos();
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    enemy.phase += dt * 2.6;
    if (enemy.falling) {
      enemy.y += Math.max(enemy.speed, 380) * dt;
      if (enemy.y > view.height + 40) {
        game.enemies.splice(i, 1);
        game.score += enemy.big ? 10 : 5;
        updateHud();
      }
      continue;
    }
    const dx = origin.x - enemy.x;
    const dy = origin.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;
    enemy.x = clamp(enemy.x, 30, view.width - 30);
    enemy.y = clamp(enemy.y, 24, view.height - 20);

    enemy.shootTimer -= dt * 1000;
    if (enemy.shootTimer <= 0 && dist < SWORD_RANGE + 18) {
      enemy.shootTimer = enemy.big ? 420 : 700;
      damageSquad(enemy.big ? 2 : 1);
      burst(origin.x, origin.y, "#ffffff", 8);
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
      grantStars(pickup.amount || (pickup.type === "starBig" ? 5 : 1), pickup.x, pickup.y);
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

function dropStarPickup(x, y, amount, cosmetic = false) {
  const value = Math.max(1, Math.floor(amount || 1));
  const big = value >= 5;
  game.pickups.push({
    x,
    y,
    vx: random(-28, 28),
    vy: random(70, 120),
    radius: big ? 14 : 10,
    phase: random(0, 6),
    type: big ? "starBig" : "starSmall",
    amount: value,
    cosmetic
  });
}

function spawnLevelBonusStars() {
  if (!game) return;
  const bounds = arena();
  const extra = 3 + Math.min(4, Math.floor(game.chapter / 2));
  for (let i = 0; i < extra; i += 1) {
    dropStarPickup(
      random(bounds.innerLeft + 18, bounds.innerRight - 18),
      random(view.height * 0.12, view.height * 0.42),
      i === 0 ? 5 : 1
    );
  }
}

function levelStarBonus(chapter, subLevel) {
  return 12 + chapter * 4 + Math.ceil(subLevel / 3);
}

function convertEnemyToAlly(enemy) {
  game.converts += 1;
  game.allies.push({
    x: enemy.x,
    y: enemy.y,
    color: enemy.color?.color || "#ff536d",
    name: enemy.color?.name || "紅",
    hat: enemy.color?.color || "#07549a",
    likePlayer: false,
    swing: 0
  });
  game.squad.push({ hp: MEMBER_HP, maxHp: MEMBER_HP });
  floatingNotice(`${enemy.color?.name || "敵人"}變成夥伴了！`, enemy.color?.color || "#58e6ff");
  if (game.converts % CONVERT_NEED === 0) {
    game.allies.push({
      x: bodyPos().x,
      y: bodyPos().y,
      color: PLAYER_TINT,
      name: "淺藍",
      hat: "#1d6dff",
      likePlayer: true,
      swing: 0
    });
    game.squad.push({ hp: MEMBER_HP, maxHp: MEMBER_HP });
    floatingNotice("戴藍帽子的自己人也來了！", PLAYER_TINT);
  }
}

function defeatEnemy(index, enemy) {
  if (enemy.big) {
    grantStars(8, enemy.x, enemy.y);
    dropStarPickup(enemy.x, enemy.y, 5, true);
    convertEnemyToAlly(enemy);
    enemy.falling = true;
    enemy.speed = 380;
    enemy.shield = 0;
    burst(enemy.x, enemy.y, "#ffffff", 18);
    floatingNotice("鑽石盔甲破了！", "#7ec8ff");
    return;
  }
  game.enemies.splice(index, 1);
  game.score += 5;
  burst(enemy.x, enemy.y, "#ffffff", 12);
  convertEnemyToAlly(enemy);
  dropStarPickup(enemy.x, enemy.y, 1);
  if (Math.random() < 0.45) {
    dropStarPickup(enemy.x + random(-16, 16), enemy.y - 8, 1);
  }
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
    floatingNotice("一名隊員倒下！", "#ff7187");
  }
  updateHud();
  if (game.squad.length === 0) endGame();
}

function grantLevelReward() {
  return "鑽石寶劍還在，星星已入帳。";
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
  const starBonus = isNewClear ? levelStarBonus(chapter, completedSub) : Math.max(4, chapter + 2);
  const gainedStars = addStars(starBonus);
  const rewardText = `${isNewClear
    ? grantLevelReward(totalClearedSubLevels() + 1)
    : "這小關已通關過，繼續前進吧！"}<br>關卡星星 +${gainedStars}`;

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
      `${rewardText}<br>你打完了全部 ${goal} 小關。${unlockText}<br>目前分數 ${game.score} 分、星星 ${formatStars(game.stars)}。`,
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
      `${rewardText}<br>${randomClearQuote()}<br>這一章已全部打通。<br>目前分數 ${game.score} 分、星星 ${formatStars(game.stars)}。`,
      "回到關卡列表",
      () => returnToHome()
    );
    return;
  }

  const finishedPack = completedSub % PACK_SIZE === 0;
  const nextPack = packOfSubLevel(completedSub + 1);
  showMessage(
    `第 ${chapter} 章 · 第 ${completedSub} 關完成！`,
    `${rewardText}<br>${randomClearQuote()}<br>進度 ${getChapterCleared(chapter)} / ${goal}${finishedPack ? `<br>已解鎖第 ${nextPack} 組！` : ""}<br>目前分數 ${game.score} 分、星星 ${formatStars(game.stars)}。`,
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
    `你打通了第 ${MAX_CHAPTER} 章的大巨人軍團！<br>總分 ${game.score} 分、星星 ${formatStars(game.stars)}。`,
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
  progress.leftWallBroken = false;
  progress.rightWallBroken = false;
  progress.leftWallCleared = false;
  progress.rightWallCleared = false;
  saveProgress();
  showMessage(
    "淺藍小隊全滅",
    `你停在第 ${game.chapter} 章第 ${game.subLevel} 小關，分數 ${game.score} 分。<br>旁邊玻璃會重新恢復，再來一次吧！`,
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
    ui.stars.textContent = formatStars(game.stars);
    const modeText = game.control === "plane" ? (game.plane.parked ? "停機" : "駕駛中") : game.control === "parachute" ? "跳傘中" : "走路中";
    if (ui.speed) ui.speed.textContent = modeText;
    if (ui.cc) ui.cc.textContent = planePassword();
    if (ui.shield) ui.shield.textContent = String(game.allies.length);
    if (ui.laser) ui.laser.textContent = `${game.converts % CONVERT_NEED}/${CONVERT_NEED}`;
    if (ui.bomb) ui.bomb.textContent = "鑽石";
  }
  if (ui.gunName) ui.gunName.textContent = "鑽石寶劍";
  if (ui.ammoName) ui.ammoName.textContent = "橘色＋白光";
  updateHomeInfo();
}

function updateHomeInfo() {
  ui.homeLevel.textContent = `${highestUnlockedChapter()}`;
  ui.homeScore.textContent = progress.score;
  ui.homeStars.textContent = formatStars(progress.stars);
  if (upgradeStars) upgradeStars.textContent = formatStars(currentStars());
  if (ui.homeCC) ui.homeCC.textContent = planePassword();
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
  drawParkedPlane();
  drawPickups();
  drawEnemies();
  drawAllies();
  drawSquad();
  drawSwordSlash();
  drawParticles();
}

function drawArena() {
  const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
  gradient.addColorStop(0, "#7ec8ff");
  gradient.addColorStop(0.45, "#3a7ec4");
  gradient.addColorStop(1, "#0b3a63");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.fillStyle = "#ffffff55";
  for (let i = 0; i < 6; i += 1) {
    const x = (i * 170 + (lastFrame / 40) % 170) % (view.width + 80) - 40;
    const y = 40 + (i % 3) * 50;
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#0e2a18";
  ctx.fillRect(0, view.height - 18, view.width, 18);
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

function drawParkedPlane() {
  if (!game.plane || game.control === "plane") return;
  drawPlaneAt(game.plane.x, game.plane.y, PLAYER_TINT, true);
  if (game.plane.parked || game.control !== "plane") {
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(game.plane.x, game.plane.y + 10);
    ctx.lineTo(game.plane.x, Math.min(view.height - 18, game.player.y + 8));
    ctx.stroke();
    ctx.fillStyle = "#ffd83d";
    ctx.font = "800 11px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText(`密碼 ${planePassword()}`, game.plane.x, game.plane.y - 28);
  }
}

function drawPlaneAt(x, y, color, empty) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#d7e6f4";
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -2, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8aa4bb";
  ctx.fillRect(-28, -3, 10, 6);
  ctx.fillRect(18, -3, 12, 6);
  ctx.fillStyle = "#1b2a38";
  ctx.beginPath();
  ctx.arc(0, 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9fd8ff88";
  ctx.beginPath();
  ctx.arc(0, 2, 4, 0, Math.PI * 2);
  ctx.fill();
  if (empty) {
    ctx.fillStyle = "#ffffffaa";
    ctx.font = "800 9px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.fillText("洞", 0, 5);
  }
  ctx.restore();
}

function drawSwordSlash() {
  if (!game.sword || game.sword.swing <= 0) return;
  const origin = bodyPos();
  const dir = facingVector();
  const t = game.sword.swing / SWORD_COOLDOWN;
  ctx.save();
  ctx.translate(origin.x + dir.x * 22, origin.y + dir.y * 22);
  ctx.rotate(Math.atan2(dir.y, dir.x) + (0.8 - t));
  ctx.fillStyle = "#ff8a3d";
  ctx.fillRect(0, -4, 34, 8);
  ctx.fillStyle = "#4ad2ff";
  ctx.fillRect(26, -5, 10, 10);
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(38, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAllies() {
  game.allies.forEach((ally) => {
    drawFighter(ally.x, ally.y, ally.color, ally.hat, ally.likePlayer);
  });
}

function drawFighter(x, y, body, hat, blueHat) {
  const u = SQUAD_SCALE;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#3ad0ff";
  ctx.fillRect(-8 * u, 16 * u, 6 * u, 6 * u);
  ctx.fillRect(2 * u, 16 * u, 6 * u, 6 * u);
  ctx.fillStyle = body;
  roundRect(-10 * u, -8 * u, 20 * u, 18 * u, 4 * u);
  ctx.fill();
  ctx.fillStyle = "#f1c4a4";
  ctx.beginPath();
  ctx.arc(0, -14 * u, 7 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = blueHat ? "#1d6dff" : hat;
  roundRect(-8 * u, -22 * u, 16 * u, 7 * u, 2 * u);
  ctx.fill();
  ctx.restore();
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
    const tint = enemy.color?.color || "#ff506a";
    if (enemy.inPlane && !enemy.falling) {
      drawPlaneAt(enemy.x, enemy.y + 16, tint, false);
    }
    const u = enemy.radius / 16;
    const bodyColor = tint;
    const darkColor = "#1b3d55";
    const hatColor = enemy.color?.id === "black" ? "#111" : tint;
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
  if (game.control === "plane") {
    drawPlaneAt(game.plane.x, game.plane.y, PLAYER_TINT, false);
  }
  const count = Math.max(1, Math.min(game.squad.length, 10));
  const u = SQUAD_SCALE;
  const origin = bodyPos();
  for (let i = count - 1; i >= 0; i -= 1) {
    const offsetX = game.control === "plane" ? 0 : (i - (count - 1) / 2) * 14;
    drawFighter(origin.x + offsetX, origin.y, PLAYER_TINT, "#1d6dff", true);
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
    ctx.strokeText(`${total}`, origin.x, origin.y - 36);
    ctx.fillText(`${total}`, origin.x, origin.y - 36);
    ctx.fillStyle = "#072238";
    ctx.fillRect(origin.x - width / 2, origin.y + 22, width, 5);
    ctx.fillStyle = "#46e991";
    ctx.fillRect(origin.x - width / 2, origin.y + 22, width * Math.max(0, active.hp / active.maxHp), 5);
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
      ctx.fillText(String(pickup.amount || (big ? 5 : 1)), pickup.x, pickup.y + 3.5);
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
    stars: STAR_START,
    gunsOwned: 1,
    ownedGuns: [0],
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
    planePassword: "0000",
    shopItem: null,
    shopRoom: [],
    starStartGranted: true
  };
  selectedChapter = 1;
  previewGunIndex = 0;
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
  if (upgradeStars) upgradeStars.textContent = formatStars(currentStars());
  if (!arsenalBody) return;
  arsenalBody.innerHTML = `
    <p class="arsenal-hint">現在不用槍了。進關用鑽石寶劍，星星當錢留下。</p>
    <p class="arsenal-hint">目前星星：${formatStars(currentStars())}　飛機密碼：${planePassword()}</p>`;
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

function previewGun() {
  return guns[clamp(previewGunIndex, 0, guns.length - 1)];
}

function setPreviewGun(index) {
  previewGunIndex = clamp(index, 0, guns.length - 1);
  if (rangeStatus) {
    rangeStatus.textContent = `測炮中：${previewGun().name}${ownsGun(previewGunIndex) ? "" : "（試打，尚未購買）"}`;
  }
  renderArsenal();
}

function buyGun(index) {
  if (index === 0 || ownsGun(index)) {
    progress.gunIndex = index;
    progress.gunsOwned = Math.max(progress.gunsOwned || 1, index + 1);
    saveProgress();
    setPreviewGun(index);
    updateHud();
    floatingNotice(`已裝備「${guns[index].name}」`, "#9fd8ff");
    return;
  }
  if (!spendStars(GUN_COST)) return;
  progress.ownedGuns.push(index);
  progress.ownedGuns = normalizeOwnedGuns(progress);
  progress.gunIndex = index;
  progress.gunsOwned = Math.max(progress.gunsOwned || 1, progress.ownedGuns.length);
  saveProgress();
  setPreviewGun(index);
  updateHud();
  floatingNotice(`已購買「${guns[index].name}」`, "#ffd83d");
}

function openUpgradeCenter() {
  if (game && game.running && !game.paused && !game.over && !game.betweenLevels) {
    game.paused = true;
    rangePausedGame = true;
  }
  previewGunIndex = ownsGun(progress.gunIndex) ? progress.gunIndex : 0;
  renderArsenal();
  arsenalDialog.showModal();
  setPreviewGun(previewGunIndex);
  requestAnimationFrame(startRange);
}

function closeUpgradeSideEffects() {
  stopRange();
  if (rangePausedGame && game && !game.over && !game.betweenLevels) {
    game.paused = false;
    lastFrame = performance.now();
  }
  rangePausedGame = false;
}

function startRange() {
  if (!rangeCanvas || !rangeCtx) return;
  stopRange();
  const rect = rangeCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(220, rect.width || 280);
  const h = Math.max(150, rect.height || 180);
  rangeCanvas.width = Math.round(w * dpr);
  rangeCanvas.height = Math.round(h * dpr);
  rangeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rangeState = {
    w,
    h,
    bullets: [],
    targets: [
      { x: w * 0.22, y: 38, vx: 52, hp: 90, max: 90 },
      { x: w * 0.5, y: 26, vx: -66, hp: 140, max: 140 },
      { x: w * 0.78, y: 46, vx: 44, hp: 90, max: 90 }
    ],
    lastShot: 0,
    hits: 0,
    last: performance.now()
  };
  rangeAnim = requestAnimationFrame(loopRange);
}

function stopRange() {
  cancelAnimationFrame(rangeAnim);
  rangeAnim = 0;
  rangeState = null;
}

function loopRange(now) {
  rangeAnim = requestAnimationFrame(loopRange);
  if (!rangeState || !arsenalDialog.open) {
    stopRange();
    return;
  }
  const dt = Math.min((now - rangeState.last) / 1000, 0.04);
  rangeState.last = now;
  updateRange(dt, now);
  drawRange();
}

function updateRange(dt, now) {
  const gun = previewGun();
  const ammo = currentAmmo();
  if (now - rangeState.lastShot >= gun.fire) {
    rangeState.lastShot = now;
    rangeState.bullets.push({
      x: rangeState.w / 2,
      y: rangeState.h - 22,
      vy: -520,
      r: ammo.size,
      color: ammo.color,
      damage: gun.damage * ammo.multiplier
    });
    playSfx("shoot");
  }
  for (let i = rangeState.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = rangeState.bullets[i];
    bullet.y += bullet.vy * dt;
    if (bullet.y < -10) {
      rangeState.bullets.splice(i, 1);
      continue;
    }
    const hit = rangeState.targets.find((target) => (
      bullet.x > target.x - 16 && bullet.x < target.x + 16 &&
      bullet.y > target.y - 8 && bullet.y < target.y + 34
    ));
    if (hit) {
      hit.hp -= bullet.damage;
      rangeState.bullets.splice(i, 1);
      if (hit.hp <= 0) {
        rangeState.hits += 1;
        hit.hp = hit.max;
        hit.x = random(24, rangeState.w - 24);
      }
    }
  }
  rangeState.targets.forEach((target) => {
    target.x += target.vx * dt;
    if (target.x < 20 || target.x > rangeState.w - 20) {
      target.vx *= -1;
      target.x = clamp(target.x, 20, rangeState.w - 20);
    }
  });
}

function drawRange() {
  if (!rangeCtx || !rangeState) return;
  const { w, h } = rangeState;
  rangeCtx.fillStyle = "#102033";
  rangeCtx.fillRect(0, 0, w, h);
  rangeCtx.fillStyle = "#16324f";
  rangeCtx.fillRect(0, h - 18, w, 18);
  rangeState.targets.forEach((target) => {
    rangeCtx.fillStyle = "#ff536d";
    rangeCtx.fillRect(target.x - 12, target.y, 24, 32);
    rangeCtx.fillStyle = "#ffd0d6";
    rangeCtx.beginPath();
    rangeCtx.arc(target.x, target.y - 4, 8, 0, Math.PI * 2);
    rangeCtx.fill();
    rangeCtx.fillStyle = "#07162d";
    rangeCtx.fillRect(target.x - 14, target.y - 16, 28, 5);
    rangeCtx.fillStyle = "#42e695";
    rangeCtx.fillRect(target.x - 14, target.y - 16, 28 * clamp(target.hp / target.max, 0, 1), 5);
  });
  rangeState.bullets.forEach((bullet) => {
    rangeCtx.fillStyle = bullet.color;
    rangeCtx.beginPath();
    rangeCtx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
    rangeCtx.fill();
  });
  rangeCtx.fillStyle = "#20a7ff";
  rangeCtx.beginPath();
  rangeCtx.arc(w / 2, h - 16, 10, 0, Math.PI * 2);
  rangeCtx.fill();
  rangeCtx.fillStyle = "#ffd83d";
  rangeCtx.font = "800 12px Microsoft JhengHei";
  rangeCtx.textAlign = "left";
  rangeCtx.fillText(`打中 ${rangeState.hits}`, 8, 16);
  rangeCtx.textAlign = "right";
  rangeCtx.fillText(previewGun().name, w - 8, 16);
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
let musicGain = null;
let sfxGain = null;
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
  masterGain.gain.value = musicEnabled ? 0.85 : 0;
  masterGain.connect(audioCtx.destination);
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.9;
  musicGain.connect(masterGain);
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.7;
  sfxGain.connect(masterGain);
}

function unlockAudio() {
  ensureAudio();
  if (!audioCtx) return Promise.resolve();
  if (audioCtx.state === "suspended") {
    return audioCtx.resume().catch(() => {});
  }
  return Promise.resolve();
}

function playViolinNote(freq, start, dur) {
  if (!freq || !audioCtx || !musicGain) return;
  const osc1 = audioCtx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.value = freq;
  const osc2 = audioCtx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = freq;
  const bass = audioCtx.createOscillator();
  bass.type = "square";
  bass.frequency.value = freq / 2;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  filter.Q.value = 0.7;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.42, start + 0.05);
  gain.gain.setValueAtTime(0.36, start + dur * 0.65);
  gain.gain.linearRampToValueAtTime(0, start + dur);
  const bassGain = audioCtx.createGain();
  bassGain.gain.setValueAtTime(0, start);
  bassGain.gain.linearRampToValueAtTime(0.16, start + 0.04);
  bassGain.gain.linearRampToValueAtTime(0, start + dur);
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
  gain.connect(musicGain);
  bass.connect(bassGain);
  bassGain.connect(musicGain);
  osc1.start(start);
  osc2.start(start);
  bass.start(start);
  lfo.start(start);
  osc1.stop(start + dur + 0.05);
  osc2.stop(start + dur + 0.05);
  bass.stop(start + dur + 0.05);
  lfo.stop(start + dur + 0.05);
}

let lastShootSfx = 0;

function playSfx(kind) {
  if (!musicEnabled || !audioCtx || audioCtx.state !== "running" || !sfxGain) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxGain);
  if (kind === "shoot") {
    if (now - lastShootSfx < 0.08) return;
    lastShootSfx = now;
    osc.type = "square";
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.07);
    return;
  }
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.start(now);
  osc.stop(now + 0.42);
}

function musicScheduler() {
  if (!audioCtx || !musicEnabled || audioCtx.state !== "running") return;
  if (nextNoteTime < audioCtx.currentTime - 0.2) {
    nextNoteTime = audioCtx.currentTime;
  }
  let count = 0;
  while (nextNoteTime < audioCtx.currentTime + 0.25 && count < 6) {
    const [name, beats] = melody[melodyIndex % melody.length];
    const dur = Math.max(0.08, beats * beatDur);
    playViolinNote(NOTE[name], nextNoteTime, dur * 0.92);
    nextNoteTime += dur;
    melodyIndex += 1;
    count += 1;
  }
}

function startMusic() {
  if (!musicEnabled) return;
  unlockAudio().then(() => {
    if (!musicEnabled || !audioCtx) return;
    if (musicTimer) return;
    nextNoteTime = audioCtx.currentTime + 0.08;
    musicScheduler();
    musicTimer = setInterval(musicScheduler, 120);
  });
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = 0;
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  musicButton.textContent = musicEnabled ? "♪" : "🔇";
  musicButton.setAttribute("aria-pressed", String(musicEnabled));
  unlockAudio().then(() => {
    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(musicEnabled ? 0.85 : 0, audioCtx.currentTime, 0.05);
    }
    if (musicEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
  });
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
document.querySelectorAll("[data-open-upgrade]").forEach((button) => {
  button.addEventListener("click", openUpgradeCenter);
});

document.querySelector("#parachuteButton")?.addEventListener("click", parachuteOut);
document.querySelector("#parkButton")?.addEventListener("click", parkPlane);
document.querySelector("#swingButton")?.addEventListener("click", swingSword);

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
arsenalDialog.addEventListener("close", closeUpgradeSideEffects);

arsenalBody.addEventListener("click", (event) => {
  const gunAct = event.target.closest("[data-gun-act]");
  if (gunAct) {
    const index = Number(gunAct.dataset.index);
    if (gunAct.dataset.gunAct === "test") {
      setPreviewGun(index);
      return;
    }
    buyGun(index);
    return;
  }
  const item = event.target.closest(".arsenal-item");
  if (!item || item.disabled || item.dataset.kind !== "ammo") return;
  progress.ammoIndex = Number(item.dataset.index);
  saveProgress();
  renderArsenal();
  updateHud();
});

shopBody.addEventListener("click", (event) => {
  if (!event.target.closest("#savePasswordButton")) return;
  const input = document.querySelector("#planePasswordInput");
  progress.planePassword = normalizePassword(input?.value);
  saveProgress();
  updateHud();
  renderShop();
  floatingNotice(`密碼已設成 ${planePassword()}`, "#ffd83d");
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
  ArrowDown: "back", s: "back", S: "back",
  ArrowUp: "up", w: "up", W: "up"
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
    if (!event.repeat) swingSword();
    return;
  }
  if (event.code === "Digit1" || event.code === "Numpad1") {
    if (!event.repeat) parachuteOut();
    return;
  }
  if (event.code === "Digit2" || event.code === "Numpad2") {
    if (!event.repeat) parkPlane();
    return;
  }
  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key], true);
  }
});

window.addEventListener("keyup", (event) => {
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
  swingSword();
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
window.addEventListener("pointerdown", () => {
  unlockAudio().then(() => {
    if (musicEnabled && game && !gameScreen.hidden) startMusic();
  });
}, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  unlockAudio().then(() => {
    if (musicEnabled && game && !gameScreen.hidden) startMusic();
  });
});
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    if (!gameScreen.hidden) resizeCanvas();
  }).observe(document.querySelector("#gameWrap"));
}

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
ui.gunName.textContent = "鑽石寶劍";
ui.ammoName.textContent = "橘色＋白光";
saveProgress();
