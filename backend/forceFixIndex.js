const mongoose = require('mongoose');
require('dotenv').config();

async function forceFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB.');

        const collection = mongoose.connection.collection('attempts');

        // List indexes to be sure
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const targetIndex = indexes.find(i => i.name === 'userId_1_date_1');
        if (targetIndex) {
            console.log('Found target index. Dropping...');
            await collection.dropIndex('userId_1_date_1');
            console.log('Dropped userId_1_date_1 successfully.');
        } else {
            console.log('Index userId_1_date_1 not found.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        console.log('Done. Exiting.');
        process.exit();
    }
}

forceFix();
