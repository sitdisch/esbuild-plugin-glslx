const glslx = require('glslx');

module.exports = ({
  writeTypeDeclarations = false,
  renaming = 'all',
  disableRewriting = false,
  prettyPrint = false,
  preprocess = null
} = {}) => ({
  name: 'glslx',
  setup(build) {
    const path = require('path');
    const fs = require('fs');
    const prepr = (preprocess === null) ? arg => { return arg; } : require('prepr');
    
    build.onLoad({ filter: /\.glslx$/ }, async (args) => {
      const contents = prepr(await fs.promises.readFile(args.path, 'utf8'), preprocess);
      const input = [{ name: args.path, contents }];
      const errors = [];
      const warnings = [];
      const cache = Object.create(null);
      cache[args.path] = contents;

      const fileAccess = (filePath, relativeTo) => {
        const name = path.join(path.dirname(relativeTo), filePath);
        const contents = cache[name] || (cache[name] = prepr(fs.readFileSync(name, 'utf8'), preprocess));
        return { name, contents };
      };

      for (const { kind, text, range } of glslx.compileIDE(input, { fileAccess }).diagnostics) {
        const message = { text };

        if (range) {
          const lineText = cache[range.source].split(/\r|\n|\r\n/g)[range.start.line];
          message.location = {
            file: range.source,
            line: range.start.line + 1,
            column: range.start.column,
            length: range.end.line === range.start.line ? range.end.column - range.start.column : 0,
            lineText,
          };
        }

        if (kind === 'error') errors.push(message);
        if (kind === 'warning') warnings.push(message);
      }

      if (errors.length > 0) return { errors, warnings };

      const json = JSON.parse(glslx.compile(input, {
        format: 'json',
        fileAccess,
        prettyPrint,
        disableRewriting,
        renaming,
      }).output);

      let js = '';
      let ts = '';
      for (const shader of json.shaders) {
        js += `export var ${shader.name} = ${JSON.stringify(shader.contents)};\n`;
        ts += `export var ${shader.name}: string;\n`;
      }
      js += `export var renaming = ${JSON.stringify(json.renaming)};\n`;
      if (writeTypeDeclarations) {
        await fs.promises.writeFile(args.path + '.d.ts', ts);
      }
      return { contents: js, warnings };
    });
  },
});
