# Yadage Web API and User-Interface

This repository contains the Web API for Yadage and a basic Web User-Interface (UI).
The Web API is a Flask application that orchestrates the execution of workflows.
The UI accesses the Web API to provide a graphical interface to re-run
workflows, apply and submit task, inspect worlflow state and outputs, and
delete workflows.

The **source code** for the Web API is located at:

```
src/main/py
```

The **code** for the UI and the **documentation** of the API is located at:

```
static
```


## Setup

The Web API uses Flask and is intended to run in a Python virtual environment.
Set up the environment using the following commands:

```
cd src/main/py
virtualenv venv
source venv/bin/activate
pip install adage
pip install cap-schemas
pip install packtivity
pip install yadage
pip install flask
pip install -U flask-cors
pip install pymongo
pip install -U celery[redis]
deactivate
```


## Run

### Prerequisites

#### Backend
Different backends have different requirements. For the current backend Redis Server
and Celery need to be running:

```
redis-server
celery worker -A yadage.backends.celeryapp -I yadage.backends.packtivity_celery -l debug
```

#### MongoDB
The Web API requires a connection to MongoDB. The current implementation expects
MongoDB to be running at localhost without any authentication. It uses a database
called yadage. To use a different server or database make changes in `MongoDBFactory.get_database()`
in module `server/repository.py`.

#### Web Server
To run the Web UI a Web Server for static HTML files is required, e.g,
[Apache2](https://help.ubuntu.com/lts/serverguide/httpd.html) or
[XAMPP](https://www.apachefriends.org/index.html).

#### Workflow Template Repository Server

The Web UI requires access to a workflow template repository server.  The server can be
run locally (follow instructions in [GitHub repository](https://github.com/heikomuller/yadage-workflow-repository))
or the default server at http://cds-swg1.cims.nyu.edu/workflow-repository/api/v1/ can be used.


### Web API Server

After the virtual environment is set up, the Web API can be run using the following
command:

```
cd src/main/py
./web-api.py [-a | --path <app-path>] [-d | --data-dir <base-directory>] [-p | --port <port-number>] [-s | --server <server-url>]

app-path: Path on the server under which the app is accessible (Default: /yadage/api/v1/yadage/api/v1)
base-directory: Base directory where workflow inputs and outputs are stored (Default: ../../../../backend/data/)
port-number: Port at which the app is running (Default: 5005)
server-url: URL of the server running the app (Default: http://localhost)
```

When running the Web API with the default command line parameters the application will
be available on the local host at URL http://localhost:5006/yadage/api/v1/.
The URL is important when running the Web UI.

### Backend Handler

In the current implementation a separate process is required to execute tasks
submitted through the Web UI. This process, called backend handler, needs to be
running. It continuously polls the MongoDB database for tasks to be sumbitted.
Start the backend handler using the following commands:

```
cd src/main/py
./backend_handler.py
```

## Web UI

Copy files in `static` to a directory in the base directory used by the web server to
serve static files , e.g., `/var/www/html/yadage`. The Web UI should then be accessible
at URL http://localhost/yadage.

After copying the files make sure to adjust the URL's referencing the Web API and the
workflow template repository server. Edit file `static/js/yadage/app-config.js` such
that `API_BASE_URL` refers to the URL where the Web API is running (e.g., http://localhost:5006/yadage/api/v1/)
and, if using a different template repository, set `TEMPLATE_SERVER_URL` to point to
the base URL of the respective server.
