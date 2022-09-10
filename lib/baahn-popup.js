"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mav_1 = require("./mav");
const parseDate = (dateString, timeString) => {
    if (!dateString || !timeString)
        return new Date();
    dateString = dateString.substring(dateString.indexOf(',') + 1);
    dateString.trimLeft();
    const [day, month, year] = dateString.split('.').map((s) => parseInt(s, 10));
    const [hour, minute] = timeString.split(':').map((s) => parseInt(s, 10));
    return new Date(year, month - 1, day, hour, minute);
};
const parseQuery = () => {
    var _a, _b;
    const urlParams = new URLSearchParams(document.location.search);
    const searchParams = {
        origin: (_a = urlParams.get('S')) !== null && _a !== void 0 ? _a : '',
        destination: (_b = urlParams.get('Z')) !== null && _b !== void 0 ? _b : '',
        date: parseDate(urlParams.get('date'), urlParams.get('time')),
        isDeparture: urlParams.get('timesel') === 'depart',
    };
    console.log(mav_1.findJourney(searchParams));
};
parseQuery();
const createPopup = () => {
    var _a;
    const parent = (_a = document.getElementById('doc')) !== null && _a !== void 0 ? _a : document.body;
    const popup = document.createElement('div');
    popup.className = 'baahn-wrapper';
    popup.innerHTML = 'POPUP_HTML';
    parent.appendChild(popup);
};
createPopup();
