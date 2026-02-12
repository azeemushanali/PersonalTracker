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
    const actionData = req.body;
    const db = await getDatabase();
    
    const newAction = {
      ...actionData,
      status: actionData.status || 'Pending',
      completedAt: null,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.collection('resource_actions').insertOne(newAction);
    
    res.json({ 
      ...newAction, 
      id: result.insertedId.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error('Add resource action error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
