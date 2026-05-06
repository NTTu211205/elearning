var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./src/routes/user.route');
const authRouter = require('./src/routes/auth.route');
const subjectRouter = require('./src/routes/subject.route');
const classRouter = require('./src/routes/class.route');
const enrollmentRouter = require('./src/routes/enrollment.route');
const testRouter = require('./src/routes/test.route');
const studentExamRouter = require('./src/routes/studentExam.route');

const promisePool = require('./src/config/MySQLConnect');
const connectDB = require('./src/config/MongoDBConnect');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/utils/swagger');
const cors = require("cors"); // Thêm cors để xử lý CORS - xanh thêm

var app = express();
connectDB()

// view engine setup
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: process.env.CLIENT_URL || allowedOrigin, credentials: true })); // xanh thêm

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/subject', subjectRouter);
app.use('/class', classRouter);
app.use('/enrollment', enrollmentRouter);
app.use('/test', testRouter);
app.use('/exam', studentExamRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    message: message,
    ...(req.app.get('env') === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📄 API Docs available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
