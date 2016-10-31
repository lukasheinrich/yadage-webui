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
    var html = '<a href="#" class="list-group-item  list-group-item-info">' + path + '</a>';
    if (path !== '/') {
        var dirPath = path.substring(0, path.lastIndexOf('/'));
        if (dirPath === '') {
            dirPath = '/';
        }
        html += '<a href="#" class="list-group-item file-browser-folder" onclick="showDirectory(\'' + dirPath + '\');"><i class="fa fa-folder-open"></i> ..</a>';
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
            html += '<a href="#" class="list-group-item file-browser-folder" onclick="showDirectory(\'' + dirPath + '\');"><i class="fa fa-folder"></i> ' + file.name + '</a>';
        } else if (file.type === 'FILE') {
            var name = file.name + ' (' + filesize(file.size) + ')';
            html += '<a href="' + file.href + '" class="list-group-item"><i class="fa fa-file-o"></i> ' + name + '</a>';
        }
    }
    return '<div class="list-group">' + html + '</div>';
};

function showDirectory(path) {
    var element = $('#file-tree-container');
    element.html(getDirectoryPanel(directories[path], path));
}
