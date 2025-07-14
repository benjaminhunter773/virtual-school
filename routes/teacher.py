from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import db, User, Course, Assignment, Grade

teacher_bp = Blueprint('teacher', __name__)

@teacher_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'teacher':
        flash('Access denied. Teachers only.', 'error')
        return redirect(url_for('index'))
    
    courses = Course.query.filter_by(teacher_id=current_user.id, is_active=True).all()
    return render_template('teacher_dashboard.html', user=current_user, courses=courses)

@teacher_bp.route('/courses')
@login_required
def courses():
    if current_user.role != 'teacher':
        flash('Access denied. Teachers only.', 'error')
        return redirect(url_for('index'))
    
    courses = Course.query.filter_by(teacher_id=current_user.id, is_active=True).all()
    return render_template('teacher_courses.html', courses=courses)