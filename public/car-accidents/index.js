const map = L.map('map').setView([51.5, 9], 6);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// control that shows state info on hover
const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    this.update();
    return this._div;
};

info.update = async function (props) {


    const contents = props ? `<b>${props.name}</b><br>
        <i class="fa-solid fa-city fa-fw me-2"></i>${(await load())[props.name][2012]['innerorts'].toLocaleString('de-DE')} Unfälle innerots<br>
        <i class="fa-solid fa-tree-city fa-fw me-2"></i>${(await load())[props.name][2012]['außerorts (ohne Autobahnen)'].toLocaleString('de-DE')} Unfälle außerorts ohne Autobahn<br>
        <i class="fa-solid fa-road fa-fw me-2"></i>${(await load())[props.name][2012]['auf Autobahnen'].toLocaleString('de-DE')} Autbahnunfälle<br>
        <i class="fa-solid fa-equals fa-fw me-2"></i>${(await load())[props.name][2012]['Insgesamt'].toLocaleString('de-DE')} Unfälle insgesamt` : 'Bewegen Sie den Mauszeiger über ein Bundesland';
    this._div.innerHTML = `<h4 class="text-center">🇩🇪 2012</h4>${contents}`;

};


info.addTo(map);


// get color depending on population density value
async function getColor(d) {
    calculateAverage(2012).then(value => {
        console.log(value);
    })


    return d > 1000 ? '#800026' :
        d > 500 ? '#BD0026' :
            d > 200 ? '#E31A1C' :
                d > 100 ? '#FC4E2A' :
                    d > 50 ? '#FD8D3C' :
                        d > 20 ? '#FEB24C' :
                            d > 10 ? '#FED976' : '#FFEDA0';
}

function style(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties.name)
    };
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
     info.update(layer.feature.properties);
}

/* global statesData */
const geojson = L.geoJson(statesData, {
    style,
    onEachFeature
}).addTo(map);

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

const legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    const div = L.DomUtil.create('div', 'bg-light p-2 rounded-3');
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
    const labels = [];
    let from, to;

    for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(`<i class="pl-3 pe-3 me-2" style="background:${getColor(from + 1)}"></i> ${from}${to ? `&ndash;${to}` : '+'}`);
    }

    div.innerHTML = labels.join('<br>');
    return div;
};

legend.addTo(map);

function load(state, year, callback) {
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

async function calculateAverage(year) {
    let average;

    load(null, year, (err, data) => {
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

        return average = sum / count;
    });

}

