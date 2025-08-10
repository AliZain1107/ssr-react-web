// import fs from 'node:fs/promises'
// import express from 'express'

// // Constants
// const isProduction = process.env.NODE_ENV === 'production'
// const port = process.env.PORT || 5173
// const base = process.env.BASE || '/'

// // Cached production assets
// const templateHtml = isProduction
//   ? await fs.readFile('./dist/client/index.html', 'utf-8')
//   : ''

// // Create http server
// const app = express()

// // Add Vite or respective production middlewares
// /** @type {import('vite').ViteDevServer | undefined} */
// let vite
// if (!isProduction) {
//   const { createServer } = await import('vite')
//   vite = await createServer({
//     server: { middlewareMode: true },
//     appType: 'custom',
//     base,
//   })
//   app.use(vite.middlewares)
// } else {
//   const compression = (await import('compression')).default
//   const sirv = (await import('sirv')).default
//   app.use(compression())
//   app.use(base, sirv('./dist/client', { extensions: [] }))
// }

// // Serve HTML
// app.use('*all', async (req, res) => {
//   try {
//     const url = req.originalUrl.replace(base, '')

//     /** @type {string} */
//     let template
//     /** @type {import('./src/entry-server.ts').render} */
//     let render
//     if (!isProduction) {
//       // Always read fresh template in development
//       template = await fs.readFile('./index.html', 'utf-8')
//       template = await vite.transformIndexHtml(url, template)
//       render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
//     } else {
//       template = templateHtml
//       render = (await import('./dist/server/entry-server.js')).render
//     }

//     const rendered = await render(url)

//     const html = template
//       .replace(`<!--app-head-->`, rendered.head ?? '')
//       .replace(`<!--app-html-->`, rendered.html ?? '')

//     res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
//   } catch (e) {
//     vite?.ssrFixStacktrace(e)
//     console.log(e.stack)
//     res.status(500).end(e.stack)
//   }
// })

// // // Start http server
// // app.listen(port, () => {
// //   console.log(`Server started at http://localhost:${port}`)
// // })

// export default app;


import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'node:fs/promises';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const base = '/'; // fixed to avoid path-to-regexp crash

// Cached production template
const templateHtml = isProduction
  ? await fs.readFile(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
  : '';

const app = express();

if (isProduction) {
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv(path.resolve(__dirname, 'dist/client'), { extensions: [] }));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
}

app.get('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');
    let template, render;

    if (!isProduction) {
      const { vite } = globalThis;
      template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
      const viteServer = (await import('vite')).createServer;
      render = (await (await viteServer()).ssrLoadModule('/src/entry-server.tsx')).render;
    } else {
      template = templateHtml;
      render = (await import(path.resolve(__dirname, 'dist/server/entry-server.js'))).render;
    }

    const rendered = await render(url);
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '');

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    console.error(e);
    res.status(500).end(e.stack);
  }
});

// Local dev: start server
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Vercel: export for serverless
export default app;
