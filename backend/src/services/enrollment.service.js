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
    updateAverageScore,
    removeStudent,
    removeAllStudentsFromClass,
};
