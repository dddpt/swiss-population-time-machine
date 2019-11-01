const path = require("path");

module.exports = {
  mode: 'development',
  entry: "./js/index.js",
  output: {
    path: path.resolve(__dirname, "assets/js"),
    filename: "bundle.js"
  }
};
