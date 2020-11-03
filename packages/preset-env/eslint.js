const mapValues = require('lodash/mapValues');
const isGit = require('is-git-repository').default;
const sortKeys = require('sort-keys');

const { findConfig, parseConfig, filterData } = require('./lib');

const envFile = findConfig(process.cwd());

const { production, development, watch, serve, ...rest } = parseConfig(envFile);

const envObject = mapValues(
  filterData({
    ...rest,
    ...production,
    ...development,
    ...watch,
    ...serve,
  }),
  () => 'readonly',
);

const globals = sortKeys({
  ...envObject,
  ...(isGit() ? { GIT_HASH: 'readonly' } : undefined),
});

module.exports = { globals };
