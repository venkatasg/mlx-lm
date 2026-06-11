<script>
	import { settings } from '$lib/settings.svelte.js';

	/** @type {{ open: boolean, onclose: () => void }} */
	let { open, onclose } = $props();

	/** @param {Event} e @param {string} key */
	function num(e, key) {
		settings[key] = Number(/** @type {HTMLInputElement} */ (e.target).value);
		settings.save();
	}
</script>

{#if open}
	<div
		class="scrim"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
		role="button"
		tabindex="-1"
		aria-label="Close settings"
	></div>
	<div class="panel" role="dialog" aria-label="Settings">
		<header>
			<h2>Settings</h2>
			<button class="close" onclick={onclose} aria-label="Close">✕</button>
		</header>

		<label class="field">
			<span>System prompt</span>
			<textarea
				rows="3"
				placeholder="Optional. Sets the assistant's behavior."
				bind:value={settings.systemPrompt}
				onchange={() => settings.save()}
			></textarea>
		</label>

		<div class="field">
			<div class="slider-head">
				<span>Temperature</span>
				<code>{settings.temperature.toFixed(2)}</code>
			</div>
			<input
				type="range"
				min="0"
				max="2"
				step="0.05"
				value={settings.temperature}
				oninput={(e) => num(e, 'temperature')}
			/>
		</div>

		<div class="field">
			<div class="slider-head">
				<span>Top-p</span>
				<code>{settings.top_p.toFixed(2)}</code>
			</div>
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={settings.top_p}
				oninput={(e) => num(e, 'top_p')}
			/>
		</div>

		<div class="field">
			<div class="slider-head">
				<span>Top-k</span>
				<code>{settings.top_k}</code>
			</div>
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				value={settings.top_k}
				oninput={(e) => num(e, 'top_k')}
			/>
		</div>

		<div class="field">
			<div class="slider-head">
				<span>Repetition penalty</span>
				<code>{settings.repetition_penalty.toFixed(2)}</code>
			</div>
			<input
				type="range"
				min="1"
				max="2"
				step="0.01"
				value={settings.repetition_penalty}
				oninput={(e) => num(e, 'repetition_penalty')}
			/>
		</div>

		<label class="field">
			<span>Max tokens</span>
			<input
				type="number"
				min="1"
				max="32768"
				value={settings.max_tokens}
				onchange={(e) => num(e, 'max_tokens')}
			/>
		</label>

		<label class="field">
			<span>Theme</span>
			<select bind:value={settings.theme} onchange={() => settings.save()}>
				<option value="system">System</option>
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>
		</label>

		<button class="reset" onclick={() => settings.reset()}>Reset to defaults</button>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 40;
	}
	.panel {
		position: fixed;
		top: 0;
		right: 0;
		height: 100%;
		width: min(360px, 90vw);
		background: var(--surface-1);
		border-left: 1px solid var(--border);
		z-index: 41;
		padding: 1.2rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h2 {
		font-size: 1.05rem;
		margin: 0;
	}
	.close {
		background: none;
		border: none;
		color: var(--text-3);
		cursor: pointer;
		font-size: 0.9rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--text-2);
	}
	.slider-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.slider-head code {
		color: var(--text-1);
		background: var(--surface-3);
		padding: 0.05rem 0.4rem;
		border-radius: 0.3rem;
		font-size: 0.78rem;
	}
	textarea,
	input[type='number'],
	select {
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		color: var(--text-1);
		padding: 0.5rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
		resize: vertical;
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
	}
	.reset {
		margin-top: auto;
		background: var(--surface-3);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		color: var(--text-2);
		padding: 0.55rem;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.reset:hover {
		background: var(--surface-4);
		color: var(--text-1);
	}
</style>
