'use strict';

const { join, relative } = require('path');
const deepmerge = require('deepmerge');
const extToRegexp = require('ext-to-regexp');
const slashToRegexp = require('slash-to-regexp');
const SubresourceIntegrityPlugin = require('webpack-subresource-integrity');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const { objectFilter } = require('@best-shot/core/lib/common');

function getPkg(path) {
  try {
    const {
      name,
      version,
      description
      // TODO more
      // eslint-disable-next-line import/no-dynamic-require, global-require
    } = require(path);
    return name || version || description
      ? objectFilter({ name, version, description })
      : undefined;
  } catch (error) {
    return undefined;
  }
}

const overwriteMerge = (destinationArray, sourceArray) => sourceArray;

const htmlMinifier = {
  collapseWhitespace: true,
  removeEmptyAttributes: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true
};

module.exports = function setHtml({ html = {}, define, sri }) {
  return chain => {
    const mode = chain.get('mode');
    const context = chain.get('context');
    const publicPath = chain.output.get('publicPath');
    const minimize = chain.optimization.get('minimize');

    const defaultOptions = {
      inject: 'head',
      minify: minimize ? htmlMinifier : false,
      template: relative(context, 'src/index.html'),
      templateParameters: objectFilter({
        title: 'BEST-SHOT Project',
        define,
        package: getPkg(join(context, 'package.json'))
      })
    };

    const htmlOptions = (Array.isArray(html)
      ? html.length > 0
        ? html
        : [{}]
      : [html]
    ).map(({ title, templateParameters, ...options }) =>
      objectFilter({
        ...options,
        templateParameters:
          title || templateParameters
            ? objectFilter({ publicPath, title, ...templateParameters })
            : undefined
      })
    );

    htmlOptions.forEach((options, index) => {
      chain
        .plugin(`html-page-${index}`)
        .use(HtmlWebpackPlugin, [
          deepmerge.all(
            [defaultOptions, index > 0 ? htmlOptions[0] : {}, options],
            { arrayMerge: overwriteMerge }
          )
        ]);
    });

    chain
      .plugin('script-ext-html')
      .use(ScriptExtHtmlWebpackPlugin, [{ defaultAttribute: 'defer' }]);

    if (mode === 'production' && sri) {
      chain.output.crossOriginLoading('anonymous');

      chain
        .plugin('subresource-integrity')
        .use(SubresourceIntegrityPlugin, [
          { hashFuncNames: ['sha512', 'sha384', 'sha256'] }
        ]);
    }

    chain.module
      .rule('micro-tpl')
      .test(extToRegexp({ extname: ['tpl'] }))
      .use('micro-tpl-loader')
      .loader('micro-tpl-loader');

    if (chain.module.rules.has('babel')) {
      chain.module
        .rule('babel')
        .exclude.add(slashToRegexp('/node_modules/micromustache/'));
    }
  };
};