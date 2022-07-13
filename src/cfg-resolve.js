import path from 'node:path';
import {cosmiconfigSync} from 'cosmiconfig';
import toCamelCase from 'to-camel-case';
import mergeOptions from 'merge-options';
import normalizePath from 'normalize-path';
import fg from 'fast-glob';

export default ({input, flags = {}}) => {
  const explorer = cosmiconfigSync('posthtml');
  let {
    config,
    use,
    options = {},
    output,
    root = './',
    skip = [],
    allInOutput = false,
  } = flags;

  if (config) {
    ({config} = explorer.load(config));
  }

  if (use) {
    const configPluginOptions = config?.plugins ?? {};

    // Plugins defined via CLI options take precedence over the ones from config file.
    use = [].concat(use).reduce((cfg, name) => {/* eslint-disable-line unicorn/prefer-array-flat, unicorn/prefer-spread, unicorn/no-array-reduce */
      const cliOptions = flags[toCamelCase(name)];
      const configOptions = configPluginOptions[name];

      // We merge this way because options can be both strings and objects.
      const merged = mergeOptions({[name]: configOptions}, {[name]: cliOptions || {}});

      // Assigning as we loop `use` makes sure that the order in cfg.plugins is correct.
      cfg.plugins[name] = merged[name];

      if (configOptions) {
        delete configPluginOptions[name];
      }

      return cfg;
    }, {plugins: {}});

    // Add the remaining plugins if there is any.
    if (config && config.plugins) {
      for (const name in configPluginOptions) {
        if (configPluginOptions[name]) {
          use.plugins[name] = configPluginOptions[name];
        }
      }

      // Now all the plugins are in `use.plugins`.
      // Delete `config.plugins` for correct merging later: mergeOptions(config, {...}, use)
      delete config.plugins;
    }
  }

  if (!config && !use) {
    const search = explorer.search();
    config = search?.config;
  }

  if (config?.root) {
    root = config.root;
  }

  if (config?.allInOutput) {
    allInOutput = config.allInOutput;
  }

  if (config?.skip) {
    skip = skip.concat(config.skip);/* eslint-disable-line unicorn/prefer-spread */
  }

  input = []/* eslint-disable-line unicorn/prefer-array-flat */
    .concat(input && input.length > 0 ? input : config?.input)/* eslint-disable-line unicorn/prefer-spread */
    .filter(Boolean)
    .map(file => {
      const ignoreFile = file.startsWith('!');
      let ignoreSymbol = '';

      if (ignoreFile) {
        ignoreSymbol = '!';
        file = file.slice(1);
      }

      return `${ignoreSymbol}${normalizePath(path.join(path.resolve(root), file))}`;
    });

  if (input.length === 0) {
    throw new TypeError('input files not found');
  }

  output = output ?? config?.output;
  if (output) {
    output = normalizePath(output);
  }

  skip = fg.sync(skip, {cwd: path.resolve(root)}).map(file => normalizePath(path.join(path.resolve(root), file)));

  return mergeOptions(config ?? {}, {
    input,
    output,
    options,
    root,
    allInOutput,
    skip,
  }, use ?? {});
};
