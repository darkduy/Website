const state = {
  scripts: [],
  search: "",
  game: "all"
};
const $ = id => document.getElementById(id);
function escapeHTML(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]
  );
}
function render() {
  const query = state.search.trim().toLowerCase();
  const filtered = state.scripts.filter(script => {
    const matchesGame =
      state.game === "all" ||
      script.game === state.game;
    const text = `
      ${script.name}
      ${script.game}
      ${script.source}
    `.toLowerCase();
    return matchesGame &&
      (!query || text.includes(query));
  });
  $("scriptCount").textContent =
    state.scripts.length;
  $("gameCount").textContent =
    new Set(
      state.scripts.map(s => s.game)
    ).size;
  $("status").textContent =
    `${filtered.length} script${
      filtered.length === 1 ? "" : "s"
    } được hiển thị`;
  $("scriptGrid").innerHTML =
    filtered.map(script => {
      const index =
        state.scripts.indexOf(script);
      return `
        <article class="card">
          <span class="game">
            ${escapeHTML(script.game)}
          </span>
          <h3>
            ${escapeHTML(script.name)}
          </h3>
          <div class="source">
            <span>Nguồn:</span>
            ${escapeHTML(script.source)}
          </div>
          <div class="card-actions">
            <button
              class="secondary-btn"
              onclick="openScript(${index})">
              👁 Xem
            </button>
            <button
              class="secondary-btn"
              onclick="copyScript(${index})">
              📋 Copy
            </button>
            <a
              class="secondary-btn"
              href="${escapeHTML(script.sourceUrl)}"
              target="_blank"
              rel="noopener noreferrer">
              🔗 Nguồn
            </a>
          </div>
        </article>
      `;
    })
    .join("");
  $("empty").classList.toggle(
    "hidden",
    filtered.length !== 0
  );
}
function loadGames() {
  const games = [
    ...new Set(
      state.scripts.map(s => s.game)
    )
  ].sort();
  $("gameFilter").innerHTML =
    `<option value="all">
      Tất cả game
    </option>` +
    games.map(game =>
      `<option value="${escapeHTML(game)}">
        ${escapeHTML(game)}
      </option>`
    ).join("");
}
async function getScriptContent(script) {
  const response = await fetch(
    `./${script.file}`,
    {
      cache: "no-store"
    }
  );
  if (!response.ok) {
    throw new Error(
      `Không thể tải ${script.file}`
    );
  }
  return await response.text();
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea =
      document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  $("toast").classList.add("show");
  setTimeout(() => {
    $("toast").classList.remove("show");
  }, 1800);
}
window.copyScript = async function(index) {
  const script =
    state.scripts[index];
  try {
    const content =
      await getScriptContent(script);
    await copyText(content);
  } catch (error) {
    console.error(error);
    alert("Không thể tải script.");
  }
};
window.openScript = async function(index) {
  const script =
    state.scripts[index];
  $("modalGame").textContent =
    script.game;
  $("modalTitle").textContent =
    script.name;
  $("modalDescription").textContent =
    "Nguồn: " + script.source;
  $("modalCode").textContent =
    "Đang tải script...";
  $("modal").classList.remove("hidden");
  document.body.style.overflow =
    "hidden";
  try {
    const content =
      await getScriptContent(script);
    $("modalCode").textContent =
      content;
  } catch (error) {
    console.error(error);
    $("modalCode").textContent =
      "⚠️ Không thể tải script.";
  }
};
function closeModal() {
  $("modal").classList.add("hidden");
  document.body.style.overflow = "";
}
$("closeModal").addEventListener(
  "click",
  closeModal
);
$("modalBackdrop").addEventListener(
  "click",
  closeModal
);
document.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      closeModal();
    }
  }
);
$("copyModal").addEventListener(
  "click",
  () => {
    copyText(
      $("modalCode").textContent
    );
  }
);
$("search").addEventListener(
  "input",
  event => {
    state.search =
      event.target.value;
    render();
  }
);
$("gameFilter").addEventListener(
  "change",
  event => {
    state.game =
      event.target.value;
    render();
  }
);
$("themeBtn").addEventListener(
  "click",
  () => {
    document.body.classList.toggle(
      "light"
    );
  }
);
async function loadScripts() {
  try {
    const response =
      await fetch(
        "./scripts/scripts.json",
        {
          cache: "no-store"
        }
      );
    if (!response.ok) {
      throw new Error(
        "Không thể tải scripts.json"
      );
    }
    const data =
      await response.json();
    if (!Array.isArray(data)) {
      throw new Error(
        "scripts.json không hợp lệ"
      );
    }
    state.scripts = data;
    loadGames();
    render();
  } catch (error) {
    console.error(error);
    $("status").textContent =
      "⚠️ Không thể tải scripts.json";
  }
}
$("year").textContent =
  new Date().getFullYear();
loadScripts();
