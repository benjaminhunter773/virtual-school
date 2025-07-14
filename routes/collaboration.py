from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

collaboration_bp = Blueprint('collaboration', __name__)

@collaboration_bp.route('/workspace')
@login_required
def workspace():
    return render_template('collaboration.html', user=current_user)