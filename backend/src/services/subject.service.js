const db = require('../config/MySQLConnect');

// create new subject
const createSubject = async(name, lessons) => {
    const [result] = await db.execute('INSERT INTO subject(name, lessons) VALUES (?, ?, ?)', [name, lessons, 1]);

    return {id: result.insertId, name, lessons};
}

// get subject by id
const getSubject = async(id) => {
    const [result] = await db.execute('SELECT * FROM subject WHERE id = ? AND status = 1', [id]);

    if (result.length === 0) {
        throw new Error('Class not found');
    }

    return result[0];
}

// get active subject by id
// const getActiveSubjectById = async(id) => {
//     const [result] = await db.execute('SELECT * FROM subject WHERE id = ? AND status = 1', [id]);
// }

// update subject info
const updateSubject =  async (subjectData) => {
    const {id, name, lessons} = subjectData;
    const [result] = await db.execute('UPDATE subject SET name = ?, lessons = ? WHERE id = ? AND status = 1', [name, lessons, id]);

    if (result.affectedRows === 0) {
        throw new Error("Subject not exist");
    }

    return {id, name, lessons};
}


// delete a subject
const deleteSubject = async (id) => {
    const [result] = await db.execute('UPDATE subject SET status = 0 WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        throw new Error ("Subject not exist");
    }

    return true;
}

// get all subject
const getAllSubject = async () => {
    const [result] = await db.execute('SELECT * FROM subject');
    
    // if (result.length === 0) {
    //     throw new Error('Subject not found');
    // }
    // xanh sửa thêm điều kiện để trả về mảng rỗng thay vì lỗi khi không có môn học nào
    return result;
}

// get active subject
const getAllSubjectByStatus = async (status) => {
    if (!status) {
        throw new Error('Status not valid');
    }

    const [result] = await db.execute('SELECT * FROM subject WHERE status = ?', [status]);

    return result;
}

module.exports = {createSubject, getSubject, updateSubject, deleteSubject, getAllSubject, getAllSubjectByStatus};