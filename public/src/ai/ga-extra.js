/* These classes contain functions for extra GA modes:
GAMode:
1) diversity (ga-island version)
2) antiStuck

colorMode:
1) speciation (by average distance)

Other functions:
1) Distance comparison functions (distance, avgDistance)

Dependencies:
GAExtra is inherited by the main GA class
GenePoolExtra is inherited by the main GenePool class*/

class GAExtra {
    // diversity params
    static distanceThreshold = 10 // (in grids)
    static chopLength = 50 // chop size (in frames) when calculating similarity
    static crossoverProportion = 0.2 // % random breed (vs pass & mutate)

    // comparison functions
    static distance(p1, p2) { // input: [x1, y1], [x2, y2]
        return (((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5) / gridSize
    }
    static avgDistance(mario1, mario2, startFrame, endFrame) { // calc avg distance (position)
        if (!startFrame) startFrame = 0, endFrame = batchTime
        let numOfFrames = 0 // as denominator
        let distanceSum = 0
        for (let f = startFrame; f < endFrame; f++) {
            let p1 = mario1.positions[f]
            let p2 = mario2.positions[f]
            if (!p1 || !p2) break // if any of the marios is dead 

            distanceSum += GA.distance(p1, p2) // if both marios are alive
            numOfFrames++
            // console.log("positions:", p1.toString(), "|", p2.toString())
            // console.log("distance:", GA.distance(p1, p2))
        }
        if (numOfFrames == 0) { // if no comparable frames at all
            return null
        }
        let avgDist = distanceSum / numOfFrames
        // console.log("avgDist:", avgDist)
        return avgDist
    }

    constructor() { }
}

class GenePoolExtra {
    constructor() { }

    // diversity mode
    breedNewBatchWithDiversity() {
        this.evaluate()

        // create shuffle idx arr
        let indices = Array.from(Array(batchSize).keys()) // [0, 1, 2, ..., batchSize-1]
        for (let i = 0; i < batchSize; i++) {
            let r = Math.floor(Math.random() * batchSize)
            let tmp = indices[i]
            indices[i] = indices[r]
            indices[r] = tmp
        }

        // select & breed 
        let record = [0, 0, 0, 0, 0] // just for logging
        for (let i = 0; i < batchSize - 1; i += 2) { // 2 marios in a group
            let passer = this.population[indices[i]] // mario i on shuffled list
            let receiver = this.population[indices[i + 1]] //mario i+1 on shuffled list
            // if (passer.x < receiver.x) {
            if (GA.aIsStronger(receiver, passer)) {
                record[0]++
                continue // skip this pair if receiver is stronger
            }
            record[4]++

            // pick random parent2 from survivors for breeding
            let r = Math.floor(Math.random() * batchSize)
            let parent2 = this.population[r]

            // pass gene if passer is stronger:
            // if geneType == "moves" -> chop & compare
            if (geneType == "moves") {
                let passerGeneLength = passer.moves.length
                for (let j = 0; j < passerGeneLength; j += GA.chopLength) {
                    let startFrame = j
                    let endFrame = Math.min(j + GA.chopLength, passerGeneLength)
                    let avgDist = GA.avgDistance(passer, receiver, startFrame, endFrame)

                    /* if too far away -> skip and keep original
                    will not skip if both marios are dead as (null > num) will return false*/
                    if (avgDist > GA.distanceThreshold) {
                        record[1]++
                        continue
                    }

                    // if similar enough -> breed
                    if (Math.random() > GA.crossoverProportion) {
                        // breed method 1: pass gene to receiver and mutate
                        record[2]++
                        for (let f = startFrame; f < endFrame; f++) {
                            if (!passer.moves[f]) break // copies until no more moves
                            receiver.moves[f] = [...passer.moves[f]]
                            GA.mutateMove(receiver.moves[f])
                        }
                    } else {
                        // breed method 2: crossover with random parent2
                        record[3]++
                        for (let f = startFrame; f < endFrame; f++) {
                            receiver.moves[f] = GA.crossoverMoves(passer.moves[f], parent2.moves[f])
                        }
                    }

                    // if one of the marios is already dead -> stop comparing
                    if (avgDist == null) break
                }
            }

            // if geneType == "clicks" -> compare entire path
            if (geneType == "clicks") {
                // if too far away -> skip and keep original
                let avgDist = GA.avgDistance(passer, receiver)
                if (avgDist > GA.distanceThreshold) {
                    record[1]++
                    continue
                }

                // if similar enough -> breed
                receiver.clicks = []
                if (Math.random() > GA.crossoverProportion) {
                    // breed method 1: pass gene to receiver and mutate
                    record[2]++
                    passer.clicks.forEach(click => {
                        receiver.clicks.push([...click])
                    })
                    receiver.clicks.forEach(click => {
                        GA.mutateClick(click)
                    })
                } else {
                    // breed method 2: crossover with random parent2
                    record[3]++
                    for (let j = 0; passer.clicks[j] || parent2.clicks[j]; j++) {
                        let c1 = passer.clicks[j]
                        let c2 = parent2.clicks[j]
                        if (!c1) receiver.clicks.push([...c2])
                        else if (!c2) receiver.clicks.push([...c1])
                        else receiver.clicks.push(Math.random() > 0.5 ? [...c2] : [...c1])
                    }
                }
            }
        }

        // DEBUG LOGS
        // console.log("BATCH DATA")
        // console.log("1. Receiver is stronger:", record[0])
        // console.log("2. Receiver is not stronger:", record[4])
        // console.log("  a) Too far away:", record[1])
        // console.log("  b) Pass & mutate:", record[2])
        // console.log("  c) Breed with random parent:", record[3])
    }

    speciate() { // categories genes into species
        let colorList = ["blue", "lime", "olive", "yellow", "purple", "pink", "teal", "aqua", "cyan", "white"]
        this.speciesPools = []
        let species = []
        let uncategorized = Array.from(Array(batchSize).keys()) // [0, 1, 2, ..., batchSize-1]
        for (let i = 0; i < batchSize && uncategorized.length > 0; i++) {
            if (uncategorized.indexOf(i) >= 0) {
                let newSpecies = []
                let c = colorList[species.length % colorList.length]
                for (let j = uncategorized.length - 1; j >= 0; j--) {
                    let u = uncategorized[j]
                    // console.log(i, u, GA.avgDistance(this.population[i], this.population[u]))
                    if (GA.avgDistance(this.population[i], this.population[u]) < GA.distanceThreshold) {
                        newSpecies.push(u)
                        this.population[u].color = c
                        uncategorized.splice(j, 1)
                    }
                }
                species.push(newSpecies)
            }
        }
        species.forEach(specie => {
            this.speciesPools.push(new GenePool({ population: specie.map(idx => this.population[idx]) }))
        })
    }
}