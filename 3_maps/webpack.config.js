const path = require("path");

module.exports = {
  mode: 'development',
  entry: "./js/index.js",
  output: {
    path: path.resolve(__dirname, "assets/js"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["babel-preset-env"]
          }
        }
      }
    ]
  }
};
