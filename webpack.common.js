const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    app: './src/index.js'
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'public')
  },
  resolve: {
    alias: {
      styles: path.resolve(__dirname, './src/styles/'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['app.*'],
    }),
    new CopyPlugin({
      patterns: [
        { from: './src/scripts/vendor/three.r124.min.js', to: 'three.r124.min.js' },
        { from: './src/scripts/vendor/OrbitControls.js', to: 'OrbitControls.js' },
        { from: './src/scripts/vendor/dat.0.7.7.gui.js', to: 'dat.0.7.7.gui.js' },
        { from: './src/scripts/vendor/gsap.3.6.0.min.js', to: 'gsap.3.6.0.min.js' },
        { from: './src/scripts/vendor/reflector.js', to: 'reflector.js' },
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html'
    }),
  ]
};
