import http from 'node:http';
const port = Number(process.env.PERF_PORT ?? 4173);
const host = '127.0.0.1';

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>FitVibe Performance Harness</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; background: #0f172a; color: #f1f5f9; }
      h1 { font-size: 2.5rem; margin-bottom: 1rem; }
      .card { border-radius: 1rem; padding: 1.5rem; background: rgba(15, 23, 42, 0.7); box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.8); max-width: 42rem; }
      .pill { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(96, 165, 250, 0.1); color: #cbd5f5; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
      p { margin: 0.75rem 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="pill">FitVibe</span>
      <h1>Performance Smoke Harness</h1>
      <p>This lightweight page allows CI to validate Lighthouse budgets without needing the full frontend stack.</p>
      <p>It mimics a fast-loading dashboard shell and keeps assets well below the 300 KB bundle threshold defined in the PRD.</p>
    </div>
  </body>
</html>`;

const metricsPayload = `# HELP fitvibe_mock_request_latency_seconds Mock latency histogram
# TYPE fitvibe_mock_request_latency_seconds histogram
fitvibe_mock_request_latency_seconds_bucket{le="0.05"} 5
fitvibe_mock_request_latency_seconds_bucket{le="0.1"} 10
fitvibe_mock_request_latency_seconds_bucket{le="0.25"} 10
fitvibe_mock_request_latency_seconds_bucket{le="0.5"} 10
fitvibe_mock_request_latency_seconds_bucket{le="1"} 10
fitvibe_mock_request_latency_seconds_bucket{le="+Inf"} 10
fitvibe_mock_request_latency_seconds_sum 0.21
fitvibe_mock_request_latency_seconds_count 10
`;

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }

  if (req.url.startsWith('/health')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    );
    return;
  }

  if (req.url.startsWith('/metrics')) {
    res.setHeader('Content-Type', 'text/plain');
    res.end(metricsPayload);
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(indexHtml);
});

server.listen(port, host, () => {
  console.log(`[perf] Mock server listening at http://${host}:${port}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
