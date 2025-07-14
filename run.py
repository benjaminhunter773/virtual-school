#!/usr/bin/env python3
"""
Run script for Virtual AI School
This script starts the Flask application with proper configuration.
"""

import os
from app import app

if __name__ == '__main__':
    # Set environment variables
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('FLASK_DEBUG', '1')
    
    print("🎓 Starting Virtual AI School...")
    print("=" * 40)
    print("Application will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print("=" * 40)
    
    # Run the application
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )