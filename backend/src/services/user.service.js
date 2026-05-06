const db = require('../config/MySQLConnect');
const bcrypt = require('bcryptjs');

//create User
const createUser = async (userData) => {
    const {name, dob, role, email, phone, password} = userData;

    const [existingUsers] = await db.execute('SELECT * FROM user where email = ? or phone = ?', [email, phone]);
    if (existingUsers.length > 0) {
        throw new Error("User exist");
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const [result] = await db.execute
    ('INSERT INTO user (name, dob, role, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
         [name, dob, role, email, phone, hashPassword, 1]);

    return {
        id: result.insertId,
        name, dob, role, email, phone
    };
};

//get all user include: active and non-active
const getAllUser = async() => {
    const [result] = await db.execute('SELECT id, name, dob, role, email, phone FROM user');
    return result;
}

const getUserFollowingStatus = async(status) => {
    if (!status) {
        throw new Error('Status not valid');
    }
    const [result] = await db.execute('SELECT id, name, dob, role, email, phone FROM user WHERE status = ?', [status]);
    return result;
}

// delete user
const deleteUser = async(id) => {
    const [result] = await db.execute("UPDATE user SET status = 0 WHERE id = ?" , [id]);
    
    if (result.affectedRows === 0) {
        throw new Error("User not exist");
    }

    return true;
}

// update user info
const updateUser = async(id, userData) => {
    const {name, dob, email, phone} = userData;

    const [user] = await db.execute('SELECT * FROM user WHERE id = ? AND status = 1', [id]);
    if (user.length === 0) {
        throw new Error("User not exist");
    }

    const [result] = await db.execute
    ('UPDATE user SET name = ?, dob = ?, email = ?, phone = ? WHERE id = ?', [name, dob, email, phone, id]);

    if (result.affectedRows === 0) {
        throw new Error("Update failed");
    }
    return {id, name, dob, email, phone};
}

// get user by id
const getUserById = async(id) => {
    const [result] = await db.execute('SELECT id, name, dob, phone, email, role FROM user WHERE id = ? AND status = 1', [id]);

    if (result.length === 0) {
        throw new Error("User not exist");
    }
    return result[0];
}

const getTeacherById = async (id) => {
    const [result] = await db.execute('SELECT id, name, dob, phone, email, role FROM user WHERE id = ? AND status = 1 and role = "teacher"', [id]);

    if (result.length === 0) {
        throw new Error('Teacher not found');
    }

    return result[0];
}

/**
 * Import nhiều user từ CSV. Mỗi item: { name, email, role, password, phone, dob? }
 * Trả về { success: [{email, data}], failed: [{email, error}] }
 */
const bulkCreateUsers = async (users) => {
    const success = [];
    const failed  = [];

    for (const user of users) {
        try {
            const data = await createUser(user);
            success.push({ email: user.email, data });
        } catch (err) {
            failed.push({ email: user.email, error: err.message });
        }
    }

    return { success, failed };
};

module.exports = {createUser, getAllUser, deleteUser, updateUser, getUserById, getUserFollowingStatus, getTeacherById, bulkCreateUsers};