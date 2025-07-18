import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the db directory exists
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Path for the example database
const dbPath = path.join(dbDir, 'example.db');

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// Create a new database
const db = new Database(dbPath);

// Create tables
db.exec(`
  -- Departments table
  CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  -- Courses table
  CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    credits INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  -- Students table
  CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    date_of_birth DATE,
    enrollment_date DATE
  );

  -- Enrollments table (many-to-many relationship between students and courses)
  CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    enrollment_date DATE,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  -- Instructors table
  CREATE TABLE instructors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department_id INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  -- Course Instructors table (many-to-many relationship)
  CREATE TABLE course_instructors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    instructor_id INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (instructor_id) REFERENCES instructors(id)
  );
`);

// Insert sample data
const insertDepartments = db.prepare(`
  INSERT INTO departments (name, description) VALUES 
  ('Computer Science', 'Department of computing and information technology'),
  ('Mathematics', 'Department of mathematical sciences'),
  ('Physics', 'Department of physical sciences')
`);
insertDepartments.run();

// Prepare insert statements
const insertCourses = db.prepare(`
  INSERT INTO courses (department_id, code, name, description, credits) VALUES 
  (1, 'CS101', 'Introduction to Programming', 'Basic programming concepts', 3),
  (1, 'CS201', 'Data Structures', 'Advanced data structure techniques', 4),
  (2, 'MATH101', 'Calculus I', 'Fundamental calculus', 4),
  (2, 'MATH201', 'Linear Algebra', 'Matrix theory and linear transformations', 3),
  (3, 'PHYS101', 'Classical Mechanics', 'Newtonian physics', 4)
`);
insertCourses.run();

const insertStudents = db.prepare(`
  INSERT INTO students (first_name, last_name, email, date_of_birth, enrollment_date) VALUES 
  ('Emma', 'Johnson', 'emma.johnson@university.edu', '2002-03-15', '2021-09-01'),
  ('Liam', 'Smith', 'liam.smith@university.edu', '2001-11-22', '2020-09-01'),
  ('Olivia', 'Williams', 'olivia.williams@university.edu', '2002-07-10', '2021-09-01'),
  ('Noah', 'Brown', 'noah.brown@university.edu', '2001-05-18', '2020-09-01'),
  ('Ava', 'Jones', 'ava.jones@university.edu', '2002-01-25', '2021-09-01')
`);

const insertInstructors = db.prepare(`
  INSERT INTO instructors (first_name, last_name, email, department_id) VALUES 
  ('Dr. Michael', 'Chen', 'michael.chen@university.edu', 1),
  ('Dr. Sarah', 'Rodriguez', 'sarah.rodriguez@university.edu', 2),
  ('Dr. David', 'Kim', 'david.kim@university.edu', 3)
`);

const insertEnrollments = db.prepare(`
  INSERT INTO enrollments (student_id, course_id, enrollment_date, grade) VALUES 
  (1, 1, '2022-01-15', 'A'),
  (1, 3, '2022-01-15', 'B+'),
  (2, 2, '2022-01-15', 'A-'),
  (2, 4, '2022-01-15', 'B'),
  (3, 1, '2022-01-15', 'A'),
  (3, 5, '2022-01-15', 'A-'),
  (4, 2, '2022-01-15', 'B+'),
  (4, 3, '2022-01-15', 'A'),
  (5, 4, '2022-01-15', 'B'),
  (5, 5, '2022-01-15', 'A-')
`);

const insertCourseInstructors = db.prepare(`
  INSERT INTO course_instructors (course_id, instructor_id) VALUES 
  (1, 1),
  (2, 1),
  (3, 2),
  (4, 2),
  (5, 3)
`);

// Run inserts
[insertStudents, insertInstructors, insertEnrollments, insertCourseInstructors].forEach(stmt => stmt.run());

console.log(`Example database created at ${dbPath}`);

// Close the database connection
db.close();