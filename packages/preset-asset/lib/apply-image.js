const extToRegexp = require('ext-to-regexp');
const ImageminPlugin = require('imagemin-webpack');

const imageRegexp = extToRegexp({
  extname: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
});

module.exports = function applyImage(chain) {
  const minimize = chain.optimization.get('minimize');

  chain.module
    .rule('image')
    .test(imageRegexp)
    .use('file-loader')
    .loader('file-loader')
    .options({
      name: minimize
        ? '[name].min.[contenthash:8].[ext]'
        : '[name].[contenthash:8].[ext]',
      outputPath: 'image',
      esModule: false,
    });

  if (minimize) {
    chain.optimization.minimizer('imagemin').use(ImageminPlugin, [
      {
        cache: false,
        test: imageRegexp,
        name: '[path][name].[ext]',
        imageminOptions: {
          plugins: [
            'optipng',
            ['jpegtran', { progressive: true }],
            ['gifsicle', { interlaced: true }],
            [
              'svgo',
              {
                multipass: true,
                plugins: [
                  {
                    removeAttrs: {
                      attrs: ['data-*', 'data.*'],
                    },
                  },
                  { removeDimensions: true },
                  { removeScriptElement: true },
                  { sortAttrs: true },
                  { moveElemsAttrsToGroup: false },
                  {
                    inlineStyles: {
                      onlyMatchedOnce: false,
                    },
                  },
                  {
                    removeAttributesBySelector: {
                      selector: 'svg',
                      attributes: ['id'],
                    },
                  },
                ],
              },
            ],
          ],
        },
      },
    ]);
  }
};