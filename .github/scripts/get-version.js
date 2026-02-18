async function run() {
  try {
    const { default: semanticRelease } = await import('semantic-release');

    // Save original stdout and redirect to suppress semantic-release logs
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    
    let result;
    try {
      process.stdout.write = (chunk, encoding, callback) => {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = undefined;
        }
        if (callback) {
          callback();
        }
        return true;
      };

      result = await semanticRelease({
        dryRun: true,
        branches: ['main'],
        plugins: [
          '@semantic-release/commit-analyzer',
          '@semantic-release/release-notes-generator'
        ]
      });
    } finally {
      // Restore stdout
      process.stdout.write = originalStdoutWrite;
    }

    if (result) {
      const { nextRelease } = result;
      console.log(nextRelease.version);
    }
    // Output nothing if no release (empty output)
  } catch (err) {
    console.error('The automated release failed with %O', err);
    process.exit(1);
  }
}

run();
