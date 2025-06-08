// vue.config.js
const webpack = require('webpack');

module.exports = {
  devServer: {
    host: 'localhost',
    port: 8080,
    proxy: {
      '^/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
    client: {
      webSocketURL: 'ws://localhost:8080/ws' // 👈 aggiunto per evitare errore su IP sbagliato
    }
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false),
      }),
    ],
  }
};


