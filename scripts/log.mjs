// The scripts are CLIs; this is their one output channel. Keeping it in one
// place means a quiet mode or CI annotations change one file, not every script.
const ci = process.env.GITHUB_ACTIONS === 'true';

export const say = (msg) => process.stdout.write(`${msg}\n`);
export const warn = (msg) => process.stderr.write(`${ci ? '::warning::' : 'warn  '}${msg}\n`);
export const fail = (msg) => process.stderr.write(`${ci ? '::error::' : 'error '}${msg}\n`);
