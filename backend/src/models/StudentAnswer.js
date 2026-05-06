const mongoose = require('mongoose');

/**
 * Lưu trữ đáp án học sinh trong một lượt làm bài.
 * Mỗi document tương ứng với một hàng doexam trong MySQL.
 */
const AnswerItemSchema = new mongoose.Schema(
    {
        questionId: { type: String, required: true }, // MongoDB ObjectId string của Question
        chosenIndex: { type: Number, default: null }, // null = chưa trả lời
    },
    { _id: false }
);

const StudentAnswerSchema = new mongoose.Schema(
    {
        doexamId: { type: Number, required: true, unique: true, index: true }, // FK → MySQL doexam.id
        testId:   { type: Number, required: true, index: true },
        studentId:{ type: Number, required: true, index: true },
        answers:  [AnswerItemSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('StudentAnswer', StudentAnswerSchema);
