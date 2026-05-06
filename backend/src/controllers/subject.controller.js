const subjectService = require('../services/subject.service');


// create new subject
const addSubject = async(req, res) => {
    try {
        const {name, lessons} = req.body;

        const result = await subjectService.createSubject(name, lessons);
        res.status(200).json({
            message: "Success",
            data: result
        });
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}


// get subject by id
const getSubjectById = async (req, res) => {
    try {
        const {id} = req.params;

        const result = await subjectService.getSubject(id);
        res.status(200).json({
            message: 'Success',
            data: result
        });
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

// update subject info
const updateSubjectInfo = async(req, res) => {
    try {
        const {id} = req.params;
        const {name, lessons} = req.body;

        const result = await subjectService.updateSubject({id, name, lessons});
        res.status(200).json({
            message: 'Success',
            data: result
        });
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}


// delete subject
const deleteSubject = async (req, res) => {
    try {
        const {id} = req.params;

        const result = await subjectService.deleteSubject(id);

        res.status(200).json({
            message: 'Success',
            data: result
        })
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

// get all subject include: active and non-active
// nếu truyền status vào 1 thì trả về active và ngược lại
const getAll = async(req, res) => {
    try {
        const {status} = req.query;
        let subjects = null;
        if (!status) {
            subjects = await subjectService.getAllSubject();
        }
        else {
            subjects = await subjectService.getAllSubjectByStatus(status);
        }

        res.status(200).json({
            message: 'Success',
            data: subjects
        })
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

// toggle subject status
const toggleSubjectStatus = async (req, res) => {
    try {
        const {id} = req.params;
        const result = await subjectService.toggleSubjectStatus(id);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {addSubject, getSubjectById, updateSubjectInfo, deleteSubject, getAll, toggleSubjectStatus};