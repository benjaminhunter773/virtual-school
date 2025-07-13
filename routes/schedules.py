from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

schedules_bp = Blueprint('schedules', __name__)

@schedules_bp.route('/view')
@login_required
def view():
    return render_template('schedule_view.html', user=current_user)