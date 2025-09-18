function withPrefix(key) {
  const prefix = process.env.S3_PREFIX ? process.env.S3_PREFIX.replace(/\/+$/, '') + '/' : '';
  return prefix + key;
}

module.exports = { withPrefix };
