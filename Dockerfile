FROM cern/cc7-base
ADD . /code
WORKDIR /code
RUN yum install -y gcc gcc-c++ graphviz-devel ImageMagick python-devel libffi-devel openssl openssl-devel unzip nano autoconf automake libtool
RUN curl https://bootstrap.pypa.io/get-pip.py | python -
RUN pip install https://github.com/lukasheinrich/adage/archive/master.zip 
RUN pip install https://github.com/lukasheinrich/packtivity/archive/master.zip 
RUN pip install https://github.com/lukasheinrich/yadage/archive/master.zip 
RUN pip install flask celery redis Flask-AutoIndex
RUN curl https://get.docker.com/builds/Linux/x86_64/docker-1.9.1  -o /usr/bin/docker && chmod +x /usr/bin/docker

