const { DEFAULTS, clampDelay } = FOZ;

const el = (id) => document.getElementById(id);
const TOGGLES = ['enabled', 'closeLaunch', 'closePostMeeting', 'showBanner'];

async function load() {
  const cfg = await chrome.storage.sync.get(DEFAULTS);
  for (const key of TOGGLES) el(key).checked = Boolean(cfg[key]);
  el('delay').value = clampDelay(cfg.delaySeconds);
  el('version').textContent = 'v' + chrome.runtime.getManifest().version;
  reflectEnabled();
  await showCount();
}

function reflectEnabled() {
  el('body').classList.toggle('disabled', !el('enabled').checked);
}

async function save() {
  await chrome.storage.sync.set({
    enabled: el('enabled').checked,
    closeLaunch: el('closeLaunch').checked,
    closePostMeeting: el('closePostMeeting').checked,
    showBanner: el('showBanner').checked,
    delaySeconds: clampDelay(el('delay').value)
  });
  reflectEnabled();
}

async function showCount() {
  const { closedCount = 0 } = await chrome.storage.local.get('closedCount');
  el('count').textContent =
    closedCount === 1 ? '1 tab closed so far' : `${closedCount} tabs closed so far`;
}

for (const key of TOGGLES) el(key).addEventListener('change', save);

el('delay').addEventListener('change', () => {
  el('delay').value = clampDelay(el('delay').value);
  save();
});

el('sweep').addEventListener('click', async () => {
  const button = el('sweep');
  button.disabled = true;
  const result = await chrome.runtime.sendMessage({ type: 'sweep' });
  const closed = (result && result.closed) || 0;
  el('count').textContent = closed
    ? `Swept ${closed} tab${closed === 1 ? '' : 's'}`
    : 'Nothing to sweep';
  setTimeout(() => {
    button.disabled = false;
    showCount();
  }, 1400);
});

load();
