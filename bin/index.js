#! /usr/bin/env node

const { program } = require('commander')
const download = require('download-git-repo')
const handlebars = require('handlebars')
const inquirer = require('inquirer')
const ora = require('ora')
const logSymbols = require('log-symbols')
const fs = require('fs')
const chalk = require('chalk')


// templete list
const templates = {
    basic: {
        url: "https://github.com/vihasshah/react-native-template.git",
        downloadUrl: "https://github.com:vihasshah/react-native-template#master",
        description: "Basic React Native Project"
    }
}

program.version('0.0.1')

program
    .command('init <template> <project>')
    .description('Initializing project templete')
    .action((templateName, projectName) => {
        const { downloadUrl } = templates[templateName]
        const spinner = ora('Downloading template...').start()
        download(downloadUrl, projectName, { clone: true }, (err) => {
            if (err) {
                spinner.fail()
                console.log(logSymbols.error, chalk.red(err))
                return
            } else {
                spinner.succeed()
                // ask options to user
                inquirer.prompt([
                    {
                        type: 'inpute',
                        name: 'name',
                        message: 'Please enter the project name'
                    },
                    {
                        type: 'inpute',
                        name: 'description',
                        message: 'Please enter a project description'
                    },
                    {
                        type: 'inpute',
                        name: 'author',
                        message: "Please enter the author's name"
                    }
                ]).then((answers) => {
                    const packagePath = `${projectName}/package.json`
                    const packageContent = fs.readFileSync(packagePath, 'utf8')
                    const packageResult = handlebars.compile(packageContent)(answers);
                    fs.writeFileSync(packagePath, packageResult)
                    console.log(chalk.green('Success to initialize template'))
                })
            }
        })
    })

program
    .command('list')
    .description('View list of available templates')
    .action(() => {
        console.log("basic - React Native basic templete")
    })

program.parse(process.argv)
