#!/bin/bash

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

mv ./Commands.md ../ud-cis-discord.github.io/pages/Commands.md
mv ./'Staff Commands.md' ../ud-cis-discord.github.io/pages/'Staff Commands.md'
