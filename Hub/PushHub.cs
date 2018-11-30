using System;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SignalRChat.Hubs
{
	public class PushHub : Hub
	{
		public override async Task OnConnectedAsync()
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, "ShippingHub");
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception ex)
		{
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, "ShippingHub");
			await base.OnDisconnectedAsync(ex);
		}
	}
}