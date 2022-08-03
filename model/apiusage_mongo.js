let apiUsageSchema = new mongoose.Schema(
    {
        "userId": {
            "type":String,
            "required":true
        },
        "ipAddress": {
            "type":String,
            "required":true,
            "unique":true
        },
        "total": {
            type:Number,
            default:0
        },
        "daily": {
            type:Number,
            default:0
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "last_modified_at"
        }
    }
);

module.exports =  apiUsageSchema;

