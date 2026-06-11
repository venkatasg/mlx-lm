// Reactive conversation store backed by localStorage.
//
// Conversations persist across reloads so the UI is useful as a lightweight
// scratchpad. State is exposed through Svelte 5 runes.

const STORAGE_KEY = 'mlx-lm-webui:conversations:v1';

/** @typedef {{ role: 'user' | 'assistant', content: string, reasoning?: string }} Message */
/** @typedef {{ id: string, title: string, messages: Message[], createdAt: number }} Conversation */

function uid() {
	return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** @returns {Conversation} */
function emptyConversation() {
	return { id: uid(), title: 'New chat', messages: [], createdAt: Date.now() };
}

class ConversationStore {
	/** @type {Conversation[]} */
	conversations = $state([]);
	/** @type {string | null} */
	activeId = $state(null);

	constructor() {
		this.#load();
		if (this.conversations.length === 0) {
			this.newConversation();
		} else {
			this.activeId = this.conversations[0].id;
		}
	}

	/** @returns {Conversation} */
	get active() {
		return (
			this.conversations.find((c) => c.id === this.activeId) ?? this.conversations[0]
		);
	}

	newConversation() {
		const convo = emptyConversation();
		this.conversations = [convo, ...this.conversations];
		this.activeId = convo.id;
		this.#save();
		return convo;
	}

	/** @param {string} id */
	select(id) {
		this.activeId = id;
	}

	/** @param {string} id */
	remove(id) {
		this.conversations = this.conversations.filter((c) => c.id !== id);
		if (this.conversations.length === 0) {
			this.newConversation();
		} else if (this.activeId === id) {
			this.activeId = this.conversations[0].id;
		}
		this.#save();
	}

	/** @param {Message} message */
	addMessage(message) {
		const convo = this.active;
		convo.messages.push(message);
		if (convo.messages.length === 1 && message.role === 'user') {
			convo.title = message.content.slice(0, 40) || 'New chat';
		}
		this.#save();
	}

	/** Persist any in-place edits to the active conversation's messages. */
	touch() {
		this.#save();
	}

	clearActive() {
		const convo = this.active;
		convo.messages = [];
		convo.title = 'New chat';
		this.#save();
	}

	#load() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) this.conversations = JSON.parse(raw);
		} catch {
			this.conversations = [];
		}
	}

	#save() {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
		} catch {
			/* storage may be full or unavailable; ignore */
		}
	}
}

export const conversations = new ConversationStore();
