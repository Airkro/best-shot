// eslint-disable-next-line import/no-extraneous-dependencies, node/no-extraneous-require
const Chain = require('webpack-chain');
const BestShot = require('@best-shot/core');
const { commandEnv, logRedError } = require('@best-shot/core/lib/common');
const { applyProgress, applyAnalyzer } = require('../apply');
const { reachDependencies, reachConfig, reachBrowsers } = require('../reach');
const { concatStr, formatJs } = require('./concat-str');
const writeFile = require('./write-file');

const commands = ['serve', 'watch', 'dev', 'prod'];

module.exports = async function inspector({
  platforms = [],
  stamp = 'none',
  config: configPath
}) {
  const rootPath = process.cwd();
  const configFunc = reachConfig(rootPath, configPath);
  const dependencies = reachDependencies(rootPath);

  console.log('Output files ...');

  platforms.forEach(async platform => {
    commands.forEach(async command => {
      try {
        const mode = commandEnv(command);
        const browsers = reachBrowsers(rootPath)[mode];

        const { webpackChain, presets, ...config } = configFunc({
          command,
          platform
        });

        if (command === 'serve') {
          presets.unshift('serve');
        }

        const io = new BestShot({ presets });

        const schema = io.schema.toString();

        await writeFile({
          rootPath,
          stamp,
          name: `${platform}-${command}.schema.json`,
          data: schema
        });

        const result = io
          .load({
            options: {
              watch: command === 'watch',
              serve: command === 'serve'
            },
            rootPath,
            dependencies,
            mode,
            config,
            platform,
            browsers
          })
          .when(typeof webpackChain === 'function', webpackChain);

        if (result) {
          await writeFile({
            rootPath,
            stamp,
            name: `${platform}-${command}.config.js`,
            data: concatStr({
              stamp,
              input: {
                configPath,
                platform,
                mode,
                browsers,
                command,
                presets,
                config,
                webpackChain
              },
              output: result.toString()
            })
          });
        }
      } catch (err) {
        logRedError(err.message, err.extra);
        process.exit(1);
      }
    });
  });

  await writeFile({
    rootPath,
    stamp,
    name: 'progress-analyze.config.js',
    data: formatJs(
      `// $ best-shot dist --progress --analyze

exports.sample = ${new Chain()
        .batch(applyProgress)
        .batch(applyAnalyzer)
        .toString()}`
    )
  });

  await writeFile({
    rootPath,
    stamp,
    name: 'dependencies.json',
    data: JSON.stringify(dependencies, null, '  ')
  });
};
