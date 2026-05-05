const db = require('../config/MySQLConnect');
const userService = require('../services/user.service');
const subjectService = require('../services/subject.service');



// Create
const createClass = async(classData) => {
    const {subjectId, teacherId, quantity} = classData;

    const subject = await subjectService.getSubject(subjectId);
    if (!subject) {
        throw new Error('Subject not valid');
    }

    const teacher = await userService.getTeacherById(teacherId);
    if (!teacher) {
        throw new Error('Teacher not valid');
    }

    const [newClass] = await db.execute('INSERT INTO class(subject_id, teacher_id, quantity) VALUES (?, ?, ?)', [subjectId, teacherId, quantity]);

    return {
        id: newClass.insertId,
        subjectId, teacherId, quantity
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
    const [result] = await db.execute('SELECT * FROM class WHERE teacherId = ?', [teacherId]);

    return result;
}

const getClassBySubjectId = async (subjectId) => {
    const [result] = await db.execute('SELECT * FROM class WHERE subjectId = ?', [subjectId]);

    return result;
}



// Update
const updateClass = async(classData) => {
    const {classId, teacherId, subjectId, quantity} = classData;

    const [result] = await db.execute('UPDATE class SET teacherId = ?, subjectId = ?, quantity = ? WHERE id = ?', [teacherId, subjectId, quantity, classId]);

    if (result.affectedRows === 0) {
        throw new Error('Class not found');
    }

    return {classId, teacherId, subjectId, quantity};
}



// delete
const deleteClass = async (id) => {
    const [result] = await db.execute('DELETE FROM class WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        throw new Erorr('Class not found');
    }

    return true;
}

module.exports = {createClass, getClassById, getAllClass, getClassBySubjectId, getClassByTeacherId, updateClass, deleteClass};