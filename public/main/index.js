/**********************
 *     VARIABLES      *
 **********************/

const map = L.map('map').setView([51.1657, 10.4515], 6);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


const info = L.control();


let bounds = L.latLngBounds(L.latLng(47.2701, 5.8662), L.latLng(55.0998, 15.0419));
let chartType = 'line';

/**
 * Date that is loaded by "1 Choice". It contains data in format { "State": value, "State2": value2 ...}
 * It is updated on "Update Map" Click
 * @type {{}}
 */
let stateValueMap0 = {};
/**
 * Date that is loaded by "2 Choice". It contains data in format { "State": value, "State2": value2 ...}
 * It is updated on "Update Map" Click
 * @type {{}}
 */
let stateValueMap1 = {};
/**
 * Date that is calculated based on first and second choice. If checkboxSecondChoice is checked, then it contains data in format { "State": (stateValueMap0["State"] / stateValueMap1["State"]) for every state } else it has same data as "stateValueMap0"
 * It is updated on "Update Map" Click
 * @type {{}}
 */
let normalizedStateData = {};
/**
 * It is updated on "Update Map" Click. Contains information if the checkbox "Second choice?" was active while Map update was clicked
 * @type {boolean}
 */
let secondChoiceCheckBoxWasChecked = false;

/**
 * @TODO
 */
let geoJson;

/**
 * @TODO
 */
const legend = L.control({position: 'bottomright'});
/**
 * Hue value for labels and for interpolation in case some value lay above average
 * @type {number}
 */
let currentAboveAverageColor = 0;
/**
 * Hue value for labels and for interpolation in case some value lay below average
 * @type {number}
 */
let currentBelowAverageColor = 120;

/**
 * changes color scheme on map, over average starts with Hue = 0 and below average Hue = 120. This function swaps them
 */

/**********************
 *     LISTENERS      *
 **********************/

document.getElementById('refreshMapButton').addEventListener('click', () => reloadGeoJSON());
document.getElementById('bar-type').addEventListener('click', () => setChartType('bar'))
document.getElementById('line-type').addEventListener('click', () => setChartType('line'))

document.querySelector('body > div > div > main > div > div > div.row > div.col-12.col-md-5.align-self-center > div > div.card-header > button').addEventListener('click', () => {
    document.getElementById('card-chart').classList.add('d-none');
    document.getElementById('card-map').classList.add('col-md-12');
    refreshMapWidth();

});

map.setMaxBounds(bounds);
map.on('drag', function () {
    map.panInsideBounds(bounds, {animate: false});
});


/**********************
 *     FUNCTIONS      *
 **********************/

function setChartType(type) {
    chartType = type
}


function refreshMapWidth() {
    document.getElementById('map-container').style.width = '100%';
    map.invalidateSize();
}

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    this.update();
    return this._div;
};

info.update = function (props) {
    updateInfoData(props)
        .then(result => {
            this._div.innerHTML = `${result}`;
        })
};

/**
 * Returns Object containing all current GUI selections for category, option and year as object.year[] object.title[] object.option[]
 * @returns {{}}
 */
function getActiveOptions() {
    let ActiveOptions = {};
    ActiveOptions.year = [];
    ActiveOptions.title = [];
    ActiveOptions.option = [];

    for (let i = 0; i <= 1; i++) {
        ActiveOptions.year[i] = parseInt(document.getElementById(`years[${i}]`).options[document.getElementById(`years[${i}]`).value]?.innerHTML);
        ActiveOptions.title[i] = document.getElementById(`parentSelect[${i}]`).options[document.getElementById(`parentSelect[${i}]`).value]?.innerHTML;
        ActiveOptions.option[i] = document.getElementById(`childSelect[${i}]`).options[document.getElementById(`childSelect[${i}]`).value]?.innerHTML;
    }
    return ActiveOptions;
}

/**
 * Updates data on top right side of map to currently shown values. Depending on selection, formatting changes accordingly
 * @param state
 * @returns {Promise<unknown>}
 */
async function updateInfoData(state) {
    return new Promise((resolve) => {

        let ActiveOptions = getActiveOptions();

        if (state) {
            let selectedState = state.name;
            let contents;
            if (secondChoiceCheckBoxWasChecked) {
                contents = `
                <h4 class="text-center">🇩🇪 ${state.name}</h4>
                
                <i class="fa-solid fa-divide fa-fw me-2" style="visibility:hidden; "></i>${(stateValueMap0[selectedState]) + " " + ActiveOptions.title[0] + " " + ActiveOptions.option[0] + " " + ActiveOptions.year[0]}<br>
                <div class="me-4" style="border-bottom: solid 2px #1e3050 ;">
                <i class="fa-solid fa-divide fa-fw me-2" ></i>${(stateValueMap1[selectedState]) + " " + ActiveOptions.title[1] + " " + ActiveOptions.option[1] + " " + ActiveOptions.year[1]}<br>
                </div>`;

                if (ActiveOptions.title[0] === ActiveOptions.title[1] && ActiveOptions.option[0] === ActiveOptions.option[1]) {
                    contents += `<i class="fa-solid fa-equals fa-fw me-2"></i>${(normalizedStateData[selectedState]) + " " + ActiveOptions.title[0] + " " + ActiveOptions.option[0] + " " + ActiveOptions.year[0] + " / " + ActiveOptions.year[1]}<br>`;
                } else {
                    contents += `<i class="fa-solid fa-equals fa-fw me-2"></i>${(normalizedStateData[selectedState]) + " " + ActiveOptions.title[0] + " " + ActiveOptions.option[0] + " / " + ActiveOptions.title[1] + " " + ActiveOptions.option[1]}<br>`;
                }
            } else {
                contents = `
                <h4 class="text-center">🇩🇪 ${state.name}</h4>
                <b>${ActiveOptions.year[0]}</b>
                <br><i class="fa-solid fa-equals fa-fw me-2"></i>${(stateValueMap0[selectedState]) + " " + ActiveOptions.title[0] + " " + ActiveOptions.option[0]}<br>`;
            }

            let minMaxAvg = getMinMaxAvg(normalizedStateData);
            contents += `
             <i class="fa-solid fa-arrow-down fa-fw me-2"></i>${(minMaxAvg[0]) + " Minimum"}<br>
             <i class="fa-solid fa-arrow-up fa-fw me-2"></i>${(minMaxAvg[1]) + " Maximum"}<br>
             <i class="fa-solid fa-gauge fa-fw me-2"></i>${((Math.round(minMaxAvg[2] * 1000) / 1000)) + " Average"}<br>
            `;
            resolve(contents);
        }
    });
}


info.addTo(map);


/**
 * Linear interpolation
 * @param x1 position of first data point
 * @param x2 position of second data point
 * @param fx1 value at x1
 * @param fx2 value at x2
 * @param x position of data point to be interpolated
 * @returns {*} value at x
 */
function lerp(x1, x2, fx1, fx2, x) {
    //console.log(fx1 + "+ (" + x + "-" + x1 + ") * ((" + fx2 + "-"+fx1 +") / ("+x2 + "-" + x1 + "));");
    if (Math.abs(x2 - x1) < 0.00000001)
        return fx1;
    return (fx1 + (x - x1) * ((fx2 - fx1) / (x2 - x1)));
}

/**
 * Converts HSV color to RGB
 * @param h Hue
 * @param s Saturation
 * @param v Value
 * @returns {{r: number, b: number, g: number}}
 */
function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s;
        v = h.v;
        h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Calculates min, max, avg values for given data set
 * @param stateValueData data in format {"key": value, ...}
 * @returns {[number, number, number]} array with [minimum, maximum, average]
 */
function getMinMaxAvg(stateValueData) {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    let avg = 0;
    let cnt = 0;
    for (let state in stateValueData) {
        if (isFinite(stateValueData[state])) { //skip weird values
            max = Math.max(stateValueData[state], max);
            min = Math.min(stateValueData[state], min);
            avg += stateValueData[state];
            cnt++;
        }
    }
    avg /= cnt;
    return [min, max, avg];
}

/**
 * Returns colors for all states on the map. Values get calculated with HSV color scheme using "currentBelowAverageColor" and "currentAboveAverageColor".
 * For below average, color gets calculated with linear interpolation between 60 (yellow) and "currentBelowAverageColor", default 0 (red)
 * For above average, color gets calculated with linear interpolation between 60 (yellow) and "currentAboveAverageColor", default 120 (green)
 * @param data data for all states {"state": value, ...}
 * @returns {{}} colors as { "state": color #RRGGBB}
 */
function getColorsFromData(data) {
    //data is Object with state: value
    let minMaxAvg = getMinMaxAvg(data);
    let min = minMaxAvg[0];
    let max = minMaxAvg[1];
    let avg = minMaxAvg[2];
    let colors = {};
    for (let state in data) {
        let h;
        if (data[state] > avg) {
            //interpolate beetwen yellow(60) and green(120)
            h = lerp(avg, max, 60, currentAboveAverageColor, data[state]);
        } else {
            //interpolate beetwen yellow(60) and red(0)
            h = lerp(avg, min, 60, currentBelowAverageColor, data[state]);
        }
        //Rounding error, so round()
        h = Math.round(h / 0.36) / 1000;
        let rgb = HSVtoRGB(h, 1.0, 0.9);
        colors[state] = RGBtoHEX(rgb);
    }
    return colors;
}

/**
 * Converts RGB value to HEX
 * @param rgb rgb object with r,g,b number attributes
 * @returns {string} #rrggbb
 */
function RGBtoHEX(rgb) {
    let hexR = rgb.r.toString(16);
    if (hexR.length === 1) hexR = "0" + hexR;

    let hexG = rgb.g.toString(16);
    if (hexG.length === 1) hexG = "0" + hexG;

    let hexB = rgb.b.toString(16);
    if (hexB.length === 1) hexB = "0" + hexB;

    return '#' + hexR + hexG + hexB; //#ff1234
}


/**
 * Defines the default design of the map
 * @returns {{color: string, fillOpacity: number, weight: number, opacity: number, dashArray: string}}
 */
function style() {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
    };
}

/**
 * Responsible when clicking on a state
 * @param e
 */
function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.8
    });

    layer.bringToFront();
    info.update(layer.feature.properties);
}


/**
 * Used when "Update map" is clicked. Reads current selected elements, loads data, sets colors and charts
 */
function reloadGeoJSON() {
    if (geoJson) {
        map.removeLayer(geoJson);
    }

    let ActiveOptions = getActiveOptions();
    // At time of update click
    secondChoiceCheckBoxWasChecked = document.getElementById('secondChoiceActive').checked;

    // Load data here, then per key-value pairs get all A/B values and from that get avgs etc. and from that get color in "onEachFeature".


    let colors;
    loadData(null, ActiveOptions.year[0], ActiveOptions.title[0], ActiveOptions.option[0]).then(data0 => {
        Object.keys(data0).forEach(index => {
            if (data0[index]['title'] === ActiveOptions.title[0]) {
                Object.keys(data0[index]['data']).forEach(state => {
                    stateValueMap0[state] = data0[index]['data'][state][ActiveOptions.year[0]][ActiveOptions.option[0]];

                });
            }
        });
    }).then(() =>

        loadData(null, ActiveOptions.year[1], ActiveOptions.title[1], ActiveOptions.option[1]).then(data1 => {
            Object.keys(data1).forEach(index => {
                if (data1[index]['title'] === ActiveOptions.title[1]) {
                    Object.keys(data1[index]['data']).forEach(state => {
                        stateValueMap1[state] = data1[index]['data'][state][ActiveOptions.year[1]][ActiveOptions.option[1]];
                    });
                }
            })
        })).then(() => {

            if (secondChoiceCheckBoxWasChecked) {//if equal selections then do not divide
                for (let state in stateValueMap0) {
                    normalizedStateData[state] = Math.round((stateValueMap0[state] / stateValueMap1[state]) * 1000) / 1000;
                }
            } else {
                for (let state in stateValueMap0) {
                    normalizedStateData[state] = Math.round(stateValueMap0[state] * 1000) / 1000;
                }
            }
            //console.log(normalizedStateData);
            colors = getColorsFromData(normalizedStateData);
        }
    ).then(() => {
            // Create new GeoJSON layer and add it to the map
            geoJson = L.geoJson(statesData, {
                style,
                onEachFeature: async function (feature, layer) {

                    layer.setStyle({fillColor: colors[feature.properties.name]}).on({
                        mouseover: highlightFeature,
                        mouseout: resetHighlight,
                        click: createChart
                    });
                }
            }).addTo(map);
        }
    );
}


function resetHighlight(e) {
    e.target.setStyle(style());
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}


/**
 * Swaps colors for below and above average. Cycles between red and green
 */
function swapColors() {
    let aboveLabel = document.getElementById('aboveAverageLabel');
    let belowLabel = document.getElementById('belowAverageLabel');

    if (currentAboveAverageColor === 0) {
        currentAboveAverageColor = 120;
        currentBelowAverageColor = 0;


        aboveLabel.style.background = RGBtoHEX(HSVtoRGB(Math.round(currentAboveAverageColor / 0.36) / 1000, 1.0, 1.0));
        belowLabel.style.background = RGBtoHEX(HSVtoRGB(Math.round(currentBelowAverageColor / 0.36) / 1000, 1.0, 1.0));

    } else {
        currentAboveAverageColor = 0;
        currentBelowAverageColor = 120;
        aboveLabel.style.background = RGBtoHEX(HSVtoRGB(Math.round(currentAboveAverageColor / 0.36) / 1000, 1.0, 1.0));
        belowLabel.style.background = RGBtoHEX(HSVtoRGB(Math.round(currentBelowAverageColor / 0.36) / 1000, 1.0, 1.0));
    }
    reloadGeoJSON();
}

legend.onAdd = function () {

    const div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    let labels = [];

    labels.push(`<i class="pl-3 pe-3 me-2" id="aboveAverageLabel" style="background: #ff0000" onclick="swapColors()"></i> above average`);
    labels.push(`<i class="pl-3 pe-3 me-2" style="background: #ffff00" onclick="swapColors()"></i> average`);
    labels.push(`<i class="pl-3 pe-3 me-2" id="belowAverageLabel" style="background: #00ff00" onclick="swapColors()"></i> below average`);

    div.innerHTML = labels.join('<br>');

    return div;
};

legend.addTo(map);

/**
 * Creates the charts which show the data in relation to the years
 * @param e Event, which is emitted when clicking somewhere on the map
 */
function createChart(e) {

    let cardChart = document.getElementById('card-chart');
    let cardMap = document.getElementById('card-map');
    cardChart.classList.remove('d-none');

    cardMap.classList.remove('col-md-12');
    cardMap.classList.add('col-md-7');

    refreshMapWidth();


    let chartStatus = Chart.getChart("timeChart[0]")
    let chart2Status = Chart.getChart("timeChart[1]")
    if (chartStatus !== undefined) {
        chartStatus.destroy();
    }
    if (chart2Status !== undefined) {
        chart2Status.destroy();
    }
    let name = e.target.feature.properties.name;
    zoomToFeature(e)


    for (let i = 0; i <= 1; i++) {
        let title = document.getElementById(`parentSelect[${i}]`).options[document.getElementById(`parentSelect[${i}]`).value].innerHTML;
        loadData(name, null, title).then(data => {
            Object.keys(data).forEach(index => {
                if (data[index] && data[index]['title'] === title) {
                    data = data[index]['data'][name];
                    let chart = buildChart(title, `timeChart[${i}]`, chartType)
                    fillChart(chart, data)
                }
            });
        });

        /**
         * Check if divide by second choice is enabled and if not, then show only one chart
         */
        if (!document.getElementById('secondChoiceActive').checked) {
            break;
        }
    }
}
