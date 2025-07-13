from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

diagrams_bp = Blueprint('diagrams', __name__)

@diagrams_bp.route('/view')
@login_required
def view():
    return render_template('diagram_view.html', user=current_user)