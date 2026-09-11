// node test-paths.js
// Checks the URL classifier, which is the only part that can get this wrong in
// a way that costs something: closing a tab that was not a Zoom handoff page.

const fs = require('fs');
const vm = require('vm');

// A bare vm context has no URL constructor, and classifyUrl treats a parse
// failure as "not a Zoom page", so without this every case would pass as null.
const sandbox = { globalThis: null, URL };
vm.createContext(sandbox);
sandbox.globalThis = sandbox;
vm.runInContext(fs.readFileSync(__dirname + '/common.js', 'utf8'), sandbox);
const { classifyUrl, clampDelay } = sandbox.FOZ;

const CASES = [
  // Close these.
  ['https://us02web.zoom.us/j/83347752413?jst=2#success', 'launch'],
  ['https://us02web.zoom.us/j/83347752413', 'launch'],
  ['https://zoom.us/j/1234567890?pwd=abc', 'launch'],
  ['https://us02web.zoom.us/s/87654321', 'launch'],
  ['https://us02web.zoom.us/w/87654321?tk=xyz', 'launch'],
  ['https://us02web.zoom.us/my/lockewerks', 'launch'],
  ['https://hhs.zoomgov.com/j/1616161616', 'launch'],
  ['https://us02web.zoom.us/postattendee?meeting_id=abc', 'post'],

  // Leave these alone. /wc/ is a meeting running in the browser; the rest are
  // ordinary pages that happen to start with the same letters.
  ['https://us02web.zoom.us/wc/83347752413/join', null],
  ['https://us02web.zoom.us/wc/join/83347752413', null],
  ['https://zoom.us/jobs', null],
  ['https://zoom.us/webinar/register/WN_abc', null],
  ['https://zoom.us/mystuff', null],
  ['https://zoom.us/meeting/schedule', null],
  ['https://zoom.us/rec/share/abcdef', null],
  ['https://zoom.us/profile', null],
  ['https://zoom.us/signin', null],
  ['https://zoom.us/', null],
  ['https://zoom.us/j/', null],
  ['https://zoom.us/join', null],

  // Host has to actually be Zoom, whatever the path looks like.
  ['https://example.com/j/83347752413', null],
  ['https://notzoom.us/j/83347752413', null],
  ['https://zoom.us.example.com/j/83347752413', null],
  ['not a url at all', null]
];

let failed = 0;
for (const [url, want] of CASES) {
  const got = classifyUrl(url);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${String(got).padEnd(6)} ${url}`);
}

const DELAYS = [
  [3, 3],
  ['5', 5],
  [0, 1],
  [-4, 1],
  [999, 60],
  ['', 3],
  [null, 3],
  [undefined, 3],
  ['abc', 3],
  [2.6, 3]
];
for (const [input, want] of DELAYS) {
  const got = clampDelay(input);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  clampDelay(${JSON.stringify(input)}) = ${got}`);
}

console.log(failed ? `\n${failed} failed` : `\nall ${CASES.length + DELAYS.length} passed`);
process.exit(failed ? 1 : 0);
