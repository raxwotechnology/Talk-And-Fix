const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@mobilehub.com' },
    { $set: { password: passwordHash } }
  );
  if (result.modifiedCount > 0) {
    console.log('Admin password successfully reset to: admin123');
  } else {
    console.log('Admin user not found or password was already admin123');
  }
  process.exit();
});
