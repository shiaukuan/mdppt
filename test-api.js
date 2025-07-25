const http = require('http');

const data = JSON.stringify({
  topic: 'React Hooks',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/slides',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk-test123456789abcdef',
    'Content-Length': data.length,
  },
};

const req = http.request(options, res => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('Response:');

  let responseData = '';
  res.on('data', chunk => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', e => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end();
