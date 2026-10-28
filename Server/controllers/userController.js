const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { DEMO_USER_ID, demoStore, generateId } = require("../demoStore");

// Generate JWT token
const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }
    const cleanEmail = email.toLowerCase().trim();

    // Check in-memory store first
    if (demoStore.users.some(u => u.email === cleanEmail)) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If MongoDB is connected, register into MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "User already exists"
          });
        }

        const user = await User.create({
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: role || "farmer",
          phone
        });

        const token = createToken(user._id);

        return res.status(201).json({
          success: true,
          message: "Registration successful",
          token,
          user: {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
          }
        });
      } catch (dbError) {
        console.warn("MongoDB registration failed, falling back to memory store:", dbError.message);
      }
    }

    // Fallback: save to memory store so testing/registration succeeds even without active MongoDB
    const newUserId = generateId("user_");
    const newUser = {
      _id: newUserId,
      id: newUserId,
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: role || "farmer",
      phone,
      createdAt: new Date().toISOString()
    };
    demoStore.users.push(newUser);

    const token = createToken(newUserId);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

// Login an existing user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Demo User / Memory Users first
    const memUser = demoStore.users.find(u => u.email === cleanEmail);
    if (memUser) {
      const isMatch = await bcrypt.compare(password, memUser.password);
      if (isMatch) {
        const token = createToken(memUser._id);
        return res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          user: {
            id: memUser._id,
            _id: memUser._id,
            name: memUser.name,
            email: memUser.email,
            role: memUser.role,
            phone: memUser.phone
          }
        });
      }
    }

    // 2. If MongoDB is connected, check MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            const token = createToken(user._id);
            return res.status(200).json({
              success: true,
              message: "Login successful",
              token,
              user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
              }
            });
          }
        }
      } catch (dbErr) {
        console.warn("MongoDB login check failed:", dbErr.message);
      }
    }

    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

module.exports = {
  registerUser,
  loginUser
};