/**
 * Shared Toaster Notification Logic
 * Include this script in your HTML and call initToaster($scope, $timeout) in your controller.
 */

function initToaster($scope, $timeout) {
    if (!$scope || !$timeout) {
        console.error('initToaster requires $scope and $timeout services');
        return;
    }

    // Initialize toasters array if not exists
    $scope.toasters = $scope.toasters || [];

    $scope.showToaster = function (type, title, message) {
        // Handle single argument call (acts like alert)
        if (arguments.length === 1) {
            message = type;
            type = 'info';
            title = 'Notification';
        }

        // Handle two arguments (type, message) or (title, message)? 
        // Let's stick to standard (type, title, message) or (type, message) guessing
        if (!message && title) {
            message = title;
            // distinct based on if 'type' looks like a type
            if (['success', 'error', 'warning', 'info'].indexOf(type) === -1) {
                // first arg is not a type, treat as title
                title = type;
                type = 'info';
            } else {
                // first arg is type
                switch (type) {
                    case 'success': title = 'Success'; break;
                    case 'error': title = 'Error'; break;
                    case 'warning': title = 'Warning'; break;
                    case 'info': title = 'Info'; break;
                    default: title = 'Notification';
                }
            }
        }

        // Default fallbacks
        if (!message && !title) return; // nothing to show
        if (!title) title = 'Notification';
        if (!type) type = 'info';

        var newToaster = {
            type: type,
            title: title,
            message: message,
            hiding: false
        };

        $scope.toasters.push(newToaster);

        // Auto remove after 5 seconds
        $timeout(function () {
            $scope.removeToasterByObject(newToaster);
        }, 5000);
    };

    $scope.removeToaster = function (index) {
        var toaster = $scope.toasters[index];
        if (toaster) {
            $scope.removeToasterByObject(toaster);
        }
    };

    $scope.removeToasterByObject = function (toaster) {
        // checks if already hiding to prevent double-trigger
        if (toaster.hiding) return;

        // Trigger hiding animation (css class)
        toaster.hiding = true;

        // Wait for animation (500ms) then remove from DOM
        $timeout(function () {
            var index = $scope.toasters.indexOf(toaster);
            if (index > -1) {
                $scope.toasters.splice(index, 1);
            }
        }, 500);
    };
}
