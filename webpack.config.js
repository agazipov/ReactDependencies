const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  const commonConfig = {
    module: {
      rules: [
        { test: /\.ts$/, loader: 'ts-loader' }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    mode: isProduction ? 'production' : 'development',
  };

  const controlConfig = {
    ...commonConfig,
    entry: './src/control/control.ts',
    output: {
      filename: 'control.js',
      path: path.resolve(__dirname, 'out/control/'),
    },
    resolve: {
      ...commonConfig.resolve,
      fallback: {
        path: require.resolve("path-browserify")
      }
    },
    plugins: [new NodePolyfillPlugin()],
    devtool: isProduction ? 'source-map' : 'inline-source-map',
  };

  const extensionConfig = {
    ...commonConfig,
    target: 'node',
    entry: './src/extension.ts',
    output: {
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      path: path.resolve(__dirname, 'out'),
    },
    externals: { vscode: 'vscode' },
  };

  return [controlConfig, extensionConfig];
};