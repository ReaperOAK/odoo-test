const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = ['users', 'listings', 'orders', 'payments', 'reservations', 'payouts'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const indexes = await collection.listIndexes().toArray();
        
        console.log(`\n${collectionName} indexes:`, indexes.map(i => i.name));
        
        // Drop all indexes except _id_ (which can't be dropped)
        for (const index of indexes) {
          if (index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
              console.log(`Dropped index: ${index.name}`);
            } catch (error) {
              console.log(`Could not drop ${index.name}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.log(`Collection ${collectionName} does not exist or error:`, error.message);
      }
    }

    console.log('\nAll custom indexes dropped. Mongoose will recreate them on next startup.');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes();
