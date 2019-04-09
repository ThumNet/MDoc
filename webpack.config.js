const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackInjectAttributesPlugin = require("html-webpack-inject-attributes-plugin");

module.exports = {
  entry: "./src/index.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebPackPlugin({
      template: "./public/index.html",
      minify: true,
    }),
    new HtmlWebpackInjectAttributesPlugin({
      inline: "true"
    }),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(__dirname, "public"),
          to: path.join(__dirname, "dist"),
          toType: "dir",
          ignore: [ ".DS_Store" ]
        }
      ]
    )
  ]
};