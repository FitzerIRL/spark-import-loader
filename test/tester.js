import path from 'path';
import webpack from 'webpack';
import memoryfs from 'memory-fs';

export default (fixture, options = {}) => {

  const tester = webpack(
  {
    context: __dirname,
    entry: `./${fixture}`,
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    module: {
      rules: [{
        test: /\.js$/,
        use: {
          loader: path.resolve(__dirname, '../src/spark-import-loader.js'),
          options: {
              base:
              {
                "base"    : path.resolve(__dirname, './'),       // definition for 'base' variable in the code
                "browser" : path.resolve(__dirname, './browser') // definition for 'browser' variable in the code
              }
          }
        }
      }]
    }
  });//webpack

  tester.outputFileSystem = new memoryfs();

  return new Promise((resolve, reject) => {
    tester.run((err, stats) => 
    {
      if (err || stats.hasErrors()) 
      {
        reject(err);
      }

      resolve(stats);
    });
  });
};
