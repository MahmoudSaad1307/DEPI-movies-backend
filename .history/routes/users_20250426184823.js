const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // تحقق إن الايميل مش مستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // تشفير الباسورد
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // إنشاء المستخدم
    const user = new User({ name, email, password: hashedPassword });
    const savedUser = await user.save();

    const userWithoutPassword = savedUser.toObject();
    delete userWithoutPassword.password;

    res.json(userWithoutPassword);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
})

router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;