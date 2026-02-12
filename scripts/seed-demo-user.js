import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'actionflow';

async function seedDemoUser() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Check if demo user already exists
    const existingUser = await usersCollection.findOne({ email: 'demo@actionflow.com' });
    
    if (existingUser) {
      console.log('✅ Demo user already exists!');
      console.log('   Email: demo@actionflow.com');
      console.log('   Password: demo123');
      return;
    }
    
    // Create demo user
    const demoUser = {
      email: 'demo@actionflow.com',
      password: 'demo123',
      name: 'Demo User',
      createdAt: new Date().toISOString()
    };
    
    await usersCollection.insertOne(demoUser);
    console.log('\n✅ Demo user created successfully!');
    console.log('   Email: demo@actionflow.com');
    console.log('   Password: demo123');
    console.log('\n📝 You can now log in with these credentials');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

seedDemoUser();
