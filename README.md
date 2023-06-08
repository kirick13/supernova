
# Supernova: build-test-deploy server

Supernova is powerful and free-to-use platform to run automated builds.

## Installation

Supernova is available as a Docker container. You can pull the latest version from Docker Hub:

```bash
docker pull kirickme/supernova
```

## How it works

Supernova builds a project from a repository. It can be a GitHub repository, GitLab repository or any other repository that supports webhooks. Workflow is the following:

- Supernova receives HTTPS request from GitHub/GitLab/Gitea/etc. or any other HTTPS request;
  - request must be `/webhook/$SUPERNOVA_PROJECT?secret=$SECRET`;
- Supernova checks its configuration file for a project with the name `$SUPERNOVA_PROJECT`;
- if project exists, Supernova clones repository, checkouts branch (or just pulls changes if repository already exists locally);
- Supernova runs steps:
  - build steps described in `supernova.config.yml` file in the root of the repository;
  - deploy steps described in **configuration file**;
  - if any of the steps fails, Supernova stops execution and returns an error;
- (optional) Supernova sends a Telegram/Discord message reporting result.

----------------------------------------------------

## Supernova concepts

### Repositories

Repositories store code that you want to build. They have to be described in the configuration file. You can build different branches of the same repository.

You can describe as many repositories as you want. Each repository should contain a `supernova.yml` file that describes how to build the project.

### Data directory

Mount data directory on `/opt/supernova` path to Docker container to cache your repositories. If you don't mount this directory, all repositories cache will be deleted after container restart.

### Configuration directory

Supernova will look inside `/etc/supernova` directory for:

- `config.yml` - main configuration file;
- `shared` - directory with **shared files** that will be mounted to **deploy steps**.

### Temporary directory

Supernova will create a Docker volume and mount it to `/tmp/supernova` on each **step**. This is the only directory that can be used to preserve changes between steps.

### Configuration file

Configuration file is a YAML file that describes repositories you want to build. For example, if you want to build `main` branch of `https://github.com/user/repo.git` repository, you can use the following configuration file:

```yaml
repos:
  my_build:
    url: https://github.com/user/repo.git
    branch: main
    secret: deadbeef
```

Now, when Supernova server receives HTTPS request `/webhook/my_build?secret=deadbeef`, it will run steps described in `supernova.config.yml` file in that repository.

### Step

Step is a set of commands that will be executed inside any Docker image you want. For example, if you want to build your project using Node.JS, you can use the following configuration file:

```yaml
steps:
  - image: node:latest
    commands:
      - npm install
      - npm run build
```

All of your commands will execute inside `/supernova` directory containing your repository files.

Remember that the only directory that will preserve changes between steps is **temporary directory**.

### Build steps

Build steps are described in `supernova.config.yml` file in the root of the repository. That steps are running in **protected mode**, which means following:

- there is no access to **shared files**;
- there is no access to **docker.sock** file, so it is impossible to run any Docker commands.

### Deploy steps

Deploy steps are described in **configuration file**. That steps have access to **shared files** and **docker.sock** file.
