import { marked, Renderer } from "marked";
import hljs from "highlight.js";

const renderer = new Renderer();

renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;

  const escapedForAttr = text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/`/g, "&#96;");

  return `
<div class="code-block" style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin:1rem 0;max-width:100%;min-width:0;box-sizing:border-box;">
  <div class="code-header" style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
    <span class="code-lang" style="font-size:12.5px;color:#64748b;font-family:monospace;font-weight:500;">${language}</span>
    <button
      class="copy-code-btn"
      data-code="${escapedForAttr}"
      style="display:flex;align-items:center;gap:5px;font-size:12px;color:#64748b;background:none;border:1px solid #cbd5e1;padding:3px 10px;border-radius:6px;cursor:pointer;"
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
  <pre style="margin:0;padding:16px 18px;background:#f8fafc;overflow-x:auto;max-width:100%;min-width:0;box-sizing:border-box;word-break:keep-all;"><code class="hljs language-${language}" style="font-family:'JetBrains Mono','Fira Code','Consolas',monospace;font-size:14.5px;line-height:1.7;background:none;padding:0;">${highlighted}</code></pre>
</div>`;
};

renderer.codespan = ({ text }) => `<code class="inline-code">${text}</code>`;

marked.use({ renderer, breaks: true });

export const useMarkdown = () => {
  const render = (text: string): string => marked.parse(text) as string;
  return { render };
};
