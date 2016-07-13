FROM python:2.7
ADD . /code
WORKDIR /code
RUN pip install https://github.com/lukasheinrich/adage/archive/master.zip 
RUN pip install https://github.com/lukasheinrich/yadage/archive/master.zip 
RUN pip install flask celery redis
RUN curl https://get.docker.com/builds/Linux/x86_64/docker-1.9.1  -o /usr/bin/docker && chmod +x /usr/bin/docker

