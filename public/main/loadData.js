/**
 * This function is responsible for fetching the data, optionally filtering it, and outputting it accordingly.
 * By default, all filters are inactive and can be triggered by passing the appropriate parameters.
 *
 * @param state If you enter the name of the federal state (for example Hamburg), only data related to Hamburg will be displayed.
 * @param year Through the year it is possible to obtain data only from a specific year
 * @param title If you want to have only a certain file, you can pass the title. Here only files are displayed where the passed title corresponds to the title from the JSON file.
 * @param options If you want to have only a certain value from a file, you can pass the option.
 * @returns {Promise<Awaited<unknown>[]>}
 */
function loadData(state = null, year = null, title = null, options = null) {
    let files = [
        "../assets/data/car-accidents.json",
        "../assets/data/vehicle-registrations.json",
        "../assets/data/street-infrastructure.json",
        "../assets/data/gdp.json",
        "../assets/data/co2.json",
        "../assets/data/population.json",
        "../assets/data/area.json"
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
                console.error('Error loading the JSON file:', error);
            });

        promises.push(promise);
    }

    for (let i = 0; i < files.length; i++) {
        loadFile(files[i]);
    }

    return Promise.all(promises);
}
