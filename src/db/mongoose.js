const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config();

const {
    ENVIRONMENT,
    ATLAS_URI,
    LOCAL_MONGO_DB_URL
} = process.env;
const connectToDatabase = () => {
	const dbUrl = ENVIRONMENT === 'production' ? ATLAS_URI : LOCAL_MONGO_DB_URL;

    mongoose.connect(dbUrl, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    });

    console.log('Database connected successfully');

    mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
};
//,
//mongo:
module.exports= connectToDatabase;
