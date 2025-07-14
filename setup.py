#!/usr/bin/env python3
"""
Setup script for Virtual AI School
This script initializes the database and creates a default admin user.
"""

import os
import sys
from datetime import datetime

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, Course, Assignment, Grade, Enrollment, Notification

def create_default_users():
    """Create default users for testing"""
    print("Creating default users...")
    
    # Create admin user
    admin = User(
        username='admin',
        email='admin@virtualschool.com',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    admin.set_password('admin123')
    
    # Create teacher user
    teacher = User(
        username='teacher',
        email='teacher@virtualschool.com',
        first_name='Jane',
        last_name='Smith',
        role='teacher'
    )
    teacher.set_password('teacher123')
    
    # Create student user
    student = User(
        username='student',
        email='student@virtualschool.com',
        first_name='John',
        last_name='Doe',
        role='student'
    )
    student.set_password('student123')
    
    # Add users to database
    db.session.add(admin)
    db.session.add(teacher)
    db.session.add(student)
    db.session.commit()
    
    print("✓ Default users created:")
    print("  - Admin: admin / admin123")
    print("  - Teacher: teacher / teacher123")
    print("  - Student: student / student123")
    
    return admin, teacher, student

def create_sample_data(admin, teacher, student):
    """Create sample courses and assignments"""
    print("\nCreating sample data...")
    
    # Create sample courses
    course1 = Course(
        name='Introduction to Computer Science',
        code='CS101',
        description='Basic programming concepts and problem-solving techniques',
        teacher_id=teacher.id
    )
    
    course2 = Course(
        name='Web Development Fundamentals',
        code='WEB101',
        description='HTML, CSS, JavaScript, and basic web development',
        teacher_id=teacher.id
    )
    
    db.session.add(course1)
    db.session.add(course2)
    db.session.commit()
    
    # Enroll student in courses
    enrollment1 = Enrollment(user_id=student.id, course_id=course1.id)
    enrollment2 = Enrollment(user_id=student.id, course_id=course2.id)
    
    db.session.add(enrollment1)
    db.session.add(enrollment2)
    db.session.commit()
    
    # Create sample assignments
    assignment1 = Assignment(
        title='Hello World Program',
        description='Write a simple Hello World program in Python',
        course_id=course1.id,
        due_date=datetime(2024, 3, 15),
        max_points=100
    )
    
    assignment2 = Assignment(
        title='Basic HTML Page',
        description='Create a basic HTML page with CSS styling',
        course_id=course2.id,
        due_date=datetime(2024, 3, 20),
        max_points=100
    )
    
    db.session.add(assignment1)
    db.session.add(assignment2)
    db.session.commit()
    
    # Create sample grades
    grade1 = Grade(
        assignment_id=assignment1.id,
        student_id=student.id,
        points_earned=85,
        feedback='Great job! Code is clean and well-commented.',
        graded_by=teacher.id
    )
    
    db.session.add(grade1)
    db.session.commit()
    
    # Create sample notifications
    notification1 = Notification(
        user_id=student.id,
        title='Welcome to Virtual AI School!',
        message='Welcome to our virtual learning platform. Get started by exploring your courses.',
        type='info'
    )
    
    notification2 = Notification(
        user_id=student.id,
        title='New Assignment Posted',
        message='A new assignment has been posted in Web Development Fundamentals.',
        type='info'
    )
    
    db.session.add(notification1)
    db.session.add(notification2)
    db.session.commit()
    
    print("✓ Sample data created:")
    print("  - 2 courses created")
    print("  - Student enrolled in both courses")
    print("  - 2 assignments created")
    print("  - 1 grade recorded")
    print("  - 2 notifications created")

def main():
    """Main setup function"""
    print("🎓 Virtual AI School Setup")
    print("=" * 40)
    
    with app.app_context():
        # Create database tables
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created")
        
        # Check if admin user already exists
        existing_admin = User.query.filter_by(username='admin').first()
        if existing_admin:
            print("⚠️  Default users already exist. Skipping user creation.")
        else:
            admin, teacher, student = create_default_users()
            create_sample_data(admin, teacher, student)
        
        print("\n🚀 Setup complete!")
        print("\nYou can now start the application with:")
        print("python app.py")
        print("\nOr use the run script:")
        print("python run.py")
        print("\nAccess the application at: http://localhost:5000")

if __name__ == '__main__':
    main()