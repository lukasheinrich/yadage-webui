# ------------------------------------------------------------------------------
# HATEOAS relationship identifier
# ------------------------------------------------------------------------------

# Self reference
REF_SELF = 'self'

# ------------------------------------------------------------------------------
# Add list of references that contains as single item a self reference.
#
# json_obj: {...}
# url: string
#
# returns {Dictionary}
# ------------------------------------------------------------------------------
def add_self_reference(json_obj, url):
    json_obj['links'] = get_references({REF_SELF : url})
    return json_obj

# ------------------------------------------------------------------------------
# Generate a HATEOAS reference listing from a dictionary. Keys in the dictionary
# define relationships ('rel') and associated values are URL's ('href').
#
# links::{}
#
# returns [{rel:..., href:...}]
# ------------------------------------------------------------------------------
def get_references(dictionary):
    links = []
    for key in dictionary:
        links.append({'rel' : key, 'href' : dictionary[key]})
    return links
