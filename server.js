const connectToDb = require("./config/db");

const app = require("./app");

const dotenv = require("dotenv");

dotenv.config();

connectToDb()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed ! ",err);
        
    })
