const testCtrl = require("../controllers/test");

module.exports = router => {
  router.get("/", testCtrl.workTime); //show all tests with filter
  router.get('/', (req, res) => {
    return res.send(':)')
  });
}