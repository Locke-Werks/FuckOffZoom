importScripts('common.js');

const { DEFAULTS, ZOOM_MATCHES, classifyUrl } = FOZ;

chrome.runtime.onInstalled.addListener(async () => {
  // Write the full set back so every key exists on disk from the first run.
  const current = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set(current);
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg && msg.type === 'close-tab' && sender.tab && sender.tab.id != null) {
    closeTab(sender.tab.id)
      .then(respond)
      .catch((err) => respond({ closed: false, reason: String(err) }));
    return true;
  }
  if (msg && msg.type === 'sweep') {
    sweep()
      .then(respond)
      .catch((err) => respond({ closed: 0, reason: String(err) }));
    return true;
  }
  return false;
});

async function closeTab(tabId) {
  const tab = await chrome.tabs.get(tabId);

  // The countdown started against whatever the tab held then. Check what it
  // holds now, so a navigation during the wait cannot take an unrelated page
  // down with it.
  if (!classifyUrl(tab.url)) return { closed: false, reason: 'not-zoom' };

  // Pinned means someone parked it deliberately. Audible on a Zoom host means
  // a meeting is genuinely running in the tab.
  if (tab.pinned) return { closed: false, reason: 'pinned' };
  if (tab.audible) return { closed: false, reason: 'audible' };

  // Removing the last tab of the last window quits Chrome. Leave something
  // behind first, so the extension never takes the browser down with it.
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ['normal']
  });
  const own = windows.find((w) => w.id === tab.windowId);
  if (windows.length === 1 && own && own.tabs.length === 1) {
    await chrome.tabs.create({ windowId: tab.windowId, active: true });
  }

  await chrome.tabs.remove(tabId);
  await bumpCounter();
  return { closed: true };
}

async function sweep() {
  const tabs = await chrome.tabs.query({ url: ZOOM_MATCHES });
  let closed = 0;
  for (const tab of tabs) {
    if (!classifyUrl(tab.url)) continue;
    const result = await closeTab(tab.id).catch(() => ({ closed: false }));
    if (result.closed) closed += 1;
  }
  return { closed };
}

async function bumpCounter() {
  const { closedCount = 0 } = await chrome.storage.local.get('closedCount');
  await chrome.storage.local.set({
    closedCount: closedCount + 1,
    lastClosedAt: Date.now()
  });
}
