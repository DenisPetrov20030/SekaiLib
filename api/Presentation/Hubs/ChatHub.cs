using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace SekaiLib.Presentation.Hubs
{
    public class ChatHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId() ?? Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId!));
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId() ?? Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId!));
            }
            await base.OnDisconnectedAsync(exception);
        }

        private string? GetUserId()
        {
            return Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        public static string UserGroup(string userId) => $"user:{userId}";
    }
}
