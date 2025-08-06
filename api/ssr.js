import { renderPage } from 'vite-plugin-ssr/server';

export default async function handler(req, res) {
  const { url } = req;
  
  try {
    const pageContextInit = {
      urlOriginal: url
    };

    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const { statusCode, headers, body } = httpResponse;

    res.statusCode = statusCode;

    headers.forEach(([name, value]) => {
      res.setHeader(name, value);
    });

    res.end(body);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}