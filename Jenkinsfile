pipeline {
    agent any
	stages {
		stage('build') {
			steps {
				configFileProvider([configFile(fileId: 'ef5f2732-c4ab-4214-a92f-0e5c144b3bdc', targetLocation: 'config.ts')]) {}
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
				ws('/home/jlyon/documents/SageV2/SageV2'){
					sh 'git pull'
					sh 'npm run clean'
					sh 'npm i' 
					sh 'npm run build'
					sh 'npm run restart'
				}
			}
		}
	}
}