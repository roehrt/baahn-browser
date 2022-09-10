"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fast_fuzzy_1 = require("fast-fuzzy");
const searchApi = 'https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetOfferRequest';
const stationApi = 'https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetStationList';
// make post request to api with data
const request = (url, data) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json();
});
const defaultParams = {
    offerkind: '4',
    passangers: [{
            passengerId: 0,
            passengerCount: 1,
            customerTypeKey: '52_018-199',
            customerDiscountsKeys: [],
        }],
    isOneWayTicket: true,
    isSupplementaryTicketsOnly: false,
    isOfDetailedSearch: false,
    eszkozSzamok: [],
    selectedServices: ['50'],
    selectedSearchServices: ['BUDAPESTI_HELYI_KOZLEKEDESSEL'],
};
const loadStationList = () => __awaiter(void 0, void 0, void 0, function* () {
    let stationList = yield browser.storage.local.get('stationList');
    if (!stationList) {
        const response = yield request(stationApi, {});
        stationList = response.stationList;
        browser.storage.local.set({ stationList });
    }
    return stationList;
});
const findStationCode = (stationName) => __awaiter(void 0, void 0, void 0, function* () {
    const stationList = yield loadStationList();
    return fast_fuzzy_1.search(stationName, stationList, { keySelector: (station) => station.name })[0].code;
});
const transformQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return (Object.assign(Object.assign({}, defaultParams), { startStationCode: yield findStationCode(params.origin), innerStationsCodes: [{
                stationCode: yield findStationCode(params.destination),
                durationOfStay: 0,
            }], endStationCode: '005510009', travelStartDate: params.date.toISOString().split('T')[0], travelReturnDate: '', isTravelEndTime: !params.isDeparture }));
});
/*
const parseResponse = (response: any) => {

};
 */
// eslint-disable-next-line import/prefer-default-export
exports.findJourney = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield transformQuery(params);
    console.log(JSON.stringify(data));
    // const response = await request(searchApi, data);
    // return response;
});
