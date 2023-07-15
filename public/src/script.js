// map dimensions
let currentMap = defaultMaps[1] // see maps in map.js
let params = new URLSearchParams(location.search)
async function loadMap() {
    if (params.has("map")) {
        if (params.get("map") == 'editor') {
            currentMap = JSON.parse(localStorage.getItem("drawnMap"));
        } else {
            currentMap = getMapById(params.get("map"));
        }
        // setTimeout(resetP5());
    }
}
loadMap()

// display params
let fr = 60 // frame rate
let numCol, numRow, gridSize, canvaWidth, canvaHeight, p5containerWidth;
const p5CanvasElem = document.querySelector("#p5-canvas");
resetDimensions()
function resetDimensions() {
    numCol = currentMap[0].length;
    numRow = currentMap.length;
    gridSize = Math.min(Math.floor(p5CanvasElem.clientWidth / numCol), Math.floor(p5CanvasElem.clientHeight / numRow));
    canvaWidth = gridSize * numCol;
    canvaHeight = gridSize * numRow;
}


// physics params (acceleration = factor * gridSize)
let speedFactor = 0.5
let jumpFactor = 1
let gravityFactor = 0.1
let maxSpeed = gridSize - 1


// OOP
let world
let pool
let playerMario

class World {
    constructor(withPlayer) { // withPlayer: boolean
        // map item lists
        this.itemList = [];
        this.marioList = [];
        if (withPlayer) {
            this.withPlayer = true
            playerMario = new Mario(this) // player-controlled mario
            playerMario.img = sprites.mario;
        }

        // gene pool
        this.pool = null

        // time & batch count
        this.currentFrame = 0
        this.currentBatch = 0
    }

    reset() {
        this.marioList = [];
        if (this.withPlayer) {
            playerMario = new Mario(this) // player-controlled mario
            playerMario.img = sprites.mario;
        }
        this.itemList = [];
        this.dynamicItemList = []

        // time & batch count
        this.currentFrame = 0
        this.currentBatch = 0
    }

    forEachItem(callback) {
        this.itemList.forEach(item => callback(item));
    }

    // setup functions
    // parse map matrix to gen blocks & enemies
    setup() {
        this.mapSetup()
        this.GASetup()
    }
    // gen blocks, enemies and append to world's item lists
    mapSetup(matrix = currentMap) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                let symbol = matrix[i][j];
                const props = itemKeyList[symbol];
                if (props) {
                    this.itemList.push(new props.class(this, props, j, i));
                }
            }
        }
        this.target = this.itemList.find(item => item.type == 'target');
    }
    GASetup() {
        if (evaluationMode == "shortestPath") {
            GA.shortestPathLengths = allPathLengths(currentMap)
        }
        for (let i = 0; i < batchSize; i++) {
            let mario = new Mario(world)
            let c = color('rgba(0, 0, 255, 0.1)')
            mario.color = c
            this.pool.population.push(mario)
        }
    }



    // loop functions
    loop() {
        this.mapLoop();
        this.GALoop();
    }
    mapLoop() {
        if (this.currentFrame >= batchTime) { // batch ends
            this.itemList.forEach(item => item.onBatchEnd());
            if (this.currentBatch < batchNum) { // if there is more batch
                this.itemList.forEach(item => item.reset());
            } else { // no more batch
                return;
            }
        }
        this.itemList.forEach(item => item.newFrame(this.currentFrame));
    }
    GALoop() {
        // timer
        if (this.currentFrame >= batchTime) { // batch ends
            this.pool.pauseBatch()
            if (this.currentBatch < batchNum) { // if there is more batch
                if (GAMode == "diversity") { this.pool.breedNewBatchWithDiversity() }
                else { this.pool.breedNewBatch() }
                if (colorMode == "speciation") { this.pool.speciate() }
                this.pool.showStat()
                this.pool.restartBatch()
            } else { // if no more batch
                return
            }
        }

        // if batch hasn't ended: determine GA marios move
        this.pool.population.forEach((mario, idx) => {

            if (mario.isAlive) {
                // if gene has not reached current frame -> generate
                if (!mario.moves[this.currentFrame]) {
                    if (geneType == "moves") {
                        mario.moves[this.currentFrame] = GA.randomMove()
                    } else if (geneType == "clicks") {
                        let newClick = GA.randomClick()
                        mario.clicks.push(newClick)
                        mario.moves.push(...GA.clicksToMoves([newClick]))
                    }
                }

                // load move from gene
                let currentMove = mario.moves[this.currentFrame]
                mario.up = currentMove[0]
                mario.direction = currentMove[1]
            }

            mario.newFrame()
        })

        this.currentFrame += 1
    }

}








// p5
function setup() {
    let canvas = createCanvas(canvaWidth, canvaHeight);
    canvas.parent("p5-canvas");
    frameRate(fr);

    // load img
    for (const [key, path] of Object.entries(spriteImgPaths)) {
        sprites[key] = loadImage(path);
    }

    // OOP
    world = new World(true)
    pool = new GenePool(world)

    // setups
    world.setup()
    loadParamsToDOM()
}

function draw() {
    world.loop()

    // player-controlled mario
    if (keyIsDown(RIGHT_ARROW)) {
        playerMario.direction = 1
    } else if (keyIsDown(LEFT_ARROW)) {
        playerMario.direction = -1
    } else {
        playerMario.direction = 0
    }
    playerMario.newFrame()


    // for multiple batches per round
    if (world.currentFrame == 1 && world.currentBatch != 0) {
        for (let i = 0; i < (batchPerRound - 1) * batchTime; i++) {
            world.loop()
        }
    }

    // paint canvas
    paint()
}

// demo mario (keyboard event: jump)
function keyPressed() {
    if (keyCode == UP_ARROW) {
        playerMario.up = true;
    }
}

/* paint everything after calculation
should be called at the end of every visualized loop */
function paint() {
    // paint map & enemies
    background(50);
    world.forEachItem(item => item.paint());

    // paint marios
    for (let mario of world.marioList) {
        mario.paint();
    }
    playerMario.paint();

    // show text at the end of batch
    if (batchPerRound > 1 && world.currentFrame == batchTime) {
        fill("blue")
        textSize(gridSize * 0.8)
        if (world.currentBatch < batchNum) {
            text(`Calculating ${batchPerRound} generations...`, gridSize * 2, gridSize * 2)
        } else {
            text("All generations completed", gridSize * 2, gridSize * 2)
        }
    }
}



// UI Interaction
const UIControls = {
    // GA
    batchTime: document.querySelector('#batch-time'),
    numOfMario: document.querySelector('#num-of-mario'),
    numOfGen: document.querySelector('#num-of-gen'),
    genPerRound: document.querySelector('#gen-per-round'),
    gaMode: document.querySelector('#ga-mode'),
    geneType: document.querySelector('#gene-type'),
    evaluationMode: document.querySelector('#evaluation-mode'),
    colorMode: document.querySelector('#color-mode'),
    distanceThreshold: document.querySelector('#distance-threshold'),

    // map selection
    mapIndex: document.querySelector('#map-index'),

    // restart | play | pause
    restart: document.querySelector("#restart-btn"),
    play: document.querySelector("#play-btn"),
    pause: document.querySelector("#pause-btn"),
}
const UIDisplays = {
    mapSelectionDiv: document.querySelector('#map-selection'),
    
    // stats
    batchNumber: document.querySelector('#batch-number'),
    distanceX: document.querySelector("#distX-data"),
    shortestPath: document.querySelector("#shortestPath-data"),
    stats: document.querySelectorAll(".stats"), // array
}

async function loadParamsToDOM() {
    // controls
    UIControls.batchTime.value = Math.floor(batchTime / 60);
    UIControls.numOfMario.value = batchSize;
    UIControls.numOfGen.value = batchNum;
    UIControls.genPerRound.value = batchPerRound;
    UIControls.gaMode.value = GAMode;
    UIControls.geneType.value = geneType;
    UIControls.evaluationMode.value = evaluationMode;
    UIControls.colorMode.value = colorMode;
    UIControls.distanceThreshold.value = GA.distanceThreshold;

    // mpa selection
    UIControls.mapIndex.value = defaultMaps.indexOf(currentMap);
    UIControls.mapIndex.max = defaultMaps.length - 1;

    // displays
    UIDisplays.distanceX.hidden = evaluationMode == "shortestPath" ? true : false;
    UIDisplays.shortestPath.hidden = evaluationMode == "shortestPath" ? false : true;
    UIDisplays.mapSelectionDiv.hidden = params.has("map");
}

function resetP5() {
    noLoop()
    resetDimensions()
    resizeCanvas(canvaWidth, canvaHeight)

    resetChart()
    UIDisplays.batchNumber.textContent = 0
    UIDisplays.stats.forEach(elem => elem.textContent = "-")

    world.reset()
    pool.reset()
    world.setup()

    draw()
    loop()
}

// restart button
UIControls.restart.addEventListener('click', function (event) {
    event.preventDefault()

    // GA config
    batchTime = parseInt(UIControls.batchTime.value) * 60
    batchSize = parseInt(UIControls.numOfMario.value)
    batchNum = parseInt(UIControls.numOfGen.value)
    batchPerRound = parseInt(UIControls.genPerRound.value)
    GAMode = UIControls.gaMode.value
    geneType = UIControls.geneType.value
    evaluationMode = UIControls.evaluationMode.value
    colorMode = UIControls.colorMode.value
    GA.distanceThreshold = UIControls.distanceThreshold.value

    // map selection
    if (!params.has("map")) {
        const mapIdx = Math.min(parseInt(UIControls.mapIndex.value), defaultMaps.length - 1);
        currentMap = defaultMaps[mapIdx];
    }

    // reset
    loadParamsToDOM();
    resetP5();
})

UIControls.play.addEventListener('click', function () {
    loop()
})

UIControls.pause.addEventListener('click', function () {
    noLoop()
})