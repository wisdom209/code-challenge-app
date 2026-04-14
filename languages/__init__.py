from .c import CLanguageHandler

_handlers = {
    'c': CLanguageHandler(),
}

def get_handler(language):
    return _handlers.get(language, _handlers['c'])
