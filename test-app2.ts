import 'reflect-metadata';
process.env.SCHEMA_GEN = 'true';
import('/home/amansharma/Desktop/DevOPS/Obsidian/path-register').catch(() => {});

const fs = require('fs');

async function main() {
  const { NestFactory } = await import('@nestjs/core');
  const APP_MODULE = require('./apps/backend/src/app.module').AppModule;
  fs.writeFileSync('/tmp/test-out.txt', 'Module:' + APP_MODULE.name + '\n');
  fs.writeFileSync('/tmp/test-out.txt', 'SCHEMA_GEN:' + process.env.SCHEMA_GEN + '\n', { flag: 'a' });
  
  try {
    const app = await NestFactory.createApplicationContext(APP_MODULE, { logger: ['error', 'warn'] });
    fs.writeFileSync('/tmp/test-out.txt', 'App created OK\n', { flag: 'a' });
    
    // Check if GraphQLSchemaBuilder is available
    const { GraphQLSchemaBuilder } = require('@nestjs/graphql/dist/graphql-schema.builder');
    const sb = app.get(GraphQLSchemaBuilder);
    fs.writeFileSync('/tmp/test-out.txt', 'SchemaBuilder obtained:' + sb.constructor.name + '\n', { flag: 'a' });
    
    await app.close();
  } catch (err: any) {
    fs.writeFileSync('/tmp/test-out.txt', 'Error type:' + err.constructor.name + '\n', { flag: 'a' });
    fs.writeFileSync('/tmp/test-out.txt', 'Error keys:' + Object.keys(err).join(',') + '\n', { flag: 'a' });
    fs.writeFileSync('/tmp/test-out.txt', 'has app:' + ('app' in err) + '\n', { flag: 'a' });
    fs.writeFileSync('/tmp/test-out.txt', 'app:' + (err.app?.constructor?.name || 'undefined') + '\n', { flag: 'a' });
    fs.writeFileSync('/tmp/test-out.txt', 'msg:' + err.message.split('\n')[0].substring(0, 200) + '\n', { flag: 'a' });
  }
}
main().catch(e => fs.writeFileSync('/tmp/test-out.txt', 'Fatal:' + e.message + '\n', { flag: 'a' }));
