// Entry program for the make.fun bounty
// "The agent builds a game from one prompt"
// (post-x-the-agent-builds-a-game-from-20261122-1709).
//
// The entry itself is the X post: the house reads POST.json from this
// repository, finds the post on X, and scores the post's views and
// interactions. All this program has to do — running on Node 22 with the
// standard library only, no network, no files outside the repository — is
// copy POST.json from the repository root into the output directory, where
// the gate reads it. Both graded runs must write the same bytes, and a
// plain copy guarantees that.
//
// Local run (as the grader does it):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(OUTPUT_DIR, { recursive: true });

const source = join(BOT_DIR, 'POST.json');
const target = join(OUTPUT_DIR, 'POST.json');

try {
  copyFileSync(source, target);
} catch (err) {
  console.error(`Could not copy ${source} to ${target}: ${(err as Error).message}`);
  process.exit(1);
}
