//  date: "dd-mm-yyy"
//  fee_type: "Paid" / "Free"
//  min_age_limit: "18" / "45"
//  vaccine: "COVAXIN" / "COVISHIELD"
//  pin: [560008, 560007, 560001, 560036, 560029, 560002, 560020, 560060, 560003, 560023, 560018, 560078]
//  district_id: [294]
//  center_id: ["12345"]
//  dose: 1/2
const filters = {
    pin: [],
    date: "",
    fee_type: "",
    min_age_limit: 18,
    vaccine: "",
    district_id: [294],
    dose: 1
};

module.exports = filters;
