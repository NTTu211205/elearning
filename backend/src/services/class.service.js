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
        subjectId, teacherId, quantity, name, status: status ?? 'active'
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
    const [result] = await db.execute('SELECT * FROM class');

    return result;
}

const getClassByTeacherId = async (teacherId) => {
    console.log(teacherId);
    const query = `
        SELECT
            c.id,
            c.name                          AS className,
            s.name                          AS subjectName,
            COUNT(DISTINCT e.student_id)    AS totalStudents,
            COUNT(DISTINCT t.id)            AS totalTests,
            c.status,
            c.createdAt
        FROM class c
        LEFT JOIN subject s      ON s.id = c.subject_id
        LEFT JOIN enrollment e   ON e.class_id = c.id
        LEFT JOIN test t         ON t.class_id = c.id
        WHERE c.teacher_id = ?
        GROUP BY c.id, c.name, s.name, c.status, c.createdAt
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

module.exports = {createClass, getClassById, getAllClass, getClassBySubjectId, getClassByTeacherId, updateClass, deleteClass};