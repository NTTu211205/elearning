const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/MySQLConnect');
const { createAuthError } = require('../utils/authError');

const login = async (email, password) => {
    const [users] = await db.execute('SELECT * FROM user WHERE email = ? AND status = 1', [email]);
    if (users.length === 0) {
        throw createAuthError(401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is wrong');
    }

    const user = users[0];
    if (user.status === 0) {
        throw createAuthError(403, 'AUTH_USER_DISABLED', 'User account is disabled');
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
        throw createAuthError(401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is wrong');
    }

    const token = generateToken(user.id, user.role, '1d');
    const refreshToken = generateToken(user.id, user.role, '30d');

    // save access token in database
    const [result] = await db.execute('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [user.id, refreshToken]);

    if (result.affectedRows === 0) {
        throw createAuthError(500, 'AUTH_TOKEN_CREATE_FAILED', 'Create token failed');
    }

    delete user.password;
    delete user.createdAt;
    delete user.updatedAt;
    delete user.status;

    return {
        user, token, refreshToken
    }
}

// đăng xuất
const logout = async (refreshToken) => {
    await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    return true;
}

// refresh token
const refreshToken = async (oldRefreshToken) => {
    try {
        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);

        const [tokens] = await db.execute('SELECT * FROM refresh_tokens WHERE token = ?', [oldRefreshToken]);
        if (tokens.length === 0) {
            throw createAuthError(401, 'AUTH_REFRESH_TOKEN_INVALID', 'Account was logged out');
        }

        const [users] = await db.execute('SELECT * FROM user WHERE id = ?', [tokens[0].user_id]);
        if (users.length === 0) {
            throw createAuthError(404, 'AUTH_USER_NOT_FOUND', 'User not found');
        }

        const user = users[0];
        if (user.status === 0) {
            throw createAuthError(403, 'AUTH_USER_DISABLED', 'User account is disabled');
        }
    
        const newToken = generateToken(user.id, user.role, '1d');
        const newRefreshToken = generateToken(user.id, user.role, '30d');

        const [tokenDelete] = await db.execute('DELETE from refresh_tokens WHERE token = ?', [oldRefreshToken]);
        if (tokenDelete.affectedRows === 0) {
            throw createAuthError(401, 'AUTH_REFRESH_TOKEN_INVALID', 'Delete token failed');
        }

        const [result] = await db.execute('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [user.id, newRefreshToken]);
        if (result.affectedRows === 0) {
            throw createAuthError(500, 'AUTH_TOKEN_CREATE_FAILED', 'Create refresh token failed');
        }

        return {newToken, newRefreshToken};
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            throw createAuthError(401, 'AUTH_REFRESH_TOKEN_EXPIRED', 'Refresh token expired');
        }
        if (error.name === "JsonWebTokenError") {
            throw createAuthError(401, 'AUTH_REFRESH_TOKEN_INVALID', 'Refresh token not valid');
        }

        throw error;
    }
}

const generateToken = (id, role, expired) => {
    const token = jwt.sign(
        {id: id, role: role},
        process.env.JWT_SECRET || 'fallback_secret_key',
        {expiresIn: expired}
    )

    return token;
}

module.exports = {login, logout, refreshToken};