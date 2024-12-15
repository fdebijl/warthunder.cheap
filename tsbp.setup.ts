import fs from 'fs';
import Path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { spawn } from 'child_process';
import sortPackageJson from 'sort-package-json';
import { ReplaceInFileConfig, replaceInFile } from 'replace-in-file';

enum ProjectType {
  'Server' = 'Server',
  'Cronjob' = 'Cronjob'
}

export const milliseconds = (s: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, s));

const deleteFolderRecursive = (path: string): void => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = Path.join(path, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const assertDirectory = async (path: string): Promise<void> => {
  return new Promise((resolve) => {
    fs.stat(Path.resolve(path), (err) => {
      if (err) {
        fs.mkdirSync(Path.resolve(path), {
          recursive: true
        });

        setTimeout(() => {
          resolve();
        }, 500);
      } else {
        resolve();
      }
    })
  });
}

const applyProjectName = async (projectname: string, projecttype: ProjectType): Promise<void> => {
  switch (projecttype) {
    case ProjectType.Server: {
      const replaceOptions: ReplaceInFileConfig = {
        files: ['Dockerfile'],
        from: /%%PROJECTNAME%%/g,
        to: projectname
      }

      await replaceInFile(replaceOptions);
      break;
    }
    case ProjectType.Cronjob: {
      const replaceOptions: ReplaceInFileConfig = {
        files: ['Dockerfile', 'PROJECTNAME-cron'],
        from: /%%PROJECTNAME%%/g,
        to: projectname
      }

      await replaceInFile(replaceOptions);

      fs.renameSync('PROJECTNAME-cron', `${projectname}-cron`);
      break;
    }
  }

  return milliseconds(500);
};

const applyNodeVersion = async (nodeVersion: number): Promise<void> => {
  const replaceOptions: ReplaceInFileConfig = {
    files: ['boilerplate/checks.yml', 'boilerplate/release-nosentry.yml', 'boilerplate/release-sentry.yml', 'boilerplate/acron.dockerfile', 'boilerplate/aserver.dockerfile'],
    from: /__NODEVERSION__/g,
    to: `${nodeVersion}`
  };

  await replaceInFile(replaceOptions);
}

const selectProjectType = async (projecttype: ProjectType): Promise<void> => {
  switch (projecttype) {
    case ProjectType.Server: {
      fs.copyFileSync('boilerplate/aserver.dockerfile', 'Dockerfile');
      break;
    }
    case ProjectType.Cronjob: {
      fs.copyFileSync('boilerplate/acron.dockerfile', 'Dockerfile');
      fs.copyFileSync('boilerplate/PROJECTNAME-cron', 'PROJECTNAME-cron');
      break;
    }
  }

  return milliseconds(500);
};

const setupPackageJson = async (projectname: string, needsJasmine: boolean, needsCodecov: boolean, needsSemanticrelease: boolean, nodeVersion: number): Promise<void> => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.name = projectname;
  delete packageJson.scripts.presetup;
  delete packageJson.scripts.setup;

  if (needsJasmine) {
    packageJson.scripts['test'] = 'jasmine-ts --config=jasmine.config.json';
  }

  if (needsCodecov) {
    // eslint-disable-next-line no-useless-escape
    packageJson.scripts['test:coverage'] = 'nyc -e .ts -x \"*.spec.ts\" -x \"dist/**\" -x \"test/**\" --reporter=json jasmine-ts --config=jasmine.config.json --random=false'
  }

  if (needsSemanticrelease) {
    delete packageJson.private;
    packageJson.version = '1.0.0';
    packageJson.description = 'Placeholder description';
    packageJson.main = 'dist/index.js';
    packageJson.files = [ 'dist/**/*' ];
    packageJson.publishConfig = {
      access: 'public',
      registry: 'https://registry.npmjs.org/'
    };
    packageJson.scripts.prepare = 'npm run compile';
  }

  packageJson.engines = {
    node: `~ ${nodeVersion}`,
    npm: '>= 6'
  }

  const sortedJson = sortPackageJson(JSON.stringify(packageJson, null, 2));
  fs.writeFileSync('package.json', sortedJson);
  return;
};

const setupJasmine = async (): Promise<void> => {
  return new Promise(async (resolve) => {
    console.log(chalk.blue('Installing Jasmine...'));

    fs.copyFileSync('boilerplate/jasmine.config.json', 'jasmine.config.json');
    await assertDirectory('test');
    fs.copyFileSync('boilerplate/index.spec.ts', Path.resolve('test/index.spec.ts'));

    // Add linting for Jasmine, courtesy of https://github.com/tlvince/eslint-plugin-jasmine
    const eslintrc = JSON.parse(fs.readFileSync('.eslintrc.json', 'utf8'));
    eslintrc.plugins = ['jasmine'];
    eslintrc.env.jasmine = true;
    eslintrc.extends.push('plugin:jasmine/recommended');
    fs.writeFileSync('.eslintrc.json', JSON.stringify(eslintrc, null, 2));

    // Exclude the test folder from typescript compilation
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    tsconfig.compilerOptions.types = ['jasmine'];
    tsconfig.exclude = ['test/**/*.ts'];
    fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));

    // Install Jasmine dependencies with pinned versions (-E, aka --save-exact)
    const child = spawn('npm', ['install', '-D', '-E', 'jasmine', 'jasmine-spec-reporter', 'jasmine-ts', '@types/jasmine', 'eslint-plugin-jasmine'], {cwd: __dirname, shell: true});

    child.stderr.on('data', (data) => {
      // Uncomment the next line to pipe installation errors to the wizard screen
      // process.stdout.write(data);
    });

    child.on('exit', () => {
      console.log(chalk.green('Done :)'))
      resolve();
    });
  });
};

const setupCodecov = async (): Promise<void> => {
  return new Promise(async (resolve) => {
    console.log(chalk.blue('Installing Codecov...'))

    await assertDirectory('.github/workflows');

    // Install Codecov dependencies with pinned versions (-E, aka --save-exact)
    const child = spawn('npm', ['install', '-D', '-E', 'nyc'], {cwd: __dirname, shell: true});

    child.stderr.on('data', (data) => {
      // Uncomment the next line to pipe installation errors to the wizard screen
      // process.stdout.write(data);
    });

    child.on('exit', () => {
      console.log(chalk.green('Done :)'))
      resolve();
    });
  });
}

const setupSentry = async (): Promise<void> => {
  return new Promise((resolve) => {
    console.log(chalk.blue('Installing Sentry...'))

    // Install Codecov dependencies with pinned versions (-E, aka --save-exact)
    const child = spawn('npm', ['install', '-D', '-E', '@sentry/node', '@sentry/tracing'], {cwd: __dirname, shell: true});

    child.stderr.on('data', (data) => {
      // Uncomment the next line to pipe installation errors to the wizard screen
      // process.stdout.write(data);
    });

    child.on('exit', () => {
      console.log(chalk.green('Done :)'))
      resolve();
    });
  });
}

const setupSemanticRelease = async (withSentry: boolean): Promise<void> => {
  return new Promise(async (resolve) => {
    await assertDirectory('.github/workflows');

    console.log(chalk.blue('Installing Semantic Release...'))

    fs.copyFileSync('boilerplate/.releaserc.json', '.releaserc.json');

    if (withSentry) {
      fs.copyFileSync('boilerplate/release-sentry.yml', '.github/workflows/release.yml');
    } else {
      fs.copyFileSync('boilerplate/release-nosentry.yml', '.github/workflows/release.yml');
    }

    // Install Codecov dependencies with pinned versions (-E, aka --save-exact)
    const child = spawn('npm', ['install', '-D', '-E', 'semantic-release', 'semantic-release-conventional-commits', '@semantic-release/changelog', '@semantic-release/git'], {cwd: __dirname, shell: true});

    child.stderr.on('data', (data) => {
      // Uncomment the next line to pipe installation errors to the wizard screen
      // process.stdout.write(data);
    });

    child.on('exit', () => {
      console.log(chalk.green('Done :)'))
      resolve();
    });
  });
}

const setupGithubActions = async (): Promise<void> => {
  await assertDirectory('.github/workflows');
  fs.copyFileSync('boilerplate/checks.yml', '.github/workflows/checks.yml');
}

const ask = async (): Promise<{ projectname: string, secrets: string[] }> => {
  const secrets: string[] = [];

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'needsrenovate',
      message: 'Does this project need Renovate? (Automatic Dependency Updates)'
    },
    {
      type: 'confirm',
      name: 'needsdocker',
      message: 'Does this project need Docker? (Containerisation)'
    },
    {
      type: 'confirm',
      name: 'needsjasmine',
      message: 'Does this project need Jasmine? (Unit Testing)'
    },
    {
      type: 'confirm',
      name: 'needscodecov',
      message: 'Does this project need Codecov? (Test Coverage Calculation)'
    },
    {
      type: 'confirm',
      name: 'needssentry',
      message: 'Does this project need Sentry support? (Error Reporting)',
      default: 'N',
    },
    {
      type: 'input',
      name: 'projectname',
      message: 'What is the name of this project? This value will be used in the Dockerfile, package.json and the cronjob (if applicable):'
    },
    {
      type: 'number',
      name: 'nodeversion',
      message: 'Which major node version (e.g. 20, 22, 24) should this project use?',
      default: '20'
    }
  ]);

  const needsRenovate = ((answers as any).needsrenovate as boolean);
  const needsDocker = ((answers as any).needsdocker as boolean);
  const needsJasmine = ((answers as any).needsjasmine as boolean);
  const needsCodecov = ((answers as any).needscodecov as boolean);
  const needsSentry = ((answers as any).needssentry as boolean);
  const projectname = ((answers as any).projectname as string).toLowerCase();
  const nodeversion = ((answers as any).nodeversion as number);
  let projecttype: ProjectType = ProjectType.Server;

  await applyNodeVersion(nodeversion);

  if (!needsRenovate) {
    fs.unlinkSync('renovate.json');
  }

  await setupGithubActions();

  if (!needsDocker) {
    const noDockerAnswers = await inquirer.prompt([{
      type: 'confirm',
      name: 'needssemanticrelease',
      message: 'Does this project need Semantic Release? (Automatic Releases to NPM)'
    }]);

    const needsSemanticrelease = ((noDockerAnswers as any).needssemanticrelease as boolean);
    await setupPackageJson(projectname, needsJasmine, needsCodecov, needsSemanticrelease, nodeversion);
    if (needsSemanticrelease) {
      secrets.push('NPM_TOKEN');
      await setupSemanticRelease(needsSentry);
    }
  } else {
    const dockerAnswers = await inquirer.prompt([{
      type: 'list',
      name: 'projecttype',
      choices: ['Server', 'Cronjob'],
      message: 'How should this project\'s container run? As a persistent server (i.e. run the main file until it crashes or exits) or a cronjob (i.e. a task that needs to be repeated every X minutes):'
    }]);

    projecttype = (dockerAnswers as any).projecttype as ProjectType;

    await selectProjectType(projecttype);
    await applyProjectName(projectname, projecttype);
    await setupPackageJson(projectname, needsJasmine, needsCodecov, false, nodeversion);
  }

  if (needsJasmine) {
    await setupJasmine();
  }

  if (needsCodecov) {
    secrets.push('CODECOV_TOKEN');
    await setupCodecov();
  }

  if (needsSentry) {
    secrets.push('SENTRY_AUTH_TOKEN');
    secrets.push('SENTRY_ORG');
    secrets.push('SENTRY_PROJECT');
    await setupSentry();
  }

  return { projectname, secrets };
}

const init = (): void => {
  console.log(chalk.green('Fdebijl\'s TypeScript BoilerPlate Setup'))
  ask().then(({ projectname, secrets }) => {
    console.log(chalk.green('\nSetup finished, npm will now remove all setup-related packages. You may have to manually remove the \'postsetup\' script from package.json.'))

    if (secrets.length > 0) {
      console.log(chalk.green(`Add the following secrets to the repository and/or your .env:\n${secrets.join('\n')}`));

      fs.writeFileSync('example.env', secrets.map(secret => `${secret}=PLACEHOLDER`).join('\n'));
    }

    deleteFolderRecursive(Path.resolve('boilerplate'));
    fs.writeFileSync('README.md', `# ${projectname || 'New TS Project'}\n\n*Enter a short description for the project here.*`);
  });
}

init();
