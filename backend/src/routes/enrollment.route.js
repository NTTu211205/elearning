const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');

// CREATE
router.post('/', enrollmentController.enrollStudent);
router.post('/bulk', enrollmentController.enrollStudents);

// READ
router.get('/', enrollmentController.getAllEnrollments);
router.get('/class/:classId', enrollmentController.getStudentsByClass);
router.get('/class/:classId/student/:studentId/detail', enrollmentController.getStudentDetailInClass);
router.get('/student/:studentId/classes-with-tests', enrollmentController.getClassesWithTests);
router.get('/student/:studentId', enrollmentController.getClassesByStudent);

// UPDATE
router.put('/:studentId/:classId', enrollmentController.updateAverageScore);

// DELETE
router.delete('/class/:classId', enrollmentController.removeAllStudentsFromClass);
router.delete('/:studentId/:classId', enrollmentController.removeStudent);

module.exports = router;
