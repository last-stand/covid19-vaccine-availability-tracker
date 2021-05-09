# Covid-19 Vaccine Availability Tracker

This app is based on Co-WIN data. It is completely console based app which tracks vaccine availability and notifies using sound and prints data on console as soon as gets available session. By default this app tracks vaccine availability for BBMP (Bengaluru) for current date.

## Setup and Run

* Run `npm install` to install node dependencies
* Run `npm start` to run the app.
* You also need __SoX__ to play notification sound. First install it using this command on terminal,

     ```sh
     $ sudo apt-get install sox
     ```
    For documentation refer this link http://sox.sourceforge.net/sox.html

## Input Filters

__Before running the app__, provide input like PIN code, date, vaccine type, fee type and minimum age limit in `filter.js` file.



> __Note:__
> If you don't need sound notification just comment `playAlertSound()` function call in `index.js`. Still you will get data on console.