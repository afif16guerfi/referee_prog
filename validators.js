/* ===== تحقق الخادم من بيانات الموسم قبل الحفظ =====
   يُطبَّق على كل حفظ (فردي أو جماعي) عبر PUT /api/data، فلا يمكن تجاوزه بتعديل الواجهة الأمامية.
   مبدأ العمل: يُفحص فقط ما أُضيف أو تغيّر مقارنةً بالنسخة المحفوظة، حتى لا تُمنع كل عمليات الحفظ بسبب تعارضات قديمة موجودة مسبقًا في البيانات. */
const tmin = t => { const p = String(t || '').split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); };
/* المقابلة المتأخرة غير المعاد برمجتها ليس لها موعد صالح (نفس تعريف الواجهة) */
const lateOpen = m => m.status === 'postponed' || (m.status === 'moved' && !!m.prevDate && m.date === m.prevDate && (m.prevTime == null || m.time === m.prevTime) && (m.prevStad == null || m.stad === m.prevStad));
const slotOf = d => Math.max(0, parseInt(d && d.set && d.set.slot, 10) || 0);
const sig = m => [m.date, m.time, m.stad, lateOpen(m) ? 1 : 0].join('|');
const live = m => m && m.stad && m.date && m.time && !lateOpen(m);
const name = (d, a, id) => { const x = (d[a] || []).find(y => y.id === id); return x ? x.name : '—'; };

/* منع مقابلتين في الملعب نفسه والتاريخ نفسه والتوقيت نفسه (أو المتداخل إذا حُدّدت مدة المقابلة في الإعدادات) */
function stadConflicts(prev, next) {
  const old = new Map(((prev && prev.matches) || []).map(m => [m.id, sig(m)]));
  const M = next.matches || [], gap = Math.max(1, slotOf(next)), out = [];
  const byKey = new Map();
  M.forEach(m => { if (live(m)) { const k = m.stad + '|' + m.date; (byKey.get(k) || byKey.set(k, []).get(k)).push(m); } });
  M.forEach(a => {
    if (!live(a) || old.get(a.id) === sig(a)) return;          /* قديمة وغير متغيرة: لا تُفحص */
    const c = byKey.get(a.stad + '|' + a.date).find(b => b.id !== a.id && Math.abs(tmin(a.time) - tmin(b.time)) < gap);
    if (c) out.push({ id: a.id, other: c.id, stad: name(next, 'stad', a.stad), date: a.date, time: c.time, teams: name(next, 'teams', c.t1) + ' × ' + name(next, 'teams', c.t2) });
  });
  return out;
}

/* أعضاء الفرق: يجب أن ينتمي كل عضو إلى فريق موجود، مع رخصة واسم وصفة، دون تكرار الرخصة داخل الفريق نفسه */
function memberErrors(prev, next) {
  const T = next.tm; if (T == null) return [];
  if (!Array.isArray(T)) return ['بيانات أعضاء الفرق غير صالحة'];
  const old = new Map(((prev && prev.tm) || []).map(x => [x.id, [x.team, x.lic, x.name, x.role].join('|')]));
  const teams = new Set((next.teams || []).map(t => t.id)), seen = new Map(), err = [];
  T.forEach(x => {
    const k = x.team + '|' + String(x.lic == null ? '' : x.lic).trim().toLowerCase();
    const dupe = seen.has(k); seen.set(k, true);
    if (old.get(x.id) === [x.team, x.lic, x.name, x.role].join('|')) return;
    const nm = String(x.name || '').trim() || '—';
    if (!x.id || typeof x.id !== 'string') err.push('عضو بلا معرّف: ' + nm);
    else if (!teams.has(x.team)) err.push('العضو «' + nm + '» مرتبط بفريق غير موجود');
    else if (!String(x.lic == null ? '' : x.lic).trim()) err.push('العضو «' + nm + '» بلا رقم رخصة');
    else if (!String(x.name || '').trim()) err.push('عضو بلا اسم (رخصة ' + x.lic + ')');
    else if (!String(x.role || '').trim()) err.push('العضو «' + nm + '» بلا صفة');
    else if (dupe) err.push('رقم الرخصة ' + x.lic + ' مكرر داخل الفريق نفسه («' + nm + '»)');
  });
  return err.slice(0, 5);
}

/* يعيد null إن كانت البيانات سليمة، وإلا {status, code, error, details} */
function validateSeason(prev, next) {
  const s = stadConflicts(prev, next);
  if (s.length) {
    const c = s[0];
    return { status: 409, code: 'stad_conflict', details: s, error: 'تعارض في الملعب: توجد مقابلة أخرى مبرمجة على «' + c.stad + '» بتاريخ ' + c.date.replaceAll('-', '/') + ' الساعة ' + c.time + ' (' + c.teams + ').' };
  }
  const e = memberErrors(prev, next);
  if (e.length) return { status: 400, code: 'members_invalid', details: e, error: 'بيانات أعضاء الفرق غير صالحة: ' + e[0] };
  return null;
}
module.exports = { validateSeason, stadConflicts, memberErrors, lateOpen, tmin };
