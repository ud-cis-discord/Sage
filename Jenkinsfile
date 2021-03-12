pipeline {
    agent any
	stages {
		stage('build') {
			steps {
				sh 'echo "running build in temp workspace"'
				configFileProvider([configFile(fileId: 'ef5f2732-c4ab-4214-a92f-0e5c144b3bdc', targetLocation: 'config.ts')]) {}
				sh 'npm run clean'
				sh 'npm i'
				sh 'npm run build'
			}
		}
		stage('test') {
			steps {
				sh 'echo "testing in temp workspace..."'
				sh 'npm run test'
			}
		}
		stage('deploy') {
			steps {
				ws(env.SAGE_DIR) {
					script {
						if(env.BRANCH_NAME == 'jenkinsTest') {
							echo "rebuilding and deploying in prod directory..."
							git pull
							npm run clean
							npm i 
							npm run build
							npm run restart
						} else {
							echo 'build done, branch OK'
						}
					}
				}
			}
		}
	}
}