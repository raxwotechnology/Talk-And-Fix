const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { role: 'admin' },
    { 
      $set: { 
        name: 'Talk N Fix Admin',
        email: 'rkdnmadu1993@gmail.com',
        phone: '0768445595',
        password: passwordHash,
        isActive: true
      } 
    },
    { upsert: true }
  );
  console.log('Admin user successfully reset/updated in DB.');
  process.exit();
});
