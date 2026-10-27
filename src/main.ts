import 'reflect-metadata';
import { startSystem } from './bootstrap';
import { runtime } from './runtime';

async function main(): Promise<void> {
  const port = Number(process.env.PORT) || 3000;
  const system = await startSystem({ gatewayPort: port });
  console.log(`Розумна книгарня: клієнт спілкується лише з API Gateway ${system.gatewayUrl}`);
  console.log('Мікросервіси:');
  for (const [name, url] of Object.entries(runtime.urls)) console.log(`  ${name}: ${url}`);
  console.log('Облікові записи:');
  console.log('  client@library.test / client123');
  console.log('  manager@library.test / manager123');
  console.log('  warehouse@library.test / warehouse123');
  console.log('  admin@library.test / admin123');
  console.log(`Платіжний адаптер: ${runtime.paymentProvider}`);
}

void main();
