pipeline {
    agent any
	environment {
        JENKINS_NODE_COOKIE='dontKillMe'
		PM2_HOME='/srv/pm2daemon'
    }
	stages {
		stage('build') {
			steps {
				sh 'export JENKINS_NODE_COOKIE=dontKillMe'
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
				script {
					if(env.BRANCH_NAME == 'jenkinsTest') {
						sh 'echo "rebuilding and deploying in prod directory..."'
						sh 'whoami'
						sh 'cd /home/jlyon/documents/SageV2/SageV2 && git pull && npm run clean && npm i && npm run build && pm2 restart'
					} else {
						echo 'build done, branch OK'
					}
				}
			}
		}
	}
}