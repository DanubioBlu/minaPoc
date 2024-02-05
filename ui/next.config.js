/** @type {import('next').NextConfig} */


var nextConfig = {
  reactStrictMode: false,

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      o1js: require('path').resolve('node_modules/o1js')
    };
    config.experiments = { ...config.experiments, topLevelAwait: true };

    return config;
  },
  // To enable o1js for the web, we must set the COOP and COEP headers.
  // See here for more information: https://docs.minaprotocol.com/zkapps/how-to-write-a-zkapp-ui#enabling-coop-and-coep-headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
            { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
            { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },     
        ],
      },
    ];
  },
  productionBrowserSourceMaps: true,
  

};

if (process.env.NODE_ENV == 'production') {
  nextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    webpack(config) {
      config.resolve.alias = {
        ...config.resolve.alias,
        o1js: require('path').resolve('node_modules/o1js')
      };
      config.experiments = { ...config.experiments, topLevelAwait: true };
  
      return config;
    },
    // To enable o1js for the web, we must set the COOP and COEP headers.
    // See here for more information: https://docs.minaprotocol.com/zkapps/how-to-write-a-zkapp-ui#enabling-coop-and-coep-headers
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin',
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'require-corp',
            },
              { key: "Access-Control-Allow-Credentials", value: "true" },
              { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
              { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
              { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },     
          ],
        },
      ];
    },
    productionBrowserSourceMaps: false,
    
  };


}

module.exports = nextConfig
