const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.redirect('/search');
});

app.get('/search', (req, res) => {
  const query = req.query.q || '';
  res.render('index', { query });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Modern Search running on http://localhost:${PORT}`);
});
