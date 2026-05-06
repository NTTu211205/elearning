const db = require('../config/MySQLConnect');
const classService = require('./class.service');
const userService = require('./user.service');

/**
 * Chuyển chuỗi ISO 8601 sang định dạng MySQL DATETIME: 'YYYY-MM-DD HH:MM:SS'
 */
const toMySQLDatetime = (isoStr) => {
    if (!isoStr) return null;
    return new Date(isoStr).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Tạo đề thi mới cho một lớp học.
 * Validate class_id và createBy trước khi insert.
 */
const createTest = async (testData) => {
    const { name, classId, createBy, turn, startAt, endAt, duration, numQuestion, type } = testData;

    // Validate lớp học tồn tại
    await classService.getClassById(classId);

    // Validate giáo viên tạo đề tồn tại
    const creator = await userService.getUserById(createBy);
    if (creator.role !== 'teacher' && creator.role !== 'admin') {
        throw new Error('Only teacher or admin can create a test');
    }

    const testType = type || 'regular';

    const [result] = await db.execute(
        `INSERT INTO test (name, class_id, createBy, turn, startAt, endAt, duration, num_question, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, classId, createBy, turn ?? 1, toMySQLDatetime(startAt), toMySQLDatetime(endAt), duration, numQuestion, testType]
    );

    return {
        id: result.insertId,
        name, classId, createBy,
        turn: turn ?? 1,
        startAt, endAt, duration,
        numQuestion, type: testType
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
        `SELECT
             t.id,
             t.name,
             t.turn,
             t.startAt,
             t.endAt,
             t.duration,
             t.num_question,
             t.type,
             u.name AS createdByName,
             COUNT(DISTINCT CASE WHEN de.status = 'DONE' THEN de.student_id END) AS submittedCount,
             ROUND(AVG(CASE WHEN de.status = 'DONE' THEN de.score END), 1)       AS avgScore
         FROM test t
         LEFT JOIN user u     ON u.id = t.createBy
         LEFT JOIN doexam de  ON de.test_id = t.id
         WHERE t.class_id = ?
         GROUP BY t.id, t.name, t.turn, t.startAt, t.endAt, t.duration, t.num_question, t.type, u.name
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
        `SELECT t.id, t.name, t.class_id, t.turn, t.startAt, t.endAt, t.duration, t.num_question, t.type,
                c.name AS className
         FROM test t
         LEFT JOIN class c ON c.id = t.class_id
         WHERE t.createBy = ?
         ORDER BY t.startAt DESC`,
        [creatorId]
    );

    return result;
};

/**
 * Lấy thông tin chi tiết đề thi kèm tên lớp và môn học.
 */
const getTestDetail = async (id) => {
    const [rows] = await db.execute(
        `SELECT t.id, t.name, t.class_id, t.createBy, t.turn, t.startAt, t.endAt,
                t.duration, t.num_question, t.type,
                c.name AS className, c.subject_id AS subjectId,
                s.name AS subjectName
         FROM test t
         LEFT JOIN class c ON c.id = t.class_id
         LEFT JOIN subject s ON s.id = c.subject_id
         WHERE t.id = ?`,
        [id]
    );
    if (rows.length === 0) throw new Error('Test not found');
    return rows[0];
};

/**
 * Lấy kết quả làm bài của tất cả học sinh đã đăng ký lớp chứa đề thi.
 * Với mỗi học sinh, lấy lượt làm có điểm cao nhất.
 */
const getTestResults = async (testId) => {
    const [rows] = await db.execute(
        `SELECT
            u.id            AS studentId,
            u.name          AS studentName,
            c.id            AS classId,
            c.name          AS className,
            c.subject_id    AS subjectId,
            t.num_question  AS totalQuestions,
            (
                SELECT d.score
                FROM doexam d
                WHERE d.student_id = u.id AND d.test_id = t.id
                ORDER BY d.score DESC
                LIMIT 1
            ) AS score,
            (
                SELECT d.submitAt
                FROM doexam d
                WHERE d.student_id = u.id AND d.test_id = t.id
                ORDER BY d.score DESC
                LIMIT 1
            ) AS submitAt
         FROM test t
         JOIN class c       ON c.id = t.class_id
         JOIN enrollment e  ON e.class_id = t.class_id
         JOIN user u        ON u.id = e.student_id
         WHERE t.id = ?
         ORDER BY score DESC, u.name ASC`,
        [testId]
    );
    return rows;
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Cập nhật thông tin đề thi theo ID.
 */
const updateTest = async (testData) => {
    const { id, name, classId, turn, startAt, endAt, duration, numQuestion, type } = testData;

    // Validate lớp học nếu classId được thay đổi
    if (classId) {
        await classService.getClassById(classId);
    }

    const [result] = await db.execute(
        `UPDATE test
         SET name = ?, class_id = ?, turn = ?, startAt = ?, endAt = ?, duration = ?, num_question = ?, type = ?
         WHERE id = ?`,
        [name, classId, turn, toMySQLDatetime(startAt), toMySQLDatetime(endAt), duration, numQuestion, type || 'regular', id]
    );

    if (result.affectedRows === 0) {
        throw new Error('Test not found');
    }

    return { id, name, classId, turn, startAt, endAt, duration, numQuestion, type };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Xóa đề thi theo ID.
 */
const deleteTest = async (id) => {
    // Xóa doexam trước để tránh lỗi FK constraint
    await db.execute('DELETE FROM doexam WHERE test_id = ?', [id]);

    const [result] = await db.execute('DELETE FROM test WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        throw new Error('Test not found');
    }

    return true;
};

/**
 * Cập nhật số câu hỏi của một đề thi (sau khi lưu câu hỏi vào MongoDB).
 */
const updateNumQuestion = async (id, numQuestion) => {
    await db.execute(
        'UPDATE test SET num_question = ? WHERE id = ?',
        [numQuestion, id]
    );
};

module.exports = {
    createTest,
    getTestById,
    getTestDetail,
    getTestResults,
    getAllTests,
    getTestsByClassId,
    getTestsByCreator,
    updateTest,
    updateNumQuestion,
    deleteTest,
};
