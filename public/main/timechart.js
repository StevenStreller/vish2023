/* globals Chart:false, feather:false */
const colors = [
    "#D81159",
    "#8F2D56",
    "#218380",
    "#FBB13C",
    "#73D2DE",
]

/**
 * Initializes a chart
 * @param name Title of the chart
 * @param chartId which chart to initialize (timeChart1 / timeChart2)
 * @param chartType type of the chart i.e. bar, line etc.
 * @returns {wn} chart object
 */
function buildChart(name, chartId, chartType) {
    'use strict'

    const ctx = document.getElementById(chartId)
    return new Chart(ctx, {
        type: chartType,
        options: {
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: name,
                }
            }
        }
    })
}

/**
 * Fills the chart with specific values
 * @param chart chart that is supposed to be filled
 * @param data the data which the chart is filled with
 */
function fillChart(chart, data) {
    let years = Object.keys(data)
    let types = Object.keys(data[years[0]])
    for (i = 0; i < types.length; i++) {
        chart.data.datasets.push({
            label: types[i],
            data: [],
            lineTension: 0,
            backgroundColor: 'transparent',
            borderColor: colors[i],
            borderWidth: 4,
            pointBackgroundColor: colors[i],
            pointStyle: 'dash',
        })
    }
    Object.keys(data).forEach((year) => {
        chart.data.labels.push(year)
        Object.keys(data[year]).forEach((type, index) => {
            chart.data.datasets[index].data.push(data[year][type])
        })
    })
    chart.update()
}
