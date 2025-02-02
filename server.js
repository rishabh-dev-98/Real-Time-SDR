const cors_proxy = require('cors-anywhere');

const host = '0.0.0.0';
const port = process.env.PORT || 8080;  // Heroku uses dynamic port or fallback to 8080 locally

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins (change this in production)
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
    console.log(`CORS Anywhere running on http://${host}:${port}`);
});
