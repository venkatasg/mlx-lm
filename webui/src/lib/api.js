// Thin client for the mlx-lm OpenAI-compatible HTTP server.
//
// All requests are made against the same origin the UI is served from, so the
// bundle works unchanged whether it is served by `mlx_lm.server` or proxied by
// the Vite dev server.

/**
 * Fetch the list of locally available models from `/v1/models`.
 * @returns {Promise<string[]>} model ids, newest first
 */
export async function listModels() {
	const res = await fetch('/v1/models', {
		headers: { 'Content-Type': 'application/json' }
	});
	if (!res.ok) {
		throw new Error(`Failed to list models (${res.status})`);
	}
	const body = await res.json();
	const data = Array.isArray(body?.data) ? body.data : [];
	return data.map((m) => m.id).filter(Boolean);
}

/** @returns {Promise<boolean>} whether the server is reachable. */
export async function checkHealth() {
	try {
		const res = await fetch('/health');
		return res.ok;
	} catch {
		return false;
	}
}

/**
 * Stream a chat completion from `/v1/chat/completions`.
 *
 * The callbacks are invoked incrementally as tokens arrive. `reasoning_content`
 * deltas (and any text wrapped in <think>...</think>) are surfaced separately
 * from the visible answer so the UI can render a collapsible thinking block.
 *
 * @param {object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string} [opts.model]
 * @param {Record<string, unknown>} [opts.params] extra sampling parameters
 * @param {AbortSignal} [opts.signal]
 * @param {(text: string) => void} [opts.onContent]
 * @param {(text: string) => void} [opts.onReasoning]
 * @returns {Promise<{usage: object | null}>}
 */
export async function streamChat({ messages, model, params = {}, signal, onContent, onReasoning }) {
	const res = await fetch('/v1/chat/completions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		signal,
		body: JSON.stringify({
			model: model || undefined,
			messages,
			stream: true,
			stream_options: { include_usage: true },
			...params
		})
	});

	if (!res.ok || !res.body) {
		let detail = `request failed (${res.status})`;
		try {
			const err = await res.json();
			if (err?.error) detail = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
		} catch {
			/* keep default detail */
		}
		throw new Error(detail);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	const thinking = createThinkSplitter();
	let buffer = '';
	let usage = null;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		// Server-sent events are separated by a blank line.
		let sep;
		while ((sep = buffer.indexOf('\n\n')) !== -1) {
			const rawEvent = buffer.slice(0, sep);
			buffer = buffer.slice(sep + 2);

			for (const line of rawEvent.split('\n')) {
				if (!line.startsWith('data:')) continue;
				const data = line.slice(5).trim();
				if (data === '' || data === '[DONE]') continue;

				let chunk;
				try {
					chunk = JSON.parse(data);
				} catch {
					continue;
				}

				if (chunk.usage) usage = chunk.usage;
				const delta = chunk.choices?.[0]?.delta ?? {};

				if (delta.reasoning_content) {
					onReasoning?.(delta.reasoning_content);
				}
				if (delta.content) {
					for (const piece of thinking.push(delta.content)) {
						if (piece.kind === 'reasoning') onReasoning?.(piece.text);
						else onContent?.(piece.text);
					}
				}
			}
		}
	}

	return { usage };
}

/**
 * Incrementally splits a token stream into visible content and reasoning,
 * peeling out any text wrapped in <think>...</think> tags. Returns the pieces
 * decoded so far on every `push`.
 */
function createThinkSplitter() {
	const OPEN = '<think>';
	const CLOSE = '</think>';
	let pending = '';
	let inThink = false;

	return {
		/**
		 * @param {string} text
		 * @returns {Array<{kind: 'content' | 'reasoning', text: string}>}
		 */
		push(text) {
			pending += text;
			const out = [];
			while (pending.length) {
				const tag = inThink ? CLOSE : OPEN;
				const idx = pending.indexOf(tag);
				if (idx === -1) {
					// Hold back a possible partial tag straddling the chunk boundary.
					const keep = maxTagPrefix(pending, tag);
					const emit = pending.slice(0, pending.length - keep);
					if (emit) out.push({ kind: inThink ? 'reasoning' : 'content', text: emit });
					pending = pending.slice(pending.length - keep);
					break;
				}
				const emit = pending.slice(0, idx);
				if (emit) out.push({ kind: inThink ? 'reasoning' : 'content', text: emit });
				pending = pending.slice(idx + tag.length);
				inThink = !inThink;
			}
			return out;
		}
	};
}

/** Length of the longest suffix of `s` that is a proper prefix of `tag`. */
function maxTagPrefix(s, tag) {
	const max = Math.min(s.length, tag.length - 1);
	for (let n = max; n > 0; n--) {
		if (tag.startsWith(s.slice(s.length - n))) return n;
	}
	return 0;
}
