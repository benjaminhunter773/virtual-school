from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import db, User, Course, Assignment, Grade

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'admin':
        flash('Access denied. Administrators only.', 'error')
        return redirect(url_for('index'))
    
    total_users = User.query.count()
    total_courses = Course.query.count()
    return render_template('admin_dashboard.html', user=current_user, 
                         total_users=total_users, total_courses=total_courses)