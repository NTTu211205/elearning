const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema(
    {
        label: { type: String, required: true },  // "A", "B", "C", "D" ...
        text: { type: String, default: '' },
    },
    { _id: false }
);

const QuestionSchema = new mongoose.Schema(
    {
        testId: { type: Number, required: true, index: true }, // khóa ngoại → MySQL test.id
        order: { type: Number, default: 0 },                   // thứ tự trong đề
        text: { type: String, default: '' },
        options: [OptionSchema],
        correctIndex: { type: Number, required: true, default: 0 },
        type: {
            type: String,
            enum: ['multiple_choice'],
            default: 'multiple_choice',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Question', QuestionSchema);
