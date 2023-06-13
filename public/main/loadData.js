function loadData(state = null, year = null, title = null, options = null) {
    let files = [
        "../assets/data/car-accidents-2.json",
        "../assets/data/vehicle-registrations-2.json",
        "../assets/data/street-infrastructure-2.json",
        "../assets/data/gdp.json",
        "../assets/data/co2.json"
    ];

    let promises = [];

    function loadFile(file) {
        let promise = fetch(file)
            .then(response => response.json())
            .then(response => {
                let customizedResponse = response;

                if (state !== null) {
                    Object.keys(response['data']).forEach(currentState => {
                        if (currentState !== state) {
                            delete response['data'][currentState];
                        }
                    })
                    customizedResponse = response;
                }

                if (year !== null) {
                    Object.keys(response['data']).forEach(currentState => {
                        Object.keys(response['data'][currentState]).forEach(currentYear => {
                            if (parseInt(currentYear) !== year) {
                                delete response['data'][currentState][currentYear];
                            }
                        });
                    })
                    customizedResponse = response;
                }

                if (title !== null) {
                    if (title !== response['title']) {
                        return {};
                    }
                }

                if (options !== null) {
                    Object.keys(response['data']).forEach(currentState => {
                        Object.keys(response['data'][currentState]).forEach(currentYear => {
                            Object.keys(response['data'][currentState][currentYear]).forEach(key => {
                                if (!options.includes(key)) {
                                    delete response['data'][currentState][currentYear][key];
                                }

                            })

                        });
                    })
                    customizedResponse = response;
                }

                return customizedResponse;
            }).catch(error => {
                console.error('Fehler beim Laden der JSON-Datei:', error);
            });

        promises.push(promise);
    }

    for (let i = 0; i < files.length; i++) {
        loadFile(files[i]);
    }

    return Promise.all(promises);
}
