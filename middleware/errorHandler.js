const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    if (err.name === "CastError") {
        message = "Resource not found";
        statusCode = 404;
    }
    
    if (err.code === 11000) {
        message = "Duplicate field value entered";
        statusCode = 400;
    } 

    if (err.name === "ValidationError") {
        message = Object.values(err.errors)
        .map((val => val.message))
        .join(', ');
        statusCode = 400;
    }

    //JWT errors
    if (err.name === "JsonWebTokenError") {
        message = "Invalid Token";
        statusCode = 401;
    }

    if (err.name === "TokenExpiredError") {
        message = "Token expired";
        statusCode = 401;
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

// Not Found Handler 
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export { errorHandler, notFound };