import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE = "D:\\UNDANGAN\\undangan-yanti-huda\\.chrome-shot-profile";
const PAGE = "file:///D:/UNDANGAN/undangan-yanti-huda/index.html?to=Budi%20Santoso";
const OUT = "D:\\UNDANGAN\\undangan-yanti-huda\\dokumentasi\\gambar";
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  return { send, ws };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const chrome = spawn(
    CHROME,
    [
      `--headless=new`,
      `--disable-gpu`,
      `--no-sandbox`,
      `--hide-scrollbars`,
      `--mute-audio`,
      `--autoplay-policy=no-user-gesture-required`,
      `--force-color-profile=srgb`,
      `--window-size=480,900`,
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "about:blank",
    ],
    { stdio: "ignore", detached: false }
  );

  // tunggu DevTools ready
  let targets = null;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      targets = await r.json();
      if (targets.length) break;
    } catch {}
    await sleep(250);
  }
  if (!targets) throw new Error("CDP not ready");

  const page = targets.find((t) => t.type === "page") || targets[0];
  const { send, ws } = await cdp(page.webSocketDebuggerUrl);

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 480,
    height: 900,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send("Page.navigate", { url: PAGE });
  await sleep(2500); // load fonts/images

  async function shot(name) {
    const { data } = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const file = path.join(OUT, name);
    await writeFile(file, Buffer.from(data, "base64"));
    console.log("✓", name);
  }

  async function evalJs(expression) {
    try {
      const r = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(d.exception?.description || d.text || "eval error");
      }
      return r.result.value;
    } catch (e) {
      console.warn("eval warn:", e.message);
      return null;
    }
  }

  async function scrollTo(sel) {
    await evalJs(
      `document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({behavior:'instant',block:'start'}); true`
    );
    await sleep(600);
  }

  // 1. Cover (sudah tampil)
  await shot("01-cover.png");

  // Buka undangan
  await evalJs(`document.getElementById('buka-undangan').click(); true`);
  await sleep(1200);

  // 2. Hero
  await evalJs(`window.scrollTo(0,0); true`);
  await sleep(500);
  await shot("02-hero-countdown.png");

  // 3. Ayat & salam
  await evalJs(
    `const s=[...document.querySelectorAll('.seksi')]; const ayat=s.find(x=>x.textContent.includes('Ar Rum')); ayat?.scrollIntoView({behavior:'instant',block:'start'}); true`
  );
  await sleep(700);
  await shot("03-ayat-salam.png");

  // 4. Mempelai bride
  await scrollTo("#mempelai");
  await shot("04-mempelai-bride.png");

  // 4b. Groom
  await evalJs(
    `(function(){const els=[...document.querySelectorAll('section')];const g=els.find(x=>x.textContent.includes('The Groom'));if(g)g.scrollIntoView({behavior:'instant',block:'start'});return true})()`
  );
  await sleep(600);
  await shot("04b-mempelai-groom.png");

  // 5. Event
  await scrollTo("#acara");
  await sleep(400);
  await shot("05-event.png");

  // 6. Story
  await scrollTo("#story");
  await sleep(400);
  await shot("06-story.png");

  // 7. Gallery
  await scrollTo("#galeri");
  await sleep(400);
  await shot("07-gallery.png");

  // 8. Lightbox
  await evalJs(`document.querySelector('#galeri-grid button').click(); true`);
  await sleep(600);
  await shot("08-lightbox.png");
  await evalJs(`document.getElementById('lightbox-tutup').click(); true`);
  await sleep(400);

  // 9. Gift
  await scrollTo("#hadiah");
  await sleep(400);
  await shot("09-gift.png");

  // 10. Wishes
  await scrollTo("#ucapan");
  await sleep(400);
  await shot("10-wishes.png");

  // 11. RSVP modal
  await evalJs(`document.getElementById('buka-rsvp').click(); true`);
  await sleep(600);
  await shot("11-rsvp-modal.png");
  // isi form agar terlihat terisi
  await evalJs(`
    document.getElementById('rsvp-nama').value='Budi Santoso';
    document.querySelector('input[name="rsvp-hadir"][value="hadir"]').click();
    document.getElementById('rsvp-tamu').value='2';
    document.getElementById('rsvp-pesan').value='InsyaAllah hadir, semoga lancar sampai hari H!';
    true
  `);
  await sleep(400);
  await shot("11b-rsvp-terisi.png");
  await evalJs(`document.getElementById('tutup-rsvp').click(); true`);
  await sleep(400);

  // 12. Counter RSVP
  await evalJs(
    `document.querySelector('.rsvp-box')?.scrollIntoView({behavior:'instant',block:'center'}); true`
  );
  await sleep(500);
  await shot("12-rsvp-counter.png");

  // 13. Nav bawah + float
  await evalJs(`window.scrollTo(0, 500); true`);
  await sleep(500);
  await shot("13-nav-float.png");

  // 14. Penutup
  await evalJs(
    `document.querySelector('.penutup')?.scrollIntoView({behavior:'instant',block:'start'}); true`
  );
  await sleep(600);
  await shot("14-penutup.png");

  ws.close();
  chrome.kill();
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
