import 'reflect-metadata';
process.env.SCHEMA_GEN = 'true';
import('/home/amansharma/Desktop/DevOPS/Obsidian/path-register').catch(() => {});

const { NestFactory } = await import('@nestjs/core');
const APP_MODULE = require('./apps/backend/src/app.module').AppModule;

try {
  const app = await NestFactory.createApplicationContext(APP_MODULE, { logger: ['error', 'warn'] });
  console.log('App created OK');
  await app.close();
} catch (err: any) {
  console.log('Error keys:', Object.keys(err));
  console.log('Has app?:', 'app' in err);
  console.log('app value:', typeof err.app);
  console.log('msg:', err.message.split('\n')[0]);
}
