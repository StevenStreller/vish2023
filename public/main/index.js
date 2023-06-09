const map = L.map('map').setView([51.5, 9], 6);
document.getElementById('refreshMapButton').addEventListener('click', () => reloadGeoJSON());

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const currentYear = document.getElementById('sliderValue');

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
            this._div.innerHTML = `<h4 class="text-center">🇩🇪 ${currentYear.textContent}</h4>${result}`;
        })
};

async function asyncFunction(props) {
    return new Promise((resolve) => {

            if (props && props.name) {
                loadStates(props.name, currentYear.textContent, async (err, data) => {
                    const contents = `<b>${props.name}</b><br>
        <i class="fa-solid fa-tree-city fa-fw me-2"></i>${((data['außerorts (ohne Autobahnen)'] + data['innerorts']) / (await loadStreetInfrastructure(props.name))['Nicht Autobahnen']).toLocaleString('de-DE')} Unfälle außerorts ohne Autobahn<br>
        <i class="fa-solid fa-road fa-fw me-2"></i>${(data['auf Autobahnen'] / (await loadStreetInfrastructure(props.name))['Autobahnen']).toLocaleString('de-DE')} Autbahnunfälle pro Kilometer/Jahr<br>
        <i class="fa-solid fa-equals fa-fw me-2"></i>${(data['Insgesamt'] / (await loadStreetInfrastructure(props.name))['Gesamt']).toLocaleString('de-DE')} Unfälle insgesamt pro Kilometer/Jahr<br>
        <i class="fa-solid fa-equals fa-fw me-2"></i>${await calculateAverage(currentYear.textContent).then(value => value.toLocaleString('de-DE'))} Durchschnitt`;
                    resolve(contents);
                })
            }
    });
}


info.addTo(map);


// get color depending on population density value
async function getColor(state, year) {
    return new Promise(function (resolve, reject) {
        loadStates(state, year, (err, data) => {
            calculateAverage(currentYear.textContent).then(avg => {
                if (data['Insgesamt'] > avg) {
                    resolve('red');
                } else {
                    resolve('green');
                }
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
            const color = await getColor(feature.properties.name, currentYear.textContent);

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

async function updateSlider(value) {
    currentYear.textContent = value;
}

