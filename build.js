const ts = require('typescript');
const transformPaths = require('typescript-transform-paths').default;

// Carrega o tsconfig.json
const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const compilerOptions = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  './'
).options;

// Função para compilar com transformação de paths
function build() {
  const program = ts.createProgram({
    rootNames: ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      './'
    ).fileNames,
    options: compilerOptions,
  });

  const transformers = {
    before: [transformPaths(program)],
  };

  const emitResult = program.emit(undefined, undefined, undefined, false, transformers);

  if (emitResult.emitSkipped) {
    console.error('❌ Build failed');
    process.exit(1);
  }

  console.log('✅ Build completed successfully with path transformations');
}

build();
