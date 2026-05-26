import 'reflect-metadata';

// Test 1: Does NestJS decorator require() pull in reflect-metadata?
// In the compiled args.decorator.js, line 5 is: require("reflect-metadata")
// When we first require any NestJS resolver, this should fire.
// But the issue might be the ORDER of module evaluation.

// Test 2: Manually trigger the Args decorator on a test class
const { Args } = require('@nestjs/graphql');

console.log('Args decorator:', typeof Args);

// Manually apply Args to a test method
class TestResolver {
  @Args('id') id: string {
    console.log('Args applied to method');
  }
}

// Check if reflect-metadata polyfill is active
console.log('Reflect.defineMetadata:', typeof Reflect.defineMetadata);
console.log('Reflect.getMetadata:', typeof Reflect.getMetadata);

// Check design:paramtypes on the method
const methodMeta = Reflect.getMetadata('design:paramtypes', TestResolver.prototype, 'id');
console.log('method design:paramtypes:', methodMeta);

// Check design:paramtypes on the constructor
const ctorMeta = Reflect.getMetadata('design:paramtypes', TestResolver);
console.log('constructor design:paramtypes:', ctorMeta);
