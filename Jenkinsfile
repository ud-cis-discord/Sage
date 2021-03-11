pipeline {
    agent any
    stages {
        stage('build') {
            steps {
				sh 'cd /home/jlyon/documents/SageV2/SageV2'
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
				sh 'git pull'
			}
		}
    }
}