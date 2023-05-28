
import os
from string import Template

def use_env_vars(string, env = None):
    return Template(string).safe_substitute(os.environ if env is None else env)
