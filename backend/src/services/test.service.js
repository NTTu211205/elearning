const db = require('../config/MySQLConnect');
const classService = require('./class.service');
const userService = require('./user.service');

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Tạo đề thi mới cho một lớp học.
 * Validate class_id và createBy trước khi insert.
 */
const createTest = async (testData) => {
    const { name, classId, createBy, turn, startAt, endAt, duration, numQuestion } = testData;

    // Validate lớp học tồn tại
    await classService.getClassById(classId);

    // Validate giáo viên tạo đề tồn tại
    const creator = await userService.getUserById(createBy);
    if (creator.role !== 'teacher' && creator.role !== 'admin') {
        throw new Error('Only teacher or admin can create a test');
    }

    const [result] = await db.execute(
        `INSERT INTO test (name, class_id, createBy, turn, startAt, endAt, duration, num_question)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, classId, createBy, turn ?? 1, startAt, endAt, duration, numQuestion]
    );

    return {
        id: result.insertId,
        name, classId, createBy,
        turn: turn ?? 1,
        startAt, endAt, duration,
        numQuestion
    };
};

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Lấy thông tin chi tiết một đề thi theo ID.
 */
const getTestById = async (id) => {
    const [result] = await db.execute('SELECT * FROM test WHERE id = ?', [id]);

    if (result.length === 0) {
        throw new Error('Test not found');
    }

    return result[0];
};

/**
 * Lấy tất cả đề thi trong hệ thống.
 */
const getAllTests = async () => {
    const [result] = await db.execute('SELECT * FROM test ORDER BY startAt DESC');
    return result;
};

/**
 * Lấy danh sách đề thi theo lớp học (class_id).
 * Validate lớp tồn tại trước khi query.
 */
const getTestsByClassId = async (classId) => {
    await classService.getClassById(classId);

    const [result] = await db.execute(
        `SELECT t.id, t.name, t.turn, t.startAt, t.endAt, t.duration, t.num_question,
                u.name AS createdByName
         FROM test t
         LEFT JOIN user u ON u.id = t.createBy
         WHERE t.class_id = ?
         ORDER BY t.startAt DESC`,
        [classId]
    );

    return result;
};

/**
 * Lấy danh sách đề thi do một giáo viên tạo (createBy).
 */
const getTestsByCreator = async (creatorId) => {
    await userService.getUserById(creatorId);

    const [result] = await db.execute(
        `SELECT t.id, t.name, t.class_id, t.turn, t.startAt, t.endAt, t.duration, t.num_question,
                c.name AS className
         FROM test t
         LEFT JOIN class c ON c.id = t.class_id
         WHERE t.createBy = ?
         ORDER BY t.startAt DESC`,
        [creatorId]
    );

    return result;
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Cập nhật thông tin đề thi theo ID.
 */
const updateTest = async (testData) => {
    const { id, name, classId, turn, startAt, endAt, duration, numQuestion } = testData;

    // Validate lớp học nếu classId được thay đổi
    if (classId) {
        await classService.getClassById(classId);
    }

    const [result] = await db.execute(
        `UPDATE test
         SET name = ?, class_id = ?, turn = ?, startAt = ?, endAt = ?, duration = ?, num_question = ?
         WHERE id = ?`,
        [name, classId, turn, startAt, endAt, duration, numQuestion, id]
    );

    if (result.affectedRows === 0) {
        throw new Error('Test not found');
    }

    return { id, name, classId, turn, startAt, endAt, duration, numQuestion };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Xóa đề thi theo ID.
 */
const deleteTest = async (id) => {
    const [result] = await db.execute('DELETE FROM test WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        throw new Error('Test not found');
    }

    return true;
};

module.exports = {
    createTest,
    getTestById,
    getAllTests,
    getTestsByClassId,
    getTestsByCreator,
    updateTest,
    deleteTest,
};
