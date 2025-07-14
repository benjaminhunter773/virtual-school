from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

multilingual_bp = Blueprint('multilingual', __name__)

@multilingual_bp.route('/switch')
@login_required
def switch():
    return render_template('multilingual.html', user=current_user)