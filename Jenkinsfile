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
				configFileProvider([configFile(fileId: '4753db6f-0fa5-4575-b85e-a61a62bbfc81', targetLocation: 'config.ts')]) {}
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
						sh 'cd /home/pi/SageV2 && git pull && npm run clean && npm i && npm run build && systemctl restart sage'
					} else {
						echo 'build done, branch OK'
					}
				}
			}
		}
	}
}
