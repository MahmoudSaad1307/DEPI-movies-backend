const express = require('express');
const router = express.Router();
const UserList = require('../models/UserList');
// const jwt = require('jsonwebtoken'); 
// const verifyToken = require('../auth');


router.post('/',async(req,res)=>{

  try {
    const { userId, title, movies } = req.body;

    if (!userId || !title ) {
      return res.status(400).json({ error: 'UserId, title, are required' });
    }

    const newList = new UserList({
      userId,
      title,
      movies,
    });

    const savedList = await newList.save();
    res.json(savedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}


);

router.get('/my-lists', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const lists = await UserList.find({ userId });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific list by ID (must belong to the user)
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const list = await UserList.findOne({ _id: req.params.id, userId });
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a specific list by ID
router.put('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const updatedList = await UserList.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );

    if (!updatedList) return res.status(404).json({ error: 'List not found or not authorized' });

    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a specific list by ID
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const deletedList = await UserList.findOneAndDelete({ _id: req.params.id, userId });
    if (!deletedList) return res.status(404).json({ error: 'List not found or not authorized' });

    res.json({ message: 'List deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router