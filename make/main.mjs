import fs from              'fs'
import linkCss from         './linkCss/main.mjs'
import linkJs from          './linkJs/main.mjs'
import minifyCss from       './minifyCss/main.mjs'
import minifyHtml from      './minifyHtml/main.mjs'
import minifyJs from        './minifyJs/main.mjs'
fs.promises.writeFile('build/root',await minifyHtml(`
  <!doctype html>
  <title>Note</title>
  <meta name=viewport content='initial-scale=1,width=device-width,interactive-widget=resizes-content'>
  <link rel=icon href=/%23favicon16 sizes=16x16>
  <link rel=icon href=/%23favicon32 sizes=32x32>
  <link rel=icon href=/%23favicon192 sizes=192x192>
  <link rel=icon href=/%23favicon512 sizes=512x512>
  <link rel=manifest href=/%23manifest>
  <style>${minifyCss(await linkCss('root/main.css'))}</style>
  <body>
  <script type=module>${await minifyJs(await linkJs('root/main.mjs'))}</script>
`))
fs.promises.writeFile('build/sw',await minifyJs(await linkJs('sw/main.mjs')))
fs.promises.writeFile('build/manifest',JSON.stringify(
  JSON.parse(await fs.promises.readFile('manifest'))
))
