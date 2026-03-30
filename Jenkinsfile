pipeline {
    agent { label 'leave-frontend' }

    environment {
        BASE_DIR   = '/home/adminis'
        DEPLOY_DIR = '/var/www/html'
        REPO_URL   = 'github.com/Ckapsweet/Leave-Management-System.git'
    }

    stages {
        stage('Clone Repository') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'github',
                        usernameVariable: 'githubUser',
                        passwordVariable: 'githubPwd'
                    )
                ]) {
                    sh '''
                    cd ${BASE_DIR}
                    pwd && ls -l
                    if [ -d "Leave-Management-System" ]; then
                        rm -rf Leave-Management-System
                    fi
                    git clone https://${githubUser}:${githubPwd}@${REPO_URL}
                    '''
                }
            }
        }

        stage('Install & Build') {
            steps {
                configFileProvider([configFile(fileId: 'ckap-leave-env', targetLocation: "${BASE_DIR}/Leave-Management-System/.env")]) {
                    sh '''
                    cd ${BASE_DIR}/Leave-Management-System
                    echo "Node version: $(node -v)"
                    echo "NPM version: $(npm -v)"
                    npm install
                    npm run build

                    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
                        echo "ERROR: dist/ is empty or missing!" >&2
                        exit 1
                    fi
                    echo "✅ Build verified — ready to deploy."
                    '''
                }
            }
        }

        stage('Deploy Static Files') {
            steps {
                sh '''
                sudo rm -rf ${DEPLOY_DIR}/*
                sudo cp -r ${BASE_DIR}/Leave-Management-System/* ${DEPLOY_DIR}/
                echo "✅ Files deployed to ${DEPLOY_DIR}"
                '''
            }
        }

        stage('Reload Nginx') {
            steps {
                sh '''
                sudo nginx -t
                sudo systemctl reload nginx
                echo "✅ Nginx reloaded"
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Deployment completed successfully! Build #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Deployment failed! Build #${BUILD_NUMBER}"
        }
    }
}