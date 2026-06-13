from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_socketio import SocketIO
from config import Config
from models import db

socketio = SocketIO()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    socketio.init_app(
        app, 
        cors_allowed_origins="http://localhost:5173",
        logger=True,
        engineio_logger=True,
    )

    from routes.auth import auth_bp
    from routes.workspaces import workspaces_bp
    from routes.tasks import tasks_bp
    from routes.memberships import memberships_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(workspaces_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(memberships_bp)

    from sockets.events import register_events
    register_events(socketio)

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    socketio.run(app, debug=True)