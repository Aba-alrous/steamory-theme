// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true,
        // postcss-preset-env rewrites logical properties to physical ones
        // assuming left-to-right, so `border-inline-start` became
        // `border-left` — the wrong edge on an Arabic storefront. The
        // 06-steamory layer relies on the browser resolving these against
        // `dir` instead, and every browser has done so since 2021. Raed's own
        // stylesheets use no logical properties at all (it handles direction
        // with Tailwind's rtl:/ltr: variants), so nothing else is affected.
        'logical-properties-and-values': false,
      },
    },
  }
}