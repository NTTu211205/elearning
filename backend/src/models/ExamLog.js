const mongoose = require('mongoose');

/**
 * Ghi log mỗi sự kiện quan trọng trong quá trình làm bài kiểm tra.
 * event:
 *   'START'       — học sinh bắt đầu lượt làm mới
 *   'RESUME'      — học sinh tiếp tục lượt đang làm dở
 *   'SUBMIT'      — học sinh nộp bài (kèm điểm)
 *   'AUTO_SUBMIT' — hệ thống tự nộp (hết giờ)
 */
const ExamLogSchema = new mongoose.Schema(
    {
        doexamId:  { type: Number, required: true, index: true },
        studentId: { type: Number, required: true, index: true },
        testId:    { type: Number, required: true, index: true },
        event:     { type: String, enum: ['START', 'RESUME', 'SUBMIT', 'AUTO_SUBMIT'], required: true },
        data:      { type: mongoose.Schema.Types.Mixed, default: null }, // e.g. { score, correct, total }
    },
    { timestamps: true }
);

module.exports = mongoose.model('ExamLog', ExamLogSchema, 'logs');
