// map dimensions
let numCol = 35;
let numRow = 20;
const emptyMap = () => Array(numRow).fill(Array(numCol).fill("x").join(""));
const defaultMap = [
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "&&&&&pppp&&&&&&&xxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxmxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxx&&&&&&xxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxTxx",
  "xxxxxxxxxxxxxxxxxx&&&&&&&&&&&&&&&&&",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
];

// canvas dimensions
let gridSize, canvasWidth, canvasHeight;
const p5CanvasElem = document.querySelector("#p5-canvas");
resetDimensions()
function resetDimensions() {
  gridSize = Math.min(Math.floor(p5CanvasElem.clientWidth / numCol), Math.floor(p5CanvasElem.clientHeight / numRow));
  canvasWidth = gridSize * numCol;
  canvasHeight = gridSize * numRow;
}

// drawing states
let selected = "&";
let currentMap = defaultMap;
let itemList = [];

function loadItemsFromMap(map) {
  itemList = [];
  for (const y in currentMap) {
    const row = currentMap[y];
    for (const x in row) {
      const key = row[x];
      if (key == 'x') continue;
      const props = itemKeyList[key];
      itemList.push(new props.class(null, props, x, y));
    }
  }
}


// P5
function setup() {
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("p5-canvas");
  for (const [key, path] of Object.entries(spriteImgPaths)) {
    sprites[key] = loadImage(path);
  }

  const savedMap = localStorage.getItem("drawnMap");
  if (savedMap) currentMap = JSON.parse(savedMap).map(row => row.replaceAll(" ", "x"));
  loadItemsFromMap();
}

function draw() {
  background("lightGrey");
  itemList.forEach(item => item.paint());
}

// mouse press
let prevX, prevY;
function mouseDragged() {
  if (mouseX >= gridSize * numCol || mouseY >= gridSize * numRow) return;
  if (mouseX < 0 || mouseY < 0) return;
  const x = Math.floor(mouseX / gridSize);
  const y = Math.floor(mouseY / gridSize);
  if (prevX == x && prevY == y) return;

  prevX = x;
  prevY = y;
  currentMap[y] = currentMap[y].substring(0, x) + selected + currentMap[y].substring(x + 1);
  loadItemsFromMap();
}

function mousePressed() {
  mouseDragged();
}

function mouseReleased() {
  const formattedMatrix = currentMap.map(row => row.replaceAll("x", " "));
  localStorage.setItem('drawnMap', JSON.stringify(formattedMatrix));
}


/* UI CONTROLS */
function resetDrawing() {
  localStorage.removeItem('drawnMap');
  currentMap = emptyMap();
  loadItemsFromMap();
}
function selectBlock(key) {
  selected = key;
}
function goToMap() {
  if (!itemList.some(item => item.type == 'target')) {
    window.alert("You must add one target (with the green flag icon) to the map to start a game!");
  } else {
    window.location.href = `${window.location.href.includes("/public") ? "/public" : ""}/index.html?map=editor`;
  }
}

// set UI icons
Object.entries(itemKeyList).forEach(([key, props]) => {
  const icon = document.getElementById(`${key}-icon`);
  if (icon) icon.src = spriteImgPaths[props.img];
});