/** @type {import('next').NextConfig} */
module.exports = {
  serverRuntimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ADMIN_PIN: process.env.ADMIN_PIN,
  },
  publicRuntimeConfig: {},
};
