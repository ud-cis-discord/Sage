#!/bin/bash
DOC_DIR="ud-cis-discord.github.io"
SAGE_DIR="SageV2"
if [[ ! -d ../ud-cis-discord.github.io ]]
then
	echo "docs repo doesn't exist where expected, exiting"
	exit 1
fi

if [[ ! -f ./Commands.md ]] || [[ ! -f ./'Staff Commands.md' ]]
then
	echo "commands markdown files not created, exiting"
	exit 1
fi

cd ../$DOC_DIR
git pull
mv ../$SAGE_DIR/Commands.md ./pages/Commands.md
mv ../$SAGE_DIR/'Staff Commands.md' ./pages/'Staff Commands.md'
git commit -a -m 'jenkins pipeline automatic docs update'
git push
