/**
 * Created by kamal on 07/11/17.
 */

var oManager = {
    "name": String,
    "mobile": Number,
    "email": String,
    "empl_id": String,
    "userId": String
};


function validator(v) {
    return v >= 0;
}

function trimNonAlpha(str) {
    return (otherUtil.replaceNonAlphaWithSpace(str)).toUpperCase();
}

var registeredVehicleSchema = new mongoose.Schema({
        "clientId": String,
        "vehicleId": String,
        "vehicle_reg_no": {
            type: String,
            required: true,
            set: trimNonAlpha
        },
        "model": String,
        "manufacturer": String,
        "structure_name": String,
        "make_year": String,
        "length_ft": {
            "type": "Number",
            "validate": [validator, "Invalid length"]
        },
        "width_ft": {
            "type": "Number",
            "validate": [validator, "Invalid width"]
        },
        "height_ft": {
            "type": "Number",
            "validate": [validator, "Invalid width"]
        },
        "refrigeration": {
            "type": "Boolean",
            default: false
        },
        "own": {
            "type": "Boolean",
            default: false
        },

        "capacity_tonne": Number,
        "cc": Number,
        "hp": Number,
        "veh_group_name": String,
        "veh_group": {
            "type": mongoose.Schema.Types.ObjectId,
            "ref": "VehicleGroup"
        },
        "veh_type_name": String,
        "veh_type": {
            "type": mongoose.Schema.Types.ObjectId,
            "ref": "VehicleType"
        },
        "category": String,
        "owner_group": String,
        "supervisor_name": String,
        "supervisor_employee_code": String,
        "supervisor_contact_no": Number,
        "supervisor": {
            "type": mongoose.Schema.Types.ObjectId,
            "ref": "User"
        },
        "driver_name": String,
        "driver_license": String,
        "driver_employee_code": String,
        "driver_contact_no": Number,
        "driver": {
            "type": mongoose.Schema.Types.ObjectId,
            "ref": "Driver"
        },
        "axel": String,
        "wheel_base": Number,
        "tyre_type": String,
        "fuel_type": String,
        "body_type": String,
        "permit_no": String,
        "permit_front_copy": "String",
        "permit_back_copy": "String",
        "permission_cert_issuance_date": Date,
        "permit_expiry_date": Date,
        "fitness_cert_no": String,
        "fitness_cert_front_copy": "String",
        "fitness_cert_back_copy": "String",
        "fitness_cert_issuance_date": Date,
        "fitness_cert_expiry_date": Date,
        "emission_cert_no": String,
        "emission_cert_front_copy": "String",
        "emission_cert_back_copy": "String",
        "emission_cert_issuance_date": Date,
        "emission_cert_expiry_date": Date,
        "insurance_no": "String",
        //"insurance_doc_front_copy":"String",
        //"insurance_doc_back_copy":"String",
        "insurance_issuance_date": Date,
        "insurance_expiry_date": Date,
        "insurance_company": "String",
        "insured_amount": "Number",
        "road_tax_doc_no": String,
        //"road_tax_doc_front_copy" : "String",
        //"road_tax_doc_back_copy" : "String",
        "road_tax_doc_issuance_date": Date,
        "road_tax_doc_expiry_date": Date,
        "rc_book_no": String,
        "rc_book_front_copy": "String",
        "rc_book_back_copy": "String",
        "rc_issuance_date": Date,
        "rc_expiry_date": Date,
        "chassis_no": "String",
        "engine_no": "String",
        "created_by_name": String,
        "created_by_employee_code": String,
        //Documents
        "vehicle_image": String,
        "permit_doc": String,
        "fitness_certificate_doc": String,
        "chassis_trace": String,
        "insurance_doc": String,
        "road_tax_doc": String,
        "rc_book_doc": String,

        "created_by": {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        "status": String,
        "last_modified_by_name": String,
        "last_modified_employee_code": String,
        "last_modified_by": {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        "is_market": {
            type: Boolean,
            default: false
        },
        "vendor_name": String,
        "vendor_mobile": Number,
        "vendor_id": {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorTransport'
        },
        manager: oManager,
        last_known: {
            status: String,
            address: String,
            lat: Number,
            lng: Number,
            datetime: Date,
            trip_no: Number,
            trip_name: String,
        },
        "associationFlag": {
            type: Boolean,
            default: false
        },
        "associated_vehicle": String,
        "sap_id": String
    }
);

module.exports = registeredVehicleSchema;