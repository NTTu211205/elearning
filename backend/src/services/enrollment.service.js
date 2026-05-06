const db = require('../config/MySQLConnect');
const userService = require('./user.service');
const classService = require('./class.service');

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Thêm một student vào một class.
 * Dùng userService.getUserById() có sẵn để lấy user, sau đó kiểm tra role.
 */
const enrollStudent = async (studentId, classId) => {
    // Validate user tồn tại qua getUserById (throw nếu không tìm thấy)
    const user = await userService.getUserById(studentId);
    if (user.role !== 'student') {
        throw new Error(`User ${studentId} is not a student`);
    }

    // Validate class qua classService — throw nếu không tồn tại
    await classService.getClassById(classId);

    // Check duplicate trên bảng enrollment
    const [existing] = await db.execute(
        'SELECT student_id FROM enrollment WHERE student_id = ? AND class_id = ?',
        [studentId, classId]
    );
    if (existing.length > 0) {
        throw new Error(`Student ${studentId} is already enrolled in this class`);
    }

    await db.execute(
        'INSERT INTO enrollment (student_id, class_id) VALUES (?, ?)',
        [studentId, classId]
    );

    return { studentId, classId };
};

/**
 * Thêm nhiều students vào một class cùng lúc.
 * Validate class một lần qua classService.
 * Validate từng student qua userService.getUserById() + check role.
 * Trả về { enrolled: [...], failed: [...] }.
 */
const enrollStudents = async (studentIds, classId) => {
    // Validate class một lần — throw ngay nếu không tồn tại
    await classService.getClassById(classId);

    const enrolled = [];
    const failed = [];

    for (const studentId of studentIds) {
        try {
            // Validate user qua getUserById rồi check role
            const user = await userService.getUserById(studentId);
            if (user.role !== 'student') {
                failed.push({ studentId, reason: `User ${studentId} is not a student` });
                continue;
            }

            // Check duplicate trên bảng enrollment
            const [existing] = await db.execute(
                'SELECT student_id FROM enrollment WHERE student_id = ? AND class_id = ?',
                [studentId, classId]
            );
            if (existing.length > 0) {
                failed.push({ studentId, reason: 'Already enrolled' });
                continue;
            }

            await db.execute(
                'INSERT INTO enrollment (student_id, class_id) VALUES (?, ?)',
                [studentId, classId]
            );
            enrolled.push(studentId);
        } catch (err) {
            failed.push({ studentId, reason: err.message });
        }
    }

    return { enrolled, failed };
};

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả enrollment (toàn hệ thống).
 */
const getAllEnrollments = async () => {
    const [result] = await db.execute('SELECT * FROM enrollment');
    return result;
};

/**
 * Lấy danh sách students đã đăng ký một lớp.
 * Trả về thông tin học sinh kèm điểm trung bình và số bài thi đã hoàn thành.
 * Validate class qua classService, sau đó JOIN enrollment + doexam + test.
 */
const getStudentsByClass = async (classId) => {
    // Validate class qua classService — throw nếu không tồn tại
    await classService.getClassById(classId);

    const [result] = await db.execute(
        `SELECT
             u.id,
             u.name,
             u.email,
             u.phone,
             u.dob,
             e.averageScore,
             COUNT(de.id) AS totalExamsDone
         FROM enrollment e
         JOIN user u ON e.student_id = u.id
         LEFT JOIN doexam de
             ON de.student_id = u.id
             AND de.status = 'DONE'
             AND de.test_id IN (SELECT id FROM test WHERE class_id = ?)
         WHERE e.class_id = ?
         GROUP BY u.id, u.name, u.email, u.phone, u.dob, e.averageScore`,
        [classId, classId]
    );
    return result;
};

/**
 * Lấy danh sách lớp học mà một student đã đăng ký.
 * Validate user qua userService.getUserById().
 */
const getClassesByStudent = async (studentId) => {
    // Validate user tồn tại qua getUserById
    await userService.getUserById(studentId);

    const [result] = await db.execute(
        `SELECT c.id, c.subject_id, c.teacher_id, c.quantity, e.averageScore
         FROM enrollment e
         JOIN class c ON e.class_id = c.id
         WHERE e.student_id = ?`,
        [studentId]
    );
    return result;
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Cập nhật điểm trung bình của một student trong một lớp.
 */
const updateAverageScore = async (studentId, classId, averageScore) => {
    const [result] = await db.execute(
        'UPDATE enrollment SET averageScore = ? WHERE student_id = ? AND class_id = ?',
        [averageScore, studentId, classId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Enrollment record not found');
    }

    return { studentId, classId, averageScore };
};

// ─── STUDENT CLASSES WITH TESTS ───────────────────────────────────────────────

/**
 * Lấy danh sách lớp học của sinh viên kèm các bài thi và trạng thái làm bài.
 */
const getClassesWithTestsByStudent = async (studentId) => {
    await userService.getUserById(studentId);

    const [rows] = await db.execute(
        `SELECT
             c.id                                                            AS classId,
             c.name                                                          AS className,
             c.status                                                        AS classStatus,
             c.createdAt                                                     AS classCreatedAt,
             s.name                                                          AS subjectName,
             t.id                                                            AS testId,
             t.name                                                          AS testName,
             t.turn                                                          AS maxTurns,
             t.startAt,
             t.endAt,
             t.duration,
             t.num_question,
             COUNT(DISTINCT CASE WHEN de.status = 'DONE'  THEN de.id END)  AS doneTurns,
             MAX(CASE WHEN de.status = 'DONE'  THEN de.score END)          AS bestScore,
             MAX(CASE WHEN de.status = 'DOING' THEN de.id   END)           AS ongoingDoexamId
         FROM enrollment e
         JOIN class   c ON c.id = e.class_id
         JOIN subject s ON s.id = c.subject_id
         LEFT JOIN test t ON t.class_id = c.id
         LEFT JOIN doexam de ON de.test_id = t.id AND de.student_id = e.student_id
         WHERE e.student_id = ?
         GROUP BY c.id, c.name, c.status, c.createdAt, s.name,
                  t.id, t.name, t.turn, t.startAt, t.endAt, t.duration, t.num_question
         ORDER BY c.createdAt DESC, t.startAt DESC`,
        [studentId]
    );

    const classMap = new Map();
    for (const row of rows) {
        if (!classMap.has(row.classId)) {
            classMap.set(row.classId, {
                classId: row.classId,
                className: row.className,
                classStatus: row.classStatus,
                subjectName: row.subjectName,
                tests: [],
            });
        }
        if (row.testId !== null) {
            classMap.get(row.classId).tests.push({
                testId: row.testId,
                testName: row.testName,
                maxTurns: row.maxTurns,
                startAt: row.startAt,
                endAt: row.endAt,
                duration: row.duration,
                numQuestion: row.num_question,
                doneTurns: row.doneTurns,
                bestScore: row.bestScore,
                ongoingDoexamId: row.ongoingDoexamId,
            });
        }
    }

    return Array.from(classMap.values());
};

// ─── STUDENT DETAIL IN CLASS ──────────────────────────────────────────────────

/**
 * Lấy thông tin chi tiết một student trong lớp: profile + kết quả từng bài thi.
 * Dùng cho trang teacher > class > student detail.
 */
const getStudentDetailInClass = async (classId, studentId) => {
    const StudentAnswer = require('../models/StudentAnswer');

    // Student profile + class info
    const [profileRows] = await db.execute(
        `SELECT u.id AS studentId, u.name AS studentName, u.email, u.phone, u.dob,
                c.id AS classId, c.name AS className, s.name AS subjectName, s.id AS subjectId,
                e.averageScore
         FROM enrollment e
         JOIN user    u ON u.id = e.student_id
         JOIN class   c ON c.id = e.class_id
         JOIN subject s ON s.id = c.subject_id
         WHERE e.student_id = ? AND e.class_id = ?`,
        [studentId, classId]
    );
    if (profileRows.length === 0) throw new Error('Student not enrolled in this class');
    const profile = profileRows[0];

    // All tests in the class
    const [testRows] = await db.execute(
        `SELECT t.id AS testId, t.name AS testName, t.num_question AS questionCount,
                t.duration, t.startAt, t.endAt
         FROM test t
         WHERE t.class_id = ?
         ORDER BY t.startAt DESC`,
        [classId]
    );

    // Best DONE doexam per test for this student
    const [doexamRows] = await db.execute(
        `SELECT de.id AS doexamId, de.test_id AS testId, de.score, de.submitAt, de.turn
         FROM doexam de
         INNER JOIN (
             SELECT test_id, MAX(score) AS maxScore
             FROM doexam
             WHERE student_id = ? AND status = 'DONE'
             GROUP BY test_id
         ) best ON de.test_id = best.test_id AND de.score = best.maxScore
         WHERE de.student_id = ? AND de.status = 'DONE'`,
        [studentId, studentId]
    );

    // Build doexam map (testId → best doexam)
    const doexamMap = new Map();
    for (const de of doexamRows) {
        if (!doexamMap.has(de.testId)) doexamMap.set(de.testId, de);
    }

    // Fetch MongoDB StudentAnswer for each best doexam to get counts
    const Question = require('../models/Question');
    const tests = await Promise.all(testRows.map(async (t) => {
        const de = doexamMap.get(t.testId);
        if (!de) {
            return { ...t, score: null, submitAt: null, turn: null, correctCount: 0, wrongCount: 0, skippedCount: 0 };
        }

        const savedDoc = await StudentAnswer.findOne({ doexamId: de.doexamId }).lean();
        const savedAnswers = savedDoc?.answers ?? [];
        const questions = await Question.find({ testId: Number(t.testId) }).lean();
        const qMap = new Map(questions.map((q) => [q._id.toString(), q.correctIndex]));

        let correct = 0, skipped = 0;
        for (const ans of savedAnswers) {
            if (ans.chosenIndex === null) skipped++;
            else if (qMap.get(ans.questionId) === ans.chosenIndex) correct++;
        }
        const wrong = savedAnswers.length - correct - skipped;

        return {
            ...t,
            score: de.score,
            submitAt: de.submitAt,
            turn: de.turn,
            correctCount: correct,
            wrongCount: Math.max(0, wrong),
            skippedCount: skipped,
        };
    }));

    return { profile, tests };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
/**
 * Xóa một student khỏi một lớp học.
 */
const removeStudent = async (studentId, classId) => {
    const [result] = await db.execute(
        'DELETE FROM enrollment WHERE student_id = ? AND class_id = ?',
        [studentId, classId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Enrollment record not found');
    }

    return true;
};

/**
 * Xóa toàn bộ students khỏi một lớp học.
 * Validate class qua classService.
 */
const removeAllStudentsFromClass = async (classId) => {
    // Validate class qua classService — throw nếu không tồn tại
    await classService.getClassById(classId);

    const [result] = await db.execute(
        'DELETE FROM enrollment WHERE class_id = ?',
        [classId]
    );

    return { deletedCount: result.affectedRows };
};

module.exports = {
    enrollStudent,
    enrollStudents,
    getAllEnrollments,
    getStudentsByClass,
    getClassesByStudent,
    getClassesWithTestsByStudent,
    getStudentDetailInClass,
    updateAverageScore,
    removeStudent,
    removeAllStudentsFromClass,
};
