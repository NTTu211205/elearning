const authService = require('../services/auth.service');

const login = async(req, res) => {
    const {email, password} = req.body;

    try {
        const result = await authService.login(email, password);
        
        res.status(200).json({
            message: 'Success',
            data: result
        });
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

const logout = async (req, res) => {
    const {refreshToken} = req.body;

    if (!refreshToken) {
        return res.status(400).json({message: "Provide token"});
    }

    try {
        await authService.logout(refreshToken);

        res.status(200).json({message: "Success"});
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const refreshToken = async (req, res) => {
    const {oldRefreshToken} = req.body;
    if (!oldRefreshToken) {
        return res.status(400).json({message: "Provide refresh token"});
    }

    try {
        const result = await authService.refreshToken(oldRefreshToken);

        res.status(200).json({message: "success", data: result});
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

module.exports = {login, logout, refreshToken};