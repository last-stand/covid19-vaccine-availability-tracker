# Covid-19 Vaccine Availability Tracker For BBMP (Bengaluru)

This app is based on Co-WIN data. It is completely console based app which tracks vaccine availability and notifies using sound and prints data on console as soon as gets available session.

## Setup and Run

* Run `npm install` to install node dependencies
* Run `npm start` to run the app.
* You also need __spd-say__ and __ffplay__ sound libraries to get sound notifications. For instructions refer the below link
    * https://command-not-found.com/spd-say
    * https://command-not-found.com/ffplay

> __Note:__
> If you don't need sound notification just comment `playAlertSound()` and `say()` function calls in `index.js`. Still you will get data on console.