#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import fg from 'fast-glob';
import meow from 'meow';
import makeDir from 'make-dir';
import updateNotifier from 'update-notifier';
import posthtml from 'posthtml';
import outResolve from './out-resolve';
import cfgResolve from './cfg-resolve';
import pluginResolve from './plugin-resolve';

const package_ = require('../package.json');/* eslint-disable-line unicorn/prefer-module */
updateNotifier({pkg: package_}).notify();

const cli = meow(`
  Usage: posthtml <patterns>

  Options:
    --output -o      Output File or Folder
    --config -c      Path to config file
    --use -u         PostHTML plugin name
    --root -r        Mirror the directory structure relative to this path in the output directory(default: .)
    --allInOutput -a Save the nesting structure for output
    --help -h        CLI Help
    --version -v     CLI Version

  Examples:
    $ posthtml input.html
    $ posthtml input.html -o output.html
    $ posthtml inputFolder/*.html !unicorn.html
    $ posthtml input.html -o output.html -c posthtml.js
    $ posthtml input.html -o output.html -u posthtml-bem --posthtml-bem.elemPrefix __
    $ posthtml inputFolder/*.html -o outputFolder
    $ posthtml inputFolder/**/*.html -o outputFolder -a
    $ posthtml inputFolder/**/*.html -o outputFolder -a -r inputFolder
`, {
  flags: {
    config: {
      type: 'string',
      alias: 'c',
    },
    version: {
      type: 'boolean',
      alias: 'v',
    },
    help: {
      type: 'boolean',
      alias: 'h',
    },
    output: {
      type: 'string',
      alias: 'o',
    },
    use: {
      type: 'string',
      alias: 'u',
      isMultiple: true,
    },
    // https://github.com/sindresorhus/meow/issues/158
    // options: {
    //   type: 'string',
    //   isMultiple: true
    // },
    root: {
      type: 'string',
      alias: 'r',
      default: './',
    },
    allInOutput: {
      type: 'boolean',
      default: false,
      alias: 'a',
    },
    skip: {
      type: 'string',
      alias: 's',
      isMultiple: true,
    },
  },
});

const read = file => new Promise(resolve => {
  fs.readFile(file, 'utf8', (error, data) => {
    if (error) {
      console.warn(error);
    }

    resolve(data);
  });
});

const interopRequire = object => object && object.__esModule ? object.default : object;

const getPlugins = config => Object.keys(config.plugins || {})
  .map(plugin => interopRequire(require(pluginResolve(plugin, config.root)))(config.plugins[plugin]));/* eslint-disable-line unicorn/prefer-module */

const config = cfgResolve(cli);

const processing = async file => {
  const output = await outResolve(file, config);
  const plugins = Array.isArray(config.plugins) ? config.plugins : getPlugins(config);
  const skipParse = config.skip.includes(file);

  makeDir(path.dirname(output))
    .then(read.bind(undefined, file))
    .then(html => posthtml(plugins).process(html, {
      ...config.options,
      skipParse,
      from: file,
    }))
    .then(({html}) => {
      fs.writeFile(output, html, error => {
        if (error) {
          console.warn(error);
        }

        console.log(`The file ${file} has been saved!`);
      });
    });
};

fg.stream(config.input)
  .on('data', processing)
  .once('error', console.warn);
