// Persisted UI + sampling settings, exposed as a Svelte 5 rune store.

const STORAGE_KEY = 'mlx-lm-webui:settings:v1';

const DEFAULTS = {
	model: '',
	systemPrompt: '',
	temperature: 0.7,
	top_p: 1.0,
	top_k: 0,
	max_tokens: 1024,
	repetition_penalty: 1.0,
	theme: /** @type {'system' | 'light' | 'dark'} */ ('system')
};

class SettingsStore {
	model = $state(DEFAULTS.model);
	systemPrompt = $state(DEFAULTS.systemPrompt);
	temperature = $state(DEFAULTS.temperature);
	top_p = $state(DEFAULTS.top_p);
	top_k = $state(DEFAULTS.top_k);
	max_tokens = $state(DEFAULTS.max_tokens);
	repetition_penalty = $state(DEFAULTS.repetition_penalty);
	theme = $state(DEFAULTS.theme);

	constructor() {
		if (typeof localStorage !== 'undefined') {
			try {
				const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
				for (const key of Object.keys(DEFAULTS)) {
					if (saved[key] !== undefined) this[key] = saved[key];
				}
			} catch {
				/* ignore malformed settings */
			}
		}
	}

	/** Sampling parameters to send with a chat completion request. */
	samplingParams() {
		return {
			temperature: this.temperature,
			top_p: this.top_p,
			top_k: this.top_k,
			max_tokens: this.max_tokens,
			repetition_penalty: this.repetition_penalty
		};
	}

	save() {
		if (typeof localStorage === 'undefined') return;
		const snapshot = {};
		for (const key of Object.keys(DEFAULTS)) snapshot[key] = this[key];
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			/* ignore */
		}
	}

	reset() {
		for (const [key, value] of Object.entries(DEFAULTS)) {
			if (key === 'model') continue; // keep the selected model
			this[key] = value;
		}
		this.save();
	}
}

export const settings = new SettingsStore();
