import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import hallRoutes from './routes/hallRoutes.js';
import mainRoutes from './routes/mainRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js'
import { authMiddleware } from './middleware/middleware.js';
import cookieParser from 'cookie-parser';

// import bookingRoutes from './routes/bookingRoutes.js';

dotenv.config();

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(authMiddleware);

app.use('/', authRoutes);
app.use('/', mainRoutes);
app.use('/', hallRoutes);
app.use('/', bookingRoutes);
app.use('/', clientRoutes);
app.use('/', ratingRoutes);
app.use('/',adminRoutes);

// app.use('/bookings', bookingRoutes);

sequelize.authenticate()
  .then(() => console.log('✅ DB connected'))
  .catch(err => console.error('❌ DB error:', err));

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}/index`)
);
