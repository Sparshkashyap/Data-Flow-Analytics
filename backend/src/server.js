const app = require('./app');
const env = require('./config/env');

const PORT = env.port || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
