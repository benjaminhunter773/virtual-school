from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
import config

app = Flask(__name__)
app.config.from_object(config.Config)

# Initialize extensions
from models import db, User, Course, Assignment, Grade
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

# Import routes
from routes.auth import auth_bp
from routes.student import student_bp
from routes.teacher import teacher_bp
from routes.admin import admin_bp
from routes.principal import principal_bp
from routes.diagrams import diagrams_bp
from routes.stress import stress_bp
from routes.gamification import gamification_bp
from routes.multilingual import multilingual_bp
from routes.collaboration import collaboration_bp
from routes.schedules import schedules_bp
from routes.notifications import notifications_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(student_bp, url_prefix='/student')
app.register_blueprint(teacher_bp, url_prefix='/teacher')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(principal_bp, url_prefix='/principal')
app.register_blueprint(diagrams_bp, url_prefix='/diagrams')
app.register_blueprint(stress_bp, url_prefix='/stress')
app.register_blueprint(gamification_bp, url_prefix='/games')
app.register_blueprint(multilingual_bp, url_prefix='/lang')
app.register_blueprint(collaboration_bp, url_prefix='/collaborate')
app.register_blueprint(schedules_bp, url_prefix='/schedule')
app.register_blueprint(notifications_bp, url_prefix='/notifications')

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.role == 'student':
            return redirect(url_for('student.dashboard'))
        elif current_user.role == 'teacher':
            return redirect(url_for('teacher.dashboard'))
        elif current_user.role == 'admin':
            return redirect(url_for('admin.dashboard'))
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'student':
        return redirect(url_for('student.dashboard'))
    elif current_user.role == 'teacher':
        return redirect(url_for('teacher.dashboard'))
    elif current_user.role == 'admin':
        return redirect(url_for('admin.dashboard'))
    return redirect(url_for('index'))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)