/**
 * Generates the merchant-facing documentation page from twilight.json.
 *
 * Written as a generator rather than a hand-maintained page so the docs can
 * never drift from the theme: every component, field and default listed here
 * is read from the manifest the storefront actually uses.
 *
 *   pnpm run docs   ->   docs/theme-docs.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const theme = JSON.parse(fs.readFileSync(path.join(ROOT, 'twilight.json'), 'utf8'));

const escape = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Static fields carry the panel's own help text; reuse it as the intro. */
const introOf = component => {
  const note = (component.fields || []).find(
    f => f.type === 'static' && f.format === 'description' && /<div/.test(f.value || '')
  );
  if (!note) return '';
  // The panel wraps its notes in a styled div; keep the inner text only.
  return note.value
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '')
    .trim();
};

const TYPE_LABEL = {
  collection: 'قائمة عناصر',
  boolean: 'مفتاح تشغيل',
  items: 'قائمة اختيار',
  number: 'رقم',
};

const FORMAT_LABEL = {
  image: 'صورة',
  textarea: 'نص طويل',
  text: 'نص',
  icon: 'أيقونة',
  date: 'تاريخ',
  'variable-list': 'رابط',
  'dropdown-list': 'قائمة اختيار',
  switch: 'مفتاح تشغيل',
  collection: 'قائمة عناصر',
  integer: 'رقم',
};

const kindOf = field =>
  TYPE_LABEL[field.type] || FORMAT_LABEL[field.format] || FORMAT_LABEL[field.type] || 'نص';

/** Image fields carry the recommended pixel size; surface it prominently. */
const sizeOf = field =>
  field.settings && field.settings.width
    ? `${field.settings.width}×${field.settings.height} بكسل`
    : '';

const fieldRows = (fields, depth = 0) =>
  (fields || [])
    .filter(field => field.type !== 'static')
    .map(field => {
      const rows = [];
      const size = sizeOf(field);
      const notes = [field.description, size && `المقاس: ${size}`]
        .filter(Boolean)
        .join(' — ');

      rows.push(`
        <tr${depth ? ' class="sub"' : ''}>
          <td class="f-name">${depth ? '<span class="indent"></span>' : ''}${escape(field.label || field.id)}</td>
          <td class="f-kind">${escape(kindOf(field))}</td>
          <td class="f-note">${notes || '—'}</td>
        </tr>`);

      if (field.type === 'collection') {
        rows.push(...fieldRows(field.fields, depth + 1));
      }
      return rows.join('');
    })
    .join('');

const ours = theme.components.filter(c => c.path.startsWith('home.steamory-'));
const inherited = theme.components.filter(c => !c.path.startsWith('home.steamory-'));

const componentSection = component => `
  <article class="card" id="${escape(component.path)}">
    <h3>${escape(component.title.ar)}</h3>
    ${introOf(component) ? `<p class="intro">${introOf(component)}</p>` : ''}
    <div class="table-wrap">
      <table>
        <thead><tr><th>الخيار</th><th>النوع</th><th>ملاحظات</th></tr></thead>
        <tbody>${fieldRows(component.fields)}</tbody>
      </table>
    </div>
  </article>`;

/** Every image field across the theme, so sizes live in one place. */
const imageSizes = [];
const collectImages = (fields, componentTitle) => {
  for (const field of fields || []) {
    if (field.format === 'image' && field.settings && field.settings.width) {
      imageSizes.push({
        component: componentTitle,
        label: field.label || field.id,
        size: `${field.settings.width}×${field.settings.height}`,
      });
    }
    if (field.fields) collectImages(field.fields, componentTitle);
  }
};
ours.forEach(c => collectImages(c.fields, c.title.ar));

const settingsRows = theme.settings
  .filter(s => s.type !== 'static' && String(s.id).startsWith('st_'))
  .map(
    s => `
      <tr>
        <td class="f-name">${escape(s.label || s.id)}</td>
        <td class="f-kind">${escape(kindOf(s))}</td>
        <td class="f-note">${escape(s.description || '—')}</td>
      </tr>`
  )
  .join('');

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>دليل استخدام ثيم ستيموري</title>
<meta name="description" content="دليل التاجر لثيم ستيموري: شرح عناصر الصفحة الرئيسية وخيارات التصميم ومقاسات الصور.">
<link rel="stylesheet" href="/fonts/fonts-local.css">
<style>
  :root{
    --bg:#0a0e0b; --raise:#0e1410; --surface:#121a14; --surface-2:#16211a;
    --line:rgba(255,255,255,.08); --line-2:rgba(255,255,255,.17);
    --text:#eef4ee; --muted:#a7b8ab; --muted-2:#7e937f;
    --accent:#5ee36a; --accent-hi:#8af59a; --accent-soft:rgba(94,227,106,.12);
    --accent-line:rgba(94,227,106,.38); --ink:#06130a;
    --display:'Alexandria','IBM Plex Sans Arabic',sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);
       font-family:'IBM Plex Sans Arabic',sans-serif;line-height:1.9;font-size:16px}
  .wrap{max-width:1000px;margin:0 auto;padding:0 20px}
  header{padding:64px 0 40px;border-bottom:1px solid var(--line)}
  h1{font-family:var(--display);font-weight:900;font-size:clamp(1.8rem,5vw,3rem);margin:0 0 12px;line-height:1.2}
  .lede{color:var(--muted);max-width:44rem;margin:0}
  .badge{display:inline-block;padding:5px 14px;border:1px solid var(--accent-line);
         background:var(--accent-soft);color:var(--accent-hi);border-radius:999px;
         font-size:.8rem;margin-bottom:18px}
  h2{font-family:var(--display);font-weight:800;font-size:clamp(1.3rem,3vw,2rem);
     margin:56px 0 6px;scroll-margin-top:20px}
  h2::after{content:'';display:block;width:52px;height:3px;border-radius:99px;
            background:linear-gradient(180deg,#b6f8c0,var(--accent),#37c24c);margin-top:12px}
  h3{font-family:var(--display);font-weight:700;font-size:1.1rem;margin:0 0 8px}
  .section-lede{color:var(--muted);margin:16px 0 28px;max-width:44rem}
  .card{background:var(--raise);border:1px solid var(--line);border-radius:16px;
        padding:22px;margin-bottom:16px}
  .intro{color:var(--muted);margin:0 0 16px;font-size:.94rem}
  .intro strong{color:var(--accent)}
  .table-wrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;min-width:34rem}
  th,td{text-align:start;padding:10px 12px;border-top:1px solid var(--line);vertical-align:top}
  thead th{border-top:0;color:var(--muted-2);font-size:.78rem;font-weight:600;
           text-transform:uppercase;letter-spacing:.06em}
  .f-name{font-weight:600;white-space:nowrap}
  .f-kind{color:var(--muted-2);font-size:.86rem;white-space:nowrap}
  .f-note{color:var(--muted);font-size:.9rem}
  tr.sub .f-name{font-weight:400;color:var(--muted)}
  .indent{display:inline-block;width:14px;border-top:1px solid var(--line-2);
          margin-inline-end:8px;vertical-align:middle}
  .toc{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 8px;padding:0;list-style:none}
  .toc a{display:inline-block;padding:6px 12px;border:1px solid var(--line);
         border-radius:999px;color:var(--muted);text-decoration:none;font-size:.85rem}
  .toc a:hover{border-color:var(--accent-line);color:var(--accent-hi)}
  .tip{border-inline-start:3px solid var(--accent);background:var(--surface);
       padding:14px 18px;border-radius:0 12px 12px 0;margin:18px 0;color:var(--muted)}
  .tip strong{color:var(--text)}
  footer{margin-top:72px;padding:28px 0 56px;border-top:1px solid var(--line);
         color:var(--muted-2);font-size:.86rem}
  a{color:var(--accent)}
</style>
</head>
<body>
<div class="wrap">

<header>
  <span class="badge">دليل التاجر</span>
  <h1>ثيم ستيموري</h1>
  <p class="lede">ثيم داكن مصمّم لمتاجر الألعاب والمنتجات الرقمية. تبني صفحتك الرئيسية من عناصر جاهزة تضيفها وترتّبها وتعدّلها من لوحة تصميم متجرك، بدون أي كود.</p>
</header>

<h2 id="start">كيف تبدأ</h2>
<p class="section-lede">من لوحة تحكم متجرك: <strong>المتجر وقنوات البيع ← تصميم الثيم ← تخصيص</strong>. ستجد لوحة جانبية فيها <strong>عناصر الصفحة</strong>، ومنها تضيف العناصر وترتّبها بالسحب.</p>

<div class="tip">
  <strong>تمييز عناصر الثيم:</strong> كل عنصر مطوّر خصيصاً لهذا الثيم يبدأ اسمه بـ <strong>STM ·</strong> وتجدها كلها مجتمعة في أعلى قائمة الإضافة.
</div>

<h2 id="design">خيارات التصميم</h2>
<p class="section-lede">خيارات عامة تنطبق على المتجر كله، وتجدها في نفس لوحة التخصيص ضمن إعدادات الثيم.</p>
<article class="card">
  <div class="table-wrap">
    <table>
      <thead><tr><th>الخيار</th><th>النوع</th><th>ملاحظات</th></tr></thead>
      <tbody>${settingsRows}</tbody>
    </table>
  </div>
</article>

<div class="tip">
  <strong>الألوان:</strong> اللون الأساسي الذي تختاره من لوحة تصميم سلة ينعكس تلقائياً على الأسعار والأيقونات والأزرار وكل التدرّجات في الثيم. بعض العناصر تتيح لك تجاوز هذا اللون داخل القسم نفسه.
</div>

<h2 id="components">عناصر الصفحة الرئيسية</h2>
<p class="section-lede">${ours.length} عنصراً، كل واحد منها يُضاف ويُكرَّر ويُرتَّب كما تشاء.</p>
<ul class="toc">
  ${ours.map(c => `<li><a href="#${escape(c.path)}">${escape(c.title.ar.replace('STM · ', ''))}</a></li>`).join('\n  ')}
</ul>
${ours.map(componentSection).join('\n')}

<h2 id="images">مقاسات الصور</h2>
<p class="section-lede">التزم بهذه المقاسات لتظهر الصور بأفضل جودة وبدون اقتصاص غير متوقع.</p>
<article class="card">
  <div class="table-wrap">
    <table>
      <thead><tr><th>العنصر</th><th>الصورة</th><th>المقاس</th></tr></thead>
      <tbody>
        ${imageSizes
          .map(
            i => `<tr><td class="f-name">${escape(i.component.replace('STM · ', ''))}</td>
                      <td class="f-note">${escape(i.label)}</td>
                      <td class="f-kind">${escape(i.size)} بكسل</td></tr>`
          )
          .join('\n        ')}
      </tbody>
    </table>
  </div>
</article>

<h2 id="inherited">عناصر إضافية</h2>
<p class="section-lede">عناصر أساسية متوفرة أيضاً بجانب عناصر الثيم.</p>
<article class="card">
  <div class="table-wrap">
    <table>
      <thead><tr><th>العنصر</th><th>الوصف</th></tr></thead>
      <tbody>
        ${inherited
          .map(
            c => `<tr><td class="f-name">${escape(c.title.ar)}</td>
                      <td class="f-note">${escape(c.title.en || '')}</td></tr>`
          )
          .join('\n        ')}
      </tbody>
    </table>
  </div>
</article>

<h2 id="support">الدعم</h2>
<p class="section-lede">لأي استفسار أو مشكلة في الثيم، تواصل معنا عبر البريد
  <a href="mailto:aba.alrous@hotmail.com">aba.alrous@hotmail.com</a>
  أو من <a href="https://stmory.com">stmory.com</a>.</p>

<footer>
  دليل ثيم ستيموري — يُحدَّث تلقائياً مع كل تحديث للثيم.
</footer>

</div>
</body>
</html>
`;

const outDir = path.join(ROOT, 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'theme-docs.html');
fs.writeFileSync(outFile, html, 'utf8');

console.log('wrote ' + path.relative(ROOT, outFile));
console.log('  components documented : ' + ours.length);
console.log('  design options        : ' + (settingsRows.match(/<tr>/g) || []).length);
console.log('  image sizes listed    : ' + imageSizes.length);
console.log('  size                  : ' + Math.round(html.length / 1024) + ' KB');
