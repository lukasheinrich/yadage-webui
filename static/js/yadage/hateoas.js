/**
 * Get the self reference link from a list of references.
 * 
 * @param {string} name
 * @param {list} links
 * @returns {unresolved}
 */
function getReference(name, links) {
    
    for (var i_obj = 0; i_obj < links.length; i_obj++) {
        var ref = links[i_obj];
        if (ref.rel === name) {
            return ref.href;
        }
    }
}

/**
 * Get the self reference link from a list of references.
 * 
 * @param {list} links
 * @returns {unresolved}
 */
function getSelfReference(links) {
    
    return getReference('self', links);
}

