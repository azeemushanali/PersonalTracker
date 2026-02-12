import { getDatabase } from '../../lib/mongodb.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    // Create new user
    const result = await db.collection('users').insertOne({
      email,
      password,
      name,
      createdAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      user: { 
        id: result.insertedId.toString(), 
        email, 
        name 
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
