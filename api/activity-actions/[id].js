import { getDatabase } from '../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const db = await getDatabase();

  try {
    // GET - fetch actions by userId
    if (req.method === 'GET') {
      const actions = await db.collection('activity_actions')
        .find({ userId: id })
        .sort({ createdAt: -1 })
        .toArray();
      
      const formattedActions = actions.map(action => ({
        ...action,
        id: action._id.toString(),
        _id: undefined
      }));
      
      return res.json(formattedActions);
    }

    // PUT - update action by id
    if (req.method === 'PUT') {
      const updates = req.body;
      const updateDoc = { $set: updates };
      
      const result = await db.collection('activity_actions').findOneAndUpdate(
        { _id: new ObjectId(id) },
        updateDoc,
        { returnDocument: 'after' }
      );
      
      if (!result.value) {
        return res.status(404).json({ error: 'Activity action not found' });
      }
      
      return res.json({
        ...result.value,
        id: result.value._id.toString(),
        _id: undefined
      });
    }

    // DELETE - delete action by id
    if (req.method === 'DELETE') {
      const result = await db.collection('activity_actions').deleteOne({ 
        _id: new ObjectId(id) 
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Activity action not found' });
      }
      
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Activity action error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
