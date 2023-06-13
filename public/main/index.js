/**********************
 *     VARIABLES      *
 **********************/

/**
 * @TODO
 */
const map = L.map('map').setView([51.1657, 10.4515], 6);

/**
 * @TODO
 *
 * @type {HTMLElement}
 */
const currentYear = document.getElementById('years[0]');

/**
 * @TODO
 */
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

/**
 * @TODO
 */
const info = L.control();


let bounds = L.latLngBounds(L.latLng(47.2701, 5.8662), L.latLng(55.0998, 15.0419));
let chartType = 'line';
let stateValueMap0 = {};
let stateValueMap1 = {};
let normalizedStateData = {};
let secondChoiceCheckBoxWasChecked = false;
let geoJson;


/**********************
 *     LISTENERS      *
 **********************/

document.getElementById('refreshMapButton').addEventListener('click', () => reloadGeoJSON());
document.getElementById('bar-type').addEventListener('click', () => setChartType('bar'))
document.getElementById('line-type').addEventListener('click', () => setChartType('line'))


map.setMaxBounds(bounds);
map.on('drag', function() {
    map.panInsideBounds(bounds, { animate: false });
});


/**********************
 *     FUNCTIONS      *
 **********************/

function setChartType(type) {
    chartType = type
}

function getCurrentYear() {
    return currentYear.options[currentYear.selectedIndex].innerHTML;
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



async function updateInfoData(props) {
    return new Promise((resolve) => {

        let year = [];
        let title = [];
        let option = [];

        for (let i = 0; i <= 1; i++) {
            year[i] = parseInt(document.getElementById(`years[${i}]`).options[document.getElementById(`years[${i}]`).value]?.innerHTML);
            title[i] = document.getElementById(`parentSelect[${i}]`).options[document.getElementById(`parentSelect[${i}]`).value]?.innerHTML;
            option[i] = document.getElementById(`childSelect[${i}]`).options[document.getElementById(`childSelect[${i}]`).value]?.innerHTML;
        }

        /** @TODO: Kann weg, oder? Habs durch Zeile 94-98 ersetzt  */
        // let year0 = parseInt(document.getElementById('years[0]').options[document.getElementById('years[0]').value].innerHTML);
        // let title0 = document.getElementById('parentSelect[0]').options[document.getElementById('parentSelect[0]').value].innerHTML;
        // let option0 = document.getElementById('childSelect[0]').options[document.getElementById('childSelect[0]').value].innerHTML;
        //
        // let year1 = parseInt(document.getElementById('years[1]').options[document.getElementById('years[1]').value].innerHTML);
        // let title1 = document.getElementById('parentSelect[1]').options[document.getElementById('parentSelect[1]').value].innerHTML;
        // let option1 = document.getElementById('childSelect[1]').options[document.getElementById('childSelect[1]').value].innerHTML;


        if (props) {
            let selectedState = props.name;
            let contents;
            if(secondChoiceCheckBoxWasChecked) {
                contents = `
                <h4 class="text-center">🇩🇪 ${props.name}</h4>
                
                <i class="fa-solid fa-divide fa-fw me-2" style="visibility:hidden; "></i>${(stateValueMap0[selectedState]).toLocaleString('de-DE') + " " + title[0] + " " + option[0] + " " + year[0]}<br>
                <div class="me-4" style="border-bottom: solid 2px #1e3050 ;">
                <i class="fa-solid fa-divide fa-fw me-2" ></i>${(stateValueMap1[selectedState]).toLocaleString('de-DE') + " " + title[1] + " " + option[1] + " " + year[1]}<br>
                </div>`;

                if (title[0] === title[1] && option[0] === option[1]) {
                    contents += `<i class="fa-solid fa-equals fa-fw me-2"></i>${(normalizedStateData[selectedState]).toLocaleString('de-DE') + " " + title[0] + " " + option[0] + " " + year[0] + " / " + year[1]}<br>`;
                } else {
                    contents += `<i class="fa-solid fa-equals fa-fw me-2"></i>${(normalizedStateData[selectedState]).toLocaleString('de-DE') + " " + title[0] + " " + option[0] + " / " + title[1] + " " + option[1]}<br>`;
                }
            }
            else {
                contents = `
                <h4 class="text-center">🇩🇪 ${props.name}</h4>
                <b>${year[0]}</b>
                <br><i class="fa-solid fa-equals fa-fw me-2"></i>${(stateValueMap0[selectedState]).toLocaleString('de-DE') + " " + title[0] + " " + option[0]}<br>`;
            }

            let minMaxAvg = getMinMaxAvg(normalizedStateData);
            contents += `
             <i class="fa-solid fa-arrow-down fa-fw me-2"></i>${(minMaxAvg[0]).toLocaleString('de-DE') + " Minimum"}<br>
             <i class="fa-solid fa-arrow-up fa-fw me-2"></i>${(minMaxAvg[1]).toLocaleString('de-DE') + " Maximum"}<br>
             <i class="fa-solid fa-gauge fa-fw me-2"></i>${((Math.round(minMaxAvg[2]*1000)/1000)).toLocaleString('de-DE') + " Average"}<br>
            `;
            resolve(contents);
        }
    });
}


info.addTo(map);


function lerp(x1,x2,fx1,fx2,x){
    //console.log(fx1 + "+ (" + x + "-" + x1 + ") * ((" + fx2 + "-"+fx1 +") / ("+x2 + "-" + x1 + "));");
    if(Math.abs(x2-x1) < 0.00000001)
        return fx1;
    return (fx1 + (x - x1) * ((fx2 - fx1) / (x2 - x1)));
}

function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s; v = h.v; h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function getMinMaxAvg(stateValueData){
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    let avg = 0;
    let cnt = 0;
    for(let state in stateValueData){
        if(isFinite(stateValueData[state])) { //skip weird values
            max = Math.max(stateValueData[state], max);
            min = Math.min(stateValueData[state], min);
            avg += stateValueData[state];
            cnt++;
        }
    }
    avg /= cnt;
    return [min, max, avg];
}

function getColorsFromData(data){
    //data is Object with state: value
    let minMaxAvg = getMinMaxAvg(data);
    let min = minMaxAvg[0];
    let max = minMaxAvg[1];
    let avg = minMaxAvg[2];
    let colors = {};
    for(let state in data) {
        let h;
        if (data[state] > avg) {
            //interpolation zwischen gelb(60) und grün(120) in parametern
            h = lerp(avg, max, 60, currentUnterDurchschnittColor, data[state]);
        } else {
            //interpolation zwischen gelb/rot
            h = lerp(avg, min,60, currentUeberDurchschnittColor, data[state]);
        }
        //Rundungsfehler, deshalb round()
        h = Math.round(h / 0.36) / 1000;
        //console.log(state + " H=" + h);
        let rgb = HSVtoRGB(h, 1.0, 0.9);
        colors[state] = RGBtoHEX(rgb);
    }
    return colors;
}

function RGBtoHEX(rgb){
    let hexR = rgb.r.toString(16);
    if(hexR.length === 1) hexR = "0" + hexR;

    let hexG = rgb.g.toString(16);
    if(hexG.length === 1) hexG = "0" + hexG;

    let hexB = rgb.b.toString(16);
    if(hexB.length === 1) hexB = "0" + hexB;

    return '#' + hexR + hexG + hexB; //#ff1234
}


function style() {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
    };
}

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




function reloadGeoJSON() {
    if (geoJson) {
        map.removeLayer(geoJson);
    }

    let year0 = parseInt(document.getElementById('years[0]').options[document.getElementById('years[0]').value].innerHTML);
    let title0 = document.getElementById('parentSelect[0]').options[document.getElementById('parentSelect[0]').value].innerHTML;
    let option0 = document.getElementById('childSelect[0]').options[document.getElementById('childSelect[0]').value].innerHTML;

    let year1 = parseInt(document.getElementById('years[1]').options[document.getElementById('years[1]').value].innerHTML);
    let title1 = document.getElementById('parentSelect[1]').options[document.getElementById('parentSelect[1]').value].innerHTML;
    let option1 = document.getElementById('childSelect[1]').options[document.getElementById('childSelect[1]').value].innerHTML;
    //At time of update click
    secondChoiceCheckBoxWasChecked = document.getElementById('secondChoiceActive').checked;

    //Laden von daten hier, dann per Key-Value pairs get all A/B values and from that get avgs etc. and get color from that in "onEachFeature"


    let colors;
    loadData(null, year0, title0, option0).then( data0 =>{
        Object.keys(data0).forEach(index => {
            if (data0[index]['title'] === title0) {
                Object.keys(data0[index]['data']).forEach(state => {
                    stateValueMap0[state] = data0[index]['data'][state][year0][option0];

                });
            }
        });
    }).then( () =>

    loadData(null, year1, title1, option1).then(data1 => {
        Object.keys(data1).forEach(index => {
            if (data1[index]['title'] === title1) {
                Object.keys(data1[index]['data']).forEach(state => {
                    stateValueMap1[state] = data1[index]['data'][state][year1][option1];
                });
            }
        })
    })).then(() => {

        if(secondChoiceCheckBoxWasChecked)
        {//if equal selections then do not divide
            for (let state in stateValueMap0) {
                normalizedStateData[state] = Math.round((stateValueMap0[state] / stateValueMap1[state]) * 1000) / 1000;
            }
        }
        else {
            for (let state in stateValueMap0) {
                normalizedStateData[state] = Math.round(stateValueMap0[state] * 1000) / 1000;
            }
        }
        //console.log(normalizedStateData);
        colors = getColorsFromData(normalizedStateData);
    }
    ).then(() =>
        {
            // Neue GeoJSON-Schicht erstellen und zur Karte hinzufügen
            geoJson = L.geoJson(statesData, {
                style,
                onEachFeature: async function (feature, layer) {

                    layer.setStyle({ fillColor: colors[feature.properties.name] }).on({
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


const legend = L.control({position: 'bottomright'});
let currentUeberDurchschnittColor = 0;
let currentUnterDurchschnittColor = 120;


function changeColors() {
    let ueberLabel = document.getElementById('ueberDurchschnittLabel');
    let unterLabel = document.getElementById('unterDurchschnittLabel');

    if(currentUeberDurchschnittColor === 0){
        ueberLabel.style.background = "#00ff00";
        unterLabel.style.background = "#ff0000";
        currentUeberDurchschnittColor = 120;
        currentUnterDurchschnittColor = 0;
    } else {
        ueberLabel.style.background = "#ff0000";
        unterLabel.style.background = "#00ff00";
        currentUeberDurchschnittColor = 0;
        currentUnterDurchschnittColor = 120;
    }
    reloadGeoJSON();
}

legend.onAdd = function () {

    const div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    let labels = [];

    labels.push(`<i class="pl-3 pe-3 me-2" id="ueberDurchschnittLabel" style="background: #00ff00" onclick="changeColors()"></i> über Durchschnitt`);
    labels.push(`<i class="pl-3 pe-3 me-2" style="background: #ffff00" onclick="changeColors()"></i> Durchschnitt`);
    labels.push(`<i class="pl-3 pe-3 me-2" id="unterDurchschnittLabel" style="background: #ff0000" onclick="changeColors()"></i> unter Durchschnitt`);

    div.innerHTML = labels.join('<br>');

    return div;
};

legend.addTo(map);

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
                    let chart = buildChart(data, title, `timeChart[${i}]`, chartType)
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

    // let title = document.getElementById('parentSelect[0]').options[document.getElementById('parentSelect[0]').value].innerHTML;
    // loadData(name, null, title).then(data => {
    //
    //     Object.keys(data).forEach(index => {
    //         console.log(data[index] !== {})
    //         if (data[index]['title'] === title) {
    //             data = data[index]['data'][name];
    //             let chart = buildChart(data, title, "timeChart[0]", chartType)
    //             fillChart(chart, data)
    //         }
    //     });
    // });
    // let title2 = document.getElementById('parentSelect[1]').options[document.getElementById('parentSelect[1]').value].innerHTML;
    // loadData(name, null, title2).then(data => {
    //     Object.keys(data).forEach(index => {
    //         if (data[index]['title']  === title2) {
    //             data = data[index]['data'][name];
    //             let chart = buildChart(data, title2, "timeChart[1]", chartType)
    //             fillChart(chart, data)
    //         }
    //     });
    //
    //
    // })

}
document.querySelector('body > div > div > main > div > div > div.row > div.col-12.col-md-5.align-self-center > div > div.card-header > button').addEventListener('click', () => {
    document.getElementById('card-chart').classList.add('d-none');
    document.getElementById('card-map').classList.add('col-md-12');
    refreshMapWidth();

});
