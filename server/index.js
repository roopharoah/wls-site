require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const compressionGzip = require('express-static-gzip');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (with gzip compression)
app.use(compressionGzip.express({ enableBrotli: true }));
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: false
}));

// API Routes
app.use('/api/enroll', require('./api/enroll'));
app.use('/api/blog', require('./api/blog'));
app.use('/api/newsletter', require('./api/newsletter'));
app.use('/admin', require('./api/admin'));

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/courses', (req, res) => res.sendFile(path.join(__dirname, '../public/pages/courses.html')));
app.get('/enroll', (req, res) => res.sendFile(path.join(__dirname, '../public/pages/enroll.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, '../public/pages/blog.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, '../public/pages/contact.html')));
app.get('/why-german', (req, res) => res.sendFile(path.join(__dirname, '../public/pages/why-german.html')));

// 404 handler
app.get('*', (req, res) => res.status(404).sendFile(path.join(__dirname, '../public/404.html')));

app.listen(PORT, () => {
  console.log(`✓ WLS Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ Site: ${process.env.SITE_URL || 'http://localhost:' + PORT}`);
});

module.exports = app;
