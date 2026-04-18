const userService = require('../services/user.service');

const addUser = async(req, res) => {
    try {
        const {name, dob, role, email, phone, password} = req.body;

        const newUser = await userService.createUser({name, dob, role, email, phone, password});

        res.status(200).json({
            message: "Success",
            data: newUser
        });
    }
    catch (error) {
        res.status(409).json({message: error.message});
    }
};

const getAllUser = async (req, res) => {
    try {
        const users = await userService.getAllUser();

        res.status(200).json({
            message: 'Success',
            data: users
        })
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const deleteUser = async (req, res) => {
    try {
        const {id} = req.params;
        const result = await userService.deleteUser(id);
        console.log("Đã xoá user ", id);

        res.status(200).json({
            message: 'success',
            data: result
        })
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

const updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const {name, dob, email, phone, role} = req.body;

        const result = await userService.updateUser(id, {name, dob, email, phone, role});

        res.status(200).json({
            message: 'Success',
            data: result
        })
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const getUserById = async (req, res) => {
    try {
        const {id} = req.params;
        const result = await userService.getUserById(id);
        res.status(200).json({
            message: 'Success',
            data: result
        })
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

module.exports = {addUser, getAllUser, deleteUser, updateUser, getUserById};