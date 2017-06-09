/**
 * YADAGE UI - File Browser for Workflow Directory
 */

var directories = {};

function buildFileTree(files) {
    directories = {};
    traverseFileTree(files, '/');
}

function traverseFileTree(files, path) {
    var fileList = []
    for (var iFile = 0; iFile < files.length; iFile++) {
        var file = files[iFile];
        fileList.push(file);
        if (file.type === 'DIRECTORY') {
            var dirPath = '';
            if (path === '/') {
                dirPath = path + file.name;
            } else {
                dirPath = path + '/' + file.name;
            }
            traverseFileTree(file.files, dirPath)
        }
    }
    directories[path] = fileList;
};

/**
 * Convert JSON file descriptors into JSTree Json data.
 *
 * files::[{}]
 */
function getDirectoryPanel(files, path) {
    let html = '<a href="javascript:void(0)" class="list-group-item list-group-item-info">' + path + '</a>';
    let elements = {};
    if (path !== '/') {
        var dirPath = path.substring(0, path.lastIndexOf('/'));
        if (dirPath === '') {
            dirPath = '/';
        }
        html += '<a href="#/" class="list-group-item file-browser-folder" id="directory-item-root"><i class="fa fa-folder-open"></i> ..</a>';
        elements['directory-item-root'] = dirPath;
    }
    for (var iFile = 0; iFile < files.length; iFile++) {
        var file = files[iFile];
        if (file.type === 'DIRECTORY') {
            var dirPath = '';
            if (path === '/') {
                dirPath = path + file.name;
            } else {
                dirPath = path + '/' + file.name;
            }
            const elementId = 'irectory-item-' + iFile;
            html += '<a href="#/" class="list-group-item file-browser-folder" id="' + elementId + '"><i class="fa fa-folder"></i> ' + file.name + '</a>';
            elements[elementId] = dirPath;
        } else if (file.type === 'FILE') {
            var name = file.name + ' (' + filesize(file.size) + ')';
            html += '<a href="' + file.href + '" class="list-group-item"><i class="fa fa-file-o"></i> ' + name + '</a>';
        }
    }
    return {
        html : '<div class="list-group">' + html + '</div>',
        elements : elements
    };
};

function showDirectory(elementId, path) {
    const dirPanel = getDirectoryPanel(directories[path], path);
    $('#' + elementId).html(dirPanel.html);
    // Set click handler for directory entries
    for (let key in  dirPanel.elements) {
        (function(linkId, targetPath) {
            $('#' + linkId).click(function(event) {
                event.preventDefault();
                showDirectory(elementId, targetPath);
            });
        })(key, dirPanel.elements[key]);
    }
}

var FILE_BROWSER = (elementId, url) => {
    $.ajax({
        url: url,
        contentType: 'application/json',
        success: function(data) {
            buildFileTree(data.files);
            showDirectory(elementId, '/');
        },
        error: function() {
            console.log('Error retrieving file listing.');
        }
    });
};
