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

// control that shows state info on hover
const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    this.update();
    return this._div;
};

info.update = function (props) {
    asyncFunction(props)
        .then(result => {
            this._div.innerHTML = `<h4 class="text-center">🇩🇪 ${currentYear.options[currentYear.selectedIndex].innerHTML}</h4>${result}`;
        })
};

async function asyncFunction(props) {
    return new Promise((resolve) => {

        if (props && props.name) {
                loadStates(props.name, currentYear.options[currentYear.selectedIndex].innerHTML, async (err, data) => {
                    const contents = `<b>${props.name}</b><br>
        <i class="fa-solid fa-tree-city fa-fw me-2"></i>${((data['außerorts (ohne Autobahnen)'] + data['innerorts']) / (await loadStreetInfrastructure(props.name))['Nicht Autobahnen']).toLocaleString('de-DE')} Unfälle außerorts ohne Autobahn<br>
        <i class="fa-solid fa-road fa-fw me-2"></i>${(data['auf Autobahnen'] / (await loadStreetInfrastructure(props.name))['Autobahnen']).toLocaleString('de-DE')} Autbahnunfälle pro Kilometer/Jahr<br>
        <i class="fa-solid fa-equals fa-fw me-2"></i>${(data['Insgesamt'] / (await loadStreetInfrastructure(props.name))['Gesamt']).toLocaleString('de-DE')} Unfälle insgesamt pro Kilometer/Jahr<br>
        <i class="fa-solid fa-equals fa-fw me-2"></i>${await calculateAverage(currentYear.options[currentYear.selectedIndex].innerHTML).then(value => value.toLocaleString('de-DE'))} Durchschnitt`;
                    resolve(contents);
                })
            }
    });
}


info.addTo(map);




function lerp(x1,x2,fx1,fx2,x){
    //console.log(fx1 + "+ (" + x + "-" + x1 + ") * ((" + fx2 + "-"+fx1 +") / ("+x2 + "-" + x1 + "));");
    return fx1 + (x - x1) * ((fx2 - fx1) / (x2 - x1));
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}


// get color depending on population density value
async function getColor(state, year) {
    return new Promise(function (resolve, reject) {
        loadStates(state, year, (err, data) => {
            calculateAverageMinMax(year).then(avgMinMax => {
                //console.log("get color avgminmax is "+ avgMinMax);
                let h;
                if (data['Insgesamt'] > avgMinMax[0]) {
                    //interpolation zwischen gelb(60) und grün(120) in parametern
                    h = lerp(avgMinMax[0], avgMinMax[2], 60,120, data['Insgesamt']);


                } else {
                    //interpolation zwischen gelb/rot
                    h = lerp(avgMinMax[0], avgMinMax[1],60,0,  data['Insgesamt']);
                }
                console.log("H=" + h);
                h = (h / 360);
                let rgb = HSVtoRGB(h, 1.0, 0.6);
                //console.log("RGB = " + rgb.r + ", " + rgb.g + ", " + rgb.b);

                let hexR = rgb.r.toString(16);
                if(hexR.length === 1) hexR = "0" + hexR;

                let hexG = rgb.g.toString(16);
                if(hexG.length === 1) hexG = "0" + hexG;

                let hexB = rgb.b.toString(16);
                if(hexB.length === 1) hexB = "0" + hexB;

                let hexString = '#' + hexR + hexG + hexB; //#ff1234

                //console.log("HEX = " + hexString);
                resolve(hexString);

            });
        });
    });
}

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
    if (geojson) {
        map.removeLayer(geojson);
    }

    // Neue GeoJSON-Schicht erstellen und zur Karte hinzufügen
    geojson = L.geoJson(statesData, {
        style,
        onEachFeature: async function (feature, layer) {
            const color = await getColor(feature.properties.name, currentYear.options[currentYear.selectedIndex].innerHTML);

            layer.setStyle({ fillColor: color }).on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }
    }).addTo(map);
}


function resetHighlight(e) {
    e.target.setStyle(style());
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}


const legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    const div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    const labels = [];

    labels.push(`<i class="pl-3 pe-3 me-2" style="background: red"></i> über Durchschnitt`);
    labels.push(`<i class="pl-3 pe-3 me-2" style="background: green"></i> unter Durchschnitt`);

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
    console.log("calc avg called " + year);

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

async function calculateAverageMinMax(year) {
    return new Promise((resolve, reject) => {
        loadStates(null, year, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            let sum = 0;
            let count = 0;
            //TODO Insgesamt oder auch andere? Es muss bestimmt mit dem select feld selektierbar sein
            let min = 999999999;
            let max = 0;
            Object.keys(data).forEach(state => {
                Object.keys(data[state]).forEach(year => {
                    if (data[state][year].hasOwnProperty("Insgesamt")) {
                        const value = data[state][year]["Insgesamt"];
                        sum += value;
                        count++;
                        if(min > value)
                            min = value;
                        if(max < value)
                            max = value;
                    }
                });
            });

            if (count === 0) {
                reject(new Error("No data available"));
                return;
            }

            const average = sum / count;
            resolve([average, min, max]);
        });
    });
}





async function updateSlider(value) {
    // currentYear.value = value;
    currentYear.value = value;
}
