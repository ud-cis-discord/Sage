#!/bin/bash
DOC_DIR="ud-cis-discord.github.io/pages"
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

mv ./Commands.md ../$DOC_DIR/pages/Commands.md
mv ./'Staff Commands.md' ../$DOC_DIR/'Staff Commands.md'
cd ../$DOC_DIR
git commit -a -m 'jenkins pipeline automatic docs update'
git push
