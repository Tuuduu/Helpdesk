using BishreltHelpdesk.Application.DTOs.Notifications;

namespace BishreltHelpdesk.Application.Interfaces;

public interface INotificationService
{
    Task<List<NotificationResponse>> GetMyNotificationsAsync();
    Task<int> GetUnreadCountAsync();
    Task MarkAsReadAsync(Guid id);
    Task MarkAllAsReadAsync();
    Task CreateAsync(Guid recipientId, string title, string message, string type, Guid? relatedTicketId = null, Guid? relatedTransferId = null);
}
