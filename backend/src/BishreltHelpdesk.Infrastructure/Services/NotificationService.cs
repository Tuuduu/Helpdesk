using BishreltHelpdesk.Application.DTOs.Notifications;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(AppDbContext context, ICurrentUserService currentUser, IUnitOfWork unitOfWork)
    {
        _context = context;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<NotificationResponse>> GetMyNotificationsAsync()
    {
        if (!_currentUser.UserId.HasValue) return [];

        return await _context.Notifications
            .Where(n => n.RecipientId == _currentUser.UserId.Value)
            .OrderBy(n => n.IsRead)
            .ThenByDescending(n => n.CreatedAt)
            .Take(30)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                RelatedTicketId = n.RelatedTicketId,
                TicketNumber = n.RelatedTicket != null ? n.RelatedTicket.TicketNumber : null,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync()
    {
        if (!_currentUser.UserId.HasValue) return 0;
        return await _context.Notifications
            .CountAsync(n => n.RecipientId == _currentUser.UserId.Value && !n.IsRead);
    }

    public async Task MarkAsReadAsync(Guid id)
    {
        if (!_currentUser.UserId.HasValue) return;
        var n = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientId == _currentUser.UserId.Value);
        if (n != null && !n.IsRead)
        {
            n.IsRead = true;
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync()
    {
        if (!_currentUser.UserId.HasValue) return;
        await _context.Notifications
            .Where(n => n.RecipientId == _currentUser.UserId.Value && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task CreateAsync(Guid recipientId, string title, string message, string type, Guid? relatedTicketId = null)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            RecipientId = recipientId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            RelatedTicketId = relatedTicketId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.Notifications.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();
    }
}
