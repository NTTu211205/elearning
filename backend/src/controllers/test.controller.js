const testService = require('../services/test.service');
const questionService = require('../services/question.service');

// ─── CREATE ───────────────────────────────────────────────────────────────────

const addTest = async (req, res) => {
    try {
        const { name, classId, createBy, turn, startAt, endAt, duration, numQuestion } = req.body;

        const result = await testService.createTest({ name, classId, createBy, turn, startAt, endAt, duration, numQuestion });

        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── READ ─────────────────────────────────────────────────────────────────────

const getTest = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await testService.getTestById(id);

        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAllTests = async (req, res) => {
    try {
        const result = await testService.getAllTests();

        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTestsByClass = async (req, res) => {
    try {
        const { classId } = req.params;

        const result = await testService.getTestsByClassId(classId);

        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTestsByCreator = async (req, res) => {
    try {
        const { creatorId } = req.params;

        const result = await testService.getTestsByCreator(creatorId);

        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classId, turn, startAt, endAt, duration, numQuestion } = req.body;

        const result = await testService.updateTest({ id, name, classId, turn, startAt, endAt, duration, numQuestion });

        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTestDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await testService.getTestDetail(id);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTestResults = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await testService.getTestResults(id);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── QUESTIONS (MongoDB) ──────────────────────────────────────────────────────

const getTestQuestions = async (req, res) => {
    try {
        const { id } = req.params;
        const questions = await questionService.getQuestions(id);
        res.status(200).json({ message: 'Success', data: questions });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Lưu (thay thế) toàn bộ câu hỏi của đề thi vào MongoDB,
 * đồng thời cập nhật num_question trong MySQL.
 */
const saveTestQuestions = async (req, res) => {
    try {
        const { id } = req.params;
        const { questions } = req.body;

        await testService.getTestById(id);

        const saved = await questionService.saveQuestions(id, questions ?? []);

        await testService.updateNumQuestion(id, saved.length);

        res.status(200).json({ message: 'Success', data: saved.length });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;

        await testService.deleteTest(id);           // MySQL: xóa doexam + test
        await questionService.deleteQuestions(id);  // MongoDB: xóa QuestionBank

        res.status(200).json({ message: 'Success' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    addTest,
    getTest,
    getTestDetail,
    getTestResults,
    getAllTests,
    getTestsByClass,
    getTestsByCreator,
    updateTest,
    deleteTest,
    getTestQuestions,
    saveTestQuestions,
};
