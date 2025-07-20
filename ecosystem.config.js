module.exports = {
  apps: [
    {
      name: "asahsikecil-web",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3003
      }
    },
    {
      name: "asahsikecil-api",
      script: "api-server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        API_PORT: 3004
      }
    }
  ]
};