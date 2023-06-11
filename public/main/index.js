const map = L.map('map').setView([51.1657, 10.4515], 6);

let bounds = L.latLngBounds(L.latLng(47.2701, 5.8662), L.latLng(55.0998, 15.0419));
map.setMaxBounds(bounds);
map.on('drag', function() {
    map.panInsideBounds(bounds, { animate: false });
});

document.getElementById('refreshMapButton').addEventListener('click', () => reloadGeoJSON());

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const currentYear = document.getElementById('years[0]');
function getCurrentYear() {
    return currentYear.options[currentYear.selectedIndex].innerHTML;
}


let stateValueMap0 = {};
let stateValueMap1 = {};
let normalizedStateData = {};


// control that shows state info on hover
const info = L.control();

info.onAdd = function (map) {
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
    //return new Promise((resolve) => {
    //    let selectedState = props.name;
    //    if (props && selectedState) {
    //            loadStates(selectedState, getCurrentYear(), async (err, data) => {
    //                const contents = `<b>${props.name}</b><br>
    //    <i class="fa-solid fa-tree-city fa-fw me-2"></i>${((data['außerorts (ohne Autobahnen)'] + data['innerorts']) / (await loadStreetInfrastructure(props.name))['Nicht Autobahnen']).toLocaleString('de-DE')} Unfälle außerorts ohne Autobahn<br>
    //    <i class="fa-solid fa-road fa-fw me-2"></i>${(data['auf Autobahnen'] / (await loadStreetInfrastructure(props.name))['Autobahnen']).toLocaleString('de-DE')} Autbahnunfälle pro Kilometer/Jahr<br>
    //    <i class="fa-solid fa-equals fa-fw me-2"></i>${(data['Insgesamt'] / (await loadStreetInfrastructure(props.name))['Gesamt']).toLocaleString('de-DE')} Unfälle insgesamt pro Kilometer/Jahr<br>
    //    <i class="fa-solid fa-equals fa-fw me-2"></i>${await calculateAverage(getCurrentYear()).then(value => value.toLocaleString('de-DE'))} Durchschnitt`;
    //                resolve(contents);
    //            });
    //    }
    //});

    return new Promise((resolve) => {

        let year0 = parseInt(document.getElementById('years[0]').options[document.getElementById('years[0]').value].innerHTML);
        let title0 = document.getElementById('parentSelect[0]').options[document.getElementById('parentSelect[0]').value].innerHTML;
        let option0 = document.getElementById('childSelect[0]').options[document.getElementById('childSelect[0]').value].innerHTML;

        let year1 = parseInt(document.getElementById('years[1]').options[document.getElementById('years[1]').value].innerHTML);
        let title1 = document.getElementById('parentSelect[1]').options[document.getElementById('parentSelect[1]').value].innerHTML;
        let option1 = document.getElementById('childSelect[1]').options[document.getElementById('childSelect[1]').value].innerHTML;


        let selectedState = props.name;
        if (props && selectedState) {
            let contents;
            if(year0 === year1 && title0 === title1 && option0 === option1) {

                contents = `
                <h4 class="text-center">🇩🇪 ${props.name}</h4>
                <b>${year0}</b>
                <br>
                    <i class="fa-solid fa-equals fa-fw me-2"></i>${(stateValueMap0[selectedState] + " " + title0 + " " + option0).toLocaleString('de-DE')}<br>
                   `;
            }
            else {
                contents = `
                <h4 class="text-center">🇩🇪 ${props.name}</h4>
                
                <i class="fa-solid fa-equals fa-fw me-2"></i>${(stateValueMap0[selectedState] + " " + title0 + " " + option0 + " " + year0).toLocaleString('de-DE')}<br>
                <i class="fa-solid fa-equals fa-fw me-2"></i>${(stateValueMap1[selectedState] + " " + title1 + " " + option1 + " " + year1).toLocaleString('de-DE')}<br>
                <i class="fa-solid fa-equals fa-fw me-2"></i>${(normalizedStateData[selectedState] + " " + title0 + " " + option0 + " / " + title1 + " " + option1).toLocaleString('de-DE')}<br>
                `;
            }
            let minMaxAvg = getMinMaxAvg(normalizedStateData);
            contents += `
             <i class="fa-solid fa-arrow-down fa-fw me-2"></i>${(minMaxAvg[0] + " Minimum").toLocaleString('de-DE')}<br>
             <i class="fa-solid fa-arrow-up fa-fw me-2"></i>${(minMaxAvg[1] + " Maximum").toLocaleString('de-DE')}<br>
             <i class="fa-solid fa-gauge fa-fw me-2"></i>${(minMaxAvg[2] + " Average").toLocaleString('de-DE')}<br>
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

// get color depending on selected data
/*async function getColor(state, year, title, option) {
    return new Promise(function (resolve, reject) {
        loadData(state, parseInt(year), title, option).then(data => {
            calculateAverageMinMax(parseInt(year), title, option).then(avgMinMax => {
                Object.keys(data).forEach(index => {
                    if (data[index]['title'] === title) {
                        // console.log(data[index]['data']);
                        Object.keys(data[index]['data']).forEach(state => {
                            let h;
                            if (data[index]['data'][state][year][option] > avgMinMax[0]) {
                                //interpolation zwischen gelb(60) und grün(120) in parametern
                                h = lerp(avgMinMax[0], avgMinMax[2], 60,currentUnterDurchschnittColor, data[index]['data'][state][year][option]);


                            } else {
                                //interpolation zwischen gelb/rot
                                h = lerp(avgMinMax[0], avgMinMax[1],60,currentUeberDurchschnittColor,  data[index]['data'][state][year][option]);
                            }
                            //Rundungsfehler, deshalb round()
                            h = Math.round(h / 0.36) / 1000;

                            let rgb = HSVtoRGB(h, 1.0, 0.6);
                            //console.log("RGB = " + rgb.r + ", " + rgb.g + ", " + rgb.b);
                            //console.log("HEX = " + hexString);
                            resolve(RGBtoHEX(rgb));
                        });
                    }
                });

                //console.log("get color avgminmax is "+ avgMinMax);
            });
        });
    });
}
*/
function style(feature) {
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

let geojson;


function reloadGeoJSON() {
    //console.log(currentYear.options[currentYear.value].innerHTML);
    if (geojson) {
        map.removeLayer(geojson);
    }

    let year0 = parseInt(document.getElementById('years[0]').options[document.getElementById('years[0]').value].innerHTML);
    let title0 = document.getElementById('parentSelect[0]').options[document.getElementById('parentSelect[0]').value].innerHTML;
    let option0 = document.getElementById('childSelect[0]').options[document.getElementById('childSelect[0]').value].innerHTML;

    let year1 = parseInt(document.getElementById('years[1]').options[document.getElementById('years[1]').value].innerHTML);
    let title1 = document.getElementById('parentSelect[1]').options[document.getElementById('parentSelect[1]').value].innerHTML;
    let option1 = document.getElementById('childSelect[1]').options[document.getElementById('childSelect[1]').value].innerHTML;

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

        if(year0 === year1 && title0 === title1 && option0 === option1)
        {//if equal selections then do not divide

            for (let state in stateValueMap0) {
                normalizedStateData[state] = stateValueMap0[state];
            }
        }
        else {
            for (let state in stateValueMap0) {
                normalizedStateData[state] = (stateValueMap0[state] / stateValueMap1[state]);
            }
        }
        //console.log(normalizedStateData);
        colors = getColorsFromData(normalizedStateData);
    }
    ).then(() =>
        {
            // Neue GeoJSON-Schicht erstellen und zur Karte hinzufügen
            geojson = L.geoJson(statesData, {
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

legend.onAdd = function (map) {

    const div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    let labels = [];

    labels.push(`<i class="pl-3 pe-3 me-2" id="ueberDurchschnittLabel" style="background: #ff0000" onclick="changeColors()"></i> über Durchschnitt`);
    labels.push(`<i class="pl-3 pe-3 me-2" style="background: #ffff00" onclick="changeColors()"></i> Durchschnitt`);
    labels.push(`<i class="pl-3 pe-3 me-2" id="unterDurchschnittLabel" style="background: #00ff00" onclick="changeColors()"></i> unter Durchschnitt`);

    div.innerHTML = labels.join('<br>');

    return div;
};

legend.addTo(map);



function loadStates(state, year, callback) {
    let accidents;

    fetch('../assets/data/car-accidents.json')
        .then(response => response.json())
        .then(response => {
            if (state === null && year !== null) {
                Object.keys(response).forEach(currentState => {
                    Object.keys(response[currentState]).forEach(currentYear => {
                        if (parseInt(currentYear)!== parseInt(year)) {
                            delete response[currentState][currentYear];
                        }
                    })
                })
                accidents = response;
            } else if (state !== null && year !== null) {
                accidents = response[state][year];
            } else if (state !== null && year == null) {
                accidents = response[state];
            } else {
                accidents = response;
            }

            callback(null, accidents);
        })
        .catch(error => {
            console.error('Fehler beim Laden der JSON-Datei:', error);
        });
}

function loadStreetInfrastructure(state) {
    return fetch('../assets/data/street-infrastructure.json')
        .then(response => response.json())
        .then(response => {
            for (let key in response) {
                if (response[key]['Bundesland'] === state) {
                    return response[key];
                }
            }
        })
}

async function calculateAverage(year) {

    return new Promise((resolve, reject) => {
        loadStates(null, year, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            let sum = 0;
            let count = 0;

            Object.keys(data).forEach(state => {
                Object.keys(data[state]).forEach(year => {
                    if (data[state][year].hasOwnProperty("Insgesamt")) {
                        const value = data[state][year]["Insgesamt"];
                        sum += value;
                        count++;
                    }
                });
            });

            if (count === 0) {
                reject(new Error("No data available"));
                return;
            }

            const average = sum / count;
            resolve(parseInt(average));
        });
    });
}

async function calculateAverageMinMax(year, title, option) {

    return new Promise((resolve, reject) => {
        loadData(null, year, title, option).then((data) => {
            let sum = 0;
            let count = 0;
            let min = Number.MAX_VALUE;
            let max = 0;

            Object.keys(data).forEach(index => {
                if (data[index]['title'] === title) {
                    Object.keys(data[index]['data']).forEach(state => {
                        const value = data[index]['data'][state][year][option];
                        sum += value;
                        count++;
                        min = Math.min(min, value);
                        max = Math.max(max, value);
                    });
                }
            });

            if (count === 0) {
                reject(new Error("No data available"));
                return;
            }
            const average = sum / count;
            //console.log([average, min, max]);
            resolve([average, min, max]);
        });

    });
}


function createChart(e) {
    let chartStatus = Chart.getChart("timechart")
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }
    let name = e.target.feature.properties.name;
    console.log(name);
    zoomToFeature(e)
    // prepareData(name, "../assets/data/car-accidents.json").then(data => {
    //     console.log(data);
    //     let chart = buildChart(data, name)
    //     fillChart(chart, data)
    // })
    let title = document.getElementById('parentSelect[0]').options[document.getElementById('parentSelect[0]').value].innerHTML;
    loadData(name, null, title).then(data => {
        Object.keys(data).forEach(index => {
            if (data[index]['title']  === title) {
                data = data[index]['data'][name];
                console.log(data);
                console.log('TEST');
                let chart = buildChart(data, name)
                fillChart(chart, data)
            }
        });


    })

}
function prepareData(state, dataPath) {
    d = fetch(dataPath)
        .then(response => response.json())
        .then(response => {
            return response[state]
        })
    return d
}
