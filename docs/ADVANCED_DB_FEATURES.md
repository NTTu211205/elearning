# Advanced Database Features — E-Learning

> Tài liệu giải thích kỹ thuật hai tính năng nâng cao được áp dụng trong dự án.

---

## Mục Lục

1. [SQL Window Functions — Phát hiện học sinh điểm thấp](#1-sql-window-functions--phát-hiện-học-sinh-điểm-thấp)
2. [MongoDB Aggregation Pipeline — Tỉ lệ sai theo câu hỏi](#2-mongodb-aggregation-pipeline--tỉ-lệ-sai-theo-câu-hỏi)

---

## 1. SQL Window Functions — Phát hiện học sinh điểm thấp

### 1.1 Yêu cầu

> *"Utilize SQL Window Functions to identify students in the bottom 10th percentile of grades per section."*

Trong một lớp học, giáo viên cần biết học sinh nào đang học kém nhất (điểm trung bình ≤ 5) để can thiệp kịp thời. Ngoài điểm số tuyệt đối, cần biết học sinh đó đứng ở **phân vị** nào trong lớp (ví dụ: top 8% điểm thấp nhất).

### 1.2 Cấu trúc dữ liệu liên quan

```
MySQL tables:
  enrollment(student_id, class_id, averageScore)   ← điểm TB được cập nhật khi nộp bài
  user(id, name, role)
```

`averageScore` trong bảng `enrollment` là **trung bình của điểm cao nhất mỗi bài thi** trong lớp, được tính lại mỗi lần học sinh nộp bài.

### 1.3 Câu truy vấn SQL với Window Functions

**File:** `backend/src/services/enrollment.service.js` — hàm `getBottomStudentsByClass`

```sql
SELECT studentId, studentName, averageScore, percentileRank, rowRank, totalWithScore
FROM (
    SELECT
        u.id                                                                     AS studentId,
        u.name                                                                   AS studentName,
        e.averageScore,

        -- Window Function 1: PERCENT_RANK
        -- Tính phần trăm số học sinh có điểm THẤP HƠN học sinh này.
        -- Công thức: (rank - 1) / (total_rows - 1)
        -- Kết quả: 0.0 → học sinh điểm thấp nhất, 1.0 → học sinh điểm cao nhất
        ROUND(PERCENT_RANK() OVER (ORDER BY e.averageScore ASC) * 100, 1)       AS percentileRank,

        -- Window Function 2: ROW_NUMBER
        -- Đánh số thứ tự theo điểm tăng dần (học sinh điểm thấp nhất = 1).
        -- Dùng để hiển thị "hạng" trong bảng.
        ROW_NUMBER() OVER (ORDER BY e.averageScore ASC, u.id ASC)                AS rowRank,

        -- Window Function 3: COUNT(*) OVER()
        -- Đếm tổng số học sinh CÓ điểm trong lớp (không phân vùng = toàn bộ tập kết quả).
        COUNT(*) OVER ()                                                          AS totalWithScore

    FROM enrollment e
    JOIN user u ON u.id = e.student_id
    WHERE e.class_id = ? AND e.averageScore IS NOT NULL   -- chỉ tính học sinh đã có điểm
) ranked
WHERE averageScore <= 5      -- lọc: chỉ lấy học sinh dưới ngưỡng đạt
ORDER BY averageScore ASC
LIMIT 10                     -- tối đa 10 học sinh để hiển thị
```

### 1.4 Giải thích từng Window Function

#### `PERCENT_RANK() OVER (ORDER BY e.averageScore ASC)`

| Khái niệm | Giải thích |
|---|---|
| **Loại** | Ranking window function |
| **Cú pháp** | `PERCENT_RANK() OVER (ORDER BY col)` |
| **Công thức** | `(rank - 1) / (count - 1)` |
| **Phạm vi** | Toàn bộ tập kết quả (không có `PARTITION BY`) |
| **Ý nghĩa** | Trả về tỉ lệ [0, 1] biểu thị bao nhiêu phần trăm học sinh có điểm **thấp hơn** học sinh này |

Ví dụ: lớp 20 học sinh, học sinh có `percentileRank = 0.1` nghĩa là chỉ 10% học sinh có điểm thấp hơn → học sinh này thuộc **top 10% điểm thấp** của lớp.

#### `ROW_NUMBER() OVER (ORDER BY e.averageScore ASC, u.id ASC)`

| Khái niệm | Giải thích |
|---|---|
| **Loại** | Ranking window function |
| **Đặc điểm** | Luôn cho kết quả duy nhất, không có số bị lặp |
| **Ý nghĩa** | Đánh thứ hạng 1, 2, 3… theo điểm tăng dần |
| **Secondary sort `u.id ASC`** | Đảm bảo thứ tự ổn định khi nhiều học sinh có cùng điểm |

#### `COUNT(*) OVER ()`

| Khái niệm | Giải thích |
|---|---|
| **Loại** | Aggregate window function |
| **Không có `ORDER BY`** | Đếm toàn bộ tập kết quả, không chia cửa sổ |
| **Ý nghĩa** | Trả về tổng số hàng trong tập kết quả — dùng để frontend biết "X / tổng" học sinh |

### 1.5 Tại sao dùng Subquery?

Window functions **không thể dùng trong mệnh đề `WHERE`** cùng cấp — MySQL xử lý `WHERE` trước khi tính window. Vì vậy phải bọc trong subquery (`ranked`) rồi mới `WHERE` trên kết quả đó:

```sql
-- SAI: window function chưa được tính ở bước WHERE
SELECT ..., PERCENT_RANK() OVER (...) AS percentileRank
FROM enrollment
WHERE percentileRank <= 0.1;   -- ❌ lỗi

-- ĐÚNG: dùng subquery
SELECT * FROM (
    SELECT ..., PERCENT_RANK() OVER (...) AS percentileRank
    FROM enrollment
) ranked
WHERE percentileRank <= 0.1;   -- ✅
```

> **Lưu ý thiết kế:** Dự án lọc `averageScore <= 5` (điểm tuyệt đối) thay vì `percentileRank <= 0.1` vì ngưỡng 5 điểm là tiêu chí rớt môn trong hệ thống giáo dục Việt Nam. `PERCENT_RANK` vẫn được tính và trả về để giáo viên thấy bức tranh tương đối trong lớp.

### 1.6 Luồng API

```
GET /enrollment/class/:classId/bottom-students
  │
  ▼
enrollment.route.js
  │
  ▼
enrollment.controller.js → getBottomStudents()
  │  const { classId } = req.params;
  │  const result = await enrollmentService.getBottomStudentsByClass(classId);
  │  res.status(200).json({ message: 'Success', data: result });
  ▼
enrollment.service.js → getBottomStudentsByClass(classId)
  │  SQL với PERCENT_RANK + ROW_NUMBER + COUNT(*) OVER()
  ▼
Response JSON:
  [
    {
      "studentId": 5,
      "studentName": "Nguyễn Văn A",
      "averageScore": 3.5,
      "percentileRank": 5.0,    ← top 5% điểm thấp nhất trong lớp
      "rowRank": 1,             ← hạng 1 (điểm thấp nhất)
      "totalWithScore": 20      ← 20 học sinh có điểm
    },
    ...
  ]
```

### 1.7 Tính toán `averageScore` — Context đầy đủ

`averageScore` trong `enrollment` được cập nhật **mỗi lần học sinh nộp bài** thông qua câu UPDATE sau trong `submitExam`:

```sql
UPDATE enrollment e
SET e.averageScore = (
    SELECT ROUND(AVG(best), 2)
    FROM (
        SELECT MAX(d.score) AS best        -- điểm cao nhất cho mỗi bài
        FROM doexam d
        JOIN test t ON t.id = d.test_id
        WHERE d.student_id = ? AND t.class_id = ? AND d.status = 'DONE'
        GROUP BY d.test_id                 -- mỗi nhóm = một đề thi
    ) AS sub
)
WHERE e.student_id = ? AND e.class_id = ?
```

Công thức: `averageScore = AVG(điểm_cao_nhất_của_từng_bài_trong_lớp)`.

### 1.8 Tích hợp Frontend

**File:** `frontend/src/pages/Teacher/scores/ScoresPage.tsx` — component `BottomStudentsTable`

```tsx
const BottomStudentsTable = ({ classId }: { classId: number }) => {
  const [students, setStudents] = useState<BottomStudent[]>([]);

  useEffect(() => {
    api
      .get<{ data: BottomStudent[] }>(`/enrollment/class/${classId}/bottom-students`)
      .then((res) => setStudents(res.data.data ?? []));
  }, [classId]);

  // Hiển thị bảng: rowRank | tên | averageScore | percentileRank (phân vị)
};
```

Component nhận `key={selectedClassId}` để **unmount + remount** khi chuyển lớp, đảm bảo luôn fetch dữ liệu mới.

---

## 2. MongoDB Aggregation Pipeline — Tỉ lệ sai theo câu hỏi

### 2.1 Yêu cầu

> *"Store quiz attempts in MongoDB and use an Aggregation Pipeline to calculate failure rates per question."*

Khi học sinh nộp bài, đáp án được lưu vào MongoDB. Sau đó, hệ thống cần phân tích **câu hỏi nào học sinh hay làm sai nhất** trong toàn bộ một đề thi — đây là thông tin quan trọng giúp giáo viên đánh giá chất lượng đề và phát hiện kiến thức học sinh còn yếu.

### 2.2 MongoDB Collections liên quan

#### `studentanswers` (model `StudentAnswer`)

```js
// models/StudentAnswer.js
{
  doexamId:  Number,   // FK → MySQL doexam.id
  testId:    Number,   // FK → MySQL test.id
  studentId: Number,   // FK → MySQL user.id
  answers: [
    {
      questionId:  String,       // _id của câu hỏi trong question_bank
      chosenIndex: Number | null // chỉ số đáp án học sinh chọn, null = bỏ qua
    }
  ]
}
```

Mỗi document = một lượt làm bài của một học sinh.

#### `question_bank` (model `QuestionBank`)

```js
// models/QuestionBank.js
{
  testId: Number,   // FK → MySQL test.id
  questions: [
    {
      _id:          ObjectId,
      order:        Number,   // thứ tự hiển thị câu hỏi
      text:         String,   // nội dung câu hỏi
      options:      [{ label: String, text: String }],
      correctIndex: Number,   // chỉ số đáp án đúng
      type:         String
    }
  ]
}
```

Mỗi document = toàn bộ ngân hàng câu hỏi của một đề thi.

### 2.3 Aggregation Pipeline — Từng bước

**File:** `backend/src/services/studentExam.service.js` — hàm `getQuestionStats(testId)`

```js
const pipeline = [
    // ── BƯỚC 1: Lọc chỉ lấy bài làm của đề thi cần phân tích ──
    { $match: { testId: Number(testId) } },
    // Kết quả: nhiều document StudentAnswer có cùng testId

    // ── BƯỚC 2: Mở mảng answers thành từng document riêng ──
    { $unwind: '$answers' },
    // Trước: { doexamId:1, answers: [{q1,...},{q2,...}] }
    // Sau:   { doexamId:1, answers: {q1,...} }
    //        { doexamId:1, answers: {q2,...} }

    // ── BƯỚC 3: JOIN với collection question_bank ──
    {
        $lookup: {
            from: 'question_bank',
            localField: 'testId',
            foreignField: 'testId',
            as: 'bank',
        },
    },
    // Gắn toàn bộ document QuestionBank vào field 'bank' (là array)

    // ── BƯỚC 4: Mở array bank (luôn có đúng 1 phần tử) ──
    { $unwind: '$bank' },

    // ── BƯỚC 5: Mở mảng câu hỏi trong bank ──
    { $unwind: '$bank.questions' },
    // Mỗi document bây giờ chứa một câu trả lời + một câu hỏi
    // → sẽ có N câu hỏi × M lượt làm bài combinations → cần lọc ở bước 6

    // ── BƯỚC 6: Chỉ giữ lại cặp (answer, question) khớp nhau ──
    {
        $match: {
            $expr: { $eq: [{ $toString: '$bank.questions._id' }, '$answers.questionId'] },
        },
    },
    // Lý do dùng $toString: _id trong MongoDB là ObjectId, questionId trong StudentAnswer là String
    // → phải ép kiểu để so sánh được

    // ── BƯỚC 7: Tính isCorrect cho từng dòng ──
    {
        $addFields: {
            isCorrect: {
                $and: [
                    { $ne: ['$answers.chosenIndex', null] },          // không bỏ qua
                    { $eq: ['$answers.chosenIndex', '$bank.questions.correctIndex'] }, // chọn đúng
                ],
            },
        },
    },

    // ── BƯỚC 8: Gom nhóm theo từng câu hỏi ──
    {
        $group: {
            _id: '$answers.questionId',
            questionText:  { $first: '$bank.questions.text' },   // lấy nội dung câu hỏi (đồng nhất)
            questionOrder: { $first: '$bank.questions.order' },  // lấy thứ tự hiển thị
            total:   { $sum: 1 },                                // tổng số học sinh làm câu này
            correct: { $sum: { $cond: ['$isCorrect', 1, 0] } }, // số học sinh trả lời đúng
        },
    },
    // Kết quả: một document / câu hỏi, chứa total và correct

    // ── BƯỚC 9: Tính failRate ──
    {
        $addFields: {
            failRate: {
                $round: [
                    {
                        $multiply: [
                            { $divide: [{ $subtract: ['$total', '$correct'] }, '$total'] },
                            // (total - correct) / total = tỉ lệ sai
                            100,
                        ],
                    },
                    1, // làm tròn 1 chữ số thập phân
                ],
            },
        },
    },

    // ── BƯỚC 10: Sắp xếp theo thứ tự câu hỏi ──
    { $sort: { questionOrder: 1 } },
];
```

### 2.4 Luồng dữ liệu qua pipeline — Ví dụ minh họa

Giả sử đề thi có 2 câu, 3 học sinh đã nộp:

```
StudentAnswer collection (sau $match + $unwind answers):
  { doexamId:1, answers:{questionId:"q1", chosenIndex:0} }
  { doexamId:1, answers:{questionId:"q2", chosenIndex:2} }
  { doexamId:2, answers:{questionId:"q1", chosenIndex:1} }  ← sai (đúng là 0)
  { doexamId:2, answers:{questionId:"q2", chosenIndex:2} }
  { doexamId:3, answers:{questionId:"q1", chosenIndex:0} }
  { doexamId:3, answers:{questionId:"q2", chosenIndex:null} } ← bỏ qua

Sau $lookup + $unwind bank + $unwind questions + $match (khớp _id):
  Mỗi dòng giờ chứa đúng câu hỏi tương ứng với đáp án.

Sau $addFields isCorrect:
  q1: [true, false, true]
  q2: [true, true, false(null→false)]

Sau $group:
  { _id:"q1", total:3, correct:2, order:1 }
  { _id:"q2", total:3, correct:2, order:2 }

Sau $addFields failRate:
  { _id:"q1", total:3, correct:2, failRate: 33.3 }
  { _id:"q2", total:3, correct:2, failRate: 33.3 }
```

### 2.5 Chi tiết kỹ thuật quan trọng

#### Vấn đề kiểu dữ liệu ObjectId vs String

```js
// Trong QuestionBank, _id là ObjectId:
//   bank.questions._id = ObjectId("64a1b2c3d4e5f6789abcdef0")

// Trong StudentAnswer, questionId được lưu là String:
//   answers.questionId = "64a1b2c3d4e5f6789abcdef0"

// Không thể so sánh trực tiếp → phải dùng $toString:
{ $expr: { $eq: [{ $toString: '$bank.questions._id' }, '$answers.questionId'] } }
```

#### Tại sao `$unwind` rồi `$match`, không dùng `$lookup` với pipeline?

Cách dùng `$unwind` + `$match` đơn giản và dễ đọc hơn với cấu trúc dữ liệu hiện tại. `$lookup` với pipeline lồng nhau chỉ cần thiết khi điều kiện join phức tạp hơn.

#### `chosenIndex: null` được coi là sai (không phải đúng)

```js
isCorrect: {
    $and: [
        { $ne: ['$answers.chosenIndex', null] }, // bỏ qua → tự động sai
        { $eq: ['$answers.chosenIndex', '$bank.questions.correctIndex'] },
    ],
},
```

Học sinh bỏ qua câu hỏi → `isCorrect = false` → được tính vào tổng `total` nhưng không tính vào `correct`. Điều này phản ánh đúng thực tế: không trả lời = không đúng.

### 2.6 Luồng API

```
GET /exam/test/:testId/question-stats
  │
  ▼
studentExam.route.js
  │  // Route này phải đặt TRƯỚC /:doexamId để tránh bị route wildcard bắt mất
  │  router.get('/test/:testId/question-stats', examController.getQuestionStats);
  ▼
studentExam.controller.js → getQuestionStats()
  │  const { testId } = req.params;
  │  const result = await studentExamService.getQuestionStats(testId);
  │  res.status(200).json({ message: 'Success', data: result });
  ▼
studentExam.service.js → getQuestionStats(testId)
  │  MongoDB Aggregation Pipeline (10 bước)
  ▼
Response JSON:
  [
    {
      "questionId":    "64a1b2c3...",
      "questionText":  "Đâu là cấu trúc dữ liệu LIFO?",
      "questionOrder": 1,
      "total":         25,          ← 25 học sinh làm câu này
      "correct":       17,          ← 17 trả lời đúng
      "failRate":      32.0         ← 32% làm sai
    },
    ...
  ]
```

### 2.7 Tích hợp Frontend — 3 điểm hiển thị

#### (A) Trang quản lý đề thi của giáo viên (`TestDetailPage.tsx`)

Biểu đồ thanh ngang hiển thị tỉ lệ sai từng câu, màu sắc theo mức độ:

```tsx
// frontend/src/pages/Teacher/tests/TestDetailPage.tsx
const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);

// Fetch song song cùng với meta + results:
const [meta, results, stats] = await Promise.all([
    testService.getDetail(testId),
    testService.getResults(testId),
    examService.getQuestionStats(testId),   // ← pipeline
]);

// Hiển thị:
<QuestionFailRateChart stats={questionStats} />
// → thanh ngang mỗi câu: đỏ (≥70%), cam (≥50%), vàng (≥30%), xanh (<30%)
```

#### (B) Trang xem lại bài thi — giáo viên xem bài học sinh (`SubmissionDetailPage.tsx`)

```tsx
// frontend/src/pages/shared/SubmissionDetailPage.tsx
// Fetch song song với submission:
const [result, stats] = await Promise.all([
    examService.getSubmissionByStudentTest(studentId, testId),
    examService.getQuestionStats(testId),
]);

// Truyền failRate vào AnswerCard:
const stat = questionStats.find((s) => s.questionOrder === a.questionIndex);
<AnswerCard answer={a} failRate={stat?.failRate} />

// Trong AnswerCard, hiển thị badge nhỏ dưới câu hỏi:
{failRate !== undefined && (
    <span className="...">
        <AlertTriangle /> {failRate}% lớp làm sai
    </span>
)}
```

#### (C) Trang kết quả thi ngay sau khi nộp bài của học sinh (`ExamResultPage.tsx`)

```tsx
// frontend/src/pages/Student/exam/ExamResultPage.tsx
// Fetch kết quả trước, sau đó dùng test_id để fetch stats:
api.get(`/exam/${doexamId}/result`)
   .then((res) => {
       setData(res.data.data);
       return examService.getQuestionStats(res.data.data.session.test_id);
   })
   .then((stats) => setQuestionStats(stats));

// Trong vòng lặp answers, tìm stat tương ứng theo questionOrder:
const stat = questionStats.find((s) => s.questionOrder === a.questionIndex);
// Hiển thị badge "X% lớp làm sai" bên dưới nội dung câu hỏi
```

### 2.8 Frontend Service

```ts
// frontend/src/services/examService.ts
export interface QuestionStat {
  questionId:    string;
  questionText:  string;
  questionOrder: number;
  total:         number;
  correct:       number;
  failRate:      number;   // 0–100, làm tròn 1 chữ số thập phân
}

export const examService = {
  // ...các method khác...
  getQuestionStats: async (testId: number): Promise<QuestionStat[]> => {
    const res = await api.get<ApiResponse<QuestionStat[]>>(
      `/exam/test/${testId}/question-stats`
    );
    return res.data.data;
  },
};
```

---

## Tổng Kết So Sánh

| Tiêu chí | SQL Window Functions | MongoDB Aggregation Pipeline |
|---|---|---|
| **Database** | MySQL | MongoDB |
| **Mục đích** | Xếp hạng + phân vị học sinh trong lớp | Thống kê tỉ lệ sai theo câu hỏi |
| **Kỹ thuật chính** | `PERCENT_RANK()`, `ROW_NUMBER()`, `COUNT(*) OVER()` | `$unwind`, `$lookup`, `$group`, `$addFields` |
| **Dữ liệu đầu vào** | `enrollment.averageScore` (MySQL) | `studentanswers` + `question_bank` (MongoDB) |
| **Kết quả** | Danh sách học sinh yếu + phân vị | Tỉ lệ sai từng câu hỏi |
| **API endpoint** | `GET /enrollment/class/:classId/bottom-students` | `GET /exam/test/:testId/question-stats` |
| **Sử dụng ở** | ScoresPage (Teacher) | TestDetailPage, SubmissionDetailPage, ExamResultPage |
