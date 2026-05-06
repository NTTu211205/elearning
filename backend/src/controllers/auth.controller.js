const authService = require('../services/auth.service');
const { REFRESH_COOKIE_NAME, getRefreshCookieOptions } = require('../utils/authCookie');

const sendAuthError = (res, error, fallbackStatus = 400) => {
    const status = error.status || fallbackStatus;
    const code = error.code || 'AUTH_ERROR';

    return res.status(status).json({
        message: error.message,
        code,
    });
};

const login = async(req, res) => {
    const {email, password} = req.body;

    try {
        const result = await authService.login(email, password);
        const { refreshToken, ...payload } = result;

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
        
        res.status(200).json({
            message: 'Success',
            data: payload
        });
    }
    catch(error) {
        return sendAuthError(res, error);
    }
}

const logout = async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    try {
        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        res.clearCookie(REFRESH_COOKIE_NAME, {
            ...getRefreshCookieOptions(),
            maxAge: undefined,
            expires: new Date(0),
        });

        res.status(200).json({message: "Success"});
    }
    catch (error) {
        return sendAuthError(res, error);
    }
}

const refreshToken = async (req, res) => {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!oldRefreshToken) {
        return res.status(401).json({
            message: 'Refresh token not found',
            code: 'AUTH_REFRESH_TOKEN_NOT_FOUND',
        });
    }

    try {
        const result = await authService.refreshToken(oldRefreshToken);
        const { newRefreshToken, ...payload } = result;

        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

        res.status(200).json({message: "success", data: payload});
    }
    catch (error) {
        return sendAuthError(res, error);
    }
}

module.exports = {login, logout, refreshToken};