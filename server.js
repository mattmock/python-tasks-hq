const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the site directory
app.use('/', express.static('site'));
// Serve static files from the data directory
app.use('/data', express.static('data'));

// Handle component paths
app.get('/site/*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 