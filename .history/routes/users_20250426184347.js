const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // تحقق أن البيانات مكتملة
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill all fields.' });
    }

    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // إنشاء مستخدم جديد
    const user = new User({
      name,
      email,
      password: hashedPassword, 
    });

    const saved = await user.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;