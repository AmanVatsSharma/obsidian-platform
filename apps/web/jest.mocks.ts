// Mock for `nanoid` package — exports both default and named `nanoid`.
const nanoidMock = (len = 10) => 'test-id-' + Math.random().toString(36).slice(2, 2 + len);

module.exports = {
  nanoid: nanoidMock,
  default: nanoidMock,
};