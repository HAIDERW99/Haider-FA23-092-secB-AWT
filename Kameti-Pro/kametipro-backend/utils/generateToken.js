const jwt = require('jsonwebtoken');

/**
 * Sign and return a JWT for the given user ID.
 * @param {string} id - MongoDB User _id
 * @returns {string} signed JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
