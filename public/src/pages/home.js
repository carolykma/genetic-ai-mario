function showGaContent() {
    let content = document.querySelector("#about-ga")
    content.innerHTML = ""
    let GaContent1 = /*html*/`<h1>Genetic Algorithms</h1>`
    let GaContent2 = /*html*/`
    <h1>Four phases</h1>
    <h2>1. Evaluation</h2>
    <h2>2. Selection</h2>
    <h2>3. Crossover</h2>
    <h2>4. Mutation</h2>
    `
    let GaContent3 = /*html*/`
    <h1>Evaluation</h1>
    <h2>Determine an individual score</h2>
    `
    let GaContent4 = /*html*/`
    <h1>Selection</h1>
    <h2>Select the individuals</h2>
    `

    let GaContent5 = /*html*/`
    <h1>Crossover</h1>
    <h2>Create Offspring by exchanging the genes of parents</h2>
    `
    let GaContent6 = /*html*/`
    <h1>Mutation</h1>
    <h2>Have mutation with a low probability</h2>
    `

    let count = 1

    setInterval(function () {
        if(count == 1){
            content.innerHTML = GaContent1
            count++
        } else if (count == 2){
            content.innerHTML = GaContent2
            count++
        } else if (count == 3){
            content.innerHTML = GaContent3
            count++
        } else if (count == 4){
            content.innerHTML = GaContent4
            count++
        } else if (count == 5){
            content.innerHTML = GaContent5
            count++
        } else if (count == 6){
            content.innerHTML = GaContent6
            count = 1
        }
    }, 2000); 

}

showGaContent()