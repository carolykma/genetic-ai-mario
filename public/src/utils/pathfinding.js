/* turn pathfindingDemo to true & run this script alone
to visualize the pathfinding algorithm in console! */
pathfindingDemo = false

// demo // demo // demo // demo // demo // demo // demo //
let sampleMap = [
    "                      &",
    "                m     &",
    "&&p&&&&&&&&p&&&&&     &",
    "                      &",
    "                      &",
    "                      &",
    "   &&&&&&&&p&&&&&&p&&&&",
    "                       ",
    "      m               T",
    "&&&&&&&&&&&&&&&&&&&&&&&",
]
if (pathfindingDemo) {
    console.log("====================================================\n",
        "THE SHORTEST PATH LENGTH IS", findPathLength(sampleMap, 0, 0), "GRIDS!\n====================================================\n")
}
// demo // demo // demo // demo // demo // demo // demo //




// functions
function findPathLength(myMap, px, py, tx, ty) {
    let myMapClone = [...myMap]
    if (tx == undefined) { // find target x,y from map if not provided
        myMapClone.forEach((row, idx) => {
            if (row.indexOf("T") >= 0) {
                tx = row.indexOf("T")
                ty = idx
            }
        })
        if (tx == undefined) { return null } // "T" is not found in map
    }
    let hasArrived = (px == tx && py == ty) ? true : false
    let currentPoints = [[px, py]]
    let nextPoints = []
    let pathLength = 0

    // search path until hasArrived
    while (!hasArrived) {
        // console visualization for demo
        if (pathfindingDemo) {
            console.log(myMapClone)
            console.log("current points:", currentPoints)
        }

        // loop
        pathLength++
        nextPoints = []
        for (let i = 0; i < currentPoints.length; i++) {
            let cp = currentPoints[i]
            let possiblePoints = [
                [cp[0] + 1, cp[1]],
                [cp[0] - 1, cp[1]],
                [cp[0], cp[1] + 1],
                [cp[0], cp[1] - 1]
            ]
            for (let pp of possiblePoints) {
                let x = pp[0]
                let y = pp[1]
                if (x == tx && y == ty) { // arrive at target
                    nextPoints.push([x, y])
                    hasArrived = true
                    break
                }
                if (x < 0 || y < 0 || x >= myMapClone[0].length || y >= myMapClone.length) {
                    continue
                }
                if (myMapClone[y][x] == " ") {
                    if (nextPoints.some(np => np[0] == x && np[1] == y)) continue
                    nextPoints.push([x, y])
                    myMapClone[y] = myMapClone[y].substring(0, x) + "." + myMapClone[y].substring(x + 1)
                }
            }
            if (hasArrived) break
        }
        if (nextPoints.length == 0) { return null } // dead end
        [currentPoints, nextPoints] = [nextPoints, currentPoints]
    }
    return pathLength
}





function allPathLengths(myMap) {
    let result = []
    for (let i = 0; i < myMap[0].length; i++) {
        result.push([])
    }
    myMap.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            // console.log("x", x, "y", y, "row", row, "grid", `"${row[x]}"`)
            result[x][y] = findPathLength(myMap, x, y)
        }
    })
    return result
}
