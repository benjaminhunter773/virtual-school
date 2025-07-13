from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import db, User, Course, Assignment, Grade, Enrollment

student_bp = Blueprint('student', __name__)

@student_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'student':
        flash('Access denied. Students only.', 'error')
        return redirect(url_for('index'))
    
    # Get student's enrolled courses
    enrollments = Enrollment.query.filter_by(user_id=current_user.id, is_active=True).all()
    courses = [enrollment.course for enrollment in enrollments]
    
    # Get recent assignments
    assignments = Assignment.query.join(Course).join(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.is_active == True
    ).order_by(Assignment.due_date.desc()).limit(5).all()
    
    # Get recent grades
    grades = Grade.query.filter_by(student_id=current_user.id).order_by(Grade.graded_at.desc()).limit(5).all()
    
    return render_template('dashboard.html', 
                         user=current_user, 
                         courses=courses, 
                         assignments=assignments, 
                         grades=grades)

@student_bp.route('/courses')
@login_required
def courses():
    if current_user.role != 'student':
        flash('Access denied. Students only.', 'error')
        return redirect(url_for('index'))
    
    enrollments = Enrollment.query.filter_by(user_id=current_user.id, is_active=True).all()
    courses = [enrollment.course for enrollment in enrollments]
    
    return render_template('student_courses.html', courses=courses)

@student_bp.route('/assignments')
@login_required
def assignments():
    if current_user.role != 'student':
        flash('Access denied. Students only.', 'error')
        return redirect(url_for('index'))
    
    assignments = Assignment.query.join(Course).join(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.is_active == True
    ).order_by(Assignment.due_date).all()
    
    return render_template('student_assignments.html', assignments=assignments)

@student_bp.route('/grades')
@login_required
def grades():
    if current_user.role != 'student':
        flash('Access denied. Students only.', 'error')
        return redirect(url_for('index'))
    
    grades = Grade.query.filter_by(student_id=current_user.id).order_by(Grade.graded_at.desc()).all()
    
    return render_template('student_grades.html', grades=grades)