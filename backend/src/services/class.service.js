const db = require('../config/MySQLConnect');
const userService = require('../services/user.service');
const subjectService = require('../services/subject.service');



// Create
const createClass = async(classData) => {
    const {subjectId, teacherId, quantity, name, status} = classData;

    const subject = await subjectService.getSubject(subjectId);
    if (!subject) {
        throw new Error('Subject not valid');
    }

    const teacher = await userService.getTeacherById(teacherId);
    if (!teacher) {
        throw new Error('Teacher not valid');
    }

    const [newClass] = await db.execute(
        'INSERT INTO class(subject_id, teacher_id, quantity, name, status) VALUES (?, ?, ?, ?, ?)',
        [subjectId, teacherId, quantity, name, status ?? 'active']
    );

    return {
        id: newClass.insertId,
        name,
        quantity,
        status: status ?? 'active',
        subjectId,
        subjectName: subject.name,
        teacherId,
        teacherName: teacher.name,
        studentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}



// Read
const getClassById = async (id) => {
    const [result] = await db.execute('SELECT * FROM class WHERE id = ?', [id]);

    if (result.length === 0) { 
        throw new Error ('Class not found');
    }

    return result[0];
}

const getAllClass = async() => {
    const query = `
        SELECT
            c.id,
            c.name,
            c.quantity,
            c.status,
            c.createdAt,
            c.updatedAt,
            c.subject_id                        AS subjectId,
            s.name                              AS subjectName,
            c.teacher_id                        AS teacherId,
            u.name                              AS teacherName,
            COUNT(DISTINCT e.student_id)        AS studentCount
        FROM class c
        LEFT JOIN subject s     ON s.id = c.subject_id
        LEFT JOIN user u        ON u.id = c.teacher_id
        LEFT JOIN enrollment e  ON e.class_id = c.id
        GROUP BY c.id, c.name, c.quantity, c.status, c.createdAt, c.updatedAt,
                 c.subject_id, s.name, c.teacher_id, u.name
        ORDER BY c.createdAt DESC
    `;
    const [result] = await db.execute(query);
    return result;
}

const getClassByTeacherId = async (teacherId) => {
    console.log(teacherId);
    const query = `
        SELECT
            c.id,
            c.name                              AS className,
            s.name                              AS subjectName,
            c.subject_id                        AS subjectId,
            COUNT(DISTINCT e.student_id)        AS totalStudents,
            COUNT(DISTINCT t.id)                AS totalTests,
            ROUND(AVG(e.averageScore), 1)       AS avgScore,
            c.status,
            c.createdAt
        FROM class c
        LEFT JOIN subject s      ON s.id = c.subject_id
        LEFT JOIN enrollment e   ON e.class_id = c.id
        LEFT JOIN test t         ON t.class_id = c.id
        WHERE c.teacher_id = ?
        GROUP BY c.id, c.name, s.name, c.subject_id, c.status, c.createdAt
        ORDER BY c.createdAt DESC
    `;

    const [result] = await db.execute(query, [teacherId]);

    return result;
}

const getClassBySubjectId = async (subjectId) => {
    const [result] = await db.execute('SELECT * FROM class WHERE subject_id = ?', [subjectId]);

    return result;
}



// Update
const updateClass = async(classData) => {
    const {classId, teacherId, subjectId, quantity, name, status} = classData;

    // Check: new quantity must not be less than current enrolled student count
    const [[{ currentStudents }]] = await db.execute(
        'SELECT COUNT(*) AS currentStudents FROM enrollment WHERE class_id = ? AND status = "enrolled"',
        [classId]
    );
    if (quantity < currentStudents) {
        throw new Error(`Sĩ số không được nhỏ hơn số học sinh hiện tại (${currentStudents} học sinh)`);
    }

    const [result] = await db.execute(
        'UPDATE class SET teacher_id = ?, subject_id = ?, quantity = ?, name = ?, status = ? WHERE id = ?',
        [teacherId, subjectId, quantity, name, status, classId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Class not found');
    }

    return {classId, teacherId, subjectId, quantity, name, status};
}



// delete
const deleteClass = async (id) => {
    const [result] = await db.execute('DELETE FROM class WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        throw new Error('Class not found');
    }

    return true;
}

const getClassDetail = async (id) => {
    const [rows] = await db.execute(
        `SELECT
             c.id,
             c.name,
             c.quantity,
             c.status,
             c.createdAt,
             c.subject_id                        AS subjectId,
             s.name                              AS subjectName,
             c.teacher_id                        AS teacherId,
             u.name                              AS teacherName,
             COUNT(DISTINCT e.student_id)        AS studentCount,
             COUNT(DISTINCT t.id)                AS totalTests,
             ROUND(AVG(e.averageScore), 1)       AS avgScore
         FROM class c
         LEFT JOIN subject s     ON s.id = c.subject_id
         LEFT JOIN user u        ON u.id = c.teacher_id
         LEFT JOIN enrollment e  ON e.class_id = c.id
         LEFT JOIN test t        ON t.class_id = c.id
         WHERE c.id = ?
         GROUP BY c.id, c.name, c.quantity, c.status, c.createdAt,
                  c.subject_id, s.name, c.teacher_id, u.name`,
        [id]
    );
    if (rows.length === 0) throw new Error('Class not found');
    return rows[0];
};

module.exports = {createClass, getClassById, getClassDetail, getAllClass, getClassBySubjectId, getClassByTeacherId, updateClass, deleteClass};