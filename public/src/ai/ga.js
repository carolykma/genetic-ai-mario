// moves params
let rightProb = 0.4 // rightProb + leftProb should <= 1
let leftProb = 0.4
let jumpProb = 0.05
let clickDuration = 10 // avg duration of random click (in frames)
let clickJumpProb = 0.05

// GA mode
let GAMode = "diversity" // "normal" | "diversity" | "antiStuck"
let geneType = "clicks" // "moves" | "clicks"
let evaluationMode = "shortestPath" // "distX" | "shortestPath"
let colorMode = "speciation" // "normal" | "speciation"

// GA batch params
this.batchSize = 50 // number of marios
this.batchTime = 200 // (in frames)
this.batchNum = 100 // divisible by batchPerRound
this.batchPerRound = 10

class GA extends GAExtra {
    // selection params
    static survivalRate = 0.1 // % of member to survive to next generation
    static selectionRate = 0.05 // % of member to pass gene to next generation, must be < survival Rate
    // mutation params
    static mutationRate = 0.1 // mutation rate per move
    static mutationProportion = 0.2 // % of new marios that mutate
    static mutationAmount = 2 // avg mutation amount (in frames, for click duration)
    // antiStuck params
    static antiStuckRounds = 50 // num of unimproved rounds to tolerate
    static antiStuckDistance = 1 // distance improvement required (in grid)
    static forceMutateMax = 5
    static unchartedThreshold = 5 // num of unvisited rounds required to classify a grid as uncharted

    // evaluation params
    static shortestPathLengths = [] // store shortest path lengths from all points on map (GA setup)
    static getShortestPath(mario) {
        if (mario.isWin) return 0
        let x = Math.floor(mario.x / gridSize)
        let y = Math.floor(mario.y / gridSize)
        return GA.shortestPathLengths[x][y]
    }
    static aIsStronger(mario1, mario2) { // fitness evaluation function
        let targetX = mario1.world.target.x
        if (evaluationMode == "shortestPath") {
            let path1 = GA.getShortestPath(mario1)
            let path2 = GA.getShortestPath(mario2)
            if (path1 && path2) return path1 < path2
            // if no path for one of the marios
            if (path1 && !path2) return true
            if (!path1 && path2) return false
            // if both no path -> go to next condition
        } else {
            return Math.abs(targetX - mario1.x) < Math.abs(targetX - mario2.x)
        }
    }

    // gene manipulation functions (for moves)
    static randomDirection() {
        let r = Math.random()
        if (r < rightProb) return 1
        else if (r > 1 - leftProb) return -1
        else return 0
    }
    static randomMove() { // output a random move [boolean, -1|0|1]
        let up = Math.random() < jumpProb ? true : false
        return [up, GA.randomDirection()]
    }
    static mutateMove(move) { // mutate the given move
        if (!move) return
        let randomMove = GA.randomMove()
        if (Math.random() < GA.mutationRate) { move[0] = randomMove[0] }
        if (Math.random() < GA.mutationRate) { move[1] = randomMove[1] }
    }
    static crossoverMoves(move1, move2) { //output new crossed-over move
        // return undefined if both marios are dead
        if (!move1 && !move2) return undefined
        // take remaining move if one mario is dead
        else if (!move1) return move2
        else if (!move2) return move1

        //crossover up
        let up
        if (move1[0] == move2[0]) up = move1[0]
        else up = Math.random() > 0.5 ? true : false
        // crossover direction
        let direction = (move1[1] + move2[1]) / 2
        if (direction % 1 != 0) direction = Math.random() > 0.5 ? direction + 0.5 : direction - 0.5

        // return new move
        return [up, direction]
    }

    // gene manipulation functions (for clicks)
    static randomClick() { // output a random click [boolean, -1|0|1, int]
        let duration = Math.floor(Math.random() * (clickDuration * 2 - 1) + 1)
        let up = Math.random() < clickJumpProb ? true : false
        return [up, GA.randomDirection(), duration]
    }
    static mutateClick(click) { // mutate the given click
        if (!click) return
        if (Math.random() < GA.mutationRate) { click[0] = Math.random() > clickJumpProb ? true : false }
        if (Math.random() < GA.mutationRate) { click[1] = GA.randomDirection() }
        if (Math.random() < GA.mutationRate) { click[2] += (Math.floor(Math.random() * (GA.mutationAmount * 2 - 1)) + 1) * (Math.random() > 0.5 ? 1 : -1) }
    }
    static clicksToMoves(clicks) { // output moves arr generated from clicks arr
        // remove 0-duration clicks
        clicks.forEach((click, idx) => {
            if (click[2] <= 0) clicks.splice(idx, 1)
        })
        // convert to moves
        let moves = []
        clicks.forEach((click) => {
            for (let i = 0; i < click[2]; i++) { // for click's duration
                moves.push([i == 0 ? click[0] : false, click[1]])
            }
        })
        return moves
    }

    constructor() { super() }
}

class GenePool extends GenePoolExtra {
    constructor(world, options) {
        super()
        this.world = world
        world.pool = this // append to world
        this.population = [] // collection of Marios

        // GA
        this.fitnessList = [] // Array<idx: number>
        this.forceMutate = 0 // force mutation degree (antiStuck mode)
        this.antiStuckCheckpoint = 0
        this.speciesPools = [] // Array<species: GenePool> (for speciation)

        // stats
        this.avgDistanceList = [] // avg distX of each batch
        this.avgPathLengthList = [] // avg shortestPathLength of each batch
        this.histBestList = [] // best performance in history until each round
        this.recentPerformances = [] // stores performances of last few rounds for antiStuck mode
        this.hasReachedTarget = false

        // options
        if (options) {
            this.population = options.population ? options.population : []
        }
    }

    reset() {
        // GA
        this.population = [] // collection of Marios
        this.fitnessList = [] // Array<idx: number>
        this.forceMutate = 0 // force mutation degree (antiStuck mode)
        this.antiStuckCheckpoint = 0
        this.speciesPools = [] // Array<species: GenePool> (for speciation)

        // stats
        this.avgDistanceList = [] // avg distX of each batch
        this.avgPathLengthList = [] // avg shortestPathLength of each batch
        this.histBestList = [] // best performance in history until each round
        this.recentPerformances = [] // stores performances of last few rounds for antiStuck mode
        this.hasReachedTarget = false
    }

    // pause | restart
    pauseBatch() {
        this.population.forEach(mario => mario.isActive = false)
        this.calcStat()
    }

    restartBatch() {
        this.population.forEach((mario, idx) => {
            mario.reset()
            if (geneType == "clicks") mario.moves = GA.clicksToMoves(mario.clicks)
        })
        this.world.currentFrame = 0
        this.world.currentBatch += 1
    }


    // GA functions
    evaluate() {
        this.fitnessList = []
        this.fitnessList = Array.from(Array(batchSize).keys()) // [0, 1, 2, ..., batchSize-1]
        this.fitnessList.sort((idx1, idx2) => {
            return GA.aIsStronger(this.population[idx1], this.population[idx2]) ? -1 : 1
        })

        // record history best
        let bestMario = this.population[this.fitnessList[0]]
        if (bestMario.isWin) this.hasReachedTarget = true
        let currentBest = evaluationMode == "distX" ? bestMario.x : GA.getShortestPath(bestMario)
        if (this.world.currentBatch == 0) {
            this.histBestList.push(currentBest)
        } else {
            let histBest = this.histBestList[this.world.currentBatch - 1]
            if (evaluationMode == "distX") this.histBestList.push(Math.max(histBest, currentBest))
            else if (evaluationMode == "shortestPath") this.histBestList.push(Math.min(histBest, currentBest))
        }

        // stuck degree evaluation
        if (GAMode == "antiStuck") {
            if (this.hasReachedTarget) return
            if (this.forceMutate >= GA.forceMutateMax) return
            if (this.world.currentBatch < GA.antiStuckRounds) return
            if (this.forceMutate == 0) {
                // once stuck, checkpoint will be fixed to the beginning of last stuck round until there's improvement
                this.antiStuckCheckpoint = this.world.currentBatch - GA.antiStuckRounds
            }
            let stuckRoundsRequired = GA.antiStuckRounds * (1 + this.forceMutate ** 2)
            let before = this.histBestList[this.antiStuckCheckpoint]
            let improvement = 0
            if (evaluationMode == "shortestPath") improvement = before - currentBest
            else if (evaluationMode == "distX") improvement = (currentBest - before) / gridSize

            // remove forceMutate if performance finally improves
            if (improvement >= GA.antiStuckDistance) { // already improved
                this.forceMutate = 0
                // console.log("no stuck")
            } else if (this.world.currentBatch - this.antiStuckCheckpoint >= stuckRoundsRequired) {
                this.forceMutate++
                this.antiStuckCheckpoint = this.world.currentBatch
                console.log("force mutate, steps:", this.forceMutate, ", gen:", this.world.currentBatch)
            }
        }
    }

    select() {
        for (let i = 0; i < Math.floor(batchSize * (1 - GA.survivalRate)); i++) {
            let idx = this.fitnessList.pop()
            this.population[idx].moves = []
            this.population[idx].clicks = []
        }
    }

    inherit() { // all new marios: inherit gene from strongest marios
        this.population.forEach(mario => {
            if (mario.moves.length == 0) {
                let r = Math.floor(Math.random() * Math.ceil(GA.selectionRate * batchSize))
                let parent = this.population[this.fitnessList[r]]
                let newGenes = parent[geneType]
                newGenes.forEach(gene => mario[geneType].push([...gene]))
            }
        })
    }

    mutate() { // all new marios: mutate with mutation rates
        this.population.forEach((mario, idx) => {
            if (this.fitnessList.indexOf(idx) >= 0) return // mutate new genes only
            if (Math.random() > GA.mutationProportion) return // mutation proportion
            if (geneType == "moves") mario.moves.forEach(move => GA.mutateMove(move))
            else if (geneType == "clicks") mario.clicks.forEach(click => GA.mutateClick(click))
        })

        // force mutation
        if (GAMode == "antiStuck") {
            for (let i = 0; i < this.forceMutate * (geneType == "moves" ? clickDuration : 1); i++) {
                this.population.forEach((mario, idx) => {
                    if (this.fitnessList.indexOf(idx) >= 0) return // mutate new genes only
                    mario[geneType].pop()
                })
            }
        }
    }

    breedNewBatch() {
        this.evaluate()
        this.select()
        this.inherit()
        this.mutate()
    }


    // stats
    calcStat() {
        // update pool stats
        if (evaluationMode == "distX") {
            let distanceSum = this.population.reduce((acc, mario) => acc + mario.x, 0)
            this.avgDistanceList.push(distanceSum / batchSize)
        } else if (evaluationMode == "shortestPath") {
            let pathLengthSum = this.population.reduce((acc, mario) => acc + (GA.getShortestPath(mario)), 0)
            this.avgPathLengthList.push(pathLengthSum / batchSize)
        }
    }

    showStat() {
        document.querySelector("#batch-number").textContent = this.world.currentBatch + 1 // i.e. next batch num
        if (evaluationMode == "distX") {
            document.querySelector("#initial-distance").textContent = Math.round(10 * this.avgDistanceList[0]) / 10
            document.querySelector("#current-distance").textContent = Math.round(10 * this.avgDistanceList[this.world.currentBatch]) / 10
            document.querySelector("#initial-path-distance-to-target").textContent = "-"
            document.querySelector("#current-path-distance-to-target").textContent = "-"
        } else if (evaluationMode == "shortestPath") {
            document.querySelector("#initial-distance").textContent = "-"
            document.querySelector("#current-distance").textContent = "-"
            document.querySelector("#initial-path-distance-to-target").textContent = Math.round(10 * this.avgPathLengthList[0]) / 10
            document.querySelector("#current-path-distance-to-target").textContent = Math.round(10 * this.avgPathLengthList[this.world.currentBatch]) / 10
        }
        document.querySelector("#history-best").textContent = this.histBestList[this.histBestList.length - 1] + (evaluationMode == "shortestPath" ? " (grids)" : " (px)")
        updateChart()
    }
}






