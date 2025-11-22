import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import languageMiddleware from './middleware/languageMiddleware.js';
import ResponseHandler from './utils/responseHandler.js';

dotenv.config();

const app = express();

connectDB();

app.use(helmet());

const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(languageMiddleware);

app.get('/', (req, res) => {
    ResponseHandler.success(res, 200, 'Welcome to the Afroluxe API', {
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (req, res) => {
    ResponseHandler.success(res, 200, 'API is healthy', {
        status: 'OK',
        database: 'Connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

//Routes 
import productRoutes from './routes/productsRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';


app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', orderRoutes)
app.use('/api/orders', orderRoutes);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AfroLuxe Backend Server`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});