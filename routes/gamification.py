from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user

gamification_bp = Blueprint('gamification', __name__)

@gamification_bp.route('/quiz')
@login_required
def quiz():
    return render_template('quiz.html', user=current_user)

@gamification_bp.route('/leaderboard')
@login_required
def leaderboard():
    return render_template('leaderboard.html', user=current_user)