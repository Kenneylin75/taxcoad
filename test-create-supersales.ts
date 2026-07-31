import { createSuperSalesAccount } from './src/app/actions';

async function test() {
  const result = await createSuperSalesAccount({
    name: 'Test Super Sales',
    account: 'testsale123',
    password: 'password123',
    phone: '0912345678'
  });
  console.log(result);
}

test();
