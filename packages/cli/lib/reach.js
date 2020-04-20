const { resolve } = require('path');
const slash = require('slash');
// @ts-ignore
const { findConfig } = require('browserslist');

function reachConfig(rootPath) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const io = require(resolve(rootPath, '.best-shot', 'config.js'));
  return function func(params) {
    const config = typeof io === 'function' ? io(params) : io;
    if (typeof config === 'object') {
      config.outputPath =
        config.outputPath || slash('.best-shot/build/[platform]');
      return config;
    }
    throw new TypeError('Config should be an Object');
  };
}

function reachBrowsers(rootPath, mode) {
  const { defaults = 'defaults', [mode]: browsers = defaults } =
    findConfig(rootPath) || {};
  if (Array.isArray(browsers) && browsers.length === 0) {
    return 'defaults';
  }
  return browsers;
}

module.exports = {
  reachConfig,
  reachBrowsers,
};
