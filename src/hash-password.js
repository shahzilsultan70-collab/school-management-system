const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'admin123';

  const hash = await bcrypt.hash(password, 10);

  console.log('Original password:', password);
  console.log('Bcrypt hash:', hash);
}

hashPassword();
