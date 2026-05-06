const enrollmentService = require('../services/enrollment.service');

// ─── CREATE ───────────────────────────────────────────────────────────────────

// POST /enrollment — Thêm một student vào một class
const enrollStudent = async (req, res) => {
    try {
        const { studentId, classId } = req.body;

        const result = await enrollmentService.enrollStudent(studentId, classId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// POST /enrollment/bulk — Thêm danh sách students vào một class
const enrollStudents = async (req, res) => {
    try {
        const { studentIds, classId } = req.body;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'studentIds must be a non-empty array' });
        }

        const result = await enrollmentService.enrollStudents(studentIds, classId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── READ ─────────────────────────────────────────────────────────────────────

// GET /enrollment — Lấy tất cả enrollment
const getAllEnrollments = async (req, res) => {
    try {
        const result = await enrollmentService.getAllEnrollments();

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /enrollment/class/:classId — Lấy danh sách students của một lớp
const getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;

        const result = await enrollmentService.getStudentsByClass(classId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /enrollment/student/:studentId — Lấy danh sách lớp của một student
const getClassesByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const result = await enrollmentService.getClassesByStudent(studentId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

// PUT /enrollment/:studentId/:classId — Cập nhật điểm trung bình
const updateAverageScore = async (req, res) => {
    try {
        const { studentId, classId } = req.params;
        const { averageScore } = req.body;

        const result = await enrollmentService.updateAverageScore(studentId, classId, averageScore);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

// DELETE /enrollment/:studentId/:classId — Xóa một student khỏi một lớp
const removeStudent = async (req, res) => {
    try {
        const { studentId, classId } = req.params;

        const result = await enrollmentService.removeStudent(studentId, classId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE /enrollment/class/:classId — Xóa toàn bộ students khỏi một lớp
const removeAllStudentsFromClass = async (req, res) => {
    try {
        const { classId } = req.params;

        const result = await enrollmentService.removeAllStudentsFromClass(classId);

        res.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /enrollment/student/:studentId/classes-with-tests
const getClassesWithTests = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await enrollmentService.getClassesWithTestsByStudent(studentId);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /enrollment/class/:classId/student/:studentId/detail
const getStudentDetailInClass = async (req, res) => {
    try {
        const { classId, studentId } = req.params;
        const result = await enrollmentService.getStudentDetailInClass(classId, studentId);
        res.status(200).json({ message: 'Success', data: result });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

module.exports = {
    enrollStudent,
    enrollStudents,
    getAllEnrollments,
    getStudentsByClass,
    getClassesByStudent,
    getClassesWithTests,
    getStudentDetailInClass,
    updateAverageScore,
    removeStudent,
    removeAllStudentsFromClass,
};
