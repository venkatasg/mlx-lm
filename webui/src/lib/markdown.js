// Markdown rendering with syntax highlighting, sanitized for safe innerHTML.
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
// Use the core highlight.js build and register only a handful of common
// languages to keep the committed bundle small.
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

for (const [name, lang] of Object.entries({
	bash,
	c,
	cpp,
	csharp,
	css,
	go,
	java,
	javascript,
	json,
	markdown,
	python,
	rust,
	shell,
	sql,
	swift,
	typescript,
	xml,
	yaml
})) {
	hljs.registerLanguage(name, lang);
}

const marked = new Marked({
	breaks: true,
	gfm: true,
	renderer: {
		code({ text, lang }) {
			const language = lang && hljs.getLanguage(lang) ? lang : null;
			const highlighted = language
				? hljs.highlight(text, { language }).value
				: escapeHtml(text);
			const label = language || 'text';
			return (
				`<div class="code-block"><div class="code-head">` +
				`<span>${label}</span>` +
				`<button class="copy-btn" data-copy type="button">copy</button></div>` +
				`<pre><code class="hljs language-${label}">${highlighted}</code></pre></div>`
			);
		}
	}
});

/**
 * Render markdown to a sanitized HTML string.
 * @param {string} src
 * @returns {string}
 */
export function renderMarkdown(src) {
	const html = marked.parse(src ?? '', { async: false });
	return DOMPurify.sanitize(/** @type {string} */ (html), {
		ADD_ATTR: ['data-copy']
	});
}

/** @param {string} s */
function escapeHtml(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
