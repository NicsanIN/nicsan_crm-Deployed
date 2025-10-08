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
          password: 'NicsanOps2024!@#',
          name: 'Operations User',
          role: 'ops'
        },
        {
          email: 'admin@nicsan.in',
          password: 'NicsanAdmin2024!@#',
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

  // Get all users
  async getAllUsers() {
    try {
      const queryText = `
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login, phone, department
        FROM users 
        ORDER BY created_at DESC
      `;
      const result = await query(queryText);
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Get all users error:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const queryText = `
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login, phone, department
        FROM users 
        WHERE id = $1
      `;
      const result = await query(queryText, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Get user by ID error:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id, updateData) {
    try {
      const { email, name, role, is_active, phone, department, password_hash } = updateData;
      
      // Build dynamic query based on provided fields
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (role !== undefined) {
        fields.push(`role = $${paramCount++}`);
        values.push(role);
      }
      if (is_active !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(is_active);
      }
      if (phone !== undefined) {
        fields.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      if (department !== undefined) {
        fields.push(`department = $${paramCount++}`);
        values.push(department);
      }
      if (password_hash !== undefined) {
        fields.push(`password_hash = $${paramCount++}`);
        values.push(password_hash);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const queryText = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, name, role, is_active, created_at, updated_at, phone, department
      `;
      
      const result = await query(queryText, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Update user error:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id) {
    try {
      // First check if user exists
      const userCheck = await query('SELECT id FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      // Delete user
      const queryText = 'DELETE FROM users WHERE id = $1';
      await query(queryText, [id]);

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('❌ Delete user error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();

