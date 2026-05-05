const testService = require('../services/test.service');

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

// ─── DELETE ───────────────────────────────────────────────────────────────────

const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;

        await testService.deleteTest(id);

        res.status(200).json({ message: 'Success' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    addTest,
    getTest,
    getAllTests,
    getTestsByClass,
    getTestsByCreator,
    updateTest,
    deleteTest,
};
