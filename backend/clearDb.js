const mongoose = require('mongoose');
require('dotenv').config();

const clearDb = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Ensure we strictly connect to the specific DB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log(`Connected to database: ${mongoose.connection.name}`);

        if (mongoose.connection.name !== 'dailyquiz') {
            console.error('SAFETY CHECK FAILED: specific database name does not match "dailyquiz". Aborting.');
            process.exit(1);
        }

        console.log('Dropping database...');
        await mongoose.connection.dropDatabase();

        console.log('Database cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
};

clearDb();
