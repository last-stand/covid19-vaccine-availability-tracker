//  date: "dd-mm-yyy"
//  fee_type: "Paid" / "Free"
//  min_age_limit: "18" / "45"
//  vaccine: "COVAXIN" / "COVISHIELD"
//  pin: [560008, 560007, 560001, 560036, 560029, 560002, 560020, 560060, 560003, 560023, 560018, 560078]
//  district_id: [294]
const filters = {
    pin: [560008, 560007, 560001, 560036, 560029, 560002, 560020, 560060, 560003, 560023, 560018, 560078],
    date: "",
    fee_type: "Free",
    min_age_limit: 18,
    vaccine: "",
    district_id: []
};

module.exports = filters;
