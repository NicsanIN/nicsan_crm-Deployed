const express = require('express');
const router = express.Router();

// DEBUG: show database environment variables
router.get('/db-env', async (req, res) => {
  try {
    res.json({
      database_url: process.env.DATABASE_URL ? "(set)" : "(not set)",
      sslMode: process.env.SSL_MODE || "default",
      db_user: process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[1].split('//')[1] : null,
      s3_prefix: process.env.S3_PREFIX || "(not set)",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
