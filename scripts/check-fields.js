/**
 * Cross-checks twilight.json against the component templates.
 *
 * Guards one specific, silent failure: fields declared in twilight.json are
 * handed to the template on the `component` object. A template that reads them
 * as bare variables (`{{ title }}` instead of `{{ component.title }}`) gets
 * undefined for every field — the section still renders, but completely empty,
 * with no error anywhere. That shipped once and cost a full preview cycle to
 * spot, so it is checked mechanically now.
 *
 *   pnpm run check
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const theme = JSON.parse(fs.readFileSync(path.join(ROOT, 'twilight.json'), 'utf8'));

let failures = 0;

for (const component of theme.components) {
  const file = path.join(
    ROOT,
    'src/views/components',
    component.path.replace(/\./g, '/') + '.twig'
  );

  if (!fs.existsSync(file)) {
    failures++;
    console.log('FAIL  ' + component.path + '  ->  no template at ' + path.relative(ROOT, file));
    continue;
  }

  // Only our own components are checked: Raed's built-in blocks receive some
  // of their data from the platform as bare variables by design.
  if (!component.path.startsWith('home.steamory-')) continue;

  const source = fs.readFileSync(file, 'utf8');
  const ids = (component.fields || []).filter(f => f.type !== 'static').map(f => f.id);
  const unwired = ids.filter(id => !source.includes('component.' + id));

  if (unwired.length) {
    failures++;
    console.log(
      'FAIL  ' + component.path + '  ->  never reads component.' + unwired.join(', component.')
    );
  } else {
    console.log('ok    ' + component.path.padEnd(30) + ids.length + ' fields wired');
  }
}

// Collection sub-fields must be prefixed with their collection id, which is
// how the design panel writes values back.
for (const component of theme.components) {
  for (const field of component.fields || []) {
    if (field.type !== 'collection') continue;
    for (const sub of field.fields || []) {
      if (!sub.id.startsWith(field.id + '.')) {
        failures++;
        console.log(
          'FAIL  ' + component.path + '  ->  ' + sub.id + ' should be named ' + field.id + '.' + sub.id
        );
      }
    }
  }
}

console.log(
  '\n' + theme.components.length + ' components checked, ' + failures + ' problem(s)'
);
process.exit(failures ? 1 : 0);
