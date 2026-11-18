/* ===== أعضاء الفرق (لاعبون / مسيرون / طاقم فني وإداري) + الاستيراد من Excel =====
   وحدة مستقلة (window.TMX). البيانات في وثيقة الموسم نفسها: S.tm = [{id, team, lic, name, role}]
   كل عضو مرتبط بمعرّف فريقه (team) ولا ينتقل إلى فريق آخر عند تعديله. لا علاقة لها بقائمة «الأعضاء الحاضرين» في لجنة الانضباط.
   تعتمد على: S, sv, go, save, ask, openM, setM, closeM, toast, esc, uid, by, nm, tl, $ و XLSX (SheetJS). */
(function () {
const X = window.TMX = {};
const ROLES = ['لاعب', 'مسير', 'مدرب', 'مدرب مساعد', 'طبيب', 'مدلك', 'مسؤول إداري'];
const GN = { p: 'اللاعبون', m: 'المسيرون', c: 'المدربون', s: 'الطاقم الفني والإداري' };
const GO = ['p', 'm', 'c', 's'];
const MAXROWS = 5000, MAXBYTES = 5 * 1024 * 1024;
let TQ = '', TS = 'name';

/* ----- أدوات ----- */
const norm = s => String(s == null ? '' : s).replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const ALIAS = { 'لاعبه': 'لاعب', 'مدرب رئيسي': 'مدرب', 'المدرب': 'مدرب', 'مساعد مدرب': 'مدرب مساعد', 'مسؤول اداري': 'مسؤول إداري', 'مسوول اداري': 'مسؤول إداري', 'اداري': 'مسؤول إداري' };
/* الصفة: تُوحَّد مع الصفات المعروفة (مع اختلافات الكتابة)، وأي صفة أخرى تُقبل كما كُتبت */
const canon = r => { const t = clean(r), n = norm(t); if (!n) return ''; const k = ROLES.find(x => norm(x) == n); if (k) return k; if (ALIAS[n]) return ALIAS[n]; return t; };
const grp = r => { const n = norm(r); if (n == 'لاعب') return 'p'; if (n == 'مسير') return 'm'; if (n.includes('مدرب')) return 'c'; return 's' };
/* رقم الرخصة: نص بلا مسافات، أرقام لاتينية، ويُزال ".0" الناتج عن خلايا Excel الرقمية */
const normLic = v => { let t = String(v == null ? '' : v).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\s+/g, '').trim(); if (/^\d+\.0+$/.test(t)) t = t.replace(/\.0+$/, ''); return t };
const licOk = t => t.length >= 1 && t.length <= 30 && /^[\p{L}\p{N}\-\/_.]+$/u.test(t);
const lk = t => String(t || '').toLowerCase();
const byAr = (a, b) => String(a).localeCompare(String(b), 'ar', { numeric: true });
const team = id => by('teams', id);
const members = id => S.tm.filter(x => x.team == id);
X.count = id => members(id).length;
X.roles = () => [...new Set([...ROLES, ...S.tm.map(x => x.role).filter(Boolean)])];

/* ===== صفحة إدارة أعضاء الفريق ===== */
X.open = id => { sv.tm = id; TQ = ''; TS = 'name'; go(); scrollTo(0, 0) };
X.back = () => { sv.tm = ''; go() };
X.q = v => { TQ = v; go() };
X.sort = v => { TS = v; go() };
const sorter = () => TS == 'lic' ? (a, b) => byAr(a.lic, b.lic) : TS == 'role' ? (a, b) => (GO.indexOf(grp(a.role)) - GO.indexOf(grp(b.role))) || byAr(a.role, b.role) || byAr(a.name, b.name) : (a, b) => byAr(a.name, b.name);
X.page = id => {
  const t = team(id); if (!t) { sv.tm = ''; return '' }
  const all = members(id), q = norm(TQ), lq = lk(TQ).replace(/\s+/g, '');
  const shown = all.filter(x => !q || norm(x.name).includes(q) || lk(x.lic).includes(lq)).sort(sorter());
  const G = {}; shown.forEach(x => (G[grp(x.role)] ??= []).push(x));
  const cnt = g => all.filter(x => grp(x.role) == g).length;
  const roleSel = x => { const o = X.roles(); if (!o.includes(x.role)) o.push(x.role); return `<select class="trs" aria-label="تغيير الصفة" onchange="TMX.setRole('${x.id}',this.value)">${o.map(r => `<option value="${esc(r)}" ${r == x.role ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>` };
  const sec = g => G[g] ? `<div class="cat"><div class="bar" style="margin:0 0 8px"><b style="flex:1">${GN[g]} (${G[g].length}${q && G[g].length != cnt(g) ? ' من ' + cnt(g) : ''})</b></div><div class="tw rtw"><table class="rt"><thead><tr><th>#</th><th>رقم الرخصة</th><th>الاسم</th><th>الصفة</th><th></th></tr></thead>${G[g].map((x, i) => `<tr><td data-l="#">${i + 1}</td><td data-l="رقم الرخصة"><span class="ltr">${esc(x.lic)}</span></td><td data-l="الاسم"><b>${esc(x.name)}</b></td><td data-l="الصفة">${roleSel(x)}</td><td class="ac"><button class="btn" onclick="TMX.edit('${x.id}')">تعديل</button><button class="btn dg" onclick="TMX.del('${x.id}')">حذف</button></td></tr>`).join('')}</table></div></div>` : '';
  return `<div class="bar"><button class="btn" onclick="TMX.back()">← قائمة الفرق</button><b style="flex:1;min-width:160px;font-size:18px;display:flex;align-items:center;gap:8px">${tl(id)}${esc(t.name)} — اللاعبون والمسيرون والطاقم (${all.length})</b><button class="btn pr" onclick="TMX.edit()">+ إضافة عضو</button><button class="btn" onclick="TMX.importOpen('${id}')">استيراد من Excel</button></div>
<div class="bar"><label style="flex:2 1 240px">بحث بالاسم أو رقم الرخصة<input id="tmq" autocomplete="off" value="${esc(TQ)}" oninput="TMX.q(this.value)" placeholder="اكتب جزءًا من الاسم أو رقم الرخصة"></label><label>ترتيب القائمة حسب<select onchange="TMX.sort(this.value)"><option value="name" ${TS == 'name' ? 'selected' : ''}>الاسم</option><option value="lic" ${TS == 'lic' ? 'selected' : ''}>رقم الرخصة</option><option value="role" ${TS == 'role' ? 'selected' : ''}>الصفة</option></select></label></div>
<div class="tmsum">${GO.map(g => `<span class="chip">${GN[g]}: <b>${cnt(g)}</b></span>`).join('')}</div>
${GO.map(sec).join('') || `<div class="em">${all.length ? 'لا توجد نتائج مطابقة للبحث.' : 'لا يوجد أعضاء مسجلون في هذا الفريق بعد. أضف عضوًا يدويًا أو استورد ملف Excel.'}</div>`}`;
};

/* ===== إضافة / تعديل / حذف / تغيير الصفة ===== */
function dupOf(tid, lic, exceptId) { const k = lk(lic); return S.tm.find(x => x.team == tid && x.id != exceptId && lk(x.lic) == k) }
X.edit = id => {
  const tid = sv.tm, o = id && S.tm.find(x => x.id == id);
  if (!tid || !team(tid)) return;
  openM(o ? 'تعديل بيانات عضو' : 'إضافة عضو إلى الفريق');
  setM(`<p style="margin:0 0 8px;color:var(--mt);font-size:13px">الفريق: <b>${esc(nm('teams', tid))}</b> — لا يمكن نقل العضو إلى فريق آخر من هنا.</p><label>رقم الرخصة<input id="tml" autocomplete="off" value="${esc(o ? o.lic : '')}"></label><label>الاسم واللقب<input id="tmn" autocomplete="off" value="${esc(o ? o.name : '')}"></label><label>الصفة (اختر أو اكتب صفة أخرى)<input id="tmr" list="tmrl" autocomplete="off" value="${esc(o ? o.role : 'لاعب')}"></label><datalist id="tmrl">${X.roles().map(r => `<option value="${esc(r)}">`).join('')}</datalist><div class="err" id="er"></div>`,
    [{ t: 'حفظ', c: 'pr', f: () => {
      const lic = normLic($('#tml').value), name = clean($('#tmn').value), role = canon($('#tmr').value), E = $('#er');
      if (!lic) return E.textContent = 'رقم الرخصة مطلوب';
      if (!licOk(lic)) return E.textContent = 'رقم الرخصة غير صالح (حروف وأرقام وشرطات فقط، حتى 30 خانة)';
      if (!name) return E.textContent = 'الاسم مطلوب';
      if (name.length > 100) return E.textContent = 'الاسم طويل جدًا';
      if (!role) return E.textContent = 'الصفة مطلوبة';
      if (role.length > 40) return E.textContent = 'الصفة طويلة جدًا';
      const d = dupOf(tid, lic, o && o.id); if (d) return E.textContent = 'رقم الرخصة مسجل مسبقًا في هذا الفريق للعضو «' + d.name + '»';
      if (o) { o.lic = lic; o.name = name; o.role = role } else S.tm.push({ id: uid(), team: tid, lic, name, role });
      save(); closeM(); go(); toast('تم الحفظ');
    } }, { t: 'إلغاء', f: closeM }]);
  setTimeout(() => { const e = $('#tml'); e && e.focus() }, 30);
};
X.del = id => { const x = S.tm.find(y => y.id == id); if (!x) return; ask('حذف «' + esc(x.name) + '» (رخصة ' + esc(x.lic) + ') من قائمة الفريق؟ لا يمكن التراجع.', () => { S.tm = S.tm.filter(y => y.id != id); save(); go(); toast('تم الحذف') }) };
X.setRole = (id, v) => { const x = S.tm.find(y => y.id == id), r = canon(v); if (!x || !r) return; x.role = r; save(); go(); toast('تم تغيير الصفة إلى «' + r + '»') };

/* ===== الاستيراد من Excel ===== */
let IM = null;
const HDR = { lic: h => /رخص|licen|^lic/.test(h), name: h => /اسم|name|لاعب|عضو/.test(h), role: h => /صف|role|وظيف/.test(h) };
function dl(blob, filename) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000) }
X.template = () => {
  if (!window.XLSX) return toast('تعذر تحميل مكتبة Excel، تحقق من الاتصال');
  const ws = XLSX.utils.aoa_to_sheet([['رقم الرخصة', 'اسم اللاعب أو العضو', 'الصفة']]);
  ws['!cols'] = [{ wch: 18 }, { wch: 34 }, { wch: 18 }];
  const hp = XLSX.utils.aoa_to_sheet([['تعليمات'], ['1. املأ الورقة الأولى فقط: سطر لكل لاعب أو عضو، ولا تغيّر عناوين الأعمدة.'], ['2. رقم الرخصة والاسم والصفة حقول إلزامية.'], ['3. الصفات المعروفة: ' + ROLES.join('، ') + ' — ويمكن كتابة أي صفة أخرى.'], ['4. لا يُستورد السطر المكرر (نفس رقم الرخصة) إلى الفريق نفسه.']]);
  hp['!cols'] = [{ wch: 90 }];
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ws, 'اللاعبون والمسيرون'); XLSX.utils.book_append_sheet(wb, hp, 'تعليمات');
  dl(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), 'نموذج-لاعبين-ومسيرين.xlsx');
};
X.importOpen = pre => {
  if (!S.teams.length) return toast('أضف فريقًا واحدًا على الأقل أولًا');
  IM = { team: pre || sv.tm || '', rows: null, tid: '' };
  openM('إضافة لاعبين ومسيري فريق', 1);
  const ts = [...S.teams].sort((a, b) => byAr(a.name, b.name));
  setM(`<div class="g2"><label>الفريق المراد إضافة عناصره<select id="imt"><option value="">— اختر الفريق —</option>${ts.map(t => `<option value="${t.id}" ${t.id == IM.team ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label><label>ملف Excel من الجهاز (.xlsx أو .xls أو .csv)<input type="file" id="imf" accept=".xlsx,.xls,.csv"></label></div><p class="tmhint">الأعمدة المطلوبة: <b>رقم الرخصة</b> — <b>اسم اللاعب أو العضو</b> — <b>الصفة</b> (لاعب، مسير، مدرب، مدرب مساعد، طبيب، مدلك، مسؤول إداري… أو أي صفة أخرى). لا تُحذف البيانات الحالية ولا تُستبدل، وتُضاف الأسماء الجديدة فقط إلى الفريق المحدد.</p><div id="imp"></div><div class="err" id="er"></div>`,
    [{ t: 'معاينة البيانات', c: 'pr', f: X.preview }, { t: 'تأكيد الاستيراد', c: 'pr', f: X.confirm }, { t: 'تحميل نموذج Excel فارغ', f: X.template }, { t: 'إغلاق', c: 'cn', f: () => { IM = null; closeM() } }]);
  const b = mEl.querySelectorAll('.bt .btn'); b[1].disabled = true; IM.cf = b[1];
  /* تغيير الفريق أو الملف بعد المعاينة يُبطل المعاينة السابقة */
  const inv = () => { IM.rows = null; IM.cf.disabled = true; const p = $('#imp'); if (p) p.innerHTML = '' };
  $('#imt').onchange = inv; $('#imf').onchange = inv;
};
function readSheet(file) {
  return file.arrayBuffer().then(buf => {
    const wb = XLSX.read(buf, { type: 'array', cellDates: false }), ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) throw new Error('الملف لا يحتوي على أي ورقة');
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true, blankrows: true });
  });
}
X.preview = async () => {
  const E = $('#er'), tid = $('#imt').value, f = $('#imf').files[0]; E.textContent = '';
  if (!window.XLSX) return E.textContent = 'تعذر تحميل مكتبة Excel، تحقق من الاتصال';
  if (!tid || !team(tid)) return E.textContent = 'اختر الفريق أولًا';
  if (!f) return E.textContent = 'اختر ملف Excel من الجهاز';
  if (!/\.(xlsx|xls|csv)$/i.test(f.name)) return E.textContent = 'صيغة الملف غير مدعومة. استعمل ملف Excel (.xlsx / .xls) أو .csv';
  if (f.size > MAXBYTES) return E.textContent = 'حجم الملف كبير جدًا (الحد الأقصى 5 ميغابايت)';
  let A; try { A = await readSheet(f) } catch (e) { return E.textContent = 'تعذر قراءة الملف: ' + (e.message || 'ملف غير صالح') }
  /* البحث عن صف العناوين ضمن أول 10 صفوف */
  let hi = -1, ci = {};
  for (let i = 0; i < Math.min(A.length, 10) && hi < 0; i++) {
    const h = (A[i] || []).map(c => norm(c)), m = {};
    ['lic', 'name', 'role'].forEach(k => { const j = h.findIndex((x, q) => x && HDR[k](x) && !Object.values(m).includes(q)); if (j >= 0) m[k] = j });
    if (m.lic != null || m.name != null || m.role != null) { if (Object.keys(m).length >= 2 || i == 0) { hi = i; ci = m } }
  }
  const miss = [['lic', 'رقم الرخصة'], ['name', 'اسم اللاعب أو العضو'], ['role', 'الصفة']].filter(x => ci[x[0]] == null).map(x => x[1]);
  if (hi < 0 || miss.length) return E.textContent = 'الأعمدة المطلوبة غير موجودة في الملف: ' + (hi < 0 ? 'رقم الرخصة، اسم اللاعب أو العضو، الصفة' : miss.join('، ')) + '. حمّل النموذج واستعمل عناوينه.';
  const data = A.slice(hi + 1);
  if (data.length > MAXROWS) return E.textContent = 'عدد الأسطر كبير (الحد الأقصى ' + MAXROWS + ' سطر في الملف الواحد)';
  const ex = new Map(members(tid).map(x => [lk(x.lic), x])), seen = new Map(), rows = [];
  data.forEach((r, i) => {
    const xr = hi + 2 + i, lic = normLic(r[ci.lic]), name = clean(r[ci.name]), role0 = clean(r[ci.role]);
    if (!lic && !name && !role0) { rows.push({ xr, st: 'skip' }); return }
    const o = { xr, lic, name, role: canon(role0), st: 'ok', msg: '', on: true }, er = [];
    if (!lic) er.push('رقم الرخصة ناقص'); else if (!licOk(lic)) er.push('رقم الرخصة غير صالح');
    if (!name) er.push('الاسم ناقص'); else if (name.length > 100) er.push('الاسم طويل جدًا');
    if (!o.role) er.push('الصفة ناقصة'); else if (o.role.length > 40) er.push('الصفة طويلة جدًا');
    if (er.length) { o.st = 'err'; o.msg = er.join('، '); rows.push(o); return }
    const k = lk(lic);
    if (ex.has(k)) { o.st = 'dup'; o.msg = 'مسجل مسبقًا في الفريق: ' + ex.get(k).name }
    else if (seen.has(k)) { o.st = 'dup'; o.msg = 'مكرر في الملف (السطر ' + seen.get(k) + ')' }
    else { seen.set(k, xr); const other = S.tm.find(x => x.team != tid && lk(x.lic) == k); if (other) o.note = 'تنبيه: الرخصة مسجلة أيضًا في فريق «' + nm('teams', other.team) + '»' }
    rows.push(o);
  });
  IM.rows = rows; IM.tid = tid; drawPrev();
};
function counts(R) { const c = { ok: 0, dup: 0, err: 0, ign: 0 }; R.forEach(r => { if (r.st == 'skip') c.ign++; else if (r.st == 'ok') r.on ? c.ok++ : c.ign++; else c[r.st]++ }); return c }
function drawPrev() {
  const R = IM.rows, c = counts(R), p = $('#imp'), T = nm('teams', IM.tid);
  const lab = { ok: 'جاهز', dup: 'مكرر', err: 'خطأ' };
  const vis = R.filter(r => r.st != 'skip');
  p.innerHTML = `<div class="tmcnt"><span class="chip ok2">جاهزة للاستيراد: <b>${c.ok}</b></span><span class="chip wr2">مكررة: <b>${c.dup}</b></span><span class="chip er2">بها أخطاء: <b>${c.err}</b></span><span class="chip">متجاهلة: <b>${c.ign}</b></span></div><p class="tmhint" style="margin:6px 0">سيُضاف إلى الفريق: <b>${esc(T)}</b>. أزل التحديد عن أي سطر لا تريد استيراده.</p><div class="tw rtw tmprev"><table class="rt"><thead><tr><th></th><th>السطر</th><th>رقم الرخصة</th><th>الاسم</th><th>الصفة</th><th>الحالة</th></tr></thead>${vis.map(r => `<tr class="tm-${r.st}"><td data-l="">${r.st == 'ok' ? `<input type="checkbox" style="width:auto" data-r="${r.xr}" ${r.on ? 'checked' : ''} aria-label="استيراد السطر ${r.xr}">` : ''}</td><td data-l="السطر">${r.xr}</td><td data-l="رقم الرخصة"><span class="ltr">${esc(r.lic)}</span></td><td data-l="الاسم">${esc(r.name)}</td><td data-l="الصفة">${esc(r.role)}</td><td data-l="الحالة" style="white-space:normal"><b>${lab[r.st]}</b>${r.msg ? ' — ' + esc(r.msg) : ''}${r.note ? `<div class="tmnote">${esc(r.note)}</div>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="em">لا توجد أسطر بيانات في الملف.</td></tr>'}</table></div>`;
  p.querySelectorAll('[data-r]').forEach(e => e.onchange = () => { const r = R.find(x => x.xr == e.dataset.r); if (r) r.on = e.checked; sync() });
  const sync = () => { const cc = counts(R); IM.cf.disabled = !cc.ok; const ch = p.querySelector('.tmcnt'); if (ch) { const s = ch.querySelectorAll('b'); s[0].textContent = cc.ok; s[3].textContent = cc.ign } };
  sync();
}
X.confirm = () => {
  const E = $('#er'); E.textContent = '';
  if (!IM || !IM.rows) return E.textContent = 'اعرض المعاينة أولًا';
  const tid = $('#imt').value;
  if (tid != IM.tid) { IM.rows = null; IM.cf.disabled = true; return E.textContent = 'تغيّر الفريق بعد المعاينة، أعد المعاينة' }
  if (!team(tid)) return E.textContent = 'الفريق المحدد لم يعد موجودًا';
  const R = IM.rows, ex = new Set(members(tid).map(x => lk(x.lic))), add = [];
  let dup = 0, err = 0, ign = 0;
  R.forEach(r => {
    if (r.st == 'skip') { ign++; return }
    if (r.st == 'err') { err++; return }
    if (r.st == 'dup') { dup++; return }
    if (!r.on) { ign++; return }
    const k = lk(r.lic);
    if (ex.has(k)) { dup++; return }                 /* حماية إضافية: تكرار ظهر بعد المعاينة */
    ex.add(k); add.push({ id: uid(), team: tid, lic: r.lic, name: r.name, role: r.role });
  });
  if (!add.length) return E.textContent = 'لا توجد سجلات صالحة للاستيراد';
  S.tm.push(...add); save();
  const T = nm('teams', tid);
  IM = null;
  setM(`<div class="rs" style="background:var(--ps,transparent)"><b>اكتمل الاستيراد إلى الفريق «${esc(T)}»</b></div><div class="tmcnt" style="margin-top:10px"><span class="chip ok2">سجلات مستوردة بنجاح: <b>${add.length}</b></span><span class="chip wr2">سجلات مكررة: <b>${dup}</b></span><span class="chip er2">سجلات بها أخطاء: <b>${err}</b></span><span class="chip">سجلات متجاهلة: <b>${ign}</b></span></div><p class="tmhint">لم تُحذف أو تُستبدل أي بيانات سابقة. السجلات المكررة والتي بها أخطاء لم تُستورد.</p>`,
    [{ t: 'عرض قائمة الفريق', c: 'pr', f: () => { closeM(); sv.tm = tid; TQ = ''; go() } }, { t: 'إغلاق', f: () => { closeM(); go() } }]);
  go(); toast('تم استيراد ' + add.length + ' سجل');
};
})();
