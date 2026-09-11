<div align="center">

<img src="assets/fuckoffzoom.png" width="96" alt="FuckOffZoom">

# FuckOffZoom

**The launch page did its job in 200 milliseconds. It can fuck off now.**

[![release](https://img.shields.io/github/v/release/Locke-Werks/FuckOffZoom?style=flat-square&color=d6262a)](https://github.com/Locke-Werks/FuckOffZoom/releases)
[![license](https://img.shields.io/badge/license-GPLv3-d6262a?style=flat-square)](LICENSE)
[![platform](https://img.shields.io/badge/platform-Chrome-d6262a?style=flat-square)](#install)
[![manifest](https://img.shields.io/badge/manifest-v3-d6262a?style=flat-square)](manifest.json)

</div>

---

You click a meeting link. Chrome opens a tab. That tab exists to fire one
`zoommtg://` URL at your desktop client, which takes about as long as a blink.
Then it sits there forever, showing you a sentence about how your meeting should
start automatically, next to a link you will never click.

Six meetings a day and by five o'clock you are curating a museum. Every exhibit
identical. Every one of them a meeting that ended hours ago. Then somebody says
"can you share your screen" and the entire room gets a tour.

Zoom has had a decade to close its own tab. Zoom is not going to close its own
tab.

Fine.

## What it does

Three seconds after a Zoom launch page loads, a small banner shows up in the
corner counting down. Ignore it and the tab closes itself. Hit **Keep it** and
it stays. Hit **Close now** if three seconds is three seconds too many.

That is the entire product. There is no account, no telemetry, no dashboard, and
nothing leaves your machine.

## What it will not close

Anything holding the keys to `tabs.remove` is one sloppy regex away from eating
something you actually wanted. So the rules are deliberately narrow, and there
are five of them.

- **Anything under `/wc/`.** That is the in-browser meeting client. Closing it
  ejects you from a meeting you are sitting in, on camera, mid-sentence. It gets
  ruled out before any other check runs.
- **Anything making noise.** An audible tab on a Zoom host means a meeting is
  live in there.
- **Anything pinned.** You parked it on purpose.
- **Anything that stopped being a launch page.** The tab is re-checked at the
  instant the timer fires, not when it started, so wandering off during the
  countdown cancels the whole thing.
- **Your entire browser.** Closing the last tab of your last window takes Chrome
  down with it. In that one case it opens a blank tab first, because an
  extension that quits your browser to tidy up is not a tidying extension.

The host has to genuinely be Zoom, too. `zoom.us.example.com/j/123` is not Zoom
and gets nothing.

## Install

Not on the Chrome Web Store. It is called FuckOffZoom. Load it unpacked.

1. `chrome://extensions`
2. **Developer mode**, top right
3. **Load unpacked**, then pick this folder

## Settings

Click the toolbar icon.

| Setting | Default | |
| --- | --- | --- |
| Close Zoom tabs | on | The master switch |
| Wait before closing | 3s | 1 to 60 |
| Meeting launch tabs | on | The `/j/` graveyard |
| Post-meeting tabs | on | The page Zoom leaves behind afterwards |
| Countdown banner | on | Off means it closes with no warning |

**Sweep open tabs** kills every qualifying Zoom tab you already have open, under
the same five rules. Use it once on today's pile.

## What counts as a launch page

| URL | | |
| --- | --- | --- |
| `/j/83347752413?jst=2#success` | meeting launch | closed |
| `/s/87654321`, `/w/87654321` | meeting launch | closed |
| `/my/yourname` | personal link | closed |
| `/postattendee?…` | post-meeting | closed |
| `/wc/83347752413/join` | browser client | **never** |
| `/jobs`, `/mystuff`, `/webinar/register/…` | not launch pages | untouched |
| anything on a non-Zoom host | not our business | untouched |

`zoom.us` and `zoomgov.com`, any subdomain.

## Tests

```
node test-paths.js
```

34 cases against the URL classifier. The negatives are the point: `/jobs`,
`/mystuff`, `/webinar/register/` and `zoom.us.example.com` all have to survive,
because the expensive failure here is not a Zoom tab that lived. It is something
else that died.

## One caveat

If Chrome still asks **Open Zoom Workplace?** every time you join, closing the
tab dismisses that prompt along with it and your meeting never opens. Tick
"Always allow" once on that dialog, or leave the delay at 3 seconds or more.

## License

GPLv3. See [LICENSE](LICENSE).
