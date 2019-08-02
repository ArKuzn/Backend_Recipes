const env = process.env.NODE_ENV || 'development';
console.log('env', env);
let localConfig;
try {
  localConfig = require('./config.json');
} catch (err) {
  console.log('Local config not found', err);
}
let config = {
  development: {
    username: "postgres",
    password: '',
    database: "Users",
    host: "127.0.0.1",
    dialect: "postgres",
    operatorsAliases: false,
    define: {
      "timestamps": false
    },
    email: {
      user: '',
      password: '',
    }
  },
  production: {
    username: "postgres",
    password: null,
    database: "Users",
    host: "127.0.0.1",
    dialect: "postgres",
    operatorsAliases: false,
    define: {
      "timestamps": false
    },
    email: {
      user: '',
      password: '',
    }
  },
};
if (localConfig) {
  config = Object.assign(config, localConfig);
}
module.exports = config[env];