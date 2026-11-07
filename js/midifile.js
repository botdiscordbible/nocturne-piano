/* Nocturne — lecture et écriture de fichiers MIDI standard (.mid) */
'use strict';
(function () {
  const N = window.N;
  const M = (N.midiFile = {});

  M.parse = function (buf) {
    const dv = new DataView(buf);
    const size = dv.byteLength;
    let p = 0;
    const u8 = () => dv.getUint8(p++);
    const u16 = () => { const v = dv.getUint16(p); p += 2; return v; };
    const u32 = () => { const v = dv.getUint32(p); p += 4; return v; };
    const str4 = () => { let s = ''; for (let i = 0; i < 4; i++) s += String.fromCharCode(dv.getUint8(p++)); return s; };
    const vlq = () => { let v = 0, b, n = 0; do { b = dv.getUint8(p++); v = v * 128 + (b & 0x7f); n++; } while (b & 0x80 && n < 4); return v; };
    const text = (start, len) => {
      const bytes = new Uint8Array(buf, start, Math.min(len, size - start));
      try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim(); }
      catch (e) { return new TextDecoder('latin1').decode(bytes).trim(); }
    };

    if (size < 14) throw new Error('Fichier trop court pour être un MIDI.');
    let id = str4();
    if (id === 'RIFF') { // fichier RMID
      p = 12;
      while (p < size - 8) {
        const cid = str4(); const len = dv.getUint32(p, true); p += 4;
        if (cid === 'data') break;
        p += len + (len & 1);
      }
      id = str4();
    }
    if (id !== 'MThd') throw new Error('Ce fichier n’est pas un fichier MIDI valide.');
    const hlen = u32();
    const format = u16(), ntrks = u16(), division = u16();
    p += hlen - 6;

    const tracks = [], tempos = [], timeSigs = [];
    let guard = 0;
    while (tracks.length < ntrks && p < size - 8 && guard++ < 512) {
      const cid = str4();
      const len = u32();
      const end = Math.min(p + len, size);
      if (cid !== 'MTrk') { p = end; continue; }
      const tr = { index: tracks.length, name: '', instrument: '', notes: [], programs: {}, channels: new Set(), pedal: {}, endTick: 0 };
      const open = new Map();
      let tick = 0, status = 0;
      try {
        while (p < end) {
          tick += vlq();
          if (p >= end) break;
          const b = dv.getUint8(p);
          if (b & 0x80) { status = b; p++; }
          else if (!status) { p++; continue; }
          if (status === 0xff) {
            const type = u8(); const l = vlq(); const ds = p; p += l;
            if (type === 0x51 && l === 3) tempos.push({ tick, uspq: (dv.getUint8(ds) << 16) | (dv.getUint8(ds + 1) << 8) | dv.getUint8(ds + 2) });
            else if (type === 0x58 && l >= 2) timeSigs.push({ tick, num: dv.getUint8(ds), den: Math.pow(2, dv.getUint8(ds + 1)) });
            else if (type === 0x03 && !tr.name) tr.name = text(ds, l);
            else if (type === 0x04 && !tr.instrument) tr.instrument = text(ds, l);
            else if (type === 0x2f) { status = 0; break; }
            status = 0;
            continue;
          }
          if (status === 0xf0 || status === 0xf7) { const l = vlq(); p += l; status = 0; continue; }
          const type = status & 0xf0, ch = status & 0x0f;
          const d1 = u8() & 0x7f;
          const d2 = type === 0xc0 || type === 0xd0 ? 0 : u8() & 0x7f;
          if (type === 0x90 && d2 > 0) {
            const k = ch * 128 + d1;
            if (!open.has(k)) open.set(k, []);
            open.get(k).push({ tick, vel: d2 });
            tr.channels.add(ch);
          } else if (type === 0x80 || (type === 0x90 && d2 === 0)) {
            const arr = open.get(ch * 128 + d1);
            if (arr && arr.length) {
              const on = arr.shift();
              tr.notes.push({ midi: d1, ch, tick: on.tick, end: Math.max(tick, on.tick + 1), vel: on.vel });
            }
          } else if (type === 0xb0 && d1 === 64) {
            (tr.pedal[ch] = tr.pedal[ch] || []).push({ tick, on: d2 >= 64 });
          } else if (type === 0xc0) {
            if (!(ch in tr.programs)) tr.programs[ch] = d1;
          }
        }
      } catch (e) { /* piste tronquée : on garde ce qui a été lu */ }
      for (const [k, arr] of open) for (const on of arr) {
        tr.notes.push({ midi: k % 128, ch: (k / 128) | 0, tick: on.tick, end: Math.max(tick, on.tick + 120), vel: on.vel });
      }
      tr.endTick = tick;
      tr.notes.sort((a, b) => a.tick - b.tick || a.midi - b.midi);
      tracks.push(tr);
      p = end;
    }
    if (!tracks.length) throw new Error('Aucune piste trouvée dans ce fichier MIDI.');

    // carte des tempos
    tempos.sort((a, b) => a.tick - b.tick);
    let tickToSec;
    const smpte = division & 0x8000;
    const ppq = smpte ? 480 : division || 480;
    if (smpte) {
      const fps = 256 - (division >> 8), tpf = division & 0xff;
      const spt = 1 / (fps * tpf);
      tickToSec = (t) => t * spt;
    } else {
      const segs = [{ tick: 0, sec: 0, uspq: 500000 }];
      for (const tp of tempos) {
        const last = segs[segs.length - 1];
        if (tp.tick === last.tick) { last.uspq = tp.uspq; continue; }
        segs.push({ tick: tp.tick, sec: last.sec + ((tp.tick - last.tick) * last.uspq) / 1e6 / ppq, uspq: tp.uspq });
      }
      tickToSec = (t) => {
        let lo = 0, hi = segs.length - 1;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (segs[mid].tick <= t) lo = mid; else hi = mid - 1; }
        const s = segs[lo];
        return s.sec + ((t - s.tick) * s.uspq) / 1e6 / ppq;
      };
    }
    timeSigs.sort((a, b) => a.tick - b.tick);
    const endTick = Math.max(0, ...tracks.map((t) => t.endTick), ...tracks.map((t) => (t.notes.length ? t.notes[t.notes.length - 1].end : 0)));
    return {
      format, division, ppq, smpte: !!smpte, tracks, tempos, timeSigs, tickToSec, endTick,
      bpm: tempos.length ? 60e6 / tempos[0].uspq : 120,
    };
  };

  // ---------- écriture (format 0) ----------
  M.write = function (notes, opts) {
    opts = opts || {};
    const bpm = opts.bpm || 120, ppq = 480;
    const tps = (ppq * bpm) / 60;
    const ev = [];
    for (const n of notes) {
      const on = Math.max(0, Math.round(n.t * tps));
      const off = Math.max(on + 1, Math.round((n.t + n.d) * tps));
      const v = N.clamp(Math.round((n.vel == null ? 0.7 : n.vel) * 127), 1, 127);
      ev.push({ tick: on, o: 2, data: [0x90, n.midi & 0x7f, v] });
      ev.push({ tick: off, o: 0, data: [0x80, n.midi & 0x7f, 0] });
    }
    (opts.pedal || []).forEach((pe) => ev.push({ tick: Math.max(0, Math.round(pe.t * tps)), o: 1, data: [0xb0, 64, pe.on ? 127 : 0] }));
    ev.sort((a, b) => a.tick - b.tick || a.o - b.o);
    const trk = [];
    const vlq = (v) => {
      const bytes = [v & 0x7f];
      while ((v >>= 7)) bytes.unshift((v & 0x7f) | 0x80);
      trk.push(...bytes);
    };
    const uspq = Math.round(60e6 / bpm);
    vlq(0); trk.push(0xff, 0x51, 0x03, (uspq >> 16) & 0xff, (uspq >> 8) & 0xff, uspq & 0xff);
    vlq(0); trk.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);
    const name = new TextEncoder().encode(opts.name || 'Nocturne');
    vlq(0); trk.push(0xff, 0x03); vlq(name.length); trk.push(...name);
    vlq(0); trk.push(0xc0, 0x00);
    let last = 0;
    for (const e of ev) { vlq(e.tick - last); last = e.tick; trk.push(...e.data); }
    vlq(0); trk.push(0xff, 0x2f, 0x00);
    const out = new Uint8Array(14 + 8 + trk.length);
    const dv = new DataView(out.buffer);
    out.set([0x4d, 0x54, 0x68, 0x64], 0); dv.setUint32(4, 6); dv.setUint16(8, 0); dv.setUint16(10, 1); dv.setUint16(12, ppq);
    out.set([0x4d, 0x54, 0x72, 0x6b], 14); dv.setUint32(18, trk.length);
    out.set(trk, 22);
    return out.buffer;
  };
})();
