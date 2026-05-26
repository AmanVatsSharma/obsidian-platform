import 'reflect-metadata';
process.env.SCHEMA_GEN = 'true';
import('/home/amansharma/Desktop/DevOPS/Obsidian/path-register').catch((e) => console.log('path-register failed:', e.message.split('\n')[0]));

// Check if the path alias resolves correctly
try {
  const authIndex = require.resolve('@obsidian/backend-auth');
  console.log('backend-auth resolved to:', authIndex);
  
  const { AuthService } = require('@obsidian/backend-auth');
  console.log('AuthService:', typeof AuthService);
  
  // Check if AuthService has design:paramtypes metadata
  const meta = Reflect.getMetadata('design:paramtypes', AuthService);
  console.log('AuthService paramtypes:', meta);
} catch (e) {
  console.log('Error resolving @obsidian/backend-auth:', e.message.split('\n')[0]);
}

// Check what happens with the compiled auth resolver
try {
  const compiledAuth = require('/home/amansharma/Desktop/DevOPS/Obsidian/dist/apps/backend/src/modules/auth/auth.resolver.js');
  console.log('compiled auth resolver exports:', Object.keys(compiledAuth));
  const resolverCls = compiledAuth.AuthResolver || compiledAuth.default;
  if (resolverCls) {
    const meta = Reflect.getMetadata('design:paramtypes', resolverCls);
    console.log('resolver paramtypes:', meta ? meta.map(t => t ? t.name : '?') : 'NONE');
  }
} catch (e) {
  console.log('Error loading compiled auth resolver:', e.message.split('\n')[0]);
}
