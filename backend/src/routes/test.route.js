const testController = require('../controllers/test.controller');
var express = require('express');
var router = express.Router();

router.post('/', testController.addTest);
router.get('/', testController.getAllTests);
router.get('/class/:classId', testController.getTestsByClass);
router.get('/creator/:creatorId', testController.getTestsByCreator);
router.get('/:id', testController.getTest);
router.put('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);

module.exports = router;
