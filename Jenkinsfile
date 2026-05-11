pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        FRONTEND_IMAGE = "erfanasir/school-attendance-frontend"
        BACKEND_IMAGE = "erfanasir/school-attendance-backend"
    }

    stages {

        stage('Checkout') {
            steps {
                git 'https://github.com/NasirMohammad/school-attendance.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t $BACKEND_IMAGE:v4 .'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $FRONTEND_IMAGE:v4 .'
                }
            }
        }

        stage('Docker Login') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }

        stage('Push Images') {
            steps {
                sh 'docker push $BACKEND_IMAGE:v4'
                sh 'docker push $FRONTEND_IMAGE:v4'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                kubectl set image deployment/attendance-backend backend=$BACKEND_IMAGE:v4 -n attendance
                kubectl set image deployment/attendance-frontend frontend=$FRONTEND_IMAGE:v4 -n attendance
                '''
            }
        }
    }
}