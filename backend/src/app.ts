import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import database connection
import db from './db/connection';

// Import routes
import authRoutes from './routes/authRoutes'; 
import protectedRoutes from './routes/protectedRoutes';
import taskRoutes from './routes/taskRoutes';
import dockerRoutes from './routes/dockerRoutes';
import taskRunnerRoutes from './routes/taskRunnerRoutes';
import taskAdminRoutes from './routes/admin/taskAdminRoutes';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check middleware
app.use((req: Request, res: Response, next) => {
  if (!db.isDBConnected()) {
    return res.status(503).json({
      success: false,
      error: 'Service unavailable',
      details: 'Database connection is not established'
    });
  }
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Code Challenge Platform API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login (coming soon)'
      },
      health: 'GET /health',
      tasks: 'GET /api/tasks (coming soon)'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  const dbStatus = db.isDBConnected() ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'code-challenge-backend',
    version: '1.0.0',
    database: {
      status: dbStatus,
      connection: db.getConnection().readyState === 1 ? 'active' : 'inactive',
    },
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/docker', dockerRoutes); 
app.use('/api/tasks', taskRoutes);
app.use('/api/run', taskRunnerRoutes);
app.use('/api/protected', protectedRoutes); 
app.use('/api/admin', taskAdminRoutes)

// 404 Handler - Catch undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

export default app;
