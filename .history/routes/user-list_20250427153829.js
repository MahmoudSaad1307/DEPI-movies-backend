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



module.exports = router