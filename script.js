const rocketRack = document.getElementById("rocket-rack");
const arena = document.getElementById("arena");
const zombiesLayer = document.getElementById("zombies");
const projectilesLayer = document.getElementById("projectiles");
const lootLayer = document.getElementById("loot-layer");
const fireworksLayer = document.getElementById("fireworks");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const turnTimerEl = document.getElementById("turn-timer");
const timerLimitEl = document.getElementById("timer-limit");
const arenaPhotoImg = document.getElementById("arena-photo-img");
const crosshair = document.getElementById("crosshair");
const turret = document.getElementById("turret");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const restartBtn = document.getElementById("restart-btn");
const settingsForm = document.getElementById("settings-form");
const operationInput = document.getElementById("setting-operation");
const multiplySettingsPanel = document.getElementById("multiply-settings");
const addSettingsPanel = document.getElementById("add-settings");
const subtractSettingsPanel = document.getElementById("subtract-settings");
const divideSettingsPanel = document.getElementById("divide-settings");
const multiplyAnswerMinInput = document.getElementById("setting-multiply-answer-min");
const multiplyAnswerMaxInput = document.getElementById("setting-multiply-answer-max");
const addAnswerMinInput = document.getElementById("setting-add-answer-min");
const addAnswerMaxInput = document.getElementById("setting-add-answer-max");
const singleDigitOnlyInput = document.getElementById("setting-single-digit-only");
const subtractMinuendDigitsInput = document.getElementById("setting-subtract-minuend-digits");
const subtractSubtrahendDigitsInput = document.getElementById("setting-subtract-subtrahend-digits");
const divideDividendDigitsInput = document.getElementById("setting-divide-dividend-digits");
const divideDivisorDigitsInput = document.getElementById("setting-divide-divisor-digits");
const timerEnabledInput = document.getElementById("setting-timer-enabled");
const timerSecondsInput = document.getElementById("setting-timer-seconds");
const priorityDigitInput = document.getElementById("setting-priority-digit");
const priorityPercentInput = document.getElementById("setting-priority-percent");
const volumeInput = document.getElementById("setting-volume");

const WIN_SCORE = 20;
const START_SCORE = 5;
const MAX_ROCKETS = 5;
const EXTRA_DECOY_ZOMBIES = 3;
const ZOMBIE_COUNT = MAX_ROCKETS + EXTRA_DECOY_ZOMBIES;
const ZOMBIE_REFRESH_COUNT = 3;
const DEFAULT_TIMER_SECONDS = 10;
const TIMER_MIN_SECONDS = 6;
const DIFFICULTY_STEP_MS = 30000;
const SAFE_ZONE_RADIUS = 260;
const ZOMBIE_RENDER_WIDTH = 112;
const ZOMBIE_RENDER_HEIGHT = 136;
const ZOMBIE_DEATH_DURATION_MS = 420;
const ZOMBIE_WOBBLE_ROTATION = 5;
const ZOMBIE_WOBBLE_Y = 4;
const BACKGROUND_PATH = "assets/backgrounds";
const BACKGROUND_MAX = 100;
const ZOMBIE_ATLAS_PATH = "assets/zombies/all zombies.png";
const SOUND_PATH = "assets/sounds";
const CUSTOM_ZOMBIE_PATH = "assets/zombies";
const CUSTOM_ZOMBIE_MAX = 100;
const ZOMBIE_VARIANTS = [
  { id: "01", x: 20, y: 20, width: 410, height: 470 },
  { id: "03", x: 10, y: 500, width: 350, height: 450 },
  { id: "04", x: 320, y: 500, width: 360, height: 450 },
  { id: "05", x: 670, y: 500, width: 330, height: 450 },
  { id: "08", x: 700, y: 1010, width: 315, height: 380 }
];

const settings = {
  operation: "multiply",
  multiplyAnswerMin: 1,
  multiplyAnswerMax: 100,
  singleDigitOnly: true,
  addAnswerMin: 1,
  addAnswerMax: 100,
  subtractMinuendDigits: 2,
  subtractSubtrahendDigits: 2,
  divideDividendDigits: 2,
  divideDivisorDigits: 1,
  priorityDigit: null,
  priorityPercent: 0,
  timerEnabled: false,
  timerSeconds: DEFAULT_TIMER_SECONDS,
  masterVolume: 0.75
};

const state = {
  score: START_SCORE,
  rockets: [],
  selectedRocketIndex: 2,
  zombies: [],
  projectiles: [],
  lootParticles: [],
  mouse: { x: 300, y: 250 },
  turnLimit: DEFAULT_TIMER_SECONDS,
  turnTimeLeft: DEFAULT_TIMER_SECONDS,
  lastFrameTime: 0,
  elapsedDifficultyTime: 0,
  gameActive: true,
  resolvingShot: false,
  feedbackTimeout: null,
  fireworksTimeouts: []
};

const soundState = {
  ctx: null,
  enabled: false,
  activeEffects: new Set()
};
const soundEffects = {
  begin: { src: `${SOUND_PATH}/begin.wav`, volume: 0.55, maxMs: 1800 },
  coins: { src: `${SOUND_PATH}/coins.wav`, volume: 0.6, maxMs: 1200 },
  laugh: { src: `${SOUND_PATH}/laugh.wav`, volume: 0.72, maxMs: 1400 },
  shot: { src: `${SOUND_PATH}/shot.wav`, volume: 0.75, maxMs: 700 },
  splash: { src: `${SOUND_PATH}/splash.wav`, volume: 0.8, maxMs: 700 },
  win: { src: `${SOUND_PATH}/win.wav`, volume: 0.68, maxMs: 2200 },
  zombiedeth: { src: `${SOUND_PATH}/zombiedeth.wav`, volume: 0.75, maxMs: 900 }
};

let fireworksLoopId = null;
const zombieAtlas = new Image();
const zombieAtlasState = {
  ready: false
};
const customZombieImages = [];
const availableBackgrounds = [];

zombieAtlas.addEventListener("load", () => {
  zombieAtlasState.ready = true;
  render();
});
zombieAtlas.src = ZOMBIE_ATLAS_PATH;

function loadCustomZombieImages() {
  for (let index = 1; index <= CUSTOM_ZOMBIE_MAX; index += 1) {
    const id = String(index).padStart(3, "0");
    const src = `${CUSTOM_ZOMBIE_PATH}/zombie-${id}.png`;
    const image = new Image();

    image.addEventListener("load", () => {
      customZombieImages.push({ id, src });
      const usedKeys = new Set();
      state.zombies.forEach((zombie) => {
        if (!zombie.isDying) {
          zombie.appearance = chooseZombieAppearance(usedKeys);
          usedKeys.add(getAppearanceKey(zombie.appearance));
        }
      });
      render();
    });

    image.src = src;
  }
}

function loadBackgroundImages() {
  for (let index = 1; index <= BACKGROUND_MAX; index += 1) {
    const id = String(index).padStart(3, "0");
    ["png", "jpg", "jpeg"].forEach((extension) => {
      const src = `${BACKGROUND_PATH}/background-${id}.${extension}`;
      const image = new Image();
      image.addEventListener("load", () => {
        if (!availableBackgrounds.includes(src)) {
          availableBackgrounds.push(src);
        }
        if (!arenaPhotoImg.getAttribute("src")) {
          arenaPhotoImg.src = src;
        }
      });
      image.src = src;
    });
  }
}

function pickRandomBackground() {
  if (availableBackgrounds.length === 0) {
    arenaPhotoImg.removeAttribute("src");
    return;
  }

  arenaPhotoImg.src = availableBackgrounds[randInt(0, availableBackgrounds.length - 1)];
}

function getRandomZombieAppearance() {
  if (customZombieImages.length > 0) {
    return {
      type: "custom",
      asset: customZombieImages[randInt(0, customZombieImages.length - 1)]
    };
  }

  return {
    type: "atlas",
    asset: ZOMBIE_VARIANTS[randInt(0, ZOMBIE_VARIANTS.length - 1)]
  };
}

function getAppearanceKey(appearance) {
  return `${appearance.type}:${appearance.asset.id}`;
}

function getAppearancePool() {
  if (customZombieImages.length > 0) {
    return customZombieImages.map((asset) => ({ type: "custom", asset }));
  }

  return ZOMBIE_VARIANTS.map((asset) => ({ type: "atlas", asset }));
}

function chooseZombieAppearance(excludedKeys = new Set()) {
  const pool = getAppearancePool();
  const uniqueChoices = pool.filter((appearance) => !excludedKeys.has(getAppearanceKey(appearance)));

  if (uniqueChoices.length > 0) {
    return uniqueChoices[randInt(0, uniqueChoices.length - 1)];
  }

  return pool[randInt(0, pool.length - 1)];
}

function getActiveAppearanceKeys(extraExcludedKeys = []) {
  const keys = new Set(extraExcludedKeys);
  state.zombies.forEach((zombie) => {
    if (zombie?.appearance) {
      keys.add(getAppearanceKey(zombie.appearance));
    }
  });
  return keys;
}

loadCustomZombieImages();
loadBackgroundImages();

function makeId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function ensureAudio() {
  if (!soundState.ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }
    soundState.ctx = new AudioCtx();
  }

  if (soundState.ctx.state === "suspended") {
    soundState.ctx.resume();
  }

  soundState.enabled = true;
  return soundState.ctx;
}

function getCurrentMasterVolume() {
  const sliderValue = Number(volumeInput?.value);
  if (Number.isFinite(sliderValue)) {
    return clamp(sliderValue / 100, 0, 1);
  }

  return clamp(settings.masterVolume, 0, 1);
}

function updateMasterVolume() {
  const volume = getCurrentMasterVolume();
  settings.masterVolume = volume;

  soundState.activeEffects.forEach((effect) => {
    const audio = effect.audio;
    if (!audio) {
      return;
    }
    audio.volume = clamp(effect.baseVolume * volume, 0, 1);
  });

  return volume;
}

function playTone(type, frequency, duration, volume, slideTo = null) {
  const ctx = ensureAudio();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slideTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume * getCurrentMasterVolume(), now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playSoundEffect(name) {
  const config = soundEffects[name];
  if (!config) {
    return false;
  }

  const audio = new Audio(config.src);
  audio.preload = "auto";
  audio.volume = config.volume * updateMasterVolume();
  const effectEntry = {
    audio,
    baseVolume: config.volume
  };
  soundState.activeEffects.add(effectEntry);

  const cleanup = () => {
    soundState.activeEffects.delete(effectEntry);
  };
  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("pause", () => {
    if (audio.currentTime === 0 || audio.ended) {
      cleanup();
    }
  });

  if (config.maxMs) {
    audio.addEventListener("play", () => {
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, config.maxMs);
    }, { once: true });
  }

  audio.play().catch(() => {});
  return true;
}

function playShotSound() {
  if (!playSoundEffect("shot")) {
    playTone("sawtooth", 260, 0.12, 0.05, 140);
  }
}

function playHitSound() {
  if (!playSoundEffect("zombiedeth")) {
    playTone("triangle", 520, 0.12, 0.06, 780);
    setTimeout(() => playTone("triangle", 780, 0.12, 0.04, 980), 60);
  }
}

function playMissSound() {
  playTone("square", 220, 0.18, 0.05, 120);
}

function playCoinSound() {
  if (!playSoundEffect("coins")) {
    playTone("triangle", 780, 0.08, 0.05, 980);
    setTimeout(() => playTone("triangle", 980, 0.1, 0.04, 1240), 55);
    setTimeout(() => playTone("triangle", 1240, 0.12, 0.035, 1480), 105);
  }
}

function playEvilLaughSound() {
  if (!playSoundEffect("laugh")) {
    [260, 320, 280, 360].forEach((note, index) => {
      setTimeout(() => playTone("sawtooth", note, 0.14, 0.045, note * 0.9), index * 95);
    });
  }
}

function playSplatSound() {
  if (!playSoundEffect("splash")) {
    playTone("square", 160, 0.08, 0.05, 90);
    setTimeout(() => playTone("sawtooth", 110, 0.1, 0.04, 70), 40);
  }
}

function playVictorySound() {
  if (!playSoundEffect("win")) {
    [440, 554, 659, 880].forEach((note, index) => {
      setTimeout(() => playTone("triangle", note, 0.24, 0.05, note * 1.08), index * 110);
    });
  }
}

function playBeginSound() {
  playSoundEffect("begin");
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function syncInputsWithSettings() {
  operationInput.value = settings.operation;
  multiplyAnswerMinInput.value = String(settings.multiplyAnswerMin);
  multiplyAnswerMaxInput.value = String(settings.multiplyAnswerMax);
  addAnswerMinInput.value = String(settings.addAnswerMin);
  addAnswerMaxInput.value = String(settings.addAnswerMax);
  singleDigitOnlyInput.checked = settings.singleDigitOnly;
  subtractMinuendDigitsInput.value = String(settings.subtractMinuendDigits);
  subtractSubtrahendDigitsInput.value = String(settings.subtractSubtrahendDigits);
  divideDividendDigitsInput.value = String(settings.divideDividendDigits);
  divideDivisorDigitsInput.value = String(settings.divideDivisorDigits);
  priorityDigitInput.value = settings.priorityDigit ?? "";
  priorityPercentInput.value = String(settings.priorityPercent);
  timerEnabledInput.checked = settings.timerEnabled;
  timerSecondsInput.value = String(settings.timerSeconds);
  volumeInput.value = String(Math.round(settings.masterVolume * 100));
  updateOperationSettingsVisibility();
}

function updateOperationSettingsVisibility() {
  multiplySettingsPanel.classList.toggle("hidden-panel", operationInput.value !== "multiply");
  addSettingsPanel.classList.toggle("hidden-panel", operationInput.value !== "add");
  subtractSettingsPanel.classList.toggle("hidden-panel", operationInput.value !== "subtract");
  divideSettingsPanel.classList.toggle("hidden-panel", operationInput.value !== "divide");
}

function getOperationAnswerBounds(operation = settings.operation) {
  const rawMin = operation === "add" ? settings.addAnswerMin : settings.multiplyAnswerMin;
  const rawMax = operation === "add" ? settings.addAnswerMax : settings.multiplyAnswerMax;
  const min = Math.max(1, Math.floor(Math.min(rawMin, rawMax)));
  const max = Math.max(min, Math.floor(Math.max(rawMin, rawMax)));
  return { min, max };
}

function getDigitLimit(digits) {
  return Math.max(1, (10 ** Math.max(1, digits)) - 1);
}

function getDivisors(number) {
  const divisors = [];

  for (let candidate = 1; candidate <= Math.floor(Math.sqrt(number)); candidate += 1) {
    if (number % candidate !== 0) {
      continue;
    }

    divisors.push(candidate);
    if (candidate !== number / candidate) {
      divisors.push(number / candidate);
    }
  }

  return divisors;
}

function getSingleDigitMultiplicationProblems() {
  const { min, max } = getOperationAnswerBounds("multiply");
  const problems = [];
  const seenAnswers = new Set();

  for (let a = 1; a <= 9; a += 1) {
    for (let b = a; b <= 9; b += 1) {
      const answer = a * b;
      if (answer < min || answer > max || seenAnswers.has(answer)) {
        continue;
      }

      seenAnswers.add(answer);
      problems.push({ a, b, answer });
    }
  }

  return problems;
}

function isSingleDigitMultiplicationRangeFullySupported() {
  const { min, max } = getOperationAnswerBounds("multiply");

  if (min < 1 || max > 81) {
    return false;
  }

  const problems = getSingleDigitMultiplicationProblems();
  if (problems.length === 0) {
    return false;
  }

  const supportedAnswers = new Set(problems.map(({ answer }) => answer));
  for (let answer = min; answer <= max; answer += 1) {
    if (!supportedAnswers.has(answer)) {
      return false;
    }
  }

  return true;
}

function includesPriorityDigit(value) {
  if (settings.priorityDigit === null || Number.isNaN(settings.priorityDigit)) {
    return false;
  }
  return String(Math.abs(value)).includes(String(settings.priorityDigit));
}

function shouldUsePriorityDigit() {
  return settings.priorityDigit !== null && settings.priorityPercent > 0 && chance(settings.priorityPercent);
}

function numberWithDigit(maxValue) {
  const limit = Math.max(0, Math.floor(maxValue));
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const candidate = randInt(0, limit);
    if (includesPriorityDigit(candidate)) {
      return candidate;
    }
  }
  return null;
}

function createMultiplicationProblem() {
  const { min, max } = getOperationAnswerBounds("multiply");
  const usePriorityDigit = shouldUsePriorityDigit();

  if (settings.singleDigitOnly) {
    let problems = getSingleDigitMultiplicationProblems();
    if (usePriorityDigit) {
      problems = problems.filter(({ a, b }) => includesPriorityDigit(a) || includesPriorityDigit(b));
    }
    if (problems.length > 0) {
      const chosen = problems[randInt(0, problems.length - 1)];
      const pair = shuffle([chosen.a, chosen.b]);
      return { text: `${pair[0]} x ${pair[1]}`, answer: chosen.answer };
    }
  }

  let answer = randInt(min, max);
  if (usePriorityDigit) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const candidate = randInt(min, max);
      const divisors = getDivisors(candidate);
      if (divisors.some((a) => includesPriorityDigit(a) || includesPriorityDigit(candidate / a))) {
        answer = candidate;
        break;
      }
    }
  }
  const divisors = getDivisors(answer);
  const a = divisors[randInt(0, divisors.length - 1)];
  const b = answer / a;
  const pair = shuffle([a, b]);
  return { text: `${pair[0]} x ${pair[1]}`, answer };
}

function createAdditionProblem() {
  const { min, max } = getOperationAnswerBounds("add");
  const answer = randInt(min, max);
  let a = randInt(0, answer);
  if (shouldUsePriorityDigit()) {
    const preferred = numberWithDigit(answer);
    if (preferred !== null) {
      a = preferred;
    }
  }
  const b = answer - a;
  const pair = shuffle([a, b]);
  return { text: `${pair[0]} + ${pair[1]}`, answer };
}

function createSubtractionProblem() {
  const minuendLimit = getDigitLimit(settings.subtractMinuendDigits);
  const subtrahendLimit = getDigitLimit(settings.subtractSubtrahendDigits);
  let minuend = randInt(0, minuendLimit);
  let subtrahend = randInt(0, Math.min(subtrahendLimit, minuend));

  if (shouldUsePriorityDigit()) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const preferredMinuend = randInt(0, minuendLimit);
      const preferredSubtrahend = randInt(0, Math.min(subtrahendLimit, preferredMinuend));
      if (includesPriorityDigit(preferredMinuend) || includesPriorityDigit(preferredSubtrahend)) {
        minuend = preferredMinuend;
        subtrahend = preferredSubtrahend;
        break;
      }
    }
  }

  return { text: `${minuend} - ${subtrahend}`, answer: minuend - subtrahend };
}

function createDivisionProblem() {
  const dividendLimit = getDigitLimit(settings.divideDividendDigits);
  const divisorLimit = getDigitLimit(settings.divideDivisorDigits);
  let divisor = randInt(1, divisorLimit);
  let quotient = randInt(1, Math.max(1, Math.floor(dividendLimit / divisor)));
  let dividend = divisor * quotient;

  if (shouldUsePriorityDigit()) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const preferredDivisor = randInt(1, divisorLimit);
      const preferredQuotient = randInt(1, Math.max(1, Math.floor(dividendLimit / preferredDivisor)));
      const preferredDividend = preferredDivisor * preferredQuotient;
      if (includesPriorityDigit(preferredDividend) || includesPriorityDigit(preferredDivisor)) {
        divisor = preferredDivisor;
        quotient = preferredQuotient;
        dividend = preferredDividend;
        break;
      }
    }
  }

  return { text: `${dividend} : ${divisor}`, answer: quotient };
}

function createProblem() {
  if (settings.operation === "add") {
    return createAdditionProblem();
  }
  if (settings.operation === "subtract") {
    return createSubtractionProblem();
  }
  if (settings.operation === "divide") {
    return createDivisionProblem();
  }
  return createMultiplicationProblem();
}

function createRocket() {
  return createProblem();
}

function createDecoyAnswer(excluded = new Set()) {
  let min = 1;
  let max = 100;

  if (settings.operation === "add") {
    ({ min, max } = getOperationAnswerBounds("add"));
  } else if (settings.operation === "multiply") {
    ({ min, max } = getOperationAnswerBounds("multiply"));
  } else if (settings.operation === "subtract") {
    min = 0;
    max = getDigitLimit(settings.subtractMinuendDigits);
  } else if (settings.operation === "divide") {
    min = 1;
    max = getDigitLimit(settings.divideDividendDigits);
  }

  const span = max - min + 1;

  if (span <= excluded.size) {
    return randInt(min, max);
  }

  let attempts = 0;
  while (attempts < 80) {
    const candidate = randInt(min, max);
    if (!excluded.has(candidate)) {
      return candidate;
    }
    attempts += 1;
  }

  for (let candidate = min; candidate <= max; candidate += 1) {
    if (!excluded.has(candidate)) {
      return candidate;
    }
  }

  return randInt(min, max);
}

function fillRockets() {
  while (state.rockets.length < MAX_ROCKETS) {
    state.rockets.push(createRocket());
  }
  if (state.rockets.length > MAX_ROCKETS) {
    state.rockets = state.rockets.slice(0, MAX_ROCKETS);
  }
  state.selectedRocketIndex = clamp(state.selectedRocketIndex, 0, state.rockets.length - 1);
}

function buildZombieNumbers() {
  const answers = state.rockets.map((rocket) => rocket.answer);
  const used = new Set(answers);
  const numbers = [...answers];

  while (numbers.length < ZOMBIE_COUNT) {
    const decoy = createDecoyAnswer(used);
    used.add(decoy);
    numbers.push(decoy);
  }

  return shuffle(numbers);
}

function getTurretBase() {
  const arenaRect = arena.getBoundingClientRect();
  return {
    x: arenaRect.width / 2,
    y: arenaRect.height - 92
  };
}

function pushOutOfSafeZone(position) {
  const base = getTurretBase();
  const dx = position.x + ZOMBIE_RENDER_WIDTH / 2 - base.x;
  const dy = position.y + ZOMBIE_RENDER_HEIGHT / 2 - base.y;
  const distance = Math.hypot(dx, dy) || 1;

  if (distance >= SAFE_ZONE_RADIUS) {
    return position;
  }

  const scale = SAFE_ZONE_RADIUS / distance;
  return {
    x: base.x + dx * scale - ZOMBIE_RENDER_WIDTH / 2,
    y: base.y + dy * scale - ZOMBIE_RENDER_HEIGHT / 2
  };
}

function createZombie(number, preferredPosition = null, excludedAppearanceKeys = new Set()) {
  const arenaRect = arena.getBoundingClientRect();
  const { min, max } = settings.operation === "multiply" || settings.operation === "add"
    ? getOperationAnswerBounds(settings.operation)
    : { min: 0, max: getDigitLimit(settings.operation === "subtract" ? settings.subtractMinuendDigits : settings.divideDividendDigits) };
  const answerSpan = max - min;
  const levelSpeed = 30 + Math.min(28, Math.floor(answerSpan / 20));
  const minX = 8;
  const maxX = Math.max(arenaRect.width - ZOMBIE_RENDER_WIDTH, 8);
  const minY = 14;
  const maxY = Math.max(arenaRect.height - 228, 90);
  const rawPosition = preferredPosition ?? {
    x: randInt(minX, maxX),
    y: randInt(minY, maxY)
  };
  const safePosition = pushOutOfSafeZone(rawPosition);
  const vx = (Math.random() < 0.5 ? -1 : 1) * (levelSpeed + Math.random() * 18);
  const vy = (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 18);

  return {
    id: makeId("z"),
    number,
    appearance: chooseZombieAppearance(excludedAppearanceKeys),
    x: clamp(safePosition.x, minX, maxX),
    y: clamp(safePosition.y, minY, maxY),
    vx,
    vy,
    width: ZOMBIE_RENDER_WIDTH,
    height: ZOMBIE_RENDER_HEIGHT,
    walkPhase: Math.random() * Math.PI * 2,
    deathProgress: 0,
    isDying: false,
    facing: vx < 0 ? 1 : -1
  };
}

function syncZombieSet() {
  const usedKeys = new Set();
  state.zombies = buildZombieNumbers().map((number) => {
    const zombie = createZombie(number, null, usedKeys);
    usedKeys.add(getAppearanceKey(zombie.appearance));
    return zombie;
  });
}

function ensureAllRocketAnswersVisible() {
  const currentNumbers = state.zombies.map((zombie) => zombie.number);
  state.rockets.forEach((rocket, index) => {
    if (!currentNumbers.includes(rocket.answer) && state.zombies[index]) {
      const excludedKeys = getActiveAppearanceKeys([
        getAppearanceKey(state.zombies[index].appearance)
      ]);
      excludedKeys.delete(getAppearanceKey(state.zombies[index].appearance));
      state.zombies[index] = createZombie(rocket.answer, state.zombies[index], excludedKeys);
      currentNumbers[index] = rocket.answer;
    }
  });
}

function refreshZombieNumbers(minChanged = ZOMBIE_REFRESH_COUNT) {
  const replacementPool = buildZombieNumbers();
  const indexes = new Set();

  while (indexes.size < Math.min(minChanged, state.zombies.length)) {
    indexes.add(randInt(0, state.zombies.length - 1));
  }

  let replacementIndex = 0;
  indexes.forEach((index) => {
    const excludedKeys = getActiveAppearanceKeys([
      getAppearanceKey(state.zombies[index].appearance)
    ]);
    excludedKeys.delete(getAppearanceKey(state.zombies[index].appearance));
    state.zombies[index] = createZombie(replacementPool[replacementIndex], state.zombies[index], excludedKeys);
    replacementIndex += 1;
  });

  ensureAllRocketAnswersVisible();
}

function resetTurnTimer() {
  state.turnLimit = Math.max(settings.timerSeconds, TIMER_MIN_SECONDS);
  state.turnTimeLeft = state.turnLimit;
}

function clearFireworks() {
  fireworksLayer.innerHTML = "";
  state.fireworksTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  state.fireworksTimeouts = [];
  if (fireworksLoopId !== null) {
    clearInterval(fireworksLoopId);
    fireworksLoopId = null;
  }
}

function spawnFireworkWave() {
  const colors = ["#ffd60a", "#ff7b00", "#7df9ff", "#ff4d8d", "#b8ff5c", "#fef08a", "#ffffff"];

  for (let burstIndex = 0; burstIndex < 8; burstIndex += 1) {
    const timeoutId = setTimeout(() => {
      const burst = document.createElement("div");
      burst.className = "firework-burst";
      burst.style.left = `${randInt(12, 88)}%`;
      burst.style.top = `${randInt(10, 55)}%`;

      for (let particleIndex = 0; particleIndex < 24; particleIndex += 1) {
        const particle = document.createElement("span");
        particle.className = "firework-particle";
        particle.style.setProperty("--particle", colors[randInt(0, colors.length - 1)]);
        particle.style.setProperty("--tx", `${Math.cos((particleIndex / 24) * Math.PI * 2) * randInt(55, 150)}px`);
        particle.style.setProperty("--ty", `${Math.sin((particleIndex / 24) * Math.PI * 2) * randInt(55, 150)}px`);
        burst.appendChild(particle);
      }

      fireworksLayer.appendChild(burst);
      setTimeout(() => burst.remove(), 950);
    }, burstIndex * 180);

    state.fireworksTimeouts.push(timeoutId);
  }
}

function launchFireworks() {
  clearFireworks();
  spawnFireworkWave();
  fireworksLoopId = setInterval(() => {
    if (overlay.classList.contains("hidden")) {
      clearFireworks();
      return;
    }
    spawnFireworkWave();
  }, 1700);
}

function createFeedback(text, type) {
  const existing = arena.querySelector(".feedback");
  if (existing) {
    existing.remove();
  }

  const feedback = document.createElement("div");
  feedback.className = `feedback ${type}`;
  feedback.textContent = text;
  arena.appendChild(feedback);

  clearTimeout(state.feedbackTimeout);
  requestAnimationFrame(() => feedback.classList.add("show"));
  state.feedbackTimeout = setTimeout(() => {
    feedback.classList.remove("show");
    setTimeout(() => feedback.remove(), 180);
  }, 900);
}

function spawnLootBurst(from, to, kind) {
  const count = randInt(5, 6);
  const soundParticleIndex = randInt(0, count - 1);

  for (let index = 0; index < count; index += 1) {
    const arcLift = randInt(28, 62);
    state.lootParticles.push({
      id: makeId("loot"),
      kind: kind === "loss" ? "poop" : chance(35) ? "diamond" : "coin",
      x: from.x + randInt(-12, 12),
      y: from.y + randInt(-12, 12),
      startX: from.x,
      startY: from.y,
      targetX: to.x + randInt(-18, 18),
      targetY: to.y + randInt(-18, 18),
      progress: 0,
      speed: randInt(2, 4) / 1.8,
      arcLift,
      drift: randInt(-18, 18),
      direction: kind,
      soundOnArrive: index === soundParticleIndex ? kind : null
    });
  }
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  if (settings.operation === "multiply") {
    levelEl.textContent = settings.singleDigitOnly
      ? `Умножение ${settings.multiplyAnswerMin} - ${settings.multiplyAnswerMax}, едноцифрени`
      : `Умножение ${settings.multiplyAnswerMin} - ${settings.multiplyAnswerMax}`;
  } else if (settings.operation === "add") {
    levelEl.textContent = `Събиране ${settings.addAnswerMin} - ${settings.addAnswerMax}`;
  } else if (settings.operation === "subtract") {
    levelEl.textContent = `Изваждане до ${settings.subtractMinuendDigits}/${settings.subtractSubtrahendDigits} цифри`;
  } else {
    levelEl.textContent = `Деление до ${settings.divideDividendDigits}/${settings.divideDivisorDigits} цифри`;
  }
  turnTimerEl.textContent = settings.timerEnabled ? state.turnTimeLeft.toFixed(1) : "Изкл.";
  timerLimitEl.textContent = settings.timerEnabled ? `${state.turnLimit} сек` : "Без таймер";
}

function useSelectedRocket() {
  state.rockets.splice(state.selectedRocketIndex, 1);
  state.rockets.push(createRocket());
  state.selectedRocketIndex = Math.floor(state.rockets.length / 2);
}

function changeScore(delta) {
  state.score = clamp(state.score + delta, 0, WIN_SCORE);
  updateHud();

  if (state.score >= WIN_SCORE) {
    endGame(true);
  } else if (state.score <= 0) {
    endGame(false);
  }
}

function afterResolvedShot(isCorrect, removeZombieIndex = null) {
  state.resolvingShot = false;

  if (removeZombieIndex !== null) {
    state.zombies.splice(removeZombieIndex, 1);
  }

  changeScore(isCorrect ? 1 : -1);
  if (!state.gameActive) {
    return;
  }

  useSelectedRocket();

  while (state.zombies.length < ZOMBIE_COUNT) {
    const zombie = createZombie(createDecoyAnswer(), null, getActiveAppearanceKeys());
    state.zombies.push(zombie);
  }

  refreshZombieNumbers(ZOMBIE_REFRESH_COUNT);
  ensureAllRocketAnswersVisible();
  resetTurnTimer();
  render();
}

function fireRocket(targetX, targetY) {
  if (!state.gameActive || state.rockets.length === 0 || state.resolvingShot) {
    return;
  }

  const start = getTurretBase();
  const dx = targetX - start.x;
  const dy = targetY - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 560;

  playShotSound();

  state.projectiles.push({
    id: makeId("p"),
    x: start.x,
    y: start.y,
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    radius: 8,
    rocket: state.rockets[state.selectedRocketIndex]
  });
}

function handleZombieHit(projectileIndex, zombieIndex) {
  const projectile = state.projectiles[projectileIndex];
  const zombie = state.zombies[zombieIndex];

  if (zombie.isDying || state.resolvingShot) {
    return;
  }

  const isCorrect = projectile.rocket.answer === zombie.number;

  state.projectiles.splice(projectileIndex, 1);

  if (isCorrect) {
    const turretBase = getTurretBase();
    const zombieCenter = {
      x: zombie.x + zombie.width / 2,
      y: zombie.y + zombie.height / 2
    };
    spawnLootBurst(zombieCenter, turretBase, "gain");
    state.resolvingShot = true;
    zombie.isDying = true;
    zombie.deathProgress = 0;
    zombie.vx = 0;
    zombie.vy = 0;
    playHitSound();
    createFeedback("Верен отговор! +1 точка", "good");
    setTimeout(() => {
      afterResolvedShot(true, zombieIndex);
    }, ZOMBIE_DEATH_DURATION_MS);
  } else {
    const turretBase = getTurretBase();
    const zombieCenter = {
      x: zombie.x + zombie.width / 2,
      y: zombie.y + zombie.height / 2
    };
    spawnLootBurst(turretBase, zombieCenter, "loss");
    playEvilLaughSound();
    createFeedback("Грешно зомби! -1 точка", "bad");
    afterResolvedShot(false);
  }
}

function updateProjectiles(deltaTime) {
  const arenaRect = arena.getBoundingClientRect();

  for (let projectileIndex = state.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
    const projectile = state.projectiles[projectileIndex];
    projectile.x += projectile.vx * deltaTime;
    projectile.y += projectile.vy * deltaTime;

    if (
      projectile.x < -30 ||
      projectile.x > arenaRect.width + 30 ||
      projectile.y < -30 ||
      projectile.y > arenaRect.height + 30
    ) {
      state.projectiles.splice(projectileIndex, 1);
      continue;
    }

    for (let zombieIndex = state.zombies.length - 1; zombieIndex >= 0; zombieIndex -= 1) {
      const zombie = state.zombies[zombieIndex];
      const zx = zombie.x + zombie.width / 2;
      const zy = zombie.y + zombie.height / 2;
      const hitDistance = Math.hypot(projectile.x - zx, projectile.y - zy);

      if (hitDistance < 46) {
        handleZombieHit(projectileIndex, zombieIndex);
        break;
      }
    }
  }
}

function updateLootParticles(deltaTime) {
  for (let index = state.lootParticles.length - 1; index >= 0; index -= 1) {
    const particle = state.lootParticles[index];
    particle.progress += deltaTime * particle.speed;

    if (particle.progress >= 1) {
      if (particle.soundOnArrive === "gain") {
        playCoinSound();
      } else if (particle.soundOnArrive === "loss") {
        playSplatSound();
      }
      state.lootParticles.splice(index, 1);
      continue;
    }

    const eased = 1 - Math.pow(1 - particle.progress, 3);
    const x = particle.startX + (particle.targetX - particle.startX) * eased;
    const yBase = particle.startY + (particle.targetY - particle.startY) * eased;
    const arc = Math.sin(particle.progress * Math.PI) * particle.arcLift;
    particle.x = x + Math.sin(particle.progress * Math.PI * 2) * particle.drift * 0.12;
    particle.y = yBase - arc;
  }
}

function updateZombies(deltaTime) {
  const arenaRect = arena.getBoundingClientRect();
  const minX = 8;
  const maxX = arenaRect.width - ZOMBIE_RENDER_WIDTH;
  const minY = 14;
  const maxY = arenaRect.height - 220;
  const base = getTurretBase();

  state.zombies.forEach((zombie) => {
    if (zombie.isDying) {
      zombie.deathProgress = Math.min(1, zombie.deathProgress + (deltaTime * 1000) / ZOMBIE_DEATH_DURATION_MS);
      return;
    }

    zombie.walkPhase += deltaTime * 7.5;

    zombie.x += zombie.vx * deltaTime;
    zombie.y += zombie.vy * deltaTime;

    if (zombie.x <= minX || zombie.x >= maxX) {
      zombie.vx *= -1;
      zombie.facing = zombie.vx < 0 ? 1 : -1;
      zombie.x = clamp(zombie.x, minX, maxX);
    }

    if (zombie.y <= minY || zombie.y >= maxY) {
      zombie.vy *= -1;
      zombie.y = clamp(zombie.y, minY, maxY);
    }

    const dx = zombie.x + zombie.width / 2 - base.x;
    const dy = zombie.y + zombie.height / 2 - base.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (distance < SAFE_ZONE_RADIUS) {
      zombie.x = clamp(base.x + (dx / distance) * SAFE_ZONE_RADIUS - zombie.width / 2, minX, maxX);
      zombie.y = clamp(base.y + (dy / distance) * SAFE_ZONE_RADIUS - zombie.height / 2, minY, maxY);
      zombie.vx *= -1;
      zombie.vy *= -1;
      zombie.facing = zombie.vx < 0 ? 1 : -1;
    }
  });
}

function updateTimer(deltaTime) {
  if (!settings.timerEnabled) {
    return;
  }

  state.turnTimeLeft -= deltaTime;
  state.elapsedDifficultyTime += deltaTime * 1000;

  if (state.elapsedDifficultyTime >= DIFFICULTY_STEP_MS && state.turnLimit > TIMER_MIN_SECONDS) {
    state.elapsedDifficultyTime = 0;
    state.turnLimit -= 1;
    state.turnTimeLeft = Math.min(state.turnTimeLeft, state.turnLimit);
    createFeedback(`Нов лимит: ${state.turnLimit} секунди`, "good");
  }

  if (state.turnTimeLeft <= 0) {
    playMissSound();
    createFeedback("Времето изтече! -1 точка", "bad");
    afterResolvedShot(false);
  }
}

function renderRockets() {
  rocketRack.innerHTML = "";
  const compact = window.innerWidth <= 640;
  const spacing = compact ? 74 : 120;

  state.rockets.forEach((rocket, index) => {
    const offset = index - state.selectedRocketIndex;
    const scale = index === state.selectedRocketIndex ? 1.2 : 0.92 - Math.abs(offset) * 0.08;
    const yOffset = index === state.selectedRocketIndex ? -26 : Math.abs(offset) * 10;
    const opacity = Math.max(0.35, 1 - Math.abs(offset) * 0.18);

    const card = document.createElement("div");
    card.className = `rocket-card${index === state.selectedRocketIndex ? " selected" : ""}`;
    card.style.transform = `translate(calc(-50% + ${offset * spacing}px), ${yOffset}px) scale(${scale})`;
    card.style.zIndex = String(10 - Math.abs(offset));
    card.style.opacity = String(opacity);

    const formula = document.createElement("span");
    formula.className = "formula";
    formula.textContent = rocket.text;

    const answer = document.createElement("span");
    answer.className = "answer";
    answer.textContent = index === state.selectedRocketIndex ? "Заредена" : "Чака";

    card.append(formula, answer);
    rocketRack.appendChild(card);
  });
}

function renderZombies() {
  zombiesLayer.innerHTML = "";
  state.zombies.forEach((zombie) => {
    const zombieEl = document.createElement("div");
    zombieEl.className = "zombie";
    zombieEl.dataset.zombieId = zombie.id;
    zombieEl.style.transform = `translate(${zombie.x}px, ${zombie.y}px)`;

    const sprite = document.createElement("div");
    sprite.className = "zombie-sprite";

    const walkAngle = Math.sin(zombie.walkPhase) * ZOMBIE_WOBBLE_ROTATION;
    const walkY = Math.sin(zombie.walkPhase * 1.1) * ZOMBIE_WOBBLE_Y;
    const rotation = zombie.isDying ? zombie.deathProgress * 90 : walkAngle;
    const translateY = zombie.isDying ? zombie.deathProgress * 10 : walkY;

    sprite.style.transform = `translateY(${translateY}px) scaleX(${zombie.facing}) rotate(${rotation}deg)`;

    if (zombie.appearance.type === "custom") {
      const customImage = document.createElement("img");
      customImage.className = "zombie-custom-image";
      customImage.src = zombie.appearance.asset.src;
      customImage.alt = "";
      customImage.draggable = false;
      sprite.classList.add("custom");
      sprite.append(customImage);
    } else if (zombieAtlasState.ready) {
      const atlasFrame = document.createElement("img");
      const variant = zombie.appearance.asset;
      const fitScale = Math.min(zombie.width / variant.width, zombie.height / variant.height);
      const scaledWidth = 1024 * fitScale;
      const scaledHeight = 1536 * fitScale;
      const offsetX = -variant.x * fitScale + (zombie.width - variant.width * fitScale) / 2;
      const offsetY = -variant.y * fitScale + (zombie.height - variant.height * fitScale) / 2;

      atlasFrame.className = "zombie-atlas";
      atlasFrame.src = ZOMBIE_ATLAS_PATH;
      atlasFrame.alt = "";
      atlasFrame.draggable = false;

      sprite.classList.add("atlas");
      atlasFrame.style.width = `${scaledWidth}px`;
      atlasFrame.style.height = `${scaledHeight}px`;
      atlasFrame.style.left = `${offsetX}px`;
      atlasFrame.style.top = `${offsetY}px`;
      sprite.append(atlasFrame);
    } else {
      sprite.classList.add("fallback");

      const body = document.createElement("div");
      body.className = "zombie-body";

      const head = document.createElement("div");
      head.className = "zombie-head";

      sprite.append(head, body);
    }

    const number = document.createElement("div");
    number.className = "zombie-number";
    number.textContent = zombie.number;

    zombieEl.append(sprite, number);
    zombiesLayer.appendChild(zombieEl);
  });
}

function renderProjectiles() {
  projectilesLayer.innerHTML = "";
  state.projectiles.forEach((projectile) => {
    const bullet = document.createElement("div");
    bullet.className = "projectile";
    bullet.style.transform = `translate(${projectile.x - projectile.radius}px, ${projectile.y - projectile.radius}px)`;
    projectilesLayer.appendChild(bullet);
  });
}

function renderLootParticles() {
  lootLayer.innerHTML = "";
  state.lootParticles.forEach((particle) => {
    const piece = document.createElement("div");
    piece.className = `loot-piece ${particle.kind} ${particle.direction}`;
    piece.style.transform = `translate(${particle.x - 10}px, ${particle.y - 10}px) rotate(${particle.progress * 540}deg) scale(${1 - particle.progress * 0.25})`;
    lootLayer.appendChild(piece);
  });
}

function updateTurretAim() {
  const start = getTurretBase();
  const angle = Math.atan2(state.mouse.y - start.y, state.mouse.x - start.x) * (180 / Math.PI);
  turret.querySelector(".turret-barrel").style.transform = `rotate(${angle}deg)`;
}

function renderCrosshair() {
  crosshair.style.left = `${state.mouse.x}px`;
  crosshair.style.top = `${state.mouse.y}px`;
}

function render() {
  updateHud();
  renderRockets();
  renderZombies();
  renderProjectiles();
  renderLootParticles();
  updateTurretAim();
  renderCrosshair();
}

function endGame(won) {
  state.gameActive = false;
  overlay.classList.remove("hidden");
  overlayTitle.textContent = won ? "Победа!" : "Край на играта";
  overlayText.textContent = won
    ? "Стигна 20 точки. Наградата ти е истински фойерверк!"
    : "Точките ти станаха 0. Пробвай пак с нови настройки.";

  if (won) {
    playVictorySound();
    launchFireworks();
  } else {
    clearFireworks();
  }
}

function resetGame(playIntro = false) {
  updateMasterVolume();
  state.score = START_SCORE;
  state.rockets = [];
  state.selectedRocketIndex = 2;
  state.zombies = [];
  state.projectiles = [];
  state.lootParticles = [];
  state.elapsedDifficultyTime = 0;
  state.gameActive = true;
  state.resolvingShot = false;
  overlay.classList.add("hidden");
  clearFireworks();
  pickRandomBackground();
  if (playIntro) {
    playBeginSound();
  }
  fillRockets();
  state.selectedRocketIndex = Math.floor(state.rockets.length / 2);
  resetTurnTimer();
  syncZombieSet();
  render();
}

function applySettingsFromForm() {
  settings.operation = operationInput.value;
  settings.multiplyAnswerMin = Math.max(1, Math.floor(Number(multiplyAnswerMinInput.value) || 1));
  settings.multiplyAnswerMax = Math.max(1, Math.floor(Number(multiplyAnswerMaxInput.value) || 100));
  if (settings.multiplyAnswerMin > settings.multiplyAnswerMax) {
    [settings.multiplyAnswerMin, settings.multiplyAnswerMax] = [settings.multiplyAnswerMax, settings.multiplyAnswerMin];
  }

  settings.addAnswerMin = Math.max(1, Math.floor(Number(addAnswerMinInput.value) || 1));
  settings.addAnswerMax = Math.max(1, Math.floor(Number(addAnswerMaxInput.value) || 100));
  if (settings.addAnswerMin > settings.addAnswerMax) {
    [settings.addAnswerMin, settings.addAnswerMax] = [settings.addAnswerMax, settings.addAnswerMin];
  }

  settings.singleDigitOnly = singleDigitOnlyInput.checked;
  if (settings.singleDigitOnly && !isSingleDigitMultiplicationRangeFullySupported()) {
    settings.singleDigitOnly = false;
    singleDigitOnlyInput.checked = false;
  }

  settings.subtractMinuendDigits = clamp(Number(subtractMinuendDigitsInput.value) || 2, 1, 6);
  settings.subtractSubtrahendDigits = clamp(Number(subtractSubtrahendDigitsInput.value) || 2, 1, 6);
  settings.divideDividendDigits = clamp(Number(divideDividendDigitsInput.value) || 2, 1, 6);
  settings.divideDivisorDigits = clamp(Number(divideDivisorDigitsInput.value) || 1, 1, 6);

  if (settings.subtractSubtrahendDigits > settings.subtractMinuendDigits) {
    settings.subtractSubtrahendDigits = settings.subtractMinuendDigits;
  }

  if (settings.divideDivisorDigits > settings.divideDividendDigits) {
    settings.divideDivisorDigits = settings.divideDividendDigits;
  }

  subtractMinuendDigitsInput.value = String(settings.subtractMinuendDigits);
  subtractSubtrahendDigitsInput.value = String(settings.subtractSubtrahendDigits);
  divideDividendDigitsInput.value = String(settings.divideDividendDigits);
  divideDivisorDigitsInput.value = String(settings.divideDivisorDigits);
  const rawPriorityDigit = priorityDigitInput.value.trim();
  settings.priorityDigit = rawPriorityDigit === "" ? null : clamp(Number(rawPriorityDigit), 0, 9);
  settings.priorityPercent = clamp(Number(priorityPercentInput.value) || 0, 0, 100);

  settings.timerEnabled = timerEnabledInput.checked;
  settings.timerSeconds = clamp(Number(timerSecondsInput.value) || DEFAULT_TIMER_SECONDS, TIMER_MIN_SECONDS, 60);
  settings.masterVolume = updateMasterVolume();

  resetGame(true);
}

function gameLoop(timestamp) {
  if (!state.lastFrameTime) {
    state.lastFrameTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - state.lastFrameTime) / 1000, 0.033);
  state.lastFrameTime = timestamp;

  if (state.gameActive) {
    updateZombies(deltaTime);
    updateProjectiles(deltaTime);
    updateLootParticles(deltaTime);
    updateTimer(deltaTime);
    render();
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (!state.gameActive) {
    return;
  }

  ensureAudio();

  if (event.key === "ArrowLeft") {
    state.selectedRocketIndex =
      (state.selectedRocketIndex - 1 + state.rockets.length) % state.rockets.length;
    render();
  }

  if (event.key === "ArrowRight") {
    state.selectedRocketIndex = (state.selectedRocketIndex + 1) % state.rockets.length;
    render();
  }
});

arena.addEventListener("mousemove", (event) => {
  const rect = arena.getBoundingClientRect();
  state.mouse.x = clamp(event.clientX - rect.left, 0, rect.width);
  state.mouse.y = clamp(event.clientY - rect.top, 0, rect.height);
  updateTurretAim();
  renderCrosshair();
});

arena.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || !state.gameActive) {
    return;
  }

  ensureAudio();
  const rect = arena.getBoundingClientRect();
  fireRocket(event.clientX - rect.left, event.clientY - rect.top);
});

operationInput.addEventListener("change", () => {
  updateOperationSettingsVisibility();
});

volumeInput.addEventListener("input", () => {
  updateMasterVolume();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  ensureAudio();
  state.lastFrameTime = 0;
  applySettingsFromForm();
});

restartBtn.addEventListener("click", () => {
  ensureAudio();
  state.lastFrameTime = 0;
  resetGame(true);
});

window.addEventListener("resize", () => {
  syncZombieSet();
  render();
});

syncInputsWithSettings();
resetGame();
requestAnimationFrame(gameLoop);
