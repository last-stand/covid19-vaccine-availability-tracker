const fetch = require("node-fetch");
const { exec } = require("child_process");
var prettyjson = require('prettyjson');
const fs = require('fs');
const filters = require('./filter');
let attempt = 0;

function getAvailableVaccineData(data) {
    const centers = data.centers || [];
    let centersBasedOnFeeType = centers; 
    if (filters.fee_type) {
         centersBasedOnFeeType = centers.filter(center => {
            return (center.fee_type === filters.fee_type);
        });
    }

    let availableCenters = centersBasedOnFeeType.filter(center => {
        if(center.sessions && center.sessions.length > 0) {
            return center.sessions.some(session => {
                return session.available_capacity > 0;
            })
        }
    });

    if (filters.min_age_limit) {
        availableCenters = availableCenters.filter(center => {
            if(center.sessions && center.sessions.length > 0) {
                return center.sessions.some(session => {
                    return session.min_age_limit === filters.min_age_limit;
                })
            }
        });
    }

    if(filters.vaccine) {
        availableCenters = availableCenters.filter(center => {
            if(center.sessions && center.sessions.length > 0) {
                return center.sessions.some(session => {
                        return session.vaccine === filters.vaccine;
                })
            }
        });
    }

    const centersWithFilteredSessions = removeUnwantedSessions(availableCenters);
    return centersWithFilteredSessions;
}

function removeUnwantedSessions(centers) {
    return centers.map(center => {
        let centerClone = JSON.parse(JSON.stringify(center));
        centerClone.sessions = center.sessions.filter(session => {
            return session.available_capacity > 0;
        });
        return centerClone;
    });
}

async function playAlertSound() {
    exec(`ffplay -loop 2 -autoexit ${__dirname}/assets/sound/alert.mp3`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function getUrl() {
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const date = filters.date ? filters.date : today;
    if(filters.pin) {
        return `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${filters.pin}&date=${date}`;
    }
    return `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=294&date=${date}`;
}

async function subscribe() {
    while(true) {
        try {
            let response = await fetch(getUrl(), {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
                }
            });

            if (response.status == 200) {
                // Get and show the message
                const data = await response.json();
                const availableCenters = getAvailableVaccineData(data);
                if(availableCenters.length > 0) {
                    const prettyOptions =  {
                        keysColor: 'green',
                        dashColor: 'magenta',
                        numberColor: 'cyan',
                        stringColor: 'yellow'
                    }
                    console.log(prettyjson.render(availableCenters, prettyOptions));
                    await playAlertSound();
                    await new Promise(resolve => setTimeout(resolve, 4000));
                } else {
                    console.log('Attempt: ', ++attempt);
                    console.log(`No available centers at ${new Date().toLocaleTimeString()}`);
                }
            } else {
                console.error(`STATUS: ${response.statusText}, CODE: ${response.status}`);
                console.error(`URL: ${response.url}`)
                console.error("ERROR: " + response.json());
            }
        } catch(err) {
            console.error(err);
        }
        // reconnect after 4 seconds
        await new Promise(resolve => setTimeout(resolve, 4000));
    }
}

subscribe();