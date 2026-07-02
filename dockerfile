#Base image runetime
FROM python:3.13

#Set the directory inside the container
WORKDIR /app

#Copy the application files from the host to the container
COPY . /app

#Install the dependencies listed in Requeriments.txt
RUN pip install -r requirements.txt

#Define the command to run the Flask app when the container starts
CMD [ "python", "pythonDB_Connection.py" ]
