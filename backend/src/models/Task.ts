import mongoose, { Document, Schema } from 'mongoose';

// Define interface for test cases
export interface ITestCase {
  input: string; // Test input (as string)
  expectedOutput: string; // Expected output (as string)
  isHidden: boolean; // Hidden tests are not shown to users
  description?: string; // What this test is checking
}

// Define interface for file templates
export interface IFileTemplate {
  filename: string; // e.g., "solution.py"
  content: string; // Starter code or empty template
  isReadOnly: boolean; // Can user modify this file?
}

// Define interface for task configuration
export interface ITaskConfig {
  language: string; // "python", "javascript", etc.
  entryPoint: string; // Main file to run (e.g., "solution.c")
  testCommand: string; // Command to run tests (e.g., "bash test_solution.sh")
  timeout: number; // Max execution time in milliseconds
  memoryLimit?: number; // Memory limit in MB
  testScriptPath: string; // Path to test script in seed-data (e.g., "C/strings/hello-world")
  testCases: ITestCase[]; // Test cases for validation
}

// Main Task interface
export interface ITask extends Document {
  // Basic info
  title: string;
  description: string; // Markdown description of the task
  category: string; // "arrays", "strings", "algorithms", etc.
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];

  // Configuration
  configs: ITaskConfig[]; // Configurations for different languages

  // Metadata
  points: number; // Points for completing
  order: number; // Display order
  isActive: boolean;
  estimatedTime: number; // Estimated completion time in minutes

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getConfigForLanguage(language: string): ITaskConfig | null;
  hasLanguageSupport(language: string): boolean;
}

// ======================
// SUB-SCHEMAS
// ======================

// TestCase sub-schema
const TestCaseSchema = new Schema(
  {
    input: {
      type: String,
      required: false,
	  default: ""
    },
    expectedOutput: {
      type: String,
      required: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
  },
  { _id: false } // Don't create _id for subdocuments
);

// FileTemplate sub-schema
const FileTemplateSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isReadOnly: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// TaskConfig sub-schema
const TaskConfigSchema = new Schema(
  {
    language: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['python', 'javascript', 'java', 'cpp', 'c'],
    },
    entryPoint: {
      type: String,
      required: true,
    },
    testCommand: {
      type: String,
      required: true,
    },
    timeout: {
      type: Number,
      default: 10000,
      min: 1000,
      max: 60000,
    },
    memoryLimit: {
      type: Number,
      default: 256,
      min: 64,
      max: 2048,
    },
    testScriptPath: {  // NEW FIELD
      type: String,
      required: true,
    },
    testCases: [TestCaseSchema],
  },
  { _id: false }
);

// ======================
// MAIN TASK SCHEMA
// ======================

const TaskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Task description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },

    category: {
      type: String,
      required: true,
      enum: [
        'arrays',
        'strings',
        'algorithms',
        'data-structures',
        'mathematics',
        'databases',
        'debugging',
        'recursion',
        'sorting',
        'searching',
      ],
    },

    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10; // Max 10 tags per task
        },
        message: 'Cannot have more than 10 tags',
      },
    },

    configs: {
      type: [TaskConfigSchema],
      required: true,
      validate: {
        validator: function (configs: ITaskConfig[]) {
          return configs.length > 0; // At least one language config
        },
        message: 'At least one language configuration is required',
      },
    },

    points: {
      type: Number,
      required: true,
      min: [10, 'Minimum points is 10'],
      max: [1000, 'Maximum points is 1000'],
      default: 100,
    },

    order: {
      type: Number,
      default: 0,
      min: [0, 'Order cannot be negative'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    estimatedTime: {
      type: Number,
      default: 30, // 30 minutes default
      min: [5, 'Minimum estimated time is 5 minutes'],
      max: [240, 'Maximum estimated time is 4 hours'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Security: Remove hidden test cases from public view
        if (ret.configs) {
          ret.configs.forEach((config: any) => {
            if (config.testCases) {
              config.testCases = config.testCases.filter(
                (test: any) => !test.isHidden
              );
            }
          });
        }
        return ret;
      },
    },
  }
);

// ======================
// INDEXES
// ======================

// Compound index for common queries
TaskSchema.index({ category: 1, difficulty: 1 });

// Single field indexes
TaskSchema.index({ difficulty: 1 });
TaskSchema.index({ isActive: 1 });
TaskSchema.index({ order: 1 });
TaskSchema.index({ tags: 1 });

// Text index for search
TaskSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  {
    weights: {
      title: 10, // Title matches are most important
      tags: 5, // Tag matches are somewhat important
      description: 1, // Description matches are least important
    },
    name: 'TaskSearchIndex',
  }
);

// ======================
// INSTANCE METHODS
// ======================

/**
 * Get configuration for a specific language
 */
TaskSchema.methods.getConfigForLanguage = function (
  language: string
): ITaskConfig | null {
  const lang = language.toLowerCase();
  return (
    this.configs.find(
      (config: ITaskConfig) => config.language.toLowerCase() === lang
    ) || null
  );
};

/**
 * Check if task supports a specific language
 */
TaskSchema.methods.hasLanguageSupport = function (language: string): boolean {
  const lang = language.toLowerCase();
  return this.configs.some(
    (config: ITaskConfig) => config.language.toLowerCase() === lang
  );
};

// ======================
// STATIC METHODS
// ======================

/**
 * Find tasks by difficulty level
 */
TaskSchema.statics.findByDifficulty = function (difficulty: string) {
  return this.find({ difficulty, isActive: true }).sort({ order: 1 });
};

/**
 * Find tasks by category
 */
TaskSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, isActive: true }).sort({ order: 1 });
};

/**
 * Find tasks that support a specific language
 */
TaskSchema.statics.findByLanguage = function (language: string) {
  const lang = language.toLowerCase();
  return this.find({
    'configs.language': lang,
    isActive: true,
  }).sort({ order: 1 });
};

/**
 * Search tasks by text
 */
TaskSchema.statics.search = function (query: string) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// ======================
// VIRTUAL PROPERTIES
// ======================

/**
 * Virtual: Total test cases (including hidden)
 */
TaskSchema.virtual('totalTestCases').get(function () {
  const plainConfigs: ITaskConfig[] = this.configs.toObject();
  return plainConfigs.reduce(
    (total: number, config: ITaskConfig) =>
      total + (config.testCases?.length || 0),
    0
  );
});

/**
 * Virtual: Public test cases (excluding hidden)
 */
TaskSchema.virtual('publicTestCases').get(function () {
  const plainConfigs: ITaskConfig[] = this.configs.toObject();
  return plainConfigs.reduce(
    (total: number, config: ITaskConfig) =>
      total + (config.testCases?.filter((test) => !test.isHidden).length || 0),
    0
  );
});

/**
 * Virtual: Supported languages as array
 */
TaskSchema.virtual('supportedLanguages').get(function () {
  const plainConfigs: ITaskConfig[] = this.configs.toObject();
  return plainConfigs.map((config: ITaskConfig) => config.language as string);
});

// Create and export the model
const Task = mongoose.model<ITask>('Task', TaskSchema);
export default Task;
