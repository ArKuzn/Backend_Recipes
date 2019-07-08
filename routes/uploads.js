const indexCtrl = require('../controllers/index');

module.exports = router => {
    router.get('/:recipeId/:imageId', indexCtrl.imageGet)
    router.get('/users/:hash/avatar.jpg', indexCtrl.avatarGet)
    router.get('/', (req, res) => {
        return res.send(':)')
    });
};

