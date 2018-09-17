import tester from './tester.js';

test('Test 1', async () =>
{
  const stats  = await tester('input.js');
  const output = stats.toJson().modules[0].source;

  console.log( "output: " + output);

  var count = 0//(output.match(/## __spark-import-loader__ ##/g) || []).length;

  expect(count).toBe( 6 );
});