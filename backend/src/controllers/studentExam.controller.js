const studentExamService = require('../services/studentExam.service');

// POST /exam/start
const startExam = async (req, res) => {
    try {
        const { studentId, testId } = req.body;
        if (!studentId || !testId) return res.status(400).json({ message: 'studentId and testId are required' });
        const result = await studentExamService.startExam(studentId, testId);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /exam/:doexamId
const getSession = async (req, res) => {
    try {
        const { doexamId } = req.params;
        const result = await studentExamService.getExamSession(doexamId);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// PUT /exam/:doexamId/draft
const saveDraft = async (req, res) => {
    try {
        const { doexamId } = req.params;
        const { answers } = req.body;
        if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers must be an array' });
        const result = await studentExamService.saveDraft(doexamId, answers);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// POST /exam/:doexamId/submit
const submitExam = async (req, res) => {
    try {
        const { doexamId } = req.params;
        const { answers } = req.body;
        if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers must be an array' });
        const result = await studentExamService.submitExam(doexamId, answers);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /exam/:doexamId/result
const getResult = async (req, res) => {
    try {
        const { doexamId } = req.params;
        const result = await studentExamService.getExamResult(doexamId);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /exam/result/student/:studentId/test/:testId
const getSubmissionByStudentTest = async (req, res) => {
    try {
        const { studentId, testId } = req.params;
        const result = await studentExamService.getSubmissionByStudentTest(studentId, testId);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

module.exports = { startExam, getSession, saveDraft, submitExam, getResult, getSubmissionByStudentTest };
