"use strict";

// setting up signalr connection
(function () {
	var connection = new signalR.HubConnectionBuilder()
								.withUrl("/pushHub")
								.withHubProtocol(new signalR.protocols.msgpack.MessagePackHubProtocol())
								.build();

	connection.on("NewPushMessage", function (message) {
		var li = document.createElement("li");
		li.textContent = message;
		document.getElementById("messagesList").appendChild(li);

		notify("New Push Message", message);
	});

	connection.start().catch(function (err) {
		return console.error(err.toString());
	});
})();

// enable browser notification
(function() {
	document.addEventListener('DOMContentLoaded', function () {
		if (!Notification) {
			// desktop notifications not available
			return;
		}

		if (Notification.permission !== "granted")
			Notification.requestPermission();
	});

	var notify = function (title, message) {
		if (Notification.permission !== "granted")
			Notification.requestPermission();
		else {
			var notification = new Notification(title, {
				icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXr8j3KGIIDHD9Orm8h5L4cmmCMHO43fvOy8BBZfO7IScu1-66',
				body: message,
			});

			notification.onclick = function () {
				// window.open("");
			};
		}
	}

	window.notify = notify;
})();