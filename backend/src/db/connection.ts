import mongoose from 'mongoose';

// Create a Database class to manage MongoDB connection
class Database {
  // Store a single instance of the database (Singleton pattern)
  private static instance: Database;
  
  // Track connection status
  private isConnected: boolean = false;

  // Private constructor prevents direct instantiation
  private constructor() {}

  // Singleton pattern: ensure only one database instance exists
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Connect to MongoDB
  public async connect(): Promise<void> {
    // If already connected, don't connect again
    if (this.isConnected) {
      console.log('MongoDB already connected');
      return;
    }

    try {
      // Get connection URI from environment or use default
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-challenge-db';
      
      // Configure connection options
      const options = {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(
          process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'
        ),
      };

      // Establish the connection
      await mongoose.connect(uri, options);
      this.isConnected = true;

      console.log('✅ MongoDB connected successfully');
      
      // Set up event listeners for the connection
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  // Disconnect from MongoDB
  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    await mongoose.disconnect();
    this.isConnected = false;
    console.log('MongoDB disconnected');
  }

  // Get the mongoose connection object
  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  // Check if database is connected
  public isDBConnected(): boolean {
    return this.isConnected;
  }

  // Set up event listeners for connection events
  private setupEventListeners(): void {
    const connection = mongoose.connection;

    // When connection has an error
    connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      this.isConnected = false;
    });

    // When connection is disconnected
    connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      this.isConnected = false;
    });

    // When connection is reconnected after a disconnection
    connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      this.isConnected = true;
    });

    // When attempting to connect
    connection.on('connecting', () => {
      console.log('Connecting to MongoDB...');
    });

    // When successfully connected
    connection.on('connected', () => {
      console.log('MongoDB connected');
      this.isConnected = true;
    });
  }
}

// Export a single instance of the Database class
export default Database.getInstance();
