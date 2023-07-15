let labels = [];

let data = {
    labels: labels,
    datasets: [{
        label: 'Generation Dataset',
        backgroundColor: 'white',
        borderColor: 'white',
        borderWidth: 1,
        pointRadius: 1,
        data: [],
    }]
};

let config = {
    type: 'line',
    data: data,
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                // text: 'Min and Max Settings'
            }
        },
        scales: {
            x: {
                display: true,
                ticks: { color: '#DDD' },
                title: {
                    display: true,
                    text: 'Generation',
                    color: '#DDD',
                    font: {
                        // family: 'Comic Sans MS',
                        size: window.innerWidth < 1400? 12 : 17,
                        weight: 'bold',
                        lineHeight: 1.2,
                    },
                    padding: {
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    },
                    min: 0,
                    max: 900,
                }
            },
            y: {
                display: true,
                ticks: { color: '#DDD' },
                title: {
                    display: false,
                    text: "Performance",
                    font: {
                        // family: 'Comic Sans MS',
                        size: window.innerWidth < 1400? 12 : 17,
                        weight: 'bold',
                        lineHeight: 1.2,
                    },
                    padding: {
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    },
                    min: 0,
                    max: 999,
                }
            }
        }
    }
}

let myChart = new Chart(
    document.getElementById('myChart'),
    config
);


function updateChart() {
    let newData
    if (evaluationMode == "distX") {
        newData = pool.avgDistanceList[world.currentBatch]
        config.options.scales.y.title.text = "Distance(x) Travelled"
    } else if (evaluationMode == "shortestPath") {
        newData = pool.avgPathLengthList[world.currentBatch]
        config.options.scales.y.title.text = "Path Distance to Target"
    }
    // update data
    myChart.data.datasets[0].data.push(`${Math.round(10 * newData)/10}`)
    // update labels
    data.labels.push(`${world.currentBatch}`)


    myChart.update()
}

function resetChart(){
    if (evaluationMode == "distX") {
        config.options.scales.y.title.text = "Distance(x) Travelled"
    } else if (evaluationMode == "shortestPath") {
        config.options.scales.y.title.text = "Path Distance to Target"
    }
    // clear data
    myChart.data.datasets[0].data= []
    // clear labels
    labels = []
    data.labels = []

    myChart.update()
}