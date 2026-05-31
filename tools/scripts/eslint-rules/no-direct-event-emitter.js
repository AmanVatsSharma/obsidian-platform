/**
 * @file         no-direct-event-emitter.js
 * @module       tools/scripts/eslint-rules
 * @description  Disallow eventEmitter.emit() — enforce OutboxService for cross-module events
 * @author       BharatERP
 * @created      2026-05-31
 */
'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow direct eventEmitter.emit() calls.', recommended: true },
    messages: {
      noDirectEmit: "Use OutboxService.enqueue() for cross-module events.",
    },
    schema: [],
  },
  create: function (context) {
    var TEST_PATTERNS = [/\.spec\.ts$/, /\.test\.ts$/, /__tests__\//, /\/tests\//];
    function isTest(f) { if (!f) return false; return TEST_PATTERNS.some(function(p){ return p.test(f); }); }
    return {
      CallExpression: function(node) {
        var f = context.getFilename();
        if (isTest(f)) return;
        var c = node.callee;
        if (!c || c.type !== 'MemberExpression') return;
        if (!c.property || c.property.type !== 'Identifier') return;
        if (c.property.name === 'emit') context.report({node: node, messageId: 'noDirectEmit'});
      },
    };
  },
};
