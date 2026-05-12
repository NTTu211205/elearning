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
    const [result] = await db.execute('SELECT id, name, dob, role, email, phone, status, createdAt, updatedAt FROM user where role != "admin"');
    return result;
}

const getUserFollowingStatus = async(status) => {
    if (!status) {
        throw new Error('Status not valid');
    }
    const [result] = await db.execute('SELECT id, name, dob, role, email, phone, status, createdAt, updatedAt FROM user WHERE status = ?', [status]);
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

// update own profile (name, phone, dob) — email is identity, not changed here
const updateProfile = async (id, data) => {
    const { name, dob, phone } = data;

    const [users] = await db.execute('SELECT * FROM user WHERE id = ? AND status = 1', [id]);
    if (users.length === 0) throw new Error('User not found');

    await db.execute(
        'UPDATE user SET name = ?, dob = ?, phone = ? WHERE id = ?',
        [name, dob ?? null, phone ?? null, id]
    );

    const [updated] = await db.execute('SELECT id, name, dob, phone, email, role FROM user WHERE id = ?', [id]);
    return updated[0];
};

// change own password — requires correct current password
const changePassword = async (id, oldPassword, newPassword) => {
    const [users] = await db.execute('SELECT * FROM user WHERE id = ? AND status = 1', [id]);
    if (users.length === 0) throw new Error('User not found');

    const user = users[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.execute('UPDATE user SET password = ? WHERE id = ?', [hash, id]);
    return true;
};

// toggle user status (1 → 0, 0 → 1)
const toggleUserStatus = async (id) => {
    const [rows] = await db.execute('SELECT status FROM user WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('User not exist');
    const newStatus = rows[0].status === 1 ? 0 : 1;
    await db.execute('UPDATE user SET status = ? WHERE id = ?', [newStatus, id]);
    return { id: Number(id), status: newStatus };
};

module.exports = {createUser, getAllUser, deleteUser, updateUser, getUserById, getUserFollowingStatus, getTeacherById, bulkCreateUsers, updateProfile, changePassword, toggleUserStatus};