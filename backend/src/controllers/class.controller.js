const classService = require('../services/class.service');

const addClass = async (req, res) => {
    try {
        const {subjectId, teacherId, quantity, name, status} = req.body;

        const result = await classService.createClass({subjectId, teacherId, quantity, name, status});

        res.status(200).json({
            message: 'Success',
            data: result
        })
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const getAllClass = async (req, res) => {
    try {
        const result = await classService.getAllClass();

        res.status(200).json({
            message: 'Success',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const getClassByTeacher = async (req, res) => {
    try {
        const {teacherId} = req.params;
        const result = await classService.getClassByTeacherId(teacherId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
        
    }
    catch(error) {
        res.status(400).json({
            message: error.message
        });
    }
}

const getClassBySubject = async (req, res) => {
    try {
        const {subjectId} = req.params;
        const result = await classService.getClassBySubjectId(subjectId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const getClass = async (req, res) => {
    try {
        const {id} = req.params;
        const result = await classService.getClassById(id);
        res.status(200).json({message: 'Success', data: result});
    }
    catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

const update = async (req, res) => {
    try {
        const {id} = req.params;
        const {teacherId, subjectId, quantity, name, status} = req.body;

        const result = await classService.updateClass({classId: id, teacherId, subjectId, quantity, name, status});

        res.status(200).json({
            message: 'Success',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({message: error.message});
    }
}

const deleteClass = async(req, res) => {
    try {
        const {id} = req.params;
        const result = await classService.deleteClass(id);
        res.status(200).json({message: 'Success', data: result});
    }
    catch(error) {
        res.status(400).json({message: error.message});
    }
}

module.exports = {addClass, getClassBySubject, getClassByTeacher, getClass, getAllClass, update, deleteClass};