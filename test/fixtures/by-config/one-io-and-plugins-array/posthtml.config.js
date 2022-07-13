module.exports = {/* eslint-disable-line unicorn/prefer-module */
  input: 'test/fixtures/by-config/one-io-and-plugins-array/input.html',
  output: 'test/expected/by-config/one-io-and-plugins-array/output.html',
  plugins: [
    require('posthtml-custom-elements')(), /* eslint-disable-line unicorn/prefer-module */
  ],
};
