# Contributing to Sage
## Contents
1. [Technologies](#tech)
2. [Creating a new Discord Application](#new-app)
3. [Setting up your config file](#config)
4. [Running Sage for the first time](#first-time)

## Technologies <a name="tech"></a>
There are a couple of technologies that you should be aware of before contributing to Sage. They are listed below alongside setup information, if applicable. 
- ### [NodeJS](https://nodejs.org/en/)
	We use npm as our package manager and Node as our runtime for Sage. You'll need to setup Node on your system. We recommend using [NVM](https://github.com/nvm-sh/nvm) to do this, which you can install with the script on the linked github repo. 
- ### [Typescript](https://www.typescriptlang.org/)
	Typescript is the language of choice for Sage. You shouldn't have to do anything to set up typescript as it is a dependency of the project. After running `npm i` during your first time [running Sage](#first-time), everything should be taken care of.

- ### [ESLint](https://eslint.org/)
	ESLint is the linter we use for formatting Sage's code. It keeps everything consistent across all of Sage's developers. You don't necessarily need to install anything to set it up as it is also a dependency of the project, but if you're using [VSCode](https://code.visualstudio.com/) as your editor we highly recommend the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to catch linting errors before your PR gets rejected.
- ### [MongoDB](https://www.mongodb.com/atlas)
	MongoDB is the database that we use to store user and course information alongside many other things. You can set up a free database by following the steps [here](https://www.mongodb.com/docs/atlas/getting-started/).

## Creating a new Discord application <a name="new-app"></a>
## Setting up your config file <a name="config"></a>
## Running Sage for the first time <a name="first-time"></a>