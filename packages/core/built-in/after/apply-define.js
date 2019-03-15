const { DefinePlugin, EnvironmentPlugin } = require('webpack');
const mapValues = require('lodash/mapValues');

const displayName = 'define';

exports.name = displayName;

exports.apply = function applyDefine({
  config: { define },
  mode,
  options: { serve, watch }
}) {
  return chain => {
    if (define && Object.keys(define).length) {
      chain
        .plugin('define')
        .use(DefinePlugin, [mapValues(define, JSON.stringify)]);
    }
    chain
      .plugin('environment')
      .use(EnvironmentPlugin, [
        {
          NODE_ENV: mode,
          DEBUG: serve || watch
        }
      ])
      .end();
  };
};

exports.schema = {
  define: {
    description: 'Options of DefinePlugin',
    type: 'object'
  }
};
