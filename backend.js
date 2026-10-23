const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const movies = JSON.parse(fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8'));
const port = Number(process.env.PORT) || 10000;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const filters = {
  languages: unique(movies.map((movie) => movie.language)),
  genres: unique(movies.map((movie) => movie.genre)),
  viewingStyles: unique(movies.flatMap((movie) => movie.audience || [])),
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return response.end();
  }

  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  if (url.pathname === '/' || url.pathname === '/health') {
    return sendJson(response, 200, { status: 'ok', service: 'Cinema Compass movie catalog', movies: movies.length });
  }

  if (url.pathname === '/api/filters') {
    return sendJson(response, 200, filters);
  }

  if (url.pathname === '/api/movies') {
    const language = url.searchParams.get('language');
    const genre = url.searchParams.get('genre');
    const viewingStyle = url.searchParams.get('viewingStyle');
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || String(movies.length), 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 2000) : movies.length;
    const matches = movies.filter((movie) =>
      (!language || language === 'any' || movie.language === language) &&
      (!genre || genre === 'any' || movie.genre === genre) &&
      (!viewingStyle || viewingStyle === 'any' || (movie.audience || []).includes(viewingStyle))
    );
    return sendJson(response, 200, {
      count: matches.length,
      movies: matches.slice(0, limit),
      filtersApplied: { language: language || 'any', genre: genre || 'any', viewingStyle: viewingStyle || 'any' },
    });
  }

  return sendJson(response, 404, { error: 'Route not found' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Cinema Compass API listening on 0.0.0.0:${port} with ${movies.length} movies`);
});
