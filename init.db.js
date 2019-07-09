const db = require('./models');

const initDB = () => db.sequelize.drop({ cascade: true })
    .then(() => db.sequelize.sync())
    //  .then(() => db.user.create({
    //    // some fields
    //  }))
    .then(() => console.log('Everything is OK'))
    .catch(err => console.log('ERROR:', err.message));

initDB();