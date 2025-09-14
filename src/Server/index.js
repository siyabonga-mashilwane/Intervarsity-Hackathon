const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// very small CORS middleware so the client (vite dev server) can fetch
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// handle preflight OPTIONS requests without registering a route pattern
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.sendStatus(200);
  }
  next();
});

// helper: parse a CSV line into array values (handles quoted commas)
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// route: simple root
app.get('/', (req, res) => {
  res.send('Hello welcome to the server!')
});

// route: /api/happening-now -> returns events with date 2020-04-20
app.get('/api/happening-now', (req, res) => {
  const csvPath = path.join(__dirname, 'meetup_events.csv');
  fs.readFile(csvPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading CSV', err);
      return res.status(500).json({ error: 'Failed to read events' });
    }

    const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);
    const headers = parseCsvLine(lines[0]).map(h => h.trim());
    const events = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const event = {};
      for (let j = 0; j < headers.length; j++) {
        event[headers[j]] = cols[j] || '';
      }
      // only include events on 2020-04-20 (happening now per instruction)
      if (event.date === '2020-04-20') {
        events.push(event);
      }
    }

    res.json({ count: events.length, events });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});