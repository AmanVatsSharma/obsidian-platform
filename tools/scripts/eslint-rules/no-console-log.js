/**
 * @file         no-console-log.js
 * @module       tools/scripts/eslint-rules
 * @description  Disallow console.log — enforce AppLoggerService
 * @author       BharatERP
 * @created      2026-05-31
 */
'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow console calls.', recommended: true },
    messages: { noConsoleCall: "Use AppLoggerService instead of console.{{method}}()." },
    schema: [],
  },
  create: function (context) {
    var TEST_PATTERNS = [/\.spec\.ts$/, /\.test\.ts$/, /__tests__\//, /\/tests\//];
    var M = {log:true,error:true,warn:true,info:true,debug:true,trace:true};
    function isTest(f) { if (!f) return false; return TEST_PATTERNS.some(function(p){ return p.test(f); }); }
    return {
      CallExpression: function(node) {
        var f = context.getFilename();
        if (isTest(f)) return;
        var c = node.callee;
        if (!c || c.type !== 'MemberExpression') return;
        if (!c.object || c.object.type !== 'Identifier') return;
        if (c.object.name !== 'console') return;
        if (!c.property || c.property.type !== 'Identifier') return;
        if (M[c.property.name]) context.report({node: node, messageId: 'noConsoleCall', data: {method: c.property.name}});
      },
    };
  },
};
