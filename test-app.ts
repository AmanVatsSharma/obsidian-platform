import 'reflect-metadata';
process.env.SCHEMA_GEN = 'true';
import('/home/amansharma/Desktop/DevOPS/Obsidian/path-register').catch(() => {});

async function main() {
  const { NestFactory } = await import('@nestjs/core');
  const APP_MODULE = require('./apps/backend/src/app.module').AppModule;
  console.log('Module name:', APP_MODULE.name);
  
  try {
    const app = await NestFactory.createApplicationContext(APP_MODULE, { logger: ['error', 'warn'] });
    console.log('App created OK');
    await app.close();
  } catch (err) {
    console.log('msg:', (err as any).message.split('\n')[0]);
    console.log('has app:', 'app' in err);
    console.log('app:', (err as any).app?.constructor?.name);
    console.log('context:', (err as any).context?.constructor?.name);
  }
}

main().catch(e => console.error('Fatal:', e.message));
