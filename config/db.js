const mongoose = require("mongoose");

const connectToDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection Failed: ",error);
        process.exit(1);
        
    }
}

module.exports = connectToDb;