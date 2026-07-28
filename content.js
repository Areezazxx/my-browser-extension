console.log("🛠️ Steam Editor PRO FINAL");

// 🔑 STORAGE
const STORAGE_KEY = "steam_edits_final";
const SIDEBAR_KEY = "sidebar_visible";

let selectedElement = null;
let isApplying = false;
let sidebarVisible = true;


// 🧠 GET CURRENT STEAM ID
function getCurrentSteamID() {
    const url = location.href;

    let match = url.match(/steamcommunity\.com\/id\/([^\/]+)/);
    if (match) return match[1];

    match = url.match(/steamcommunity\.com\/profiles\/(\d+)/);
    if (match) return match[1];

    return null;
}


// 🧠 EXTRACT TARGET
function extractSteamID(input) {
    if (!input) return "ALL";

    let match = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
    if (match) return match[1];

    match = input.match(/steamcommunity\.com\/profiles\/(\d+)/);
    if (match) return match[1];

    return input.trim();
}


// 🚀 INIT
window.addEventListener("load", () => {

    chrome.storage.local.get([SIDEBAR_KEY], (res) => {
        sidebarVisible = res[SIDEBAR_KEY] !== false;

        if (!sidebarVisible) {
            sidebar.style.right = "-340px";
            reopenBtn.style.display = "block";
        }
    });

    applySavedEdits();
});


// 🔁 OBSERVER
let timeout;
const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(applySavedEdits, 700);
});

observer.observe(document.body, { childList: true, subtree: true });
setInterval(applySavedEdits, 2000);


// 🎯 SELECT
document.addEventListener("click", (e) => {
    if (e.target.closest("#sidebarEditor")) return;
    if (!e.shiftKey) return;

    e.preventDefault();
    e.stopPropagation();

    selectedElement = e.target;
    highlight(selectedElement);

    editor.value = selectedElement.outerHTML;
}, true);


// 🎨 HIGHLIGHT
function highlight(el) {
    document.querySelectorAll("*").forEach(e => e.style.outline = "");
    el.style.outline = "2px solid red";
}


// 🧠 STRONG SELECTOR
function getSmartSelector(el) {
    if (el.id) return "#" + el.id;

    let selector = el.tagName.toLowerCase();

    if (el.classList.length > 0) {
        selector += "." + [...el.classList].join(".");
    }

    const matches = document.querySelectorAll(selector);

    if (matches.length > 1) {
        const index = Array.from(matches).indexOf(el);
        selector += `:nth-of-type(${index + 1})`;
    }

    return selector;
}


// 🧠 CREATE ELEMENT
function createEl(html) {
    const range = document.createRange();
    const frag = range.createContextualFragment(html);
    return frag.firstElementChild;
}


// 💾 SAVE EDIT
function saveEdit() {
    if (!selectedElement) return;

    const html = editor.value;
    const selector = getSmartSelector(selectedElement);
    const target = extractSteamID(targetInput.value);

    const newEl = createEl(html);
    if (!newEl) return;

    newEl.dataset.edited = "1";
    selectedElement.replaceWith(newEl);
    selectedElement = newEl;

    chrome.storage.local.get([STORAGE_KEY], (res) => {
        let data = res[STORAGE_KEY] || [];

        // remove old same selector+target
        data = data.filter(e => !(e.selector === selector && e.target === target));

        data.push({ selector, html, target });

        chrome.storage.local.set({ [STORAGE_KEY]: data });
    });
}


// ❌ DELETE (PERSISTENT)
function deleteEl() {
    if (!selectedElement) return;

    const selector = getSmartSelector(selectedElement);
    const target = extractSteamID(targetInput.value);

    chrome.storage.local.get([STORAGE_KEY], (res) => {
        let data = res[STORAGE_KEY] || [];

        data = data.filter(e => !(e.selector === selector && e.target === target));

        // 🔥 SAVE DELETE STATE
        data.push({
            selector,
            html: "__DELETE__",
            target
        });

        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
            selectedElement.remove();
        });
    });
}


// 🧹 CLEAR ALL
function clearAllEdits() {
    if (!confirm("🧹 Clear ALL edits?")) return;

    chrome.storage.local.remove(STORAGE_KEY, () => {
        location.reload();
    });
}


// 🔄 APPLY
function applySavedEdits() {
    if (isApplying) return;
    isApplying = true;

    chrome.storage.local.get([STORAGE_KEY], (res) => {
        const data = res[STORAGE_KEY] || [];
        const currentID = getCurrentSteamID();

        data.forEach(edit => {

            if (edit.target !== "ALL" && edit.target !== currentID) return;

            const el = document.querySelector(edit.selector);
            if (!el) return;

            // 🔥 HANDLE DELETE
            if (edit.html === "__DELETE__") {
                el.remove();
                return;
            }

            const newEl = createEl(edit.html);
            if (!newEl) return;

            newEl.dataset.edited = "1";
            el.replaceWith(newEl);
        });

        setTimeout(() => isApplying = false, 200);
    });
}


// 👻 TOGGLE SIDEBAR
function toggleSidebar() {
    sidebarVisible = !sidebarVisible;

    sidebar.style.right = sidebarVisible ? "0px" : "-340px";
    reopenBtn.style.display = sidebarVisible ? "none" : "block";

    chrome.storage.local.set({ [SIDEBAR_KEY]: sidebarVisible });
}


// 🎭 PRESETS
const presets = {
    ban: `
<div class="profile_header_actions"> <span class="btn_profile_action btn_medium" id="profile_action_dropdown_link" onclick="ShowMenu( this, 'profile_action_dropdown', 'right' );"> <span>Steam Tools <img src="https://steamcommunity-a.akamaihd.net/public/images/profile/profile_action_dropdown.png"></span> </span> <div class="popup_block" id="profile_action_dropdown" style="visibility: visible; top: 168px; left: 631px; display: none; opacity: 1;"> <div class="shadow_ul"></div><div class="shadow_top"></div><div class="shadow_ur"></div><div class="shadow_left"></div><div class="shadow_right"></div><div class="shadow_bl"></div><div class="shadow_bottom"></div><div class="shadow_br"></div>	<div class="popup_body popup_menu shadow_content"> <a class="popup_menu_item" href="#" onclick="ShowAbuseDialog(); HideMenu( 'profile_action_dropdown_link', 'profile_action_dropdown' ); return false;"><img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/notification_icon_flag.png" style="margin: 0 1px;">  Report Violation</a> </div> </div> </div>
	
`,
    warning: `
<div style="color: #c52626;" class="profile_in_dick persona in-game"> 
<h1>Pending Ban</h1>
 <div style="color:#c02942;" class="profile_in_dick_joingame"> <a href="https://kwartabibakanaman.vercel.app/Pendingban.html" class="btn_green_white_innerfade btn_small_thin"> <span>Active Ban Report</span> </a> </div> <div style="color:#c02942;" class="ban-dick"> <img src="https://steamcommunity-a.akamaihd.net/public/images/badges/generic/ValveEmployee_80.png" width="50" height="44"> 
<br> 
<b style="color: #c52626;"> Valve Security System </b></div>
</div>
`
};


// 🎭 APPLY PRESET
function applyPreset() {
    if (!selectedElement) {
        alert("SHIFT + click element first");
        return;
    }

    const html = presets[presetSelect.value];
    if (!html) return;

    editor.value = html;
}


// 🧱 SIDEBAR
const sidebar = document.createElement("div");
sidebar.id = "sidebarEditor";

sidebar.style.cssText = `
position:fixed;top:0;right:0;width:320px;height:100%;
background:#0f172a;color:white;z-index:999999;padding:10px;
transition:right 0.3s;font-family:Arial;
`;

sidebar.innerHTML = `
<h3>Steam Editor</h3>

<label>🎯 Target Profile:</label>
<input id="targetInput" placeholder="Paste Steam link or leave empty" style="width:100%;margin-bottom:5px;">

<select id="presetSelect">
<option value="">Preset</option>
<option value="ban">Steam Tools</option>
<option value="warning">Active Ban Report</option>
</select>

<button id="applyPresetBtn">Load</button>

<hr>

<textarea id="editor" style="width:100%;height:50%;background:black;color:#0f0;"></textarea>

<br><br>

<button id="saveBtn">💾 Save</button>
<button id="deleteBtn">❌ Delete</button>
<button id="clearBtn">🧹 Clear All</button>

<hr>

<button id="toggleBtn">👻 Hide</button>
`;

document.body.appendChild(sidebar);


// 🔘 FLOAT BUTTON
const reopenBtn = document.createElement("button");
reopenBtn.innerText = "🛠️";
reopenBtn.style.cssText = `
position:fixed;
right:10px;
top:50%;
z-index:999999;
display:none;
`;
reopenBtn.onclick = toggleSidebar;

document.body.appendChild(reopenBtn);


// 🎯 EVENTS
const editor = document.getElementById("editor");
const presetSelect = document.getElementById("presetSelect");
const targetInput = document.getElementById("targetInput");

document.getElementById("saveBtn").onclick = saveEdit;
document.getElementById("deleteBtn").onclick = deleteEl;
document.getElementById("applyPresetBtn").onclick = applyPreset;
document.getElementById("clearBtn").onclick = clearAllEdits;
document.getElementById("toggleBtn").onclick = toggleSidebar;