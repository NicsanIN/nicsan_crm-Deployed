// S3 Prefix Helper for Environment Separation
const RAW = (process.env.S3_PREFIX || '').trim();

// normalize: strip leading/trailing slashes, add one trailing slash if non-empty
const PREFIX = RAW ? RAW.replace(/^\/+/, '').replace(/\/+$/, '') + '/' : '';

/**
 * Prepend the S3_PREFIX (if any) to a given key path
 * @param {string} path - The S3 key path
 * @returns {string} - The prefixed path
 * 
 * Examples:
 * - withPrefix('uploads/file.pdf') → 'uploads/file.pdf' (prod)
 * - withPrefix('uploads/file.pdf') → 'staging/uploads/file.pdf' (staging)
 */
const withPrefix = (path) => `${PREFIX}${path}`;

/**
 * Get the current S3 prefix (for logging/debugging)
 * @returns {string} - The current prefix
 */
const getPrefix = () => PREFIX;

/**
 * Check if we're using a prefix (staging environment)
 * @returns {boolean} - True if prefix is active
 */
const hasPrefix = () => PREFIX.length > 0;

module.exports = {
  withPrefix,
  getPrefix,
  hasPrefix
};