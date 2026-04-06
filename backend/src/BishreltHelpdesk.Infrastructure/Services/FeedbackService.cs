using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Feedback;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class FeedbackService : IFeedbackService
{
    private readonly IFeedbackRepository _feedbackRepository;
    private readonly ITicketRepository _ticketRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public FeedbackService(
        IFeedbackRepository feedbackRepository,
        ITicketRepository ticketRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _feedbackRepository = feedbackRepository;
        _ticketRepository = ticketRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<FeedbackResponse> CreateAsync(CreateFeedbackRequest request)
    {
        var ticket = await _ticketRepository.GetByIdAsync(request.TicketId)
            ?? throw new NotFoundException("Тикет олдсонгүй");

        if (request.Rating < 1 || request.Rating > 5)
            throw new BadRequestException("Үнэлгээ 1-5 хооронд байх ёстой");

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            TicketId = request.TicketId,
            SubmittedById = _currentUser.UserId,
            GuestName = request.GuestName,
            Rating = request.Rating,
            Comment = request.Comment
        };

        await _feedbackRepository.AddAsync(feedback);
        await _unitOfWork.SaveChangesAsync();

        return new FeedbackResponse
        {
            Id = feedback.Id,
            TicketId = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            TicketTitle = ticket.Title,
            SubmittedByName = null,
            GuestName = request.GuestName,
            Rating = feedback.Rating,
            Comment = feedback.Comment,
            CreatedAt = feedback.CreatedAt
        };
    }

    public async Task<PagedResult<FeedbackResponse>> GetListAsync(FeedbackFilterRequest filter)
    {
        var query = _feedbackRepository.QueryWithIncludes();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLower();
            query = query.Where(f =>
                f.Ticket.TicketNumber.ToLower().Contains(s) ||
                f.Ticket.Title.ToLower().Contains(s) ||
                (f.SubmittedBy != null && f.SubmittedBy.FullName.ToLower().Contains(s)) ||
                (f.GuestName != null && f.GuestName.ToLower().Contains(s)));
        }

        if (filter.Rating.HasValue)
            query = query.Where(f => f.Rating == filter.Rating.Value);

        query = query.OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(f => new FeedbackResponse
            {
                Id = f.Id,
                TicketId = f.TicketId,
                TicketNumber = f.Ticket.TicketNumber,
                TicketTitle = f.Ticket.Title,
                SubmittedByName = f.SubmittedBy != null ? f.SubmittedBy.FullName : null,
                GuestName = f.GuestName,
                Rating = f.Rating,
                Comment = f.Comment,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<FeedbackResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<List<FeedbackResponse>> GetMyFeedbacksAsync(Guid userId)
    {
        return await _feedbackRepository.QueryWithIncludes()
            .Where(f => f.SubmittedById == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FeedbackResponse
            {
                Id = f.Id,
                TicketId = f.TicketId,
                TicketNumber = f.Ticket.TicketNumber,
                TicketTitle = f.Ticket.Title,
                SubmittedByName = f.SubmittedBy != null ? f.SubmittedBy.FullName : null,
                GuestName = f.GuestName,
                Rating = f.Rating,
                Comment = f.Comment,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();
    }
}
