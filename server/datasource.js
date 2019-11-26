module.exports = {
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    url: process.env.DB_URL,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    name: "db",
    user: process.env.DB_USER,
    useNewUrlParser: false,
    connector: "mongodb"
  }
};
