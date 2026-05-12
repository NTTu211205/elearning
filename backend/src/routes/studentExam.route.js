const express = require('express');
const router = express.Router();
const examController = require('../controllers/studentExam.controller');

router.post('/start', examController.startExam);
router.get('/result/student/:studentId/test/:testId', examController.getSubmissionByStudentTest);
router.get('/test/:testId/question-stats', examController.getQuestionStats);
router.get('/:doexamId', examController.getSession);
router.put('/:doexamId/draft', examController.saveDraft);
router.post('/:doexamId/submit', examController.submitExam);
router.get('/:doexamId/result', examController.getResult);

module.exports = router;
