using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using SignalRChat.Hubs;

namespace SignalR_Hello
{
	public class FakeOrderService : IHostedService
	{
		public IHubContext<PushHub> HubContext { get; }
		private Timer timer;

		public FakeOrderService(IHubContext<PushHub> hubContext)
		{
			HubContext = hubContext;
		}

		public async Task StartAsync(CancellationToken cancellationToken)
		{
			timer = new Timer(delegate (object state)
			{
				try
				{
					HubContext.Clients.Groups("ShippingHub").SendAsync("NewPushMessage", WebUtility.HtmlEncode($"{DateTime.Now}: Your order just got delivered."));
				}
				catch { }
			}, null, TimeSpan.FromSeconds(0), TimeSpan.FromSeconds(30));
		}

		public async Task StopAsync(CancellationToken cancellationToken)
		{
			timer.Dispose();
		}
	}
}
