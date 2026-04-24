const filesystem = {
  type: "dir",
  name: "~",
  children: [
    {
      type: "page",
      name: "about",
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
      type: "dir",
      name: "notes",
      date: "2026-04-24",
      children: [
        {
          type: "dir",
          name: "math",
          date: "2026-04-24",
          children: [
            {
              type: "post",
              name: "linear-algebra.md",
              date: "2026-04-24",
              body: `
                <h1>linear-algebra.md</h1>
                <p class="meta">post / 2026-04-24 / notes/math</p>
                <p>这里先放一篇数学笔记占位。以后可以把一整组数学内容放进 <code>notes/math/</code>，目录会自然显示出来。</p>
              `,
            },
          ],
        },
        {
          type: "post",
          name: "hello-terminal-blog.md",
          date: "2026-04-24",
          body: `
            <h1>hello-terminal-blog.md</h1>
            <p class="meta">post / 2026-04-24 / notes</p>
            <p>第一篇占位文章。这个博客的基本想法是：把主页做成一个可以探索的终端，<code>ls</code> 能看到所有入口，点击文件名就能打开内容。</p>
            <h2>next</h2>
            <p>后面可以把文章从这里的内联数据迁移成 Markdown，再用脚本生成静态页面。现在先保持简单，方便快速迭代视觉和交互。</p>
          `,
        },
      ],
    },
    {
      type: "dir",
      name: "projects",
      date: "2026-04-24",
      children: [
        {
          type: "page",
          name: "HackerCNews",
          date: "2026-04-24",
          body: `
            <h1>HackerCNews</h1>
            <p class="meta">project / updated 2026-04-24 / projects</p>
            <p><a class="link-command" href="https://github.com/TigerkidYang/HackerCNews" target="_blank" rel="noreferrer">Open the GitHub repository</a></p>
          `,
        },
      ],
    },
  ],
};

const commands = new Map();
const output = document.querySelector("#output");
const terminal = document.querySelector("#terminal");
const form = document.querySelector("#command-form");
const input = document.querySelector("#command-input");
const promptLabel = document.querySelector(".prompt");
const clock = document.querySelector("#clock");
const history = [];
let historyIndex = 0;
let currentPath = [];

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

function displayPath(path = currentPath) {
  return path.length ? `~/${path.join("/")}` : "~";
}

function updatePrompt() {
  promptLabel.textContent = `visitor@site:${displayPath()}$`;
}

function scrollToTop() {
  terminal.scrollTop = 0;
}

function renderScreen(commandText, html) {
  const block = document.createElement("section");
  block.className = "command-block";
  block.innerHTML = `
    <div class="command-echo"><span class="echo-prompt">visitor@site:${escapeHtml(displayPath())}$</span> ${escapeHtml(commandText)}</div>
    <div>${html}</div>
  `;
  output.replaceChildren(block);
  bindCommandButtons(block);
  updatePrompt();
  scrollToTop();
}

function getNode(path = currentPath) {
  let node = filesystem;

  for (const part of path) {
    node = node.children?.find((child) => child.name === part);
    if (!node) {
      return null;
    }
  }

  return node;
}

function normalizePath(target) {
  if (!target || target === ".") {
    return [...currentPath];
  }

  const parts = target.startsWith("~/")
    ? target.slice(2).split("/")
    : target.split("/");
  const nextPath = target.startsWith("~/") || target.startsWith("/")
    ? []
    : [...currentPath];

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (!part || part === ".") {
      continue;
    }

    if (part === "~") {
      nextPath.length = 0;
      continue;
    }

    if (part === "..") {
      nextPath.pop();
      continue;
    }

    nextPath.push(part);
  }

  return nextPath;
}

function resolveEntry(target) {
  const path = normalizePath(target);
  const node = getNode(path);
  return { node, path };
}

function fileMode(entry) {
  return entry.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
}

function renderList() {
  const directory = getNode();
  const parentRow = currentPath.length
    ? `
      <li class="terminal-row">
        <span class="mode">drwxr-xr-x</span>
        <span class="date">parent</span>
        <button class="link-command name" data-cd="..">../</button>
      </li>
    `
    : "";

  const rows = directory.children
    .map((entry) => {
      const displayName = entry.type === "dir" ? `${entry.name}/` : entry.name;
      const action = entry.type === "dir" ? `data-cd="${entry.name}"` : `data-open="${entry.name}"`;

      return `
        <li class="terminal-row">
          <span class="mode">${fileMode(entry)}</span>
          <span class="date">${entry.date}</span>
          <button class="link-command name" ${action}>${displayName}</button>
        </li>
      `;
    })
    .join("");

  return `
    <p class="meta">Directory: ${escapeHtml(displayPath())}</p>
    <ul class="terminal-list">
      ${parentRow}
      ${rows}
    </ul>
  `;
}

function renderHelp() {
  return `
    <ul class="terminal-list">
      <li><button class="link-command" data-command="ls">ls</button> - list current directory</li>
      <li><button class="link-command" data-command="cd notes">cd notes</button> - enter a directory</li>
      <li><button class="link-command" data-command="cd ..">cd ..</button> - go up one directory</li>
      <li><button class="link-command" data-command="open notes/hello-terminal-blog.md">open &lt;file&gt;</button> - read a page or post by name or path</li>
      <li><button class="link-command" data-command="pwd">pwd</button> - show current path</li>
      <li><button class="link-command" data-command="whoami">whoami</button> - show site owner</li>
      <li><button class="link-command" data-command="clear">clear</button> - clear the screen</li>
    </ul>
  `;
}

function showDirectory(commandText = "ls") {
  renderScreen(commandText, renderList());
}

function changeDirectory(target, commandText = `cd ${target}`) {
  const { node, path } = resolveEntry(target);

  if (!node) {
    renderScreen(
      commandText,
      `<p class="error">No such directory: ${escapeHtml(target)}. Try <button class="link-command" data-command="ls">ls</button>.</p>`,
    );
    return;
  }

  if (node.type !== "dir") {
    openEntry(target, `open ${target}`);
    return;
  }

  currentPath = path;
  showDirectory(commandText);
}

function openEntry(target, commandText = `open ${target}`) {
  const { node, path } = resolveEntry(target);

  if (!node) {
    renderScreen(
      commandText,
      `<p class="error">No such file: ${escapeHtml(target)}. Try <button class="link-command" data-command="ls">ls</button>.</p>`,
    );
    return;
  }

  if (node.type === "dir") {
    currentPath = path;
    showDirectory(`cd ${target}`);
    return;
  }

  const parentPath = path.slice(0, -1);
  const parentTarget = parentPath.length ? `~/${parentPath.join("/")}` : "~";
  renderScreen(
    commandText,
    `<article class="article">${node.body}<p><button class="link-command" data-cd="${parentTarget}">back to ${escapeHtml(displayPath(parentPath))}</button></p></article>`,
  );
}

commands.set("help", () => renderScreen("help", renderHelp()));
commands.set("ls", () => showDirectory("ls"));
commands.set("pwd", () => renderScreen("pwd", `<p>${escapeHtml(displayPath())}</p>`));
commands.set("whoami", () =>
  renderScreen(
    "whoami",
    "<p>Tigerkid Yang. Math student, builder, and owner of this tiny terminal-shaped corner of the web.</p>",
  ),
);
commands.set("clear", () => {
  output.innerHTML = "";
  updatePrompt();
  scrollToTop();
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
  const target = args.join(" ");

  if (normalized === "open" || normalized === "cat") {
    openEntry(target, value);
    return;
  }

  if (normalized === "cd") {
    changeDirectory(target || "~", value);
    return;
  }

  const command = commands.get(normalized);

  if (command) {
    command();
    return;
  }

  renderScreen(
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

  root.querySelectorAll("[data-cd]").forEach((button) => {
    button.addEventListener("click", () => changeDirectory(button.dataset.cd));
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
updatePrompt();
updateClock();
setInterval(updateClock, 30_000);
showDirectory("ls");
