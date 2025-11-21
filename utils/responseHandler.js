class ResponseHandler {
    static success(res, statusCode = 200, message = 'Success', data = null) {
        const response = {
            success: true,
            message,
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
        const response = {
            success: false,
            message,
        };

        if (errors !== null) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    static paginated(res, statusCode = 200, message = 'Success', data = [], pagination = {}) {
      return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || 0,
            pages: pagination.totalPages || 0,
        }
      });
    }
}

export default ResponseHandler;