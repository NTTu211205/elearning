var express = require('express');
var router = express.Router();
const userController = require('../controllers/user.controller');
const {userCreationValidation, userUpdationValidation} = require('../middlewares/user.middleware');
const {verifyToken, authorizeRole} = require('../middlewares/auth.middleware');


// router.post('/',userCreationValidation, userController.addUser);
// router.get('/', verifyToken, authorizeRole('admin'), userController.getAllUser)
// router.delete('/:id',verifyToken, authorizeRole('admin'), userController.deleteUser);
// router.put('/:id', verifyToken, userUpdationValidation, userController.updateUser);
// router.get('/:id', verifyToken,  userController.getUserById)

router.post('/',userController.addUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id', userController.updateUser);

router.get('/', userController.getAllUser);
router.get('/profile/', verifyToken, userController.getUserProfile);
router.get('/:id', userController.getUserById);

module.exports = router;