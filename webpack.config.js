const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/html/control.ts', // Укажите основной файл, который будет импортировать другие модули
    output: {
      filename: 'control.js',
      path: path.resolve(__dirname, 'out/control/'),
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        path: require.resolve("path-browserify")
      }
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    mode: isProduction ? 'production' : 'development',
    plugins: [
      new NodePolyfillPlugin()
    ]
  };
};

// module.exports = (env, argv) => {
//   const isProduction = argv.mode === 'production';

//   return {
//     entry: './src/extension.ts', // Укажите основной файл, который будет импортировать другие модули
//     output: {
//       filename: 'extension.js',
//       path: path.resolve(__dirname, 'out/'),
//     },
//     module: {
//       rules: [
//         {
//           test: /\.ts$/,
//           use: 'ts-loader',
//           exclude: /node_modules/,
//         },
//       ],
//     },
//     resolve: {
//       extensions: ['.ts', '.js'],
//     },
//     devtool: isProduction ? 'source-map' : 'inline-source-map',
//     mode: isProduction ? 'production' : 'development',
//   };
// };