// testSequencer.js
const Sequencer = require('@jest/test-sequencer').default;

class OrderedTestSequencer extends Sequencer {
  sort(tests) {
    return tests.sort((a, b) =>
      a.path.localeCompare(b.path, undefined, { numeric: true })
    );
  }
}

module.exports = OrderedTestSequencer;
