/* globals Chart:false, feather:false */
const colors = [
    "#D81159",
    "#8F2D56",
    "#218380",
    "#FBB13C",
    "#73D2DE",
]

function buildChart(data, name) {
    'use strict'

    const ctx = document.getElementById('timechart')
    return new Chart(ctx, {
        type: 'line',
        options: {
            plugins: {
                title: {
                    display: true,
                    text: name,
                }
            }
        }
    })
}

function fillChart(chart, data) {
    let years = Object.keys(data)
    let types = Object.keys(data[years[0]])
    for(i = 0; i < types.length; i++) {
        chart.data.datasets.push({
            label: types[i],
            data: [
            ],
            lineTension: 0,
            backgroundColor: 'transparent',
            borderColor: colors[i],
            borderWidth: 4,
            pointBackgroundColor: colors[i],
        })
    }
    Object.keys(data).forEach((year, index) => {
        chart.data.labels.push(year)
        Object.keys(data[year]).forEach((type, index) => {
            console.log(data[year][type])
            chart.data.datasets[index].data.push(data[year][type])
        })
    })
    chart.update()
    console.log(chart.data.datasets)
}
