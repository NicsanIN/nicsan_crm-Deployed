const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

class AuthService {
  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user in PostgreSQL
      const queryText = 'SELECT * FROM users WHERE email = $1';
      const result = await query(queryText, [email]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Generate token
      const token = this.generateToken(user);

      // Return user data (without password)
      const { password_hash, ...userData } = user;

      return {
        success: true,
        data: {
          token,
          user: userData
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const { email, password, name, role = 'ops' } = userData;

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Save to PostgreSQL
      const queryText = `
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role, created_at
      `;

      const result = await query(queryText, [email, passwordHash, name, role]);
      const user = result.rows[0];

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        data: {
          token,
          user
        }
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const queryText = 'SELECT id, email, name, role, created_at FROM users WHERE id = $1';
      const result = await query(queryText, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
  }

  // Initialize default users (for development)
  async initializeDefaultUsers() {
    try {
      // Check if default users exist
      const existingUsers = await query('SELECT COUNT(*) FROM users');
      if (existingUsers.rows[0].count > 0) {
        console.log('ℹ️ Users already exist, skipping initialization');
        return;
      }

      // Create default users
      const defaultUsers = [
        {
          email: 'ops@nicsan.in',
          password: 'ops123',
          name: 'Operations User',
          role: 'ops'
        },
        {
          email: 'admin@nicsan.in',
          password: 'admin123',
          name: 'Founder User',
          role: 'founder'
        }
      ];

      for (const userData of defaultUsers) {
        await this.register(userData);
        console.log(`✅ Created default user: ${userData.email}`);
      }

      console.log('✅ Default users initialized successfully');
    } catch (error) {
      console.error('❌ Default users initialization error:', error);
    }
  }
}

module.exports = new AuthService();

