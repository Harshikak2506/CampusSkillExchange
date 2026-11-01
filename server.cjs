const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("MONGO URI:", process.env.MONGO_URI);

/* =========================================================
   MONGODB CONNECTION
========================================================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));


/* =========================================================
   STUDENT SCHEMA
========================================================= */

const studentsSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    /* Experiment 6 - User Role */
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   LOGIN LOG SCHEMA
========================================================= */

const loginLogSchema = new mongoose.Schema(
  {
    studentId: String,
    email: String,
    action: String,
    token: String,
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   SKILLS SCHEMA
========================================================= */

const skillsSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    level: String,
    teacher: String,
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   MODELS
========================================================= */

const Student = mongoose.model(
  "Student",
  studentsSchema,
  "students"
);

const LoginLog = mongoose.model(
  "LoginLog",
  loginLogSchema,
  "loginlogs"
);

const Skill = mongoose.model(
  "Skill",
  skillsSchema,
  "skills"
);


/* =========================================================
   HOME / TEST ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "VESIT Skill Exchange API is running",
  });
});


/* =========================================================
   EXPERIMENT 5
   REGISTER API
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const {
      studentId,
      name,
      email,
      phone,
      password,
    } = req.body;

    /* Validate required fields */

    if (
      !studentId ||
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    /* Check whether Student ID already exists */

    const existingStudent = await Student.findOne({
      studentId: studentId.trim(),
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Student ID already exists",
      });
    }

    /* Check whether email already exists */

    const existingEmail = await Student.findOne({
      email: email.trim(),
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    /* Hash password */

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    /* Create student */

    const student = await Student.create({
      studentId: studentId.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone || "",
      password: hashedPassword,

      /* Every newly registered user is a student */
      role: "student",
    });

    res.status(201).json({
      message: "Registration Successful",

      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: student.role,
      },
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   EXPERIMENT 5 + 6
   LOGIN API
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const {
      studentId,
      password,
    } = req.body;

    /* Validate input */

    if (!studentId || !password) {
      return res.status(400).json({
        message: "Student ID and Password are required",
      });
    }

    /* Find student */

    const student = await Student.findOne({
      studentId: studentId.trim(),
    });

    if (!student) {

      await LoginLog.create({
        studentId: studentId,
        email: "N/A",
        action: "LOGIN_FAILED_STUDENT_NOT_FOUND",
      });

      return res.status(400).json({
        message: "Student Not Found",
      });
    }

    /* Compare password with hashed password */

    const passwordMatch = await bcrypt.compare(
      password,
      student.password
    );

    if (!passwordMatch) {

      await LoginLog.create({
        studentId: student.studentId,
        email: student.email,
        action: "LOGIN_FAILED_WRONG_PASSWORD",
      });

      return res.status(400).json({
        message: "Invalid Student ID or Password",
      });
    }

    /* =====================================================
       CREATE JWT TOKEN
       Experiment 6
    ===================================================== */

    const token = jwt.sign(
      {
        studentId: student.studentId,
        email: student.email,

        /* Role is stored inside JWT */
        role: student.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1h",
      }
    );


    /* Store successful login */

    await LoginLog.create({
      studentId: student.studentId,
      email: student.email,
      action: "LOGIN",
      token: token,
    });


    /* Send response */

    res.status(200).json({
      message: "Login Successful",

      token: token,

      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: student.role,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   JWT AUTHENTICATION MIDDLEWARE
   Experiment 6
========================================================= */

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers.authorization;

  /* No Authorization header */

  if (!authHeader) {
    return res.status(401).json({
      message: "Access Token Required",
    });
  }


  /* Expected format:
     Authorization: Bearer TOKEN
  */

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid Authorization Format",
    });
  }


  /* Verify JWT */

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* Store decoded user information */

    req.user = decoded;

    next();

  } catch (err) {

    console.log("JWT ERROR:", err.message);

    return res.status(403).json({
      message: "Invalid or Expired Token",
    });
  }
};


/* =========================================================
   ROLE AUTHORIZATION MIDDLEWARE
   Experiment 6
========================================================= */

const authorizeRole = (...allowedRoles) => {

  return (req, res, next) => {

    /* User must first be authenticated */

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication Required",
      });
    }


    /* Check whether user's role is allowed */

    if (!allowedRoles.includes(req.user.role)) {

      return res.status(403).json({
        message:
          "Access Denied: Insufficient Permissions",
      });
    }


    next();
  };
};


/* =========================================================
   GET ALL STUDENTS
   Experiment 5
========================================================= */

app.get("/api/students", async (req, res) => {

  try {

    const students = await Student.find();

    res.status(200).json(students);

  } catch (err) {

    console.log("STUDENTS ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   GET LOGIN LOGS
   Experiment 5
========================================================= */

app.get("/api/loginlogs", async (req, res) => {

  try {

    const logs = await LoginLog.find()
      .sort({
        createdAt: -1,
      });

    res.status(200).json(logs);

  } catch (err) {

    console.log("LOGIN LOG ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   LOGOUT API
========================================================= */

app.post(
  "/api/logout",
  authenticateToken,
  async (req, res) => {

    try {

      await LoginLog.create({
        studentId: req.user.studentId,
        email: req.user.email,
        action: "LOGOUT",
      });

      res.status(200).json({
        message: "Logout Successful",
      });

    } catch (err) {

      console.log("LOGOUT ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   GET CURRENT USER
   Protected JWT route
========================================================= */

app.get(
  "/api/profile",
  authenticateToken,
  async (req, res) => {

    try {

      const student = await Student.findOne({
        studentId: req.user.studentId,
      }).select("-password");

      if (!student) {
        return res.status(404).json({
          message: "Student Not Found",
        });
      }

      res.status(200).json({
        message: "Authenticated User",
        student: student,
      });

    } catch (err) {

      console.log("PROFILE ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   ADMIN DASHBOARD
   JWT + ROLE AUTHORIZATION
========================================================= */

app.get(
  "/api/admin/dashboard",

  /* First check JWT */
  authenticateToken,

  /* Then check role */
  authorizeRole("admin"),

  async (req, res) => {

    try {

      const students = await Student.find()
        .select("-password");

      res.status(200).json({

        message: "Welcome Admin",

        loggedInUser: req.user,

        totalStudents: students.length,

        students: students,
      });

    } catch (err) {

      console.log("ADMIN ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   STUDENT-ONLY PROTECTED ROUTE
========================================================= */

app.get(
  "/api/student/dashboard",

  authenticateToken,

  authorizeRole("student"),

  async (req, res) => {

    try {

      const student = await Student.findOne({
        studentId: req.user.studentId,
      }).select("-password");

      res.status(200).json({
        message: "Welcome Student",
        student: student,
      });

    } catch (err) {

      console.log("STUDENT DASHBOARD ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   GET SKILLS
========================================================= */

app.get("/api/skills", async (req, res) => {

  try {

    const skills = await Skill.find();

    res.status(200).json(skills);

  } catch (err) {

    console.log("SKILLS ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   ADD SKILL
   Only authenticated users
========================================================= */

app.post(
  "/api/skills",
  authenticateToken,
  async (req, res) => {

    try {

      const {
        name,
        category,
        level,
      } = req.body;

      if (!name || !category || !level) {
        return res.status(400).json({
          message: "All skill fields are required",
        });
      }

      const student = await Student.findOne({
        studentId: req.user.studentId,
      });

      if (!student) {
        return res.status(404).json({
          message: "Student Not Found",
        });
      }

      const skill = await Skill.create({
        name: name,
        category: category,
        level: level,
        teacher: student.name,
      });

      res.status(201).json({
        message: "Skill Added Successfully",
        skill: skill,
      });

    } catch (err) {

      console.log("ADD SKILL ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   404 ROUTE
========================================================= */

app.use((req, res) => {

  res.status(404).json({
    message: "API Route Not Found",
  });
});


/* =========================================================
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});