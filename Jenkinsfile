pipeline {
    agent any
    //  agent any
    //   agent any
    //    agent any
    //     agent any

    environment {
        DEPLOY_PATH = '/var/www/html'
        // กำหนด ID ให้ตรงกับที่ตั้งในหน้า "Managed files" ของ Jenkins
        CONFIG_FILE_ID = 'ckap-leave-env'
        // subdirectory ที่เก็บโค้ดจริงภายใน repo
        APP_DIR = 'ckap-leave-management-system'
    }

    stages {
        stage('Checkout') {
            steps {
                // ดึงโค้ดจาก SCM (GitHub) อัตโนมัติ
                checkout scm
            }
        }

        stage('Install & Build') {
            steps {
                dir("${APP_DIR}") {
                    // ใช้ Config File Provider เพื่อดึงไฟล์ .env มาวางใน subdirectory
                    // .env ใช้สำหรับ build เท่านั้น (npm run build)
                    configFileProvider([configFile(fileId: "${CONFIG_FILE_ID}", targetLocation: '.env')]) {
                        sh '''
                        set -e
                        npm install
                        npm run build
                        '''
                    }
                }
            }
        }

        stage('Verify Build') {
            steps {
                dir("${APP_DIR}") {
                    sh '''
                    set -e
                    # ตรวจสอบว่า dist/ มีอยู่และไม่ว่างเปล่าก่อน deploy
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
                dir("${APP_DIR}") {
                    sh '''
                    set -e

                    # Guard: ป้องกัน rm -rf ถ้า DEPLOY_PATH ว่างหรือไม่ได้ตั้งค่า
                    if [ -z "${DEPLOY_PATH}" ]; then
                        echo "ERROR: DEPLOY_PATH is not set!" >&2
                        exit 1
                    fi

                    # เคลียร์ไฟล์เก่าและก๊อปปี้ไฟล์ใหม่ (dist) ไปที่โฟลเดอร์ Web Server
                    if [ -d "${DEPLOY_PATH}" ]; then
                        sudo rm -rf "${DEPLOY_PATH:?}/"*
                    fi
                    sudo cp -r dist/* "${DEPLOY_PATH}/"
                    '''
                }
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
            // ล้าง workspace หลังจาก build เสร็จเพื่อป้องกัน disk เต็ม
            cleanWs()
        }
        success {
            echo "✅ Deployment completed successfully! Build #${BUILD_NUMBER}"
            // TODO: เพิ่ม notification เช่น Slack, LINE Notify, Teams
            // slackSend(color: 'good', message: "✅ Build #${BUILD_NUMBER} succeeded on ${JOB_NAME}")
        }
        failure {
            echo "❌ Deployment failed! Build #${BUILD_NUMBER}"
            // TODO: เพิ่ม notification เช่น Slack, LINE Notify, Teams
            // slackSend(color: 'danger', message: "❌ Build #${BUILD_NUMBER} failed on ${JOB_NAME}")
        }
    }
}