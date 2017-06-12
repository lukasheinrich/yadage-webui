#!venv/bin/python

"""Yadage Workflow UI - Web Server

Flask Web Server that combines the template server, engine server, and a simple
server for static files. Primarily needed for testing to avoid having to deal
with CORS issues.
"""

from flask import Flask, send_from_directory
from flask_cors import CORS

from yadagetemplates.server import template_app as templates
from yadageengine.server import engine_app as engine

# ------------------------------------------------------------------------------
# Initialize the Web app
# ------------------------------------------------------------------------------

config = {
    'server.port' : 25010,
    'app.debug' : True,
    'app.static_dir' : '../static'
}

# Create the app and enable cross-origin resource sharing
app = Flask(__name__)
app.config['PORT'] = config['server.port']
app.config['DEBUG'] = config['app.debug']
#CORS(app)

STATIC_DIR = config['app.static_dir']

@app.route('/yadage/<path:path>')
def send_static_file(path):
    return send_from_directory(STATIC_DIR, path)


# ------------------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------------------

if __name__ == '__main__':
    # Relevant documents:
    # http://werkzeug.pocoo.org/docs/middlewares/
    # http://flask.pocoo.org/docs/patterns/appdispatch/
    from werkzeug.serving import run_simple
    from werkzeug.wsgi import DispatcherMiddleware
    # Switch logging on if not in debug mode
    if app.debug is not True:
        import logging
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            os.path.join(LOG_DIR, 'yadage-engine.log'),
            maxBytes=1024 * 1024 * 100,
            backupCount=20
        )
        file_handler.setLevel(logging.ERROR)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
    # Load a dummy app at the root URL to give 404 errors.
    # Serve app at APPLICATION_ROOT for localhost development.
    application = DispatcherMiddleware(app, {
        '/yadage-engine/api/v1' : engine,
        '/workflow-repository/api/v1' : templates
    })
    run_simple('0.0.0.0', app.config['PORT'], application, use_reloader=app.config['DEBUG'])
