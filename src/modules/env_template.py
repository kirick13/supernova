
import os
from string import Template

def use_env_vars (string):
    return Template(string).substitute(os.environ)
