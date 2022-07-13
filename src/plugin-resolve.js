import path from 'node:path';

const pluginExist = pluginPath => {
  try {
    require(pluginPath);/* eslint-disable-line unicorn/prefer-module */
    return true;
  } catch {}

  return false;
};

export default (pluginName, root = './') => {
  if (pluginExist(pluginName)) {
    return pluginName;
  }

  const pluginResolvePath = path.resolve(path.join(root, pluginName));
  if (pluginExist(pluginResolvePath)) {
    return pluginResolvePath;
  }

  return pluginName;
};
