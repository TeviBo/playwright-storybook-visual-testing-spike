pipeline {
	agent any
    
    environment {
		// Visual testing configuration for MinIO (using your existing minio-creds)
        STORAGE_PROVIDER = 'minio'
        STORAGE_BUCKET = 'storybook-visual-tests-screenshots'
        STORAGE_ENDPOINT = 'localhost' // Update this to your MinIO server IP if different
        STORAGE_PORT = '9001'
        STORAGE_USE_SSL = 'false'

        // Alternative S3 setup (if you switch to S3 later)
        // STORAGE_PROVIDER = 's3'
        // STORAGE_BUCKET = credentials('S3_BUCKET')
        // STORAGE_ACCESS_KEY = credentials('AWS_ACCESS_KEY_ID')
        // STORAGE_SECRET_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        // AWS_REGION = 'us-east-1'

        // Test configuration
        VISUAL_THRESHOLD = '0.2'
        MAX_DIFF_PIXELS = '100'
        CI = 'true'
        NODE_ENV = 'test'

        // Storybook configuration
        STORYBOOK_URL = 'http://localhost:6006'
    }

    options {
		// Keep builds for 30 days
        buildDiscarder(logRotator(daysToKeepStr: '30', numToKeepStr: '50'))

        // Timeout after 30 minutes
        timeout(time: 30, unit: 'MINUTES')

        // Disable concurrent builds
        disableConcurrentBuilds()
    }
    
    stages {
		stage('Checkout') {
			steps {
				echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
			steps {
				echo 'Installing dependencies...'
                // Use Docker for consistent environment
                script {
					if (isUnix()) {
						sh '''
                            docker build -t visual-testing-app .
                        '''
                    } else {
						bat '''
                            docker build -t visual-testing-app .
                        '''
                    }
                }
            }
        }
        
        stage('Run Visual Tests') {
			steps {
				echo 'Running visual tests in Docker...'
                // Use your existing minio-creds credential
                withCredentials([usernamePassword(credentialsId: 'minio-creds', usernameVariable: 'MINIO_USER', passwordVariable: 'MINIO_PASS')]) {
					script {
						if (isUnix()) {
							sh '''
                                # Set MinIO credentials
                                export STORAGE_ACCESS_KEY=${MINIO_USER}
                                export STORAGE_SECRET_KEY=${MINIO_PASS}

                                # Run tests with Docker Compose
                                docker-compose --profile testing up --build --abort-on-container-exit
                            '''
                        } else {
							bat '''
                                rem Set MinIO credentials
                                set STORAGE_ACCESS_KEY=%MINIO_USER%
                                set STORAGE_SECRET_KEY=%MINIO_PASS%

                                rem Run tests with Docker Compose
                                docker-compose --profile testing up --build --abort-on-container-exit
                            '''
                        }
                    }
                }
            }
            post {
				always {
					// Copy results from containers
                    script {
						if (isUnix()) {
							sh '''
                                # Copy test results from containers
                                docker-compose cp visual-tests:/app/tests/reports ./tests/reports || true
                                docker-compose cp visual-tests:/app/tests/logs ./tests/logs || true
                                docker-compose cp visual-tests:/app/test-results ./test-results || true
                            '''
                        } else {
							bat '''
                                rem Copy test results from containers
                                docker-compose cp visual-tests:/app/tests/reports ./tests/reports
                                docker-compose cp visual-tests:/app/tests/logs ./tests/logs
                                docker-compose cp visual-tests:/app/test-results ./test-results
                            '''
                        }
                    }

                    // Archive test results
                    archiveArtifacts artifacts: 'tests/reports/**/*', fingerprint: true, allowEmptyArchive: true
                    archiveArtifacts artifacts: 'tests/logs/**/*', fingerprint: true, allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*', fingerprint: true, allowEmptyArchive: true
                }
            }
        }
        
        stage('Visual Tests') {
			parallel {
				stage('Chromium Visual Tests') {
					steps {
						echo 'Running visual tests on Chromium...'
                        sh '''
                            npx playwright test --project=chromium \
                                --reporter=line,allure-playwright,html \
                                tests/visual/visual-testing.spec.ts
                        '''
                    }
                }
                stage('Firefox Visual Tests') {
					steps {
						echo 'Running visual tests on Firefox...'
                        sh '''
                            npx playwright test --project=firefox \
                                --reporter=line,allure-playwright,html \
                                tests/visual/visual-testing.spec.ts
                        '''
                    }
                }
                stage('WebKit Visual Tests') {
					steps {
						echo 'Running visual tests on WebKit...'
                        sh '''
                            npx playwright test --project=webkit \
                                --reporter=line,allure-playwright,html \
                                tests/visual/visual-testing.spec.ts
                        '''
                    }
                }
            }
            post {
				always {
					// Archive test results
                    archiveArtifacts artifacts: 'tests/reports/**/*', fingerprint: true, allowEmptyArchive: true
                    archiveArtifacts artifacts: 'tests/logs/**/*', fingerprint: true, allowEmptyArchive: true
                    
                    // Archive any failure screenshots/diffs
                    archiveArtifacts artifacts: 'test-results/**/*', fingerprint: true, allowEmptyArchive: true
                }
            }
        }
        
        stage('Generate Reports') {
			steps {
				echo 'Generating test reports...'
                sh '''
                    # Generate Allure report
                    if [ -d "tests/reports/allure-results" ] && [ "$(ls -A tests/reports/allure-results)" ]; then
                        npx allure generate tests/reports/allure-results \
                            --output tests/reports/allure-report --clean
                    fi
                '''
            }
            post {
				always {
					// Publish HTML reports
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'tests/reports/playwright-html',
                        reportFiles: 'index.html',
                        reportName: 'Playwright HTML Report'
                    ])
                    
                    // Publish Allure report
                    script {
						if (fileExists('tests/reports/allure-report/index.html')) {
							publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'tests/reports/allure-report',
                                reportFiles: 'index.html',
                                reportName: 'Allure Visual Testing Report'
                            ])
                        }
                    }
                }
            }
        }
    }
    
    post {
		always {
			echo 'Cleaning up...'
            sh '''
                # Kill any remaining processes
                pkill -f "http-server" || true
                pkill -f "storybook" || true
                
                # Clean up test artifacts if needed
                # rm -rf test-results || true
            '''
        }
        
        success {
			echo 'Visual testing pipeline completed successfully!'
            
            // Send success notifications if configured
            script {
				if (env.SLACK_WEBHOOK) {
					slackSend(
                        channel: '#visual-testing',
                        color: 'good',
                        message: "✅ Visual tests passed for ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
                    )
                }
            }
        }
        
        failure {
			echo 'Visual testing pipeline failed!'
            
            // Send failure notifications
            script {
				if (env.SLACK_WEBHOOK) {
					slackSend(
                        channel: '#visual-testing',
                        color: 'danger',
                        message: "❌ Visual tests failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER}\nCheck the reports: ${env.BUILD_URL}"
                    )
                }
            }
        }
        
        unstable {
			echo 'Visual testing pipeline is unstable (some tests failed)'
            
            script {
				if (env.SLACK_WEBHOOK) {
					slackSend(
                        channel: '#visual-testing',
                        color: 'warning',
                        message: "⚠️ Visual tests unstable for ${env.JOB_NAME} - ${env.BUILD_NUMBER}\nSome tests failed, check reports: ${env.BUILD_URL}"
                    )
                }
            }
        }
    }
}