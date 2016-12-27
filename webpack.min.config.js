var config = require('./webpack.config.js'),
    webpack = require('webpack');

config.output.filename = 'bundle.min.js',
config.plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}));

module.exports = config;
