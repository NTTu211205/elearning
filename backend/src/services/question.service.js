const QuestionBank = require('../models/QuestionBank');

/**
 * Lưu (thay thế) toàn bộ câu hỏi cho một đề thi.
 * Dùng upsert: nếu chưa có document cho testId thì tạo mới, nếu có thì ghi đè.
 */
const saveQuestions = async (testId, questions) => {
    const docs = (questions || []).map((q, i) => ({
        order:        i,
        text:         q.text || '',
        options:      (q.options || []).map(o => ({ label: o.label, text: o.text || '' })),
        correctIndex: Math.max(0, q.correctIndex ?? 0), // clamp -1 (xung đột) về 0
        type:         q.type || 'multiple_choice',
    }));

    const bank = await QuestionBank.findOneAndUpdate(
        { testId: Number(testId) },
        { $set: { questions: docs } },
        { upsert: true, new: true }
    );

    return bank.questions;
};

/**
 * Lấy danh sách câu hỏi của một đề thi (sắp xếp theo thứ tự).
 * Trả về dạng plain object để dùng ở frontend.
 */
const getQuestions = async (testId) => {
    const bank = await QuestionBank.findOne({ testId: Number(testId) }).lean();
    if (!bank) return [];

    return [...bank.questions]
        .sort((a, b) => a.order - b.order)
        .map(q => ({
            id:           q._id.toString(),
            text:         q.text,
            options:      q.options,
            correctIndex: q.correctIndex,
            type:         q.type,
        }));
};

/**
 * Xóa QuestionBank document khi xóa đề thi.
 */
const deleteQuestions = async (testId) => {
    await QuestionBank.deleteOne({ testId: Number(testId) });
};

module.exports = { saveQuestions, getQuestions, deleteQuestions };

