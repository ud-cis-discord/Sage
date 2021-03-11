pipeline {
    agent any
    stages {
        stage('build') {
            steps {
				sh 'npm run clean'
                sh 'npm i'
				sh 'npm run build'
            }
        }
		stage('test') {
			steps {
				sh 'npm run test'
			}
		}
		stage('deploy') {
			steps {
				sh 'pm2 restart sage'
			}
		}
    }
}