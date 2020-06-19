const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/);
    const message = `Duplicate field value: ${value[0]}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError("Invalid token. Please log in again", 401);

const handleJWTExpiredError = () =>
    new AppError("Your token has expired! Please login again", 401);

const sendErroDev = (err, req, res) => {
    //A. API
    if (req.originalUrl.startsWith("/api")) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    //B. RENDERED WEBSITE
    console.log("ERROR:", err);
    return res.status(err.statusCode).render("error", {
        title: "Something went wrong",
        msg: err.message
    });
};

const sendErrorProd = (err, req, res) => {
    //A. API
    if (req.originalUrl.startsWith("/api")) {
        //A. OPERATIONAL, trusted error:send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        //B. Programming orother unknown error:don't leak error details
        //1. Log the error
        console.log("ERROR:", err);
        //2. Send generic error
        return res.status(500).json({
            status: "error",
            message: "Something went very wrong!"
        });
    }

    //B. RENDERED WEBSITE
    //A. OPERATIONAL, trusted error:send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).render("error", {
            title: "Something went wrong",
            msg: err.message
        });
    }
    //B. Programming or other unknown error:don't leak error details
    //1. Log the error
    console.log("ERROR:", err);
    //2. Send generic erro
    return res.status(err.statusCode).render("error", {
        title: "Something went wrong",
        msg: "Please try again later"
    });
};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErroDev(err, req, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = err;
        if (error.name === "CastError") error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === "ValidationError")
            error = handleValidationErrorDB(error);
        if (error.name === "JsonWebTokenError") error = handleJWTError();
        if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};
