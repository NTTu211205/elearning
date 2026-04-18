const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/MySQLConnect');
const { TokenExpiredError } = require('jsonwebtoken');
const JsonWebTokenError = require('jsonwebtoken/lib/JsonWebTokenError');

const login = async (email, password) => {
    const [users] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
    if (users.length === 0) {
        throw new Error('User not exist');
    }

    const user = users[0];
    if (user.status === 0) {
        throw new Error('User not exist');
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
        throw new Error('Email or password is wrong');
    }

    const token = generateToken(user.id, user.role, '1d');
    const refreshToken = generateToken(user.id, user.role, '30d');

    // save access token in database
    const [result] = await db.execute('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))', [user.id, refreshToken]);

    if (result.affectedRows === 0) {
        throw new Error("Create token failed");
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
    const [result] = await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

    if (result.affectedRows === 0) {
        throw new Error('Account was logged out');
    }

    return true;
}

// refresh token
const refreshToken = async (oldRefreshToken) => {
    try {
        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);

        const [tokens] = await db.execute('SELECT * FROM refresh_tokens WHERE token = ?', [oldRefreshToken]);
        if (tokens.length === 0) {
            throw new Error('Account was logged out');
        }

        const [users] = await db.execute('SELECT * FROM user WHERE id = ?', [tokens[0].user_id]);
        if (users.length === 0) {
            throw new Error("User not found");
        }

        const user = users[0];
        if (user.status === 0) {
            throw new Error("User not exist");
        }
    
        const newToken = generateToken(user.id, user.role, '1d');
        const newRefreshToken = generateToken(user.id, user.role, '30d');

        return {newToken, newRefreshToken};
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Token expired");
        }
        if (error.name === "JsonWebTokenError") {
            throw new Error("Token not valid");
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