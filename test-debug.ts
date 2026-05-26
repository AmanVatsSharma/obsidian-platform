import 'reflect-metadata';

const fs = require('fs');

const { AuthResolver } = require('./apps/backend/src/modules/auth/auth.resolver.ts');
fs.writeFileSync('/tmp/test-out.txt', 'AuthResolver:' + (AuthResolver?.name || 'undefined') + '\n');

const pm = Reflect.getMetadata('design:paramtypes', AuthResolver);
fs.writeFileSync('/tmp/test-out.txt', 'paramtypes:' + JSON.stringify(pm?.map(t => t?.name)) + '\n', { flag: 'a' });

const mm = Reflect.getMetadata('design:paramtypes', AuthResolver?.prototype, 'me');
fs.writeFileSync('/tmp/test-out.txt', 'method paramtypes:' + JSON.stringify(mm?.map(t => t?.name)) + '\n', { flag: 'a' });
