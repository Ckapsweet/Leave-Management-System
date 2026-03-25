pipeline {
    agent any

    environment {
        DEPLOY_PATH = '/var/www/html'
        CONFIG_FILE_ID = 'ckap-leave-env'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build') {
            steps {
                configFileProvider([configFile(fileId: "${CONFIG_FILE_ID}", targetLocation: '.env')]) {
                    sh '''
                    set -e
                    echo "Node version: $(node -v)"
                    echo "NPM version: $(npm -v)"

                    npm install
                    npm run build

                    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
                        echo "ERROR: dist/ is empty or missing! Build may have failed." >&2
                        exit 1
                    fi
                    echo "✅ dist/ verified — ready to deploy."
                    '''
                }
            }
        }

        stage('Deploy Static Files') {
            when { branch 'main' }
            steps {
                sh '''
                set -e

                if [ -z "${DEPLOY_PATH}" ]; then
                    echo "ERROR: DEPLOY_PATH is not set!" >&2
                    exit 1
                fi

                if [ -d "${DEPLOY_PATH}" ]; then
                    sudo rm -rf "${DEPLOY_PATH:?}/"*
                fi
                sudo cp -r dist/* "${DEPLOY_PATH}/"
                '''
            }
        }

        stage('Reload Nginx') {
            when { branch 'main' }
            steps {
                sh '''
                set -e
                sudo nginx -t
                sudo systemctl reload nginx
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