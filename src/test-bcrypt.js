const bcrypt = require('bcrypt');

async function test() {
  const password = 'admin123';

  const hash = '$2b$10$HP0BzT60Oo/cDAd8FVJMmu04T6oKO6jXyNiC5UISsydzVA49LTZta';

  const result = await bcrypt.compare(password, hash);

  console.log('=========================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('Password matches:', result);
  console.log('=========================');
}

test();
