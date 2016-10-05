# ------------------------------------------------------------------------------
# Rules in workflow objects
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# Rule Instance#
#
# Represents information necessary when applying a rule. Contains the identifier
# of the rule and a dictionary of user provided parameters.
# ------------------------------------------------------------------------------
class RuleInstance(object):
    # --------------------------------------------------------------------------
    # Initialize the object
    #
    # identifier::string
    # parameters::{}
    # --------------------------------------------------------------------------
    def __init__(self, identifier, parameters):
        self.identifier = identifier
        self.parameters = parameters
