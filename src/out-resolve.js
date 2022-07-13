import path from 'node:path';

export default (input, {output, root, allInOutput} = {}) => new Promise(resolve => {
  if (output && path.extname(output)) {
    resolve(output);
    return;
  }

  if (output) {
    let inputPath = path.basename(input);

    if (allInOutput) {
      inputPath = path.relative(root, input);
    }

    resolve(path.join(output, inputPath));
    return;
  }

  resolve(input);
});
