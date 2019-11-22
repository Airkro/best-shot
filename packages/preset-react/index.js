'use strict';

const slashToRegexp = require('slash-to-regexp');

exports.name = 'preset-react';

exports.apply = function applyReact() {
  return chain => {
    const mode = chain.get('mode');
    const useHot = chain.devServer.get('hot');

    if (useHot) {
      const first = Object.keys(chain.entryPoints.entries())[0];
      chain.entry(first).prepend('react-hot-loader/patch');
      chain.resolve.alias.set('react-dom', '@hot-loader/react-dom');
    }

    const fileRegexp = chain.module.rule('babel').get('test');

    chain.resolve.extensions.prepend('.jsx');

    chain.module
      .rule('babel')
      .exclude.add(slashToRegexp('/node_modules/react-hot-loader/'))
      .end()
      .test(fileRegexp.add('jsx'))
      .use('babel-loader')
      .tap(({ presets = [], plugins = [], ...options }) => ({
        ...options,
        presets: [...presets, '@babel/react'],
        plugins: [
          ...plugins,
          'react-hot-loader/babel',
          ...(mode === 'production'
            ? ['transform-react-remove-prop-types']
            : [])
        ]
      }));
  };
};
