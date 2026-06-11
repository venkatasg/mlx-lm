<script>
	import { conversations } from '$lib/storage.svelte.js';

	/** @type {{ open: boolean, onclose?: () => void }} */
	let { open, onclose } = $props();
</script>

<aside class="sidebar" class:open>
	<div class="sidebar-head">
		<span class="brand">mlx-lm</span>
		<button class="icon-btn" title="New chat" onclick={() => conversations.newConversation()}>
			＋
		</button>
	</div>

	<nav class="convo-list">
		{#each conversations.conversations as convo (convo.id)}
			<div class="convo-row" class:active={convo.id === conversations.activeId}>
				<button
					class="convo-btn"
					onclick={() => {
						conversations.select(convo.id);
						onclose?.();
					}}
				>
					{convo.title || 'New chat'}
				</button>
				<button
					class="del-btn"
					title="Delete conversation"
					onclick={() => conversations.remove(convo.id)}
				>
					✕
				</button>
			</div>
		{/each}
	</nav>

	<div class="sidebar-foot">
		<a href="https://github.com/ml-explore/mlx-lm" target="_blank" rel="noreferrer">
			github.com/ml-explore/mlx-lm
		</a>
	</div>
</aside>

<style>
	.sidebar {
		width: 260px;
		flex: 0 0 260px;
		background: var(--surface-1);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.sidebar-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1rem;
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.icon-btn {
		background: var(--surface-3);
		border: 1px solid var(--border);
		color: var(--text-1);
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 0.5rem;
		font-size: 1.1rem;
		cursor: pointer;
		line-height: 1;
	}
	.icon-btn:hover {
		background: var(--surface-4);
	}
	.convo-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}
	.convo-row {
		display: flex;
		align-items: center;
		border-radius: 0.5rem;
	}
	.convo-row.active {
		background: var(--surface-3);
	}
	.convo-row:hover {
		background: var(--surface-3);
	}
	.convo-btn {
		flex: 1;
		text-align: left;
		background: none;
		border: none;
		color: var(--text-2);
		padding: 0.55rem 0.6rem;
		font-size: 0.88rem;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.convo-row.active .convo-btn {
		color: var(--text-1);
	}
	.del-btn {
		background: none;
		border: none;
		color: var(--text-3);
		cursor: pointer;
		padding: 0 0.6rem;
		font-size: 0.75rem;
		opacity: 0;
	}
	.convo-row:hover .del-btn {
		opacity: 1;
	}
	.del-btn:hover {
		color: var(--danger);
	}
	.sidebar-foot {
		padding: 0.8rem 1rem;
		border-top: 1px solid var(--border);
		font-size: 0.72rem;
	}
	.sidebar-foot a {
		color: var(--text-3);
		text-decoration: none;
	}
	.sidebar-foot a:hover {
		color: var(--text-2);
	}

	@media (max-width: 760px) {
		.sidebar {
			position: fixed;
			z-index: 30;
			transform: translateX(-100%);
			transition: transform 0.2s ease;
			box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
		}
		.sidebar.open {
			transform: translateX(0);
		}
	}
</style>
