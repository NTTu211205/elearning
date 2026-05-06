const userService = require('../services/user.service');


// create user
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

// get all user include: active and non-active
const getAllUser = async (req, res) => {
    try {
        const {status} = req.query;
        let users = null;
        if (!status) {
            users = await userService.getAllUser();
        }
        else {
            users = await userService.getUserFollowingStatus(status);
        }

        res.status(200).json({
            message: 'Success',
            data: users
        })
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

// delete user
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

// update user info
const updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const {name, dob, email, phone} = req.body;

        const result = await userService.updateUser(id, {name, dob, email, phone});

        res.status(200).json({
            message: 'Success',
            data: result
        })
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

// get profile
const getUserProfile = async(req, res) => {
    try {
        const {id, role} = req.user;
        const result = await userService.getUserById(id);

        res.status(200).json({
            message: 'Success',
            data: { ...result}
        })
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

// get user by id
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

// bulk import users from CSV (parsed on client, sent as JSON array)
const bulkAddUsers = async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: 'Danh sách người dùng không hợp lệ' });
        }
        const result = await userService.bulkCreateUsers(users);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// update own profile (from JWT — name, phone, dob only)
const updateProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const { name, dob, phone } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên không được để trống' });
        const result = await userService.updateProfile(id, { name, dob, phone });
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// change own password (from JWT)
const changePassword = async (req, res) => {
    try {
        const { id } = req.user;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        await userService.changePassword(id, oldPassword, newPassword);
        res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {addUser, getAllUser, deleteUser, updateUser, getUserById, getUserProfile, bulkAddUsers, updateProfile, changePassword};