import { defineConfig } from 'vite'
import obfuscatorPkg from 'rollup-plugin-obfuscator'
import { resolve } from 'path'
import { readFileSync } from 'node:fs'

const obfuscator = (obfuscatorPkg as unknown as { default: typeof obfuscatorPkg }).default ?? obfuscatorPkg

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string }

export default defineConfig(({ mode }) => {
  const isMin = mode !== 'nomin'

  return {
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'MajiSDK',
        fileName: (format) => {
          if (format === 'umd') return isMin ? 'maji-sdk.min.js' : 'maji-sdk.umd.js'
          if (format === 'es') return 'maji-sdk.js'
          return `maji-sdk.${format}.js`
        },
        formats: ['umd', 'es'],
      },
      sourcemap: false,
      minify: isMin ? 'esbuild' : false,
      target: 'es2018',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          exports: 'named',
        },
        plugins: isMin
          ? [
              obfuscator({
                global: false,
                include: ['**/*.ts', '**/*.js'],
                options: {
                  compact: true,
                  controlFlowFlattening: true,
                  controlFlowFlatteningThreshold: 0.5,
                  deadCodeInjection: true,
                  deadCodeInjectionThreshold: 0.2,
                  debugProtection: false,
                  disableConsoleOutput: false,
                  identifierNamesGenerator: 'hexadecimal',
                  log: false,
                  numbersToExpressions: true,
                  renameGlobals: false,
                  rotateStringArray: true,
                  selfDefending: true,
                  shuffleStringArray: true,
                  simplify: true,
                  splitStrings: true,
                  splitStringsChunkLength: 8,
                  stringArray: true,
                  stringArrayCallsTransform: true,
                  stringArrayEncoding: ['base64'],
                  stringArrayIndexShift: true,
                  stringArrayWrappersCount: 2,
                  stringArrayWrappersChainedCalls: true,
                  stringArrayWrappersParametersMaxCount: 4,
                  stringArrayWrappersType: 'function',
                  stringArrayThreshold: 0.75,
                  transformObjectKeys: true,
                  unicodeEscapeSequence: false,
                },
              }),
            ]
          : [],
      },
    },
  }
})
