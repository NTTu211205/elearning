const Question = require('../models/Question');

/**
 * Lưu (thay thế) toàn bộ câu hỏi cho một đề thi.
 * Xóa tất cả câu hỏi cũ rồi insert mới.
 */
const saveQuestions = async (testId, questions) => {
    await Question.deleteMany({ testId: Number(testId) });

    if (!questions || questions.length === 0) return [];

    const docs = questions.map((q, i) => ({
        testId: Number(testId),
        order: i,
        text: q.text || '',
        options: (q.options || []).map((o) => ({ label: o.label, text: o.text || '' })),
        correctIndex: q.correctIndex ?? 0,
        type: q.type || 'multiple_choice',
    }));

    const saved = await Question.insertMany(docs);
    return saved;
};

/**
 * Lấy danh sách câu hỏi của một đề thi (sắp xếp theo thứ tự).
 * Trả về dạng plain object để dùng ở frontend.
 */
const getQuestions = async (testId) => {
    const docs = await Question.find({ testId: Number(testId) })
        .sort({ order: 1 })
        .lean();

    return docs.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        type: q.type,
    }));
};

module.exports = { saveQuestions, getQuestions };
