const db = require('../config/MySQLConnect');
const QuestionBank = require('../models/QuestionBank');
const StudentAnswer = require('../models/StudentAnswer');
const ExamLog = require('../models/ExamLog');

// ─── START EXAM ────────────────────────────────────────────────────────────────

/**
 * Bắt đầu một lượt làm bài mới.
 * Kiểm tra: sinh viên đã đăng ký lớp, bài thi trong thời hạn, còn lượt làm.
 * Tạo doexam row (DOING) + StudentAnswer doc.
 * Nếu đang có lượt DOING → trả về lượt đó để tiếp tục.
 */
const startExam = async (studentId, testId) => {
    // Lấy thông tin đề thi
    const [testRows] = await db.execute(
        `SELECT t.id, t.name, t.class_id, t.turn AS maxTurns, t.startAt, t.endAt, t.duration, t.num_question
         FROM test t WHERE t.id = ?`,
        [testId]
    );
    if (testRows.length === 0) throw new Error('Test not found');
    const test = testRows[0];

    // Kiểm tra sinh viên đã đăng ký lớp
    const [enrollment] = await db.execute(
        'SELECT student_id FROM enrollment WHERE student_id = ? AND class_id = ?',
        [studentId, test.class_id]
    );
    if (enrollment.length === 0) throw new Error('Student is not enrolled in this class');

    // Kiểm tra thời gian thi
    const now = new Date();
    if (test.startAt && new Date(test.startAt) > now) throw new Error('Exam has not started yet');
    if (test.endAt && new Date(test.endAt) < now) throw new Error('Exam has ended');

    // Kiểm tra lượt đang làm dở (DOING)
    const [doingRows] = await db.execute(
        `SELECT id, attendAt FROM doexam WHERE student_id = ? AND test_id = ? AND status = 'DOING'`,
        [studentId, testId]
    );
    if (doingRows.length > 0) {
        const doexamId = doingRows[0].id;
        const savedDoc = await StudentAnswer.findOne({ doexamId }).lean();
        // Log RESUME (fire-and-forget)
        ExamLog.create({ doexamId, studentId: Number(studentId), testId: Number(testId), event: 'RESUME' }).catch(() => {});
        return { doexamId, isResume: true, attendAt: doingRows[0].attendAt, savedAnswers: savedDoc?.answers ?? [] };
    }

    // Kiểm tra số lượt đã dùng (chỉ tính DONE)
    const [doneRows] = await db.execute(
        `SELECT COUNT(*) AS cnt FROM doexam WHERE student_id = ? AND test_id = ? AND status = 'DONE'`,
        [studentId, testId]
    );
    const usedTurns = doneRows[0].cnt;
    if (usedTurns >= test.maxTurns) throw new Error('You have used all allowed attempts for this test');

    // Tạo doexam row mới
    const turnNumber = usedTurns + 1;
    const [insertResult] = await db.execute(
        `INSERT INTO doexam (student_id, test_id, attendAt, status, turn) VALUES (?, ?, NOW(), 'DOING', ?)`,
        [studentId, testId, turnNumber]
    );
    const doexamId = insertResult.insertId;

    // Lấy câu hỏi và tạo StudentAnswer doc ban đầu (tất cả null)
    const bank1 = await QuestionBank.findOne({ testId: Number(testId) }).lean();
    const questions = bank1 ? [...bank1.questions].sort((a, b) => a.order - b.order) : [];
    const initialAnswers = questions.map((q) => ({
        questionId: q._id.toString(),
        chosenIndex: null,
    }));

    await StudentAnswer.create({ doexamId, testId: Number(testId), studentId: Number(studentId), answers: initialAnswers });
    // Log START (fire-and-forget)
    ExamLog.create({ doexamId, studentId: Number(studentId), testId: Number(testId), event: 'START' }).catch(() => {});

    return { doexamId, isResume: false, attendAt: new Date(), savedAnswers: initialAnswers };
};

// ─── GET SESSION ───────────────────────────────────────────────────────────────

/**
 * Lấy thông tin phiên làm bài (questions không có correctIndex + đáp án đã lưu).
 */
const getExamSession = async (doexamId) => {
    const [rows] = await db.execute(
        `SELECT de.id, de.student_id, de.test_id, de.attendAt, de.status, de.turn,
                t.name AS testName, t.duration, t.num_question, t.endAt
         FROM doexam de
         JOIN test t ON t.id = de.test_id
         WHERE de.id = ?`,
        [doexamId]
    );
    if (rows.length === 0) throw new Error('Exam session not found');
    const session = rows[0];

    const savedDoc = await StudentAnswer.findOne({ doexamId: Number(doexamId) }).lean();
    const savedAnswers = savedDoc?.answers ?? [];

    // Lấy câu hỏi (ẩn correctIndex để tránh lộ đáp án)
    const bank2 = await QuestionBank.findOne({ testId: Number(session.test_id) }).lean();
    const questions = bank2 ? [...bank2.questions].sort((a, b) => a.order - b.order) : [];
    const questionsForStudent = questions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        options: q.options,
        type: q.type,
    }));

    return { session, questionsForStudent, savedAnswers };
};

// ─── SAVE DRAFT ────────────────────────────────────────────────────────────────

/**
 * Lưu tạm đáp án (chưa nộp). Ghi đè toàn bộ mảng answers.
 */
const saveDraft = async (doexamId, answers) => {
    const [rows] = await db.execute(
        `SELECT id, status FROM doexam WHERE id = ?`,
        [doexamId]
    );
    if (rows.length === 0) throw new Error('Exam session not found');
    if (rows[0].status !== 'DOING') throw new Error('Exam already submitted');

    await StudentAnswer.findOneAndUpdate(
        { doexamId: Number(doexamId) },
        { $set: { answers } },
        { upsert: false }
    );

    return { saved: true };
};

// ─── SUBMIT EXAM ───────────────────────────────────────────────────────────────

/**
 * Nộp bài: tính điểm, cập nhật doexam (DONE), cập nhật averageScore trong enrollment.
 */
const submitExam = async (doexamId, answers) => {
    const [rows] = await db.execute(
        `SELECT de.id, de.student_id, de.test_id, de.status, t.class_id, t.num_question
         FROM doexam de
         JOIN test t ON t.id = de.test_id
         WHERE de.id = ?`,
        [doexamId]
    );
    if (rows.length === 0) throw new Error('Exam session not found');
    const { student_id: studentId, test_id: testId, status, class_id: classId, num_question: totalQ } = rows[0];
    if (status !== 'DOING') throw new Error('Exam already submitted');

    // Lưu đáp án cuối cùng
    await StudentAnswer.findOneAndUpdate(
        { doexamId: Number(doexamId) },
        { $set: { answers } },
        { upsert: false }
    );

    // Lấy đáp án đúng từ MongoDB
    const bank3 = await QuestionBank.findOne({ testId: Number(testId) }).lean();
    const questions = bank3 ? bank3.questions : [];
    const qMap = new Map(questions.map((q) => [q._id.toString(), q.correctIndex]));

    let correct = 0;
    for (const ans of answers) {
        if (ans.chosenIndex !== null && qMap.get(ans.questionId) === ans.chosenIndex) {
            correct++;
        }
    }
    const score = totalQ > 0 ? parseFloat(((correct / totalQ) * 10).toFixed(2)) : 0;

    // Cập nhật doexam → DONE
    await db.execute(
        `UPDATE doexam SET status = 'DONE', submitAt = NOW(), score = ? WHERE id = ?`,
        [score, doexamId]
    );

    // Cập nhật averageScore trong enrollment (trung bình điểm cao nhất của mỗi bài)
    await db.execute(
        `UPDATE enrollment e
         SET e.averageScore = (
             SELECT ROUND(AVG(best), 2)
             FROM (
                 SELECT MAX(d.score) AS best
                 FROM doexam d
                 JOIN test t ON t.id = d.test_id
                 WHERE d.student_id = ? AND t.class_id = ? AND d.status = 'DONE'
                 GROUP BY d.test_id
             ) AS sub
         )
         WHERE e.student_id = ? AND e.class_id = ?`,
        [studentId, classId, studentId, classId]
    );

    const wrongCount  = answers.filter(a => a.chosenIndex !== null && qMap.get(a.questionId) !== a.chosenIndex).length;
    const skippedCount = answers.filter(a => a.chosenIndex === null).length;
    // Log SUBMIT (fire-and-forget)
    ExamLog.create({ doexamId: Number(doexamId), studentId: Number(studentId), testId: Number(testId), event: 'SUBMIT', data: { score, correct, totalQ, wrongCount, skippedCount } }).catch(() => {});

    return { score, correctCount: correct, totalQuestions: totalQ, wrongCount, skippedCount };
};

// ─── GET RESULT ────────────────────────────────────────────────────────────────

/**
 * Lấy kết quả làm bài đã hoàn thành (dùng cho trang xem lại).
 * Trả về đầy đủ answers kèm correctIndex.
 */
const getExamResult = async (doexamId) => {
    const [rows] = await db.execute(
        `SELECT de.id, de.student_id, de.test_id, de.score, de.submitAt, de.turn,
                t.name AS testName, t.duration, t.num_question,
                c.name AS className, s.name AS subjectName,
                u.name AS studentName
         FROM doexam de
         JOIN test t    ON t.id  = de.test_id
         JOIN class c   ON c.id  = t.class_id
         JOIN subject s ON s.id  = c.subject_id
         JOIN user u    ON u.id  = de.student_id
         WHERE de.id = ? AND de.status = 'DONE'`,
        [doexamId]
    );
    if (rows.length === 0) throw new Error('Result not found or exam not submitted yet');
    const session = rows[0];

    const savedDoc = await StudentAnswer.findOne({ doexamId: Number(doexamId) }).lean();
    const savedAnswers = savedDoc?.answers ?? [];

    const bank4 = await QuestionBank.findOne({ testId: Number(session.test_id) }).lean();
    const questions = bank4 ? [...bank4.questions].sort((a, b) => a.order - b.order) : [];

    const answers = questions.map((q, i) => {
        const ans = savedAnswers.find(a => a.questionId === q._id.toString());
        return {
            questionIndex: i,
            questionText: q.text,
            options: q.options.map(o => o.text),
            correctIndex: q.correctIndex,
            chosenIndex: ans?.chosenIndex ?? null,
        };
    });

    return { session, answers };
};

// ─── GET RESULT BY STUDENT + TEST ──────────────────────────────────────────────

/**
 * Lấy kết quả bài làm tốt nhất (điểm cao nhất) của student cho một test.
 * Dùng cho trang xem lại bài (/submission/:classId/:studentId/:testId).
 */
const getSubmissionByStudentTest = async (studentId, testId) => {
    // Lấy doexam điểm cao nhất của student cho test này
    const [rows] = await db.execute(
        `SELECT de.id, de.student_id, de.test_id, de.score, de.submitAt, de.turn,
                t.name AS testName, t.duration, t.num_question,
                c.name AS className, s.name AS subjectName,
                u.name AS studentName
         FROM doexam de
         JOIN test t    ON t.id  = de.test_id
         JOIN class c   ON c.id  = t.class_id
         JOIN subject s ON s.id  = c.subject_id
         JOIN user u    ON u.id  = de.student_id
         WHERE de.student_id = ? AND de.test_id = ? AND de.status = 'DONE'
         ORDER BY de.score DESC, de.submitAt DESC
         LIMIT 1`,
        [studentId, testId]
    );
    if (rows.length === 0) throw new Error('No submitted exam found for this student and test');
    const session = rows[0];

    const savedDoc = await StudentAnswer.findOne({ doexamId: Number(session.id) }).lean();
    const savedAnswers = savedDoc?.answers ?? [];

    const bank5 = await QuestionBank.findOne({ testId: Number(testId) }).lean();
    const questions = bank5 ? [...bank5.questions].sort((a, b) => a.order - b.order) : [];

    const answers = questions.map((q, i) => {
        const ans = savedAnswers.find(a => a.questionId === q._id.toString());
        return {
            questionIndex: i + 1,
            questionText: q.text,
            options: q.options.map(o => o.text),
            correctIndex: q.correctIndex,
            chosenIndex: ans?.chosenIndex ?? null,
        };
    });

    return { session, answers };
};

module.exports = { startExam, getExamSession, saveDraft, submitExam, getExamResult, getSubmissionByStudentTest };
