from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), default='student')  # student, teacher, admin
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.String(200))
    language_preference = db.Column(db.String(10), default='en')
    stress_level = db.Column(db.Integer, default=0)  # 0-10 scale
    
    # Relationships
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    assignments_submitted = db.relationship('Assignment', foreign_keys='Assignment.submitted_by', backref='submitter', lazy=True)
    grades_received = db.relationship('Grade', foreign_keys='Grade.student_id', backref='student', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f'<User {self.username}>'

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    max_students = db.Column(db.Integer, default=30)
    
    # Relationships
    teacher = db.relationship('User', backref='courses_taught')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True)
    assignments = db.relationship('Assignment', backref='course', lazy=True)
    
    def __repr__(self):
        return f'<Course {self.code}: {self.name}>'

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Enrollment {self.user_id} in {self.course_id}>'

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    max_points = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    submission_date = db.Column(db.DateTime)
    submission_file = db.Column(db.String(200))
    
    # Relationships
    grades = db.relationship('Grade', backref='assignment', lazy=True)
    
    def __repr__(self):
        return f'<Assignment {self.title}>'

class Grade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignment.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    points_earned = db.Column(db.Integer, nullable=False)
    feedback = db.Column(db.Text)
    graded_at = db.Column(db.DateTime, default=datetime.utcnow)
    graded_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    grader = db.relationship('User', foreign_keys=[graded_by], backref='grades_given')
    
    def get_percentage(self):
        if self.assignment.max_points > 0:
            return (self.points_earned / self.assignment.max_points) * 100
        return 0
    
    def __repr__(self):
        return f'<Grade {self.points_earned}/{self.assignment.max_points}>'

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')  # info, warning, success, error
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Notification {self.title}>'

class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room = db.Column(db.String(50))
    
    # Relationships
    user = db.relationship('User', backref='schedules')
    course = db.relationship('Course', backref='schedules')
    
    def __repr__(self):
        return f'<Schedule {self.course.name} on {self.day_of_week}>'

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    questions = db.Column(db.JSON)  # Store questions as JSON
    max_score = db.Column(db.Integer, default=100)
    time_limit = db.Column(db.Integer)  # in minutes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    course = db.relationship('Course', backref='quizzes')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True)
    
    def __repr__(self):
        return f'<Quiz {self.title}>'

class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    answers = db.Column(db.JSON)  # Store answers as JSON
    score = db.Column(db.Integer)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    student = db.relationship('User', backref='quiz_attempts')
    
    def __repr__(self):
        return f'<QuizAttempt {self.id}>'