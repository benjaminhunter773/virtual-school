from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import db, User, Course, Assignment, Grade

principal_bp = Blueprint('principal', __name__)

@principal_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('principal_dashboard.html', user=current_user)

@principal_bp.route('/insights')
@login_required
def insights():
    return render_template('principal_insights.html', user=current_user)