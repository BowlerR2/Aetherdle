let characters = [];
let target = null;

const gameContainer = document.getElementById("game-container");

// Title with logo
let title = gameContainer.querySelector("h1");

if (!title) {
  title = document.createElement("h1");
  gameContainer.appendChild(title);
}

title.textContent = "";

const logo1 = document.createElement("img");
logo1.src = "images/logo1.png";
logo1.className = "title-logo";

const titleText = document.createElement("span");
titleText.textContent = "Aetherdle";

title.appendChild(logo1);
title.appendChild(titleText);

// Subtitle under title
const subtitle = document.createElement("div");
subtitle.id = "subtitle";
subtitle.textContent = "Guess the Aether Studios Character";
gameContainer.appendChild(subtitle);

let currentSuggestionIndex = -1;
let currentSuggestions = [];
let isRevealing = false;

// Daily puzzle
function getPuzzleNumber() {
  const params = new URLSearchParams(window.location.search);
  const forcedDay = params.get("day");

  if (forcedDay !== null && !Number.isNaN(parseInt(forcedDay, 10))) {
    return parseInt(forcedDay, 10);
  }

  const startDate = new Date("2026-03-12T00:00:00");
  const today = new Date();

  const startUTC = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Math.floor((todayUTC - startUTC) / (1000 * 60 * 60 * 24));
}

function seededShuffle(array, seed) {
  const result = [...array];

  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getDailyCharacter() {
  const puzzleNumber = getPuzzleNumber();
  const shuffled = seededShuffle(characters, 2026);
  return shuffled[puzzleNumber % shuffled.length];
}

const puzzleNumber = getPuzzleNumber();
const saveKey = `aetherdle-progress-${puzzleNumber}`;

// Load JSON
async function loadCharacters() {
  const response = await fetch("characters.json");

  if (!response.ok) {
    throw new Error(`Failed to load characters.json (${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("characters.json is not an array");
  }

  characters = data;
}

// Tooltip system
const tooltip = document.createElement("div");
tooltip.id = "custom-tooltip";
document.body.appendChild(tooltip);

function showTooltip(text) {
  tooltip.textContent = text;
  tooltip.classList.add("visible");
}

function moveTooltip(event) {
  tooltip.style.left = `${event.pageX + 14}px`;
  tooltip.style.top = `${event.pageY + 14}px`;
}

function hideTooltip() {
  tooltip.classList.remove("visible");
}

function attachTooltip(element, text) {
  element.dataset.tooltip = text;

  element.addEventListener("mouseenter", (event) => {
    showTooltip(element.dataset.tooltip || text);
    moveTooltip(event);
  });

  element.addEventListener("mousemove", moveTooltip);
  element.addEventListener("mouseleave", hideTooltip);
}

// Daily puzzle label (placed inside input area)
const puzzleInfo = document.createElement("div");
puzzleInfo.id = "puzzle-info";

const logo2 = document.createElement("img");
logo2.src = "images/logo2.png";
logo2.className = "puzzle-logo";

const puzzleText = document.createElement("span");
puzzleText.textContent = `Daily Puzzle #${puzzleNumber}`;

puzzleInfo.appendChild(logo2);
puzzleInfo.appendChild(puzzleText);

// Input area
const inputArea = document.createElement("div");
inputArea.id = "input-area";

const autocompleteWrapper = document.createElement("div");
autocompleteWrapper.id = "autocomplete-wrapper";

const guessInput = document.createElement("input");
guessInput.placeholder = "Type character name...";
guessInput.autocomplete = "off";

const suggestionsBox = document.createElement("div");
suggestionsBox.id = "suggestions-box";

autocompleteWrapper.appendChild(guessInput);
autocompleteWrapper.appendChild(suggestionsBox);

const submitBtn = document.createElement("button");
submitBtn.textContent = "Guess";

const shareBtn = document.createElement("button");
shareBtn.textContent = "Share";
shareBtn.id = "share-btn";

const trophyBadge = document.createElement("div");
trophyBadge.id = "trophy-badge";
trophyBadge.setAttribute("aria-label", "Puzzle completion trophy");
attachTooltip(trophyBadge, "Solve the daily puzzle to unlock the trophy");

const trophyImg = document.createElement("img");
trophyImg.src = "images/trophylogo.png";
trophyImg.alt = "Trophy";
trophyImg.id = "trophy-badge-img";
trophyBadge.appendChild(trophyImg);

inputArea.appendChild(puzzleInfo);
inputArea.appendChild(autocompleteWrapper);
inputArea.appendChild(submitBtn);
inputArea.appendChild(shareBtn);
inputArea.appendChild(trophyBadge);
gameContainer.appendChild(inputArea);

// Guess board
const guessBoard = document.createElement("div");
guessBoard.id = "guess-board";
gameContainer.appendChild(guessBoard);

// Header row
const headerRow = document.createElement("div");
headerRow.className = "header-row";

function createHeaderBox(text, tooltipText) {
  const box = document.createElement("div");
  box.className = "header-box";
  box.textContent = text;

  if (tooltipText) {
    attachTooltip(box, tooltipText);
  }

  return box;
}

// Character header (no tooltip)
const characterHeader = document.createElement("div");
characterHeader.className = "header-box";
characterHeader.textContent = "Character";
headerRow.appendChild(characterHeader);

headerRow.appendChild(
  createHeaderBox("Element", "Elemental affinity of the character")
);
headerRow.appendChild(
  createHeaderBox("Species", "Character species or lore classification")
);
headerRow.appendChild(
  createHeaderBox("Region", "Origin region and regions associated with character")
);
headerRow.appendChild(
  createHeaderBox("Gender", "Male, Female, Other")
);
headerRow.appendChild(
  createHeaderBox(
    "Playable In",
    "Aether Studios games or media where this character appears"
  )
);

guessBoard.appendChild(headerRow);

// Matching logic
function getArrayMatchType(guessArr, targetArr) {
  const safeGuess = Array.isArray(guessArr) ? guessArr : [];
  const safeTarget = Array.isArray(targetArr) ? targetArr : [];

  const guessSorted = [...safeGuess].sort().join(",");
  const targetSorted = [...safeTarget].sort().join(",");

  if (guessSorted === targetSorted) return "correct";
  if (safeGuess.some(item => safeTarget.includes(item))) return "partial";
  return "wrong";
}

function getCharacterMatchType(guessedChar, targetChar) {
  return guessedChar.name === targetChar.name ? "correct" : "wrong";
}

function getElementMatchType(guessedChar, targetChar) {
  return guessedChar.element === targetChar.element ? "correct" : "wrong";
}

function getGenderMatchType(guessedChar, targetChar) {
  return guessedChar.gender === targetChar.gender ? "correct" : "wrong";
}

function getGuessResultTypes(guessedChar, targetChar) {
  return [
    getCharacterMatchType(guessedChar, targetChar),
    getElementMatchType(guessedChar, targetChar),
    getArrayMatchType(guessedChar.species, targetChar.species),
    getArrayMatchType(guessedChar.region, targetChar.region),
    getGenderMatchType(guessedChar, targetChar),
    getArrayMatchType(guessedChar.appearance, targetChar.appearance)
  ];
}

function matchTypeToEmoji(type) {
  if (type === "correct") return "🟩";
  if (type === "partial") return "🟨";
  return "🟥";
}

function getElementEmoji(element) {
  if (!element) return "";

  const e = element.toLowerCase();

  if (e === "fire") return "🔥";
  if (e === "water") return "💧";
  if (e === "earth") return "🍃";
  if (e === "air") return "🌪️";
  if (e === "abyss") return "🟣";

  return "";
}

function buildShareText() {
  const progress = getSavedProgress();

  if (!target) {
    return "Aetherdle\nNo puzzle loaded yet.";
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = String(today.getFullYear()).slice(-2);

  const formattedDate = `${month}/${day}/${year}`;
  const guessCount = progress.guesses.length;

  const guessesInOldestFirstOrder = [...progress.guesses].reverse();

  const emojiRows = guessesInOldestFirstOrder
    .map((guessName) => {
      const guessedChar = characters.find(
        c => c.name.toLowerCase() === guessName.toLowerCase()
      );

      if (!guessedChar) return null;

      const resultTypes = getGuessResultTypes(guessedChar, target);
      return resultTypes.map(matchTypeToEmoji).join("");
    })
    .filter(Boolean);

  const statusLine = progress.solved
    ? `Completed in ${guessCount} 🔥`
    : `Incomplete 🔥`;

  return [
    `Aetherdle ${formattedDate}`,
    statusLine,
    "",
    ...emojiRows
  ].join("\n");
}

function showShareCopiedMessage() {
  const oldMessage = document.querySelector(".share-toast");
  if (oldMessage) oldMessage.remove();

  const toast = document.createElement("div");
  toast.className = "share-toast";
  toast.textContent = "Results copied to clipboard!";
  gameContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

async function copyShareResults() {
  const progress = getSavedProgress();

  if (progress.guesses.length === 0) {
    alert("Make a guess first!");
    return;
  }

  const shareText = buildShareText();

  try {
    await navigator.clipboard.writeText(shareText);
    showShareCopiedMessage();
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    alert("Couldn't copy results to clipboard.");
  }
}

function updateTrophyState(isSolved) {
  if (isSolved) {
    trophyBadge.classList.add("unlocked");
    trophyBadge.classList.remove("locked");
    trophyBadge.dataset.tooltip = "Congratulations!";
  } else {
    trophyBadge.classList.add("locked");
    trophyBadge.classList.remove("unlocked");
    trophyBadge.dataset.tooltip = "Solve the daily puzzle to unlock the trophy";
  }
}

function createBox(content, finalClass, extraClass = "") {
  const box = document.createElement("div");
  box.className = `result-box unrevealed ${extraClass}`.trim();
  box.dataset.finalClass = finalClass;

  if (content instanceof HTMLElement) {
    box.appendChild(content);
  } else {
    box.textContent = content;
  }

  return box;
}

function createIconContent(character) {
  const img = document.createElement("img");
  img.src = character.image;
  img.alt = character.name;
  attachTooltip(img, character.name);
  return img;
}

// Suggestions
function clearSuggestions() {
  suggestionsBox.innerHTML = "";
  suggestionsBox.style.display = "none";
  currentSuggestions = [];
  currentSuggestionIndex = -1;
}

function updateSuggestionHighlight() {
  const items = document.querySelectorAll(".suggestion-item");

  items.forEach((item, index) => {
    if (index === currentSuggestionIndex) {
      item.classList.add("highlighted");
    } else {
      item.classList.remove("highlighted");
    }
  });
}

function showSuggestions(matches) {
  suggestionsBox.innerHTML = "";
  currentSuggestions = matches;
  currentSuggestionIndex = -1;

  if (matches.length === 0) {
    clearSuggestions();
    return;
  }

  matches.forEach((character) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";

    const icon = document.createElement("img");
    icon.src = character.image;
    icon.alt = character.name;
    icon.className = "suggestion-icon";

    const label = document.createElement("span");
    label.textContent = character.name;

    item.appendChild(icon);
    item.appendChild(label);

    item.addEventListener("click", () => {
      guessInput.value = character.name;
      clearSuggestions();
      guessInput.focus();
    });

    suggestionsBox.appendChild(item);
  });

  suggestionsBox.style.display = "block";
}

function getSavedProgress() {
  const raw = localStorage.getItem(saveKey);

  if (!raw) {
    return {
      guesses: [],
      solved: false
    };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      guesses: Array.isArray(parsed.guesses) ? parsed.guesses : [],
      solved: Boolean(parsed.solved)
    };
  } catch {
    return {
      guesses: [],
      solved: false
    };
  }
}

function updateSuggestions() {
  const value = guessInput.value.trim().toLowerCase();

  if (!value) {
    clearSuggestions();
    return;
  }

  const progress = getSavedProgress();
  const guessedNames = progress.guesses.map(name => name.toLowerCase());

  const matches = characters.filter(character =>
    character.name.toLowerCase().includes(value) &&
    !guessedNames.includes(character.name.toLowerCase())
  );

  showSuggestions(matches);
}

// Save / load progress
function saveProgress(guesses, solved) {
  const payload = {
    guesses,
    solved
  };

  localStorage.setItem(saveKey, JSON.stringify(payload));
}

function showWinMessage() {
  const oldWinMessage = document.querySelector(".win-message");
  if (oldWinMessage) oldWinMessage.remove();

  const winMsg = document.createElement("div");
  winMsg.className = "win-message";
  winMsg.textContent = `🎉 You completed Daily Puzzle #${puzzleNumber}!`;
  guessBoard.appendChild(winMsg);

  updateTrophyState(true);
}

function lockGame() {
  submitBtn.disabled = true;
  guessInput.disabled = true;
  clearSuggestions();
}

function unlockGame() {
  submitBtn.disabled = false;
  guessInput.disabled = false;
}

function buildGuessRow(guessedChar) {
  const row = document.createElement("div");
  row.className = "guess-row";

  const [
    characterMatch,
    elementMatch,
    speciesMatch,
    regionMatch,
    genderMatch,
    appearanceMatch
  ] = getGuessResultTypes(guessedChar, target);

  const elementEmoji = getElementEmoji(guessedChar.element);
  const elementText = elementEmoji
    ? `${elementEmoji}\u00A0${guessedChar.element}`
    : guessedChar.element;

  row.appendChild(
    createBox(
      createIconContent(guessedChar),
      characterMatch,
      "icon-box"
    )
  );

  row.appendChild(
    createBox(
      elementText,
      elementMatch
    )
  );

  row.appendChild(
    createBox(
      Array.isArray(guessedChar.species) ? guessedChar.species.join(", ") : "",
      speciesMatch
    )
  );

  row.appendChild(
    createBox(
      Array.isArray(guessedChar.region) ? guessedChar.region.join(", ") : "",
      regionMatch
    )
  );

  row.appendChild(
    createBox(
      guessedChar.gender,
      genderMatch
    )
  );

  row.appendChild(
    createBox(
      Array.isArray(guessedChar.appearance) ? guessedChar.appearance.join(", ") : "",
      appearanceMatch
    )
  );

  return row;
}

function insertGuessRow(row) {
  if (guessBoard.children.length > 1) {
    guessBoard.insertBefore(row, guessBoard.children[1]);
  } else {
    guessBoard.appendChild(row);
  }
}

function revealRow(row, instant = false) {
  const boxes = Array.from(row.querySelectorAll(".result-box"));
  const delay = instant ? 0 : 180;

  return new Promise((resolve) => {
    boxes.forEach((box, index) => {
      setTimeout(() => {
        box.classList.remove("unrevealed");
        box.classList.add("revealed");
        box.classList.add(box.dataset.finalClass);

        if (index === boxes.length - 1) {
          setTimeout(resolve, instant ? 0 : 120);
        }
      }, index * delay);
    });
  });
}

async function renderGuessRow(guessedChar, instant = false) {
  const row = buildGuessRow(guessedChar);
  insertGuessRow(row);
  await revealRow(row, instant);
}

// Guess logic
async function submitGuess() {
  if (isRevealing || !target) return;

  const guess = guessInput.value.trim();

  if (!guess) {
    clearSuggestions();
    return;
  }

  const guessedChar = characters.find(
    c => c.name.toLowerCase() === guess.toLowerCase()
  );

  if (!guessedChar) {
    alert("Character not found!");
    return;
  }

  const progress = getSavedProgress();

  if (progress.guesses.includes(guessedChar.name)) {
    guessInput.value = "";
    clearSuggestions();
    return;
  }

  isRevealing = true;
  lockGame();

  await renderGuessRow(guessedChar, false);

  const newGuesses = [guessedChar.name, ...progress.guesses];
  const solved = guessedChar.name === target.name;

  saveProgress(newGuesses, solved);

  if (solved) {
    showWinMessage();
  } else {
    unlockGame();
  }

  guessInput.value = "";
  clearSuggestions();
  isRevealing = false;
}

async function restoreProgress() {
  const progress = getSavedProgress();

  if (progress.guesses.length > 0) {
    const guessesInOldestFirstOrder = [...progress.guesses].reverse();

    for (const guessName of guessesInOldestFirstOrder) {
      const guessedChar = characters.find(
        c => c.name.toLowerCase() === guessName.toLowerCase()
      );

      if (guessedChar) {
        await renderGuessRow(guessedChar, true);
      }
    }
  }

  if (progress.solved) {
    showWinMessage();
    lockGame();
  } else {
    updateTrophyState(false);
  }
}

guessInput.addEventListener("input", updateSuggestions);

guessInput.addEventListener("keydown", (event) => {
  if (isRevealing) {
    event.preventDefault();
    return;
  }

  if (event.key === "ArrowDown") {
    if (currentSuggestions.length > 0) {
      if (currentSuggestionIndex < currentSuggestions.length - 1) {
        currentSuggestionIndex++;
      } else {
        currentSuggestionIndex = 0;
      }
      updateSuggestionHighlight();
      event.preventDefault();
    }
  } else if (event.key === "ArrowUp") {
    if (currentSuggestions.length > 0) {
      if (currentSuggestionIndex > 0) {
        currentSuggestionIndex--;
      } else {
        currentSuggestionIndex = currentSuggestions.length - 1;
      }
      updateSuggestionHighlight();
      event.preventDefault();
    }
  } else if (event.key === "Enter") {
    event.preventDefault();

    if (currentSuggestionIndex >= 0 && currentSuggestions[currentSuggestionIndex]) {
      guessInput.value = currentSuggestions[currentSuggestionIndex].name;
      clearSuggestions();
      submitGuess();
    } else if (currentSuggestions.length > 0) {
      guessInput.value = currentSuggestions[0].name;
      clearSuggestions();
      submitGuess();
    } else {
      clearSuggestions();
      submitGuess();
    }
  } else if (event.key === "Escape") {
    clearSuggestions();
  }
});

submitBtn.addEventListener("click", () => {
  if (isRevealing) return;
  clearSuggestions();
  submitGuess();
});

shareBtn.addEventListener("click", () => {
  copyShareResults();
});

document.addEventListener("click", (event) => {
  if (!autocompleteWrapper.contains(event.target)) {
    clearSuggestions();
  }
});

async function startGame() {
  try {
    await loadCharacters();

    if (characters.length === 0) {
      throw new Error("characters.json is empty");
    }

    target = getDailyCharacter();
    await restoreProgress();
  } catch (error) {
    console.error(error);

    const errorBox = document.createElement("div");
    errorBox.style.marginTop = "20px";
    errorBox.style.color = "#ff8080";
    errorBox.style.fontWeight = "bold";
    errorBox.textContent = "Failed to load characters.json";
    gameContainer.appendChild(errorBox);

    lockGame();
  }
}

startGame();