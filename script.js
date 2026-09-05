const state = {
  scripts: [],
  search: "",
  game: "all"
};
const $ = id => document.getElementById(id);
function escapeHTML(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}
function render() {
  const query = state.search.toLowerCase().trim();
  const filtered = state.scripts.filter(script => {
    const gameMatch =
      state.game === "all" ||
      script.game === state.game;
    const text = `
      ${script.name}
      ${script.game}
      ${script.source}
    `.toLowerCase();
    return gameMatch && (!query || text.includes(query));
  });
  $("status").textContent =
    `${filtered.length} script(s) found`;
  $("scriptGrid").innerHTML = filtered.map(script => {
    const index = state.scripts.indexOf(script);
    return `
      <div class="card">
        <h3>${escapeHTML(script.name)}</h3>
        <p>Game: ${escapeHTML(script.game)}</p>
        <p>
          Source:
          <a
            href="${escapeHTML(script.sourceUrl)}"
            target="_blank"
            rel="noopener noreferrer">
            ${escapeHTML(script.source)}
          </a>
        </p>
        <div class="card-actions">
          <button onclick="openScript(${index})">
            View
          </button>
          <button onclick="copyScript(${index})">
            Copy
          </button>
          <a
            href="${escapeHTML(script.sourceUrl)}"
            target="_blank"
            rel="noopener noreferrer">
            Source
          </a>
        </div>
      </div>
    `;
  }).join("");
  $("empty").classList.toggle(
    "hidden",
    filtered.length !== 0
  );
}
function loadGames() {
  const games = [
    ...new Set(state.scripts.map(script => script.game))
  ].sort();
  $("gameFilter").innerHTML =
    `<option value="all">All games</option>` +
    games.map(game => `
      <option value="${escapeHTML(game)}">
        ${escapeHTML(game)}
      </option>
    `).join("");
}
async function loadScripts() {
  try {
    const response = await fetch(
      "./scripts/scripts.json",
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error(
        `scripts.json returned ${response.status}`
      );
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("scripts.json must contain an array");
    }
    state.scripts = data;
    loadGames();
    render();
  } catch (error) {
    console.error(error);
    $("status").textContent =
      "Failed to load scripts.json";
    $("scriptGrid").innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}
async function getScript(script) {
  const response = await fetch(
    `./scripts/${script.file}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(
      `Script returned ${response.status}`
    );
  }
  return response.text();
}
window.openScript = async function(index) {
  const script = state.scripts[index];
  $("modalTitle").textContent = script.name;
  $("modalGame").textContent = script.game;
  $("modalDescription").textContent =
    `Source: ${script.source}`;
  $("modalCode").textContent =
    "Loading script...";
  $("modal").classList.remove("hidden");
  try {
    $("modalCode").textContent =
      await getScript(script);
  } catch (error) {
    $("modalCode").textContent =
      "Failed to load script.";
    console.error(error);
  }
};
window.copyScript = async function(index) {
  const script = state.scripts[index];
  try {
    const code = await getScript(script);
    await navigator.clipboard.writeText(code);
    $("toast").classList.add("show");
    setTimeout(() => {
      $("toast").classList.remove("show");
    }, 1500);
  } catch (error) {
    alert("Failed to copy script.");
    console.error(error);
  }
};
function closeModal() {
  $("modal").classList.add("hidden");
}
$("closeModal").onclick = closeModal;
$("modalBackdrop").onclick = closeModal;
$("copyModal").onclick = async () => {
  const code = $("modalCode").textContent;
  await navigator.clipboard.writeText(code);
  $("toast").classList.add("show");
  setTimeout(() => {
    $("toast").classList.remove("show");
  }, 1500);
};
$("search").oninput = event => {
  state.search = event.target.value;
  render();
};
$("gameFilter").onchange = event => {
  state.game = event.target.value;
  render();
};
$("year").textContent = new Date().getFullYear();
loadScripts();
