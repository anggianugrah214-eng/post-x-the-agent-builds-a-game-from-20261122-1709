# Star Catch — a game built from one prompt

An entry for the make.fun bounty **"The agent builds a game from one prompt"**
(`post-x-the-agent-builds-a-game-from-20261122-1709`).

One prompt — *"Build me a tiny browser game — catch the falling stars"* —
and an AI agent built this: a tiny playable browser game, plus a short video
showing the prompt, the agent writing the code, and the finished game running.

## The game

**Star Catch.** Move the paddle and catch the falling stars.

- Gold star: +10. Pink star: +25.
- Miss a star and you lose a life. Three lives.
- It gets faster as your score grows.

### Play it

Open `index.html` in any browser. No build step, no dependencies.

- **← →** or **A / D** to move, or just move the mouse.
- **R** to restart after game over.

### How it works

`game.js` holds the whole game: `createGame(width, height)` returns
`{ state, step, render }`. The game knows nothing about the canvas — it draws
through a tiny interface (`rect`, `circle`, `poly`, `rrect`, `text`), so the
same code runs in the browser (`index.html` adapts it to a real canvas) and
headless. The video's gameplay footage was made by running this exact code
in Node with a scripted auto-player and replaying its draw calls, frame by
frame — the game you see in the video is really running.

## The video

`video.mp4` (in the bounty workspace, posted to X by the entrant) shows:

1. The prompt.
2. The agent writing the game's code.
3. The finished game running — real gameplay.
4. The call to come build on make.fun.
5. make.fun's referral end card from its press pack, with the entrant's
   referral code typed into its field.

## The entry

- `POST.json` — the address of the X post carrying the video (placeholder
  until the post is made).
- `main.ts` — Node 22, standard library only: copies `POST.json` to
  `/output`, which is all the grader needs. Run it locally with:
  `mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts`
