const classController = require('../controllers/class.controller');
var express = require('express');
var router = express.Router();

router.post('/', classController.addClass);
router.get('/', classController.getAllClass);
router.get('/teacher/:teacherId', classController.getClassByTeacher);
router.get('/subject/:subjectId', classController.getClassBySubject);
router.get('/:id', classController.getClass);
router.put('/:id', classController.update);
router.delete('/:id', classController.deleteClass);

module.exports = router;