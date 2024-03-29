def boolean stage_results = false

pipeline {
    agent any
	environment {
		DISCORD_WEBHOOK=credentials('3fbb794c-1c40-4471-9eee-d147d4506046')
		MAIN_BRANCH='main'
		SAGE_DIR='/usr/local/sage/SageV2'
        JENKINS_NODE_COOKIE='dontKillMe'
    }
	stages {
		stage('Test Build') {
			steps {
				catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
					sh 'find /tmp -user jenkins -print0 | xargs -0 rm -rf'
					sh 'echo "running build in temp workspace"'
					sh 'mv config.example.ts config.ts'
					sh 'npm run clean'
					sh 'npm cache clean --force'
					sh 'rm -rf node_modules'
					sh 'npm i'
					sh 'npm run build'
					script{ stage_results = true }
				}
				script { 
					discordSend(
						description: "Test build " + currentBuild.currentResult + " on branch [" + env.BRANCH_NAME + 
						"](https://github.com/ud-cis-discord/SageV2/commit/" + env.GIT_COMMIT + ")", 
						footer: env.BUILD_TAG,
						link: env.BUILD_URL, 
						result: currentBuild.currentResult, 
						title: JOB_NAME + " -- Test Build", 
						webhookURL: env.DISCORD_WEBHOOK
					)
					if (stage_results == false) {
						sh 'exit 1'
					}
					stage_results = false
				}
				
			}
		}
		stage('Lint') {
			steps {
				catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
					sh 'echo "testing in temp workspace..."'
					sh 'npm run test'
					script{ stage_results = true }
				}
				script { 
					discordSend(
						description: "Lint " + currentBuild.currentResult + " on branch [" + env.BRANCH_NAME + 
						"](https://github.com/ud-cis-discord/SageV2/commit/" + env.GIT_COMMIT + ")", 
						footer: env.BUILD_TAG,
						link: env.BUILD_URL, 
						result: currentBuild.currentResult, 
						title: JOB_NAME + " -- Lint", 
						webhookURL: env.DISCORD_WEBHOOK
					)
					if (stage_results == false) {
						sh 'exit 1'
					}
					stage_results = false
				}
			}
		}
		stage('Deploy') {
			steps {
				catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
					script {
						if(env.BRANCH_NAME == env.MAIN_BRANCH) {
							sh 'echo "rebuilding and deploying in prod directory..."'
							sh 'cd ' + env.SAGE_DIR + ' && git pull && npm run clean && npm i && npm run build && sudo /bin/systemctl restart sage'
						} else {
							echo 'build done, branch OK'
						}
						stage_results = true
					}
				}
				script { 
					def discord_desc = "Deploy " + currentBuild.currentResult + " on branch [" + env.BRANCH_NAME + "](https://github.com/ud-cis-discord/SageV2/commit/" + env.GIT_COMMIT + ")"
					if(stage_results == false && env.BRANCH_NAME == env.MAIN_BRANCH) {
						discord_desc = "URGENT!! -- " + discord_desc
					}
					if(env.BRANCH_NAME == env.MAIN_BRANCH) {
						discordSend(
							description: discord_desc, 
							footer: env.BUILD_TAG,
							link: env.BUILD_URL, 
							result: currentBuild.currentResult, 
							title: JOB_NAME + " -- Deploy", 
							webhookURL: env.DISCORD_WEBHOOK
						)}
					if (stage_results == false) {
						sh 'exit 1'
					}
				}
			}
		}
		stage('Update Docs') {
			steps {
				catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
					script {
						if(env.BRANCH_NAME == env.MAIN_BRANCH) {
							sh 'echo "automatically updating the documentation website"'
							sh 'cd ' + env.SAGE_DIR + ' && npm run autodoc'
						}
						stage_results = true
					}
				}
				script { 
					def discord_desc = "doc automation" + currentBuild.currentResult + " on branch [" + env.BRANCH_NAME + "](https://github.com/ud-cis-discord/SageV2/commit/" + env.GIT_COMMIT + ")"
					if(stage_results == false && env.BRANCH_NAME == env.MAIN_BRANCH) {
						discord_desc = "URGENT!! -- " + discord_desc
					}
					if(env.BRANCH_NAME == env.MAIN_BRANCH) {
						discordSend(
						description: discord_desc, 
						footer: env.BUILD_TAG,
						link: env.BUILD_URL, 
						result: currentBuild.currentResult, 
						title: JOB_NAME + " -- Documentation Update", 
						webhookURL: env.DISCORD_WEBHOOK
					)}
					if (stage_results == false) {
						sh 'exit 1'
					}
				}
			}
		}
	}
	post {
		always {
            discordSend(
				description: "Pipeline " + currentBuild.currentResult + " on branch [" + env.BRANCH_NAME + 
				"](https://github.com/ud-cis-discord/SageV2/commit/" + env.GIT_COMMIT + ")", 
				footer: env.BUILD_TAG,
				link: env.BUILD_URL, 
				result: currentBuild.currentResult, 
				title: JOB_NAME, 
				webhookURL: env.DISCORD_WEBHOOK
			)
        }
	}
}
