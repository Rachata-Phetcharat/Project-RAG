import { marked, Renderer } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// ── Highlight extension ───────────────────────────────────────────────────────
marked.use(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

// ── Custom renderer ───────────────────────────────────────────────────────────
const renderer = new Renderer();

// Wrap <pre><code> ด้วย .code-block + copy button header
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/`/g, "&#96;");

  return `
<div class="code-block">
  <div class="code-header">
    <span class="code-lang">${language}</span>
    <button
      class="copy-code-btn"
      data-code="${escaped}"
      onclick="
        const btn = this;
        navigator.clipboard.writeText(btn.dataset.code).then(() => {
          btn.classList.add('copied');
          btn.querySelector('.btn-label').textContent = 'copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('.btn-label').textContent = 'copy';
          }, 2000);
        });
      "
    >
      <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
        <rect width='14' height='14' x='8' y='8' rx='2' ry='2'/>
        <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/>
      </svg>
      <span class="btn-label">copy</span>
    </button>
  </div>
  <pre><code class="hljs language-${language}">${highlighted}</code></pre>
</div>`;
};

renderer.codespan = ({ text }) => `<code class="inline-code">${text}</code>`;

marked.use({ renderer, breaks: true });

// ── Composable ────────────────────────────────────────────────────────────────
export const useMarkdown = () => {
  const render = (text: string): string => marked.parse(text) as string;
  return { render };
};
