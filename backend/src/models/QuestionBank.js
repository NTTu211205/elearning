const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema(
    { label: { type: String, required: true }, text: { type: String, default: '' } },
    { _id: false }
);

/**
 * Subdocument cho mỗi câu hỏi — mongoose tự sinh _id cho mỗi subdoc.
 * _id của subdoc được dùng làm questionId trong StudentAnswer.
 */
const EmbeddedQuestionSchema = new mongoose.Schema({
    order:        { type: Number, default: 0 },
    text:         { type: String, default: '' },
    options:      [OptionSchema],
    correctIndex: { type: Number, required: true, default: 0 },
    type:         { type: String, enum: ['multiple_choice'], default: 'multiple_choice' },
});

/**
 * Mỗi document = 1 đề thi (testId unique).
 * Toàn bộ câu hỏi được lưu dưới dạng embedded array.
 */
const QuestionBankSchema = new mongoose.Schema(
    {
        testId:    { type: Number, required: true, unique: true, index: true },
        questions: [EmbeddedQuestionSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('QuestionBank', QuestionBankSchema, 'question_bank');
