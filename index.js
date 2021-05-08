const fetch = require("node-fetch");
const { exec } = require("child_process");
const fs = require('fs');
let attempt = 0;

//  fee_type: Paid/Free
//  min_age_limit: 18/45
//  vaccine: COVAXIN/COVISHIELD
const filters = { fee_type: "Free", min_age_limit: 45};

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

async function say(text) {
    exec(`spd-say "${text}" -i 100 -t male3 -r -20 -w`, (error, stdout, stderr) => {
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

async function subscribe() {
    let today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    let response = await fetch(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=294&date=${today}`, {
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
            await playAlertSound();
            await new Promise(resolve => setTimeout(resolve, 4000));
            console.log(JSON.stringify(availableCenters, null, 2));
        } else {
            console.log('Attempt: ', ++attempt);
            console.log('No available centers');
        }
        // Call subscribe() again to get the next message after 4 seconds
        await new Promise(resolve => setTimeout(resolve, 4000));
        await subscribe();
    } else {
        console.log("STATUS: " + response.statusText);
        console.log("ERROR: " + response);
        say(`Server error, ${response.statusText}`);
        // Status is not 200 OK,
        // reconnect after 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        await subscribe();
    }
}

subscribe();