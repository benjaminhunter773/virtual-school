from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

stress_bp = Blueprint('stress', __name__)

@stress_bp.route('/management')
@login_required
def management():
    return render_template('stress_management.html', user=current_user)