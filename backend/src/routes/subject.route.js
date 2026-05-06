const subjectController = require('../controllers/subject.controller');
// const {verifyToken, authorizeRole} = require('../middlewares/auth.middleware')
var express = require('express');
var router = express.Router();

router.post('/', subjectController.addSubject);
router.patch('/:id/toggle-status', subjectController.toggleSubjectStatus);  // before /:id
router.get('/:id', subjectController.getSubjectById);
router.put('/:id', subjectController.updateSubjectInfo);
router.delete('/:id', subjectController.deleteSubject);
router.get('/', subjectController.getAll);

// router.post('/',verifyToken, authorizeRole('admin'), subjectController.addSubject);
// router.get('/:id', verifyToken, subjectController.getSubjectById);
// router.put('/:id', verifyToken, authorizeRole('admin'), subjectController.updateSubjectInfo);
// router.delete('/:id', verifyToken, authorizeRole('admin'), subjectController.deleteSubject);

module.exports = router