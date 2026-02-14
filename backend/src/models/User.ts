import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

// Define TypeScript interface for User document
export interface IUser extends Document {
  // Authentication fields
  email: string;
  password: string;
  username: string;
  role: 'user' | 'admin' | 'super_admin';

  // Profile fields
  avatarUrl?: string;
  bio?: string;

  // Status fields
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;

  // Security questions for password reset
  securityQuestion?: string;
  securityAnswerHash?: string;

  // Methods
  compareSecurityAnswer(candidateAnswer: string): Promise<boolean>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
}

// Define the Mongoose schema
const UserSchema: Schema = new Schema(
  {
    // Email (required, unique, validated)
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    // Password (required, will be hashed)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password in queries by default
    },

    // username (required)
    username: {
      type: String,
      required: [true, 'username is required'],
      trim: true,
      minlength: [3, 'username must be at least 3 characters'],
      maxlength: [30, 'username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'username can only contain letters, numbers, and underscores',
      ],
    },

    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user',
    },

    // Optional profile fields
    avatarUrl: {
      type: String,
      default: 'https://avatar.iran.liara.run/public',
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // For email verification
    verificationToken: {
      type: String,
      select: false,
    },

    // For password reset
    securityQuestion: {
      type: String,
      select: true,
    },

    securityAnswerHash: {
      type: String,
      select: false,
    },

    // For tracking password changes
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // Last login timestamp
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false, // Disables the __v field
    toJSON: {
      virtuals: true, // Include virtuals when converting to JSON
      transform: (doc, ret: any) => {
        // Remove sensitive fields from JSON output
        delete (ret as any).password;
        delete ret.verificationToken;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Add indexes for faster queries
UserSchema.index({ isActive: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ createdAt: -1 });

// ======================
// MIDDLEWARE (HOOKS)
// ======================

/**
 * PRE-SAVE HOOK: Hash password before saving
 * This runs automatically before a user document is saved
 */

UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  try {
    // Generate a salt (random data for hashing)
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password as string, salt);

    console.log('saving as', this.password);

    // Update passwordChangedAt timestamp
    this.passwordChangedAt = new Date(Date.now() - 1000);
  } catch (error: any) {
    throw error;
  }
});

/**
 * PRE-SAVE HOOK: Convert email to lowercase
 */
UserSchema.pre('save', async function () {
  if (this.isModified('email')) {
    this.email = (this.email as string).toLowerCase();
  }
});

// ======================
// INSTANCE METHODS
// ======================

// Add method to compare security answer
UserSchema.methods.compareSecurityAnswer = async function (
  candidateAnswer: string
): Promise<boolean> {
  if (!this.securityAnswerHash) {
    console.log('No security answer hash stored for user');
    return false;
  }

  try {
    const result = await bcrypt.compare(
      candidateAnswer.toLowerCase().trim(),
      this.securityAnswerHash
    );
    console.log('Security answer comparison result:', result);
    return result;
  } catch (error) {
    console.error('Bcrypt compare error:', error);
    return false;
  }
};

/**
 * Compare candidate password with stored hashed password
 * Used during login to check if password is correct
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // bcrypt.compare handles the hashing of candidate password and comparison
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.log('bcrypt', error);
    return false;
  }
};

/**
 * Check if password was changed after a JWT was issued
 * Used to invalidate tokens if password has changed
 */
UserSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    // Convert passwordChangedAt to timestamp (seconds)
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );

    // If JWT was issued before password change, return true (password was changed)
    return JWTTimestamp < changedTimestamp;
  }

  // Password was never changed
  return false;
};

// ======================
// STATIC METHODS
// ======================

/**
 * Find user by email (case-insensitive)
 */
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by username (case-insensitive)
 */
UserSchema.statics.findByusername = function (username: string) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

/**
 * Find active users
 */
UserSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true });
};

// ======================
// VIRTUAL PROPERTIES
// ======================

/**
 * Virtual property: Full name (could be used later)
 */
UserSchema.virtual('fullName').get(function () {
  // In a real app, you might have firstName and lastName fields
  return this.username;
});

/**
 * Virtual property: Account age in days
 */
UserSchema.virtual('accountAgeDays').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt as any);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Create and export the model
const User = mongoose.model<IUser>('User', UserSchema);
export default User;
