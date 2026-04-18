const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Token not found" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({message:"Token expired", code: "TOKEN_EXPIRED"});
        }

        return res.status(403).json({message: "Token invalid"});
    }
};

const authorizeRole = (...allowedRole) => {
    return (req, res, next) => {
        if (!req || !req.user) {
            return res.status(403).json({message: "User not found"});
        }

        if (!allowedRole.includes(req.user.role)) {
            return res.status(403).json({message: "Not permission"});
        }

        next();
    };
};

module.exports = {verifyToken, authorizeRole};