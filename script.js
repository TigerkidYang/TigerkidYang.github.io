const entries = [
  {
    type: "page",
    slug: "about",
    title: "about",
    date: "2026-04-24",
    body: `
      <h1>about</h1>
      <p class="meta">page / updated 2026-04-24</p>
      <p>这里是 Tigerkid Yang 的个人博客。现在它先以一个终端界面的方式存在：页面像目录，文章像文件，阅读像在 shell 里探索。</p>
      <h2>what this site is for</h2>
      <ul>
        <li>记录数学、编程、交易、阅读和一些长期想法。</li>
        <li>把个人主页做得轻一点、怪一点，但仍然好读。</li>
        <li>保留可点击入口，不强迫访客真的记命令。</li>
      </ul>
    `,
  },
  {
    type: "post",
    slug: "hello-terminal-blog",
    title: "hello-terminal-blog.md",
    date: "2026-04-24",
    body: `
      <h1>hello-terminal-blog.md</h1>
      <p class="meta">post / 2026-04-24</p>
      <p>第一篇占位文章。这个博客的基本想法是：把主页做成一个可以探索的终端，<code>ls</code> 能看到所有入口，点击文件名就能打开内容。</p>
      <h2>next</h2>
      <p>后面可以把文章从这里的内联数据迁移成 Markdown，再用脚本生成静态页面。现在先保持简单，方便快速迭代视觉和交互。</p>
    `,
  },
  {
    type: "page",
    slug: "projects",
    title: "projects",
    date: "2026-04-24",
    body: `
      <h1>projects</h1>
      <p class="meta">page / updated 2026-04-24</p>
      <ul>
        <li><a class="link-command" href="https://github.com/TigerkidYang/HackerCNews" target="_blank" rel="noreferrer">HackerCNews</a></li>
      </ul>
    `,
  },
];

const commands = new Map();
const output = document.querySelector("#output");
const terminal = document.querySelector("#terminal");
const form = document.querySelector("#command-form");
const input = document.querySelector("#command-input");
const clock = document.querySelector("#clock");
const history = [];
let historyIndex = 0;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function scrollToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

function createBlock(commandText, html) {
  const block = document.createElement("section");
  block.className = "command-block";
  block.innerHTML = `
    <div class="command-echo">${escapeHtml(commandText)}</div>
    <div>${html}</div>
  `;
  output.append(block);
  bindCommandButtons(block);
  scrollToBottom();
}

function renderList() {
  const rows = entries
    .map(
      (entry) => `
        <li class="terminal-row">
          <span class="mode">${entry.type === "post" ? "-rw-r--r--" : "drwxr-xr-x"}</span>
          <span class="date">${entry.date}</span>
          <button class="link-command name" data-open="${entry.slug}">${entry.title}</button>
        </li>
      `,
    )
    .join("");

  return `
    <ul class="terminal-list">
      ${rows}
    </ul>
  `;
}

function renderHelp() {
  return `
    <ul class="terminal-list">
      <li><button class="link-command" data-command="ls">ls</button> - list pages and posts</li>
      <li><button class="link-command" data-command="open about">open about</button> - read a page or post</li>
      <li><button class="link-command" data-command="whoami">whoami</button> - show site owner</li>
      <li><button class="link-command" data-command="clear">clear</button> - clear the terminal</li>
    </ul>
  `;
}

function openEntry(slug, commandText = `open ${slug}`) {
  const entry = entries.find((item) => item.slug === slug || item.title === slug);

  if (!entry) {
    createBlock(
      commandText,
      `<p class="error">No such page: ${escapeHtml(slug)}. Try <button class="link-command" data-command="ls">ls</button>.</p>`,
    );
    return;
  }

  createBlock(commandText, `<article class="article">${entry.body}</article>`);
}

commands.set("help", () => createBlock("help", renderHelp()));
commands.set("ls", () => createBlock("ls", renderList()));
commands.set("whoami", () =>
  createBlock(
    "whoami",
    "<p>Tigerkid Yang. Math student, builder, and owner of this tiny terminal-shaped corner of the web.</p>",
  ),
);
commands.set("clear", () => {
  output.innerHTML = "";
  scrollToBottom();
});

function runCommand(rawValue) {
  const value = rawValue.trim();

  if (!value) {
    return;
  }

  history.push(value);
  historyIndex = history.length;

  const [name, ...args] = value.split(/\s+/);
  const normalized = name.toLowerCase();

  if (normalized === "open" || normalized === "cat") {
    openEntry(args.join(" "), value);
    return;
  }

  if (normalized === "cd") {
    const target = args.join(" ");
    createBlock(
      value,
      `<p><code>cd</code> is cosmetic here. Opening ${escapeHtml(target || "nothing")} instead.</p>`,
    );
    if (target) {
      openEntry(target, `open ${target}`);
    }
    return;
  }

  const command = commands.get(normalized);

  if (command) {
    command();
    return;
  }

  createBlock(
    value,
    `<p class="error">Command not found: ${escapeHtml(name)}. Try <button class="link-command" data-command="help">help</button>.</p>`,
  );
}

function bindCommandButtons(root = document) {
  root.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => runCommand(button.dataset.command));
  });

  root.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openEntry(button.dataset.open));
  });
}

function updateClock() {
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCommand(input.value);
  input.value = "";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex] ?? "";
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    input.value = history[historyIndex] ?? "";
  }
});

document.addEventListener("click", () => input.focus());

bindCommandButtons();
updateClock();
setInterval(updateClock, 30_000);
runCommand("ls");
