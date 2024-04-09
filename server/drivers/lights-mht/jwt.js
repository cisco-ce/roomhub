/**
 * Creates a jwt token that can be used for igor gateway
 */
const crypto = require('crypto');

const header = {
  "typ": "JWT",
  "alg": "HS256"
};

function issueTime() {
  return Math.floor(new Date().getTime() / 1000);
}

function randomId() {
  return Math.floor(Math.random() * 10E8);
}

function toBase64(data) {
  const buff = Buffer.from(data);
  return buff.toString('base64');
}

function createToken(key) {
  const payload = {
    "iat": issueTime(),
    "jti": randomId(),
  };
  const h = toBase64(JSON.stringify(header));
  const p = toBase64(JSON.stringify(payload));
  const raw = h + '.' + p;
  const signed = crypto.createHmac('sha256', key).update(raw).digest("base64");
  const token = raw + '.' + signed;

  return token;
}

module.exports = createToken;
