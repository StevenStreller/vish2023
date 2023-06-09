function loadData(state = null, year = null) {
    let files = [
        "../assets/data/car-accidents-2.json",
        "../assets/data/vehicle-registrations-2.json",
        "../assets/data/street-infrastructure-2.json",
    ];

    let promises = [];

    function loadFile(file) {
        let promise = fetch(file)
            .then(response => response.json())
            .then(response => {
                let customizedResponse = response;
                if (state === null && year !== null) {
                    Object.keys(response['data']).forEach(currentState => {
                        Object.keys(response['data'][currentState]).forEach(currentYear => {
                            if (parseInt(currentYear) !== year) {
                                delete response['data'][currentState][currentYear];
                            }
                        });
                    })
                    customizedResponse = response;
                }else if (state !== null && year !== null) {
                    customizedResponse = response['data'][state][year];
                    Object.keys(response['data']).forEach(currentState => {
                        if (currentState !== state) {
                            delete response['data'][currentState]
                        }
                    })
                    Object.keys(response['data'][state]).forEach(currentYear => {
                        if (parseInt(currentYear) !== year) {
                            delete response['data'][state][currentYear];
                        }
                    })
                } else if (state !== null && year == null) {
                    Object.keys(response['data']).forEach(currentState => {
                        if (currentState !== state) {
                            delete response['data'][currentState];
                        }
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