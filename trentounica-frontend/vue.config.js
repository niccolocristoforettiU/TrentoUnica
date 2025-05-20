// vue.config.js
const webpack = require('webpack');

module.exports = {
  devServer: {
    port: 8080, // Forza il server a utilizzare la porta 8080
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false),
      }),
    ],
  },
};
