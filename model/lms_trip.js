let oManager = {
	"name": String,
	"mobile": Number,
	"email": String,
	"empl_id": String,
	"userId": String
};
let oTripStatus = {
	"location": {
		"lat": Number,
		"lng": Number
	},
	time: Date,
	status: {type: Boolean, default: false}
};

let oCity = {
	c: String,
	d: String,
	st: String,
	st_s:String,
	p: Number,
	cnt_s:String,
	cnt:String,
	address_components:{
		street_number: String,//'short_name'
		route: String,//'long_name'
		sublocality_level_2: String,//'long_name'
		sublocality_level_3: String,//'long_name'
		sublocality_level_1: String,//'long_name'
		sublocality: String,//'long_name'
		locality: String,//'long_name'
		administrative_area_level_2: String,//'long_name'
		administrative_area_level_1: String,//'short_name',
		administrative_area_level_1_f: String,//'long_name'
		country : String,//'short_name',
		country_f : String,//'long_name',
		postal_code: Number//'short_name'
	},
	formatted_address : String,
	geometry : {
		location:{
			lat: Number,
			lng:Number
		}
	},
	place_id:String,
	types:[String],
	url : String,
	vicinity:String
};

let tripSchema = new mongoose.Schema(
	{
		"clientId": {
			"type":String,
			"required":true
		},
		entityName: {
			type: String,
			enum: ['TRIP'],
			default: 'TRIP'
		},
		branch: String,
		tripId: String,
		trip_no: {
			type: Number,
			unique: true
		},
		trip_running_status: {
			type: String,
			enum: ["Trip not started", "Trip started", "Arrived at source","Loaded","In Journey",
				"Arrived at destination", "Unloaded" , "Trip ended", "Trip cancelled"]
		},
		route: {
			route_id: String,
			route_type: {
				type: String,
				enum: ["One Way","Two Way"]
			},
			route_distance: Number,
			route_name: String,
			rates: {
				vehicle_type: String,
				vehicle_group_name: String,
				booking_type: String,
				rate: {
					price_per_unit: Number,
					price_per_mt: Number,
					price_per_trip: Number,
					vehicle_rate: Number,
					min_payable_mt: Number,
					"detention_rate_1-48": Number,
					"detention_rate_48-96": Number,
					"detention_rate_above_96": Number
				},
				"allot": {
					"diesel": Number,
					"cash": Number,
					"toll_tax": Number,
					"extra_expenses": Number,
					"penalty": Number,
				},
				"up_time": {
					"days": Number,
					"hours": Number
				},
				"down_time": {
					"days": Number,
					"hours": Number
				},
				"loading":{
					"days":Number,
					"hours":Number
				},
				"unloading":{
					"days":Number,
					"hours":Number
				}
			}
		},
		diesel_vendors: [{
			vendor_name: String,
			vendor_id: String,
			station_address: String,
			additional_diesel: {
				type: Boolean,
				default: false
			},
			diesel_date: {'type': Date},
			station_id: String,
			fuel_type: String,
			rate: Number,
			litres: Number,
			amount: Number
		}],
		ownGR: {type: Boolean, default: false},
		gr_type: {
			type: String,
			enum: ["Own", "Market","Centralized"]
		},
		isDieselAlloted: {type: Boolean, default: false},
		total_diesel_alloted: Number,
		total_diesel_cost: Number,
		additional_cash_alloted: Number,
		actual_cash_alloted: Number,
		remarks: String,
		created_at: {'type': Date},
		created_by: String,
		last_modified: {'type': Date},
		last_modified_by: String,
		trip_type: String,
		trip_stage: {type: Boolean, default: false},
		diesel_stage: {type: Boolean, default: true},
		//gr_acknowledge_stage : {type:Boolean,default:false},
		vehicle_type: String,
		vehicle_type_id: String,
		capacity: {
			no_of_containers: Number,
			weight: Number
		},
		vehicle_no: String,
		m_vehicle_no: String,
		isMarketVehicle: {type: Boolean, default: false},
		vendor_payment: {
			advance: Number,
			toPay: Number
		},
		vehicle: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'RegisteredVehicle'
		},
		trip_expense: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'TripExpense'
		},
		driver: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Driver'
		},
		driver_name: String,
		driver_sap_id: String,
		driver_contact: Number,
		driver_license: String,
		driver_employee_code: String,

		//trip manager
		trip_manager: oManager,
		vendor_name: String,
		vendor_contact: Number,
		vendor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'VendorTransport'
		},
		isMultiBooking: {type: Boolean, default: false},
		isMultiCustomer: {type: Boolean, default: false},
		allocation_date: Date,

		//trip status objects//////////
		trip_start: {
			user: String,
			user_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			address: oCity,
			time: Date,
			status: {type: Boolean, default: false}
		},
		actual_trip_start : Date,
		actual_trip_cancel : Date,
		actual_trip_end : Date,
		trip_cancel: {
			user: String,
			user_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			time: Date,
			status: {type: Boolean, default: false},
			reason: String,
			remark: String
		},
		trip_status: {
			type: String,
			default: "Not Started"
		},
		trip_status_update_time: Date,
		vehicle_running_status: String,
		trip_end: {
			user: String,
			user_id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			address: oCity,
			time: Date,
			status: {type: Boolean, default: false}
		},
		gr: [{
			booking_info: [{
				item_no: Number,
				payment_basis: String,
				booking_no: Number,
				booking_type: String,
				boe_no: String,
				branch: String,
				booking_id: String,
				customer_id: String,
				sap_id: String,
				customer_name: String,

				contract_name: String,
				container_no: String,
				container_type: String,
				size: String,
				weight: {
					value: Number,
					unit: String
				},
				rate: Number,
				freight: Number,
				loading_yard: {
					_id: String,
					name: String
				},
				offloading_yard: {
					_id: String,
					name: String
				},
				value: Number,
				documents: [{
					name: String,
					identity: String
				}],
				deleted: {type: Boolean, default: false},
				material_group: String,
				material_type: String
			}],
			payment_basis: String,
			customer_name: String,
			customer_id: String,
			sap_id: String,
			cha_id: String,
			cha_name: String,
			shipping_line_id: String,
			shipping_line_name: String,
			consigner_id: String,
			consigner_name: String,

			factory_invoice_number : Number,
			factory_invoice_value : Number,
			factory_invoice_date : {'type': Date},

			boe_no : String,
			boe_value : Number,
			boe_date : {'type': Date},

			consignee_id: String,
			consignee_name: String,
			billing_party_id: String,
			pending_gr_remarks: String,
			billing_party_name: String,
			billing_party_address: String,
			is_gstin_registered: {
				type: Boolean,
				required: true
			},
			gstin_state_code: String,
			billing_party_gstin_no: String,
			material_group: String,
			material_type: String,
			gr_id: Number,
			gr_no: String,
			gr_date: Date,
			gr_charges: Number,
			gr_stage: {type: Boolean, default: true},
			freight: Number,
			rate: Number,
			total: Number,
			weight: Number,
			fuel_price_hike: Number,
			weightman_charges: Number,
			loading_charges: Number,
			unloading_charges: Number,
			//munshiyana_charges : Number,
			other_charges: Number,
			builty: String,
			ack_status: {type: Boolean, default: false},
			ack_stage: {type: Boolean, default: true},
			gr_ack_exp_date: Date,
			place: String,
			branch: String,
			courier_name: String,
			courier_id: String,
			courier_office: String,
			courier_office_id: String,
			courier_date: Date,
			receiving_date: Date,
			receiving_person: String,
			driver_name: String,
			driver_license: String,
			driver_employee_code: String,
			driver_id: String,
			branch_id: String,
			empl_name: String,
			empl_id: String,
			loading_point: {
				"name": String,
				"address": String,
				"contact_person_name": String,
				"contact_person_number": Number,
				"contact_person_email": String,
				"location": {
					"lat": Number,
					"lng": Number
				},
			},
			unloading_point: {
				"name": String,
				"address": String,
				"contact_person_name": String,
				"contact_person_number": Number,
				"contact_person_email": String,
				"location": {
					"lat": Number,
					"lng": Number
				},
			},
			arrival_loading: oTripStatus,
			loading_start: oTripStatus,
			loading_end: oTripStatus,
			arrival_unloading: oTripStatus,
			unloading_start: oTripStatus,
			unloading_end: oTripStatus,
			document_checklist: [String],
		}],
		trip_history: [{
			title: String,
			address: String,
			person: String,
			reason: String,
			time: String,
			customer: String,
			location: {
				"lat": Number,
				"lng": Number
			}
		}],
		mob_device_imei: Number,
		lastTripD:{
			trip_id:{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'VendorTransport'
			},
			trip_no: Number,
			trip_start: {
				user: String,
				user_id: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				},
				address: oCity,
				time: Date,
				status: {type: Boolean, default: false}
			},
			trip_end: {
				user: String,
				user_id: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				},
				address: oCity,
				time: Date,
				status: {type: Boolean, default: false}
			}
		},
		"owner_group":String,
		deleted: {type: Boolean, default: false},
		"gTrip_id":String,
		gpsData:{}
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "last_modified_at"
		}
	}
);

module.export = tripSchema;
