pipeline {
    agent any
	stages {
		stage('build') {
			steps {
				sh 'export JENKINS_NODE_COOKIE=dontKillMe'
				ws('/home/jlyon/documents/SageV2/SageV2'){
					sh 'npm run clean'
					sh 'npm i'
					sh 'npm run build'
				}
			}
		}
		stage('test') {
			steps {
				ws('/home/jlyon/documents/SageV2/SageV2'){
					sh 'npm run test'
				}
			}
		}
		stage('deploy') {
			steps {
				ws('/home/jlyon/documents/SageV2/SageV2'){
					sh 'pm2 restart dist/src/sage.js -e /tmp/sage/sage-err'
				}
			}
		}
	}
	
}