# mlx-lm web UI

A simple chat frontend for the `mlx_lm.server` HTTP API, built with
[SvelteKit](https://svelte.dev/docs/kit) and Svelte 5.

It talks to the server's OpenAI-compatible endpoints (`/v1/chat/completions`,
`/v1/models`) over the same origin it is served from, and provides:

- Streaming responses with a stop button
- A model picker populated from `/v1/models`
- Markdown + syntax-highlighted code, with copy buttons
- Collapsible reasoning / `<think>` blocks
- Adjustable sampling parameters (temperature, top-p, top-k, repetition
  penalty, max tokens) and a system prompt
- Conversation history persisted in the browser (localStorage)
- Light / dark / system themes

## Using it

The compiled bundle is committed to `mlx_lm/webui/` and served automatically by
`mlx_lm.server`. Just start the server and open it in a browser:

```shell
mlx_lm.server --model <model>
# then visit http://localhost:8080
```

No Node.js or build step is required to *use* the UI — only to change it.

## Development

From this `webui/` directory:

```shell
npm install
npm run dev      # starts a dev server on http://localhost:5173
```

The dev server proxies `/v1` and `/health` to `http://localhost:8080`, so run
`mlx_lm.server` alongside it to exercise the full stack with hot reloading.

## Building

```shell
npm run build
```

This compiles a static single-page bundle directly into `../mlx_lm/webui/`
(configured via `adapter-static` in `svelte.config.js`). Commit the regenerated
files in `mlx_lm/webui/` so the packaged server keeps serving the latest UI.
