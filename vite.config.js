import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


export default {
  // config options
  build : {
    //sourcemap : 'inline', 
    lib: {
      entry: 'gg.js',
      formats:['es']
    }, 
    rollupOptions : {
      input: 'gg.js',
      plugins: [commonjs(), resolve()]
    }
  }
}
