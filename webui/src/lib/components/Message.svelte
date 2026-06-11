<script>
	import { renderMarkdown } from '$lib/markdown.js';

	/**
	 * @typedef {{ role: 'user' | 'assistant', content: string, reasoning?: string }} Message
	 * @type {{ message: Message, streaming?: boolean }}
	 */
	let { message, streaming = false } = $props();

	let showReasoning = $state(true);

	const rendered = $derived(
		message.role === 'assistant' ? renderMarkdown(message.content) : null
	);

	/** Copy-to-clipboard for code blocks (event delegation). */
	function handleClick(/** @type {MouseEvent} */ event) {
		const target = /** @type {HTMLElement} */ (event.target);
		const btn = target.closest('[data-copy]');
		if (!btn) return;
		const code = btn.closest('.code-block')?.querySelector('code')?.textContent ?? '';
		navigator.clipboard?.writeText(code);
		const prev = btn.textContent;
		btn.textContent = 'copied';
		setTimeout(() => (btn.textContent = prev), 1200);
	}
</script>

<div class="msg {message.role}">
	<div class="avatar">{message.role === 'user' ? 'You' : 'AI'}</div>
	<div class="body">
		{#if message.reasoning}
			<div class="reasoning">
				<button class="reasoning-toggle" onclick={() => (showReasoning = !showReasoning)}>
					<span class="chev" class:open={showReasoning}>▸</span>
					Reasoning
				</button>
				{#if showReasoning}
					<div class="reasoning-text">{message.reasoning}</div>
				{/if}
			</div>
		{/if}

		{#if message.role === 'assistant'}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="markdown" onclick={handleClick} role="presentation">{@html rendered}</div>
			{#if streaming && !message.content}
				<span class="cursor">▋</span>
			{/if}
		{:else}
			<div class="user-text">{message.content}</div>
		{/if}
	</div>
</div>

<style>
	.msg {
		display: flex;
		gap: 0.85rem;
		padding: 1.1rem 0;
		align-items: flex-start;
	}
	.avatar {
		flex: 0 0 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		display: grid;
		place-items: center;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--accent-contrast);
		background: var(--accent);
	}
	.msg.user .avatar {
		background: var(--surface-3);
		color: var(--text-2);
	}
	.body {
		min-width: 0;
		flex: 1;
		padding-top: 0.15rem;
	}
	.user-text {
		white-space: pre-wrap;
		word-break: break-word;
	}
	.reasoning {
		margin-bottom: 0.6rem;
		border-left: 2px solid var(--border);
		padding-left: 0.7rem;
	}
	.reasoning-toggle {
		background: none;
		border: none;
		color: var(--text-3);
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.chev {
		display: inline-block;
		transition: transform 0.15s ease;
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.reasoning-text {
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--text-3);
		white-space: pre-wrap;
		word-break: break-word;
	}
	.cursor {
		color: var(--accent);
		animation: blink 1s steps(2) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
