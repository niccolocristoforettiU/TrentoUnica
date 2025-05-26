// vue.config.js
const webpack = require('webpack');

module.exports = {
  devServer: {
    port: 8080,
    proxy: {
      '^/api': {
        target: 'http://localhost:5050', // Dove gira il backend
        changeOrigin: true,
      },
    },
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false),
      }),
    ],
  }
};
