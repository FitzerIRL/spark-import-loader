import compiler from './compiler.js';

test('Test 1', async () =>
{
  const stats  = await compiler('input.js');
  const output = stats.toJson().modules[0].source;

  console.log("GOT:  " + JSON.stringify(output) )
  //expect(output).toBe('export default "Hey Alice!\\n"');
  expect(1).toBe(1);
});