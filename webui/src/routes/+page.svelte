<script>
	import '../app.css';
	import { tick } from 'svelte';
	import { conversations } from '$lib/storage.svelte.js';
	import { settings } from '$lib/settings.svelte.js';
	import { listModels, streamChat } from '$lib/api.js';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import Message from '$lib/components/Message.svelte';

	let models = $state(/** @type {string[]} */ ([]));
	let connectionError = $state('');
	let input = $state('');
	let generating = $state(false);
	let sidebarOpen = $state(false);
	let settingsOpen = $state(false);
	/** @type {AbortController | null} */
	let controller = null;
	/** @type {HTMLDivElement | undefined} */
	let scrollEl;
	/** @type {HTMLTextAreaElement | undefined} */
	let inputEl;

	const active = $derived(conversations.active);

	// Apply the chosen theme to the document root.
	$effect(() => {
		const resolved =
			settings.theme === 'system'
				? matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: settings.theme;
		document.documentElement.dataset.theme = resolved;
	});

	$effect(() => {
		loadModels();
	});

	async function loadModels() {
		try {
			models = await listModels();
			connectionError = '';
			if (!settings.model && models.length) {
				settings.model = models[0];
				settings.save();
			}
		} catch (e) {
			connectionError =
				'Could not reach the mlx-lm server. Start it with `mlx_lm.server` and reload.';
		}
	}

	async function scrollToBottom() {
		await tick();
		scrollEl?.scrollTo({ top: scrollEl.scrollHeight });
	}

	function autoGrow() {
		if (!inputEl) return;
		inputEl.style.height = 'auto';
		inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	async function send() {
		const text = input.trim();
		if (!text || generating) return;

		conversations.addMessage({ role: 'user', content: text });
		input = '';
		autoGrow();
		await send_internal();
	}

	async function send_internal() {
		generating = true;
		connectionError = '';

		conversations.addMessage({ role: 'assistant', content: '', reasoning: '' });
		const messages = active.messages;
		const current = messages[messages.length - 1];

		// Build the request payload from the conversation so far.
		/** @type {Array<{role: string, content: string}>} */
		const payload = [];
		if (settings.systemPrompt.trim()) {
			payload.push({ role: 'system', content: settings.systemPrompt.trim() });
		}
		for (const m of messages.slice(0, -1)) {
			payload.push({ role: m.role, content: m.content });
		}

		controller = new AbortController();
		await scrollToBottom();

		try {
			await streamChat({
				messages: payload,
				model: settings.model,
				params: settings.samplingParams(),
				signal: controller.signal,
				onContent: (t) => {
					current.content += t;
					conversations.touch();
					scrollToBottom();
				},
				onReasoning: (t) => {
					current.reasoning = (current.reasoning || '') + t;
					conversations.touch();
					scrollToBottom();
				}
			});
			if (!current.reasoning) delete current.reasoning;
		} catch (e) {
			if (/** @type {Error} */ (e).name !== 'AbortError') {
				current.content += (current.content ? '\n\n' : '') + `⚠️ ${/** @type {Error} */ (e).message}`;
			}
			conversations.touch();
		} finally {
			generating = false;
			controller = null;
		}
	}

	function stop() {
		controller?.abort();
	}

	function regenerate() {
		const messages = active.messages;
		if (generating || messages.length === 0) return;
		// Drop the trailing assistant turn (if any) and re-run.
		if (messages[messages.length - 1].role === 'assistant') {
			messages.pop();
			conversations.touch();
		}
		if (messages.length && messages[messages.length - 1].role === 'user') {
			send_internal();
		}
	}
</script>

<div class="layout">
	<Sidebar open={sidebarOpen} onclose={() => (sidebarOpen = false)} />

	<main class="main">
		<header class="topbar">
			<button class="hamburger" onclick={() => (sidebarOpen = !sidebarOpen)} aria-label="Menu">
				☰
			</button>

			<select
				class="model-select"
				bind:value={settings.model}
				onchange={() => settings.save()}
				disabled={!models.length}
			>
				{#if !models.length}
					<option value="">No models found</option>
				{:else}
					{#each models as m (m)}
						<option value={m}>{m.split('/').pop()}</option>
					{/each}
				{/if}
			</select>

			<div class="spacer"></div>

			<button class="icon" title="Clear chat" onclick={() => conversations.clearActive()}>
				🗑
			</button>
			<button class="icon" title="Settings" onclick={() => (settingsOpen = true)}>⚙</button>
		</header>

		<div class="scroll" bind:this={scrollEl}>
			<div class="thread">
				{#if connectionError}
					<div class="banner">{connectionError}</div>
				{/if}

				{#if active.messages.length === 0}
					<div class="empty">
						<h1>mlx-lm chat</h1>
						<p>A simple web UI for your local mlx-lm server. Type a message to begin.</p>
					</div>
				{:else}
					{#each active.messages as message, i (i)}
						<Message
							{message}
							streaming={generating && i === active.messages.length - 1}
						/>
					{/each}
				{/if}
			</div>
		</div>

		<div class="composer">
			<div class="composer-inner">
				<textarea
					bind:this={inputEl}
					bind:value={input}
					oninput={autoGrow}
					onkeydown={onKeydown}
					placeholder="Send a message…"
					rows="1"
				></textarea>

				{#if generating}
					<button class="send stop" onclick={stop} title="Stop">■</button>
				{:else}
					<button
						class="send"
						onclick={send}
						disabled={!input.trim()}
						title="Send"
						aria-label="Send"
					>
						↑
					</button>
				{/if}
			</div>
			<div class="composer-foot">
				<button
					class="link"
					onclick={regenerate}
					disabled={generating || active.messages.length === 0}
				>
					↻ Regenerate
				</button>
				<span class="hint">Enter to send · Shift+Enter for newline</span>
			</div>
		</div>
	</main>
</div>

<Settings open={settingsOpen} onclose={() => (settingsOpen = false)} />

<style>
	.layout {
		display: flex;
		height: 100%;
		overflow: hidden;
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.topbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface-1);
	}
	.hamburger {
		display: none;
		background: none;
		border: none;
		color: var(--text-2);
		font-size: 1.2rem;
		cursor: pointer;
	}
	.model-select {
		background: var(--surface-3);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		color: var(--text-1);
		padding: 0.4rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
		max-width: 60vw;
	}
	.spacer {
		flex: 1;
	}
	.icon {
		background: none;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.35rem;
		border-radius: 0.4rem;
		filter: grayscale(0.3);
	}
	.icon:hover {
		background: var(--surface-3);
	}
	.scroll {
		flex: 1;
		overflow-y: auto;
	}
	.thread {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem 1.2rem 2rem;
	}
	.banner {
		background: color-mix(in srgb, var(--danger) 14%, transparent);
		border: 1px solid var(--danger);
		color: var(--text-1);
		padding: 0.7rem 0.9rem;
		border-radius: 0.6rem;
		margin: 1rem 0;
		font-size: 0.87rem;
	}
	.empty {
		text-align: center;
		color: var(--text-3);
		margin-top: 18vh;
	}
	.empty h1 {
		font-size: 1.5rem;
		color: var(--text-1);
		margin-bottom: 0.4rem;
	}
	.composer {
		border-top: 1px solid var(--border);
		background: var(--surface-1);
		padding: 0.8rem 1.2rem 1rem;
	}
	.composer-inner {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 0.9rem;
		padding: 0.5rem 0.5rem 0.5rem 0.8rem;
	}
	textarea {
		flex: 1;
		background: none;
		border: none;
		color: var(--text-1);
		font: inherit;
		resize: none;
		max-height: 200px;
		line-height: 1.5;
		padding: 0.25rem 0;
	}
	textarea:focus {
		outline: none;
	}
	.send {
		flex: 0 0 auto;
		width: 2.1rem;
		height: 2.1rem;
		border-radius: 0.7rem;
		border: none;
		background: var(--accent);
		color: var(--accent-contrast);
		font-size: 1.05rem;
		cursor: pointer;
		display: grid;
		place-items: center;
	}
	.send:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.send.stop {
		background: var(--danger);
		font-size: 0.8rem;
	}
	.composer-foot {
		max-width: 800px;
		margin: 0.5rem auto 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.link {
		background: none;
		border: none;
		color: var(--text-3);
		cursor: pointer;
		font-size: 0.8rem;
	}
	.link:hover:not(:disabled) {
		color: var(--text-1);
	}
	.link:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.hint {
		color: var(--text-3);
		font-size: 0.75rem;
	}

	@media (max-width: 760px) {
		.hamburger {
			display: block;
		}
		.hint {
			display: none;
		}
	}
</style>
