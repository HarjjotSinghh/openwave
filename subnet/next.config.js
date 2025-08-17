module.exports = {
  reactStrictMode: true,
  env: {
    AVALANCHE_NETWORK: process.env.AVALANCHE_NETWORK || 'fuji',
    AVALANCHE_API_URL: process.env.AVALANCHE_API_URL || 'https://api.avax-test.network',
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};