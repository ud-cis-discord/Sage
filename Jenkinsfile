pipeline {
    agent any
	stages {
		stage('build') {
			steps {
				sh 'export JENKINS_HOME=/home/jlyon/documents/SageV2/jenkinsSage'
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
				sh 'pm2 restart dist/src/sage.js -e /tmp/sage/sage-err'
			}
		}
	}
	
}