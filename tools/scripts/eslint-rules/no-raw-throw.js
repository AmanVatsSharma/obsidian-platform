/**
 * @file         no-raw-throw.js
 * @module       tools/scripts/eslint-rules
 * @description  Disallow raw Error and HttpException throws — enforce AppError usage
 * @author       BharatERP
 * @created      2026-05-31
 */
'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw Error and HttpException throws. Use AppError(code, message) instead.',
      recommended: true,
    },
    messages: {
      noRawError: "Use AppError(code, message) instead of 'throw new Error(...)'.",
      noRawHttpException: "Use AppError(code, message) instead of 'throw new HttpException(...)'.",
      noRawExceptionSubclass: "Use AppError(code, message) instead of 'throw new {{className}}(...)'.",
    },
    schema: [],
  },
  create: function (context) {
    var TEST_PATTERNS = [/\.spec\.ts$/, /\.test\.ts$/, /__tests__\//, /\/tests\//];
    var KNOWN_EXCEPTIONS = [
      'HttpException','BadRequestException','UnauthorizedException','NotFoundException',
      'ForbiddenException','NotAcceptableException','RequestTimeoutException','ConflictException',
      'GoneException','PayloadTooLargeException','UnsupportedMediaTypeException',
      'UnprocessableEntityException','InternalServerErrorException','NotImplementedException',
      'MethodNotAllowedException','ImATeapotException','MisdirectedException',
      'PreconditionFailedException','DependencyTimeoutException',
    ];

    function isTest(filename) {
      if (!filename) return false;
      return TEST_PATTERNS.some(function(p){ return p.test(filename); });
    }
    function isNestExc(name) {
      if (!name) return false;
      return KNOWN_EXCEPTIONS.indexOf(name) !== -1 || name.endsWith('Exception');
    }
    function getCallee(node) {
      if (!node || node.type !== 'NewExpression') return null;
      if (node.callee && node.callee.type === 'Identifier') return node.callee.name;
      if (node.callee && node.callee.object && node.callee.object.type === 'Identifier') return node.callee.object.name;
      return null;
    }
    return {
      ThrowStatement: function(node) {
        var filename = context.getFilename();
        if (isTest(filename)) return;
        var arg = node.argument;
        if (!arg || arg.type !== 'NewExpression') return;
        var name = getCallee(arg);
        if (!name) return;
        if (name === 'Error') { context.report({node: node, messageId: 'noRawError'}); return; }
        if (name === 'HttpException') { context.report({node: node, messageId: 'noRawHttpException'}); return; }
        if (isNestExc(name)) { context.report({node: node, messageId: 'noRawExceptionSubclass', data: {className: name}}); }
      },
    };
  },
};
