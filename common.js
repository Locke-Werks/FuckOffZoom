// Loaded as a plain script by the service worker, the content script and the
// popup. It hangs everything off one global rather than relying on top-level
// declarations being shared between content script files, which is true today
// but would fail silently if it ever stopped being true.

(function (scope) {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    delaySeconds: 3,
    closeLaunch: true,
    closePostMeeting: true,
    showBanner: true
  };

  const DELAY_MIN = 1;
  const DELAY_MAX = 60;

  // The only URLs the extension is allowed to look at. Mirrored by the content
  // script match patterns in the manifest, and used as the tabs.query filter.
  const ZOOM_MATCHES = [
    '*://*.zoom.us/j/*',
    '*://*.zoom.us/s/*',
    '*://*.zoom.us/w/*',
    '*://*.zoom.us/my/*',
    '*://*.zoom.us/launch/*',
    '*://*.zoom.us/postattendee*',
    '*://*.zoomgov.com/j/*',
    '*://*.zoomgov.com/s/*',
    '*://*.zoomgov.com/w/*',
    '*://*.zoomgov.com/my/*',
    '*://*.zoomgov.com/launch/*',
    '*://*.zoomgov.com/postattendee*'
  ];

  // /wc/ is the in-browser meeting client. Closing that tab drops someone out
  // of a meeting they are sitting in, so it is ruled out before anything else.
  const NEVER_CLOSE = [/^\/wc(\/|$)/i];

  // The handoff pages: they exist to fire the zoommtg:// protocol handler and
  // have no purpose once the desktop client has taken over.
  const LAUNCH_PATHS = [
    /^\/j\/\d+/i, // us02web.zoom.us/j/83347752413?jst=2#success
    /^\/s\/\d+/i,
    /^\/w\/\d+/i,
    /^\/my\/[^/]+/i, // personal link
    /^\/launch(\/|$)/i
  ];

  // The page Zoom drops you on after a meeting ends.
  const POST_PATHS = [/^\/postattendee/i];

  function classifyPath(pathname) {
    if (NEVER_CLOSE.some((re) => re.test(pathname))) return null;
    if (LAUNCH_PATHS.some((re) => re.test(pathname))) return 'launch';
    if (POST_PATHS.some((re) => re.test(pathname))) return 'post';
    return null;
  }

  function classifyUrl(url) {
    try {
      const parsed = new URL(url);
      if (!/(^|\.)(zoom\.us|zoomgov\.com)$/i.test(parsed.hostname)) return null;
      return classifyPath(parsed.pathname);
    } catch {
      return null;
    }
  }

  function clampDelay(value) {
    // Number('') and Number(null) are both 0, which would otherwise clamp an
    // emptied input up to the 1 second floor instead of the default.
    if (value === '' || value === null || value === undefined) {
      return DEFAULTS.delaySeconds;
    }
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return DEFAULTS.delaySeconds;
    return Math.min(DELAY_MAX, Math.max(DELAY_MIN, n));
  }

  scope.FOZ = {
    DEFAULTS,
    DELAY_MIN,
    DELAY_MAX,
    ZOOM_MATCHES,
    classifyPath,
    classifyUrl,
    clampDelay
  };
})(globalThis);
