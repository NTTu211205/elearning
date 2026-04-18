const {body, validationResult} = require('express-validator');

const userCreationValidation = [
    body('name').trim().notEmpty().withMessage('Name is not null'),
    body('email').trim().isEmail().withMessage('Email is not valid'),
    body('role').trim().isIn(['student', 'teacher', 'admin']).withMessage('Role is not valid'),
    body('password').trim().isLength({min: 6}).withMessage('Password must have at least 6 characters'),
    body('phone').trim()
    .isLength({min: 10, max:10}).withMessage('Phone must have 10 number')
    .isNumeric().withMessage('Phone is only have number')
    .notEmpty().withMessage('Phone is not empty'),

    (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            const msg = errors.array()[0].msg;

            return res.status(400).json({
                message: msg,
            });
        }
        next();
    }
];

const userUpdationValidation = [
    body('name').trim().notEmpty().withMessage('Name is not null'),
    body('email').trim().isEmail().withMessage('Email is not valid'),
    body('role').trim().isIn(['student', 'teacher', 'admin']).withMessage('Role is not valid'),
    body('phone').trim()
    .isLength({min: 10, max:10}).withMessage('Phone must have 10 number')
    .isNumeric().withMessage('Phone is only have number')
    .notEmpty().withMessage('Phone is not empty'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const msg = errors.array()[0].msg;

            return res.status(400).json({message: msg});
        }
        next();
    }
]

module.exports = {userCreationValidation, userUpdationValidation};