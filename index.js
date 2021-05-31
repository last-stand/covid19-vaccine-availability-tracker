const fetch = require("node-fetch");
const { exec } = require("child_process");
var prettyjson = require('prettyjson');
const fs = require('fs');
const filters = require('./filter');
const { pin } = require("./filter");
let attempt = 0;

function getAvailableVaccineData(data) {
    const centers = data.centers || [];
    let centersBasedOnFeeType = centers; 
    if (filters.fee_type) {
        centersBasedOnFeeType = centers.filter(center => {
            return (center.fee_type === filters.fee_type);
        });
    }

    if(filters.center_id) {
        centersBasedOnFeeType = filterByCenterId(centersBasedOnFeeType);
    }

    let availableCenters = filterByAvailableCapacityAndAgeLimit(centersBasedOnFeeType);

    if(filters.vaccine) {
        availableCenters = filterByVaccineType(availableCenters);
    }

    const centersWithFilteredSessions = removeUnwantedSessions(availableCenters);
    return centersWithFilteredSessions;
}

function filterByAvailableCapacityAndAgeLimit(centers) {
    return centers.filter(center => {
        if (center.sessions && center.sessions.length > 0) {
            return center.sessions.some(session => {
                if (filters.min_age_limit) {
                    if(filters.dose == 1) {
                        return session.min_age_limit === filters.min_age_limit && session.available_capacity_dose1 > 0;
                    }
                    if(filters.dose == 2) {
                        return session.min_age_limit === filters.min_age_limit && session.available_capacity_dose2 > 0;
                    }
                    return session.min_age_limit === filters.min_age_limit && session.available_capacity_dose1 > 0 || session.available_capacity_dose2 > 0;
                }
                return session.available_capacity_dose1 > 0 || session.available_capacity_dose2 > 0;
            });
        }
        return false;
    });
}

function filterByVaccineType(centers) {
    return centers.filter(center => {
        if (center.sessions && center.sessions.length > 0) {
            return center.sessions.some(session => {
                return session.vaccine === filters.vaccine;
            });
        }
        return false;
    });
}

function filterByCenterId(centers) {
    return centers.filter(center => {
        return (center.center_id === filters.center_id);
    });
}


function removeUnwantedSessions(centers) {
    return centers.map(center => {
        let centerClone = JSON.parse(JSON.stringify(center));
        centerClone.sessions = center.sessions.filter(session => {
            if(filters.dose == 1) {
                return session.available_capacity_dose1 > 0;
            }
            if(filters.dose == 2) {
                return session.available_capacity_dose2 > 0;
            }
            return session.available_capacity_dose1 > 0 || session.available_capacity_dose2 > 0;
        });
        return centerClone;
    });
}

async function playAlertSound() {
    exec(`play ${__dirname}/assets/sound/alert.mp3 repeat 1`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            // console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function getUrls() {
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const date = filters.date ? filters.date : today;
    if(filters.pin && filters.pin.length) {
        return filters.pin.map((code) => { 
            return `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=${code}&date=${date}`;
        });
    }
    if(filters.district_id && filters.district_id.length) {
        return filters.district_id.map((id) => { 
            return `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${id}&date=${date}`;
        });
    }
}

async function getAllData(urls) {
    try {
        let options = {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
                'Cache-Control': 'no-store'
            }
        }
        const responses = await Promise.all(
            urls.map(
                url =>
                    fetch(url, options).then(
                        (response) => {
                            if (response.status == 200) {
                                return response.json();
                            } else {
                                console.error(`\nSTATUS: ${response.statusText}, CODE: ${response.status}`);
                                console.error(`URL: ${response.url}`)
                                //console.error("ERROR: " + response.json());
                                return false;
                            }
                        }
                    )
            )
        );

        return responses;

    } catch (error) {
        console.log('ERROR: ', error)
    }
}

async function subscribe() {
    while(true) {
        try {
            const urls = getUrls() || [];
            if(urls.length === 0) {
                console.error('\x1b[41m', 'ERROR: Please provide either PIN code or District id in "filters.js" file to search','\x1b[0m');
                break;
            }
            console.log('\x1b[33m', `\n🤞 Attempt: ${++attempt}`, '\x1b[0m');
            let responses = await getAllData(urls);

            const finalAvailableCenters = responses.filter(Boolean).map((data) => {
                const availableCenters = getAvailableVaccineData(data);
                if(availableCenters.length > 0) {
                    return availableCenters;
                }
            }).filter(Boolean);

            if(finalAvailableCenters.length > 0) {
                await prettyPrint(finalAvailableCenters);
                await playAlertSound();
                await new Promise(resolve => setTimeout(resolve, 4000));
            } else {
                console.log(`\n😷 No available centers at ${new Date().toLocaleTimeString()}`);
            }
        } catch(err) {
            console.error(err);
        }
        // reconnect after 4 seconds
        await new Promise(resolve => setTimeout(resolve, 4000));
    }
}

async function prettyPrint(availableCenters) {
    const prettyOptions = {
        keysColor: 'green',
        dashColor: 'magenta',
        numberColor: 'cyan',
        stringColor: 'yellow'
    };
    availableCenters.forEach((center) => {
        console.log('   ╭────────────────────────────────────────────────────────────────────────────────────────────────────────────╮');
        console.log(`     ${prettyjson.render(center, prettyOptions)}`);
        console.log('   ╰────────────────────────────────────────────────────────────────────────────────────────────────────────────╯')
        console.log('\x1b[34m', '💉   💉   💉   💉   💉   💉   💉   💉   💉   💉   💉', '\x1b[0m');
    });
}

subscribe();
