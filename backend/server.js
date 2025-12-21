require('dotenv').config();
const app = require('./src/app');
const spkRoutes = require('./src/routes/spkRoutes');

const PORT = process.env.PORT || 5000;

app.use('/api/spk', spkRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});