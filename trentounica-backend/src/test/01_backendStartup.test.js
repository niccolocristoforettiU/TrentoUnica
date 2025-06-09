// backendStartup.test.js
const { exec } = require('child_process');

test('backend npm run dev should not crash', done => {
  exec('npm run dev', { cwd: './backend' }, (err, stdout, stderr) => {
    expect(stderr).toBe('');
    done();
  });
});
