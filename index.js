var gun = Gun();
var user = gun.user();

// Recall the user from session storage if available
user.recall({sessionStorage: true});

$('#up').on('click', function(e){
    user.create($('#alias').val(), $('#pass').val());
});

$('#sign').on('submit', function(e){
    e.preventDefault();
    user.auth($('#alias').val(), $('#pass').val());
});

$('#logout').on('click', function(e){
    user.leave();
    $('#sign').show();
    $('#logout').hide();
    $('#add-file-section').hide();
    $('#search-section').hide();
    $('#pub-key-section').hide();
    $('#file-list').empty();
    $('#search-file-list').empty();
    $('#pub-key').text('');
});

$('#add-file').on('submit', function(e) {
    e.preventDefault();
    var file = $('#file')[0].files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(event) {
        var fileData = event.target.result;
        var fileName = file.name;

        user.get('files').set({
            name: fileName,
            data: fileData,
            type: file.type
        });
    };
    reader.readAsDataURL(file);
});

function sanitizeId(id) {
    return id.replace(/[^\w-]/g, '');
}

function displayFile(file, id, isOwner = true) {
    if (!file || !file.data) {
        console.error('Invalid file:', file);
        return;
    }
    var sanitizedId = sanitizeId(id);
    var $li = $('#' + sanitizedId);
    if ($li.length === 0) {
        $li = $('<li>').attr('id', sanitizedId).addClass('file-item');
        var audio = $('<audio controls>').attr('src', file.data);
        $li.append($('<span>').text(file.name));
        $li.append(audio);
        if (isOwner) {
            var deleteButton = $('<button>').text('Delete').addClass('delete-button').on('click', function() {
                user.get('files').get(id).put(null); // Remove the file from GUN
            });
            $li.append(deleteButton);
            $('#file-list').append($li);
        } else {
            $('#search-file-list').append($li);
        }
    } else {
        $li.find('audio').attr('src', file.data);
    }
}

function removeFile(id) {
    var sanitizedId = sanitizeId(id);
    $('#' + sanitizedId).remove();
}

function loadExistingFiles() {
    user.get('files').map().on(function(file, id) {
        if (file) { // Filter out null values
            displayFile(file, id);
        } else {
            removeFile(id); // Remove the file from the UI
        }
    });
}

gun.on('auth', function(){
    $('#sign').hide();
    $('#logout').show();
    $('#add-file-section').show();
    $('#search-section').show();
    $('#pub-key-section').show();
    $('#file-list').empty(); // Clear the existing list to avoid duplicates
    $('#search-file-list').empty(); // Clear the search list
    loadExistingFiles(); // Load existing files and set up real-time updates

    // Display user's public key
    var pub = user._.sea.pub;
    $('#pub-key').text(pub);
});

// Function to search for a user by public key and display their files
$('#search').on('input', function(e){
    var pubKey = $(this).val();
    var targetUser = gun.user(pubKey);
    $('#search-file-list').empty(); // Clear the list before displaying new files
    targetUser.get('files').map().on(function(file, id) {
        if (file) { // Filter out null values
            displayFile(file, id, false);
        } else {
            removeFile(id); // Remove the file from the UI
        }
    });
});
