// Runs on the Zoom handoff pages only. Counts down, shows a banner with an
// escape hatch, then asks the service worker to close the tab. The countdown
// lives here rather than in the worker because an MV3 service worker can be
// torn down mid-timer; the page cannot. Navigating away takes the timer with
// it, so clicking through to the browser client cancels the close by itself.

const { DEFAULTS, classifyPath, clampDelay } = FOZ;

let closeTimer = null;
let labelTimer = null;

function requestClose() {
  // The reply never arrives when the tab goes away, which is the normal case.
  chrome.runtime.sendMessage({ type: 'close-tab' }).catch(() => {});
}

function makeBanner(seconds, onKeep, onNow) {
  const host = document.createElement('div');
  host.style.cssText =
    'all:initial;position:fixed;top:16px;right:16px;z-index:2147483647;';

  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .card {
        font: 13px/1.45 ui-sans-serif, "Segoe UI", system-ui, sans-serif;
        width: 268px;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid #2e2e35;
        background: #151517;
        color: #e6e6ea;
        box-shadow: 0 10px 30px rgba(0, 0, 0, .45);
        animation: slide .18s ease-out;
      }
      @keyframes slide {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: none; }
      }
      .head { display: flex; align-items: center; gap: 8px; }
      .dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #d6262a; flex: none;
      }
      .name {
        font-size: 11px; font-weight: 700;
        letter-spacing: .09em; text-transform: uppercase; color: #9a9aa6;
      }
      .msg { margin-top: 8px; color: #cfcfd6; }
      .n { font-variant-numeric: tabular-nums; font-weight: 700; color: #fff; }
      .btns { display: flex; gap: 8px; margin-top: 12px; }
      button {
        font: inherit; font-size: 12px; font-weight: 600;
        padding: 6px 11px; border-radius: 7px; cursor: pointer;
        border: 1px solid #34343c; background: #1e1e22; color: #e6e6ea;
      }
      button:hover { background: #26262c; }
      button.keep { border-color: #d6262a; background: #d6262a; color: #fff; }
      button.keep:hover { background: #e6393d; }
    </style>
    <div class="card">
      <div class="head"><span class="dot"></span><span class="name">FuckOffZoom</span></div>
      <p class="msg">Closing this tab in <span class="n" id="n">${seconds}</span>s.</p>
      <div class="btns">
        <button class="keep" id="keep">Keep it</button>
        <button id="now">Close now</button>
      </div>
    </div>`;

  (document.body || document.documentElement).appendChild(host);
  root.getElementById('keep').addEventListener('click', onKeep);
  root.getElementById('now').addEventListener('click', onNow);

  const n = root.getElementById('n');
  const msg = root.querySelector('.msg');
  return {
    setRemaining(value) {
      n.textContent = String(value);
    },
    setClosing() {
      msg.textContent = 'Closing.';
    },
    remove() {
      host.remove();
    }
  };
}

async function main() {
  const kind = classifyPath(location.pathname);
  if (!kind) return;

  const cfg = await chrome.storage.sync.get(DEFAULTS);
  if (!cfg.enabled) return;
  if (kind === 'launch' && !cfg.closeLaunch) return;
  if (kind === 'post' && !cfg.closePostMeeting) return;

  const seconds = clampDelay(cfg.delaySeconds);
  const deadline = Date.now() + seconds * 1000;
  let banner = null;

  const stop = () => {
    clearTimeout(closeTimer);
    clearInterval(labelTimer);
  };

  if (cfg.showBanner) {
    banner = makeBanner(
      seconds,
      () => {
        stop();
        banner.remove();
      },
      () => {
        stop();
        banner.setClosing();
        requestClose();
      }
    );
    labelTimer = setInterval(() => {
      banner.setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 200);
  }

  closeTimer = setTimeout(() => {
    stop();
    if (banner) banner.setClosing();
    requestClose();
  }, seconds * 1000);
}

main();
