declare function glslxPlugin(options?: {
  // If true, write out "*.glslx.d.ts" files
  writeTypeDeclarations?: boolean; // Default: false
  renaming?: 'all' | 'internal-only' | 'none'; // Default: 'all'
  disableRewriting?: boolean; // Default: false
  prettyPrint?: boolean; // Default: false
  preprocess?: object; // Default: inactive (null)
}): {
  name: string;
  setup(build: any): void;
};

export = glslxPlugin;
